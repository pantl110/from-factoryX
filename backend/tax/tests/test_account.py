from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from factory.models import Factory, FactoryClient, FactoryMember
from project.models import Project
from tax.models import NationalTaxService, TaxInvoiceAccount, CashReceipt, AccountStatus
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date
import json


User = get_user_model()


class TaxAccountTestCase(TestCase):
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
            f"/v2/account/{tax_invoice.id}?type=tax",
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
            f"/v2/account/{tax_invoice.id}?type=tax",
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
            "/v2/account/99999?type=tax",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("채권/채무 정보를 찾을 수 없습니다", response.json()["detail"])

    def test_get_cash_receipt_account(self):
        """현금영수증 ID로 채권/채무 정보 조회"""
        cash_receipt = CashReceipt.objects.create(
            user=self.user,
            factory=self.factory,
            cash_receipt_type="sales",
            transaction_date=date(2025, 6, 4),
            client=self.client_company,
            transaction_amount=100000,
            tax_amount=10000,
            service_charge=0,
        )
        # 현금영수증용 TaxInvoiceAccount 생성
        TaxInvoiceAccount.objects.create(
            cash_receipt=cash_receipt,
            status=AccountStatus.waiting,
            invoice_sent_count=0,
            total_billed_amount=110000,
            outstanding_balance=110000,
        )

        response = self.client.get(
            f"/v2/account/{cash_receipt.id}?type=cash-receipt",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 채권/채무 기본 정보 검증
        self.assertEqual(data["total_billed_amount"], 110000)
        self.assertEqual(data["outstanding_balance"], 110000)
        self.assertEqual(data["invoice_sent_count"], 0)
        self.assertEqual(data["status"], "waiting")

        # 현금영수증 전체 정보가 중첩 객체로 포함되는지 검증
        self.assertIn("cash_receipt", data)
        self.assertIsInstance(data["cash_receipt"], dict)
        self.assertEqual(data["cash_receipt"]["id"], cash_receipt.id)
        self.assertEqual(data["cash_receipt"]["transaction_amount"], 100000)
        self.assertEqual(data["cash_receipt"]["tax_amount"], 10000)

        # client 정보가 포함되는지 검증
        self.assertIn("client", data)
        self.assertIsNotNone(data["client"])
        self.assertEqual(data["client"]["id"], self.client_company.id)

    def test_update_cash_receipt_account(self):
        """현금영수증 채권/채무 정보 수정"""
        cash_receipt = CashReceipt.objects.create(
            user=self.user,
            factory=self.factory,
            cash_receipt_type="sales",
            transaction_date=date(2025, 6, 4),
            client=self.client_company,
            transaction_amount=100000,
            tax_amount=10000,
            service_charge=0,
        )
        # 현금영수증용 TaxInvoiceAccount 생성
        TaxInvoiceAccount.objects.create(
            cash_receipt=cash_receipt,
            status=AccountStatus.waiting,
            invoice_sent_count=0,
            total_billed_amount=110000,
            outstanding_balance=110000,
        )

        payload = {
            "status": "partial",
            "invoice_sent_count": 2,
            "notes": "테스트 메모",
        }

        response = self.client.patch(
            f"/v2/account/{cash_receipt.id}?type=cash-receipt",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "partial")
        self.assertEqual(data["invoice_sent_count"], 2)
        self.assertEqual(data["notes"], "테스트 메모")

    @patch('tax.api_account.send_mail')
    def test_send_email_for_account(self, mock_send_mail):
        """이메일 발송 및 invoice_sent_count 증가 테스트"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_count = account.invoice_sent_count

        response = self.client.post(
            f"/v2/account/send-email/{tax_invoice.id}",
            data=json.dumps({
                "recipient": "client@example.com",
                "subject": "채권 안내",
                "content": "안녕하세요.",
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["invoice_sent_count"], initial_count + 1)
        account.refresh_from_db()
        self.assertEqual(account.invoice_sent_count, initial_count + 1)

    def test_send_email_for_account_not_found(self):
        """존재하지 않는 세금계산서 ID로 이메일 발송 시도"""
        response = self.client.post(
            "/v2/account/send-email/99999",
            data=json.dumps({
                "recipient": "client@example.com",
                "subject": "채권 안내",
                "content": "안녕하세요.",
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 404)

    @patch('tax.api_account.send_mail')
    def test_send_email_multiple_times_increases_count(self, mock_send_mail):
        """여러 번 이메일 발송 시 invoice_sent_count가 계속 증가하는지 테스트"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_count = account.invoice_sent_count

        payload = {
            "recipient": "client@example.com",
            "subject": "채권 안내",
            "content": "안녕하세요.",
        }

        for i in range(3):
            response = self.client.post(
                f"/v2/account/send-email/{tax_invoice.id}",
                data=json.dumps(payload),
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["invoice_sent_count"], initial_count + i + 1)

        account.refresh_from_db()
        self.assertEqual(account.invoice_sent_count, initial_count + 3)

    @patch('tax.api_account.send_mail')
    def test_send_email_failure_does_not_increase_count(self, mock_send_mail):
        """이메일 발송 실패 시 invoice_sent_count가 증가하지 않는지 테스트"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_count = account.invoice_sent_count

        mock_send_mail.side_effect = Exception("이메일 발송 실패")

        response = self.client.post(
            f"/v2/account/send-email/{tax_invoice.id}",
            data=json.dumps({
                "recipient": "client@example.com",
                "subject": "채권 안내",
                "content": "안녕하세요.",
            }),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 500)
        account.refresh_from_db()
        self.assertEqual(account.invoice_sent_count, initial_count)

    def test_get_cash_receipt_account_not_found(self):
        """존재하지 않는 현금영수증 채권/채무 정보 조회"""
        response = self.client.get(
            "/v2/account/99999?type=cash-receipt",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("현금영수증", response.json()["detail"])
