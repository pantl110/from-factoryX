from django.test import TestCase
from django.utils import timezone
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async
from datetime import date
from decimal import Decimal

from user.api import router as user_router
from stock.api_material_history_v2 import router as material_history_v2_router

from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from stock.models import Material, MaterialHistory
from repackaging.models import MaterialRepackaging


class TestMaterialHistoryV2API(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(material_history_v2_router)
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
            standard_stock=50,
        )

        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        self.material_history = MaterialHistory.objects.create(
            material=self.material,
            client=self.client_obj,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=Decimal("100.00"),
            price=1000,
            lot_number="LOT-2024-001",
            warehouse_location="A-1-1",
            expiration_date=date(2025, 12, 31),
            remaining_quantity=Decimal("80.00"),
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

    async def test_get_material_history_success(self):
        """원자재 이력 상세 조회 성공"""
        headers = await self.authenticate()
        url = f"/{self.material_history.id}?factory_id={self.factory.id}"
        response = await self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["lot_number"], "LOT-2024-001")
        self.assertEqual(float(data["quantity"]), 100.00)
        self.assertEqual(float(data["remaining_quantity"]), 80.00)
        self.assertEqual(data["warehouse_location"], "A-1-1")
        self.assertEqual(data["expiration_date"], "2025-12-31")

    async def test_get_material_history_not_found(self):
        """존재하지 않는 원자재 이력 조회"""
        headers = await self.authenticate()
        url = f"/99999?factory_id={self.factory.id}"
        response = await self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 404)

    async def test_get_material_history_wrong_factory(self):
        """다른 공장의 원자재 이력 조회"""
        other_factory = await sync_to_async(Factory.objects.create)(
            owner=self.user,
            name="Other Factory",
            business_registration_number="999-99-99999",
        )
        headers = await self.authenticate()
        url = f"/{self.material_history.id}?factory_id={other_factory.id}"
        response = await self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 404)

    async def test_get_material_history_without_factory_id(self):
        """factory_id 없이 조회"""
        headers = await self.authenticate()
        url = f"/{self.material_history.id}"
        response = await self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 400)

    async def test_update_material_history_success(self):
        """원자재 이력 수정 성공"""
        headers = await self.authenticate()
        url = f"/{self.material_history.id}?factory_id={self.factory.id}"
        payload = {
            "warehouse_location": "B-2-3",
            "expiration_date": "2026-01-15",
        }
        response = await self.client.patch(url, json=payload, headers=headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["warehouse_location"], "B-2-3")
        self.assertEqual(data["expiration_date"], "2026-01-15")

        # DB에서 확인
        await sync_to_async(self.material_history.refresh_from_db)()
        self.assertEqual(self.material_history.warehouse_location, "B-2-3")
        self.assertEqual(self.material_history.expiration_date, date(2026, 1, 15))

    async def test_update_material_history_only_warehouse(self):
        """창고위치만 수정"""
        headers = await self.authenticate()
        url = f"/{self.material_history.id}?factory_id={self.factory.id}"
        payload = {
            "warehouse_location": "C-3-4",
        }
        response = await self.client.patch(url, json=payload, headers=headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["warehouse_location"], "C-3-4")
        # 유통기한은 변경되지 않음
        self.assertEqual(data["expiration_date"], "2025-12-31")

    async def test_update_material_history_only_expiration_date(self):
        """유통기한만 수정"""
        headers = await self.authenticate()
        url = f"/{self.material_history.id}?factory_id={self.factory.id}"
        payload = {
            "expiration_date": "2027-06-30",
        }
        response = await self.client.patch(url, json=payload, headers=headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["expiration_date"], "2027-06-30")
        # 창고위치는 변경되지 않음
        self.assertEqual(data["warehouse_location"], "A-1-1")

    async def test_update_material_history_invalid_date_format(self):
        """잘못된 날짜 형식으로 수정 시도"""
        headers = await self.authenticate()
        url = f"/{self.material_history.id}?factory_id={self.factory.id}"
        payload = {
            "expiration_date": "2025/12/31",
        }
        response = await self.client.patch(url, json=payload, headers=headers)

        self.assertEqual(response.status_code, 400)

    async def test_update_material_history_not_found(self):
        """존재하지 않는 원자재 이력 수정"""
        headers = await self.authenticate()
        url = f"/99999?factory_id={self.factory.id}"
        payload = {
            "warehouse_location": "B-2-3",
        }
        response = await self.client.patch(url, json=payload, headers=headers)

        self.assertEqual(response.status_code, 404)

    async def test_list_available_lots_success(self):
        headers = await self.authenticate()
        response = await self.client.get(
            f"/available-lots?material_id={self.material.id}&factory_id={self.factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreater(len(data["data"]), 0)
        self.assertIn("lot_number", data["data"][0])

    async def test_list_available_lots_includes_initial_stock(self):
        initial_history = await sync_to_async(MaterialHistory.objects.create)(
            material=self.material,
            client=None,
            type=MaterialHistory.MaterialHistoryType.initial_stock,
            quantity=Decimal("15.5000"),
            price=None,
            lot_number="OPENING-LOT-001",
            remaining_quantity=Decimal("15.5000"),
        )
        headers = await self.authenticate()

        response = await self.client.get(
            f"/available-lots?material_id={self.material.id}&factory_id={self.factory.id}",
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        lots = response.json()["data"]
        self.assertTrue(
            any(
                lot["id"] == initial_history.id
                and lot["lot_number"] == "OPENING-LOT-001"
                and Decimal(str(lot["available_quantity"])) == Decimal("15.5000")
                for lot in lots
            )
        )

    async def test_list_available_lots_material_not_found(self):
        headers = await self.authenticate()
        response = await self.client.get(
            f"/available-lots?material_id=99999&factory_id={self.factory.id}",
            headers=headers,
        )
        self.assertEqual(response.status_code, 404)

    async def test_list_available_lots_without_factory_id(self):
        headers = await self.authenticate()
        response = await self.client.get(
            f"/available-lots?material_id={self.material.id}", headers=headers
        )
        self.assertEqual(response.status_code, 400)
