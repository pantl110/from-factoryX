from django.test import TestCase
from user.api import router as user_router
from tax.api_cash_receipt import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import CashReceipt
from stock.models import Material, MaterialHistory
from asgiref.sync import sync_to_async
from datetime import date


class TestTaxService(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            email="test1@example.com",
            password="password1234!",
            status=User.UserStatusChoice.admin,
            terms_of_service=True,
            privacy_policy_agreement=True,
            barobill_user_id="updowney",
        )
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )
        # 공장 생성
        self.factory = Factory.objects.create(
            name="다운테크",
            owner=self.user,
            business_registration_number="1663301345",
            representative_name="전다운",
            business_address="전남 순천시 선평동선길 36 서면빛찬들아파트 303동 1202호",
            business_type="정보통신업",
            business_category="응용소프트웨어 개발 및 공급업",
            manager_email="updowney@daum.net",
            manager_phone="010-4136-2245",
        )
        # 공장 멤버 생성
        self.member = FactoryMember.objects.create(
            user=self.user,
            factory=self.factory,
            role=FactoryMember.FactoryMemberType.admin,
            invited_by=self.user,
        )
        # 거래처 생성
        self.client_company1 = FactoryClient.objects.create(
            factory=self.factory,
            name="위드플레이스",
            business_registration_number="6238702457",
            representative_name="김태원",
            address="경기 파주시 경의로 1114 406호",
            business_type="정보통신업",
            business_category="정보통신자문",
            manager="김태원",
        )

        # 테스트용 현금영수증 생성
        self.cash_receipt = CashReceipt.objects.create(
            user=self.user,
            factory=self.factory,
            factory_info={
                "id": self.factory.id,
                "name": self.factory.name,
                "business_registration_number": self.factory.business_registration_number,
            },
            cash_receipt_type="sales",
            transaction_date=date.today(),
            client=self.client_company1,
            client_info={
                "id": self.client_company1.id,
                "name": self.client_company1.name,
                "business_registration_number": self.client_company1.business_registration_number,
            },
            transaction_amount=10000,
            tax_amount=1000,
            service_charge=0,
            nts_confirm_num="TEST123456789",
            franchise_corp_num="1663301345",
            franchise_corp_name="다운테크",
            franchise_ceo_name="전다운",
            franchise_addr="전남 순천시 선평동선길 36",
            franchise_tel="010-4136-2245",
            identity_num="1663301345",
            trade_type="승인거래",
            trade_usage="소득공제",
            trade_method="사업자번호",
            item_name="M8 볼트 세트",
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    async def get_refresh_token(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return data.get("refresh_token")

    async def test_sync_cash_receipt(self):
        """바로빌과 현금영수증 동기화 테스트"""
        headers = await self.authenticate()

        # 현금영수증 동기화
        response = await self.client.post(f"/{self.factory.id}/sync", headers=headers)
        data = response.json()
        print("🐍 File: tests/test_tax_service.py | Line: 240 | setUp ~ data", data)

        self.assertEqual(response.status_code, 200)

    async def test_get_cash_receipt_detail(self):
        """현금영수증 상세 조회 테스트 - 새로운 간단한 API"""
        headers = await self.authenticate()

        # 현금영수증 상세 조회
        response = await self.client.get(f"/{self.cash_receipt.id}", headers=headers)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        # 기본 필드 검증
        self.assertEqual(data["id"], self.cash_receipt.id)
        self.assertEqual(data["cash_receipt_type"], "sales")
        self.assertEqual(data["transaction_amount"], 10000)
        self.assertEqual(data["tax_amount"], 1000)
        self.assertEqual(data["nts_confirm_num"], "TEST123456789")

        print("✅ 현금영수증 상세 조회 테스트 성공!")

    async def test_get_cash_receipt_detail_not_found(self):
        """존재하지 않는 현금영수증 조회 테스트"""
        headers = await self.authenticate()

        # 존재하지 않는 ID로 조회
        response = await self.client.get("/99999", headers=headers)

        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "해당 현금영수증이 존재하지 않습니다.")

        print("✅ 404 에러 테스트 성공!")

    async def test_cash_to_material_links_histories(self):
        """cash-to-material PATCH가 자재 이력을 현금영수증에 연결한다"""
        headers = await self.authenticate()

        # 자재 및 자재 이력 생성
        material = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="볼트",
            code="M8-BOLT",
            unit="EA",
            spec="M8",
        )

        mh1 = await sync_to_async(MaterialHistory.objects.create)(
            material=material,
            client=self.client_company1,
            quantity=10,
            price=100,
            type=MaterialHistory.MaterialHistoryType.purchase,
            total_stock=10,
        )
        mh2 = await sync_to_async(MaterialHistory.objects.create)(
            material=material,
            client=self.client_company1,
            quantity=5,
            price=120,
            type=MaterialHistory.MaterialHistoryType.purchase,
            total_stock=15,
        )

        payload = {"material_history_id": [mh1.id, mh2.id]}
        resp = await self.client.patch(
            f"/{self.cash_receipt.id}/cash-to-material",
            headers=headers,
            json=payload,
        )
        self.assertEqual(resp.status_code, 200)

        await sync_to_async(mh1.refresh_from_db)()
        await sync_to_async(mh2.refresh_from_db)()
        self.assertEqual(mh1.cash_receipt_id, self.cash_receipt.id)
        self.assertEqual(mh2.cash_receipt_id, self.cash_receipt.id)

    async def test_update_material_history_link_and_unlink(self):
        """update-material-history가 비교 후 연결/해제를 수행한다"""
        headers = await self.authenticate()

        material = await sync_to_async(Material.objects.create)(
            factory=self.factory,
            name="너트",
            code="M8-NUT",
            unit="EA",
            spec="M8",
        )

        # 기존 링크 2개, 신규 대상 1개 준비
        linked1 = await sync_to_async(MaterialHistory.objects.create)(
            material=material,
            client=self.client_company1,
            quantity=3,
            price=90,
            type=MaterialHistory.MaterialHistoryType.purchase,
            total_stock=3,
            cash_receipt=self.cash_receipt,
        )
        linked2 = await sync_to_async(MaterialHistory.objects.create)(
            material=material,
            client=self.client_company1,
            quantity=7,
            price=110,
            type=MaterialHistory.MaterialHistoryType.purchase,
            total_stock=10,
            cash_receipt=self.cash_receipt,
        )
        new_candidate = await sync_to_async(MaterialHistory.objects.create)(
            material=material,
            client=self.client_company1,
            quantity=4,
            price=95,
            type=MaterialHistory.MaterialHistoryType.purchase,
            total_stock=14,
        )

        # payload에는 linked1과 new_candidate만 포함 (linked2는 해제 대상)
        payload = {"material_history_id": [linked1.id, new_candidate.id]}
        resp = await self.client.patch(
            f"/{self.cash_receipt.id}/update-material-history",
            headers=headers,
            json=payload,
        )
        self.assertEqual(resp.status_code, 200)

        await sync_to_async(linked1.refresh_from_db)()
        await sync_to_async(linked2.refresh_from_db)()
        await sync_to_async(new_candidate.refresh_from_db)()

        # linked1은 유지, linked2는 해제, new_candidate는 새로 연결
        self.assertEqual(linked1.cash_receipt_id, self.cash_receipt.id)
        self.assertIsNone(linked2.cash_receipt_id)
        self.assertEqual(new_candidate.cash_receipt_id, self.cash_receipt.id)
