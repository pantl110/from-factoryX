from django.test import TestCase
from unittest.mock import Mock, patch
from user.api import router as user_router
from tax.api_cash_receipt import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import CashReceipt, TaxInvoiceAccount
from stock.models import Material, MaterialHistory
from asgiref.sync import sync_to_async
from datetime import date
import json
import jwt
from django.conf import settings


class TestTaxService(TestCase):
    def setUp(self):
        # Mock BAROBILL_CASHBILL_CLIENT
        self.barobill_mock = Mock()
        self.barobill_mock.service = Mock()
        
        # Mock 객체를 실제 API 응답 구조처럼 생성
        mock_sales_result = Mock()
        mock_sales_result.CurrentPage = 1
        mock_sales_result.SimpleCashBillExList = None
        
        mock_purchase_result = Mock()
        mock_purchase_result.CurrentPage = 1
        mock_purchase_result.SimpleCashBillExList = None
        
        self.barobill_mock.service.GetPeriodCashBillSalesListEx = Mock(return_value=mock_sales_result)
        self.barobill_mock.service.GetPeriodCashBillPurchaseListEx = Mock(return_value=mock_purchase_result)
        
        # GetCashBillExNK Mock
        mock_detail = Mock()
        mock_detail.FranchiseCorpNum = "1663301345"
        self.barobill_mock.service.GetCashBillExNK = Mock(return_value=mock_detail)
        
        self.patcher = patch('django.conf.settings.BAROBILL_CASHBILL_CLIENT', self.barobill_mock)
        self.patcher.start()
        
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        
        # 사용자 생성 후 JWT 토큰 생성
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
        
        # JWT 토큰 생성
        self.token = self.generate_jwt_token()
    
    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        from datetime import datetime, timedelta
        return jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
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

    async def test_get_cash_receipt_detail_not_found(self):
        """존재하지 않는 현금영수증 조회 테스트"""
        headers = await self.authenticate()

        # 존재하지 않는 ID로 조회
        response = await self.client.get("/99999", headers=headers)

        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "해당 현금영수증이 존재하지 않습니다.")

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
    
    async def test_cash_receipt_account_creation(self):
        """현금영수증 동기화 시 account가 자동 생성되는지 테스트"""
        headers = await self.authenticate()
        
        # Mock 데이터에 현금영수증 추가
        mock_cash_receipt = Mock()
        mock_cash_receipt.TradeDate = "20250101"
        mock_cash_receipt.NTSConfirmNum = "TEST_CASH_001"
        mock_cash_receipt.Amount = "11000"
        mock_cash_receipt.Tax = "1000"
        mock_cash_receipt.ServiceCharge = "0"
        
        mock_detail = Mock()
        mock_detail.FranchiseCorpNum = "1663301345"
        mock_detail.FranchiseCorpName = "테스트 회사"
        mock_detail.FranchiseCEOName = "테스트 대표"
        mock_detail.FranchiseAddr = "테스트 주소"
        mock_detail.FranchiseTel = "010-1234-5678"
        mock_detail.IdentityNum = "1663301345"
        mock_detail.TradeType = "승인거래"
        mock_detail.TradeUsage = "소득공제"
        mock_detail.TradeMethod = "사업자번호"
        mock_detail.ItemName = "테스트 품목"
        mock_detail.CancelType = None
        mock_detail.CancelNTSConfirmNum = None
        mock_detail.CancelNTSConfirmDate = None
        
        mock_sales_list = Mock()
        mock_sales_list.SimpleCashBillEx = [mock_cash_receipt]
        
        mock_sales_result = Mock()
        mock_sales_result.CurrentPage = 1
        mock_sales_result.SimpleCashBillExList = mock_sales_list
        
        self.barobill_mock.service.GetPeriodCashBillSalesListEx = Mock(return_value=mock_sales_result)
        self.barobill_mock.service.GetCashBillExNK = Mock(return_value=mock_detail)
        
        # 현금영수증 동기화
        response = await self.client.post(f"/{self.factory.id}/sync", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # 동기화된 현금영수증 조회
        cash_receipts = await sync_to_async(list)(
            CashReceipt.objects.filter(factory=self.factory, nts_confirm_num="TEST_CASH_001")
        )
        self.assertGreater(len(cash_receipts), 0, "현금영수증이 생성되지 않았습니다.")
        
        # 각 현금영수증에 대해 account가 생성되었는지 확인
        for cash_receipt in cash_receipts:
            account_exists = await sync_to_async(
                TaxInvoiceAccount.objects.filter(cash_receipt=cash_receipt).exists
            )()
            self.assertTrue(
                account_exists, 
                f"현금영수증 {cash_receipt.id}에 대한 account가 생성되지 않았습니다."
            )
            
            if account_exists:
                account = await sync_to_async(TaxInvoiceAccount.objects.get)(cash_receipt=cash_receipt)
                expected_total = (
                    (cash_receipt.transaction_amount or 0) 
                    + (cash_receipt.tax_amount or 0) 
                    + (cash_receipt.service_charge or 0)
                )
                self.assertEqual(
                    account.total_billed_amount, 
                    expected_total, 
                    f"total_billed_amount가 올바르게 계산되지 않았습니다. 예상: {expected_total}, 실제: {account.total_billed_amount}"
                )
                self.assertEqual(
                    account.outstanding_balance, 
                    expected_total, 
                    f"outstanding_balance가 올바르게 설정되지 않았습니다. 예상: {expected_total}, 실제: {account.outstanding_balance}"
                )
                self.assertEqual(account.status, "waiting", "account 상태가 올바르게 설정되지 않았습니다.")
    
    async def test_update_cash_receipt_hidden_status(self):
        """현금영수증 숨김 상태 변경 테스트 (PATCH API)"""
        # is_hidden만 변경
        response = await self.client.patch(
            f"/{self.cash_receipt.id}",
            json={"is_hidden": True},
            headers={"Authorization": f"Bearer {self.token}"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["is_hidden"], True)

        # 변경된 내용 확인
        await sync_to_async(self.cash_receipt.refresh_from_db)()
        self.assertTrue(self.cash_receipt.is_hidden)

        # 다시 숨김 해제
        response = await self.client.patch(
            f"/{self.cash_receipt.id}",
            json={"is_hidden": False},
            headers={"Authorization": f"Bearer {self.token}"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["is_hidden"], False)

        # 변경된 내용 확인
        await sync_to_async(self.cash_receipt.refresh_from_db)()
        self.assertFalse(self.cash_receipt.is_hidden)

    async def test_update_cash_receipt_not_found(self):
        """존재하지 않는 현금영수증 수정 시도 테스트"""
        response = await self.client.patch(
            "/99999",
            json={"is_hidden": True},
            headers={"Authorization": f"Bearer {self.token}"},
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("해당 현금영수증이 존재하지 않습니다", response.json()["detail"])

    async def test_update_cash_receipt_empty_payload(self):
        """수정할 필드가 없을 때 테스트"""
        response = await self.client.patch(
            f"/{self.cash_receipt.id}",
            json={},
            headers={"Authorization": f"Bearer {self.token}"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("수정할 필드가 없습니다", response.json()["detail"])

    async def test_update_cash_receipt_only_hidden_allowed(self):
        """is_hidden 외 다른 필드 수정 시도 테스트"""
        original_amount = self.cash_receipt.transaction_amount
        
        # 다른 필드 수정 시도 (현금영수증은 is_hidden만 수정 가능)
        response = await self.client.patch(
            f"/{self.cash_receipt.id}",
            json={"transaction_amount": 99999, "is_hidden": True},
            headers={"Authorization": f"Bearer {self.token}"},
        )

        # is_hidden만 수정되고 transaction_amount는 무시됨
        self.assertEqual(response.status_code, 200)
        
        # transaction_amount가 변경되지 않았는지 확인
        await sync_to_async(self.cash_receipt.refresh_from_db)()
        self.assertEqual(self.cash_receipt.transaction_amount, original_amount)
        self.assertTrue(self.cash_receipt.is_hidden)
    
    def tearDown(self):
        """테스트 후 정리"""
        self.patcher.stop()
