from django.test import TestCase
from user.api import router as user_router
from aws.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from user.models import EmailVerification


class TestAWS(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password1234!",
        )
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
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

    async def test_upload_file(self):
        """
        S3 파일 업로드 테스트
        """
        headers = await self.authenticate()
        payload = {
            "file_name": "test_image.png",
        }
        response = await self.client.post("/upload", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # print("🐍 File: tests/test_apis.py | Line: 49 | setUp ~ data", data)
