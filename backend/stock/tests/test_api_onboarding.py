from django.test import TestCase
from ninja.testing import TestAsyncClient
from django.contrib.auth import get_user_model
from factory.models import Factory
from stock.models import Product, Material, MaterialProduct
from user.models import EmailVerification
from user.api import router as user_router
from stock.api_onboarding import router as onboarding_router
from asgiref.sync import sync_to_async

User = get_user_model()


class TestOnboardingAPI(TestCase):
    """온보딩 API 테스트 - create_single_product와 assign_materialproduct"""

    def setUp(self):
        """테스트 설정"""
        # TestAsyncClient 사용
        self.onboarding_client = TestAsyncClient(onboarding_router)
        self.auth_client = TestAsyncClient(user_router)

        # 사용자 생성
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123"
        )
        
        # 이메일 인증 생성
        self.email_verification = EmailVerification.objects.create(
            email="test@example.com",
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True
        )
        
        # 공장 생성
        self.factory = Factory.objects.create(
            owner=self.user,
            name="테스트 공장",
            business_registration_number="123-45-67890"
        )
        
        # 다른 사용자의 공장 생성 (권한 테스트용)
        other_user = User.objects.create_user(
            email="other@example.com",
            password="password123"
        )
        self.other_factory = Factory.objects.create(
            owner=other_user,
            name="다른 공장",
            business_registration_number="987-65-43210"
        )

    async def authenticate(self):
        """JWT 토큰을 얻고 Authorization 헤더를 반환합니다."""
        data = {
            "email": self.user.email,
            "password": "password123",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_create_single_product_success(self):
        """create_single_product 성공 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "factory_id": self.factory.id,
            "name": "플라스틱 고리",
            "code": "12345",
            "spec": "100 x 300mm",
            "unit": "EA"
        }
        
        response = await self.onboarding_client.post("/create-single-product", headers=headers, json=payload)
        
        
        self.assertEqual(response.status_code, 201)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('factory_id', data)
        self.assertIn('product_id', data)
        self.assertEqual(data['factory_id'], self.factory.id)
        self.assertIsInstance(data['product_id'], int)
        
        # 데이터베이스에 실제로 생성되었는지 확인
        product = await Product.objects.aget(id=data['product_id'])
        self.assertEqual(product.name, "플라스틱 고리")
        self.assertEqual(product.code, "12345")
        self.assertEqual(product.spec, "100 x 300mm")
        self.assertEqual(product.unit, "EA")
        self.assertEqual(product.factory_id, self.factory.id)

    async def test_create_single_product_unauthorized_factory(self):
        """create_single_product 권한 없는 공장 테스트"""
        headers = await self.authenticate()
        
        # 다른 사용자의 공장으로 제품 생성 시도
        payload = {
            "factory_id": self.other_factory.id,  # 권한 없는 공장
            "name": "권한 없는 제품",
            "code": "99999",
            "spec": "권한 없는 규격",
            "unit": "EA"
        }
        
        response = await self.onboarding_client.post("/create-single-product", headers=headers, json=payload)
        
        
        self.assertEqual(response.status_code, 404)

    async def test_assign_materialproduct_success(self):
        """assign_materialproduct 성공 테스트"""
        headers = await self.authenticate()
        
        # 먼저 제품 생성
        product = await Product.objects.acreate(
            factory=self.factory,
            name="테스트 제품",
            code="TEST001",
            spec="테스트 규격",
            unit="EA"
        )
        
        payload = {
            "factory_id": self.factory.id,
            "product_id": product.id,
            "materials": [
                {
                    "name": "나무",
                    "code": "12345",
                    "spec": "100 x 300mm",
                    "quantity": 5.0
                },
                {
                    "name": "플라스틱",
                    "code": "67890",
                    "spec": "200 x 400mm",
                    "quantity": 2.5
                }
            ]
        }
        
        response = await self.onboarding_client.post("/assign-material-product", headers=headers, json=payload)
        
        self.assertEqual(response.status_code, 201)
        
        # 데이터베이스에 실제로 생성되었는지 확인
        materials = await Material.objects.filter(factory=self.factory).acount()
        self.assertEqual(materials, 2)
        
        material_products = await MaterialProduct.objects.filter(product=product).acount()
        self.assertEqual(material_products, 2)

    async def test_assign_materialproduct_wrong_factory_product(self):
        """assign_materialproduct 잘못된 공장의 제품 테스트"""
        headers = await self.authenticate()
        
        # 다른 사용자의 공장에 제품 생성
        other_user = await User.objects.aget(email="other@example.com")
        other_factory = await Factory.objects.aget(owner=other_user)
        other_product = await Product.objects.acreate(
            factory=other_factory,
            name="다른 제품",
            code="OTHER001",
            spec="다른 규격",
            unit="EA"
        )
        
        # 현재 사용자의 공장 ID와 다른 사용자의 제품 ID를 사용
        payload = {
            "factory_id": self.factory.id,  # 현재 사용자의 공장
            "product_id": other_product.id,  # 다른 사용자의 제품
            "materials": [
                {
                    "name": "나무",
                    "code": "12345",
                    "spec": "100 x 300mm",
                    "quantity": 5.0
                }
            ]
        }
        
        response = await self.onboarding_client.post("/assign-material-product", headers=headers, json=payload)
        
        # 다른 사용자의 제품을 찾을 수 없으므로 404가 맞습니다
        self.assertEqual(response.status_code, 404)

    async def test_sequential_api_test(self):
        """순차적 API 테스트 - create_single_product 후 assign_materialproduct"""
        headers = await self.authenticate()
        
        # 1단계: create_single_product 실행
        create_payload = {
            "factory_id": self.factory.id,
            "name": "순차 테스트 제품",
            "code": "SEQ001",
            "spec": "순차 테스트 규격",
            "unit": "EA"
        }
        
        create_response = await self.onboarding_client.post("/create-single-product", headers=headers, json=create_payload)
        
        self.assertEqual(create_response.status_code, 201)
        
        create_data = create_response.json()
        product_id = create_data['product_id']
        
        # 2단계: assign_materialproduct 실행
        assign_payload = {
            "factory_id": self.factory.id,
            "product_id": product_id,
            "materials": [
                {
                    "name": "순차 테스트 자재",
                    "code": "SEQ_MAT001",
                    "spec": "순차 테스트 자재 규격",
                    "quantity": 3.0
                }
            ]
        }
        
        assign_response = await self.onboarding_client.post("/assign-material-product", headers=headers, json=assign_payload)
        
        self.assertEqual(assign_response.status_code, 201)
        
        # 최종 검증
        product = await Product.objects.aget(id=product_id)
        self.assertEqual(product.name, "순차 테스트 제품")
        
        material_products = await MaterialProduct.objects.filter(product=product).acount()
        self.assertEqual(material_products, 1)
        
        # 수량 확인
        material_product = await MaterialProduct.objects.aget(product=product)
        self.assertEqual(float(material_product.quantity), 3.0)
