from django.test import TestCase
from ninja.testing import TestAsyncClient

from user.api import router as user_router
from factory.api_eq import router as factory_eq_router

from user.models import User
from factory.models import Factory, FactoryEquipment, FactoryMember

from user.models import EmailVerification


class TestFactoryEquipment(TestCase):
    """FactoryEquipment CRUD API tests"""

    def setUp(self):
        # Async API clients for the equipment router and authentication router
        self.client = TestAsyncClient(factory_eq_router)
        self.auth_client = TestAsyncClient(user_router)

        # Create a user & factory that owns the equipment
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

        # 테스트용 공장 멤버 등록
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status="active",
            invited_by=self.user,
        )

        # Pre-create an equipment instance used by read / update / delete tests
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory,
            name="Pre-created Equipment",
            priority=1,
        )

    async def authenticate(self):
        """Obtain JWT access token and return Authorization headers."""
        data = {
            "email": self.user.email,
            "password": "password1234!",  # password validation is disabled in user.api.login
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {
            "Authorization": f"Bearer {tokens['access_token']}",
        }

    async def test_create_factory_equipment(self):
        """[C] 설비 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "Created Equipment",
            "priority": 5,
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], payload["name"])

    async def test_list_factory_equipments(self):
        """[R] 설비 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Ninja pagination returns list in data["data"]
        self.assertIn("data", data)
        self.assertTrue(len(data["data"]) >= 1)

        # filtering test
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=headers,
            params={"name": "Equipment"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertTrue(len(data["data"]) >= 1)

    async def test_get_factory_equipment(self):
        """[R] 설비 상세 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/{self.equipment.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.equipment.id)
        self.assertEqual(data["name"], self.equipment.name)

    async def test_update_factory_equipment(self):
        """[U] 설비 수정 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "Updated Equipment Name",
        }
        response = await self.client.patch(
            f"/{self.equipment.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.equipment.id)
        self.assertEqual(data["name"], payload["name"])

    async def test_delete_factory_equipment(self):
        """[D] 설비 삭제 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/{self.equipment.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 204)
        # Verify object is removed from DB
        self.assertFalse(
            await FactoryEquipment.objects.filter(id=self.equipment.id).aexists()
        )

    async def test_create_factory_equipment_with_all_fields(self):
        """[C] 모든 필드를 포함한 설비 생성 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "Complete Equipment",
            "status": "running",
            "priority": 10,
            "location": "Building A, Floor 2",
            "note": "This is a test equipment with all fields",
        }
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], payload["name"])
        self.assertEqual(data["status"], payload["status"])
        self.assertEqual(data["priority"], payload["priority"])
        self.assertEqual(data["location"], payload["location"])
        self.assertEqual(data["note"], payload["note"])

    async def test_create_factory_equipment_minimal_fields(self):
        """[C] 최소 필드만으로 설비 생성 테스트"""
        headers = await self.authenticate()
        payload = {"name": "Minimal Equipment", "priority": 1}
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], payload["name"])
        self.assertEqual(data["priority"], payload["priority"])
        # 기본값 확인 (한글 값)
        self.assertEqual(data["status"], "standby")  # 기본값

    async def test_create_factory_equipment_invalid_factory(self):
        """[C] 존재하지 않는 공장에 설비 생성 시도 테스트"""
        headers = await self.authenticate()
        payload = {"name": "Test Equipment", "priority": 1}
        response = await self.client.post(
            "?factory_id=99999", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)

    async def test_create_factory_equipment_unauthorized(self):
        """[C] 권한이 없는 공장에 설비 생성 시도 테스트"""
        # 다른 사용자와 공장 생성
        from asgiref.sync import sync_to_async

        @sync_to_async
        def create_other_factory():
            other_user = User.objects.create_user(
                email="other@example.com", password="password1234!"
            )
            other_factory = Factory.objects.create(
                owner=other_user, name="Other Factory"
            )
            return other_factory

        other_factory = await create_other_factory()

        headers = await self.authenticate()
        payload = {"name": "Test Equipment", "priority": 1}
        response = await self.client.post(
            f"?factory_id={other_factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_equipment_all_fields(self):
        """[U] 모든 필드를 수정하는 테스트"""
        headers = await self.authenticate()
        payload = {
            "name": "Fully Updated Equipment",
            "status": "running",
            "priority": 15,
            "location": "Building B, Floor 3",
            "note": "This equipment has been fully updated",
        }
        response = await self.client.patch(
            f"/{self.equipment.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], payload["name"])
        self.assertEqual(data["status"], payload["status"])
        self.assertEqual(data["priority"], payload["priority"])
        self.assertEqual(data["location"], payload["location"])
        self.assertEqual(data["note"], payload["note"])

    async def test_update_factory_equipment_partial(self):
        """[U] 부분 필드만 수정하는 테스트"""
        headers = await self.authenticate()
        original_name = self.equipment.name
        original_priority = self.equipment.priority

        payload = {"status": "running"}
        response = await self.client.patch(
            f"/{self.equipment.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], payload["status"])
        # 다른 필드는 변경되지 않았는지 확인
        self.assertEqual(data["name"], original_name)
        self.assertEqual(data["priority"], original_priority)

    async def test_update_factory_equipment_nonexistent(self):
        """[U] 존재하지 않는 설비 수정 시도 테스트"""
        headers = await self.authenticate()
        payload = {"name": "Updated Name"}
        response = await self.client.patch(
            f"/99999?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_factory_equipment_wrong_factory(self):
        """[U] 다른 공장의 설비 수정 시도 테스트"""
        # 다른 공장의 설비 생성
        from asgiref.sync import sync_to_async

        @sync_to_async
        def create_other_equipment():
            other_user = User.objects.create_user(
                email="other@example.com", password="password1234!"
            )
            other_factory = Factory.objects.create(
                owner=other_user, name="Other Factory"
            )
            other_equipment = FactoryEquipment.objects.create(
                factory=other_factory, name="Other Equipment", priority=1
            )
            return other_equipment

        other_equipment = await create_other_equipment()

        headers = await self.authenticate()
        payload = {"name": "Updated Name"}
        response = await self.client.patch(
            f"/{other_equipment.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 404)

    async def test_list_factory_equipments_with_filters(self):
        """[R] 필터를 사용한 설비 목록 조회 테스트"""
        # 추가 설비 생성
        from asgiref.sync import sync_to_async

        @sync_to_async
        def create_equipment():
            return FactoryEquipment.objects.create(
                factory=self.factory,
                name="Filtered Equipment",
                status="running",
                priority=2,
                location="Building C",
            )

        equipment2 = await create_equipment()

        headers = await self.authenticate()

        # 이름으로 필터링
        response = await self.client.get(
            f"?factory_id={self.factory.id}&name=Filtered", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["name"], "Filtered Equipment")

        # 상태로 필터링
        response = await self.client.get(
            f"?factory_id={self.factory.id}&status=running", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["status"], "running")

        # 위치로 필터링
        response = await self.client.get(
            f"?factory_id={self.factory.id}&location=Building", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["location"], "Building C")

    async def test_list_factory_equipments_empty_result(self):
        """[R] 빈 결과를 반환하는 필터 테스트"""
        headers = await self.authenticate()

        # 존재하지 않는 이름으로 필터링
        response = await self.client.get(
            f"?factory_id={self.factory.id}&name=Nonexistent", headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 0)

    async def test_delete_factory_equipment_nonexistent(self):
        """[D] 존재하지 않는 설비 삭제 시도 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_delete_factory_equipment_wrong_factory(self):
        """[D] 다른 공장의 설비 삭제 시도 테스트"""
        # 다른 공장의 설비 생성
        from asgiref.sync import sync_to_async

        @sync_to_async
        def create_other_equipment():
            other_user = User.objects.create_user(
                email="other@example.com", password="password1234!"
            )
            other_factory = Factory.objects.create(
                owner=other_user, name="Other Factory"
            )
            other_equipment = FactoryEquipment.objects.create(
                factory=other_factory, name="Other Equipment", priority=1
            )
            return other_equipment

        other_equipment = await create_other_equipment()

        headers = await self.authenticate()
        response = await self.client.delete(
            f"/{other_equipment.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

        # 설비가 실제로 삭제되지 않았는지 확인
        self.assertTrue(
            await FactoryEquipment.objects.filter(id=other_equipment.id).aexists()
        )

    async def test_get_factory_equipment_nonexistent(self):
        """[R] 존재하지 않는 설비 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_get_factory_equipment_wrong_factory(self):
        """[R] 다른 공장의 설비 조회 테스트"""
        # 다른 공장의 설비 생성
        from asgiref.sync import sync_to_async

        @sync_to_async
        def create_other_equipment():
            other_user = User.objects.create_user(
                email="other@example.com", password="password1234!"
            )
            other_factory = Factory.objects.create(
                owner=other_user, name="Other Factory"
            )
            other_equipment = FactoryEquipment.objects.create(
                factory=other_factory, name="Other Equipment", priority=1
            )
            return other_equipment

        other_equipment = await create_other_equipment()

        headers = await self.authenticate()
        response = await self.client.get(
            f"/{other_equipment.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_create_factory_equipment_without_auth(self):
        """[C] 인증 없이 설비 생성 시도 테스트"""
        payload = {"name": "Unauthorized Equipment", "priority": 1}
        response = await self.client.post(
            f"?factory_id={self.factory.id}", json=payload
        )
        self.assertEqual(response.status_code, 401)

    async def test_list_factory_equipments_without_auth(self):
        """[R] 인증 없이 설비 목록 조회 시도 테스트"""
        response = await self.client.get(f"?factory_id={self.factory.id}")
        self.assertEqual(response.status_code, 401)

    async def test_create_factory_equipment_invalid_data(self):
        """[C] 잘못된 데이터로 설비 생성 시도 테스트"""
        headers = await self.authenticate()

        # 필수 필드 누락 (name 필드 없음)
        payload = {"priority": 1}
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 422)

        # 잘못된 priority 타입 (문자열 대신 정수 필요)
        payload = {"name": "Invalid Equipment", "priority": "not_a_number"}
        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 422)  # 타입 오류
