from django.test import TestCase
from user.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification


class TestUser(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.user = User.objects.create_user(
            email="test1@example.com",
            password="password1234!",
            status=User.UserStatusChoice.admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
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
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_signup(self):
        await EmailVerification.objects.acreate(
            email="test2@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        data = {
            "email": "test2@example.com",
            "password": "password1234!",
            "password_confirm": "password1234!",
            "terms_of_service": True,
            "privacy_policy_agreement": True,
        }
        response = await self.client.post("/signup", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)

    async def test_login_success(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())

    async def test_get_me(self):
        headers = await self.authenticate()
        response = await self.client.get("/me", headers=headers)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["email"], self.user.email)
        self.assertEqual(data["status"], self.user.status)

    async def test_update_me(self):
        headers = await self.authenticate()
        data = {
            "marketing_agreement": True,
        }
        response = await self.client.patch(
            f"/{self.user.id}", json=data, headers=headers
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)
