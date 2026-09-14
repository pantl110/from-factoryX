from dataclasses import dataclass
from decimal import Decimal, InvalidOperation


TAXABLE = "taxable"
ZERO_RATED = "zero_rated"
EXEMPT = "exempt"
UNCLASSIFIED = "unclassified"

TAX_INVOICE = "tax_invoice"
INVOICE = "invoice"


class TaxDocumentValidationError(ValueError):
    """Raised when a tax document's classification and amounts disagree."""


@dataclass(frozen=True)
class BarobillTaxDocumentFields:
    tax_invoice_type: int
    tax_type: int


def validate_line_item_tax_types(*, document_tax_type: str, line_items) -> None:
    """Keep item defaults and the single BaroBill document classification aligned."""
    if document_tax_type == UNCLASSIFIED or not line_items:
        return

    item_tax_types = set()
    for item in line_items:
        item_tax_type = item.get("tax_type") or document_tax_type
        if item_tax_type not in {TAXABLE, ZERO_RATED, EXEMPT}:
            raise TaxDocumentValidationError("지원하지 않는 품목 과세 유형입니다.")
        item_tax_types.add(item_tax_type)

        try:
            item_tax = Decimal(str(item.get("tax") or 0))
        except (InvalidOperation, TypeError, ValueError):
            raise TaxDocumentValidationError(
                "품목 세액은 숫자로 입력해야 합니다."
            ) from None
        if item_tax_type in {ZERO_RATED, EXEMPT} and item_tax != 0:
            raise TaxDocumentValidationError(
                "영세율·면세 품목의 세액은 0원이어야 합니다."
            )

    if len(item_tax_types) > 1:
        raise TaxDocumentValidationError(
            "과세 유형이 다른 품목은 문서를 나누어 발행해야 합니다."
        )
    if item_tax_types != {document_tax_type}:
        raise TaxDocumentValidationError(
            "품목의 과세 유형과 문서의 과세 유형이 일치하지 않습니다."
        )


def validate_zero_rated_reason(*, tax_type: str, reason: str | None) -> None:
    """Require an auditable reason before a zero-rated document is issued."""
    if tax_type == ZERO_RATED and not (reason or "").strip():
        raise TaxDocumentValidationError("영세율 적용 사유를 입력해야 합니다.")


def get_barobill_tax_document_fields(
    *, tax_type: str, document_kind: str, tax_amount: int | None
) -> BarobillTaxDocumentFields:
    """Validate an issue-ready document and convert it to BaroBill values."""
    if tax_type == UNCLASSIFIED:
        raise TaxDocumentValidationError("과세 유형을 선택해야 발행할 수 있습니다.")

    expected_document_kind = {
        TAXABLE: TAX_INVOICE,
        ZERO_RATED: TAX_INVOICE,
        EXEMPT: INVOICE,
    }.get(tax_type)
    if expected_document_kind is None:
        raise TaxDocumentValidationError("지원하지 않는 과세 유형입니다.")
    if document_kind != expected_document_kind:
        raise TaxDocumentValidationError(
            "면세는 전자계산서로, 과세·영세율은 전자세금계산서로 발행해야 합니다."
        )
    if tax_amount is None or tax_amount < 0:
        raise TaxDocumentValidationError("세액은 0 이상의 금액이어야 합니다.")
    if tax_type in {ZERO_RATED, EXEMPT} and tax_amount != 0:
        raise TaxDocumentValidationError("영세율과 면세 문서의 세액은 0원이어야 합니다.")

    return BarobillTaxDocumentFields(
        tax_invoice_type=1 if document_kind == TAX_INVOICE else 2,
        tax_type={TAXABLE: 1, ZERO_RATED: 2, EXEMPT: 3}[tax_type],
    )
