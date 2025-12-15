from django.test import TestCase
from user.api import router as user_router
from subscription.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from subscription.models import Subscription, SubscriptionHistory, PaymentAuth
from datetime import timedelta, datetime, date
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
            start_date=date.today(),
            end_date=(datetime.now() + timedelta(days=30)).date(),
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

    async def test_create_subscription_history(self):
        """공장 구독 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "subscription": self.subscription.id,
        }
        response = await self.client.post(
            f"/{self.factory2.id}", json=payload, headers=headers
        )
        # Check status code first before trying to parse JSON
        if response.status_code != 201:
            # If not 201, check what the actual error is
            try:
                error_data = response.json()
                self.fail(f"Expected 201, got {response.status_code}: {error_data}")
            except:
                self.fail(f"Expected 201, got {response.status_code}: {response.content}")
        data = response.json()
        # print("🐍 File: tests/test_api.py | Line: 102 | setUp ~ data", data)
        self.assertEqual(response.status_code, 201)

    async def test_cancel_scheduled_subscription_success(self):
        """예정된 구독 취소 성공 테스트"""
        headers = await self.authenticate()
        
        # 현재 활성 구독 생성 (한 달 구독)
        current_end_date = (datetime.now() + timedelta(days=30)).date()
        current_subscription = await sync_to_async(SubscriptionHistory.objects.create)(
            subscription=self.subscription,
            factory=self.factory,
            start_date=date.today(),
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