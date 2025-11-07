from django.test import TestCase
from user.api import router as user_router
from subscription.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from subscription.models import Subscription, SubscriptionHistory, PaymentAuth
from django.utils import timezone
from datetime import timedelta
from asgiref.sync import sync_to_async


class TestSubscriptionService(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            email="test1@example.com",
            password="password1234!",
            status=User.UserStatusChoice.admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
            barobill_user_id="updowney",
        )
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        # 공장 생성
        self.factory = Factory.objects.create(
            name="다운테크",
            owner=self.user,
            business_registration_number="1663301345",
            representative_name="전다운",
            business_address="전남 순천시 선평동선길 36 서면빛찬들아파트 303동 1202호",
            business_type="정보통신업",
            business_category="응용소프트웨어 개발 및 공급업",
            manager_email="updowney@daum.net",
            manager_phone="010-4136-2245",
        )
        # 공장 멤버 생성
        self.member = FactoryMember.objects.create(
            user=self.user,
            factory=self.factory,
            role=FactoryMember.FactoryMemberType.admin,
            invited_by=self.user,
        )
        # 다른 공장 생성
        self.factory2 = Factory.objects.create(
            name="다른 공장",
            owner=self.user,
            business_registration_number="1234567890",
            representative_name="다른 대표",
            business_address="서울시 강남구 테헤란로 123",
            business_type="제조업",
            business_category="전자기기 제조업",
            manager_email="other_manager@example.com",
            manager_phone="010-9876-5432",
        )
        # 다른 공장 멤버 생성
        self.member2 = FactoryMember.objects.create(
            user=self.user,
            factory=self.factory2,
            role=FactoryMember.FactoryMemberType.admin,
            invited_by=self.user,
        )
        # subscription 생성
        self.subscription = Subscription.objects.create(
            type=Subscription.SubscriptionType.basic,
            price=50000,
            tax_invoice_count=10,
        )
        # subscription history 생성
        self.subscription_history = SubscriptionHistory.objects.create(
            subscription=self.subscription,
            factory=self.factory,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def get_refresh_token(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return data.get("refresh_token")

    async def test_subscription_list(self):
        """구독 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        data = response.json()
        # print("🐍 File: tests/test_api.py | Line: 79 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)

    async def test_subscription_histories(self):
        """공장 구독 내역 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.factory.id}", headers=headers)
        data = response.json()
        # print("🐍 File: tests/test_api.py | Line: 90 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)

    # async def test_create_subscription_history(self):
    #     """공장 구독 생성 테스트"""
    #     headers = await self.authenticate()
    #     payload = {
    #         "subscription": self.subscription.id,
    #     }
    #     response = await self.client.post(
    #         f"/{self.factory2.id}", json=payload, headers=headers
    #     )
    #     data = response.json()
    #     # print("🐍 File: tests/test_api.py | Line: 102 | setUp ~ data", data)
    #     self.assertEqual(response.status_code, 201)

    async def test_cancel_scheduled_subscription_success(self):
        """예정된 구독 취소 성공 테스트"""
        headers = await self.authenticate()
        
        # 현재 활성 구독 생성 (한 달 구독)
        current_end_date = (timezone.now() + timedelta(days=30)).date()
        current_subscription = await sync_to_async(SubscriptionHistory.objects.create)(
            subscription=self.subscription,
            factory=self.factory,
            start_date=timezone.now().date(),
            end_date=current_end_date,
            is_canceled=False,
        )
        
        # 다음 날에 시작하는 예정된 구독 생성 (한 달 구독)
        next_day = current_end_date + timedelta(days=1)
        scheduled_subscription = await sync_to_async(SubscriptionHistory.objects.create)(
            subscription=self.subscription,
            factory=self.factory,
            start_date=next_day,
            end_date=next_day + timedelta(days=30),
            is_canceled=False,
        )
        
        # 예정된 구독 취소 API 호출
        response = await self.client.delete(
            f"/scheduled-history/{self.factory.id}", headers=headers
        )
        data = response.json()
        
        # 응답 검증
        self.assertEqual(response.status_code, 200)
        
        # 예정된 구독이 삭제되었는지 확인
        scheduled_exists = await sync_to_async(
            SubscriptionHistory.objects.filter(id=scheduled_subscription.id).exists
        )()
        self.assertFalse(scheduled_exists)
        
        # 현재 구독은 유지되는지 확인
        current_exists = await sync_to_async(
            SubscriptionHistory.objects.filter(id=current_subscription.id).exists
        )()
        self.assertTrue(current_exists)

    async def test_trial_to_partners_transition(self):
        """트라이얼에서 파트너스로 전환 테스트 - 트라이얼은 어제로 종료, 파트너스는 오늘부터 시작"""
        from unittest.mock import patch, MagicMock
        from dateutil.relativedelta import relativedelta
        
        headers = await self.authenticate()
        
        # setUp에서 생성된 basic 구독 히스토리 삭제 (트라이얼 테스트를 위해)
        await sync_to_async(SubscriptionHistory.objects.filter(factory=self.factory).delete)()
        
        # 트라이얼 구독 생성
        trial_subscription = await sync_to_async(Subscription.objects.create)(
            type=Subscription.SubscriptionType.trial,
            price=0,
            tax_invoice_count=5,
        )
        
        # 파트너스 구독 생성
        partners_subscription = await sync_to_async(Subscription.objects.create)(
            type=Subscription.SubscriptionType.partners,
            price=100000,
            tax_invoice_count=1000,
        )
        
        # 트라이얼 구독 히스토리 생성 (오늘부터 30일 후까지)
        today = timezone.now().date()
        trial_end_date = today + timedelta(days=30)
        trial_history = await sync_to_async(SubscriptionHistory.objects.create)(
            subscription=trial_subscription,
            factory=self.factory,
            start_date=today,
            end_date=trial_end_date,
            is_canceled=False,
        )
        
        # PaymentAuth 생성 (빌링키 필요)
        payment_auth = await sync_to_async(PaymentAuth.objects.create)(
            factory=self.factory,
            customer_key="test_customer_key_123",
            billing_key="test_billing_key_123",
            card_company="현대카드",
            card_number="433012******1234",
        )
        
        # Mock 설정 - 토스페이먼츠 결제 요청
        with patch("subscription.services.TossPaymentsService.request_billing_payment") as mock_payment:
            mock_payment.return_value = {
                "paymentKey": "test_payment_key_123",
                "method": "카드",
                "status": "DONE",
                "card": {
                    "issuerCode": "20",
                    "cardType": "신용",
                    "number": "433012******1234",
                    "ownerType": "개인",
                },
            }
            
            # 트라이얼에서 파트너스로 결제 진행
            response = await self.client.post(
                f"/payment/{self.factory.id}",
                json={
                    "subscription_id": partners_subscription.id,
                    "billing_key": "test_billing_key_123",
                    "customer_key": "test_customer_key_123",
                },
                headers=headers,
            )
            
            # 응답 검증
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["subscription_type"], "partners")
            self.assertEqual(data["status"], "DONE")
            
            # 트라이얼 구독 히스토리 확인 - end_date가 어제로 변경되었는지 확인
            yesterday = today - timedelta(days=1)
            # DB에서 다시 조회하여 변경사항 확인
            updated_trial_history = await sync_to_async(
                SubscriptionHistory.objects.get
            )(id=trial_history.id)
            self.assertEqual(updated_trial_history.end_date, yesterday, 
                           f"트라이얼의 end_date가 어제({yesterday})로 변경되어야 하는데 {updated_trial_history.end_date}입니다.")
            
            # 파트너스 구독 히스토리 확인
            partners_history = await sync_to_async(
                SubscriptionHistory.objects.filter(
                    factory=self.factory,
                    subscription=partners_subscription
                ).first
            )()
            
            self.assertIsNotNone(partners_history, "파트너스 구독 히스토리가 생성되어야 합니다.")
            self.assertEqual(partners_history.start_date, today,
                           f"파트너스의 start_date가 오늘({today})로 설정되어야 하는데 {partners_history.start_date}입니다.")
            self.assertEqual(partners_history.is_canceled, False,
                           "파트너스 구독이 활성화되어야 합니다.")
            
            # 파트너스 구독의 end_date가 시작일 기준 한 달 후로 설정되었는지 확인
            expected_end_date = today + relativedelta(months=1)
            self.assertEqual(partners_history.end_date, expected_end_date,
                           f"파트너스의 end_date가 시작일 기준 한 달 후({expected_end_date})로 설정되어야 하는데 {partners_history.end_date}입니다.")
            
            # Payment 객체가 생성되었는지 확인
            from subscription.models import Payment
            payment_exists = await sync_to_async(
                Payment.objects.filter(
                    subscription_history=partners_history,
                    payment_key="test_payment_key_123"
                ).exists
            )()
            self.assertTrue(payment_exists, "Payment 객체가 생성되어야 합니다.")