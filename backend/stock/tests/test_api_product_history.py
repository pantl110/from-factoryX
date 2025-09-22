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
            production_quantity=20,
            delivery_quantity=10,
            quantity=10,
            total_stock=10,
            project_id=1001,
            client_name="고객A",
        )

        self.history1_out = ProductHistory.objects.create(
            product=self.product1,
            production_quantity=10,
            delivery_quantity=20,
            quantity=-10,
            total_stock=5,
            project_id=1001,
            client_name="고객A",
        )

        self.history2_in = ProductHistory.objects.create(
            product=self.product2,
            production_quantity=20,
            delivery_quantity=10,
            quantity=10,
            total_stock=20,
            project_id=2002,
            client_name="고객B",
        )

        self.history3_out = ProductHistory.objects.create(
            product=self.product3,
            production_quantity=30,
            delivery_quantity=15,
            quantity=15,
            total_stock=15,
            project_id=3003,
            client_name="고객C",
        )

        # FactoryMember 생성 (권한 검증을 위해)
        from factory.models import FactoryMember

        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
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
            "quantity": 0,
            "total_stock": 5,
            "production_quantity": 5,
            "delivery_quantity": 5,
            "project_id": 1001,
            "client_name": "고객A",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["quantity"], payload["quantity"])

    async def test_list_histories_without_filter(self):
        """[R] 제품 입출고 이력 목록 조회 (필터 없음)"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
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
            f"?factory_id={self.factory.id}&product_id={self.product1.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # product1의 히스토리만 조회되어야 함 (2개)
        self.assertEqual(data["count"], 2)

        # 모든 아이템이 product1에 속하는지 확인
        for item in data["data"]:
            self.assertEqual(item["product_id"], self.product1.id)

    async def test_list_histories_by_project_id(self):
        """[R] 제품 입출고 이력 목록 조회 - project_id 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&project_id=1001",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # project_id=1001 의 product1 히스토리 2건
        self.assertEqual(data["count"], 2)
        for item in data["data"]:
            self.assertEqual(item["project_id"], 1001)

    async def test_list_histories_by_project_and_product(self):
        """[R] 제품 입출고 이력 목록 조회 - project_id & product_id 복합 필터"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&project_id=1001&product_id={self.product1.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        # project_id=1001 이면서 product1인 히스토리 2건
        self.assertEqual(data["count"], 2)
        for item in data["data"]:
            self.assertEqual(item["project_id"], 1001)
            self.assertEqual(item["product_id"], self.product1.id)

    # async def test_list_histories_by_date_range(self):
    #     """[R] 제품 입출고 이력 목록 조회 - 날짜 범위 필터"""
    #     headers = await self.authenticate()
    #     response = await self.client.get(
    #         f"?factory_id={self.factory.id}&start_date=2025-01-01&end_date=2025-12-31",
    #         headers=headers,
    #     )
    #     self.assertEqual(response.status_code, 200)
    #     data = response.json()
    #     self.assertIn("data", data)
    #     self.assertIn("count", data)
    #     # 날짜 범위 내의 모든 히스토리가 조회되어야 함 (4개)
    #     self.assertEqual(data["count"], 4)

    # async def test_list_histories_combined_filters(self):
    #     """[R] 제품 입출고 이력 목록 조회 - 복합 필터 (product_id + 날짜)"""
    #     headers = await self.authenticate()
    #     response = await self.client.get(
    #         f"?factory_id={self.factory.id}&product_id={self.product1.id}&start_date=2025-01-01",
    #         headers=headers,
    #     )
    #     self.assertEqual(response.status_code, 200)
    #     data = response.json()
    #     self.assertIn("data", data)
    #     self.assertIn("count", data)
    #     # product1의 2025년 이후 히스토리만 조회되어야 함 (2개)
    #     self.assertEqual(data["count"], 2)

    #     # 아이템이 product1에 속하는지 확인
    #     item = data["data"][0]
    #     self.assertEqual(item["product_id"], self.product1.id)
