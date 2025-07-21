from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async

from user.api import router as user_router
from stock.api_material_history import router as material_history_router

from user.models import User
from factory.models import Factory, FactoryClient
from stock.models import Material, MaterialHistory
from user.models import EmailVerification


class TestMaterialHistoryAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(material_history_router)
        self.auth_client = TestAsyncClient(user_router)

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
        self.client_obj = FactoryClient.objects.create(
            factory=self.factory,
            name="Test Client",
            business_registration_number="987-65-43210",
        )
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
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_create_material_history_new_materials(self):
        """새로운 원자재들로 이력 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "factory": self.factory.id,
            "client_info": {
                "name": "테스트 거래처",
                "business_registration_number": "123-45-67890",
                "representative_name": "홍길동",
                "business_type": "제조업",
                "business_category": "전자부품",
                "address": "서울시 강남구"
            },
            "materials": [
                {
                    "name": "새로운 원자재1",
                    "code": "NEW001",
                    "spec": "규격1",
                    "unit": "EA",
                    "quantity": 100,
                    "price": 1000
                },
                {
                    "name": "새로운 원자재2",
                    "code": "NEW002",
                    "spec": "규격2",
                    "unit": "KG",
                    "quantity": 50,
                    "price": 2000
                }
            ]
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("materials", data)
        self.assertEqual(len(data["materials"]), 2)
        
        # 첫 번째 원자재 확인
        self.assertEqual(data["materials"][0]["type"], "구매")
        self.assertEqual(data["materials"][0]["quantity"], 100)
        self.assertEqual(data["materials"][0]["price"], 1000)
        self.assertEqual(data["materials"][0]["total_stock"], 100)
        
        # 두 번째 원자재 확인
        self.assertEqual(data["materials"][1]["type"], "구매")
        self.assertEqual(data["materials"][1]["quantity"], 50)
        self.assertEqual(data["materials"][1]["price"], 2000)
        self.assertEqual(data["materials"][1]["total_stock"], 50)

    async def test_create_material_history_mixed_materials(self):
        """기존 원자재와 새로운 원자재 혼합 테스트"""
        # 먼저 기존 원자재 생성
        material = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="기존 원자재",
            code="EXIST001",
            spec="규격2",
            unit="KG",
            current_stock=50
        )
        
        headers = await self.authenticate()
        payload = {
            "factory": self.factory.id,
            "client_info": {
                "name": "테스트 거래처2",
                "business_registration_number": "987-65-43210",
                "representative_name": "김철수",
                "business_type": "도매업",
                "business_category": "철강",
                "address": "부산시 해운대구"
            },
            "materials": [
                {
                    "name": "기존 원자재",
                    "code": "EXIST001",
                    "spec": "규격2",
                    "unit": "KG",
                    "quantity": 30,
                    "price": 2000
                },
                {
                    "name": "새로운 원자재",
                    "code": "NEW003",
                    "spec": "규격3",
                    "unit": "EA",
                    "quantity": 25,
                    "price": 1500
                }
            ]
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["materials"]), 2)
        
        # 기존 원자재 재고 업데이트 확인
        await sync_to_async(material.refresh_from_db)()
        self.assertEqual(data["materials"][0]["total_stock"], 80)  # 50 + 30
        self.assertEqual(material.current_stock, 80)
        
        # 새로운 원자재 확인
        self.assertEqual(data["materials"][1]["total_stock"], 25)

    async def test_create_single_material_history_purchase_success(self):
        """단일 원자재 구매 이력 생성 성공 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["type"], "구매")
        self.assertEqual(data["quantity"], 50)
        self.assertEqual(data["price"], 2000)
        self.assertEqual(data["total_stock"], 150)  # 100 + 50
        
        # 재고 업데이트 확인
        await sync_to_async(self.material.refresh_from_db)()
        self.assertEqual(self.material.current_stock, 150)

    async def test_create_single_material_history_consumption_success(self):
        """단일 원자재 소모 이력 생성 성공 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": self.material.id,
            "type": "소모",
            "quantity": 30,
            "price": None,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["type"], "소모")
        self.assertEqual(data["quantity"], 30)
        self.assertIsNone(data["price"])
        self.assertEqual(data["total_stock"], 70)  # 100 - 30
        
        # 재고 업데이트 확인
        await sync_to_async(self.material.refresh_from_db)()
        self.assertEqual(self.material.current_stock, 70)

    async def test_create_single_material_history_material_not_found(self):
        """존재하지 않는 원자재 이력 생성 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": 99999,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_create_single_material_history_client_not_found(self):
        """존재하지 않는 거래처 이력 생성 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": 99999
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "거래처 정보를 찾을 수 없습니다.")

    async def test_create_single_material_history_invalid_type(self):
        """잘못된 거래 타입 이력 생성 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": self.material.id,
            "type": "invalid_type",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "잘못된 거래 타입입니다. 'purchase' 또는 'consumption'을 입력해주세요.")

    async def test_create_single_material_history_purchase_without_price(self):
        """구매 시 가격 미입력 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": None,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "구매 시에는 가격을 입력해주세요.")

    async def test_create_single_material_history_insufficient_stock(self):
        """재고 부족 시 소모 이력 생성 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "material_id": self.material.id,
            "type": "소모",
            "quantity": 150,  # 현재 재고(100)보다 많은 수량
            "price": None,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "재고가 부족합니다.")

    async def test_create_single_material_history_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        
        response = await self.client.post("/single", json=payload)
        self.assertEqual(response.status_code, 401)

    async def test_get_material_history_success(self):
        """원자재 히스토리 조회 성공 테스트 (전체 히스토리)"""
        # 먼저 히스토리 데이터 생성
        headers = await self.authenticate()
        
        # 구매 히스토리 생성
        purchase_payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=purchase_payload)
        
        # 소모 히스토리 생성
        consumption_payload = {
            "material_id": self.material.id,
            "type": "소모",
            "quantity": 20,
            "price": None,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=consumption_payload)
        
        # 전체 히스토리 조회 (기간 파라미터 없음)
        response = await self.client.get(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 2)  # 구매 1개 + 소모 1개
        
        # 최신순으로 정렬되어 있는지 확인 (소모가 먼저, 구매가 나중에)
        self.assertEqual(data["data"][0]["type"], "소모")
        self.assertEqual(data["data"][1]["type"], "구매")

    async def test_get_material_history_by_days_success(self):
        """원자재 히스토리 조회 성공 테스트 (일별 기간)"""
        headers = await self.authenticate()
        
        # 히스토리 데이터 생성
        purchase_payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=purchase_payload)
        
        consumption_payload = {
            "material_id": self.material.id,
            "type": "소모",
            "quantity": 20,
            "price": None,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=consumption_payload)
        
        # 최근 7일 히스토리 조회
        response = await self.client.get(f"/{self.material.id}?days=7", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 2)  # 7일 내의 모든 히스토리
        
        # 최근 30일 히스토리 조회
        response = await self.client.get(f"/{self.material.id}?days=30", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 2)  # 30일 내의 모든 히스토리

    async def test_get_material_history_by_months_success(self):
        """원자재 히스토리 조회 성공 테스트 (월별 기간)"""
        headers = await self.authenticate()
        
        # 히스토리 데이터 생성
        purchase_payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=purchase_payload)
        
        consumption_payload = {
            "material_id": self.material.id,
            "type": "소모",
            "quantity": 20,
            "price": None,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=consumption_payload)
        
        # 최근 1개월 히스토리 조회
        response = await self.client.get(f"/{self.material.id}?months=1", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 2)  # 1개월 내의 모든 히스토리
        
        # 최근 3개월 히스토리 조회
        response = await self.client.get(f"/{self.material.id}?months=3", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 2)  # 3개월 내의 모든 히스토리

    async def test_get_material_history_priority_validation(self):
        """원자재 히스토리 조회 우선순위 검증 테스트 (days와 months 동시 사용)"""
        headers = await self.authenticate()
        
        # 히스토리 데이터 생성
        purchase_payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=purchase_payload)
        
        # days와 months를 동시에 사용하는 경우 days가 우선
        response = await self.client.get(f"/{self.material.id}?days=7&months=3", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 1)  # 7일 내의 히스토리만

    async def test_get_material_history_material_not_found(self):
        """존재하지 않는 원자재 히스토리 조회 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get("/99999", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_get_material_history_unauthorized(self):
        """인증되지 않은 사용자 히스토리 조회 테스트"""
        response = await self.client.get(f"/{self.material.id}")
        self.assertEqual(response.status_code, 401)

    async def test_get_material_history_data_validation(self):
        """원자재 히스토리 데이터 검증 테스트"""
        headers = await self.authenticate()
        
        # 히스토리 데이터 생성
        purchase_payload = {
            "material_id": self.material.id,
            "type": "구매",
            "quantity": 50,
            "price": 2000,
            "client_id": self.client_obj.id
        }
        await self.client.post("/single", headers=headers, json=purchase_payload)
        
        # 히스토리 조회
        response = await self.client.get(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        history = data["data"][0]
        
        # 필수 필드 검증
        required_fields = ["id", "type", "material_id", "client_id", "quantity", "price", "total_stock"]
        for field in required_fields:
            self.assertIn(field, history)
        
        # 데이터 타입 검증
        self.assertIsInstance(history["id"], int)
        self.assertIsInstance(history["type"], str)
        self.assertIsInstance(history["material_id"], int)
        self.assertIsInstance(history["client_id"], int)
        self.assertIsInstance(history["quantity"], int)
        self.assertIsInstance(history["total_stock"], int)
        
        # 값 검증
        self.assertEqual(history["type"], "구매")
        self.assertEqual(history["material_id"], self.material.id)
        self.assertEqual(history["client_id"], self.client_obj.id)
        self.assertEqual(history["quantity"], 50)
        self.assertEqual(history["price"], 2000)
