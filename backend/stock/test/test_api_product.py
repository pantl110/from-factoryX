from django.test import TestCase
from ninja.testing import TestAsyncClient

from user.api import router as user_router
from stock.api_product import router as product_router

from user.models import User
from factory.models import Factory
from stock.models import Product


class TestProductAPI(TestCase):
    """Product CRUD API tests"""

    def setUp(self):
        # Async clients for the product router and authentication router
        self.client = TestAsyncClient(product_router)
        self.auth_client = TestAsyncClient(user_router)

        # Create a user and factory
        self.user = User.objects.create_user(
            username="test_product_user",
            password="password1234!",
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
            "username": self.user.username,
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
        payload = {
            "factory": self.factory.id,
            "name": "Created Product",
            "code": "P002",
            "unit": "EA",
            "spec": "Spec B",
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], payload["name"])

    async def test_list_products(self):
        """[R] 제품 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertTrue(len(data["data"]) >= 1)

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
        response = await self.client.patch(f"/{self.product.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.product.id)
        self.assertEqual(data["name"], payload["name"])

    async def test_delete_product(self):
        """[D] 제품 삭제 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.product.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        # Verify deletion
        self.assertFalse(await Product.objects.filter(id=self.product.id).aexists())
