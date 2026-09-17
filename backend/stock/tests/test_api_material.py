from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async
from datetime import date, timedelta
from decimal import Decimal

from user.api import router as user_router
from stock.api_material import router as material_router

from user.models import User
from factory.models import Factory, FactoryMember
from stock.models import Material, MaterialHistory
from user.models import EmailVerification
from substitute.models import Substitute


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

        # FactoryMember 생성 (권한 문제 해결)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 테스트 원자재 생성
        self.material = Material.objects.create(
            factory=self.factory,
            name="테스트 원자재",
            code="TEST001",
            spec="테스트 규격",
            unit="EA",
            current_stock=100,
            standard_stock=50,
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

    async def test_create_materials_success(self):
        """원자재 생성 성공 테스트 (단일)"""
        headers = await self.authenticate()
        payload = [
            {
                "name": "새로운 원자재",
                "code": "NEW001",
                "spec": "새로운 규격",
                "unit": "개",
                "current_stock": 25,
                "standard_stock": 10,
            }
        ]
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("material_ids", data)
        self.assertIn("message", data)
        self.assertEqual(data["message"], "1개의 원자재가 성공적으로 생성되었습니다.")
        self.assertEqual(len(data["material_ids"]), 1)

        # DB에 실제로 생성되었는지 확인
        material_exists = await sync_to_async(
            Material.objects.filter(id=data["material_ids"][0]).exists
        )()
        self.assertTrue(material_exists)

    async def test_create_materials_duplicate_code(self):
        """중복된 원자재 코드로 생성 시도시 건너뛰기 테스트"""
        headers = await self.authenticate()
        payload = [
            {
                "name": "중복 원자재",
                "code": "TEST001",  # 이미 존재하는 코드
                "spec": "중복 규격",
            }
        ]
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(len(data["material_ids"]), 0)  # 중복으로 인해 생성되지 않음
        self.assertIn("중복된 코드가 있었습니다", data["message"])

    async def test_create_materials_missing_factory_id(self):
        """factory_id 누락시 실패 테스트"""
        headers = await self.authenticate()
        payload = [{"name": "테스트 원자재", "code": "TEST002", "spec": "테스트 규격"}]
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("factory_id를 입력해야 합니다.", data.get("detail", ""))

    async def test_create_materials_with_default_values(self):
        """기본값으로 원자재 생성 테스트"""
        headers = await self.authenticate()
        payload = [{"name": "기본값 원자재", "code": "DEFAULT001", "spec": "기본 규격"}]
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("material_ids", data)

        # DB에서 기본값 확인
        material = await sync_to_async(Material.objects.get)(id=data["material_ids"][0])
        self.assertEqual(material.unit, "EA")
        self.assertEqual(material.current_stock, 0)  # 모델 기본값 사용
        self.assertIsNone(material.standard_stock)  # null=True로 변경됨
        self.assertIsNone(material.expiry_days)  # 기본값 None

    async def test_create_materials_unauthorized(self):
        """인증되지 않은 사용자 요청 실패 테스트"""
        payload = [
            {"name": "인증 실패 원자재", "code": "AUTH001", "spec": "인증 실패 규격"}
        ]
        response = await self.client.post(
            f"?factory_id={self.factory.id}", json=payload
        )
        self.assertEqual(response.status_code, 401)

    async def test_create_multiple_materials_success(self):
        """여러 원자재 생성 성공 테스트"""
        headers = await self.authenticate()
        payload = [
            {
                "name": "원자재1",
                "code": "MAT001",
                "spec": "규격1",
                "unit": "개",
                "current_stock": 10,
                "standard_stock": 5,
            },
            {
                "name": "원자재2",
                "code": "MAT002",
                "spec": "규격2",
                "unit": "EA",
                "current_stock": 20,
                "standard_stock": 10,
            },
            {"name": "원자재3", "code": "MAT003", "spec": "규격3"},
        ]
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("material_ids", data)
        self.assertIn("message", data)
        self.assertEqual(data["message"], "3개의 원자재가 성공적으로 생성되었습니다.")
        self.assertEqual(len(data["material_ids"]), 3)

        # DB에 실제로 생성되었는지 확인
        for material_id in data["material_ids"]:
            material_exists = await sync_to_async(
                Material.objects.filter(id=material_id).exists
            )()
            self.assertTrue(material_exists)

    async def test_create_materials_duplicate_codes_in_payload(self):
        """요청 내에서 중복된 코드로 생성 시도시 건너뛰기 테스트"""
        headers = await self.authenticate()
        payload = [
            {"name": "원자재1", "code": "DUPLICATE001", "spec": "규격1"},
            {"name": "원자재2", "code": "DUPLICATE001", "spec": "규격2"},  # 중복된 코드
        ]
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(
            len(data["material_ids"]), 1
        )  # 첫 번째만 생성되고 두 번째는 건너뛰어짐
        self.assertIn("중복된 코드가 있었습니다", data["message"])

    async def test_get_materials_by_factory_success(self):
        """공장별 원자재 목록 조회 성공 테스트"""
        headers = await self.authenticate()

        # factory_id를 GET 파라미터로 전달
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        # 페이지네이션 응답 구조 확인
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("pageCnt", data)
        self.assertIn("curPage", data)
        self.assertEqual(len(data["data"]), 1)

        material_data = data["data"][0]
        self.assertEqual(material_data["id"], self.material.id)
        self.assertEqual(material_data["name"], "테스트 원자재")
        self.assertEqual(material_data["code"], "TEST001")
        self.assertEqual(material_data["spec"], "테스트 규격")
        self.assertEqual(material_data["unit"], "EA")
        # current_stock 는 문자열 '100.00' 형태로 반환되므로 숫자로 변환해 비교
        self.assertEqual(Decimal(str(material_data["current_stock"])), Decimal("100"))
        self.assertIn("status", material_data)

        # 페이지네이션 정보 확인
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["totalCnt"], 1)
        self.assertEqual(data["pageCnt"], 1)
        self.assertEqual(data["curPage"], 1)

    async def test_get_materials_by_factory_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()

        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다."
        )

    async def test_get_materials_by_factory_not_found(self):
        """존재하지 않는 공장 조회 테스트"""
        headers = await self.authenticate()

        response = await self.client.get("?factory_id=99999", headers=headers)
        self.assertEqual(response.status_code, 404)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "해당 공장에 멤버가 아닙니다."
        )

    async def test_get_materials_by_factory_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"?factory_id={self.factory.id}")
        self.assertEqual(response.status_code, 401)

    async def test_get_material_detail_success(self):
        """원자재 상세 조회 성공 테스트"""
        headers = await self.authenticate()

        response = await self.client.get(
            f"/{self.material.id}?factory_id={self.factory.id}", headers=headers
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["id"], self.material.id)
        self.assertEqual(data["name"], "테스트 원자재")
        self.assertEqual(data["code"], "TEST001")
        self.assertEqual(data["spec"], "테스트 규격")
        self.assertEqual(data["unit"], "EA")
        self.assertEqual(Decimal(str(data["current_stock"])), Decimal("100"))
        self.assertEqual(Decimal(str(data["standard_stock"])), Decimal("50"))

    async def test_get_material_detail_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()

        response = await self.client.get(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다."
        )

    async def test_get_material_detail_not_found(self):
        """존재하지 않는 원자재 조회 테스트"""
        headers = await self.authenticate()

        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다."
        )

    async def test_get_material_detail_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(
            f"/{self.material.id}?factory_id={self.factory.id}"
        )
        self.assertEqual(response.status_code, 401)

    async def test_update_material_success(self):
        """원자재 수정 성공 테스트"""
        headers = await self.authenticate()

        payload = {
            "name": "수정된 원자재",
            "spec": "수정된 규격",
            "current_stock": 150,
            "standard_stock": 75,
        }

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["name"], "수정된 원자재")
        self.assertEqual(data["spec"], "수정된 규격")
        self.assertEqual(Decimal(str(data["current_stock"])), Decimal("150"))
        self.assertEqual(Decimal(str(data["standard_stock"])), Decimal("75"))

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
        payload = {"name": "부분 수정된 원자재"}

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["name"], "부분 수정된 원자재")
        self.assertEqual(data["code"], "TEST001")  # 변경되지 않음
        self.assertEqual(Decimal(str(data["current_stock"])), Decimal("100"))  # 변경되지 않음

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
            standard_stock=25,
        )

        headers = await self.authenticate()

        # 기존 원자재의 코드를 다른 원자재의 코드로 변경 시도
        payload = {"code": "TEST002"}

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "이미 존재하는 자재코드입니다."
        )

    async def test_update_material_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()

        payload = {"name": "수정된 원자재"}

        response = await self.client.patch(
            f"/{self.material.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다."
        )

    async def test_update_material_not_found(self):
        """존재하지 않는 원자재 수정 테스트"""
        headers = await self.authenticate()

        payload = {"name": "수정된 원자재"}

        response = await self.client.patch(
            f"/99999?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다."
        )

    async def test_update_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        payload = {"name": "수정된 원자재"}

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}", json=payload
        )
        self.assertEqual(response.status_code, 401)

    async def test_delete_material_success(self):
        """원자재 삭제 성공 테스트"""
        headers = await self.authenticate()

        response = await self.client.delete(
            f"/{self.material.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"),
            "원자재가 성공적으로 삭제되었습니다.",
        )

        # 데이터베이스에서 실제로 삭제되었는지 확인
        material_exists = await sync_to_async(
            Material.objects.filter(id=self.material.id).exists
        )()
        self.assertFalse(material_exists)

    async def test_delete_material_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()

        response = await self.client.delete(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다."
        )

    async def test_delete_material_not_found(self):
        """존재하지 않는 원자재 삭제 테스트"""
        headers = await self.authenticate()

        response = await self.client.delete(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다."
        )

    async def test_delete_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.delete(
            f"/{self.material.id}?factory_id={self.factory.id}"
        )
        self.assertEqual(response.status_code, 401)

    async def test_assign_material_success(self):
        """원자재 생성 및 품목 연결 성공 테스트"""
        headers = await self.authenticate()

        # 테스트용 Product 생성
        from stock.models import Product

        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD100",
            unit="EA",
            spec="테스트 스펙",
        )

        payload = {
            "product_id": product.id,
            "materials": [
                {
                    "name": "신규원자재1",
                    "code": "NEWMAT001",
                    "spec": "규격A",
                    "quantity": 10,
                },
                {
                    "name": "신규원자재2",
                    "code": "NEWMAT002",
                    "spec": "규격B",
                    "quantity": 20,
                },
                {
                    "name": self.material.name,
                    "code": self.material.code,
                    "spec": self.material.spec,
                    "quantity": 30,
                },  # 기존 원자재
            ],
        }

        response = await self.client.post(
            f"/assign?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("material_ids", data)
        self.assertIn("message", data)
        self.assertEqual(data["message"], "원자재가 성공적으로 생성 및 연결되었습니다.")
        self.assertEqual(len(data["material_ids"]), 3)  # 3개의 원자재 ID 반환

        # DB에 신규 원자재가 생성되었는지, 연결이 되었는지 확인
        from stock.models import Material, MaterialProduct

        mat1 = await sync_to_async(Material.objects.get)(
            code="NEWMAT001", factory=self.factory
        )
        mat2 = await sync_to_async(Material.objects.get)(
            code="NEWMAT002", factory=self.factory
        )

        # 반환된 ID들이 실제 생성된 원자재 ID와 일치하는지 확인
        self.assertIn(mat1.id, data["material_ids"])
        self.assertIn(mat2.id, data["material_ids"])
        self.assertIn(self.material.id, data["material_ids"])

        # 연결 확인
        self.assertTrue(
            await sync_to_async(
                MaterialProduct.objects.filter(
                    product=product, material=mat1, quantity=10
                ).exists
            )()
        )
        self.assertTrue(
            await sync_to_async(
                MaterialProduct.objects.filter(
                    product=product, material=mat2, quantity=20
                ).exists
            )()
        )
        self.assertTrue(
            await sync_to_async(
                MaterialProduct.objects.filter(
                    product=product, material=self.material, quantity=30
                ).exists
            )()
        )

    async def test_assign_material_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()

        from stock.models import Product

        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD200",
            unit="EA",
            spec="테스트 스펙",
        )

        payload = {
            "product_id": product.id,
            "materials": [
                {"name": "신규원자재", "code": "NEWCODE", "spec": "규격", "quantity": 5}
            ],
        }

        response = await self.client.post("/assign", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다."
        )

    async def test_assign_material_wrong_factory(self):
        """품목이 공장에 속하지 않을 때 실패 테스트"""
        headers = await self.authenticate()

        from stock.models import Product

        # 다른 공장, 다른 품목 생성
        other_factory = await sync_to_async(Factory.objects.create)(
            name="다른공장", owner=self.user
        )
        other_product = await sync_to_async(Product.objects.create)(
            factory=other_factory,
            name="다른제품",
            code="OTHERPROD",
            unit="EA",
            spec="스펙",
        )

        payload = {
            "product_id": other_product.id,
            "materials": [
                {"name": "신규원자재", "code": "NEWCODE", "spec": "규격", "quantity": 5}
            ],
        }

        response = await self.client.post(
            f"/assign?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"), "해당 제품이 존재하지 않습니다."
        )

    async def test_assign_material_duplicate_code(self):
        """원자재 코드 중복 등으로 실패 테스트"""
        headers = await self.authenticate()

        from stock.models import Product

        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD300",
            unit="EA",
            spec="테스트 스펙",
        )

        payload = {
            "product_id": product.id,
            "materials": [
                {
                    "name": "철판",
                    "code": self.material.code,
                    "spec": "3mm 두께",
                    "quantity": 10,
                },  # 이미 존재하는 원자재
                {
                    "name": "철판",
                    "code": self.material.code,
                    "spec": "3mm 두께",
                    "quantity": 20,
                },  # 중복 입력
            ],
        }

        response = await self.client.post(
            f"/assign?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertEqual(
            data.get("message") or data.get("detail"),
            "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.",
        )

    async def test_assign_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        from stock.models import Product

        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD400",
            unit="EA",
            spec="테스트 스펙",
        )

        payload = {
            "product_id": product.id,
            "materials": [
                {"name": "신규원자재", "code": "NEWCODE", "spec": "규격", "quantity": 5}
            ],
        }

        response = await self.client.post(
            f"/assign?factory_id={self.factory.id}", json=payload
        )
        self.assertEqual(response.status_code, 401)

    async def test_multiple_materials_in_factory(self):
        """한 공장에 여러 원자재가 있는 경우 테스트"""
        # 추가 원자재 생성
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="추가 원자재1",
            code="ADD001",
            spec="추가 규격1",
            unit="KG",
            current_stock=50,
            standard_stock=25,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="추가 원자재2",
            code="ADD002",
            spec="추가 규격2",
            unit="EA",
            current_stock=75,
            standard_stock=40,
        )

        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data["data"]), 3)  # 기존 1개 + 새로 생성한 2개

        # 모든 원자재가 포함되어 있는지 확인
        material_names = [m["name"] for m in data["data"]]
        self.assertIn("테스트 원자재", material_names)
        self.assertIn("추가 원자재1", material_names)
        self.assertIn("추가 원자재2", material_names)

    async def test_material_update_with_same_code(self):
        """같은 자재코드로 수정하는 경우 테스트 (성공해야 함)"""
        headers = await self.authenticate()

        payload = {"name": "수정된 원자재", "code": "TEST001"}  # 기존과 같은 코드

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["name"], "수정된 원자재")
        self.assertEqual(data["code"], "TEST001")

    async def test_material_update_with_null_values(self):
        """None 값으로 수정하는 경우 테스트"""
        headers = await self.authenticate()

        payload = {"name": None, "current_stock": None}

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertIn("공란 또는 null 불가", data.get("detail", ""))

    async def test_material_update_with_empty_string(self):
        """빈 문자열로 수정하는 경우 테스트"""
        headers = await self.authenticate()

        payload = {"name": "", "spec": ""}

        response = await self.client.patch(
            f"/{self.material.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)

        data = response.json()
        self.assertIn("공란 또는 null 불가", data.get("detail", ""))

    async def test_get_materials_by_factory_search_name(self):
        """자재명(q)으로 검색 테스트"""
        # 여러 자재 생성
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="알루미늄 판재",
            code="ALU001",
            spec="1T",
            unit="EA",
            current_stock=10,
            standard_stock=5,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="스테인리스 강판",
            code="STL001",
            spec="2T",
            unit="EA",
            current_stock=20,
            standard_stock=10,
        )

        headers = await self.authenticate()
        # 자재명 일부로 검색
        response = await self.client.get(
            f"?factory_id={self.factory.id}&q=알루미늄", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["name"], "알루미늄 판재")

    async def test_get_materials_by_factory_search_code(self):
        """자재코드(q)로 검색 테스트"""
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="동판",
            code="COPPER123",
            spec="0.5T",
            unit="EA",
            current_stock=5,
            standard_stock=2,
        )

        headers = await self.authenticate()
        # 자재코드 일부로 검색
        response = await self.client.get(
            f"?factory_id={self.factory.id}&q=COPPER", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["code"], "COPPER123")

    async def test_get_materials_by_factory_search_no_result(self):
        """검색 결과가 없는 경우 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&q=없는자재", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data["data"]), 0)

    async def test_get_materials_by_factory_order_asc(self):
        """재고 오름차순 정렬 테스트(order=asc)"""
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재A",
            code="A001",
            spec="A",
            unit="EA",
            current_stock=10,
            standard_stock=5,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재B",
            code="B001",
            spec="B",
            unit="EA",
            current_stock=200,
            standard_stock=100,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재C",
            code="C001",
            spec="C",
            unit="EA",
            current_stock=50,
            standard_stock=25,
        )

        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&order=asc", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        # current_stock 이 문자열일 수 있으므로 숫자로 변환해서 정렬 검증
        stocks = [Decimal(str(m["current_stock"])) for m in data["data"]]
        self.assertEqual(stocks, sorted(stocks))

    async def test_get_materials_by_factory_order_desc(self):
        """재고 내림차순 정렬 테스트(order=desc, 기본값)"""
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재A",
            code="A001",
            spec="A",
            unit="EA",
            current_stock=10,
            standard_stock=5,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재B",
            code="B001",
            spec="B",
            unit="EA",
            current_stock=200,
            standard_stock=100,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재C",
            code="C001",
            spec="C",
            unit="EA",
            current_stock=50,
            standard_stock=25,
        )

        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}&order=desc", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        stocks = [Decimal(str(m["current_stock"])) for m in data["data"]]
        self.assertEqual(stocks, sorted(stocks, reverse=True))

    async def test_get_materials_by_factory_order_default(self):
        """기본 정렬 테스트(order 파라미터 없음)"""
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재A",
            code="A001",
            spec="A",
            unit="EA",
            current_stock=10,
            standard_stock=5,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재B",
            code="B001",
            spec="B",
            unit="EA",
            current_stock=200,
            standard_stock=100,
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재C",
            code="C001",
            spec="C",
            unit="EA",
            current_stock=50,
            standard_stock=25,
        )

        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        stocks = [Decimal(str(m["current_stock"])) for m in data["data"]]
        self.assertEqual(stocks, sorted(stocks, reverse=True))  # 기본값은 desc

    async def test_get_materials_by_factory_pagination(self):
        """페이지네이션 테스트"""
        # 기존 원자재들을 모두 삭제하고 새로 시작
        await sync_to_async(Material.objects.filter(factory=self.factory).delete)()

        # 테스트용 원자재 정확히 12개 생성 (PARTNER 기본 page_size=10보다 많게)
        for i in range(12):
            await sync_to_async(Material.objects.create)(
                factory=self.factory,
                name=f"페이지네이션 테스트 원자재 {i+1}",
                code=f"PAGETEST{i+1:03d}",
                spec=f"페이지테스트규격{i+1}",
                unit="EA",
                current_stock=100 + i,
                standard_stock=50,
            )

        headers = await self.authenticate()

        # 첫 번째 페이지 테스트 (PARTNER 기본 page_size=10)
        response = await self.client.get(
            f"?factory_id={self.factory.id}&page=1", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("pageCnt", data)
        self.assertIn("curPage", data)
        self.assertEqual(len(data["data"]), 10)  # PARTNER 기본 page_size=10

        self.assertEqual(data["count"], 10)
        self.assertEqual(data["totalCnt"], 12)  # 새로 생성한 12개
        self.assertEqual(data["pageCnt"], 2)  # 12개를 10개씩 = 2페이지
        self.assertEqual(data["curPage"], 1)

        # 두 번째 페이지 테스트
        response = await self.client.get(
            f"?factory_id={self.factory.id}&page=2", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data["data"]), 2)  # 마지막 페이지는 2개
        self.assertEqual(data["count"], 2)
        self.assertEqual(data["totalCnt"], 12)
        self.assertEqual(data["pageCnt"], 2)
        self.assertEqual(data["curPage"], 2)

    async def test_get_materials_by_factory_exclude_substitutes_with_material_id(self):
        """material_id로 검색 시 대체자재 제외 테스트"""
        # 기존 원자재 삭제
        await sync_to_async(Material.objects.filter(factory=self.factory).delete)()
        
        # 테스트용 원자재 생성
        material1 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="M8 볼트 A사",
            code="BOLT-M8-001",
            unit="개",
            spec="M8x20mm",
            current_stock=100,
            standard_stock=50,
        )
        
        material2 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="M8 볼트 B사",
            code="BOLT-M8-002",
            unit="개",
            spec="M8x20mm",
            current_stock=50,
            standard_stock=30,
        )
        
        material3 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="M8 볼트 C사",
            code="BOLT-M8-003",
            unit="개",
            spec="M8x20mm",
            current_stock=0,
            standard_stock=20,
        )
        
        material4 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="SUS304 판재 1.5t",
            code="PLATE-SUS304-1.5",
            unit="kg",
            spec="1.5t",
            current_stock=200,
            standard_stock=100,
        )
        
        # 대체자재 관계 생성: material1의 대체자재는 material2, material3
        substitute_relation = await sync_to_async(Substitute.objects.create)(
            factory=self.factory,
            source_material=material1,
        )
        await sync_to_async(substitute_relation.target_materials.add)(material2, material3)
        
        headers = await self.authenticate()
        
        # material_id 없이 조회 - 모든 원자재가 포함되어야 함
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        material_ids = [m["id"] for m in data["data"]]
        self.assertEqual(len(data["data"]), 4)
        self.assertIn(material1.id, material_ids)
        self.assertIn(material2.id, material_ids)
        self.assertIn(material3.id, material_ids)
        self.assertIn(material4.id, material_ids)
        
        # material_id=material1.id로 조회 - material1, material2, material3 제외, material4만 포함
        response = await self.client.get(
            f"?factory_id={self.factory.id}&material_id={material1.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        material_ids = [m["id"] for m in data["data"]]
        self.assertEqual(len(data["data"]), 1)
        self.assertNotIn(material1.id, material_ids)  # 자기 자신 제외
        self.assertNotIn(material2.id, material_ids)  # 대체자재 제외
        self.assertNotIn(material3.id, material_ids)  # 대체자재 제외
        self.assertIn(material4.id, material_ids)  # 다른 자재는 포함
        
        # material_id=material4.id로 조회 - material4만 제외, 나머지 모두 포함
        response = await self.client.get(
            f"?factory_id={self.factory.id}&material_id={material4.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        material_ids = [m["id"] for m in data["data"]]
        self.assertEqual(len(data["data"]), 3)
        self.assertIn(material1.id, material_ids)
        self.assertIn(material2.id, material_ids)
        self.assertIn(material3.id, material_ids)
        self.assertNotIn(material4.id, material_ids)  # 자기 자신 제외

    async def test_get_materials_by_factory_exclude_substitutes_with_search_query(self):
        """material_id와 검색어(q) 함께 사용 시 대체자재 제외 테스트"""
        # 기존 원자재 삭제
        await sync_to_async(Material.objects.filter(factory=self.factory).delete)()
        
        # 테스트용 원자재 생성
        material1 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="M8 볼트 A사",
            code="BOLT-M8-001",
            unit="개",
            spec="M8x20mm",
            current_stock=100,
            standard_stock=50,
        )
        
        material2 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="M8 볼트 B사",
            code="BOLT-M8-002",
            unit="개",
            spec="M8x20mm",
            current_stock=50,
            standard_stock=30,
        )
        
        material3 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="M8 볼트 C사",
            code="BOLT-M8-003",
            unit="개",
            spec="M8x20mm",
            current_stock=0,
            standard_stock=20,
        )
        
        material4 = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="SUS304 판재 1.5t",
            code="PLATE-SUS304-1.5",
            unit="kg",
            spec="1.5t",
            current_stock=200,
            standard_stock=100,
        )
        
        # 대체자재 관계 생성: material1의 대체자재는 material2, material3
        substitute_relation = await sync_to_async(Substitute.objects.create)(
            factory=self.factory,
            source_material=material1,
        )
        await sync_to_async(substitute_relation.target_materials.add)(material2, material3)
        
        headers = await self.authenticate()
        
        # material_id=material1.id와 검색어 "판재" 함께 사용
        # material1, material2, material3는 제외되고, material4만 검색어에 매칭되어 포함되어야 함
        response = await self.client.get(
            f"?factory_id={self.factory.id}&material_id={material1.id}&q=판재", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        material_ids = [m["id"] for m in data["data"]]
        self.assertEqual(len(data["data"]), 1)
        self.assertNotIn(material1.id, material_ids)
        self.assertNotIn(material2.id, material_ids)
        self.assertNotIn(material3.id, material_ids)
        self.assertIn(material4.id, material_ids)
        
        # material_id=material1.id와 검색어 "볼트" 함께 사용
        # material1, material2, material3 모두 제외되어야 하므로 결과 없음
        response = await self.client.get(
            f"?factory_id={self.factory.id}&material_id={material1.id}&q=볼트", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 0)

    async def test_get_material_detail_expiry_status(self):
        """expiry_status 계산 테스트"""
        headers = await self.authenticate()
        self.material.expiry_days = 7
        await sync_to_async(self.material.save)()

        # 유통기한 없음 -> None
        response = await self.client.get(
            f"/{self.material.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertIsNone(response.json().get("expiry_status"))

        # 유통기한 10일 후 -> 양호
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            expiration_date=date.today() + timedelta(days=10),
            remaining_quantity=50,
            total_stock=150,
        )
        response = await self.client.get(
            f"/{self.material.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.json().get("expiry_status"), "양호")

        # 유통기한 3일 후 -> 위험
        await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=30,
            price=1000,
            expiration_date=date.today() + timedelta(days=3),
            remaining_quantity=30,
            total_stock=180,
        )
        response = await self.client.get(
            f"/{self.material.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.json().get("expiry_status"), "위험")

    async def test_get_expiry_risk_materials(self):
        """유통기한 위험 원자재 목록 조회 테스트"""
        headers = await self.authenticate()

        # 위험 상태 원자재: expiry_days=7, 유통기한 3일 후
        risk_material = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="위험 원자재",
            code="RISK001",
            spec="Spec1",
            unit="개",
            current_stock=100,
            expiry_days=7,
        )
        await sync_to_async(MaterialHistory.objects.create)(
            material=risk_material,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1000,
            expiration_date=date.today() + timedelta(days=3),
            remaining_quantity=50,
            total_stock=150,
        )

        # 양호 상태 원자재: expiry_days=7, 유통기한 10일 후
        safe_material = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="양호 원자재",
            code="SAFE001",
            spec="Spec2",
            unit="개",
            current_stock=200,
            expiry_days=7,
        )
        await sync_to_async(MaterialHistory.objects.create)(
            material=safe_material,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=100,
            price=2000,
            expiration_date=date.today() + timedelta(days=10),
            remaining_quantity=100,
            total_stock=300,
        )

        # 유통기한 위험 원자재 목록 조회
        response = await self.client.get(
            f"/expiry-risk?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 위험 상태인 원자재만 반환되어야 함
        materials = data["data"]
        self.assertEqual(len(materials), 1)
        self.assertEqual(materials[0]["id"], risk_material.id)
        self.assertEqual(materials[0]["expiry_status"], "위험")
        self.assertIn("rop", materials[0])
