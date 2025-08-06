from django.test import TestCase
from user.api import router as user_router
from notification.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryMember
from asgiref.sync import sync_to_async
from datetime import datetime, timezone
from notification.models import Notification


class TestFactoryMember(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            username="testuser",
            password="password1234!",
            email="testuser@example.com",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )
        # 테스트용 공장 멤버 등록 - 명시적으로 active 상태로 설정
        self.member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status="active",  # 명시적으로 active 상태로 설정
            invited_by=self.user,
        )
        self.notification = Notification.objects.create(
            receiver=self.member,
            content="This is a test notification.",
        )
        self.notification2 = Notification.objects.create(
            receiver=self.member,
            content="This is another test notification.",
            is_read=False,  # 읽지 않은 알림
        )

    async def authenticate(self):
        """Obtain JWT access token and return Authorization headers."""
        data = {
            "email": self.user.email,
            "password": "password1234!",  # password validation is disabled in user.api.login
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {
            "Authorization": f"Bearer {tokens['access_token']}",
        }

    async def test_get_notifications(self):
        """알림 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        notifications = response.json()
        self.assertIsInstance(notifications, list)
        self.assertGreater(len(notifications), 0)

    async def test_get_notification_detail(self):
        """알림 상세 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.notification.id}?factory_id={self.factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        notification = response.json()
        self.assertEqual(notification["id"], self.notification.id)

    async def test_mark_all_notifications_as_read(self):
        """모든 알림을 읽음 처리하는 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/read?factory_id={self.factory.id}",
            headers=headers,
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)
        notifications = response.json()
        for notification in notifications:
            self.assertTrue(notification["is_read"])
