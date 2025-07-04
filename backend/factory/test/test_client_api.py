from django.test import TestCase
from user.api import router as user_router
from factory.client_api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient


class TestFactoryClient(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            username="testuser",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )
        self.test_client = FactoryClient.objects.create(
            factory=self.factory,
            name="Test Client",
            business_registration_number="987-65-43210",
            representative_name="홍길동",
            email="test@client.com",
            phone="010-1234-5678",
        )

    async def authenticate(self):
        data = {
            "username": self.user.username,
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

    async def test_create_factory_client(self):
        """
        공장 클라이언트 생성 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "New Client",
            "business_registration_number": "111-22-33333",
            "representative_name": "김철수",
            "email": "new@client.com",
            "phone": "010-9876-5432",
            "business_type": "제조업",
            "business_category": "전자제품",
            "address": "서울시 강남구",
        }
        response = await self.client.post(
            f"/{self.factory.id}/clients", 
            headers=headers, 
            json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], "New Client")
        self.assertEqual(data["email"], "new@client.com")

    async def test_list_factory_clients(self):
        """
        공장 클라이언트 목록 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data.get("data", [])
        self.assertGreater(len(result), 0)
        self.assertEqual(result[0]["name"], self.test_client.name)

    async def test_get_factory_client(self):
        """
        공장 클라이언트 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/{self.test_client.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.test_client.id)
        self.assertEqual(data["name"], self.test_client.name)
        self.assertEqual(data["email"], self.test_client.email)

    async def test_update_factory_client(self):
        """공장 클라이언트 정보 수정 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "Updated Client",
            "email": "updated@client.com",
            "phone": "010-5555-6666",
        }
        response = await self.client.patch(
            f"/{self.factory.id}/clients/{self.test_client.id}", 
            headers=headers, 
            json=payload
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.test_client.id)
        self.assertEqual(data["name"], "Updated Client")
        self.assertEqual(data["email"], "updated@client.com")
        self.assertEqual(data["phone"], "010-5555-6666")

    async def test_delete_factory_client(self):
        """
        공장 클라이언트 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/{self.factory.id}/clients/{self.test_client.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 204)
        # 클라이언트가 삭제되었는지 확인
        self.assertFalse(
            await FactoryClient.objects.filter(id=self.test_client.id).aexists()
        )

    async def test_get_factory_client_not_found(self):
        """존재하지 않는 클라이언트 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.factory.id}/clients/99999", 
            headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_client_not_found(self):
        """
        존재하지 않는 클라이언트 수정 테스트
        """
        headers = await self.authenticate()
        payload = {"name": "Updated Client"}
        response = await self.client.patch(
            f"/{self.factory.id}/clients/99999", 
            headers=headers, 
            json=payload
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_client_not_found(self):
        """
        존재하지 않는 클라이언트 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/{self.factory.id}/clients/99999", 
            headers=headers
        )
        self.assertEqual(response.status_code, 404) 