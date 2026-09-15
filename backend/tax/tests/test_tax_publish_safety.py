from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from threading import Barrier
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from asgiref.sync import async_to_sync
from django.db import close_old_connections
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from ninja.errors import HttpError

from factory.models import Factory, FactoryClient, FactoryMember
from stock.models import Product
from tax.api import get_synced_tax_document_classification, publish_tax_invoice
from tax.models import NationalTaxService
from tax.publish_service import (
    apply_remote_publish_state,
    claim_document_for_publish,
)
from user.models import User


class TaxPublishClaimTest(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.user = User.objects.create_user(
            email="publish-safety@example.com",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Publish Safety Factory",
            business_registration_number="123-45-67890",
        )
        self.document = NationalTaxService.objects.create(
            user=self.user,
            factory=self.factory,
            publish_status="temporary",
        )

    def test_conditional_claim_allows_only_one_concurrent_winner(self):
        barrier = Barrier(2)

        def claim():
            close_old_connections()
            barrier.wait()
            result = claim_document_for_publish(self.document.id)[0]
            close_old_connections()
            return result

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: claim(), range(2)))

        self.assertEqual(results.count("claimed"), 1)
        self.assertEqual(results.count("blocked"), 1)
        self.document.refresh_from_db()
        self.assertEqual(self.document.publish_status, "publishing")
        self.assertEqual(self.document.publish_attempt_count, 1)

    def test_remote_issued_state_completes_abandoned_claim(self):
        self.document.publish_status = "publishing"
        self.document.last_publish_attempt_at = timezone.now() - timedelta(hours=1)
        self.document.save(
            update_fields=["publish_status", "last_publish_attempt_at"]
        )

        resolved = apply_remote_publish_state(
            self.document.id,
            SimpleNamespace(BarobillState=3014, NTSSendState=4),
        )

        self.assertEqual(resolved.publish_status, "published")
        self.assertEqual(resolved.nts_send_state, "전송완료")

    def test_remote_missing_state_makes_abandoned_claim_retryable(self):
        self.document.publish_status = "publishing"
        self.document.last_publish_attempt_at = timezone.now() - timedelta(hours=1)
        self.document.save(
            update_fields=["publish_status", "last_publish_attempt_at"]
        )

        resolved = apply_remote_publish_state(
            self.document.id,
            SimpleNamespace(BarobillState=-21002, NTSSendState=None),
        )

        self.assertEqual(resolved.publish_status, "failed")
        self.assertIn("재시도 가능", resolved.last_publish_error)

    def test_bulk_create_also_generates_management_key(self):
        created = NationalTaxService.objects.bulk_create(
            [NationalTaxService(user=self.user, factory=self.factory)]
        )[0]

        self.assertEqual(len(created.mgt_key), 20)
        self.assertTrue(created.mgt_key.isdigit())


class BarobillSyncMappingTest(TransactionTestCase):
    def test_official_tax_invoice_and_invoice_mapping(self):
        self.assertEqual(
            get_synced_tax_document_classification(
                SimpleNamespace(TaxInvoiceType=1, TaxType=2)
            ),
            ("zero_rated", "tax_invoice"),
        )
        self.assertEqual(
            get_synced_tax_document_classification(
                SimpleNamespace(TaxInvoiceType=2, TaxType=3)
            ),
            ("exempt", "invoice"),
        )


@override_settings(ENABLE_BAROBILL=True)
class SingleTaxPublishEndpointTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="single-publish@example.com",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Single Publish Factory",
            business_registration_number="123-45-67890",
        )
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
        )
        self.client = FactoryClient.objects.create(
            factory=self.factory,
            name="Single Publish Client",
        )
        self.product = Product.objects.create(
            factory=self.factory,
            name="과세 제품",
            code="SINGLE-001",
            unit="EA",
            spec="1EA",
            tax_type="taxable",
            tax_type_review_required=False,
        )
        self.document = NationalTaxService.objects.create(
            user=self.user,
            factory=self.factory,
            client=self.client,
            publish_status="temporary",
            tax_type="taxable",
            document_kind="tax_invoice",
            transaction_date=date.today(),
            transaction_amount=1000,
            tax_amount=100,
            line_items=[
                {
                    "product_id": self.product.id,
                    "tax_type": "taxable",
                    "name": "과세 제품",
                    "chargeable_unit": "1",
                    "unit_price": "1000",
                    "amount": "1000",
                    "tax": "100",
                }
            ],
        )

    def test_failed_single_issue_retries_without_duplicate_success(self):
        request = SimpleNamespace(auth=self.user)
        with (
            patch(
                "tax.api.issue_barobill_tax_invoice",
                side_effect=HttpError(400, "테스트 발행 실패"),
            ),
            patch("tax.api.send_notification_to_factory", new_callable=AsyncMock),
        ):
            with self.assertRaisesMessage(HttpError, "테스트 발행 실패"):
                async_to_sync(publish_tax_invoice)(request, self.document.id)

        self.document.refresh_from_db()
        self.assertEqual(self.document.publish_status, "failed")
        self.assertEqual(self.document.publish_attempt_count, 1)

        with (
            patch("tax.api.issue_barobill_tax_invoice", return_value=1) as issue,
            patch("tax.api.send_notification_to_factory", new_callable=AsyncMock),
        ):
            result = async_to_sync(publish_tax_invoice)(request, self.document.id)

        self.assertEqual(result["message"], "세금계산서가 발행되었습니다.")
        issue.assert_called_once()
        self.document.refresh_from_db()
        self.assertEqual(self.document.publish_status, "published")
        self.assertEqual(self.document.publish_attempt_count, 2)

        with patch("tax.api.issue_barobill_tax_invoice") as duplicate_issue:
            with self.assertRaises(HttpError):
                async_to_sync(publish_tax_invoice)(request, self.document.id)
        duplicate_issue.assert_not_called()
