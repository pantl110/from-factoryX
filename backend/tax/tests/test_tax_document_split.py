from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from asgiref.sync import async_to_sync
from django.test import TestCase, override_settings
from ninja.errors import HttpError

from factory.models import Factory, FactoryClient, FactoryMember
from project.models import Project
from stock.models import Product
from tax.api import (
    check_split_tax_document_group_readiness,
    publish_split_tax_document_group,
)
from tax.models import NationalTaxService, TaxDocumentGroup
from tax.schemas.outbound import NationalTaxServiceOut
from tax.split_service import (
    build_split_preview,
    reset_group_to_auto_split,
    split_group_document,
    split_tax_document,
)
from tax.tax_document import TaxDocumentValidationError
from user.models import User


def line_item(*, name, tax_type, quantity, unit_price, amount, tax):
    return {
        "name": name,
        "tax_type": tax_type,
        "chargeable_unit": str(quantity),
        "unit_price": str(unit_price),
        "amount": str(amount),
        "tax": str(tax),
    }


class TaxDocumentSplitPreviewTest(TestCase):
    def setUp(self):
        self.items = [
            line_item(
                name="딸기우유",
                tax_type="taxable",
                quantity=2,
                unit_price=1000,
                amount=2000,
                tax=200,
            ),
            line_item(
                name="흰우유",
                tax_type="exempt",
                quantity=3,
                unit_price=900,
                amount=2700,
                tax=0,
            ),
        ]

    def test_mixed_preview_balances_source_and_two_documents(self):
        preview = build_split_preview(
            document_tax_type="unclassified",
            transaction_amount=4700,
            tax_amount=200,
            line_items=self.items,
        )

        self.assertTrue(preview["requires_split"])
        self.assertTrue(preview["is_balanced"])
        self.assertEqual(
            [document["document_kind"] for document in preview["documents"]],
            ["tax_invoice", "invoice"],
        )
        self.assertEqual(preview["source_totals"]["total_amount"], 4900)
        self.assertEqual(preview["split_totals"]["total_amount"], 4900)

    def test_zero_rated_line_is_not_auto_split_with_product_tax_type(self):
        zero_rated_item = line_item(
            name="수출 딸기우유",
            tax_type="zero_rated",
            quantity=1,
            unit_price=1000,
            amount=1000,
            tax=0,
        )
        with self.assertRaises(TaxDocumentValidationError):
            build_split_preview(
                document_tax_type="unclassified",
                transaction_amount=3000,
                tax_amount=200,
                line_items=[self.items[0], zero_rated_item],
            )


class TaxDocumentSplitPersistenceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="tax-split@example.com",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Tax Split Factory",
            business_registration_number="123-45-67890",
        )
        self.taxable_product = Product.objects.create(
            factory=self.factory,
            name="딸기우유",
            code="TAX-001",
            unit="EA",
            spec="1L",
            tax_type="taxable",
            tax_type_review_required=False,
        )
        self.exempt_product = Product.objects.create(
            factory=self.factory,
            name="흰우유",
            code="EXEMPT-001",
            unit="EA",
            spec="1L",
            tax_type="exempt",
            tax_type_review_required=False,
        )
        self.source = NationalTaxService.objects.create(
            user=self.user,
            factory=self.factory,
            publish_status="temporary",
            tax_type="unclassified",
            document_kind="tax_invoice",
            transaction_amount=4700,
            tax_amount=200,
            line_items=[
                line_item(
                    name="딸기우유",
                    tax_type="taxable",
                    quantity=2,
                    unit_price=1000,
                    amount=2000,
                    tax=200,
                ) | {"product_id": self.taxable_product.id},
                line_item(
                    name="흰우유",
                    tax_type="exempt",
                    quantity=3,
                    unit_price=900,
                    amount=2700,
                    tax=0,
                ) | {"product_id": self.exempt_product.id},
            ],
        )
        self.project = Project.objects.create(
            name="혼합 거래 생산계획",
            tax_invoice=self.source,
        )

    def add_second_taxable_item(self):
        self.source.line_items.append(
            line_item(
                name="초코우유",
                tax_type="taxable",
                quantity=1,
                unit_price=500,
                amount=500,
                tax=50,
            )
            | {"product_id": self.taxable_product.id}
        )
        self.source.transaction_amount = 5200
        self.source.tax_amount = 250
        self.source.save(
            update_fields=["line_items", "transaction_amount", "tax_amount"]
        )

    def test_split_persists_auditable_group_and_is_idempotent(self):
        first = split_tax_document(tax_service_id=self.source.id, actor=self.user)
        second = split_tax_document(tax_service_id=self.source.id, actor=self.user)

        self.assertTrue(first["created"])
        self.assertFalse(second["created"])
        self.assertEqual(first["group_key"], second["group_key"])
        self.assertEqual(NationalTaxService.objects.count(), 2)
        self.assertEqual(TaxDocumentGroup.objects.count(), 1)

        group = TaxDocumentGroup.objects.get()
        self.assertEqual(group.source_transaction_amount, 4700)
        self.assertEqual(group.source_tax_amount, 200)
        documents = list(group.documents.order_by("tax_type"))
        self.assertEqual({document.tax_type for document in documents}, {"taxable", "exempt"})
        self.assertEqual(sum(document.transaction_amount for document in documents), 4700)
        self.assertEqual(sum(document.tax_amount for document in documents), 200)
        self.assertTrue(first["is_balanced"])
        self.project.refresh_from_db()
        self.assertEqual(self.project.tax_invoice_id, self.source.id)
        self.assertEqual(self.project.tax_invoice.document_group_id, group.id)
        self.assertEqual(self.project.plans.count(), 0)

    def test_group_metadata_is_exposed_for_document_library(self):
        """문서함이 같은 원거래의 문서 수와 그룹 키를 표시할 수 있다."""
        split_tax_document(tax_service_id=self.source.id, actor=self.user)
        group = TaxDocumentGroup.objects.get()
        documents = list(group.documents.order_by("id"))
        for document in documents:
            document._cached_document_group_key = str(group.group_key)
            document._cached_document_group_count = len(documents)

        payload = NationalTaxServiceOut.from_orm(documents[0])

        self.assertEqual(payload.document_group_count, 2)
        self.assertEqual(payload.document_group_key, str(group.group_key))

    def test_same_tax_type_document_can_be_split_and_reset(self):
        self.add_second_taxable_item()
        split_tax_document(tax_service_id=self.source.id, actor=self.user)
        self.source.refresh_from_db()

        split_result = split_group_document(
            tax_service_id=self.source.id,
            selected_line_item_indexes=[1],
            expected_line_item_count=2,
        )

        self.assertTrue(split_result["is_balanced"])
        self.assertEqual(len(split_result["documents"]), 3)
        self.assertEqual(
            len(
                [
                    document
                    for document in split_result["documents"]
                    if document["tax_type"] == "taxable"
                ]
            ),
            2,
        )

        with self.assertRaisesMessage(
            TaxDocumentValidationError,
            "문서의 품목 구성이 변경되었습니다.",
        ):
            split_group_document(
                tax_service_id=self.source.id,
                selected_line_item_indexes=[0],
                expected_line_item_count=2,
            )

        reset_result = reset_group_to_auto_split(tax_service_id=self.source.id)

        self.assertTrue(reset_result["is_balanced"])
        self.assertEqual(len(reset_result["documents"]), 2)
        taxable = next(
            document
            for document in reset_result["documents"]
            if document["tax_type"] == "taxable"
        )
        self.assertEqual(taxable["item_count"], 2)
        self.assertEqual(
            sum(document["totals"]["total_amount"] for document in reset_result["documents"]),
            5450,
        )

    def test_additional_split_requires_one_item_to_remain(self):
        split_tax_document(tax_service_id=self.source.id, actor=self.user)
        self.source.refresh_from_db()

        with self.assertRaisesMessage(
            TaxDocumentValidationError,
            "원본 문서에 최소 한 품목은 남겨야 합니다.",
        ):
            split_group_document(
                tax_service_id=self.source.id,
                selected_line_item_indexes=[0],
                expected_line_item_count=1,
            )

    def test_group_readiness_checks_both_documents_without_external_issue(self):
        FactoryMember.objects.get_or_create(
            factory=self.factory,
            user=self.user,
            defaults={"role": "admin", "status": "active"},
        )
        client = FactoryClient.objects.create(
            factory=self.factory,
            name="Readiness Client",
        )
        split_tax_document(tax_service_id=self.source.id, actor=self.user)
        self.source.refresh_from_db()
        self.source.document_group.documents.update(
            client=client,
            transaction_date=date.today(),
        )

        result = async_to_sync(check_split_tax_document_group_readiness)(
            SimpleNamespace(auth=self.user),
            self.source.id,
        )

        self.assertTrue(result["can_publish"])
        self.assertFalse(result["external_request_sent"])
        self.assertEqual(len(result["documents"]), 2)
        self.assertTrue(all(item["ready"] for item in result["documents"]))

    @override_settings(ENABLE_BAROBILL=True, ENABLE_GROUP_TAX_PUBLISH=True)
    def test_group_publish_retries_only_failed_document(self):
        FactoryMember.objects.get_or_create(
            factory=self.factory,
            user=self.user,
            defaults={"role": "admin", "status": "active"},
        )
        client = FactoryClient.objects.create(
            factory=self.factory,
            name="Publish Client",
        )
        split_tax_document(tax_service_id=self.source.id, actor=self.user)
        self.source.refresh_from_db()
        self.source.document_group.documents.update(
            client=client,
            transaction_date=date.today(),
        )
        document_ids = list(
            self.source.document_group.documents.order_by("id").values_list(
                "id", flat=True
            )
        )
        calls = []

        def fail_second_document(tax_service, factory, issue_client, user):
            calls.append(tax_service.id)
            if tax_service.id == document_ids[1]:
                raise HttpError(400, "테스트 외부 발행 실패")
            return 1

        with patch(
            "tax.api.issue_barobill_tax_invoice",
            side_effect=fail_second_document,
        ):
            first = async_to_sync(publish_split_tax_document_group)(
                SimpleNamespace(auth=self.user), self.source.id
            )

        self.assertFalse(first["all_succeeded"])
        self.assertEqual(calls, document_ids)
        first_document = NationalTaxService.objects.get(id=document_ids[0])
        second_document = NationalTaxService.objects.get(id=document_ids[1])
        self.assertEqual(first_document.publish_status, "published")
        self.assertEqual(second_document.publish_status, "failed")
        self.assertEqual(first_document.publish_attempt_count, 1)
        self.assertEqual(second_document.publish_attempt_count, 1)
        self.assertEqual(second_document.last_publish_error, "테스트 외부 발행 실패")

        readiness = async_to_sync(check_split_tax_document_group_readiness)(
            SimpleNamespace(auth=self.user), self.source.id
        )
        self.assertTrue(readiness["can_publish"])

        retry_calls = []

        def succeed(tax_service, factory, issue_client, user):
            retry_calls.append(tax_service.id)
            return 1

        with patch("tax.api.issue_barobill_tax_invoice", side_effect=succeed):
            retry = async_to_sync(publish_split_tax_document_group)(
                SimpleNamespace(auth=self.user), self.source.id
            )

        self.assertTrue(retry["all_succeeded"])
        self.assertEqual(retry_calls, [document_ids[1]])
        first_document.refresh_from_db()
        second_document.refresh_from_db()
        self.assertEqual(first_document.publish_attempt_count, 1)
        self.assertEqual(second_document.publish_attempt_count, 2)
        self.assertEqual(second_document.publish_status, "published")
        self.assertEqual(second_document.last_publish_error, "")

    def test_group_publish_is_disabled_without_explicit_feature_flag(self):
        with self.assertRaisesMessage(HttpError, "기능 플래그"):
            async_to_sync(publish_split_tax_document_group)(
                SimpleNamespace(auth=self.user), self.source.id
            )
