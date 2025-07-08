from django.test import TestCase
from user.api import router as user_router
from stock.material_api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryClient
from stock.models import Material, MaterialHistory
from asgiref.sync import sync_to_async


class TestMaterial(TestCase):
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

    async def test_create_material(self):
        """
        원자재 생성 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "New Material",
            "code": "MAT002",
            "unit": "개",
            "spec": "New Specification",
            "standard_stock": 100,
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], "New Material")
        self.assertEqual(data["code"], "MAT002")

    async def test_create_materials_bulk(self):
        """
        원자재 일괄 생성 테스트
        """
        headers = await self.authenticate()
        payload = {
            "materials": [
                {
                    "name": "Material 1",
                    "code": "MAT001",
                    "unit": "kg",
                    "spec": "Spec 1",
                    "standard_stock": 50,
                },
                {
                    "name": "Material 2",
                    "code": "MAT002",
                    "unit": "개",
                    "spec": "Spec 2",
                    "standard_stock": 100,
                },
            ]
        }
        response = await self.client.post("/bulk", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["name"], "Material 1")
        self.assertEqual(data[1]["name"], "Material 2")

    async def test_list_materials(self):
        """
        원자재 목록 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreater(len(data["data"]), 0)

    async def test_get_material(self):
        """
        원자재 상세 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Material")
        self.assertEqual(data["code"], "MAT001")

    async def test_get_material_detail(self):
        """
        원자재 상세 조회 (업체별 단가 비교) 테스트
        """
        headers = await self.authenticate()
        
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            total_stock=150,
        )
        
        response = await self.client.get(f"/{self.material.id}/detail", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Material")

    async def test_get_material_detail_with_days_parameter(self):
        """
        원자재 상세 조회 - days 파라미터 테스트
        """
        headers = await self.authenticate()
        
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            total_stock=150,
        )
        
        # 30일 기간으로 조회
        response = await self.client.get(f"/{self.material.id}/detail?days=30", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Material")

    async def test_get_material_detail_default_period(self):
        """
        원자재 상세 조회 - 기본 기간(90일) 테스트
        """
        headers = await self.authenticate()
        
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            total_stock=150,
        )
        
        response = await self.client.get(f"/{self.material.id}/detail", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Material")

    async def test_get_material_detail_long_period(self):
        """
        원자재 상세 조회 - 긴 기간(365일) 테스트
        """
        headers = await self.authenticate()
        
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            total_stock=150,
        )
        
        # 365일 기간으로 조회
        response = await self.client.get(f"/{self.material.id}/detail?days=365", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Material")

    async def test_get_material_detail_short_period(self):
        """
        원자재 상세 조회 - 짧은 기간(7일) 테스트
        """
        headers = await self.authenticate()
        
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            total_stock=150,
        )
        
        response = await self.client.get(f"/{self.material.id}/detail?days=7", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Material")

    async def test_update_material(self):
        """
        원자재 수정 테스트
        """
        headers = await self.authenticate()
        payload = {
            "name": "Updated Material",
            "standard_stock": 200,
        }
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Updated Material")
        self.assertEqual(data["standard_stock"], 200)

    async def test_delete_material(self):
        """
        원자재 삭제 테스트
        """
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        
        material_exists = await Material.objects.filter(id=self.material.id).aexists()
        self.assertFalse(material_exists)

    async def test_material_not_found(self):
        """
        존재하지 않는 원자재 조회 테스트
        """
        headers = await self.authenticate()
        response = await self.client.get("/999", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_unauthorized_access(self):
        """
        인증되지 않은 접근 테스트
        """
        payload = {
            "name": "Test Material",
            "code": "MAT001",
            "unit": "kg",
            "spec": "Test Specification",
            "standard_stock": 50,
        }
        response = await self.client.post("", json=payload)
        self.assertEqual(response.status_code, 401) 