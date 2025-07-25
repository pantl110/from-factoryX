from django.test import TestCase
from user.api import router as user_router
from tax.api import router
from ninja.testing import TestAsyncClient
from user.models import User, EmailVerification
from factory.models import Factory, FactoryClient, FactoryMember
from asgiref.sync import sync_to_async
from stock.models import Product
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
            "transaction_date": "2023-10-01",
            "client": self.client_company1.id,
            "product": [self.product1.id, self.product2.id],
            "transaction_amount": 70000,
            "tax_amount": 7000,
            "line_items": [
                {
                    "purchase_expiry": date(2023, 10, 1),
                    "name": "M8 볼트 세트",
                    "information": "M8x20",
                    "chargeable_unit": "10",
                    "unit_price": "5000",
                    "amount": "50000",
                    "tax": "5000",
                    "description": "볼트 세트 설명",
                },
                {
                    "purchase_expiry": date(2023, 10, 1),
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
        return data.get("id")

    async def test_publish_tax_invoice(self):
        """세금계산서 발행 테스트"""
        headers = await self.authenticate()
        tax_service_id = await self.test_create_tax_service()

        # 세금계산서 발행
        response = await self.client.post(f"{tax_service_id}/publish", headers=headers)
        data = response.json()
        print("🐍 File: tests/test_tax_service.py | Line: 143 | setUp ~ data", data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("id", response.json())
