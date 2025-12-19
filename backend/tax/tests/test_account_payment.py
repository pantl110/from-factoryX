from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import NationalTaxService, TaxInvoiceAccount, PaymentDetail
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date


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

    def test_get_payment_details(self):
        """세금계산서 ID로 회수/지급 상세내역 조회"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)

        # 회수 상세내역 생성
        payment1 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 1),
            amount_received=50000,
            outstanding_amount_at_payment=60000,
            expected_payment_date=date(2025, 7, 1),
        )
        payment2 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 7, 15),
            amount_received=30000,
            outstanding_amount_at_payment=30000,
            expected_payment_date=date(2025, 7, 15),
        )
        payment3 = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 8, 1),
            amount_received=30000,
            outstanding_amount_at_payment=0,
            expected_payment_date=date(2025, 8, 1),
        )

        response = self.client.get(
            f"/v2/account-payment/{tax_invoice.id}?page=1&page_size=10",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 페이지네이션 응답 형식 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIsInstance(data["data"], list)
        self.assertEqual(len(data["data"]), 3)
        self.assertEqual(data["totalCnt"], 3)

        # 입금예정일 기준 내림차순 정렬 확인 (가장 최근 날짜가 첫 번째)
        self.assertEqual(data["data"][0]["id"], payment3.id)
        self.assertEqual(data["data"][0]["payment_date"], "2025-08-01")
        self.assertEqual(data["data"][1]["id"], payment2.id)
        self.assertEqual(data["data"][1]["payment_date"], "2025-07-15")
        self.assertEqual(data["data"][2]["id"], payment1.id)
        self.assertEqual(data["data"][2]["payment_date"], "2025-07-01")

        # 각 상세내역의 필드 검증
        first_payment = data["data"][0]
        self.assertEqual(first_payment["amount_received"], 30000)
        self.assertEqual(first_payment["outstanding_amount_at_payment"], 0)
        self.assertEqual(first_payment["expected_payment_date"], "2025-08-01")
        self.assertEqual(first_payment["tax_invoice_account"], account.id)

    def test_get_payment_details_empty(self):
        """회수/지급 상세내역이 없는 경우 빈 리스트 반환"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )

        response = self.client.get(
            f"/v2/account-payment/{tax_invoice.id}?page=1&page_size=10",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        self.assertEqual(len(data["data"]), 0)
        self.assertEqual(data["totalCnt"], 0)

    def test_get_payment_details_not_found(self):
        """존재하지 않는 세금계산서 ID로 회수/지급 상세내역 조회"""
        response = self.client.get(
            "/v2/account-payment/99999",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("채권/채무 정보를 찾을 수 없습니다", response.json()["detail"])

    def test_get_payment_details_with_overdue(self):
        """입금예정일이 있는 회수/지급 상세내역 조회"""
        tax_invoice = NationalTaxService.objects.create(
            factory=self.factory,
            client=self.client_company,
            transaction_date=date(2025, 6, 4),
            transaction_amount=100000,
            tax_amount=10000,
            publish_status="published",
        )
        account = TaxInvoiceAccount.objects.get(tax_invoice=tax_invoice)

        payment = PaymentDetail.objects.create(
            tax_invoice_account=account,
            payment_date=date(2025, 8, 15),
            amount_received=50000,
            outstanding_amount_at_payment=60000,
            expected_payment_date=date(2025, 8, 10),
        )

        response = self.client.get(
            f"/v2/account-payment/{tax_invoice.id}?page=1&page_size=10",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["totalCnt"], 1)
        self.assertEqual(data["data"][0]["expected_payment_date"], "2025-08-10")
        self.assertEqual(data["data"][0]["amount_received"], 50000)
        self.assertEqual(data["data"][0]["outstanding_amount_at_payment"], 60000)
