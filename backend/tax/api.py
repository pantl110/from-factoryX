from datetime import date, datetime, timedelta
from typing import List

from django.db.models import Count, Q
from ninja import Query, Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from tax.models import NationalTaxService, TaxDocumentGroup, generate_mgt_key
from factory.utils import get_factory_by_id, is_factory_member, get_factory_client_by_id
from django.db import transaction
from tax.utils import get_tax_service_by_id
from tax.barobill_utils import (
    issue_barobill_tax_invoice,
    get_state_barobill_tax_invoice,
    cancel_barobill_tax_invoice,
)
from tax.tax_document import (
    MIXED,
    UNCLASSIFIED,
    TaxDocumentValidationError,
    get_barobill_tax_document_fields,
    normalize_line_item_amounts,
    validate_document_amounts,
    validate_line_item_tax_types,
    validate_zero_rated_reason,
)
from tax.publish_service import (
    apply_remote_publish_state,
    claim_document_for_publish,
    complete_document_publish,
    fail_document_publish,
    is_publish_claim_stale,
)
from tax.split_service import (
    build_split_preview,
    get_split_group_result,
    reset_group_to_auto_split,
    split_group_document,
    split_tax_document,
)
from tax.schemas.inbound import (
    NationalTaxServiceCreateIn,
    NationalTaxServiceUpdateIn,
    ManualTaxDocumentSplitIn,
    TaxInvoiceFilter,
    TaxToMaterialHistoryIn,
)
from tax.schemas.outbound import (
    NationalTaxServiceOut,
    TaxInvoiceByMaterialOut,
)
from tax.schemas.inbound import LinkTaxInvoiceIn
from project.models import Project
from django.conf import settings
from barobill.barobill_error_code import (
    barobill_error_codes,
)
from barobill.barobill_state import (
    barobill_tax_service_states,
    nts_tax_service_states,
    barobill_purpose_types,
)
from factory.schemas.outbound import FactoryRowOut, FactoryClientRowOut
from websocket.utils import send_notification_to_factory
from stock.models import MaterialHistory, Product


router = Router(tags=["Tax"], auth=jwt_auth)


BAROBILL_TAX_TYPE_MAP = {1: "taxable", 2: "zero_rated", 3: "exempt"}
BAROBILL_DOCUMENT_KIND_MAP = {
    1: "tax_invoice",
    2: "invoice",
    4: "tax_invoice",
    5: "invoice",
}


def get_synced_tax_document_classification(invoice_detail):
    try:
        return (
            BAROBILL_TAX_TYPE_MAP[int(invoice_detail.TaxType)],
            BAROBILL_DOCUMENT_KIND_MAP[int(invoice_detail.TaxInvoiceType)],
        )
    except (KeyError, TypeError, ValueError):
        raise HttpError(422, "바로빌 문서의 과세 유형 또는 문서 형태가 올바르지 않습니다.")


def get_remote_mgt_key(invoice_detail, party_name):
    party = getattr(invoice_detail, party_name, None)
    value = getattr(party, "MgtNum", None) if party is not None else None
    return value.strip() if isinstance(value, str) and value.strip() else None


def merge_tax_invoice_pages(primary, extra):
    extra_list = getattr(extra, "SimpleTaxInvoiceExList", None)
    if extra_list is None:
        return primary
    primary_list = getattr(primary, "SimpleTaxInvoiceExList", None)
    if primary_list is None:
        primary.SimpleTaxInvoiceExList = extra_list
    else:
        primary_list.SimpleTaxInvoiceEx.extend(extra_list.SimpleTaxInvoiceEx)
    return primary


def validate_tax_document_draft(
    tax_type, document_kind, transaction_amount, tax_amount, line_items=None
):
    """Validate an explicitly classified draft without breaking legacy drafts."""
    try:
        validate_document_amounts(
            document_tax_type=tax_type,
            transaction_amount=transaction_amount,
            tax_amount=tax_amount,
            line_items=line_items,
            allow_incomplete=True,
        )
        if tax_type in {UNCLASSIFIED, MIXED}:
            return
        get_barobill_tax_document_fields(
            tax_type=tax_type,
            document_kind=document_kind,
            tax_amount=tax_amount,
        )
        validate_line_item_tax_types(
            document_tax_type=tax_type,
            line_items=line_items,
            allow_incomplete=True,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))


def validate_tax_document_for_issue(tax_service):
    try:
        validate_document_amounts(
            document_tax_type=tax_service.tax_type,
            transaction_amount=tax_service.transaction_amount,
            tax_amount=tax_service.tax_amount,
            line_items=tax_service.line_items,
        )
        get_barobill_tax_document_fields(
            tax_type=tax_service.tax_type,
            document_kind=tax_service.document_kind,
            tax_amount=tax_service.tax_amount,
        )
        validate_line_item_tax_types(
            document_tax_type=tax_service.tax_type,
            line_items=tax_service.line_items,
        )
        validate_zero_rated_reason(
            tax_type=tax_service.tax_type,
            reason=tax_service.zero_rated_reason,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))


async def validate_product_master_tax_types_for_issue(tax_service):
    """Require each line to match a reviewed product or material master."""
    def normalize_reference_id(value):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            raise HttpError(422, "품목의 마스터 연결 정보가 올바르지 않습니다.") from None

    normalized_items = []
    for item in tax_service.line_items or []:
        normalized_items.append(
            {
                **item,
                "product_id": normalize_reference_id(item.get("product_id")),
                "material_history": normalize_reference_id(
                    item.get("material_history")
                ),
            }
        )

    product_ids = {
        item["product_id"]
        for item in normalized_items
        if item["product_id"] is not None
    }
    material_history_ids = {
        item["material_history"]
        for item in normalized_items
        if item["material_history"] is not None
    }

    products = await sync_to_async(list)(
        Product.objects.filter(
            id__in=product_ids,
            factory_id=tax_service.factory_id,
        ).values("id", "tax_type", "tax_type_review_required")
    )
    products_by_id = {product["id"]: product for product in products}
    material_histories = await sync_to_async(list)(
        MaterialHistory.objects.filter(
            id__in=material_history_ids,
            material__factory_id=tax_service.factory_id,
        ).values(
            "id",
            "material__tax_type",
            "material__tax_type_review_required",
        )
    )
    materials_by_history_id = {
        history["id"]: history for history in material_histories
    }

    missing_product_ids = product_ids - products_by_id.keys()
    if missing_product_ids:
        raise HttpError(422, "문서에 존재하지 않거나 다른 공장의 제품이 포함되어 있습니다.")
    missing_material_history_ids = (
        material_history_ids - materials_by_history_id.keys()
    )
    if missing_material_history_ids:
        raise HttpError(
            422,
            "문서에 존재하지 않거나 다른 공장의 원자재 이력이 포함되어 있습니다.",
        )

    products_requiring_review = [
        product
        for product in products
        if product["tax_type_review_required"]
    ]
    if products_requiring_review:
        raise HttpError(
            422,
            "과세 구분 확인이 필요한 제품이 있습니다. 제품 마스터에서 과세/면세를 확인해 주세요.",
        )

    for index, item in enumerate(normalized_items, start=1):
        product_id = item.get("product_id")
        material_history_id = item.get("material_history")
        if product_id is None and material_history_id is None:
            raise HttpError(
                422,
                f"품목 {index}번은 제품 또는 원자재 마스터와 연결되어야 발행할 수 있습니다.",
            )
        line_tax_type = item.get("tax_type")
        if line_tax_type is None:
            raise HttpError(422, f"품목 {index}번의 과세 구분을 확인해야 합니다.")
        normalized_line_tax_type = (
            "taxable" if line_tax_type == "zero_rated" else line_tax_type
        )
        if product_id is not None:
            master_tax_type = products_by_id[product_id]["tax_type"]
        else:
            material = materials_by_history_id[material_history_id]
            if material["material__tax_type_review_required"]:
                raise HttpError(
                    422,
                    "과세 구분 확인이 필요한 원자재가 있습니다. 원자재 마스터에서 과세/면세를 확인해 주세요.",
                )
            master_tax_type = material["material__tax_type"]
        if normalized_line_tax_type != master_tax_type:
            raise HttpError(
                422,
                "마스터의 과세 구분과 문서 품목의 과세 구분이 일치하지 않습니다.",
            )


def normalize_tax_document_payload(data, *, fallback_line_items=None):
    """Normalize submitted line and document totals using the server policy."""
    line_items = data.get("line_items", fallback_line_items)
    if line_items is None:
        return
    try:
        normalized, supply_total, tax_total = normalize_line_item_amounts(
            line_items=line_items,
            allow_incomplete=True,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))
    data["line_items"] = normalized
    if supply_total is not None and tax_total is not None:
        data["transaction_amount"] = supply_total
        data["tax_amount"] = tax_total


def validate_required_fields_for_issue(tax_service):
    required_fields = {
        "client": "거래처",
        "transaction_date": "거래일자",
        "transaction_amount": "공급가액",
        "tax_amount": "세액",
        "line_items": "품목 리스트",
    }
    missing_fields = []
    for field, field_name in required_fields.items():
        if getattr(tax_service, field) is None or (
            field == "line_items" and not tax_service.line_items
        ):
            missing_fields.append(field_name)
    if missing_fields:
        raise HttpError(
            400,
            f"세금계산서 발행을 위해 다음 필드들이 필요합니다: {', '.join(missing_fields)}",
        )

    for index, item in enumerate(tax_service.line_items or []):
        item_required_fields = {
            "name": "품목명",
            "chargeable_unit": "수량",
            "unit_price": "단가",
            "amount": "공급가액",
            "tax": "세액",
        }
        item_missing_fields = [
            field_name
            for field, field_name in item_required_fields.items()
            if item.get(field) is None or item.get(field) == ""
        ]
        if item_missing_fields:
            raise HttpError(
                400,
                f"품목 {index + 1}번에 다음 필드들이 필요합니다: {', '.join(item_missing_fields)}",
            )


async def reconcile_stale_publish_claim(document, *, raise_on_error=False):
    """Resolve an abandoned local claim using BaroBill's state for its MgtKey."""
    if not is_publish_claim_stale(document):
        return document
    try:
        state_result = await sync_to_async(get_state_barobill_tax_invoice)(
            document.factory.business_registration_number,
            document.mgt_key,
            allow_missing=True,
        )
    except Exception:
        if raise_on_error:
            raise
        return document
    return await sync_to_async(apply_remote_publish_state)(document.id, state_result)


# 세금계산서 API 구조
# POST /api/tax/ - tax_id가 없으면 생성, 있으면 수정 (통합 API)
# PATCH /api/tax/{tax_id} - 일반적인 수정 (임시저장 상태에서만 모든 필드 수정 가능)
# PATCH /api/tax/{tax_id} - 발행된 세금계산서는 is_hidden만 수정 가능


@router.get(
    "/published",
    summary="[C] 발행된 모든 세금계산서 조회",
    description="조건에 따라 세금계산서를 조회합니다.",
    response=List[NationalTaxServiceOut],
)
@paginate
async def list_published_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: TaxInvoiceFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="작성일자 정렬: -transaction_date(최신순), transaction_date(오래된순)",
    ),
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    # TODO: 권한 체크

    @sync_to_async
    def get_all_tax_invoices():
        queryset = NationalTaxService.objects.filter(
            factory_id=factory_id, publish_status="published"
        ).select_related("document_group").prefetch_related(
            "client", "tax_invoice_account"
        )
        if filters.q:
            non_search_filters = TaxInvoiceFilter(
                **{**filters.dict(), "q": None}
            )
            queryset = non_search_filters.filter(queryset)
            escaped_search_term = filters.q.encode("unicode_escape").decode("ascii")
            queryset = queryset.filter(
                Q(client__name__icontains=filters.q)
                | Q(line_items__icontains=filters.q)
                | Q(line_items__icontains=escaped_search_term)
            )
        else:
            queryset = filters.filter(queryset)
        if ordering:
            queryset = queryset.order_by(ordering)

        invoices = list(queryset)
        group_ids = {
            invoice.document_group_id
            for invoice in invoices
            if invoice.document_group_id
        }
        group_counts = dict(
            NationalTaxService.objects.filter(document_group_id__in=group_ids)
            .values("document_group_id")
            .annotate(document_count=Count("id"))
            .values_list("document_group_id", "document_count")
        )
        # prefetch된 관계를 동기적으로 접근하여 객체에 직접 저장
        for invoice in invoices:
            setattr(
                invoice,
                "_cached_document_group_key",
                str(invoice.document_group.group_key)
                if invoice.document_group_id
                else None,
            )
            setattr(
                invoice,
                "_cached_document_group_count",
                group_counts.get(invoice.document_group_id, 1),
            )
            if hasattr(invoice, 'tax_invoice_account'):
                try:
                    account = invoice.tax_invoice_account
                    # 비동기 컨텍스트에서 접근할 수 있도록 객체에 직접 저장
                    setattr(invoice, '_cached_account', account)
                except Exception:
                    setattr(invoice, '_cached_account', None)
        
        return invoices

    invoices = await get_all_tax_invoices()

    return invoices


# Tax Tab
@router.get(
    "/pending",
    summary="[C] 발행대기/임시저장 세금계산서 조회",
    description="발행대기 또는 임시저장 상태의 세금계산서를 조회합니다.",
    response=List[NationalTaxServiceOut],
)
@paginate
async def list_pending_tax_invoices(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: TaxInvoiceFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="작성일자 정렬: -transaction_date(최신순), transaction_date(오래된순)",
    ),
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    @sync_to_async
    def get_pending_tax_invoices():
        from django.db.models import Q
        
        queryset = (
            NationalTaxService.objects.filter(
                Q(client__factory_id=factory_id) | Q(client__isnull=True),
                factory_id=factory_id
            )
            .exclude(publish_status="published")
            .prefetch_related("client")
        )
        queryset = filters.filter(queryset)
        if ordering:
            queryset = queryset.order_by(ordering)

        return list(queryset)

    invoices = await get_pending_tax_invoices()
    return invoices


# Tax Tab
@router.get(
    "/unlinked",
    summary="[C] 연동되지 않은 세금계산서 조회",
    description="연동되지 않은 세금계산서를 모두 조회합니다.",
    response=List[NationalTaxServiceOut],
)
@paginate
async def list_not_link_tax(
    request,
    factory_id: int = Query(..., description="공장 ID"),
    filters: TaxInvoiceFilter = Query(..., description="검색 필터"),
    ordering: str = Query(
        default="-transaction_date",
        description="작성일자 정렬: -transaction_date(최신순), transaction_date(오래된순)",
    ),
):
    @sync_to_async
    def get_unlinked_tax_invoices():
        queryset = NationalTaxService.objects.filter(
            projects__isnull=True, client__factory_id=factory_id
        ).prefetch_related("client")
        queryset = filters.filter(queryset)
        if ordering:
            queryset = queryset.order_by(ordering)
        return list(queryset)

    invoices = await get_unlinked_tax_invoices()
    return invoices


# Project Tab
@router.post(
    "/link",
    summary="[C] 선택된 세금계산서 연결",
    description="선택된 세금계산서를 프로젝트에 연결합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def link_tax(request, payload: LinkTaxInvoiceIn):
    """
    선택된 세금계산서를 프로젝트에 연결합니다.

    입력 필드:
    - project_id: 프로젝트 ID (int)
    - tax_id: 세금계산서 ID (int)

    반환 필드: 없음 (성공 시 빈 응답)
    """
    try:

        @sync_to_async
        def link_tax_invoice():

            # 프로젝트 존재 확인
            try:
                project = Project.objects.get(id=payload.project_id)
            except Project.DoesNotExist:
                raise HttpError(404, "해당 프로젝트를 찾을 수 없습니다.")

            # 세금계산서 존재 확인
            try:
                tax_invoice = NationalTaxService.objects.get(id=payload.tax_id)
            except NationalTaxService.DoesNotExist:
                raise HttpError(
                    404, f"세금계산서 ID {payload.tax_id}를 찾을 수 없습니다."
                )

            # 이미 다른 프로젝트에 연결되어 있는지 확인
            if tax_invoice.projects.exists():
                raise HttpError(
                    400,
                    f"세금계산서 ID {payload.tax_id}는 이미 다른 프로젝트에 연결되어 있습니다.",
                )

            # 프로젝트의 기존 세금계산서가 있다면 제거
            if project.tax_invoice:
                project.tax_invoice = None
                project.save()

            # 새로운 세금계산서 연결
            project.tax_invoice = tax_invoice
            project.save()

            return {}

        result = await link_tax_invoice()
        return result

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "세금계산서 연결 중 내부 서버 오류가 발생했습니다.")


# Material Tab
@router.get(
    "/invoice-by-material-history",
    summary="[C] 자재 이력별 세금계산서 및 구매정보 조회",
    description="material_history_id로 세금계산서(구매) 및 자재정보를 조회",
    response={200: TaxInvoiceByMaterialOut, 404: dict, 500: dict},
)
async def get_tax_invoice_by_material_history(request, material_history_id: int):
    """
    입력 필드(쿼리 파라미터):
    - material_history_id: 원자재 이력 ID (필수)

    반환 필드(dict):
    - client_name: 업체명 (str)
    - business_registration_number: 사업자등록번호 (str)
    - representative_name: 대표자명 (str/null)
    - business_type: 업태 (str/null)
    - business_category: 종목 (str/null)
    - address: 사업장 주소 (str/null)
    - transaction_date: 작성일자 (date)
    - tax_invoice_type: 문서상태(매입/매출) (str)
    - transaction_type: 구분 (str)
    - materials: 구매 자재 정보 리스트(List[dict], 1건)
      - material_name: 자재명 (str)
      - spec: 규격 (str)
      - quantity: 수량 (int)
      - unit: 단위 (str)
      - price: 단가 (int)
      - transaction_amount: 공급가액 (int)
      - tax_amount: 세액 (int)
    """
    from stock.models import MaterialHistory

    try:

        def get_invoice_data(material_history_id):
            try:
                # MaterialHistory 조회
                h = MaterialHistory.objects.select_related(
                    "material", "client"
                ).get(id=material_history_id)
            except MaterialHistory.DoesNotExist:
                return None

            # NationalTaxService에서 line_items에 해당 material_history_id가 있는 세금계산서 찾기
            # 매입 세금계산서만 검색 (tax_invoice_type="purchase")
            # MaterialHistory의 factory와 일치하는 세금계산서만 검색
            tax_services = NationalTaxService.objects.filter(
                tax_invoice_type="purchase",
                factory=h.material.factory,
            ).select_related("client")

            invoice = None
            matched_line_item = None

            for tax_service in tax_services:
                line_items = tax_service.line_items or []
                for item in line_items:
                    # material_history 필드가 material_history_id와 일치하는지 확인
                    item_material_history_id = item.get("material_history")
                    if item_material_history_id is not None:
                        # 타입 변환 (int 또는 str일 수 있음)
                        if int(item_material_history_id) == material_history_id:
                            invoice = tax_service
                            matched_line_item = item
                            break
                if invoice:
                    break

            if not invoice:
                return None

            client = invoice.client
            if not client:
                return None

            return dict(
                client_name=client.name,
                business_registration_number=client.business_registration_number,
                representative_name=client.representative_name,
                business_type=client.business_type,
                business_category=client.business_category,
                address=client.address,
                transaction_date=invoice.transaction_date,
                tax_invoice_type=(
                    "매입" if invoice.tax_invoice_type == "purchase" else "매출"
                ),
                transaction_type=(
                    "영수" if invoice.transaction_type == "receipt" else "청구"
                ),
                materials=[
                    dict(
                        material_name=h.material.name,
                        spec=h.material.spec,
                        quantity=int(h.quantity),  # Decimal을 int로 변환
                        unit=h.material.unit,
                        price=h.price or 0,
                        transaction_amount=invoice.transaction_amount,
                        tax_amount=invoice.tax_amount,
                    )
                ],
            )

        raw_data = await sync_to_async(get_invoice_data)(material_history_id)
        if not raw_data:
            raise HttpError(404, "해당 이력에 연결된 세금계산서가 없습니다.")
        return TaxInvoiceByMaterialOut(**raw_data)
    except Exception as e:
        raise HttpError(500, f"자재 이력별 세금계산서 조회 중 오류: {e}")


@router.post(
    "/{factory_id}/sync",
    summary="[C] 세금계산서 동기화",
    description="국세청 API에서 세금계산서를 동기화합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def sync_tax_invoices(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id)

    today = date.today()
    past_date = today - timedelta(days=200)

    certKey = settings.BAROBILL_CERT_KEY
    corpNum = factory.business_registration_number
    userId = user.barobill_user_id
    taxType = 1
    dateType = 1
    startDate = past_date.strftime("%Y%m%d")  # 200일 전 날짜
    endDate = today.strftime("%Y%m%d")  # 현재 날짜로 설정
    countPerPage = 100  # 최대 100건
    currentPage = 1

    # 매출 세금계산서 조회
    sale_result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoiceSalesList(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        TaxType=taxType,
        DateType=dateType,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
    )

    if sale_result.CurrentPage < 0:
        error_msg = barobill_error_codes.get(sale_result.CurrentPage, "Unknown Error")
        raise HttpError(400, f"바로빌 API 오류 - 매출 세금계산서 조회: {error_msg}")
    exempt_sale_result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoiceSalesList(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        TaxType=3,
        DateType=dateType,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
    )
    if exempt_sale_result.CurrentPage < 0:
        error_msg = barobill_error_codes.get(
            exempt_sale_result.CurrentPage, "Unknown Error"
        )
        raise HttpError(400, f"바로빌 API 오류 - 면세 매출 계산서 조회: {error_msg}")
    sale_result = merge_tax_invoice_pages(sale_result, exempt_sale_result)

    # 매입 세금계산서 조회
    purchase_result = settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoicePurchaseList(
        CERTKEY=certKey,
        CorpNum=corpNum,
        UserID=userId,
        TaxType=taxType,
        DateType=dateType,
        StartDate=startDate,
        EndDate=endDate,
        CountPerPage=countPerPage,
        CurrentPage=currentPage,
    )

    if purchase_result.CurrentPage < 0:
        error_code = barobill_error_codes.get(
            purchase_result.CurrentPage, "Unknown Error"
        )
        raise HttpError(400, f"바로빌 API 오류 - 매입 세금계산서 조회: {error_code}")
    exempt_purchase_result = (
        settings.BAROBILL_CLIENT.service.GetPeriodTaxInvoicePurchaseList(
            CERTKEY=certKey,
            CorpNum=corpNum,
            UserID=userId,
            TaxType=3,
            DateType=dateType,
            StartDate=startDate,
            EndDate=endDate,
            CountPerPage=countPerPage,
            CurrentPage=currentPage,
        )
    )
    if exempt_purchase_result.CurrentPage < 0:
        error_code = barobill_error_codes.get(
            exempt_purchase_result.CurrentPage, "Unknown Error"
        )
        raise HttpError(400, f"바로빌 API 오류 - 면세 매입 계산서 조회: {error_code}")
    purchase_result = merge_tax_invoice_pages(
        purchase_result, exempt_purchase_result
    )

    # 매출, 매입 세금계산서 DB에서 조회
    existing_sales = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            factory=factory,
            tax_invoice_type="sales",
        ).values_list("nts_send_key", flat=True)
    )

    existing_purchases = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            factory=factory,
            tax_invoice_type="purchase",
        ).values_list("nts_send_key", flat=True)
    )

    sale_tax_service_objects = []

    if sale_result.SimpleTaxInvoiceExList is not None:
        # 매출 세금계산서가 존재하는 경우 sync 처리
        for sale in sale_result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx:
            if sale.NTSSendKey in existing_sales:
                continue

            # GetTaxInvoiceNK(국세청 승인번호로 세금계산서 조회) API 호출
            certKey = settings.BAROBILL_CERT_KEY
            corpNum = factory.business_registration_number
            ntsConfirmNum = sale.NTSSendKey

            invoice_detail = settings.BAROBILL_CLIENT.service.GetTaxInvoiceNK(
                CERTKEY=certKey,
                CorpNum=corpNum,
                NTSConfirmNum=ntsConfirmNum,
            )

            if invoice_detail.TaxInvoiceType < 0:  # 호출 실패
                raise HttpError(
                    400,
                    f"바로빌 API 오류 - 세금계산서 상세 조회: {barobill_error_codes.get(invoice_detail.TaxInvoiceType, 'Unknown Error')}",
                )

            synced_tax_type, synced_document_kind = (
                get_synced_tax_document_classification(invoice_detail)
            )

            line_items = []
            for idx, item in enumerate(
                invoice_detail.TaxInvoiceTradeLineItems.TaxInvoiceTradeLineItem, start=1
            ):
                line_items.append(
                    {
                        "id": idx,
                        "purchase_expiry": item.PurchaseExpiry,
                        "product_id": None,
                        "tax_type": synced_tax_type,
                        "name": item.Name,
                        "code": None,
                        "information": item.Information,
                        "chargeable_unit": item.ChargeableUnit,
                        "unit_price": item.UnitPrice,
                        "amount": item.Amount,
                        "tax": item.Tax,
                        "description": item.Description,
                        "material_history": None,
                    }
                )

            # 매출 세금계산서가 DB에 없으면 새로운 세금계산서 생성
            sale_tax_service_objects.append(
                NationalTaxService(
                    user=user,
                    factory=factory,
                    publish_status="published",
                    tax_invoice_type="sales",
                    tax_type=synced_tax_type,
                    document_kind=synced_document_kind,
                    mgt_key=get_remote_mgt_key(invoice_detail, "InvoicerParty")
                    or generate_mgt_key(),
                    transaction_type=barobill_purpose_types.get(
                        invoice_detail.PurposeType
                    ),
                    transaction_date=datetime.strptime(
                        invoice_detail.WriteDate, "%Y%m%d"
                    ).date(),
                    client=None,  # 거래처는 추후에 설정
                    transaction_amount=invoice_detail.AmountTotal,
                    tax_amount=invoice_detail.TaxTotal,
                    nts_send_key=sale.NTSSendKey,
                    barobill_state="발급완료",
                    nts_send_state="전송완료",
                    line_items=line_items,
                )
            )

    sale_tax_services = await NationalTaxService.objects.abulk_create(
        sale_tax_service_objects
    )

    purchase_tax_service_objects = []

    if purchase_result.SimpleTaxInvoiceExList is not None:
        # 매입 세금계산서가 존재하는 경우 sync 처리
        for purchase in purchase_result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx:
            if purchase.NTSSendKey in existing_purchases:
                continue
            # GetTaxInvoiceNK(국세청 승인번호로 세금계산서 조회) API 호출
            certKey = settings.BAROBILL_CERT_KEY
            corpNum = factory.business_registration_number
            ntsConfirmNum = purchase.NTSSendKey

            invoice_detail = settings.BAROBILL_CLIENT.service.GetTaxInvoiceNK(
                CERTKEY=certKey,
                CorpNum=corpNum,
                NTSConfirmNum=ntsConfirmNum,
            )

            if invoice_detail.TaxInvoiceType < 0:  # 호출 실패
                raise HttpError(
                    400,
                    f"바로빌 API 오류 - 세금계산서 상세 조회: {barobill_error_codes.get(invoice_detail.TaxInvoiceType, 'Unknown Error')}",
                )

            synced_tax_type, synced_document_kind = (
                get_synced_tax_document_classification(invoice_detail)
            )

            line_items = []
            for idx, item in enumerate(
                invoice_detail.TaxInvoiceTradeLineItems.TaxInvoiceTradeLineItem, start=1
            ):
                line_items.append(
                    {
                        "id": idx,
                        "purchase_expiry": item.PurchaseExpiry,
                        "product_id": None,
                        "tax_type": synced_tax_type,
                        "name": item.Name,
                        "code": None,
                        "information": item.Information,
                        "chargeable_unit": item.ChargeableUnit,
                        "unit_price": item.UnitPrice,
                        "amount": item.Amount,
                        "tax": item.Tax,
                        "description": item.Description,
                        "material_history": None,
                    }
                )

            # 매출 세금계산서가 DB에 없으면 새로운 세금계산서 생성
            purchase_tax_service_objects.append(
                NationalTaxService(
                    user=user,
                    factory=factory,
                    publish_status="published",
                    tax_invoice_type="purchase",
                    tax_type=synced_tax_type,
                    document_kind=synced_document_kind,
                    mgt_key=get_remote_mgt_key(invoice_detail, "InvoiceeParty")
                    or generate_mgt_key(),
                    transaction_type=barobill_purpose_types.get(
                        invoice_detail.PurposeType
                    ),
                    transaction_date=datetime.strptime(
                        invoice_detail.WriteDate, "%Y%m%d"
                    ).date(),
                    client=None,  # 거래처는 추후에 설정
                    transaction_amount=invoice_detail.AmountTotal,
                    tax_amount=invoice_detail.TaxTotal,
                    nts_send_key=purchase.NTSSendKey,
                    barobill_state="발급완료",
                    nts_send_state="전송완료",
                    line_items=line_items,
                )
            )

    purchase_tax_services = await NationalTaxService.objects.abulk_create(
        purchase_tax_service_objects
    )

    return {"message": "세금계산서 동기화가 완료되었습니다."}


@router.post(
    "/",
    summary="[C] 세금계산서 생성/수정 (임시저장 지원)",
    description="국세청 API 세금계산서를 생성하거나 수정합니다. tax_id가 없으면 생성, 있으면 수정됩니다. 모든 필드가 필수가 아니므로 임시저장이 가능합니다.",
    response={
        201: NationalTaxServiceOut,
        200: NationalTaxServiceOut,
        400: dict,
        422: dict,
        500: dict,
    },
)
async def create_or_update_tax_invoice(request, payload: NationalTaxServiceCreateIn):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory")
    tax_id = data.pop("tax_id", None)

    # 공장 소유권 검증
    member = await is_factory_member(factory_id, user)
    # member.role에 따라 권한 추가 검증
    factory = await get_factory_by_id(factory_id)

    # client가 선택적이므로 None일 수 있음
    client_id = data.pop("client", None)
    client = None
    client_info = {}
    if client_id is not None:
        # 거래처 ID로 거래처 조회
        client = await get_factory_client_by_id(client_id, factory_id)
        client_info = FactoryClientRowOut.from_orm(client).dict()

    if tax_id:
        # 수정 모드
        tax_service = await get_tax_service_by_id(tax_id)

        # 권한 검증
        member = await is_factory_member(tax_service.factory.id, user)

        if tax_service.publish_status == "published":
            raise HttpError(400, "발행된 세금계산서는 수정할 수 없습니다.")
        if tax_service.publish_status not in {"temporary", "failed"}:
            raise HttpError(400, "임시 저장 또는 발행 실패 문서만 수정할 수 있습니다.")

        # 공장 ID 검증
        if tax_service.factory.id != factory_id:
            raise HttpError(400, "세금계산서의 공장과 요청한 공장이 일치하지 않습니다.")

        normalize_tax_document_payload(
            data,
            fallback_line_items=tax_service.line_items,
        )
        validate_tax_document_draft(
            data.get("tax_type", tax_service.tax_type),
            data.get("document_kind", tax_service.document_kind),
            data.get("transaction_amount", tax_service.transaction_amount),
            data.get("tax_amount", tax_service.tax_amount),
            data.get("line_items", tax_service.line_items),
        )

        # 데이터 업데이트
        if client_id is not None:
            tax_service.client = client
            tax_service.client_info = client_info

        # line_items 업데이트
        line_items = data.pop("line_items", None)
        if line_items is not None:
            tax_service.line_items = line_items

        # 나머지 필드 업데이트
        for attr, value in data.items():
            setattr(tax_service, attr, value)
        if tax_service.publish_status == "failed":
            tax_service.publish_status = "temporary"
            tax_service.last_publish_error = ""

        await tax_service.asave()

        # 업데이트된 세금계산서 조회
        tax_service = await NationalTaxService.objects.aget(
            id=tax_service.id,
        )

        return 200, tax_service
    else:
        # 생성 모드
        normalize_tax_document_payload(data)
        validate_tax_document_draft(
            data.get("tax_type", UNCLASSIFIED),
            data.get("document_kind", "tax_invoice"),
            data.get("transaction_amount"),
            data.get("tax_amount"),
            data.get("line_items"),
        )

        @sync_to_async
        @transaction.atomic
        def create_tax_service():
            tax_service = NationalTaxService.objects.create(
                user=user,
                factory=factory,
                factory_info=FactoryRowOut.from_orm(factory).dict(),
                client=client,
                client_info=client_info,
                barobill_state="임시저장",
                **data,
            )

            tax_service.save()
            return tax_service

        tax_service = await create_tax_service()

        tax_service = await NationalTaxService.objects.aget(
            id=tax_service.id,
        )

        return 201, tax_service


@router.get(
    "/{tax_id}/split-preview",
    summary="[C] 혼합 과세 문서 분리 미리보기",
    description="과세·면세 혼합 임시 문서가 두 문서로 어떻게 나뉘는지 저장 없이 확인합니다.",
    response={200: dict, 422: dict},
)
async def preview_tax_document_split(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    await is_factory_member(tax_service.factory.id, user)

    if tax_service.document_group_id:
        return await sync_to_async(get_split_group_result)(
            group_id=tax_service.document_group_id
        )
    try:
        preview = build_split_preview(
            document_tax_type=tax_service.tax_type,
            transaction_amount=tax_service.transaction_amount,
            tax_amount=tax_service.tax_amount,
            line_items=tax_service.line_items,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))
    preview["source_document_id"] = tax_service.id
    return preview


@router.post(
    "/{tax_id}/split",
    summary="[C] 혼합 과세 임시 문서 분리",
    description="과세·면세 혼합 임시 문서를 전자세금계산서와 전자계산서로 한 번만 분리합니다.",
    response={200: dict, 422: dict},
)
async def create_tax_document_split(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    await is_factory_member(tax_service.factory.id, user)
    try:
        return await sync_to_async(split_tax_document)(
            tax_service_id=tax_service.id,
            actor=user,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))


@router.post(
    "/{tax_id}/split-document",
    summary="[C] 같은 과세 유형 문서 추가 분리",
    description="분리 그룹의 임시 문서에서 선택한 품목을 같은 과세 유형의 새 임시 문서로 옮깁니다.",
    response={200: dict, 422: dict},
)
async def create_additional_tax_document_split(
    request, tax_id: int, payload: ManualTaxDocumentSplitIn
):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    await is_factory_member(tax_service.factory.id, user)
    try:
        return await sync_to_async(split_group_document)(
            tax_service_id=tax_service.id,
            selected_line_item_indexes=payload.selected_line_item_indexes,
            expected_line_item_count=payload.expected_line_item_count,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))


@router.post(
    "/{tax_id}/reset-split",
    summary="[C] 자동 분리 상태 복원",
    description="추가 분리된 임시 문서 그룹을 원거래의 과세·면세 2장 상태로 되돌립니다.",
    response={200: dict, 422: dict},
)
async def reset_tax_document_split(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    await is_factory_member(tax_service.factory.id, user)
    try:
        return await sync_to_async(reset_group_to_auto_split)(
            tax_service_id=tax_service.id,
        )
    except TaxDocumentValidationError as error:
        raise HttpError(422, str(error))


@router.get(
    "/{tax_id}/publish-group-readiness",
    summary="[C] 분리 세금 문서 그룹 발행 준비 확인",
    description="외부 전송 없이 분리된 모든 세금 문서의 발행 필수값과 과세 구분을 확인합니다.",
    response={200: dict, 400: dict},
)
async def check_split_tax_document_group_readiness(request, tax_id: int):
    user = request.auth
    source = await get_tax_service_by_id(tax_id)
    await is_factory_member(source.factory.id, user)
    if not source.document_group_id:
        raise HttpError(400, "분리된 세금 문서 그룹이 아닙니다.")

    group_key = await TaxDocumentGroup.objects.values_list(
        "group_key", flat=True
    ).aget(id=source.document_group_id)

    documents = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            document_group_id=source.document_group_id
        )
        .select_related("factory", "client")
        .order_by("id")
    )
    results = []
    has_retryable_document = False
    for document in documents:
        if document.publish_status == "published":
            results.append(
                {
                    "id": document.id,
                    "tax_type": document.tax_type,
                    "publish_status": document.publish_status,
                    "ready": True,
                    "message": "이미 발행된 문서입니다. 재시도 시 건너뜁니다.",
                    "attempt_count": document.publish_attempt_count,
                    "last_error": document.last_publish_error,
                }
            )
            continue
        if document.publish_status not in {"temporary", "failed"}:
            if is_publish_claim_stale(document):
                message = "이전 발행 요청의 바로빌 상태 확인이 필요합니다."
            elif document.publish_status == "publishing":
                message = "다른 발행 요청이 처리 중입니다."
            else:
                message = "현재 상태에서는 발행을 시작할 수 없습니다."
            results.append(
                {
                    "id": document.id,
                    "tax_type": document.tax_type,
                    "publish_status": document.publish_status,
                    "ready": False,
                    "message": message,
                    "attempt_count": document.publish_attempt_count,
                    "last_error": document.last_publish_error,
                }
            )
            continue

        has_retryable_document = True
        try:
            validate_required_fields_for_issue(document)
            await validate_product_master_tax_types_for_issue(document)
            validate_tax_document_for_issue(document)
        except HttpError as error:
            results.append(
                {
                    "id": document.id,
                    "tax_type": document.tax_type,
                    "publish_status": document.publish_status,
                    "ready": False,
                    "message": str(error.message),
                    "attempt_count": document.publish_attempt_count,
                    "last_error": document.last_publish_error,
                }
            )
        else:
            results.append(
                {
                    "id": document.id,
                    "tax_type": document.tax_type,
                    "publish_status": document.publish_status,
                    "ready": True,
                    "message": (
                        "이전 실패 원인을 확인했습니다. 이 문서만 재시도할 수 있습니다."
                        if document.publish_status == "failed"
                        else "발행 준비가 완료되었습니다."
                    ),
                    "attempt_count": document.publish_attempt_count,
                    "last_error": document.last_publish_error,
                }
            )

    return {
        "group_key": str(group_key),
        "can_publish": has_retryable_document
        and all(result["ready"] for result in results),
        "group_publish_enabled": settings.ENABLE_BAROBILL
        and settings.ENABLE_GROUP_TAX_PUBLISH,
        "external_request_sent": False,
        "documents": results,
    }


@router.post(
    "/{tax_id}/publish-group",
    summary="[C] 분리 세금 문서 그룹 발행",
    description="그룹 전체를 사전 검증한 뒤 미발행 문서만 외부 발행하고 문서별 결과를 기록합니다.",
    response={200: dict, 400: dict, 409: dict, 503: dict},
)
async def publish_split_tax_document_group(request, tax_id: int):
    if not settings.ENABLE_BAROBILL or not settings.ENABLE_GROUP_TAX_PUBLISH:
        raise HttpError(
            503,
            "그룹 발행은 바로빌 테스트 환경과 기능 플래그가 준비된 뒤 사용할 수 있습니다.",
        )

    user = request.auth
    source = await get_tax_service_by_id(tax_id)
    await is_factory_member(source.factory.id, user)
    if not source.document_group_id:
        raise HttpError(400, "분리된 세금 문서 그룹이 아닙니다.")

    group_key = await TaxDocumentGroup.objects.values_list(
        "group_key", flat=True
    ).aget(id=source.document_group_id)
    documents = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            document_group_id=source.document_group_id
        )
        .select_related("factory", "client")
        .order_by("id")
    )

    # A process can stop after the remote call but before the local completion
    # update. Reconcile stale claims by MgtKey before deciding what to retry.
    for document in documents:
        if is_publish_claim_stale(document):
            await reconcile_stale_publish_claim(document)
    documents = await sync_to_async(list)(
        NationalTaxService.objects.filter(
            document_group_id=source.document_group_id
        )
        .select_related("factory", "client")
        .order_by("id")
    )

    # A full preflight prevents a validation error in one document from producing
    # an avoidable partial issue. Published documents are intentionally skipped.
    validation_errors = []
    for document in documents:
        if document.publish_status == "published":
            continue
        if document.publish_status not in {"temporary", "failed"}:
            validation_errors.append(
                {"id": document.id, "message": "현재 상태에서는 발행할 수 없습니다."}
            )
            continue
        try:
            validate_required_fields_for_issue(document)
            await validate_product_master_tax_types_for_issue(document)
            validate_tax_document_for_issue(document)
        except HttpError as error:
            validation_errors.append({"id": document.id, "message": str(error.message)})

    if validation_errors:
        return 409, {
            "message": "발행 전에 수정이 필요한 문서가 있습니다.",
            "documents": validation_errors,
        }

    results = []
    external_request_sent = False
    for document in documents:
        claim_state, claimed = await sync_to_async(claim_document_for_publish)(
            document.id
        )
        if claim_state == "skipped":
            results.append(
                {
                    "id": document.id,
                    "status": "skipped",
                    "message": "이미 발행된 문서라 건너뛰었습니다.",
                }
            )
            continue
        if claim_state == "blocked":
            results.append(
                {
                    "id": document.id,
                    "status": "blocked",
                    "message": "다른 발행 요청이 처리 중이거나 발행할 수 없는 상태입니다.",
                }
            )
            continue

        external_request_sent = True
        try:
            validate_required_fields_for_issue(claimed)
            await validate_product_master_tax_types_for_issue(claimed)
            validate_tax_document_for_issue(claimed)
            issue_barobill_tax_invoice(claimed, claimed.factory, claimed.client, user)
        except Exception as error:
            message = (
                str(error.message)
                if isinstance(error, HttpError)
                else "외부 발행 처리 중 오류가 발생했습니다."
            )
            failed = await sync_to_async(fail_document_publish)(
                document.id, message
            )
            results.append(
                {
                    "id": document.id,
                    "status": "failed",
                    "attempt_count": failed.publish_attempt_count,
                    "message": message,
                }
            )
            continue

        completed = await sync_to_async(complete_document_publish)(document.id)
        results.append(
            {
                "id": document.id,
                "status": "published",
                "attempt_count": completed.publish_attempt_count,
                "message": "발행되었습니다.",
            }
        )

    return {
        "group_key": str(group_key),
        "all_succeeded": all(
            result["status"] in {"published", "skipped"} for result in results
        ),
        "external_request_sent": external_request_sent,
        "documents": results,
    }


@router.get(
    "/{tax_id}",
    summary="[C] 세금계산서 상세 조회",
    description="세금계산서 상세 정보를 조회합니다.",
    response={200: NationalTaxServiceOut, 404: dict, 500: dict},
)
async def get_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함
    
    # 연결된 프로젝트 ID 가져오기
    @sync_to_async
    def get_project_id():
        project = tax_service.projects.first()
        return project.id if project else None
    
    project_id = await get_project_id()
    # 객체에 project_id 속성 추가 
    tax_service.project_id = project_id
    
    return tax_service


@router.patch(
    "/{tax_id}",
    summary="[C] 세금계산서 수정",
    description="국세청 API 세금계산서를 수정합니다. (임시저장 가능)",
    response={200: NationalTaxServiceOut, 400: dict, 404: dict, 422: dict, 500: dict},
)
async def update_tax_invoice(request, tax_id: int, payload: NationalTaxServiceUpdateIn):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    data = payload.dict(exclude_unset=True)

    # 발행된 세금계산서인 경우 isHidden 필드만 수정 가능
    if tax_service.publish_status == "published":
        # isHidden 필드만 허용하고 다른 필드는 제거
        allowed_fields = {"is_hidden"}
        data = {k: v for k, v in data.items() if k in allowed_fields}

        if not data:
            raise HttpError(
                400, "발행된 세금계산서는 isHidden 필드만 수정할 수 있습니다."
            )
    elif tax_service.publish_status not in {"temporary", "failed"}:
        raise HttpError(400, "현재 발행 상태에서는 문서를 수정할 수 없습니다.")

    factory_id = data.pop("factory", None)
    if factory_id is not None:
        # 공장 소유권 검증
        if factory_id != tax_service.factory.id:
            raise HttpError(400, "세금계산서의 공장과 요청한 공장이 일치하지 않습니다.")

    client_id = data.pop("client", None)
    if client_id is not None:
        client = await get_factory_client_by_id(
            client_id, factory_id or tax_service.factory.id
        )
        tax_service.client = client
        tax_service.client_info = FactoryClientRowOut.from_orm(client).dict()

    if tax_service.publish_status != "published":
        normalize_tax_document_payload(
            data,
            fallback_line_items=tax_service.line_items,
        )
        validate_tax_document_draft(
            data.get("tax_type", tax_service.tax_type),
            data.get("document_kind", tax_service.document_kind),
            data.get("transaction_amount", tax_service.transaction_amount),
            data.get("tax_amount", tax_service.tax_amount),
            data.get("line_items", tax_service.line_items),
        )

    # line_items는 수정 시에만 업데이트
    line_items = data.pop("line_items", None)
    if line_items is not None:
        tax_service.line_items = line_items

    for attr, value in data.items():
        setattr(tax_service, attr, value)
    if tax_service.publish_status == "failed":
        tax_service.publish_status = "temporary"
        tax_service.last_publish_error = ""

    await tax_service.asave()

    tax_service = await NationalTaxService.objects.aget(
        id=tax_service.id,
    )

    return tax_service


@router.delete(
    "/{tax_id}",
    summary="[C] 세금계산서 삭제",
    description="국세청 API 세금계산서를 삭제합니다.",
    response={204: None, 404: dict, 500: dict},
)
async def delete_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    await tax_service.adelete()
    return 204, None


@router.post(
    "/{tax_id}/publish",
    summary="[C] 세금계산서 발행",
    description="국세청 API 세금계산서를 발행합니다.",
    response={200: dict, 400: dict, 409: dict, 422: dict, 500: dict, 503: dict},
)
async def publish_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    factory = tax_service.factory
    await is_factory_member(factory.id, user)

    if is_publish_claim_stale(tax_service):
        tax_service = await reconcile_stale_publish_claim(
            tax_service, raise_on_error=True
        )
        if tax_service.publish_status == "published":
            return {
                "message": "바로빌 상태 조회 결과 이미 발행된 문서로 확인되었습니다.",
                "reconciled": True,
            }

    if tax_service.publish_status not in {"temporary", "failed"}:
        raise HttpError(409, "이미 발행 중이거나 발행할 수 없는 상태입니다.")

    validate_required_fields_for_issue(tax_service)
    await validate_product_master_tax_types_for_issue(tax_service)
    validate_tax_document_for_issue(tax_service)

    if not settings.ENABLE_BAROBILL:
        raise HttpError(503, "바로빌 연동이 활성화되지 않았습니다.")

    claim_state, claimed = await sync_to_async(claim_document_for_publish)(tax_id)
    if claim_state != "claimed":
        raise HttpError(409, "다른 발행 요청이 먼저 처리 중이거나 이미 발행되었습니다.")

    try:
        # Validate the claimed snapshot again so an edit racing with preflight
        # cannot change what is sent to BaroBill.
        validate_required_fields_for_issue(claimed)
        await validate_product_master_tax_types_for_issue(claimed)
        validate_tax_document_for_issue(claimed)
        issue_barobill_tax_invoice(claimed, claimed.factory, claimed.client, user)
    except Exception as error:
        message = (
            str(error.message)
            if isinstance(error, HttpError)
            else "외부 발행 처리 중 오류가 발생했습니다."
        )
        await sync_to_async(fail_document_publish)(claimed.id, message)
        if isinstance(error, HttpError):
            raise
        raise HttpError(500, message)

    tax_service = await sync_to_async(complete_document_publish)(claimed.id)
    project = await sync_to_async(lambda: tax_service.projects.first())()

    # 웹소켓 알림
    if tax_service.tax_invoice_type == "sales":
        result = await send_notification_to_factory(
            factory_id=factory.id,
            notification_type="information",
            notification_case="sales_tax_invoice_published",
            content=f"{project.name if project else 'Unknown Project'} 매출 세금계산서 발행 완료",
            additional_data={"factory_id": factory.id},
        )
    elif tax_service.tax_invoice_type == "purchase":
        result = await send_notification_to_factory(
            factory_id=factory.id,
            notification_type="information",
            notification_case="purchase_tax_invoice_published",
            content=f"{project.name if project else 'Unknown Project'} 매입 세금계산서 발행 완료",
            additional_data={"factory_id": factory.id},
        )

    return {"message": "세금계산서가 발행되었습니다."}


@router.post(
    "/{tax_id}/reconcile-publish",
    summary="[C] 중단된 발행 상태 복구",
    description="오래된 외부 발행 선점을 관리번호로 바로빌에 조회해 로컬 상태를 복구합니다.",
    response={200: dict, 400: dict, 409: dict, 503: dict},
)
async def reconcile_tax_invoice_publish(request, tax_id: int):
    if not settings.ENABLE_BAROBILL:
        raise HttpError(503, "바로빌 연동이 활성화되지 않았습니다.")
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    await is_factory_member(tax_service.factory.id, user)
    if tax_service.publish_status != "publishing":
        raise HttpError(409, "외부 발행 중 상태인 문서만 복구할 수 있습니다.")
    if not is_publish_claim_stale(tax_service):
        raise HttpError(409, "발행 선점 시간이 지나지 않아 아직 복구할 수 없습니다.")

    resolved = await reconcile_stale_publish_claim(tax_service, raise_on_error=True)
    return {
        "id": resolved.id,
        "publish_status": resolved.publish_status,
        "barobill_state": resolved.barobill_state,
        "nts_send_state": resolved.nts_send_state,
    }


@router.post(
    "/{tax_id}/cancel",
    summary="[C] 세금계산서 발행 취소",
    description="국세청 API 세금계산서 발행을 취소합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def cancel_tax_invoice(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    # 멤버 권한 검증 추가해야함

    # 바로빌 상태 점검
    result = get_state_barobill_tax_invoice(
        tax_service.factory.business_registration_number,
        tax_service.mgt_key,
    )
    barobill_state = barobill_tax_service_states.get(result.BarobillState)
    nts_send_state = nts_tax_service_states.get(result.NTSSendState)
    if barobill_state != "발급완료" or nts_send_state != "전송전":
        raise HttpError(400, "세금계산서 발행을 취소할 수 있는 상태가 아닙니다.")

    # 발행 취소
    result = cancel_barobill_tax_invoice(
        tax_service.factory.business_registration_number,
        tax_service.mgt_key,
    )

    return {"message": "세금계산서 발행이 취소되었습니다."}


@router.get(
    "/{tax_id}/state",
    summary="[C] 세금계산서 발행 상태 조회",
    description="국세청 API 세금계산서 발행 상태를 조회합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def get_tax_invoice_state_from_barobill(request, tax_id: int):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)
    corpNum = tax_service.factory.business_registration_number
    mgtKey = tax_service.mgt_key

    result = get_state_barobill_tax_invoice(corpNum, mgtKey)
    # TODO : 상태조회를 CronJob으로 주기적으로 실행

    return {
        "state": barobill_tax_service_states.get(result.BarobillState)
        or "Unknown State",
        "nts_state": nts_tax_service_states.get(result.NTSSendState) or "Unknown State",
    }


@router.patch(
    "/{tax_id}/connect-material-history",
    summary="[C] NEW! 세금계산서와 자재 이력 연동",
    description="세금계산서와 자재 이력을 연동합니다.",
    response={200: dict, 400: dict, 500: dict},
)
async def connect_material_history(
    request, tax_id: int, payload: TaxToMaterialHistoryIn
):
    user = request.auth
    tax_service = await get_tax_service_by_id(tax_id)
    member = await is_factory_member(tax_service.factory.id, user)

    if not member:
        raise HttpError(403, "권한이 없습니다.")

    # line_items 중 요청한 line_item_id가 존재하는지 확인
    line_items = tax_service.line_items or []
    matched_item = next(
        (item for item in line_items if item.get("id") == payload.line_item_id),
        None,
    )

    if not matched_item:
        raise HttpError(404, f"line_item_id {payload.line_item_id}를 찾을 수 없습니다.")

    # 이미 다른 material_history가 연동되어 있는지 확인
    if (
        matched_item.get("material_history")
        and matched_item.get("material_history") != payload.material_history_id
    ):
        raise HttpError(400, "해당 품목에는 이미 다른 자재 이력이 연동되어 있습니다.")

    # material_history 존재 여부 및 공장 일치 검증
    try:
        material_history = await MaterialHistory.objects.select_related(
            "material"
        ).aget(id=payload.material_history_id)
    except MaterialHistory.DoesNotExist:
        raise HttpError(
            404,
            f"material_history_id {payload.material_history_id}를 찾을 수 없습니다.",
        )

    if material_history.material.factory_id != tax_service.factory_id:
        raise HttpError(
            400, "자재 이력의 공장과 세금계산서의 공장이 일치하지 않습니다."
        )

    matched_item["material_history"] = payload.material_history_id
    tax_service.line_items = line_items
    await tax_service.asave()

    return {"message": "세금계산서와 자재 이력 연동이 완료되었습니다."}
