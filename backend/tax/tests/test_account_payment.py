from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import NationalTaxService, TaxInvoiceAccount, PaymentDetail, CashReceipt, AccountStatus
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date
import json


User = get_user_model()


class TaxAccountPaymentTestCase(TestCase):
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

    def _create_tax_invoice(self):
        return NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )

    def _create_payment_payload(self, amount=50000, payment_date="2025-07-01"):
        return {
            "payment_date": payment_date,
            "amount_received": amount,
            "expected_payment_date": payment_date,
        }

    def test_get_payment_details(self):
        """회수/지급 상세내역 조회"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)

        PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 1),
            amount_received=50000,
            outstanding_amount_at_payment=60000,
            expected_payment_date=date(2025, 7, 1),
        )

        response = self.client.get(
            f"/v2/account-payment/{tax_invoice.id}?type=tax&page=1&page_size=10",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["amount_received"], 50000)

    def test_get_payment_details_not_found(self):
        """존재하지 않는 ID로 조회 시 404"""
        response = self.client.get(
            "/v2/account-payment/99999?type=tax",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_create_payment_detail(self):
        """회수/지급 상세내역 생성"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        response = self.client.post(
            f"/v2/account-payment/{tax_invoice.id}?type=tax",
            data=json.dumps(self._create_payment_payload()),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 201)
        account.refresh_from_db()
        self.assertEqual(account.outstanding_balance, initial_balance - 50000)

    def test_create_payment_detail_validation_error(self):
        """필수 필드 누락 시 validation error"""
        tax_invoice = self._create_tax_invoice()
        
        response = self.client.post(
            f"/v2/account-payment/{tax_invoice.id}?type=tax",
            data=json.dumps({"amount_received": 50000}),  # payment_date 누락
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 422)

    def test_create_payment_detail_account_status(self):
        """생성 시 account 상태 업데이트"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        response = self.client.post(
            f"/v2/account-payment/{tax_invoice.id}?type=tax",
            data=json.dumps(self._create_payment_payload(amount=initial_balance)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 201)
        account.refresh_from_db()
        self.assertEqual(account.status, AccountStatus.completed)

    def test_update_payment_detail(self):
        """회수/지급 상세내역 수정"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        payment = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 6, 5),
            amount_received=30000,
            outstanding_amount_at_payment=initial_balance - 30000,
        )
        account.outstanding_balance -= 30000
        account.save()

        response = self.client.patch(
            f"/v2/account-payment/payment/{payment.id}",
            data=json.dumps(self._create_payment_payload(amount=50000)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        account.refresh_from_db()
        self.assertEqual(account.outstanding_balance, initial_balance - 50000)

    def test_update_payment_detail_negative_balance(self):
        """잔액 초과 수정 시 400"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        payment = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 6, 5),
            amount_received=30000,
            outstanding_amount_at_payment=initial_balance - 30000,
        )
        account.outstanding_balance -= 30000
        account.save()

        response = self.client.patch(
            f"/v2/account-payment/payment/{payment.id}",
            data=json.dumps(self._create_payment_payload(amount=initial_balance + 10000)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_delete_payment_detail(self):
        """회수/지급 상세내역 삭제"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        payment = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 6, 5),
            amount_received=30000,
            outstanding_amount_at_payment=initial_balance - 30000,
        )
        account.outstanding_balance -= 30000
        account.save()

        response = self.client.delete(
            f"/v2/account-payment/payment/{payment.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(PaymentDetail.objects.filter(id=payment.id).exists())
        account.refresh_from_db()
        self.assertEqual(account.outstanding_balance, initial_balance)
