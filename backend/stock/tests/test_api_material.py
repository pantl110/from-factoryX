from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async

from user.api import router as user_router
from stock.api_material import router as material_router

from user.models import User
from factory.models import Factory, FactoryClient, FactoryMember
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
        
        # factory_id를 GET 파라미터로 전달
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
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
        self.assertEqual(material_data["current_stock"], 100)
        self.assertEqual(material_data["standard_stock"], 50)
        
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
        self.assertEqual(data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다.")

    async def test_get_materials_by_factory_not_found(self):
        """존재하지 않는 공장 조회 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get("?factory_id=99999", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "해당 공장에 멤버가 아닙니다.")

    async def test_get_materials_by_factory_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"?factory_id={self.factory.id}")
        self.assertEqual(response.status_code, 401)

    async def test_get_material_detail_success(self):
        """원자재 상세 조회 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["id"], self.material.id)
        self.assertEqual(data["name"], "테스트 원자재")
        self.assertEqual(data["code"], "TEST001")
        self.assertEqual(data["spec"], "테스트 규격")
        self.assertEqual(data["unit"], "EA")
        self.assertEqual(data["current_stock"], 100)
        self.assertEqual(data["standard_stock"], 50)

    async def test_get_material_detail_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다.")

    async def test_get_material_detail_not_found(self):
        """존재하지 않는 원자재 조회 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.get(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_get_material_detail_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"/{self.material.id}?factory_id={self.factory.id}")
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
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers, json=payload)
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
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers, json=payload)
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
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "이미 존재하는 자재코드입니다.")

    async def test_update_material_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": "수정된 원자재"
        }
        
        response = await self.client.patch(f"/{self.material.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다.")

    async def test_update_material_not_found(self):
        """존재하지 않는 원자재 수정 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": "수정된 원자재"
        }
        
        response = await self.client.patch(f"/99999?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_update_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        payload = {
            "name": "수정된 원자재"
        }
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", json=payload)
        self.assertEqual(response.status_code, 401)

    async def test_delete_material_success(self):
        """원자재 삭제 성공 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.delete(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재가 성공적으로 삭제되었습니다.")
        
        # 데이터베이스에서 실제로 삭제되었는지 확인
        material_exists = await sync_to_async(Material.objects.filter(id=self.material.id).exists)()
        self.assertFalse(material_exists)

    async def test_delete_material_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.delete(f"/{self.material.id}", headers=headers)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다.")

    async def test_delete_material_not_found(self):
        """존재하지 않는 원자재 삭제 테스트"""
        headers = await self.authenticate()
        
        response = await self.client.delete(f"/99999?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 정보를 찾을 수 없습니다.")

    async def test_delete_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.delete(f"/{self.material.id}?factory_id={self.factory.id}")
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
            spec="테스트 스펙"
        )
        
        payload = {
            "product_id": product.id,
            "materials": [
                {"name": "신규원자재1", "code": "NEWMAT001", "spec": "규격A", "quantity": 10},
                {"name": "신규원자재2", "code": "NEWMAT002", "spec": "규격B", "quantity": 20},
                {"name": self.material.name, "code": self.material.code, "spec": self.material.spec, "quantity": 30},  # 기존 원자재
            ]
        }
        
        response = await self.client.post(f"/assign?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("material_ids", data)
        self.assertIn("message", data)
        self.assertEqual(data["message"], "원자재가 성공적으로 생성 및 연결되었습니다.")
        self.assertEqual(len(data["material_ids"]), 3)  # 3개의 원자재 ID 반환

        # DB에 신규 원자재가 생성되었는지, 연결이 되었는지 확인
        from stock.models import Material, MaterialProduct
        mat1 = await sync_to_async(Material.objects.get)(code="NEWMAT001", factory=self.factory)
        mat2 = await sync_to_async(Material.objects.get)(code="NEWMAT002", factory=self.factory)
        
        # 반환된 ID들이 실제 생성된 원자재 ID와 일치하는지 확인
        self.assertIn(mat1.id, data["material_ids"])
        self.assertIn(mat2.id, data["material_ids"])
        self.assertIn(self.material.id, data["material_ids"])
        
        # 연결 확인
        self.assertTrue(await sync_to_async(MaterialProduct.objects.filter(product=product, material=mat1, quantity=10).exists)())
        self.assertTrue(await sync_to_async(MaterialProduct.objects.filter(product=product, material=mat2, quantity=20).exists)())
        self.assertTrue(await sync_to_async(MaterialProduct.objects.filter(product=product, material=self.material, quantity=30).exists)())

    async def test_assign_material_missing_factory_id(self):
        """factory_id가 없는 경우 테스트"""
        headers = await self.authenticate()
        
        from stock.models import Product
        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD200",
            unit="EA",
            spec="테스트 스펙"
        )
        
        payload = {
            "product_id": product.id,
            "materials": [
                {"name": "신규원자재", "code": "NEWCODE", "spec": "규격", "quantity": 5}
            ]
        }
        
        response = await self.client.post("/assign", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "factory_id를 입력해야 합니다.")

    async def test_assign_material_wrong_factory(self):
        """품목이 공장에 속하지 않을 때 실패 테스트"""
        headers = await self.authenticate()
        
        from stock.models import Product
        # 다른 공장, 다른 품목 생성
        other_factory = await sync_to_async(Factory.objects.create)(name='다른공장', owner=self.user)
        other_product = await sync_to_async(Product.objects.create)(
            factory=other_factory, name='다른제품', code='OTHERPROD', unit='EA', spec='스펙'
        )
        
        payload = {
            "product_id": other_product.id,
            "materials": [
                {"name": "신규원자재", "code": "NEWCODE", "spec": "규격", "quantity": 5}
            ]
        }
        
        response = await self.client.post(f"/assign?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 404)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "해당 제품이 존재하지 않습니다.")

    async def test_assign_material_duplicate_code(self):
        """원자재 코드 중복 등으로 실패 테스트"""
        headers = await self.authenticate()
        
        from stock.models import Product
        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD300",
            unit="EA",
            spec="테스트 스펙"
        )
        
        payload = {
            "product_id": product.id,
            "materials": [
                {"name": "철판", "code": self.material.code, "spec": "3mm 두께", "quantity": 10},  # 이미 존재하는 원자재
                {"name": "철판", "code": self.material.code, "spec": "3mm 두께", "quantity": 20},  # 중복 입력
            ]
        }
        
        response = await self.client.post(f"/assign?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertEqual(data.get("message") or data.get("detail"), "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")

    async def test_assign_material_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        from stock.models import Product
        product = await sync_to_async(Product.objects.create)(
            factory=self.factory,
            name="테스트 제품",
            code="PROD400",
            unit="EA",
            spec="테스트 스펙"
        )
        
        payload = {
            "product_id": product.id,
            "materials": [
                {"name": "신규원자재", "code": "NEWCODE", "spec": "규격", "quantity": 5}
            ]
        }
        
        response = await self.client.post(f"/assign?factory_id={self.factory.id}", json=payload)
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
            standard_stock=25
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="추가 원자재2",
            code="ADD002",
            spec="추가 규격2",
            unit="EA",
            current_stock=75,
            standard_stock=40
        )
        
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
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
        
        payload = {
            "name": "수정된 원자재",
            "code": "TEST001"  # 기존과 같은 코드
        }
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers, json=payload)
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
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertIn("공란 또는 null 불가", data.get("detail", ""))

    async def test_material_update_with_empty_string(self):
        """빈 문자열로 수정하는 경우 테스트"""
        headers = await self.authenticate()
        
        payload = {
            "name": "",
            "spec": ""
        }
        
        response = await self.client.patch(f"/{self.material.id}?factory_id={self.factory.id}", headers=headers, json=payload)
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
            standard_stock=5
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="스테인리스 강판",
            code="STL001",
            spec="2T",
            unit="EA",
            current_stock=20,
            standard_stock=10
        )
        
        headers = await self.authenticate()
        # 자재명 일부로 검색
        response = await self.client.get(f"?factory_id={self.factory.id}&q=알루미늄", headers=headers)
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
            standard_stock=2
        )
        
        headers = await self.authenticate()
        # 자재코드 일부로 검색
        response = await self.client.get(f"?factory_id={self.factory.id}&q=COPPER", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["code"], "COPPER123")

    async def test_get_materials_by_factory_search_no_result(self):
        """검색 결과가 없는 경우 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}&q=없는자재", headers=headers)
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
            standard_stock=5
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재B",
            code="B001",
            spec="B",
            unit="EA",
            current_stock=200,
            standard_stock=100
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재C",
            code="C001",
            spec="C",
            unit="EA",
            current_stock=50,
            standard_stock=25
        )
        
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}&order=asc", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        stocks = [m["current_stock"] for m in data["data"]]
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
            standard_stock=5
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재B",
            code="B001",
            spec="B",
            unit="EA",
            current_stock=200,
            standard_stock=100
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재C",
            code="C001",
            spec="C",
            unit="EA",
            current_stock=50,
            standard_stock=25
        )
        
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}&order=desc", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        stocks = [m["current_stock"] for m in data["data"]]
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
            standard_stock=5
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재B",
            code="B001",
            spec="B",
            unit="EA",
            current_stock=200,
            standard_stock=100
        )
        await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="자재C",
            code="C001",
            spec="C",
            unit="EA",
            current_stock=50,
            standard_stock=25
        )
        
        headers = await self.authenticate()
        response = await self.client.get(f"?factory_id={self.factory.id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        stocks = [m["current_stock"] for m in data["data"]]
        self.assertEqual(stocks, sorted(stocks, reverse=True))  # 기본값은 desc

    async def test_get_materials_by_factory_pagination(self):
        """페이지네이션 테스트"""
        # 여러 원자재 생성 (페이지네이션 테스트용)
        for i in range(25):  # 25개 생성 (기본 limit 20보다 많게)
            await sync_to_async(Material.objects.create)(
                factory=self.factory,
                name=f"페이지네이션 테스트 원자재 {i+1}",
                code=f"PAGETEST{i+1:03d}",
                spec=f"페이지테스트규격{i+1}",
                unit="EA",
                current_stock=100 + i,
                standard_stock=50
            )
        
        headers = await self.authenticate()
        
        # 첫 번째 페이지 테스트
        response = await self.client.get(f"?factory_id={self.factory.id}&page=1&limit=10", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("pageCnt", data)
        self.assertIn("curPage", data)
        self.assertEqual(len(data["data"]), 10)  # limit=10
        
        self.assertEqual(data["count"], 10)
        self.assertEqual(data["totalCnt"], 26)  # 기존 1개 + 새로 생성한 25개
        self.assertEqual(data["pageCnt"], 3)  # 26개를 10개씩 = 3페이지
        self.assertEqual(data["curPage"], 1)
        
        # 두 번째 페이지 테스트
        response = await self.client.get(f"?factory_id={self.factory.id}&page=2&limit=10", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 10)
        self.assertEqual(data["count"], 10)
        self.assertEqual(data["totalCnt"], 26)
        self.assertEqual(data["pageCnt"], 3)
        self.assertEqual(data["curPage"], 2)
        
        # 마지막 페이지 테스트
        response = await self.client.get(f"?factory_id={self.factory.id}&page=3&limit=10", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data["data"]), 6)  # 마지막 페이지는 6개
        self.assertEqual(data["count"], 6)
        self.assertEqual(data["totalCnt"], 26)
        self.assertEqual(data["pageCnt"], 3)
        self.assertEqual(data["curPage"], 3)
