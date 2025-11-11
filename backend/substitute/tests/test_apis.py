from django.test import TestCase
from ninja.testing import TestAsyncClient
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
        )

        self.material2 = Material.objects.create(
            factory=self.factory,
            name="M8 볼트 B사",
            code="BOLT-M8-002",
            unit="개",
            spec="M8x20mm",
            current_stock=50,
        )

        self.material3 = Material.objects.create(
            factory=self.factory,
            name="M8 볼트 C사",
            code="BOLT-M8-003",
            unit="개",
            spec="M8x20mm",
            current_stock=0,
        )

        self.material4 = Material.objects.create(
            factory=self.factory,
            name="SUS304 판재 1.5t",
            code="PLATE-SUS304-1.5",
            unit="kg",
            spec="1.5t",
            current_stock=200,
        )

        # 테스트용 대체 자재 그룹 생성
        self.substitute_group = Substitute.objects.create(
            factory=self.factory,
            name="M8 볼트 그룹",
            description="M8 볼트 대체 가능 자재",
        )
        self.substitute_group.materials.add(
            self.material1, self.material2, self.material3
        )

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

    async def test_create_substitute_group(self):
        """대체 자재 그룹 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "SUS304 판재 그룹",
            "description": "SUS304 1.5t 대체 가능 자재",
            "materials": [self.material4.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "SUS304 판재 그룹")
        self.assertEqual(data["description"], "SUS304 1.5t 대체 가능 자재")
        self.assertEqual(len(data["materials"]), 1)
        self.assertEqual(data["materials"][0]["id"], self.material4.id)

    async def test_create_substitute_group_multiple_materials(self):
        """여러 자재로 대체 그룹 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "테스트 그룹",
            "description": "여러 자재 포함",
            "materials": [self.material1.id, self.material2.id, self.material4.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(len(data["materials"]), 3)
        materials = [m["id"] for m in data["materials"]]
        self.assertIn(self.material1.id, materials)
        self.assertIn(self.material2.id, materials)
        self.assertIn(self.material4.id, materials)

    async def test_create_substitute_group_without_name(self):
        """이름 없이 대체 그룹 생성 테스트 (name은 optional)"""
        headers = await self.authenticate()
        payload = {
            "materials": [self.material1.id, self.material2.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIsNone(data["name"])
        self.assertEqual(len(data["materials"]), 2)

    async def test_create_substitute_group_empty_materials(self):
        """자재 없이 대체 그룹 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "빈 그룹",
            "materials": [],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("최소 1개 이상의 자재를 선택해야 합니다", data["detail"])

    async def test_create_substitute_group_invalid_material_id(self):
        """존재하지 않는 자재 ID로 그룹 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "잘못된 그룹",
            "materials": [99999],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("일부 자재가 존재하지 않거나", data["detail"])

    async def test_create_substitute_group_different_factory_material(self):
        """다른 공장의 자재로 그룹 생성 시도 테스트"""
        headers = await self.authenticate()

        # 다른 공장과 자재 생성
        other_factory = await Factory.objects.acreate(
            owner=self.user,
            name="Other Factory",
            business_registration_number="999-99-99999",
        )
        other_material = await Material.objects.acreate(
            factory=other_factory,
            name="다른 공장 자재",
            code="OTHER-001",
            unit="개",
            spec="test",
        )

        payload = {
            "name": "잘못된 그룹",
            "materials": [other_material.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("일부 자재가 존재하지 않거나", data["detail"])

    async def test_list_substitute_groups(self):
        """대체 자재 그룹 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        # 기존 그룹 확인
        group = next((g for g in data if g["id"] == self.substitute_group.id), None)
        self.assertIsNotNone(group)
        self.assertEqual(group["name"], "M8 볼트 그룹")
        self.assertEqual(group["material_count"], 3)

    async def test_list_substitute_groups_empty(self):
        """대체 그룹이 없는 공장의 목록 조회 테스트"""
        headers = await self.authenticate()

        # 새 공장 생성
        new_factory = await Factory.objects.acreate(
            owner=self.user,
            name="Empty Factory",
            business_registration_number="111-11-11111",
        )
        await FactoryMember.objects.acreate(
            factory=new_factory,
            user=self.user,
            role="admin",
            invited_by=self.user,
            status="active",
        )

        response = await self.client.get(
            f"?factory_id={new_factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0)

    async def test_get_substitute_group_detail(self):
        """대체 자재 그룹 상세 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.substitute_group.id)
        self.assertEqual(data["name"], "M8 볼트 그룹")
        self.assertEqual(data["description"], "M8 볼트 대체 가능 자재")
        self.assertEqual(len(data["materials"]), 3)

        # 자재 정보 확인
        materials = [m["id"] for m in data["materials"]]
        self.assertIn(self.material1.id, materials)
        self.assertIn(self.material2.id, materials)
        self.assertIn(self.material3.id, materials)

    async def test_get_substitute_group_not_found(self):
        """존재하지 않는 그룹 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("해당 대체 자재 그룹을 찾을 수 없습니다", data["detail"])

    async def test_get_substitute_group_different_factory(self):
        """다른 공장의 그룹 조회 시도 테스트"""
        headers = await self.authenticate()

        # 다른 공장 생성
        other_factory = await Factory.objects.acreate(
            owner=self.user,
            name="Other Factory",
            business_registration_number="999-99-99999",
        )
        await FactoryMember.objects.acreate(
            factory=other_factory,
            user=self.user,
            role="admin",
            invited_by=self.user,
            status="active",
        )

        response = await self.client.get(
            f"/{self.substitute_group.id}?factory_id={other_factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_substitute_group_name(self):
        """대체 그룹 이름 수정 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "M8 볼트 그룹 (수정됨)",
        }
        response = await self.client.patch(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["name"], "M8 볼트 그룹 (수정됨)")
        self.assertEqual(data["description"], "M8 볼트 대체 가능 자재")  # 기존 값 유지

    async def test_update_substitute_group_materials(self):
        """대체 그룹 자재 목록 수정 테스트"""
        headers = await self.authenticate()
        payload = {
            "materials": [self.material1.id, self.material4.id],
        }
        response = await self.client.patch(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["materials"]), 2)
        materials = [m["id"] for m in data["materials"]]
        self.assertIn(self.material1.id, materials)
        self.assertIn(self.material4.id, materials)
        self.assertNotIn(self.material2.id, materials)

    async def test_update_substitute_group_all_fields(self):
        """대체 그룹 모든 필드 수정 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "완전히 새로운 그룹",
            "description": "새로운 설명",
            "materials": [self.material4.id],
        }
        response = await self.client.patch(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "완전히 새로운 그룹")
        self.assertEqual(data["description"], "새로운 설명")
        self.assertEqual(len(data["materials"]), 1)
        self.assertEqual(data["materials"][0]["id"], self.material4.id)

    async def test_update_substitute_group_empty_materials(self):
        """빈 자재 목록으로 수정 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "materials": [],
        }
        response = await self.client.patch(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("최소 1개 이상의 자재를 선택해야 합니다", data["detail"])

    async def test_update_substitute_group_invalid_material(self):
        """존재하지 않는 자재로 수정 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "materials": [99999],
        }
        response = await self.client.patch(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("일부 자재가 존재하지 않거나", data["detail"])

    async def test_update_substitute_group_not_found(self):
        """존재하지 않는 그룹 수정 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "수정",
        }
        response = await self.client.patch(
            f"/99999?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_substitute_group(self):
        """대체 자재 그룹 삭제 테스트"""
        headers = await self.authenticate()

        # 새 그룹 생성
        new_group = await Substitute.objects.acreate(
            factory=self.factory,
            name="삭제될 그룹",
        )
        await new_group.materials.aadd(self.material1)
        response = await self.client.delete(
            f"/{new_group.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("대체 자재 그룹이 삭제되었습니다", data["message"])
        self.assertEqual(data["deleted_substitute_id"], new_group.id)

        # 실제로 삭제되었는지 확인
        self.assertFalse(await Substitute.objects.filter(id=new_group.id).aexists())

    async def test_delete_substitute_group_not_found(self):
        """존재하지 않는 그룹 삭제 시도 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_substitute_group_different_factory(self):
        """다른 공장의 그룹 삭제 시도 테스트"""
        headers = await self.authenticate()

        # 다른 공장 생성
        other_factory = await Factory.objects.acreate(
            owner=self.user,
            name="Other Factory",
            business_registration_number="999-99-99999",
        )
        await FactoryMember.objects.acreate(
            factory=other_factory,
            user=self.user,
            role="admin",
            invited_by=self.user,
            status="active",
        )

        response = await self.client.delete(
            f"/{self.substitute_group.id}?factory_id={other_factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 404)

        # 원래 그룹은 그대로 존재
        self.assertTrue(
            await Substitute.objects.filter(id=self.substitute_group.id).aexists()
        )

    async def test_create_without_factory_id(self):
        """factory_id 없이 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "테스트",
            "materials": [self.material1.id],
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("factory_id를 입력해야 합니다", data["detail"])

    async def test_list_without_factory_id(self):
        """factory_id 없이 목록 조회 시도 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("factory_id를 입력해야 합니다", data["detail"])

    async def test_material_data_structure(self):
        """자재 데이터 구조 검증 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 자재 데이터 구조 확인
        for material in data["materials"]:
            self.assertIn("id", material)
            self.assertIn("name", material)
            self.assertIn("code", material)
            self.assertIn("unit", material)
            self.assertIn("spec", material)
            self.assertIn("current_stock", material)

            # 데이터 타입 확인
            self.assertIsInstance(material["id"], int)
            self.assertIsInstance(material["name"], str)
            self.assertIsInstance(material["code"], str)
            self.assertIsInstance(material["unit"], str)
            self.assertIsInstance(material["spec"], str)

    async def test_multiple_groups_with_same_material(self):
        """같은 자재가 여러 그룹에 속할 수 있는지 테스트"""
        headers = await self.authenticate()

        # 두 번째 그룹 생성 (material1이 이미 다른 그룹에 속함)
        payload = {
            "name": "두 번째 그룹",
            "materials": [self.material1.id, self.material4.id],
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        data = response.json()
        self.assertEqual(response.status_code, 201)

        materials = [m["id"] for m in data["materials"]]
        self.assertIn(self.material1.id, materials)
        self.assertIn(self.material4.id, materials)

        # 기존 그룹에서도 material1이 여전히 존재하는지 확인
        response2 = await self.client.get(
            f"/{self.substitute_group.id}?factory_id={self.factory.id}",
            headers=headers,
        )
        data2 = response2.json()
        materials2 = [m["id"] for m in data2["materials"]]
        self.assertIn(self.material1.id, materials2)
