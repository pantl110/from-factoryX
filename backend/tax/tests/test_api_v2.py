from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from project.models import Project
from tax.models import NationalTaxService, TaxInvoiceAccount
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date


User = get_user_model()


class TaxAPIV2TestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.factory = Factory.objects.create(name="테스트 공장", owner=self.user)
        FactoryMember.objects.create(factory=self.factory, user=self.user, role="admin")
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="테스트 거래처",
            business_registration_number="123-45-67890",
            bank_name="테스트은행",
            account_number="123-456-789012",
            account_holder="테스트 예금주",
            depositor_name="테스트 입금자",
        )
        self.token = jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def test_get_tax_invoice_account(self):
        """세금계산서 ID로 채권/채무 정보 조회"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )

        response = self.client.get(
            f"/v2/tax/account/{tax_invoice.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 채권/채무 기본 정보 검증
        self.assertEqual(data["total_billed_amount"], 110000)
        self.assertEqual(data["outstanding_balance"], 110000)
        self.assertEqual(data["invoice_sent_count"], 0)
        self.assertEqual(data["status"], "waiting")

        # 세금계산서 전체 정보가 중첩 객체로 포함되는지 검증
        self.assertIn("tax_invoice", data)
        self.assertIsInstance(data["tax_invoice"], dict)
        self.assertEqual(data["tax_invoice"]["id"], tax_invoice.id)
        self.assertEqual(data["tax_invoice"]["transaction_amount"], 100000)
        self.assertEqual(data["tax_invoice"]["tax_amount"], 10000)

        # client 정보가 포함되는지 검증
        self.assertIn("client", data)
        self.assertIsNotNone(data["client"])
        self.assertEqual(data["client"]["id"], self.client_company.id)
        self.assertEqual(data["client"]["name"], "테스트 거래처")
        self.assertEqual(data["client"]["business_registration_number"], "123-45-67890")
        
        # 계좌 정보가 포함되는지 검증
        self.assertEqual(data["client"]["bank_name"], "테스트은행")
        self.assertEqual(data["client"]["account_number"], "123-456-789012")
        self.assertEqual(data["client"]["account_holder"], "테스트 예금주")
        self.assertEqual(data["client"]["depositor_name"], "테스트 입금자")

    def test_get_tax_invoice_account_includes_project_id_in_tax_invoice(self):
        """세금계산서에 연결된 프로젝트 ID가 tax_invoice.project_id로 내려오는지 검증"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=200000,
            tax_amount=20000,
            publish_status="published",
        )
        project = Project.objects.create(
            name="테스트 프로젝트",
            tax_invoice=tax_invoice,
        )

        response = self.client.get(
            f"/v2/tax/account/{tax_invoice.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("tax_invoice", data)
        self.assertIn("project_id", data["tax_invoice"])
        self.assertEqual(data["tax_invoice"]["project_id"], project.id)

    def test_tax_invoice_account_auto_create_on_publish(self):
        """published 상태로 변경 시 TaxInvoiceAccount 자동 생성"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="temporary",
        )
        self.assertFalse(TaxInvoiceAccount.objects.filter(tax_invoice=tax_invoice).exists())

        tax_invoice.publish_status = "published"
        tax_invoice.save()

        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        self.assertEqual(account.total_billed_amount, 110000)
        self.assertEqual(account.outstanding_balance, 110000)

    def test_tax_invoice_account_deleted_on_tax_invoice_delete(self):
        """세금계산서 삭제 시 TaxInvoiceAccount도 자동 삭제"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )
        account_id = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice).id

        tax_invoice.delete()

        self.assertFalse(TaxInvoiceAccount.objects.filter(id=account_id).exists())

    def test_get_tax_invoice_account_not_found(self):
        """존재하지 않는 채권/채무 정보 조회"""
        response = self.client.get(
            "/v2/tax/account/99999",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("채권/채무 정보를 찾을 수 없습니다", response.json()["detail"])
