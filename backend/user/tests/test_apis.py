from django.test import TestCase
from user.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification, Jwt


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

    async def get_refresh_token(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return data.get("refresh_token")

    async def test_signup(self):
        """
        회원가입 테스트
        """
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
        """
        로그인 성공 테스트"""
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
        """
        현재 로그인된 사용자의 정보 조회
        """
        headers = await self.authenticate()
        response = await self.client.get("/me", headers=headers)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["email"], self.user.email)
        self.assertEqual(data["status"], self.user.status)

    async def test_update_me(self):
        """
        현재 로그인된 사용자의 정보 수정
        """
        headers = await self.authenticate()
        data = {
            "marketing_agreement": True,
        }
        response = await self.client.patch(f"/me", json=data, headers=headers)
        data = response.json()
        # print("🐍 File: tests/test_apis.py | Line: 84 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)

    async def test_logout(self):
        """
        로그아웃 테스트
        """
        headers = await self.authenticate()
        response = await self.client.post("/logout", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"detail": "로그아웃 되었어요."})

    async def test_refresh_token(self):
        """
        Refresh token 테스트
        """
        refresh = await self.get_refresh_token()

        payload = {
            "refresh_token": refresh,
        }
        response = await self.client.post(
            "/refresh-token",
            json=payload,
        )
        data = response.json()
        # print("🐍 File: tests/test_apis.py | Line: 112 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)

    async def test_withdraw(self):
        """
        회원 탈퇴 테스트
        """
        headers = await self.authenticate()
        response = await self.client.post("/withdraw", headers=headers)
        self.assertEqual(response.status_code, 200)
