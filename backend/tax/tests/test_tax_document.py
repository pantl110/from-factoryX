from unittest import TestCase

from tax.tax_document import (
    EXEMPT,
    INVOICE,
    TAXABLE,
    TAX_INVOICE,
    UNCLASSIFIED,
    ZERO_RATED,
    TaxDocumentValidationError,
    calculate_line_amounts,
    get_barobill_tax_document_fields,
    validate_document_amounts,
    validate_line_item_tax_types,
    validate_zero_rated_reason,
)


class TaxDocumentTest(TestCase):
    def test_taxable_maps_to_tax_invoice_and_taxable(self):
        result = get_barobill_tax_document_fields(
            tax_type=TAXABLE, document_kind=TAX_INVOICE, tax_amount=1000
        )
        self.assertEqual((result.tax_invoice_type, result.tax_type), (1, 1))

    def test_zero_rated_maps_to_tax_invoice_and_zero_rated(self):
        result = get_barobill_tax_document_fields(
            tax_type=ZERO_RATED, document_kind=TAX_INVOICE, tax_amount=0
        )
        self.assertEqual((result.tax_invoice_type, result.tax_type), (1, 2))

    def test_exempt_maps_to_invoice_and_exempt(self):
        result = get_barobill_tax_document_fields(
            tax_type=EXEMPT, document_kind=INVOICE, tax_amount=0
        )
        self.assertEqual((result.tax_invoice_type, result.tax_type), (2, 3))

    def test_zero_rated_or_exempt_cannot_have_tax(self):
        for tax_type, document_kind in ((ZERO_RATED, TAX_INVOICE), (EXEMPT, INVOICE)):
            with self.assertRaises(TaxDocumentValidationError):
                get_barobill_tax_document_fields(
                    tax_type=tax_type, document_kind=document_kind, tax_amount=1
                )

    def test_exempt_cannot_use_tax_invoice_kind(self):
        with self.assertRaises(TaxDocumentValidationError):
            get_barobill_tax_document_fields(
                tax_type=EXEMPT, document_kind=TAX_INVOICE, tax_amount=0
            )

    def test_unclassified_cannot_be_issued(self):
        with self.assertRaises(TaxDocumentValidationError):
            get_barobill_tax_document_fields(
                tax_type=UNCLASSIFIED, document_kind=TAX_INVOICE, tax_amount=0
            )

    def test_line_item_tax_type_must_match_document(self):
        with self.assertRaises(TaxDocumentValidationError):
            validate_line_item_tax_types(
                document_tax_type=TAXABLE,
                line_items=[
                    {"tax_type": TAXABLE, "tax": "100"},
                    {"tax_type": EXEMPT, "tax": "0"},
                ],
            )

    def test_legacy_line_item_inherits_document_tax_type(self):
        validate_line_item_tax_types(
            document_tax_type=EXEMPT,
            line_items=[{"name": "우유", "tax": "0"}],
        )

    def test_decimal_zero_tax_is_accepted(self):
        validate_line_item_tax_types(
            document_tax_type=EXEMPT,
            line_items=[{"tax_type": EXEMPT, "tax": "0.00"}],
        )

    def test_invalid_item_tax_returns_validation_error(self):
        with self.assertRaises(TaxDocumentValidationError):
            validate_line_item_tax_types(
                document_tax_type=TAXABLE,
                line_items=[{"tax_type": TAXABLE, "tax": "잘못된 금액"}],
            )

    def test_zero_rated_reason_is_required(self):
        with self.assertRaises(TaxDocumentValidationError):
            validate_zero_rated_reason(tax_type=ZERO_RATED, reason="  ")

    def test_zero_rated_reason_accepts_transaction_basis(self):
        validate_zero_rated_reason(tax_type=ZERO_RATED, reason="수출 거래")

    def test_non_zero_rated_document_does_not_require_reason(self):
        validate_zero_rated_reason(tax_type=TAXABLE, reason=None)

    def test_taxable_line_calculates_supply_tax_and_total(self):
        result = calculate_line_amounts(
            quantity="3", unit_price="999", tax_type=TAXABLE
        )
        self.assertEqual(
            (result.supply_amount, result.tax_amount, result.total_amount),
            (2997, 299, 3296),
        )

    def test_exempt_and_zero_rated_lines_have_no_tax(self):
        for tax_type in (EXEMPT, ZERO_RATED):
            result = calculate_line_amounts(
                quantity="2", unit_price="1500", tax_type=tax_type
            )
            self.assertEqual(
                (result.supply_amount, result.tax_amount, result.total_amount),
                (3000, 0, 3000),
            )

    def test_fractional_supply_amount_is_truncated_to_whole_won(self):
        result = calculate_line_amounts(
            quantity="1.5", unit_price="999", tax_type=TAXABLE
        )
        self.assertEqual(
            (result.supply_amount, result.tax_amount, result.total_amount),
            (1498, 149, 1647),
        )

    def test_document_totals_must_equal_line_totals(self):
        line_items = [
            {
                "tax_type": TAXABLE,
                "chargeable_unit": "3",
                "unit_price": "999",
                "amount": "2997",
                "tax": "299",
            }
        ]
        validate_document_amounts(
            document_tax_type=TAXABLE,
            transaction_amount=2997,
            tax_amount=299,
            line_items=line_items,
        )

        with self.assertRaises(TaxDocumentValidationError):
            validate_document_amounts(
                document_tax_type=TAXABLE,
                transaction_amount=2998,
                tax_amount=299,
                line_items=line_items,
            )

    def test_submitted_line_tax_is_recalculated_by_tax_type(self):
        with self.assertRaises(TaxDocumentValidationError):
            validate_document_amounts(
                document_tax_type=EXEMPT,
                transaction_amount=3000,
                tax_amount=300,
                line_items=[
                    {
                        "tax_type": EXEMPT,
                        "chargeable_unit": "2",
                        "unit_price": "1500",
                        "amount": "3000",
                        "tax": "300",
                    }
                ],
            )
