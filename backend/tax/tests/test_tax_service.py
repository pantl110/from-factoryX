from django.test import TestCase
from user.api import router as user_router
from tax.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from asgiref.sync import sync_to_async
from stock.models import Product
from datetime import date
from django.utils import timezone
from tax.models import NationalTaxService


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

        # 제품 생성
        self.product1 = Product.objects.create(
            factory=self.factory,
            name="M8 볼트 세트",
            code="BOLT001",
            unit="개",
            spec="M8x20",
        )

        self.product2 = Product.objects.create(
            factory=self.factory, name="나사", code="SCREW001", unit="개", spec="M6x15"
        )

        self.product3 = Product.objects.create(
            factory=self.factory, name="와셔", code="WASHER001", unit="개", spec="M8"
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

    async def test_create_tax_service(self):
        """세금계산서 생성 테스트(임시 저장)"""
        headers = await self.authenticate()
        data = {
            "factory": self.factory.id,
            "publish_status": "temporary",
            "tax_invoice_type": "sales",
            "transaction_type": "receipt",
            "transaction_date": timezone.now().date().strftime("%Y-%m-%d"),
            "client": self.client_company1.id,
            "product": [self.product1.id, self.product2.id],
            "transaction_amount": 70000,
            "tax_amount": 7000,
            "line_items": [
                {
                    "purchase_expiry": timezone.now().date(),
                    "name": "M8 볼트 세트",
                    "information": "M8x20",
                    "chargeable_unit": "10",
                    "unit_price": "5000",
                    "amount": "50000",
                    "tax": "5000",
                    "description": "볼트 세트 설명",
                },
                {
                    "purchase_expiry": timezone.now().date(),
                    "name": "나사",
                    "information": "M6x15",
                    "chargeable_unit": "10",
                    "unit_price": "2000",
                    "amount": "20000",
                    "tax": "2000",
                },
            ],
        }
        response = await self.client.post("", json=data, headers=headers)
        data = response.json()
        # print("🐍 File: tests/test_tax_service.py | Line: 103 | setUp ~ data", data)
        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())
        tax_service_id = data.get("id")
        tax_service = await NationalTaxService.objects.aget(
            id=tax_service_id
        )  # Ensure the object is created
        print(
            "🐍 File: tests/test_tax_service.py | Line: 148 | setUp ~ tax_service",
            tax_service.mgt_key,
        )
        return data.get("id")

    # async def test_publish_tax_invoice(self):
    #     """세금계산서 발행 테스트"""
    #     headers = await self.authenticate()
    #     tax_service_id = await self.test_create_tax_service()

    #     # 세금계산서 발행
    #     response = await self.client.post(f"{tax_service_id}/publish", headers=headers)
    #     data = response.json()
    #     print("🐍 File: tests/test_tax_service.py | Line: 143 | setUp ~ data", data)
    #     self.assertEqual(response.status_code, 200)
    #     self.assertIn("id", response.json())

    async def test_get_tax_service_by_id(self):
        """세금계산서 ID로 조회 테스트"""
        headers = await self.authenticate()
        tax_service_id = await self.test_create_tax_service()

        response = await self.client.get(f"/{tax_service_id}", headers=headers)
        data = response.json()
        # print("🐍 File: tests/test_tax_service.py | Line: 155 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("id", response.json())
        self.assertEqual(data["id"], tax_service_id)

    async def test_update_tax_service(self):
        """세금계산서 수정 테스트"""
        headers = await self.authenticate()
        tax_service_id = await self.test_create_tax_service()

        # 세금계산서 수정
        data = {
            "factory": self.factory.id,
            "client": self.client_company1.id,
            "product": [self.product1.id, self.product2.id],
            "transaction_amount": 80000,
            "tax_amount": 8000,
            "line_items": [
                {
                    "purchase_expiry": timezone.now().date(),
                    "name": "M8 볼트 세트",
                    "information": "M8x20",
                    "chargeable_unit": "10",
                    "unit_price": "6000",
                    "amount": "60000",
                    "tax": "6000",
                    "description": "볼트 세트 수정 설명",
                },
                {
                    "purchase_expiry": timezone.now().date(),
                    "name": "나사",
                    "information": "M6x15",
                    "chargeable_unit": "10",
                    "unit_price": "2000",
                    "amount": "20000",
                    "tax": "2000",
                },
            ],
        }
        response = await self.client.patch(
            f"/{tax_service_id}", json=data, headers=headers
        )
        data = response.json()
        # print("🐍 File: tests/test_tax_service.py | Line: 209 | setUp ~ data", data)

        self.assertEqual(response.status_code, 200)
        self.assertIn("id", response.json())
        self.assertEqual(data["id"], tax_service_id)

    async def test_delete_tax_service(self):
        """세금계산서 삭제 테스트"""
        headers = await self.authenticate()
        tax_service_id = await self.test_create_tax_service()

        response = await self.client.delete(f"/{tax_service_id}", headers=headers)
        self.assertEqual(response.status_code, 204)

        # 삭제된 세금계산서 조회 시 404 에러 확인
        response = await self.client.get(f"/{tax_service_id}", headers=headers)
        self.assertEqual(response.status_code, 404)

    async def test_sync_tax_service(self):
        """바로빌과 세금계산서 동기화 테스트"""
        headers = await self.authenticate()
        tax_service_id = await self.test_create_tax_service()

        # 세금계산서 동기화
        response = await self.client.post(f"/{tax_service_id}/sync", headers=headers)
        data = response.json()
        print("🐍 File: tests/test_tax_service.py | Line: 240 | setUp ~ data", data)

        self.assertEqual(response.status_code, 200)

    async def test_get_tax_service_state(self):
        """세금계산서 상태 조회 테스트"""
        headers = await self.authenticate()
        tax_service_id = await self.test_create_tax_service()

        response = await self.client.post(f"{tax_service_id}/publish", headers=headers)

        data = response.json()
        print("🐍 File: tests/test_tax_service.py | Line: 256 | setUp ~ data", data)

        response = await self.client.get(f"/{tax_service_id}/state", headers=headers)
        data = response.json()
        print("🐍 File: tests/test_tax_service.py | Line: 250 | setUp ~ data", data)

        self.assertEqual(response.status_code, 200)
        self.assertIn("publish_status", data)
        self.assertIn("mgt_key", data)
