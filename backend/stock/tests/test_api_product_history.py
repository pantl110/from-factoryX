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

from user.models import EmailVerification


class TestProductHistoryAPI(TestCase):
    """ProductHistory CRUD API tests"""

    def setUp(self):
        # Async clients for history router and authentication router
        self.client = TestAsyncClient(history_router)
        self.auth_client = TestAsyncClient(user_router)

        # Create user & factory
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
            name="History Factory",
            business_registration_number="987-65-43210",
        )

        # Create multiple products for testing filters
        self.product1 = Product.objects.create(
            factory=self.factory,
            name="자동차",
            code="CAR001",
            unit="대",
            spec="승용차",
        )
        
        self.product2 = Product.objects.create(
            factory=self.factory,
            name="건물",
            code="BUILDING001",
            unit="동",
            spec="상업용 건물",
        )
        
        self.product3 = Product.objects.create(
            factory=self.factory,
            name="전자제품",
            code="ELECTRONIC001",
            unit="개",
            spec="스마트폰",
        )

        # Create multiple history instances for testing filters
        self.history1_in = ProductHistory.objects.create(
            product=self.product1,
            type=ProductHistory.ProductHistoryType.IN,
            quantity=10,
            total_stock=10,
        )
        
        self.history1_out = ProductHistory.objects.create(
            product=self.product1,
            type=ProductHistory.ProductHistoryType.OUT,
            quantity=5,
            total_stock=5,
        )
        
        self.history2_in = ProductHistory.objects.create(
            product=self.product2,
            type=ProductHistory.ProductHistoryType.IN,
            quantity=20,
            total_stock=20,
        )
        
        self.history3_out = ProductHistory.objects.create(
            product=self.product3,
            type=ProductHistory.ProductHistoryType.OUT,
            quantity=15,
            total_stock=15,
        )

    async def authenticate(self):
        """Return headers with valid JWT token for the test user."""
        data = {"email": self.user.email, "password": "password1234!"}
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_create_history(self):
        """[C] 제품 입출고 이력 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "product": self.product1.id,
            "type": ProductHistory.ProductHistoryType.OUT,  # "out"
            "quantity": 5,
            "total_stock": 5,
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["quantity"], payload["quantity"])

    async def test_list_histories_without_filter(self):
        """[R] 제품 입출고 이력 목록 조회 (필터 없음)"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # 모든 히스토리가 조회되어야 함 (4개)
        self.assertEqual(data["count"], 4)

    async def test_list_histories_by_product_id(self):
        """[R] 제품 입출고 이력 목록 조회 - product_id 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?product_id={self.product1.id}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # product1의 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)
        
        # 모든 아이템이 product1에 속하는지 확인
        for item in data["data"]:
            self.assertEqual(item["product"], self.product1.id)

    async def test_list_histories_by_product_name(self):
        """[R] 제품 입출고 이력 목록 조회 - product_name 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?product_name=자동차", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # "자동차"가 포함된 product1의 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)
        
        # 모든 아이템이 product1에 속하는지 확인
        for item in data["data"]:
            self.assertEqual(item["product"], self.product1.id)

    async def test_list_histories_by_product_code(self):
        """[R] 제품 입출고 이력 목록 조회 - product_code 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?product_code=CAR", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # "CAR"가 포함된 product1의 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)
        
        # 모든 아이템이 product1에 속하는지 확인
        for item in data["data"]:
            self.assertEqual(item["product"], self.product1.id)

    async def test_list_histories_by_type_in(self):
        """[R] 제품 입출고 이력 목록 조회 - type=in 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?type=입고", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # 입고(type=in) 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)
        
        # 모든 아이템이 입고 타입인지 확인
        for item in data["data"]:
            self.assertEqual(item["type"], "입고")

    async def test_list_histories_by_type_out(self):
        """[R] 제품 입출고 이력 목록 조회 - type=out 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?type=출고", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # 출고(type=out) 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)
        
        # 모든 아이템이 출고 타입인지 확인
        for item in data["data"]:
            self.assertEqual(item["type"], "출고")

    async def test_list_histories_by_date_range(self):
        """[R] 제품 입출고 이력 목록 조회 - 날짜 범위 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?start_date=2025-01-01&end_date=2025-12-31", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # 날짜 범위 내의 모든 히스토리가 조회되어야 함 (4개)
        self.assertEqual(data["count"], 4)

    async def test_list_histories_combined_filters(self):
        """[R] 제품 입출고 이력 목록 조회 - 복합 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?product_id={self.product1.id}&type=입고", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # product1의 입고 히스토리만 조회되어야 함 (1개)
        self.assertEqual(data["count"], 1)
        
        # 아이템이 product1의 입고 타입인지 확인
        item = data["data"][0]
        self.assertEqual(item["product"], self.product1.id)
        self.assertEqual(item["type"], "입고")

    async def test_list_histories_by_product_name_partial_match(self):
        """[R] 제품 입출고 이력 목록 조회 - 품목명 부분 일치"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?product_name=전자", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # "전자"가 포함된 product3의 히스토리만 조회되어야 함 (1개)
        self.assertEqual(data["count"], 1)
        
        # 아이템이 product3에 속하는지 확인
        item = data["data"][0]
        self.assertEqual(item["product"], self.product3.id)

    async def test_list_histories_by_product_code_partial_match(self):
        """[R] 제품 입출고 이력 목록 조회 - 품목 코드 부분 일치"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?product_code=BUILD", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # "BUILD"가 포함된 product2의 히스토리만 조회되어야 함 (1개)
        self.assertEqual(data["count"], 1)
        
        # 아이템이 product2에 속하는지 확인
        item = data["data"][0]
        self.assertEqual(item["product"], self.product2.id)

    async def test_list_histories_no_results(self):
        """[R] 제품 입출고 이력 목록 조회 - 결과 없음"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?product_name=존재하지않는품목", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # 결과가 없어야 함
        self.assertEqual(data["count"], 0)
        self.assertEqual(len(data["data"]), 0)

    async def test_list_histories_complex_combination(self):
        """[R] 제품 입출고 이력 목록 조회 - 복잡한 조합 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?product_id={self.product1.id}&type=출고&start_date=2025-01-01&end_date=2025-12-31", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # product1의 출고 히스토리만 조회되어야 함 (1개)
        self.assertEqual(data["count"], 1)
        
        # 아이템이 product1의 출고 타입인지 확인
        item = data["data"][0]
        self.assertEqual(item["product"], self.product1.id)
        self.assertEqual(item["type"], "출고")

    async def test_list_histories_case_insensitive_search(self):
        """[R] 제품 입출고 이력 목록 조회 - 대소문자 구분 없는 검색"""
        headers = await self.authenticate()
        response = await self.client.get(
            "?product_name=자동차", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # "자동차"가 포함된 product1의 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)
        
        # 대문자로도 검색 가능한지 확인
        response_upper = await self.client.get(
            "?product_code=car", 
            headers=headers
        )
        self.assertEqual(response_upper.status_code, 200)
        data_upper = response_upper.json()
        # "car"가 포함된 product1의 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data_upper["count"], 2)
