from copy import deepcopy

from django.db import transaction

from tax.models import NationalTaxService, PublishStatus, TaxDocumentGroup
from tax.tax_document import (
    EXEMPT,
    INVOICE,
    TAXABLE,
    TAX_INVOICE,
    UNCLASSIFIED,
    ZERO_RATED,
    TaxDocumentValidationError,
    calculate_line_amounts,
    validate_document_amounts,
)


DOCUMENT_META = {
    TAXABLE: {
        "document_kind": TAX_INVOICE,
        "label": "전자세금계산서",
    },
    EXEMPT: {
        "document_kind": INVOICE,
        "label": "전자계산서",
    },
    ZERO_RATED: {
        "document_kind": TAX_INVOICE,
        "label": "전자세금계산서(영세율)",
    },
}


def _totals(supply_amount: int, tax_amount: int) -> dict:
    return {
        "supply_amount": supply_amount,
        "tax_amount": tax_amount,
        "total_amount": supply_amount + tax_amount,
    }


def _calculate_document_totals(*, tax_type: str, line_items: list[dict]) -> dict:
    supply_total = 0
    tax_total = 0
    for item in line_items:
        amounts = calculate_line_amounts(
            quantity=item.get("chargeable_unit"),
            unit_price=item.get("unit_price"),
            tax_type=tax_type,
        )
        supply_total += amounts.supply_amount
        tax_total += amounts.tax_amount
    return _totals(supply_total, tax_total)


def build_split_preview(
    *, document_tax_type, transaction_amount, tax_amount, line_items
) -> dict:
    """Validate a complete draft and preview its tax-document partition."""
    if not line_items:
        raise TaxDocumentValidationError("분리할 품목이 없습니다.")

    validate_document_amounts(
        document_tax_type=document_tax_type,
        transaction_amount=transaction_amount,
        tax_amount=tax_amount,
        line_items=line_items,
    )

    partitions = {}
    for item in line_items:
        item_tax_type = item.get("tax_type")
        if item_tax_type == UNCLASSIFIED or item_tax_type not in DOCUMENT_META:
            raise TaxDocumentValidationError(
                "모든 품목의 과세/면세 구분을 확정해야 문서를 나눌 수 있습니다."
            )
        partitions.setdefault(item_tax_type, []).append(deepcopy(item))

    tax_types = set(partitions)
    if ZERO_RATED in tax_types and len(tax_types) > 1:
        raise TaxDocumentValidationError(
            "영세율은 제품 속성이 아니라 거래 속성이므로 과세·면세 품목과 자동 분리할 수 없습니다."
        )

    documents = []
    for item_tax_type in (TAXABLE, EXEMPT, ZERO_RATED):
        partition_items = partitions.get(item_tax_type)
        if not partition_items:
            continue
        totals = _calculate_document_totals(
            tax_type=item_tax_type,
            line_items=partition_items,
        )
        documents.append(
            {
                "tax_type": item_tax_type,
                **DOCUMENT_META[item_tax_type],
                "item_count": len(partition_items),
                "line_items": partition_items,
                "totals": totals,
            }
        )

    source_totals = _totals(int(transaction_amount), int(tax_amount))
    split_supply = sum(document["totals"]["supply_amount"] for document in documents)
    split_tax = sum(document["totals"]["tax_amount"] for document in documents)
    split_totals = _totals(split_supply, split_tax)

    return {
        "requires_split": tax_types == {TAXABLE, EXEMPT},
        "source_totals": source_totals,
        "split_totals": split_totals,
        "is_balanced": source_totals == split_totals,
        "documents": documents,
    }


def _group_result(group: TaxDocumentGroup, *, created: bool) -> dict:
    documents = list(group.documents.order_by("id"))
    source_totals = _totals(
        group.source_transaction_amount,
        group.source_tax_amount,
    )
    split_supply = sum(document.transaction_amount or 0 for document in documents)
    split_tax = sum(document.tax_amount or 0 for document in documents)
    split_totals = _totals(split_supply, split_tax)
    return {
        "created": created,
        "group_key": str(group.group_key),
        "source_totals": source_totals,
        "split_totals": split_totals,
        "is_balanced": source_totals == split_totals,
        "documents": [
            {
                "id": document.id,
                "tax_type": document.tax_type,
                "document_kind": document.document_kind,
                "label": DOCUMENT_META[document.tax_type]["label"],
                "item_count": len(document.line_items or []),
                "line_items": deepcopy(document.line_items or []),
                "totals": _totals(
                    document.transaction_amount or 0,
                    document.tax_amount or 0,
                ),
                "publish_status": document.publish_status,
            }
            for document in documents
        ],
    }


def get_split_group_result(*, group_id: int) -> dict:
    group = TaxDocumentGroup.objects.get(id=group_id)
    return _group_result(group, created=False)


@transaction.atomic
def split_tax_document(*, tax_service_id: int, actor) -> dict:
    """Split one temporary taxable/exempt mixed draft exactly once."""
    source = (
        NationalTaxService.objects.select_for_update()
        .select_related("document_group")
        .get(id=tax_service_id)
    )
    if source.document_group_id:
        return _group_result(source.document_group, created=False)
    if source.publish_status != PublishStatus.temporary:
        raise TaxDocumentValidationError("임시 저장 문서만 분리할 수 있습니다.")

    preview = build_split_preview(
        document_tax_type=source.tax_type,
        transaction_amount=source.transaction_amount,
        tax_amount=source.tax_amount,
        line_items=source.line_items,
    )
    if not preview["requires_split"]:
        raise TaxDocumentValidationError(
            "과세 품목과 면세 품목이 함께 있는 임시 문서만 분리할 수 있습니다."
        )
    if not preview["is_balanced"]:
        raise TaxDocumentValidationError("분리 전후 금액 합계가 일치하지 않습니다.")

    group = TaxDocumentGroup.objects.create(
        factory=source.factory,
        created_by=actor,
        source_line_items=deepcopy(source.line_items),
        source_transaction_amount=source.transaction_amount,
        source_tax_amount=source.tax_amount,
    )
    partitions = {document["tax_type"]: document for document in preview["documents"]}
    taxable = partitions[TAXABLE]
    exempt = partitions[EXEMPT]

    source.document_group = group
    source.tax_type = TAXABLE
    source.document_kind = TAX_INVOICE
    source.zero_rated_reason = None
    source.line_items = taxable["line_items"]
    source.transaction_amount = taxable["totals"]["supply_amount"]
    source.tax_amount = taxable["totals"]["tax_amount"]
    source.save(
        update_fields=[
            "document_group",
            "tax_type",
            "document_kind",
            "zero_rated_reason",
            "line_items",
            "transaction_amount",
            "tax_amount",
            "updated_at",
        ]
    )

    NationalTaxService.objects.create(
        user=source.user,
        factory=source.factory,
        factory_info=deepcopy(source.factory_info),
        publish_status=PublishStatus.temporary,
        tax_invoice_type=source.tax_invoice_type,
        document_kind=INVOICE,
        tax_type=EXEMPT,
        zero_rated_reason=None,
        transaction_type=source.transaction_type,
        transaction_date=source.transaction_date,
        client=source.client,
        client_info=deepcopy(source.client_info),
        transaction_amount=exempt["totals"]["supply_amount"],
        tax_amount=exempt["totals"]["tax_amount"],
        is_hidden=source.is_hidden,
        barobill_state="임시저장",
        line_items=exempt["line_items"],
        document_group=group,
    )

    return _group_result(group, created=True)


def _copy_document_for_group(*, source, line_items: list[dict]):
    totals = _calculate_document_totals(
        tax_type=source.tax_type,
        line_items=line_items,
    )
    return NationalTaxService.objects.create(
        user=source.user,
        factory=source.factory,
        factory_info=deepcopy(source.factory_info),
        publish_status=PublishStatus.temporary,
        tax_invoice_type=source.tax_invoice_type,
        document_kind=source.document_kind,
        tax_type=source.tax_type,
        zero_rated_reason=source.zero_rated_reason,
        transaction_type=source.transaction_type,
        transaction_date=source.transaction_date,
        client=source.client,
        client_info=deepcopy(source.client_info),
        transaction_amount=totals["supply_amount"],
        tax_amount=totals["tax_amount"],
        is_hidden=source.is_hidden,
        barobill_state="임시저장",
        line_items=deepcopy(line_items),
        document_group=source.document_group,
    )


@transaction.atomic
def split_group_document(
    *,
    tax_service_id: int,
    selected_line_item_indexes: list[int],
    expected_line_item_count: int,
):
    """Move selected lines from one temporary group document into a new peer."""
    source = (
        NationalTaxService.objects.select_for_update()
        .select_related("document_group")
        .get(id=tax_service_id)
    )
    if not source.document_group_id:
        raise TaxDocumentValidationError("자동 분리된 문서만 추가로 나눌 수 있습니다.")

    group_documents = list(
        NationalTaxService.objects.select_for_update().filter(
            document_group_id=source.document_group_id
        )
    )
    if any(
        document.publish_status != PublishStatus.temporary
        for document in group_documents
    ):
        raise TaxDocumentValidationError(
            "그룹의 모든 문서가 임시 저장 상태일 때만 추가로 나눌 수 있습니다."
        )
    if source.tax_type not in {TAXABLE, EXEMPT}:
        raise TaxDocumentValidationError("과세 또는 면세 문서만 추가로 나눌 수 있습니다.")

    line_items = deepcopy(source.line_items or [])
    if len(line_items) != expected_line_item_count:
        raise TaxDocumentValidationError(
            "문서의 품목 구성이 변경되었습니다. 새로고침 후 다시 시도해 주세요."
        )
    indexes = sorted(set(selected_line_item_indexes))
    if not indexes:
        raise TaxDocumentValidationError("새 문서로 옮길 품목을 선택해 주세요.")
    if indexes[0] < 0 or indexes[-1] >= len(line_items):
        raise TaxDocumentValidationError("선택한 품목 위치가 올바르지 않습니다.")
    if len(indexes) >= len(line_items):
        raise TaxDocumentValidationError(
            "원본 문서에 최소 한 품목은 남겨야 합니다."
        )

    selected_index_set = set(indexes)
    moved_items = [
        item for index, item in enumerate(line_items) if index in selected_index_set
    ]
    remaining_items = [
        item for index, item in enumerate(line_items) if index not in selected_index_set
    ]
    remaining_totals = _calculate_document_totals(
        tax_type=source.tax_type,
        line_items=remaining_items,
    )

    source.line_items = remaining_items
    source.transaction_amount = remaining_totals["supply_amount"]
    source.tax_amount = remaining_totals["tax_amount"]
    source.save(
        update_fields=[
            "line_items",
            "transaction_amount",
            "tax_amount",
            "updated_at",
        ]
    )
    _copy_document_for_group(source=source, line_items=moved_items)

    result = _group_result(source.document_group, created=True)
    if not result["is_balanced"]:
        raise TaxDocumentValidationError("추가 분리 전후 금액 합계가 일치하지 않습니다.")
    return result


@transaction.atomic
def reset_group_to_auto_split(*, tax_service_id: int) -> dict:
    """Restore a temporary group to the original taxable/exempt partition."""
    source = (
        NationalTaxService.objects.select_for_update()
        .select_related("document_group")
        .get(id=tax_service_id)
    )
    if not source.document_group_id:
        raise TaxDocumentValidationError("자동 분리된 문서 그룹이 아닙니다.")

    group = TaxDocumentGroup.objects.select_for_update().get(
        id=source.document_group_id
    )
    documents = list(
        NationalTaxService.objects.select_for_update()
        .filter(document_group=group)
        .order_by("id")
    )
    if any(
        document.publish_status != PublishStatus.temporary for document in documents
    ):
        raise TaxDocumentValidationError(
            "그룹의 모든 문서가 임시 저장 상태일 때만 자동 분리 상태로 되돌릴 수 있습니다."
        )

    preview = build_split_preview(
        document_tax_type=UNCLASSIFIED,
        transaction_amount=group.source_transaction_amount,
        tax_amount=group.source_tax_amount,
        line_items=group.source_line_items,
    )
    if not preview["requires_split"] or not preview["is_balanced"]:
        raise TaxDocumentValidationError("원거래 품목으로 자동 분리 상태를 복원할 수 없습니다.")

    partitions = {document["tax_type"]: document for document in preview["documents"]}
    keepers = {
        tax_type: next(
            (document for document in documents if document.tax_type == tax_type),
            None,
        )
        for tax_type in (TAXABLE, EXEMPT)
    }
    if not all(keepers.values()):
        raise TaxDocumentValidationError("복원할 과세·면세 기준 문서를 찾을 수 없습니다.")

    for tax_type, keeper in keepers.items():
        partition = partitions[tax_type]
        keeper.tax_type = tax_type
        keeper.document_kind = DOCUMENT_META[tax_type]["document_kind"]
        keeper.zero_rated_reason = None
        keeper.line_items = deepcopy(partition["line_items"])
        keeper.transaction_amount = partition["totals"]["supply_amount"]
        keeper.tax_amount = partition["totals"]["tax_amount"]
        keeper.save(
            update_fields=[
                "tax_type",
                "document_kind",
                "zero_rated_reason",
                "line_items",
                "transaction_amount",
                "tax_amount",
                "updated_at",
            ]
        )

    keeper_ids = {keeper.id for keeper in keepers.values()}
    NationalTaxService.objects.filter(document_group=group).exclude(
        id__in=keeper_ids
    ).delete()

    result = _group_result(group, created=False)
    if not result["is_balanced"]:
        raise TaxDocumentValidationError("자동 분리 복원 후 금액 합계가 일치하지 않습니다.")
    return result
