from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from document.models import Quotation, QuotationProduct
from stock.models import Product
from project.models import Project
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date
from django.test import AsyncClient
from cfehome.urls import base_api
from asgiref.sync import sync_to_async

User = get_user_model()


class QuotationDetailAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # 공장 생성 (판매처 정보 포함)
        self.factory = Factory.objects.create(
            name="테스트 공장",
            owner=self.user,
            business_registration_number="123-45-67890",
            representative_name="홍길동",
            manager_email="manager@test.com",
            manager_phone="02-1234-5678",
            manager_fax="02-1234-5679",
            business_type="제조업",
            business_category="기계장비제조",
            business_address="서울시 강남구 테헤란로 123",
        )

        # 고객 생성 (완전한 정보)
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="ABC 주식회사",
            business_registration_number="123-45-67890",
            representative_name="홍길동",
            email="contact@abc.com",
            phone="02-1234-5678",
            fax="02-1234-5679",
            business_type="제조업",
            business_category="기계장비제조",
            address="서울시 강남구 테헤란로 123",
            manager="김담당",
            note="테스트 고객사입니다.",
        )

        # 제품 생성
        self.product1 = Product.objects.create(
            factory=self.factory,
            name="스테인리스 파이프",
            code="PIPE001",
            unit="개",
            spec="304, 50A",
        )

        self.product2 = Product.objects.create(
            factory=self.factory,
            name="플랜지",
            code="FLANGE001",
            unit="개",
            spec="304, 50A",
        )

        # 프로젝트 생성
        self.project = Project.objects.create(status="quotation")

        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,
            project=self.project,
            due_date=date(2025, 6, 15),
        )

        # 견적서 제품 생성
        self.quotation_product1 = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=10,
            unit_price=50000,
            is_delivery=False,
        )

        self.quotation_product2 = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product2,
            quantity=20,
            unit_price=15000,
            is_delivery=True,
            delivery_date=date(2025, 6, 20),
        )

        # FactoryMember 생성 (사용자를 공장 멤버로 등록)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status="active",
            invited_by=self.user,
        )

        # JWT 토큰 생성
        self.token = self.generate_jwt_token()

        # 테스트 클라이언트 생성
        self.client = AsyncClient()

    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def get_auth_headers(self):
        """인증 헤더 반환"""
        return {"Authorization": f"Bearer {self.token}"}

    async def test_get_quotation_detail_success(self):
        """견적서 조회 성공 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        if response.status_code != 200:
            print(f"Error response: {response.content}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 고객사 정보 검증
        self.assertEqual(data["factory_name"], "ABC 주식회사")
        self.assertEqual(data["business_registration_number"], "123-45-67890")
        self.assertEqual(data["representative_name"], "홍길동")
        self.assertEqual(data["email"], "contact@abc.com")
        self.assertEqual(data["phone"], "02-1234-5678")
        self.assertEqual(data["fax"], "02-1234-5679")
        self.assertEqual(data["business_type"], "제조업")
        self.assertEqual(data["business_category"], "기계장비제조")
        self.assertEqual(data["address"], "서울시 강남구 테헤란로 123")

        # 주문 품목 정보 검증
        self.assertEqual(len(data["products"]), 2)

        # 첫 번째 제품 검증
        product1 = data["products"][0]
        self.assertEqual(product1["product_name"], "스테인리스 파이프")
        self.assertEqual(product1["spec"], "304, 50A")
        self.assertEqual(product1["unit"], "개")
        self.assertEqual(product1["quantity"], 10)
        self.assertEqual(product1["unit_price"], 50000)
        self.assertEqual(product1["supply_amount"], 500000)  # 10 * 50000
        self.assertEqual(product1["tax_amount"], 50000)  # 500000 * 0.1

        # 두 번째 제품 검증
        product2 = data["products"][1]
        self.assertEqual(product2["product_name"], "플랜지")
        self.assertEqual(product2["spec"], "304, 50A")
        self.assertEqual(product2["unit"], "개")
        self.assertEqual(product2["quantity"], 20)
        self.assertEqual(product2["unit_price"], 15000)
        self.assertEqual(product2["supply_amount"], 300000)  # 20 * 15000
        self.assertEqual(product2["tax_amount"], 30000)  # 300000 * 0.1

    async def test_get_quotation_detail_not_found(self):
        """존재하지 않는 견적서 조회 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/99999?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 404)

    async def test_get_quotation_detail_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}"
        )

        self.assertEqual(response.status_code, 401)

    async def test_get_quotation_detail_invalid_token(self):
        """잘못된 토큰 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers={"Authorization": "Bearer invalid_token"},
        )

        self.assertEqual(response.status_code, 401)

    async def test_get_quotation_detail_missing_factory_id(self):
        """factory_id 파라미터 누락 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 400)

    async def test_get_quotation_detail_without_factory(self):
        """공장 정보가 없는 견적서 조회 테스트"""
        # 공장 정보가 없는 견적서 생성 (factory 필드가 None)
        quotation_no_factory = await sync_to_async(Quotation.objects.create)(
            factory=None, client=self.client_company, project=self.project
        )

        response = await self.client.get(
            f"/v1/document/quotation/{quotation_no_factory.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        # factory_id가 None이므로 403 에러가 발생해야 함
        self.assertEqual(response.status_code, 403)

    async def test_get_quotation_detail_without_products(self):
        """제품 정보가 없는 견적서 조회 테스트"""
        # 제품이 없는 견적서 생성
        quotation_no_products = await sync_to_async(Quotation.objects.create)(
            factory=self.factory, client=self.client_company, project=self.project
        )

        response = await self.client.get(
            f"/v1/document/quotation/{quotation_no_products.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 고객 정보는 정상적으로 반환
        self.assertEqual(data["factory_name"], "ABC 주식회사")
        # 제품 목록은 빈 배열
        self.assertEqual(data["products"], [])

    async def test_get_quotation_detail_partial_factory_info(self):
        """부분적인 고객사 정보가 있는 견적서 조회 테스트"""
        # 부분적인 정보만 있는 고객사 생성
        partial_client = await sync_to_async(FactoryClient.objects.create)(
            factory=self.factory,
            name="부분 정보 고객사",
            email="partial@client.com",
            # 다른 필드들은 null
        )

        quotation_partial = await sync_to_async(Quotation.objects.create)(
            factory=self.factory, client=partial_client, project=self.project
        )

        response = await self.client.get(
            f"/v1/document/quotation/{quotation_partial.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 입력된 정보만 반환되고 나머지는 None
        self.assertEqual(data["factory_name"], "부분 정보 고객사")
        self.assertEqual(data["email"], "partial@client.com")
        self.assertIsNone(data["business_registration_number"])
        self.assertIsNone(data["representative_name"])
        self.assertIsNone(data["phone"])
        self.assertIsNone(data["fax"])
        self.assertIsNone(data["business_type"])
        self.assertIsNone(data["business_category"])
        self.assertIsNone(data["address"])

    async def test_get_quotation_detail_tax_calculation(self):
        """세액 계산 정확성 테스트"""
        # 세액 계산이 정확한지 테스트
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        for product in data["products"]:
            expected_supply_amount = product["quantity"] * product["unit_price"]
            expected_tax_amount = int(expected_supply_amount * 0.1)

            self.assertEqual(product["supply_amount"], expected_supply_amount)
            self.assertEqual(product["tax_amount"], expected_tax_amount)

    async def test_get_quotation_detail_multiple_factories(self):
        """다른 공장의 견적서 접근 테스트 (권한 체크 제거됨)"""
        # 다른 사용자와 공장 생성
        other_user = await sync_to_async(User.objects.create_user)(
            username="otheruser", email="other@example.com", password="testpass123"
        )

        other_factory = await sync_to_async(Factory.objects.create)(
            name="다른 공장", owner=other_user
        )

        # 다른 공장의 멤버도 생성 (현재 사용자를 다른 공장의 멤버로 등록)
        other_factory_member = await sync_to_async(FactoryMember.objects.create)(
            factory=other_factory,
            user=self.user,
            role="viewer",
            status="active",
            invited_by=other_user,
        )

        other_client = await sync_to_async(FactoryClient.objects.create)(
            factory=other_factory, name="다른 고객사"
        )

        other_project = await sync_to_async(Project.objects.create)(
            status="견적 협의중"
        )

        other_quotation = await sync_to_async(Quotation.objects.create)(
            factory=other_factory, client=other_client, project=other_project
        )

        # 현재 사용자가 다른 공장의 견적서에 접근 시도 (권한 체크 제거로 200 반환)
        response = await self.client.get(
            f"/v1/document/quotation/{other_quotation.id}?factory_id={other_factory.id}",
            headers=self.get_auth_headers(),
        )

        # 권한 체크가 제거되어 200 OK가 반환됨
        self.assertEqual(response.status_code, 200)

    async def test_get_quotation_detail_with_zero_values(self):
        """0값이 있는 견적서 제품 조회 테스트"""
        # 0값이 있는 제품 생성
        zero_product = await sync_to_async(QuotationProduct.objects.create)(
            quotation=self.quotation, product=self.product1, quantity=0, unit_price=1000
        )

        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 0값 제품도 정상적으로 계산되어야 함
        zero_product_data = next(
            (p for p in data["products"] if p["quantity"] == 0), None
        )
        self.assertIsNotNone(zero_product_data)
        self.assertEqual(zero_product_data["supply_amount"], 0)
        self.assertEqual(zero_product_data["tax_amount"], 0)

    async def test_get_quotation_detail_large_numbers(self):
        """큰 숫자 처리 테스트"""
        # 큰 숫자로 제품 생성
        large_product = await sync_to_async(QuotationProduct.objects.create)(
            quotation=self.quotation,
            product=self.product1,
            quantity=1000000,
            unit_price=999999,
        )

        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 큰 숫자도 정상적으로 계산되어야 함
        large_product_data = next(
            (p for p in data["products"] if p["quantity"] == 1000000), None
        )
        self.assertIsNotNone(large_product_data)
        expected_supply_amount = 1000000 * 999999
        expected_tax_amount = int(expected_supply_amount * 0.1)

        self.assertEqual(large_product_data["supply_amount"], expected_supply_amount)
        self.assertEqual(large_product_data["tax_amount"], expected_tax_amount)

    async def test_get_quotation_detail_product_fields(self):
        """견적서 품목 조회 시 productId와 product_code 필드 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # products 필드가 존재하는지 확인
        self.assertIn("products", data)
        self.assertIsInstance(data["products"], list)
        self.assertGreater(len(data["products"]), 0)

        # 각 제품에 대해 필수 필드들이 존재하는지 확인
        for product in data["products"]:
            # 새로 추가된 필드들 확인
            self.assertIn("productId", product)
            self.assertIn("product_code", product)
            self.assertIn("product_name", product)
            self.assertIn("spec", product)
            self.assertIn("unit", product)
            self.assertIn("quantity", product)
            self.assertIn("unit_price", product)
            self.assertIn("supply_amount", product)
            self.assertIn("tax_amount", product)

            # productId가 올바른 값인지 확인
            self.assertIsInstance(product["productId"], int)
            self.assertGreater(product["productId"], 0)

            # product_code가 올바른 값인지 확인 (Product 모델에 code 필드가 있는 경우)
            if product["product_code"] is not None:
                self.assertIsInstance(product["product_code"], str)
                self.assertGreater(len(product["product_code"]), 0)

    async def test_get_quotation_detail_product_calculation_accuracy(self):
        """견적서 품목 금액 계산 정확성 테스트"""
        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        for product in data["products"]:
            # 공급가액 계산 확인
            expected_supply_amount = product["quantity"] * product["unit_price"]
            self.assertEqual(product["supply_amount"], expected_supply_amount)

            # 부가세 계산 확인 (10%)
            expected_tax_amount = int(expected_supply_amount * 0.1)
            self.assertEqual(product["tax_amount"], expected_tax_amount)

            # 합계 금액 확인
            total_amount = product["supply_amount"] + product["tax_amount"]
            expected_total = expected_supply_amount + expected_tax_amount
            self.assertEqual(total_amount, expected_total)

    async def test_get_quotation_detail_product_without_code(self):
        """product_code가 없는 제품 테스트"""
        # code 필드가 없는 제품 생성
        product_without_code = await sync_to_async(Product.objects.create)(
            factory=self.factory, name="코드 없는 제품", unit="개", spec="테스트 스펙"
        )

        quotation_product = await sync_to_async(QuotationProduct.objects.create)(
            quotation=self.quotation,
            product=product_without_code,
            quantity=5,
            unit_price=20000,
        )

        response = await self.client.get(
            f"/v1/document/quotation/{self.quotation.id}?factory_id={self.factory.id}",
            headers=self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # code가 없는 제품 찾기
        product_without_code_data = next(
            (p for p in data["products"] if p["product_name"] == "코드 없는 제품"), None
        )
        self.assertIsNotNone(product_without_code_data)

        # productId는 있어야 하고, product_code는 빈 문자열이어야 함
        self.assertIsInstance(product_without_code_data["productId"], int)
        self.assertEqual(product_without_code_data["product_code"], "")

    async def test_quotation_send_email_with_pdf(self):
        """견적서 이메일 전송 테스트 (PDF 데이터 포함)"""
        import base64
        import json

        # 실제 PDF 헤더를 가진 최소한의 PDF 데이터 생성
        minimal_pdf = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000108 00000 n 
0000000205 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF"""

        payload = {
            # "email": "updowney@daum.net",
            "email": "testuser@example.com",
            "factory_id": self.factory.id,
            "client_name": "테스트 고객",
            "pdf_data": base64.b64encode(minimal_pdf).decode("utf-8"),
        }

        response = await self.client.post(
            f"/v1/document/quotation/send-email",
            data=json.dumps(payload),
            content_type="application/json",
            **self.get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertEqual(response.json()["message"], "이메일이 전송되었습니다.")
