from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async
from decimal import Decimal

from user.api import router as user_router
from unit_conversion.api import router as unit_conversion_router

from user.models import User, EmailVerification
from factory.models import Factory, FactoryMember
from stock.models import Material, Product
from unit_conversion.models import UnitConversion


class TestUnitConversionAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(unit_conversion_router)
        self.auth_client = TestAsyncClient(user_router)

        # 테스트 사용자 생성
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

        # 테스트 공장 생성
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )

        # FactoryMember 생성 (권한 문제 해결)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 다른 공장과 사용자 (권한 테스트용)
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="password1234!",
        )
        self.other_factory = Factory.objects.create(
            owner=self.other_user,
            name="Other Factory",
            business_registration_number="987-65-43210",
        )

        # 테스트 원자재 생성
        self.material = Material.objects.create(
            factory=self.factory,
            name="테스트 원자재",
            code="TEST001",
            spec="테스트 규격",
            unit="kg",
            current_stock=100,
        )

        # 테스트 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="테스트 제품",
            code="PROD001",
            spec="테스트 제품 규격",
            unit="EA",
            current_stock=20,
        )

        # 테스트 단위변환 생성
        self.unit_conversion = UnitConversion.objects.create(
            factory=self.factory,
            material=self.material,
            from_unit="kg",
            to_unit="g",
            conversion_rate=Decimal("1000.0000"),
        )

    async def authenticate(self):
        """사용자 인증 및 토큰 반환"""
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        return response.json()["access_token"]

    async def authenticate_other_user(self):
        """다른 사용자 인증 및 토큰 반환"""
        data = {
            "email": self.other_user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        return response.json()["access_token"]

    async def test_create_unit_conversion_success(self):
        """단위변환 생성 성공 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "material_id": self.material.id,
            "from_unit": "m",
            "to_unit": "cm",
            "conversion_rate": "100.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertEqual(response_data["factory"], self.factory.id)
        self.assertEqual(response_data["material"], self.material.id)
        self.assertEqual(response_data["from_unit"], "m")
        self.assertEqual(response_data["to_unit"], "cm")
        self.assertEqual(float(response_data["conversion_rate"]), 100.0)

    async def test_create_unit_conversion_with_product(self):
        """제품과 함께 단위변환 생성 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "product_id": self.product.id,
            "from_unit": "EA",
            "to_unit": "개",
            "conversion_rate": "1.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertEqual(response_data["factory"], self.factory.id)
        self.assertEqual(response_data["product"], self.product.id)
        self.assertIsNone(response_data["material"])

    async def test_create_unit_conversion_without_material_and_product(self):
        """원자재와 제품 없이 단위변환 생성 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "from_unit": "L",
            "to_unit": "mL",
            "conversion_rate": "1000.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertEqual(response_data["factory"], self.factory.id)
        self.assertIsNone(response_data["material"])
        self.assertIsNone(response_data["product"])

    async def test_create_unit_conversion_unauthorized(self):
        """권한 없는 사용자의 단위변환 생성 시도 테스트"""
        token = await self.authenticate_other_user()
        
        data = {
            "factory_id": self.factory.id,
            "material_id": self.material.id,
            "from_unit": "m",
            "to_unit": "cm",
            "conversion_rate": "100.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )

        self.assertEqual(response.status_code, 404)

    async def test_create_unit_conversion_no_auth(self):
        """인증 없이 단위변환 생성 시도 테스트"""
        data = {
            "factory_id": self.factory.id,
            "material_id": self.material.id,
            "from_unit": "m",
            "to_unit": "cm",
            "conversion_rate": "100.0000",
        }
        
        response = await self.client.post("/", json=data)
        self.assertEqual(response.status_code, 401)

    async def test_list_unit_conversions_success(self):
        """단위변환 목록 조회 성공 테스트 (페이지네이션 포함)"""
        token = await self.authenticate()
        
        response = await self.client.get(
            f"/?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 페이지네이션 구조 확인
        self.assertIn("data", response_data)
        self.assertIn("count", response_data)
        self.assertIsInstance(response_data["data"], list)
        self.assertEqual(len(response_data["data"]), 1)
        self.assertEqual(response_data["data"][0]["id"], self.unit_conversion.id)

    async def test_list_unit_conversions_unauthorized(self):
        """권한 없는 사용자의 단위변환 목록 조회 시도 테스트"""
        token = await self.authenticate_other_user()
        
        response = await self.client.get(
            f"/?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)

    async def test_get_unit_conversion_by_material_success(self):
        """원자재별 단위변환 조회 성공 테스트"""
        token = await self.authenticate()
        
        response = await self.client.get(
            f"/material/{self.material.id}?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertIsInstance(response_data, list)
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]["material"], self.material.id)

    async def test_get_unit_conversion_by_product_success(self):
        """제품별 단위변환 조회 성공 테스트"""
        token = await self.authenticate()
        
        # 제품용 단위변환 생성
        product_unit_conversion = await sync_to_async(UnitConversion.objects.create)(
            factory=self.factory,
            product=self.product,
            from_unit="EA",
            to_unit="개",
            conversion_rate=Decimal("1.0000"),
        )
        
        response = await self.client.get(
            f"/product/{self.product.id}?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertIsInstance(response_data, list)
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]["product"], self.product.id)

    async def test_get_unit_conversion_by_material_not_found(self):
        """존재하지 않는 원자재의 단위변환 조회 테스트"""
        token = await self.authenticate()
        
        response = await self.client.get(
            f"/material/99999?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(len(response_data), 0)  # 빈 리스트 반환

    async def test_get_unit_conversion_by_product_not_found(self):
        """존재하지 않는 제품의 단위변환 조회 테스트"""
        token = await self.authenticate()
        
        response = await self.client.get(
            f"/product/99999?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(len(response_data), 0)  # 빈 리스트 반환

    async def test_update_unit_conversion_success(self):
        """단위변환 수정 성공 테스트 (PATCH 메서드)"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "to_unit": "pound",
            "conversion_rate": 2.2046,
        }
        
        response = await self.client.patch(
            f"/{self.unit_conversion.id}",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        self.assertEqual(response_data["from_unit"], "kg")  # 기존 값 유지
        self.assertEqual(response_data["to_unit"], "pound")
        self.assertEqual(float(response_data["conversion_rate"]), 2.2046)

    async def test_update_unit_conversion_partial(self):
        """단위변환 부분 수정 테스트"""
        token = await self.authenticate()
        
        # 일부 필드만 수정
        data = {
            "factory_id": self.factory.id,
            "conversion_rate": 500.0,
        }
        
        response = await self.client.patch(
            f"/{self.unit_conversion.id}",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        
        # 수정되지 않은 필드는 기존 값 유지
        self.assertEqual(response_data["from_unit"], "kg")
        self.assertEqual(response_data["to_unit"], "g")
        self.assertEqual(float(response_data["conversion_rate"]), 500.0)

    async def test_update_unit_conversion_not_found(self):
        """존재하지 않는 단위변환 수정 시도 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "conversion_rate": 2.2046,
        }
        
        response = await self.client.patch(
            "/99999",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 단위변환 정보가 존재하지 않습니다", response.json()["detail"])

    async def test_update_unit_conversion_unauthorized(self):
        """권한 없는 사용자의 단위변환 수정 시도 테스트"""
        token = await self.authenticate_other_user()
        
        data = {
            "factory_id": self.factory.id,
            "conversion_rate": 2.2046,
        }
        
        response = await self.client.patch(
            f"/{self.unit_conversion.id}",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)

    async def test_delete_unit_conversion_success(self):
        """단위변환 삭제 성공 테스트 (204 응답)"""
        token = await self.authenticate()
        
        response = await self.client.delete(
            f"/{self.unit_conversion.id}?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 204)
        
        # 실제로 삭제되었는지 확인
        with self.assertRaises(UnitConversion.DoesNotExist):
            await sync_to_async(UnitConversion.objects.get)(id=self.unit_conversion.id)

    async def test_delete_unit_conversion_not_found(self):
        """존재하지 않는 단위변환 삭제 시도 테스트"""
        token = await self.authenticate()
        
        response = await self.client.delete(
            f"/99999?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 단위변환 정보가 존재하지 않습니다", response.json()["detail"])

    async def test_delete_unit_conversion_unauthorized(self):
        """권한 없는 사용자의 단위변환 삭제 시도 테스트"""
        token = await self.authenticate_other_user()
        
        response = await self.client.delete(
            f"/{self.unit_conversion.id}?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )

        self.assertEqual(response.status_code, 404)

    async def test_invalid_material_id(self):
        """존재하지 않는 원자재 ID로 단위변환 생성 시도 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "material_id": 99999,
            "from_unit": "m",
            "to_unit": "cm",
            "conversion_rate": "100.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)

    async def test_invalid_product_id(self):
        """존재하지 않는 제품 ID로 단위변환 생성 시도 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "product_id": 99999,
            "from_unit": "EA",
            "to_unit": "개",
            "conversion_rate": "1.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)

    async def test_create_unit_conversion_missing_factory_id(self):
        """factory_id 누락시 단위변환 생성 시도 테스트"""
        token = await self.authenticate()
        
        data = {
            "material_id": self.material.id,
            "from_unit": "m",
            "to_unit": "cm",
            "conversion_rate": "100.0000",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 422)  # Validation error

    async def test_create_unit_conversion_invalid_conversion_rate(self):
        """잘못된 변환 비율로 단위변환 생성 시도 테스트"""
        token = await self.authenticate()
        
        data = {
            "factory_id": self.factory.id,
            "material_id": self.material.id,
            "from_unit": "m",
            "to_unit": "cm",
            "conversion_rate": "invalid_rate",
        }
        
        response = await self.client.post(
            "/",
            json=data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 422)  # Validation error

    async def test_get_unit_conversion_by_material_unauthorized(self):
        """권한 없는 사용자의 원자재별 단위변환 조회 시도 테스트"""
        token = await self.authenticate_other_user()
        
        response = await self.client.get(
            f"/material/{self.material.id}?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )

        self.assertEqual(response.status_code, 404)

    async def test_get_unit_conversion_by_product_unauthorized(self):
        """권한 없는 사용자의 제품별 단위변환 조회 시도 테스트"""
        token = await self.authenticate_other_user()
        
        response = await self.client.get(
            f"/product/{self.product.id}?factory_id={self.factory.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        self.assertEqual(response.status_code, 404)
