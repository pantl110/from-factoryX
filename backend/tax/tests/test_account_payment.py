from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import NationalTaxService, TaxInvoiceAccount, PaymentDetail, AccountStatus
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

    def test_get_payment_details_sorted_by_date(self):
        """지급일 기준 최신순 정렬 확인"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)

        payment1 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 1),
            amount_received=30000,
            outstanding_amount_at_payment=80000,
        )
        payment2 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 8, 1),
            amount_received=20000,
            outstanding_amount_at_payment=60000,
        )

        response = self.client.get(
            f"/v2/account-payment/{tax_invoice.id}?type=tax&page=1&page_size=10",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        # 최신순 정렬 확인
        self.assertEqual(data["data"][0]["id"], payment2.id)
        self.assertEqual(data["data"][1]["id"], payment1.id)

    def test_create_payment_detail_recalculates_balance(self):
        """생성 시 모든 잔액이 날짜순으로 재계산"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        # 첫 번째 생성
        self.client.post(
            f"/v2/account-payment/{tax_invoice.id}?type=tax",
            data=json.dumps(self._create_payment_payload(amount=30000, payment_date="2025-07-01")),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        
        # 두 번째 생성
        self.client.post(
            f"/v2/account-payment/{tax_invoice.id}?type=tax",
            data=json.dumps(self._create_payment_payload(amount=20000, payment_date="2025-07-15")),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        payments = PaymentDetail.objects.filter(tax_invoice_account=account).order_by("payment_date")
        self.assertEqual(len(payments), 2)
        # 날짜순으로 잔액이 누적 차감됨
        self.assertEqual(payments[0].outstanding_amount_at_payment, initial_balance - 30000)
        self.assertEqual(payments[1].outstanding_amount_at_payment, initial_balance - 50000)
        
        account.refresh_from_db()
        self.assertEqual(account.outstanding_balance, initial_balance - 50000)

    def test_update_payment_detail_recalculates_balance(self):
        """수정 시 모든 잔액이 날짜순으로 재계산"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        payment1 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 1),
            amount_received=30000,
            outstanding_amount_at_payment=initial_balance - 30000,
        )
        PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 15),
            amount_received=20000,
            outstanding_amount_at_payment=initial_balance - 50000,
        )

        # payment1 금액 수정
        self.client.patch(
            f"/v2/account-payment/payment/{payment1.id}",
            data=json.dumps(self._create_payment_payload(amount=40000, payment_date="2025-07-01")),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        account.refresh_from_db()
        self.assertEqual(account.outstanding_balance, initial_balance - 60000)
        
        # 모든 잔액이 재계산되었는지 확인
        payment1.refresh_from_db()
        self.assertEqual(payment1.outstanding_amount_at_payment, initial_balance - 40000)

    def test_delete_payment_detail_recalculates_balance(self):
        """삭제 시 모든 잔액이 날짜순으로 재계산"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        payment1 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 1),
            amount_received=30000,
            outstanding_amount_at_payment=initial_balance - 30000,
        )
        payment2 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 15),
            amount_received=20000,
            outstanding_amount_at_payment=initial_balance - 50000,
        )

        self.client.delete(
            f"/v2/account-payment/payment/{payment1.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertFalse(PaymentDetail.objects.filter(id=payment1.id).exists())
        account.refresh_from_db()
        payment2.refresh_from_db()
        self.assertEqual(account.outstanding_balance, initial_balance - 20000)
        self.assertEqual(payment2.outstanding_amount_at_payment, initial_balance - 20000)

    def test_create_payment_detail_account_status(self):
        """생성 시 account 상태 업데이트"""
        tax_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)
        initial_balance = account.outstanding_balance

        self.client.post(
            f"/v2/account-payment/{tax_invoice.id}?type=tax",
            data=json.dumps(self._create_payment_payload(amount=initial_balance)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        account.refresh_from_db()
        self.assertEqual(account.status, AccountStatus.completed)

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

        response = self.client.patch(
            f"/v2/account-payment/payment/{payment.id}",
            data=json.dumps(self._create_payment_payload(amount=initial_balance + 10000)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
