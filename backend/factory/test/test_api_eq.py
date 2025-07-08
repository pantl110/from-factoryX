from django.test import TestCase
from ninja.testing import TestAsyncClient

from user.api import router as user_router
from factory.api_eq import router as factory_eq_router

from user.models import User
from factory.models import Factory, FactoryEquipment

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
            "factory": self.factory.id,
            "name": "Created Equipment",
            "priority": 5,
        }
        response = await self.client.post("", headers=headers, json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], payload["name"])

    async def test_list_factory_equipments(self):
        """[R] 설비 목록 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get("", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Ninja pagination returns list in data["data"]
        self.assertIn("data", data)
        self.assertTrue(len(data["data"]) >= 1)

        # filtering test
        response = await self.client.get(
            "", headers=headers, params={"name": "Equipment"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertTrue(len(data["data"]) >= 1)

    async def test_get_factory_equipment(self):
        """[R] 설비 상세 조회 테스트"""
        headers = await self.authenticate()
        response = await self.client.get(f"/{self.equipment.id}", headers=headers)
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
            f"/{self.equipment.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.equipment.id)
        self.assertEqual(data["name"], payload["name"])

    async def test_delete_factory_equipment(self):
        """[D] 설비 삭제 테스트"""
        headers = await self.authenticate()
        response = await self.client.delete(f"/{self.equipment.id}", headers=headers)
        self.assertEqual(response.status_code, 204)
        # Verify object is removed from DB
        self.assertFalse(
            await FactoryEquipment.objects.filter(id=self.equipment.id).aexists()
        )
