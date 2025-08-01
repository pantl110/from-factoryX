from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async

from user.api import router as user_router
from stock.api_material_history import router as material_history_router

from user.models import User
from factory.models import Factory, FactoryClient
from stock.models import Material, MaterialHistory
from tax.models import NationalTaxService, CashReceipt
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
        
        # FactoryMember 생성 (사용자를 공장 멤버로 추가)
        from factory.models import FactoryMember
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user
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
        # 원자재 생성 전 개수 확인
        initial_material_count = await sync_to_async(Material.objects.filter(factory=self.factory).count)()
        self.assertEqual(initial_material_count, 1)  # setUp에서 생성된 1개
        
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
        
        # 실제로 원자재가 데이터베이스에 생성되었는지 확인
        material1 = await sync_to_async(Material.objects.get)(
            factory=self.factory,
            code="NEW001"
        )
        self.assertEqual(material1.name, "새로운 원자재1")
        self.assertEqual(material1.current_stock, 100)
        self.assertEqual(material1.spec, "규격1")
        self.assertEqual(material1.unit, "EA")
        
        material2 = await sync_to_async(Material.objects.get)(
            factory=self.factory,
            code="NEW002"
        )
        self.assertEqual(material2.name, "새로운 원자재2")
        self.assertEqual(material2.current_stock, 50)
        self.assertEqual(material2.spec, "규격2")
        self.assertEqual(material2.unit, "KG")
        
        # 총 원자재 개수 확인 (기존 1개 + 새로 생성된 2개 = 3개)
        total_materials = await sync_to_async(Material.objects.filter(factory=self.factory).count)()
        self.assertEqual(total_materials, 3)
        
        # 원자재 생성 전후 개수 비교
        self.assertEqual(total_materials, initial_material_count + 2)  # 2개가 새로 생성됨

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
        
        # 새로운 원자재가 실제로 데이터베이스에 생성되었는지 확인
        new_material = await sync_to_async(Material.objects.get)(
            factory=self.factory,
            code="NEW003"
        )
        self.assertEqual(new_material.name, "새로운 원자재")
        self.assertEqual(new_material.current_stock, 25)
        self.assertEqual(new_material.spec, "규격3")
        self.assertEqual(new_material.unit, "EA")
        
        # 총 원자재 개수 확인 (기존 2개 + 새로 생성된 1개 = 3개)
        total_materials = await sync_to_async(Material.objects.filter(factory=self.factory).count)()
        self.assertEqual(total_materials, 3)
        
        # 원자재 생성 전후 개수 비교 (기존 1개 + 테스트에서 생성된 1개 + 새로 생성된 1개 = 3개)
        self.assertEqual(total_materials, 3)

    async def test_material_creation_with_history(self):
        """원자재 히스토리 생성 시 원자재도 함께 생성되는지 확인"""
        # 원자재 생성 전 개수 확인
        initial_count = await sync_to_async(Material.objects.filter(factory=self.factory).count)()
        self.assertEqual(initial_count, 1)  # setUp에서 생성된 1개
        
        headers = await self.authenticate()
        payload = {
            "factory": self.factory.id,
            "client_info": {
                "name": "신규 거래처",
                "business_registration_number": "111-22-33333",
                "representative_name": "박영희",
                "business_type": "제조업",
                "business_category": "전자부품",
                "address": "대전시 유성구"
            },
            "materials": [
                {
                    "name": "테스트 원자재",
                    "code": "TEST_MATERIAL",
                    "spec": "테스트 규격",
                    "unit": "개",
                    "quantity": 75,
                    "price": 1500
                }
            ]
        }
        
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        # 원자재 생성 후 개수 확인
        final_count = await sync_to_async(Material.objects.filter(factory=self.factory).count)()
        self.assertEqual(final_count, initial_count + 1)  # 1개가 새로 생성됨
        
        # 생성된 원자재 확인
        new_material = await sync_to_async(Material.objects.get)(
            factory=self.factory,
            code="TEST_MATERIAL"
        )
        self.assertEqual(new_material.name, "테스트 원자재")
        self.assertEqual(new_material.current_stock, 75)
        self.assertEqual(new_material.spec, "테스트 규격")
        self.assertEqual(new_material.unit, "개")
        
        # 히스토리도 생성되었는지 확인
        history_count = await sync_to_async(MaterialHistory.objects.filter(material=new_material).count)()
        self.assertEqual(history_count, 1)

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
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()["data"]
        self.assertTrue(len(data) >= 1)

    async def test_get_material_history_by_date_range_success(self):
        """원자재 히스토리 조회 성공 테스트 (날짜 범위)"""
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
        
        # 2025년 히스토리 조회
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}&start_date=2025-01-01&end_date=2025-12-31", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()["data"]
        self.assertTrue(len(data) >= 1)



    async def test_get_material_history_material_not_found(self):
        """존재하지 않는 원자재 히스토리 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/?material_id=99999&factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_get_material_history_unauthorized(self):
        """인증되지 않은 사용자 히스토리 조회 테스트"""
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}")
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
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()["data"]
        for history in data:
            for field in ["id", "type", "client_name", "quantity", "unit_price", "amount", "date", "total_stock", "purchase_tax_invoice_id", "cash_receipt_id"]:
                self.assertIn(field, history)
            
            # 필드 값 검증
            self.assertIsInstance(history["total_stock"], int)
            self.assertIsInstance(history["purchase_tax_invoice_id"], (int, type(None)))
            self.assertIsInstance(history["cash_receipt_id"], (int, type(None)))

    async def test_get_material_history_by_type_filter(self):
        """원자재 히스토리 타입별 필터링 테스트"""
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
        
        # 구매 타입만 조회
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}&type=구매", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        
        # 모든 결과가 구매 타입인지 확인
        for history in data:
            self.assertEqual(history["type"], "구매")
        
        # 소모 타입만 조회
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}&type=소모", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        
        # 모든 결과가 소모 타입인지 확인
        for history in data:
            self.assertEqual(history["type"], "소모")

    async def test_get_material_history_by_type_and_date_filter(self):
        """원자재 히스토리 타입과 날짜 필터 조합 테스트"""
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
        
        # 구매 타입 + 날짜 범위 조회
        response = await self.client.get(
            f"/?material_id={self.material.id}&factory_id={self.factory.id}&type=구매&start_date=2025-01-01&end_date=2025-12-31", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        
        # 모든 결과가 구매 타입인지 확인
        for history in data:
            self.assertEqual(history["type"], "구매")

    async def test_get_material_history_invalid_type_filter(self):
        """잘못된 타입 필터 테스트"""
        headers = await self.authenticate()
        
        # 잘못된 타입으로 조회
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}&type=잘못된타입", headers=headers)
        self.assertEqual(response.status_code, 200)  # 필터가 적용되어 빈 결과 반환
        
        data = response.json()["data"]
        self.assertEqual(len(data), 0)  # 잘못된 타입이므로 결과가 없어야 함

    async def test_get_material_history_with_tax_invoice_and_cash_receipt(self):
        """세금계산서와 현금영수증이 연결된 원자재 히스토리 조회 테스트"""
        headers = await self.authenticate()
        
        # 세금계산서 생성
        tax_invoice = await sync_to_async(NationalTaxService.objects.create)(
            user=self.user,
            factory=self.factory,
            client=self.client_obj,
            publish_status="발행 완료",
            tax_invoice_type="매입",
            transaction_type="영수",
            transaction_date="2025-01-15",
            transaction_amount=100000,
            tax_amount=10000,
            is_hidden=False
        )
        
        # 현금영수증 생성
        cash_receipt = await sync_to_async(CashReceipt.objects.create)(
            transaction_date="2025-01-15",
            approval_number="TEST001",
            transaction_classification="매입",
            transaction_purpose="원자재 구매",
            client=self.client_obj,
            transaction_amount=50000,
            tax_amount=5000
        )
        
        # 세금계산서가 연결된 히스토리 생성
        tax_history = await sync_to_async(MaterialHistory.objects.create)(
            type="구매",
            material=self.material,
            client=self.client_obj,
            quantity=10,
            price=10000,
            total_stock=110,  # 기존 100 + 새로 10
            purchase_tax_invoice=tax_invoice,
            cash_receipt=None
        )
        
        # 현금영수증이 연결된 히스토리 생성
        cash_history = await sync_to_async(MaterialHistory.objects.create)(
            type="구매",
            material=self.material,
            client=self.client_obj,
            quantity=5,
            price=10000,
            total_stock=115,  # 기존 110 + 새로 5
            purchase_tax_invoice=None,
            cash_receipt=cash_receipt
        )
        
        # 히스토리 조회
        response = await self.client.get(f"/?material_id={self.material.id}&factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()["data"]
        self.assertGreaterEqual(len(data), 2)
        
        # 세금계산서 연결 히스토리 확인
        tax_history_data = next((h for h in data if h["id"] == tax_history.id), None)
        self.assertIsNotNone(tax_history_data)
        self.assertEqual(tax_history_data["purchase_tax_invoice_id"], tax_invoice.id)
        self.assertIsNone(tax_history_data["cash_receipt_id"])
        
        # 현금영수증 연결 히스토리 확인
        cash_history_data = next((h for h in data if h["id"] == cash_history.id), None)
        self.assertIsNotNone(cash_history_data)
        self.assertEqual(cash_history_data["cash_receipt_id"], cash_receipt.id)
        self.assertIsNone(cash_history_data["purchase_tax_invoice_id"])

    async def test_create_material_history_update_existing_client(self):
        """기존 거래처 명으로 이력 생성 시 거래처 정보가 업데이트되는지 테스트"""
        headers = await self.authenticate()
        # 기존 거래처 생성
        old_client = await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            name="업데이트 거래처",
            business_registration_number="111-11-11111",
            representative_name="이전대표",
            business_type="도소매",
            business_category="기타",
            address="구주소"
        )
        # 기존 거래처와 같은 이름, 다른 정보로 요청
        payload = {
            "factory": self.factory.id,
            "client_info": {
                "name": "업데이트 거래처",
                "business_registration_number": "222-22-22222",
                "representative_name": "새대표",
                "business_type": "제조업",
                "business_category": "전자부품",
                "address": "신주소"
            },
            "materials": [
                {
                    "name": "업데이트 원자재",
                    "code": "UPD001",
                    "spec": "규격U",
                    "unit": "EA",
                    "quantity": 10,
                    "price": 5000
                }
            ]
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        # 거래처 정보가 업데이트 되었는지 확인
        await sync_to_async(old_client.refresh_from_db)()
        self.assertEqual(old_client.business_registration_number, "222-22-22222")
        self.assertEqual(old_client.representative_name, "새대표")
        self.assertEqual(old_client.business_type, "제조업")
        self.assertEqual(old_client.business_category, "전자부품")
        self.assertEqual(old_client.address, "신주소")
        # 생성된 이력의 client_id가 기존 거래처와 같은지 확인
        data = response.json()
        self.assertEqual(data["materials"][0]["client_id"], old_client.id)
