import os
import django

# Configure Django settings when the module is executed directly (e.g. `python test_api_product_history.py`)
# When tests are executed via `manage.py test` or pytest-django, this will be a no-op because settings are already configured.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cfehome.settings")
# Calling setup() multiple times is safe; Django will ignore subsequent calls.
django.setup()

from django.test import TestCase
from ninja.testing import TestAsyncClient

from user.api import router as user_router
from stock.api_product_history import router as history_router

from user.models import User
from factory.models import Factory
from stock.models import Product, ProductHistory


class TestProductHistoryAPI(TestCase):
    """ProductHistory CRUD API tests"""

    def setUp(self):
        # Async clients for history router and authentication router
        self.client = TestAsyncClient(history_router)
        self.auth_client = TestAsyncClient(user_router)

        # Create user & factory
        self.user = User.objects.create_user(
            username="test_history_user",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="History Factory",
            business_registration_number="987-65-43210",
        )

        # Create product (history references this)
        self.product = Product.objects.create(
            factory=self.factory,
            name="History Product",
            code="HP001",
            unit="EA",
            spec="Spec H",
        )

        # Pre-create a history instance for R/U/D
        self.history = ProductHistory.objects.create(
            product=self.product,
            type=ProductHistory.ProductHistoryType.IN,
            quantity=10,
            total_stock=10,
        )

    async def authenticate(self):
        """Return headers with valid JWT token for the test user."""
        data = {"username": self.user.username, "password": "password1234!"}
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_create_history(self):
        """[C] 제품 입출고 이력 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "product": self.product.id,
            "type": ProductHistory.ProductHistoryType.OUT,  # "out"
            "quantity": 5,
            "total_stock": 5,
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["quantity"], payload["quantity"])

    async def test_list_histories(self):
        """[R] 이력 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Ninja paginate returns dict with "items" or "results" depending; our earlier product list returns pagination.
        # Depending on pagination style, the key may be either "data" (custom) or "items" (default ninja paginate)
        self.assertTrue("data" in data or "items" in data)

    async def test_get_history(self):
        """[R] 이력 상세 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.history.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.history.id)
        self.assertEqual(data["quantity"], self.history.quantity)

    async def test_update_history(self):
        """[U] 이력 수정 테스트"""
        headers = await self.authenticate()
        payload = {"quantity": 20, "total_stock": 20}
        response = await self.client.patch(f"/{self.history.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["quantity"], payload["quantity"])

    async def test_delete_history(self):
        """[D] 이력 삭제 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.history.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        # verify
        self.assertFalse(await ProductHistory.objects.filter(id=self.history.id).aexists())


# -----------------------------------------------------------------------------
# Allow running this file directly with `python test_api_product_history.py`
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import unittest

    # Discover and run the tests in this module only
    unittest.main()
