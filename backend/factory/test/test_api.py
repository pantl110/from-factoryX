from django.test import TestCase
from user.api import router as user_router
from factory.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory


class TestUser(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            username="test1",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            business_registration_number="Test Factory",
            representative_name="Test Location",
        )

    async def authenticate(self):
        data = {
            "username": self.user.username,
            "password": self.user.password,
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_create_factory(self):
        """
        공장 생성 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "Test Factory",
            "location": "Test Location",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())

    async def test_list_factories(self):
        """
        공장 목록 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        data = response.json()
        # print("🐍 File: test/test_api.py | Line: 51 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)
        result = data.get("data", [])
        # print("🐍 File: test/test_api.py | Line: 60 | setUp ~ result", result)

    async def test_get_factory(self):
        """
        공장 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.factory.id)
        self.assertEqual(data["name"], self.factory.name)

    async def test_update_factory(self):
        """
        공장 정보 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "Updated Factory",
        }
        response = await self.client.patch(
            f"/{self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.factory.id)
        self.assertEqual(data["name"], "Updated Factory")

    async def test_delete_factory(self):
        """
        공장 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        # 공장이 삭제되었는지 확인
        self.assertFalse(await Factory.objects.filter(id=self.factory.id).aexists())
