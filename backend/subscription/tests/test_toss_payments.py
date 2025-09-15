from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryMember
from subscription.models import Subscription, SubscriptionHistory, Payment
from subscription.services import TossPaymentsService, SubscriptionBillingService
from subscription.exceptions import PaymentError, BillingKeyError
from user.models import EmailVerification
from django.utils import timezone
from datetime import timedelta, date
from unittest.mock import patch, MagicMock
from asgiref.sync import sync_to_async
import json

User = get_user_model()


class SubscriptionAPITestCase(TestCase):
    def setUp(self):
        """테스트 데이터 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123!",
            status=User.UserStatusChoice.admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
        )

        # 이메일 인증 생성
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # 공장 생성
        self.factory = Factory.objects.create(
            name="테스트 공장",
            owner=self.user,
            business_registration_number="1234567890",
            representative_name="테스트 대표",
            business_address="테스트 주소",
            business_type="제조업",
            business_category="테스트 카테고리",
            manager_email="manager@test.com",
            manager_phone="010-1234-5678",
        )

        # 공장 멤버 생성
        self.member = FactoryMember.objects.create(
            user=self.user,
            factory=self.factory,
            role=FactoryMember.FactoryMemberType.admin,
            invited_by=self.user,
        )

        # 구독 플랜 생성
        self.subscription_basic = Subscription.objects.create(
            type=Subscription.SubscriptionType.basic,
            price=50000,
            tax_invoice_count=100,
        )

        self.subscription_partners = Subscription.objects.create(
            type=Subscription.SubscriptionType.partners,
            price=100000,
            tax_invoice_count=500,
        )

    async def test_subscription_list(self):
        """구독 플랜 목록 조회 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        client = TestAsyncClient(router)
        response = await client.get("")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data["data"]), 2)

    @patch("subscription.services.TossPaymentsService.issue_billing_key")
    async def test_issue_billing_key_success(self, mock_issue_billing_key):
        """빌링키 발급 성공 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # Mock 설정
        mock_issue_billing_key.return_value = {
            "billingKey": "test_billing_key_123",
            "card": {
                "company": "현대카드",
                "cardType": "신용",
                "number": "433012******1234",
            },
        }

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.post(
            f"/billing-key/{self.factory.id}",
            json={
                "card_number": "4330123456781234",
                "card_expiry_year": "25",
                "card_expiry_month": "12",
                "card_password": "12",
                "customer_identity_number": "950101",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["billing_key"], "test_billing_key_123")
        self.assertEqual(data["card_company"], "현대카드")

    @patch("subscription.services.TossPaymentsService.request_billing_payment")
    async def test_subscription_payment_success(self, mock_payment):
        """구독 결제 성공 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # Mock 설정
        mock_payment.return_value = {
            "paymentKey": "test_payment_key_123",
            "method": "카드",
            "status": "DONE",
        }

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.post(
            f"/payment/{self.factory.id}",
            json={
                "subscription_id": self.subscription_basic.id,
                "billing_key": "test_billing_key_123",
                "customer_key": "test_customer_key_123",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["payment_key"], "test_payment_key_123")
        self.assertEqual(data["status"], "DONE")

        # DB에 결제 및 구독 히스토리가 생성되었는지 확인
        self.assertTrue(
            await SubscriptionHistory.objects.filter(
                factory=self.factory, subscription=self.subscription_basic
            ).aexists()
        )
        self.assertTrue(
            await Payment.objects.filter(
                payment_key="test_payment_key_123", status="DONE"
            ).aexists()
        )

    async def test_payment_history(self):
        """결제 내역 조회 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # 테스트 데이터 생성
        subscription_history = await SubscriptionHistory.objects.acreate(
            factory=self.factory,
            subscription=self.subscription_basic,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            billing_key="test_billing_key",
            customer_key="test_customer_key",
        )

        await Payment.objects.acreate(
            subscription_history=subscription_history,
            payment_key="test_payment_key",
            order_id="test_order_123",
            amount=50000,
            status="DONE",
            method="카드",
            approved_at=timezone.now(),
        )

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.get(
            f"/payments/{self.factory.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data["data"]), 0)
        self.assertEqual(data["data"][0]["payment_key"], "test_payment_key")

    async def test_subscription_status(self):
        """구독 상태 조회 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # 활성 구독 생성
        subscription_history = await SubscriptionHistory.objects.acreate(
            factory=self.factory,
            subscription=self.subscription_basic,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=15)).date(),
            billing_key="test_billing_key",
            customer_key="test_customer_key",
        )

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.get(
            f"/status/{self.factory.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_active"])
        self.assertIsNotNone(data["next_billing_date"])

    async def _get_jwt_token(self):
        """JWT 토큰 획득"""
        from api.testing import TestAsyncClient
        from user.api import router as user_router

        auth_client = TestAsyncClient(user_router)
        response = await auth_client.post(
            "/login", json={"email": self.user.email, "password": "password123!"}
        )
        return response.json()["access_token"]


class TossPaymentsServiceTestCase(TestCase):
    def setUp(self):
        self.service = TossPaymentsService()

    @patch("requests.post")
    def test_issue_billing_key_success(self, mock_post):
        """빌링키 발급 성공 테스트"""
        # Mock response 설정
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "billingKey": "test_billing_key_123",
            "card": {"company": "현대카드", "cardType": "신용"},
        }
        mock_post.return_value = mock_response

        result = self.service.issue_billing_key(
            customer_key="test_customer_123",
            card_number="4330123456781234",
            card_expiry_year="25",
            card_expiry_month="12",
            card_password="12",
            customer_identity_number="950101",
        )

        self.assertEqual(result["billingKey"], "test_billing_key_123")
        self.assertEqual(result["card"]["company"], "현대카드")

    @patch("requests.post")
    def test_request_billing_payment_success(self, mock_post):
        """빌링 결제 성공 테스트"""
        # Mock response 설정
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "paymentKey": "test_payment_key_123",
            "method": "카드",
            "status": "DONE",
        }
        mock_post.return_value = mock_response

        result = self.service.request_billing_payment(
            billing_key="test_billing_key_123",
            customer_key="test_customer_123",
            amount=50000,
            order_id="test_order_123",
            order_name="기본 플랜 구독료",
        )

        self.assertEqual(result["paymentKey"], "test_payment_key_123")
        self.assertEqual(result["method"], "카드")

    @patch("requests.post")
    def test_payment_failure_handling(self, mock_post):
        """결제 실패 처리 테스트"""
        # Mock response 설정 (실패)
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "code": "INSUFFICIENT_FUNDS",
            "message": "잔액이 부족합니다.",
        }
        mock_response.content = True
        mock_post.return_value = mock_response

        with self.assertRaises(PaymentError) as context:
            self.service.request_billing_payment(
                billing_key="test_billing_key_123",
                customer_key="test_customer_123",
                amount=50000,
                order_id="test_order_123",
                order_name="기본 플랜 구독료",
            )

        self.assertIn("잔액이 부족합니다", str(context.exception))


class SubscriptionBillingServiceTestCase(TestCase):
    def setUp(self):
        self.service = SubscriptionBillingService()

        # 테스트 데이터 생성
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123!",
            terms_of_service=True,
            privacy_policy_agreement=True,
        )

        self.factory = Factory.objects.create(
            name="테스트 공장",
            owner=self.user,
            business_registration_number="1234567890",
            representative_name="테스트 대표",
            business_address="테스트 주소",
        )
        self.factory_member = FactoryMember.objects.create(
            user=self.user,
            factory=self.factory,
            role=FactoryMember.FactoryMemberType.admin,
        )

        self.subscription = Subscription.objects.create(
            type=Subscription.SubscriptionType.basic,
            price=50000,
            tax_invoice_count=100,
        )

        self.subscription_history = SubscriptionHistory.objects.create(
            factory=self.factory,
            subscription=self.subscription,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            billing_key="test_billing_key",
            customer_key="test_customer_key",
        )

    async def _get_jwt_token(self):
        """JWT 토큰 획득"""
        from api.testing import TestAsyncClient
        from user.api import router as user_router

        auth_client = TestAsyncClient(user_router)
        response = await auth_client.post(
            "/login", json={"email": self.user.email, "password": "password123!"}
        )
        return response.json()["access_token"]

    @patch("subscription.services.TossPaymentsService.request_billing_payment")
    def test_process_subscription_payment_success(self, mock_payment):
        """구독 결제 처리 성공 테스트"""
        # Mock 설정
        mock_payment.return_value = {
            "paymentKey": "test_payment_key_123",
            "method": "카드",
        }

        payment = self.service.process_subscription_payment(self.subscription_history)

        self.assertEqual(payment.status, "DONE")
        self.assertEqual(payment.payment_key, "test_payment_key_123")
        self.assertIsNotNone(payment.approved_at)

    async def test_cancel_payment_success(self):
        """결제 취소 성공 테스트 (환불 없이 구독 취소)"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # 결제 생성
        payment = await Payment.objects.acreate(
            subscription_history=self.subscription_history,
            payment_key="test_payment_key_123",
            order_id="test_order_123",
            amount=50000,
            status="DONE",
            approved_at=timezone.now(),
        )

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.post(
            f"/cancel/{payment.id}",
            json={
                "cancel_reason": "사용자 요청으로 인한 취소",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        data = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["payment_key"], "test_payment_key_123")
        self.assertEqual(data["cancel_amount"], 0)  # 환불 금액은 0
        self.assertEqual(data["cancel_reason"], "사용자 요청으로 인한 취소")

        # 구독 히스토리가 취소 상태로 변경되었는지 확인
        await sync_to_async(self.subscription_history.refresh_from_db)()
        self.assertTrue(self.subscription_history.is_canceled)

        # 결제 상태는 그대로 유지되는지 확인 (환불하지 않음)
        await sync_to_async(payment.refresh_from_db)()
        self.assertEqual(payment.status, "DONE")

    async def test_cancel_payment_already_canceled(self):
        """이미 취소된 구독 취소 시도 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # 이미 취소된 구독 히스토리 설정
        self.subscription_history.is_canceled = True
        await self.subscription_history.asave()

        # 결제 생성
        payment = await Payment.objects.acreate(
            subscription_history=self.subscription_history,
            payment_key="test_payment_key_123",
            order_id="test_order_123",
            amount=50000,
            status="DONE",
            approved_at=timezone.now(),
        )

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.post(
            f"/cancel/{payment.id}",
            json={
                "cancel_reason": "사용자 요청으로 인한 취소",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("이미 취소된 구독입니다", response.json()["detail"])

    async def test_renew_subscription_canceled_fails(self):
        """취소된 구독 갱신 시도 실패 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # 취소된 구독 히스토리 설정
        self.subscription_history.is_canceled = True
        await self.subscription_history.asave()

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.post(
            f"/renewal/{self.factory.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("취소된 구독은 갱신할 수 없습니다", response.json()["detail"])

    async def test_subscription_status_canceled(self):
        """취소된 구독 상태 조회 테스트"""
        from api.testing import TestAsyncClient
        from subscription.api import router

        # 구독 취소 상태로 설정
        self.subscription_history.is_canceled = True
        await self.subscription_history.asave()

        # 결제 생성
        payment = await Payment.objects.acreate(
            subscription_history=self.subscription_history,
            payment_key="test_payment_key_123",
            order_id="test_order_123",
            amount=50000,
            status="DONE",
            approved_at=timezone.now(),
        )

        client = TestAsyncClient(router)
        token = await self._get_jwt_token()

        response = await client.get(
            f"/status/{self.factory.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 취소된 구독은 비활성 상태여야 함
        self.assertFalse(data["is_active"])
        # 다음 결제일은 None이어야 함
        self.assertIsNone(data["next_billing_date"])
