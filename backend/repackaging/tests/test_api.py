from django.test import TestCase
from django.utils import timezone
from ninja.testing import TestAsyncClient
from asgiref.sync import sync_to_async

from user.api import router as user_router
from repackaging.api import router as repackaging_router

from user.models import User
from factory.models import Factory, FactoryClient, FactoryMember
from stock.models import Material, MaterialHistory
from repackaging.models import MaterialRepackaging
from user.models import EmailVerification


class TestRepackagingAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(repackaging_router)
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

        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 구매 이력 생성 (소분의 부모)
        self.purchase_history = MaterialHistory.objects.create(
            type=MaterialHistory.MaterialHistoryType.purchase,
            material=self.material,
            client=self.client_obj,
            quantity=100,
            price=1000,
            remaining_quantity=100,
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        return {"Authorization": f"Bearer {tokens['access_token']}"}

    async def test_create_repackaging_success(self):
        """소분 생성 성공 테스트"""
        headers = await self.authenticate()

        payload = {
            "parent_history_id": self.purchase_history.id,
            "quantity": 30,
            "warehouse_location": "A-01",
            "expiration_date": "2025-12-31",
        }

        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["quantity"], 30)
        self.assertEqual(data["warehouse_location"], "A-01")
        self.assertEqual(data["parent_history_id"], self.purchase_history.id)
        self.assertTrue(data["lot_number"].startswith(self.purchase_history.lot_number))

        # 부모 이력의 잔량이 차감되었는지 확인
        await sync_to_async(self.purchase_history.refresh_from_db)()
        self.assertEqual(self.purchase_history.remaining_quantity, 70)

    async def test_create_repackaging_insufficient_quantity(self):
        """소분 수량 부족 테스트"""
        headers = await self.authenticate()

        payload = {
            "parent_history_id": self.purchase_history.id,
            "quantity": 150,  # 부모 잔량(100)보다 많음
        }

        response = await self.client.post(
            f"?factory_id={self.factory.id}", headers=headers, json=payload
        )
        self.assertEqual(response.status_code, 400)

    async def test_list_repackagings_success(self):
        """소분 내역 조회 성공 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=50,
            warehouse_location="B-01",
        )

        response = await self.client.get(
            f"?material_id={self.material.id}&factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        # 페이지네이션 응답 형식: {"data": [...], "count": ..., ...}
        self.assertIn("data", data)
        self.assertGreaterEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["quantity"], 50)
        self.assertEqual(data["data"][0]["warehouse_location"], "B-01")

    async def test_get_repackaging_detail_success(self):
        """소분 내역 상세 조회 성공 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=30,
            warehouse_location="A-01",
            expiration_date="2025-12-31",
        )

        response = await self.client.get(
            f"/{repackaging.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["id"], repackaging.id)
        self.assertEqual(data["quantity"], 30)
        self.assertEqual(data["warehouse_location"], "A-01")
        self.assertEqual(data["parent_history_id"], self.purchase_history.id)

    async def test_get_repackaging_detail_not_found(self):
        """존재하지 않는 소분 내역 조회 테스트"""
        headers = await self.authenticate()

        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 404)

    async def test_update_repackaging_success(self):
        """소분 내역 수정 성공 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=30,
            warehouse_location="A-01",
        )

        # 부모 이력 잔량 설정
        self.purchase_history.remaining_quantity = 70
        await sync_to_async(self.purchase_history.save)()

        payload = {
            "warehouse_location": "C-02",
            "expiration_date": "2026-01-01",
        }

        response = await self.client.patch(
            f"/{repackaging.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["warehouse_location"], "C-02")
        self.assertEqual(data["expiration_date"], "2026-01-01")
        self.assertEqual(data["quantity"], 30)  # 수량은 변경되지 않음

    async def test_update_repackaging_quantity_increase(self):
        """소분 내역 수량 증가 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성 (수량 30)
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=30,
        )

        # 부모 이력 잔량 설정 (70)
        self.purchase_history.remaining_quantity = 70
        await sync_to_async(self.purchase_history.save)()

        # 수량을 40으로 증가
        payload = {"quantity": 40}

        response = await self.client.patch(
            f"/{repackaging.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["quantity"], 40)

        # 부모 이력 잔량이 10 감소했는지 확인 (70 -> 60)
        await sync_to_async(self.purchase_history.refresh_from_db)()
        self.assertEqual(self.purchase_history.remaining_quantity, 60)

    async def test_update_repackaging_quantity_decrease(self):
        """소분 내역 수량 감소 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성 (수량 40)
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=40,
        )

        # 부모 이력 잔량 설정 (60)
        self.purchase_history.remaining_quantity = 60
        await sync_to_async(self.purchase_history.save)()

        # 수량을 30으로 감소
        payload = {"quantity": 30}

        response = await self.client.patch(
            f"/{repackaging.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["quantity"], 30)

        # 부모 이력 잔량이 10 증가했는지 확인 (60 -> 70)
        await sync_to_async(self.purchase_history.refresh_from_db)()
        self.assertEqual(self.purchase_history.remaining_quantity, 70)

    async def test_update_repackaging_quantity_insufficient(self):
        """소분 내역 수량 증가 시 부모 잔량 부족 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성 (수량 30)
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=30,
        )

        # 부모 이력 잔량 설정 (5, 부족한 상태)
        self.purchase_history.remaining_quantity = 5
        await sync_to_async(self.purchase_history.save)()

        # 수량을 40으로 증가 시도 (10 증가 필요, 하지만 잔량은 5만 있음)
        payload = {"quantity": 40}

        response = await self.client.patch(
            f"/{repackaging.id}?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)

    async def test_delete_repackaging_success(self):
        """소분 내역 삭제 성공 테스트"""
        headers = await self.authenticate()

        # 소분 내역 생성
        repackaging = await sync_to_async(MaterialRepackaging.objects.create)(
            parent_history=self.purchase_history,
            lot_number="LOT-20241121-01-01",
            quantity=40,
        )

        # 부모 이력 잔량 설정
        self.purchase_history.remaining_quantity = 60
        await sync_to_async(self.purchase_history.save)()

        response = await self.client.delete(
            f"/{repackaging.id}?factory_id={self.factory.id}", headers=headers
        )
        self.assertEqual(response.status_code, 204)

        # 부모 이력의 잔량이 복구되었는지 확인
        await sync_to_async(self.purchase_history.refresh_from_db)()
        self.assertEqual(self.purchase_history.remaining_quantity, 100)

        # 소분 내역이 삭제되었는지 확인
        exists = await sync_to_async(
            MaterialRepackaging.objects.filter(id=repackaging.id).exists
        )()
        self.assertFalse(exists)

