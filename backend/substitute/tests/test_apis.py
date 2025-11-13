from django.test import TestCase
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async
from user.api import router as user_router
from substitute.api import router
from user.models import User
from factory.models import Factory, FactoryMember
from stock.models import Material
from substitute.models import Substitute


class TestSubstituteAPI(TestCase):
    def setUp(self):
        """테스트 설정"""
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)

        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username="testuser",
            password="password1234!",
            email="testuser@example.com",
        )

        # 테스트용 공장 생성
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Test Factory",
            business_registration_number="123-45-67890",
        )

        # FactoryMember 생성
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            invited_by=self.user,
            status="active",
        )

        # 테스트용 자재 생성
        self.material1 = Material.objects.create(
            factory=self.factory,
            name="M8 볼트 A사",
            code="BOLT-M8-001",
            unit="개",
            spec="M8x20mm",
            current_stock=100,
            standard_stock=50,
        )

        self.material2 = Material.objects.create(
            factory=self.factory,
            name="M8 볼트 B사",
            code="BOLT-M8-002",
            unit="개",
            spec="M8x20mm",
            current_stock=50,
            standard_stock=30,
        )

        self.material3 = Material.objects.create(
            factory=self.factory,
            name="M8 볼트 C사",
            code="BOLT-M8-003",
            unit="개",
            spec="M8x20mm",
            current_stock=0,
            standard_stock=20,
        )

        self.material4 = Material.objects.create(
            factory=self.factory,
            name="SUS304 판재 1.5t",
            code="PLATE-SUS304-1.5",
            unit="kg",
            spec="1.5t",
            current_stock=200,
            standard_stock=100,
        )

        # 테스트용 대체 자재 관계 생성 (단방향: material1의 대체 자재는 material2, material3)
        self.substitute_relation = Substitute.objects.create(
            factory=self.factory,
            source_material=self.material1,
        )
        self.substitute_relation.target_materials.add(self.material2, self.material3)

    async def authenticate(self):
        """인증 토큰 생성"""
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def test_create_substitute_relation(self):
        """대체 자재 관계 생성 테스트 (단방향)"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material4.id,
            "target_materials": [self.material1.id, self.material2.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["source_material"]["id"], self.material4.id)
        self.assertEqual(len(data["target_materials"]), 2)
        target_ids = [m["id"] for m in data["target_materials"]]
        self.assertIn(self.material1.id, target_ids)
        self.assertIn(self.material2.id, target_ids)

    async def test_create_substitute_relation_multiple_targets(self):
        """여러 대체 자재로 관계 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material4.id,
            "target_materials": [self.material1.id, self.material2.id, self.material3.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(len(data["target_materials"]), 3)
        target_ids = [m["id"] for m in data["target_materials"]]
        self.assertIn(self.material1.id, target_ids)
        self.assertIn(self.material2.id, target_ids)
        self.assertIn(self.material3.id, target_ids)

    async def test_create_substitute_relation_empty_targets(self):
        """대체 자재 없이 관계 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material4.id,
            "target_materials": [],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("최소 1개 이상의 대체 자재를 선택해야 합니다", data["detail"])

    async def test_create_substitute_relation_source_in_targets(self):
        """원본 자재가 대체 자재 목록에 포함된 경우 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material4.id,  # material1은 이미 관계가 있으므로 material4 사용
            "target_materials": [self.material4.id, self.material2.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("원본 자재는 대체 자재 목록에 포함될 수 없습니다", data["detail"])

    async def test_create_substitute_relation_duplicate_source(self):
        """같은 source_material에 대한 중복 관계 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material1.id,  # 이미 관계가 존재함
            "target_materials": [self.material4.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("이미 존재합니다", data["detail"])

    async def test_create_substitute_relation_invalid_source_material(self):
        """존재하지 않는 source_material로 관계 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": 99999,
            "target_materials": [self.material2.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("원본 자재가 존재하지 않거나", data["detail"])

    async def test_create_substitute_relation_invalid_target_material(self):
        """존재하지 않는 target_material로 관계 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material4.id,
            "target_materials": [99999],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("일부 대체 자재가 존재하지 않거나", data["detail"])

    async def test_create_substitute_relation_different_factory_material(self):
        """다른 공장의 자재로 관계 생성 시도 테스트"""
        headers = await self.authenticate()

        # 다른 공장과 자재 생성
        @sync_to_async
        def create_other_factory():
            other_factory = Factory.objects.create(
                owner=self.user,
                name="Other Factory",
                business_registration_number="999-99-99999",
            )
            other_material = Material.objects.create(
                factory=other_factory,
                name="다른 공장 자재",
                code="OTHER-001",
                unit="개",
                spec="test",
            )
            return other_factory, other_material

        other_factory, other_material = await create_other_factory()

        payload = {
            "source_material_id": self.material4.id,
            "target_materials": [other_material.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("일부 대체 자재가 존재하지 않거나", data["detail"])

    async def test_get_substitutes_by_material(self):
        """자재의 대체 가능한 자재 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.material1.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        self.assertEqual(len(data["data"]), 2)  # target_materials가 2개
        
        target_ids = [m["id"] for m in data["data"]]
        self.assertIn(self.material2.id, target_ids)
        self.assertIn(self.material3.id, target_ids)

    async def test_get_substitutes_by_material_not_found(self):
        """존재하지 않는 자재로 조회 시도 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("자재를 찾을 수 없습니다", data["detail"])

    async def test_get_substitutes_by_material_no_relation(self):
        """대체 자재 관계가 없는 자재 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.material4.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        self.assertEqual(len(data["data"]), 0)

    async def test_get_substitutes_by_material_different_factory(self):
        """다른 공장의 자재로 조회 시도 테스트"""
        headers = await self.authenticate()

        # 다른 공장과 자재 생성
        @sync_to_async
        def create_other_factory():
            other_factory = Factory.objects.create(
                owner=self.user,
                name="Other Factory",
                business_registration_number="999-99-99999",
            )
            FactoryMember.objects.create(
                factory=other_factory,
                user=self.user,
                role="admin",
                invited_by=self.user,
                status="active",
            )
            other_material = Material.objects.create(
                factory=other_factory,
                name="다른 공장 자재",
                code="OTHER-001",
                unit="개",
                spec="test",
            )
            return other_material

        other_material = await create_other_factory()

        response = await self.client.get(
            f"/{other_material.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("자재를 찾을 수 없습니다", data["detail"])

    async def test_delete_substitute_relation(self):
        """대체 자재 관계 삭제 테스트"""
        headers = await self.authenticate()

        # 새 관계 생성
        @sync_to_async
        def create_substitute():
            new_substitute = Substitute.objects.create(
                factory=self.factory,
                source_material=self.material4,
            )
            new_substitute.target_materials.add(self.material1)
            return new_substitute

        new_substitute = await create_substitute()

        response = await self.client.delete(
            f"/relation/{new_substitute.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("대체 자재 관계가 삭제되었습니다", data["message"])
        self.assertEqual(data["deleted_substitute_id"], new_substitute.id)

        # 실제로 삭제되었는지 확인
        @sync_to_async
        def check_deleted():
            return Substitute.objects.filter(id=new_substitute.id).exists()

        self.assertFalse(await check_deleted())

    async def test_delete_substitute_relation_not_found(self):
        """존재하지 않는 관계 삭제 시도 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/relation/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_substitute_relation_different_factory(self):
        """다른 공장의 관계 삭제 시도 테스트"""
        headers = await self.authenticate()

        # 다른 공장 생성
        @sync_to_async
        def create_other_factory():
            other_factory = Factory.objects.create(
                owner=self.user,
                name="Other Factory",
                business_registration_number="999-99-99999",
            )
            FactoryMember.objects.create(
                factory=other_factory,
                user=self.user,
                role="admin",
                invited_by=self.user,
                status="active",
            )
            return other_factory

        other_factory = await create_other_factory()

        response = await self.client.delete(
            f"/relation/{self.substitute_relation.id}?factory_id={other_factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 404)

        # 원래 관계는 그대로 존재
        @sync_to_async
        def check_exists():
            return Substitute.objects.filter(id=self.substitute_relation.id).exists()

        self.assertTrue(await check_exists())

    async def test_create_without_factory_id(self):
        """factory_id 없이 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "source_material_id": self.material1.id,
            "target_materials": [self.material2.id],
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("factory_id를 입력해야 합니다", data["detail"])

    async def test_get_without_factory_id(self):
        """factory_id 없이 조회 시도 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.material1.id}", headers=headers)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("factory_id를 입력해야 합니다", data["detail"])

    async def test_material_data_structure(self):
        """자재 데이터 구조 검증 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.material1.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        self.assertGreater(len(data["data"]), 0)

        # target_materials 구조 확인 (이제 직접 MaterialSimpleOut 리스트)
        for material in data["data"]:
            self.assertIn("id", material)
            self.assertIn("name", material)
            self.assertIn("code", material)
            self.assertIn("unit", material)
            self.assertIn("spec", material)
            self.assertIn("current_stock", material)
            self.assertIn("standard_stock", material)

            # 데이터 타입 확인
            self.assertIsInstance(material["id"], int)
            self.assertIsInstance(material["name"], str)
            self.assertIsInstance(material["code"], str)
            self.assertIsInstance(material["unit"], str)
            self.assertIsInstance(material["spec"], (str, type(None)))

    async def test_unidirectional_relationship(self):
        """단방향 관계 테스트 - material1의 대체 자재가 material2이지만, material2의 대체 자재는 material1이 아님"""
        headers = await self.authenticate()

        # material2의 대체 자재 조회 (없어야 함)
        response = await self.client.get(
            f"/{self.material2.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 0)  # material2는 source_material이 아니므로 결과 없음

        # material1의 대체 자재 조회 (있어야 함)
        response = await self.client.get(
            f"/{self.material1.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 2)  # material1의 target_materials가 2개

    async def test_multiple_source_materials(self):
        """여러 source_material에 대한 관계 생성 테스트"""
        headers = await self.authenticate()

        # material4를 source로 하는 관계 생성
        payload = {
            "source_material_id": self.material4.id,
            "target_materials": [self.material1.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)

        # material1과 material4 모두 source_material로 사용 가능
        response1 = await self.client.get(
            f"/{self.material1.id}?factory_id={self.factory.id}", headers=headers
        )
        response4 = await self.client.get(
            f"/{self.material4.id}?factory_id={self.factory.id}", headers=headers
        )

        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response4.status_code, 200)
        data1 = response1.json()
        data4 = response4.json()
        self.assertIn("data", data1)
        self.assertIn("data", data4)
        self.assertEqual(len(data1["data"]), 2)  # material1의 target_materials가 2개
        self.assertEqual(len(data4["data"]), 1)  # material4의 target_materials가 1개
