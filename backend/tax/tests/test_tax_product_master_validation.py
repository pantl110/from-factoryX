from types import SimpleNamespace

from asgiref.sync import async_to_sync
from django.test import TestCase
from ninja.errors import HttpError

from factory.models import Factory
from stock.models import Product
from tax.api import validate_product_master_tax_types_for_issue
from user.models import User


class ProductMasterTaxTypeValidationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="tax-review@example.com",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Tax Review Factory",
            business_registration_number="123-45-67890",
        )
        self.product = Product.objects.create(
            factory=self.factory,
            name="우유",
            code="MILK-001",
            unit="EA",
            spec="1L",
            tax_type="exempt",
            tax_type_review_required=True,
        )

    def make_tax_service(self, line_tax_type="exempt"):
        return SimpleNamespace(
            factory_id=self.factory.id,
            tax_type=line_tax_type,
            line_items=[
                {
                    "product_id": self.product.id,
                    "tax_type": line_tax_type,
                }
            ],
        )

    def test_unreviewed_legacy_product_blocks_issue(self):
        with self.assertRaises(HttpError):
            async_to_sync(validate_product_master_tax_types_for_issue)(
                self.make_tax_service()
            )

    def test_reviewed_product_can_be_issued(self):
        self.product.tax_type_review_required = False
        self.product.save(update_fields=["tax_type_review_required"])

        async_to_sync(validate_product_master_tax_types_for_issue)(
            self.make_tax_service()
        )

    def test_document_line_must_match_product_master(self):
        self.product.tax_type_review_required = False
        self.product.save(update_fields=["tax_type_review_required"])

        with self.assertRaises(HttpError):
            async_to_sync(validate_product_master_tax_types_for_issue)(
                self.make_tax_service(line_tax_type="taxable")
            )
