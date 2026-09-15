from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_DOWN


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


@dataclass(frozen=True)
class TaxLineAmounts:
    supply_amount: int
    tax_amount: int
    total_amount: int


def _to_non_negative_decimal(value, field_name: str) -> Decimal:
    try:
        number = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise TaxDocumentValidationError(
            f"{field_name}은(는) 숫자로 입력해야 합니다."
        ) from None
    if not number.is_finite() or number < 0:
        raise TaxDocumentValidationError(
            f"{field_name}은(는) 0 이상의 숫자여야 합니다."
        )
    return number


def calculate_line_amounts(*, quantity, unit_price, tax_type: str) -> TaxLineAmounts:
    """Calculate whole-won supply, tax and total amounts for one line item."""
    if tax_type not in {TAXABLE, ZERO_RATED, EXEMPT}:
        raise TaxDocumentValidationError("지원하지 않는 품목 과세 유형입니다.")

    quantity_value = _to_non_negative_decimal(quantity, "수량")
    unit_price_value = _to_non_negative_decimal(unit_price, "단가")
    supply_amount = int(
        (quantity_value * unit_price_value).quantize(
            Decimal("1"), rounding=ROUND_DOWN
        )
    )
    tax_amount = (
        int(
            (Decimal(supply_amount) * Decimal("0.1")).quantize(
                Decimal("1"), rounding=ROUND_DOWN
            )
        )
        if tax_type == TAXABLE
        else 0
    )
    return TaxLineAmounts(
        supply_amount=supply_amount,
        tax_amount=tax_amount,
        total_amount=supply_amount + tax_amount,
    )


def validate_document_amounts(
    *,
    document_tax_type: str,
    transaction_amount,
    tax_amount,
    line_items,
    allow_incomplete: bool = False,
) -> None:
    """Ensure every line and the document totals use the same calculation rules."""
    if not line_items:
        return

    expected_supply_total = 0
    expected_tax_total = 0
    validated_line_count = 0

    for index, item in enumerate(line_items, start=1):
        item_tax_type = item.get("tax_type") or document_tax_type
        if allow_incomplete and item_tax_type == UNCLASSIFIED:
            continue
        required_values = {
            "수량": item.get("chargeable_unit"),
            "단가": item.get("unit_price"),
            "공급가액": item.get("amount"),
            "세액": item.get("tax"),
        }
        if any(value is None or value == "" for value in required_values.values()):
            if allow_incomplete:
                continue
            raise TaxDocumentValidationError(
                f"품목 {index}번의 수량·단가·공급가액·세액이 필요합니다."
            )

        expected = calculate_line_amounts(
            quantity=required_values["수량"],
            unit_price=required_values["단가"],
            tax_type=item_tax_type,
        )
        submitted_supply = _to_non_negative_decimal(
            required_values["공급가액"], "공급가액"
        )
        submitted_tax = _to_non_negative_decimal(required_values["세액"], "세액")
        if submitted_supply != expected.supply_amount:
            raise TaxDocumentValidationError(
                f"품목 {index}번의 공급가액이 수량×단가 계산 결과와 일치하지 않습니다."
            )
        if submitted_tax != expected.tax_amount:
            raise TaxDocumentValidationError(
                f"품목 {index}번의 세액이 과세 유형별 계산 결과와 일치하지 않습니다."
            )

        expected_supply_total += expected.supply_amount
        expected_tax_total += expected.tax_amount
        validated_line_count += 1

    if allow_incomplete and validated_line_count != len(line_items):
        return
    if transaction_amount is None or tax_amount is None:
        if allow_incomplete:
            return
        raise TaxDocumentValidationError("문서 공급가액과 세액 합계가 필요합니다.")

    submitted_supply_total = _to_non_negative_decimal(
        transaction_amount, "문서 공급가액"
    )
    submitted_tax_total = _to_non_negative_decimal(tax_amount, "문서 세액")
    if submitted_supply_total != expected_supply_total:
        raise TaxDocumentValidationError(
            "문서 공급가액이 품목별 공급가액 합계와 일치하지 않습니다."
        )
    if submitted_tax_total != expected_tax_total:
        raise TaxDocumentValidationError(
            "문서 세액이 품목별 세액 합계와 일치하지 않습니다."
        )


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
