from django.test import TestCase
from ninja.testing import TestAsyncClient

from user.api import router as user_router
from stock.api_product import router as product_router

from user.models import User
from factory.models import Factory
from stock.models import Product

from user.models import EmailVerification
from asgiref.sync import sync_to_async


class TestProductAPI(TestCase):
    """Product CRUD API tests"""

    def setUp(self):
        # Async clients for the product router and authentication router
        self.client = TestAsyncClient(product_router)
        self.auth_client = TestAsyncClient(user_router)

        # Create a user and factory
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
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )

        # Pre-create a product instance for read/update/delete tests
        self.product = Product.objects.create(
            factory=self.factory,
            name="Pre-created Product",
            code="P001",
            unit="EA",
            spec="Spec A",
        )

    async def authenticate(self):
        """Obtain JWT access token and return Authorization headers."""
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_create_product(self):
        """[C] 제품 생성 테스트"""
        headers = await self.authenticate()
        payload = [
            {
                "factory": self.factory.id,
                "name": "Created Product1",
                "code": "P002",
                "unit": "개",
                "spec": "Spec B",
                "current_stock": 10,
                "average_production_time": 100,
                "buffer_rate": 0.2,
                "note": "비고1"
            },
            {
                "factory": self.factory.id,
                "name": "Created Product2",
                "code": "P003",
                "unit": "EA",
                "spec": "Spec C",
                "current_stock": 5,
                "average_production_time": 200,
                "buffer_rate": 0.15,
                "note": "비고2"
            },
        ]
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data[0])
        self.assertIn("id", data[1])
        self.assertEqual(data[0]["name"], payload[0]["name"])
        self.assertEqual(data[1]["name"], payload[1]["name"])
        # 생성 응답에는 buffer_rate, note 등이 없을 수 있으므로 체크하지 않음

    async def test_create_single_product_success(self):
        """단일 품목 생성 성공 테스트"""
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "테스트 품목",
            "code": "PROD001",
            "spec": "규격1",
            "unit": "EA"
        }
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["factory_id"], self.factory.id)
        self.assertIn("product_id", data)

        # DB에 실제로 생성되었는지 확인
        from stock.models import Product
        product_exists = await sync_to_async(Product.objects.filter(id=data["product_id"]).exists)()
        self.assertTrue(product_exists)

    async def test_create_single_product_duplicate_code(self):
        """중복된 품목 코드로 생성 시도시 실패 테스트"""
        # 먼저 하나 생성
        headers = await self.authenticate()
        payload = {
            "factory_id": self.factory.id,
            "name": "테스트 품목",
            "code": "PROD001",
            "spec": "규격1",
            "unit": "EA"
        }
        await self.client.post("/single", headers=headers, json=payload)

        # 같은 코드로 다시 생성 시도
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("해당 공장에 이미 존재하는 품목 코드입니다.", data.get("message") or data.get("detail", ""))

    async def test_list_products(self):
        """[R] 제품 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIsInstance(data, list)
        self.assertTrue(len(data) >= 1)

    async def test_list_products_all(self):
        """검색값 없이 전체 품목이 조회되는지 테스트"""
        headers = await self.authenticate()
        # 여러 제품 추가
        await sync_to_async(Product.objects.create)(factory=self.factory, name="제품A", code="A001", unit="EA", spec="SpecA")
        await sync_to_async(Product.objects.create)(factory=self.factory, name="제품B", code="B001", unit="EA", spec="SpecB")
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        names = [item["name"] for item in data]
        self.assertIn("제품A", names)
        self.assertIn("제품B", names)
        self.assertIn("Pre-created Product", names)

    async def test_list_products_search_by_name(self):
        """품목명으로 검색 시 해당 품목만 조회되는지 테스트"""
        headers = await self.authenticate()
        await sync_to_async(Product.objects.create)(factory=self.factory, name="검색제품", code="SEARCH01", unit="EA", spec="SpecS")
        response = await self.client.get("?q=검색제품", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        names = [item["name"] for item in data]
        self.assertIn("검색제품", names)
        self.assertNotIn("Pre-created Product", names)

    async def test_list_products_search_by_code(self):
        """품목코드로 검색 시 해당 품목만 조회되는지 테스트"""
        headers = await self.authenticate()
        await sync_to_async(Product.objects.create)(factory=self.factory, name="코드검색제품", code="CODE123", unit="EA", spec="SpecC")
        response = await self.client.get("?q=CODE123", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        codes = [item["code"] for item in data]
        self.assertIn("CODE123", codes)
        self.assertNotIn("P001", codes)

    async def test_get_product(self):
        """[R] 제품 상세 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.product.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.product.id)
        self.assertEqual(data["name"], self.product.name)

    async def test_update_product(self):
        """[U] 제품 수정 테스트"""
        headers = await self.authenticate()
        payload = {"name": "Updated Product Name"}
        response = await self.client.patch(
            f"/{self.product.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.product.id)
        self.assertEqual(data["name"], payload["name"])
        # created_at, updated_at 필드는 응답에서 제외되었으므로 더 이상 검증하지 않음

    async def test_update_product_required_field_blank(self):
        """[U] 필수 입력값 누락 또는 공란일 때 422 에러 테스트"""
        headers = await self.authenticate()
        # 필수값 누락
        payload = {"name": "", "code": "", "unit": "", "spec": "", "factory": "", "current_stock": "", "buffer_rate": ""}
        response = await self.client.patch(
            f"/{self.product.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertIn("detail", data)

    async def test_delete_product(self):
        """[D] 제품 삭제 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.product.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        # Verify deletion
        self.assertFalse(await Product.objects.filter(id=self.product.id).aexists())
