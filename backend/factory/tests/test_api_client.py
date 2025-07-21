from django.test import TestCase
from user.api import router as user_router
from factory.api_client import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient
from asgiref.sync import sync_to_async


class TestFactoryClient(TestCase):
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
        self.client_obj = FactoryClient.objects.create(
            factory=self.factory,
            name="거래처1",
            business_registration_number="111-22-33333",
            representative_name="홍길동",
            email="client1@example.com",
            phone="010-1111-2222",
            business_type="제조업",
            business_category="기계",
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_create_factory_client(self):
        """
        거래처 등록 테스트
        """
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "거래처2",
            "business_registration_number": "222-33-44444",
            "representative_name": "이몽룡",
            "email": "client2@example.com",
            "phone": "010-2222-3333",
            "business_type": "도소매",
            "business_category": "전자",
        }
        response = await self.client.post("/", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "거래처2")
        self.assertEqual(data["business_registration_number"], "222-33-44444")

    async def test_list_factory_clients(self):
        """
        거래처 목록/검색 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}&q=거래처", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreaterEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["name"], "거래처1")

    async def test_get_factory_client_detail(self):
        """
        거래처 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.client_obj.id)
        self.assertEqual(data["name"], "거래처1")

    async def test_update_factory_client(self):
        """
        거래처 정보 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "거래처1-수정",
            "business_type": "서비스업",
        }
        response = await self.client.patch(f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.client_obj.id)
        self.assertEqual(data["name"], "거래처1-수정")
        self.assertEqual(data["business_type"], "서비스업")

    async def test_delete_factory_client(self):
        """
        거래처 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.client_obj.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 204)

    async def test_get_factory_client_not_found(self):
        """
        존재하지 않는 거래처 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_client_not_found(self):
        """
        존재하지 않는 거래처 수정 테스트
        """
        headers = await self.authenticate()
        payload = {"name": "없는 거래처"}
        response = await self.client.patch(f"/99999?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_client_not_found(self):
        """
        존재하지 않는 거래처 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)
