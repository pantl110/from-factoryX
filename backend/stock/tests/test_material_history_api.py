from django.test import TestCase
from user.api import router as user_router
from stock.material_history_api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient
from stock.models import Material, MaterialHistory


class TestMaterialHistory(TestCase):
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
        self.client_obj = FactoryClient.objects.create(
            factory=self.factory,
            name="Test Client",
            business_registration_number="987-65-43210",
            representative_name="홍길동",
            email="test@client.com",
            phone="010-1234-5678",
        )
        self.material = Material.objects.create(
            factory=self.factory,
            name="Test Material",
            code="MAT001",
            unit="kg",
            spec="Test Specification",
            current_stock=100,
            standard_stock=50,
        )
        self.history = MaterialHistory.objects.create(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            total_stock=150,
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

    async def test_create_material_history(self):
        """
        원자재 히스토리 생성 테스트
        """
        headers = await self.authenticate()
        payload = {
            "client_id": self.client_obj.id,
            "type": "구매",
            "quantity": 30,
            "price": 1500,
        }
        response = await self.client.post(f"/{self.material.id}/history", headers=headers, json=payload)
        self.assertIn(response.status_code, [201, 200])
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["quantity"], 30)
        self.assertEqual(data["price"], 1500)

    async def test_list_material_history(self):
        """
        원자재 히스토리 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.material.id}/history", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreater(len(data["data"]), 0)

    async def test_list_material_history_recent(self):
        """
        원자재 최근 히스토리 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.material.id}/history/recent", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreater(len(data["data"]), 0)

    async def test_get_material_history(self):
        """
        원자재 히스토리 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/history/{self.history.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["quantity"], 50)
        self.assertEqual(data["price"], 1000)

    async def test_update_material_history(self):
        """
        원자재 히스토리 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "quantity": 60,
            "price": 1200,
        }
        response = await self.client.patch(f"/history/{self.history.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["quantity"], 60)
        self.assertEqual(data["price"], 1200)

    async def test_delete_material_history(self):
        """
        원자재 히스토리 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/history/{self.history.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        
        # 삭제 확인
        history_exists = await MaterialHistory.objects.filter(id=self.history.id).aexists()
        self.assertFalse(history_exists)

    async def test_material_history_not_found(self):
        """
        존재하지 않는 원자재 히스토리 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get("/history/999", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_insufficient_stock(self):
        """
        재고 부족 테스트
        """
        headers = await self.authenticate()
        payload = {
            "client_id": self.client_obj.id,
            "type": "소모",
            "quantity": 200,
            "price": None,
        }
        response = await self.client.post(f"/{self.material.id}/history", headers=headers, json=payload)
        self.assertIn(response.status_code, [400, 422])

    async def test_unauthorized_access(self):
        """
        인증되지 않은 접근 테스트
        """
        payload = {
            "client_id": self.client_obj.id,
            "type": "구매",
            "quantity": 30,
            "price": 1500,
        }
        response = await self.client.post(f"/{self.material.id}/history", json=payload)
        self.assertEqual(response.status_code, 401) 