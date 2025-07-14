from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async

from user.api import router as user_router
from stock.api_material import router as material_router

from user.models import User
from factory.models import Factory, FactoryClient
from stock.models import Material
from user.models import EmailVerification


class TestMaterialAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(material_router)
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
        
        # 테스트 원자재 생성
        self.material = Material.objects.create(
            factory=self.factory,
            name="테스트 원자재",
            code="TEST001",
            spec="테스트 규격",
            unit="EA",
            current_stock=100,
            standard_stock=50
        )

    async def authenticate(self):
        """사용자 인증 및 토큰 반환"""
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_get_materials_by_factory_success(self):
        """공장별 원자재 목록 조회 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get(f"/factory/{self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("materials", data)
        self.assertEqual(len(data["materials"]), 1)
        
        material_data = data["materials"][0]
        self.assertEqual(material_data["id"], self.material.id)
        self.assertEqual(material_data["name"], "테스트 원자재")
        self.assertEqual(material_data["code"], "TEST001")
        self.assertEqual(material_data["spec"], "테스트 규격")
        self.assertEqual(material_data["unit"], "EA")
        self.assertEqual(material_data["current_stock"], 100)

    async def test_get_materials_by_factory_not_found(self):
        """존재하지 않는 공장 조회 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get("/factory/99999", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "공장 정보를 찾을 수 없습니다.")

    async def test_get_materials_by_factory_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"/factory/{self.factory.id}")
        self.assertEqual(response.status_code, 401)

    async def test_get_material_detail_success(self):
        """원자재 상세 조회 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["id"], self.material.id)
        self.assertEqual(data["name"], "테스트 원자재")
        self.assertEqual(data["code"], "TEST001")
        self.assertEqual(data["spec"], "테스트 규격")
        self.assertEqual(data["unit"], "EA")
        self.assertEqual(data["current_stock"], 100)
        self.assertEqual(data["standard_stock"], 50)

    async def test_get_material_detail_not_found(self):
        """존재하지 않는 원자재 조회 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get("/99999", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_get_material_detail_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"/{self.material.id}")
        self.assertEqual(response.status_code, 401)

    async def test_update_material_success(self):
        """원자재 수정 성공 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": "수정된 원자재",
            "spec": "수정된 규격",
            "current_stock": 150,
            "standard_stock": 75
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["name"], "수정된 원자재")
        self.assertEqual(data["spec"], "수정된 규격")
        self.assertEqual(data["current_stock"], 150)
        self.assertEqual(data["standard_stock"], 75)
        
        # 데이터베이스에서 실제로 업데이트되었는지 확인
        await sync_to_async(self.material.refresh_from_db)()
        self.assertEqual(self.material.name, "수정된 원자재")
        self.assertEqual(self.material.spec, "수정된 규격")
        self.assertEqual(self.material.current_stock, 150)
        self.assertEqual(self.material.standard_stock, 75)

    async def test_update_material_partial(self):
        """원자재 부분 수정 테스트"""
        headers = await self.authenticate()
        
        # 이름만 수정
        payload = {
            "name": "부분 수정된 원자재"
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["name"], "부분 수정된 원자재")
        self.assertEqual(data["code"], "TEST001")  # 변경되지 않음
        self.assertEqual(data["current_stock"], 100)  # 변경되지 않음

    async def test_update_material_duplicate_code(self):
        """중복된 자재코드로 수정 시도 테스트"""
        # 다른 원자재 생성
        other_material = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="다른 원자재",
            code="TEST002",
            spec="다른 규격",
            unit="KG",
            current_stock=50,
            standard_stock=25
        )
        
        headers = await self.authenticate()
        
        # 기존 원자재의 코드를 다른 원자재의 코드로 변경 시도
        payload = {
            "code": "TEST002"
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "이미 존재하는 자재코드입니다.")

    async def test_update_material_not_found(self):
        """존재하지 않는 원자재 수정 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": "수정된 원자재"
        }
        
        response = await self.client.patch("/99999", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_update_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        payload = {
            "name": "수정된 원자재"
        }
        
        response = await self.client.patch(f"/{self.material.id}", json=payload)
        self.assertEqual(response.status_code, 401)

    async def test_delete_material_success(self):
        """원자재 삭제 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.delete(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재가 성공적으로 삭제되었습니다.")
        
        # 데이터베이스에서 실제로 삭제되었는지 확인
        material_exists = await sync_to_async(Material.objects.filter(id=self.material.id).exists)()
        self.assertFalse(material_exists)

    async def test_delete_material_not_found(self):
        """존재하지 않는 원자재 삭제 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.delete("/99999", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_delete_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.delete(f"/{self.material.id}")
        self.assertEqual(response.status_code, 401)

    async def test_multiple_materials_in_factory(self):
        """한 공장에 여러 원자재가 있는 경우 테스트"""
        # 추가 원자재 생성
        material2 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="테스트 원자재 2",
            code="TEST002",
            spec="테스트 규격 2",
            unit="KG",
            current_stock=200,
            standard_stock=100
        )
        
        material3 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="테스트 원자재 3",
            code="TEST003",
            spec="테스트 규격 3",
            unit="M",
            current_stock=300,
            standard_stock=150
        )
        
        headers = await self.authenticate()
        
        response = await self.client.get(f"/factory/{self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["materials"]), 3)
        
        # 생성 시간 역순으로 정렬되어 있는지 확인 (최신이 먼저)
        material_ids = [m["id"] for m in data["materials"]]
        self.assertEqual(material_ids[0], material3.id)  # 가장 최근 생성
        self.assertEqual(material_ids[1], material2.id)
        self.assertEqual(material_ids[2], self.material.id)  # 가장 오래된 것

    async def test_material_update_with_same_code(self):
        """같은 자재코드로 수정하는 경우 테스트 (성공해야 함)"""
        headers = await self.authenticate()
        
        payload = {
            "name": "수정된 원자재",
            "code": "TEST001"  # 기존과 같은 코드
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["name"], "수정된 원자재")
        self.assertEqual(data["code"], "TEST001")

    async def test_material_update_with_null_values(self):
        """None 값으로 수정하는 경우 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": None,
            "current_stock": None
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        # None 값은 무시되어야 함
        data = response.json()
        self.assertEqual(data["name"], "테스트 원자재")  # 변경되지 않음
        self.assertEqual(data["current_stock"], 100)  # 변경되지 않음

    async def test_material_update_with_empty_string(self):
        """빈 문자열로 수정하는 경우 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": "",
            "spec": ""
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["name"], "")  # 빈 문자열로 변경됨
        self.assertEqual(data["spec"], "")  # 빈 문자열로 변경됨
