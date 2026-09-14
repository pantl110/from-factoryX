from unittest import TestCase

from pydantic import ValidationError

from stock.schemas.inbound import ProductCreateIn, SingleMaterialCreateIn


class StockTaxTypeSchemaTest(TestCase):
    def test_product_defaults_to_taxable(self):
        product = ProductCreateIn(name="제품", code="P-1", unit="EA", spec="1개")
        self.assertEqual(product.tax_type, "taxable")

    def test_material_accepts_exempt(self):
        material = SingleMaterialCreateIn(
            name="우유", code="M-1", unit="L", spec="1L", tax_type="exempt"
        )
        self.assertEqual(material.tax_type, "exempt")

    def test_invalid_tax_type_is_rejected(self):
        with self.assertRaises(ValidationError):
            ProductCreateIn(
                name="제품", code="P-2", unit="EA", spec="1개", tax_type="Y"
            )
