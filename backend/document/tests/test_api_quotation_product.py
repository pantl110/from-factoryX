from django.test import TestCase, Client
from factory.models import Factory, FactoryClient
from project.models import Project
from document.models import Quotation, QuotationProduct
from stock.models import Product
from user.models import User
import datetime

class QuotationProductUpsertAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="pw", email="testuser@example.com")
        self.factory = Factory.objects.create(owner=self.user, name="Test Factory")
        self.client_obj = FactoryClient.objects.create(factory=self.factory, name="Client1")
        self.project = Project.objects.create()
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_obj,
            project=self.project,
            due_date="2025-07-31"
        )
        self.product1 = Product.objects.create(name="제품1", factory=self.factory)
        self.product2 = Product.objects.create(name="제품2", factory=self.factory)
        self.login()

    def login(self):
        response = self.client.post(
            "/v1/auth/login",
            {"email": self.user.email, "password": "pw"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        self.client.defaults['HTTP_AUTHORIZATION'] = f"Bearer {tokens['access_token']}"

    def test_upsert_quotation_products(self):
        """
        견적서 품목 동기화(업서트) API 테스트
        """
        url = "/v1/document/quotation/product"
        payload = {
            "quotation_id": self.quotation.id,
            "client": {
                "name": self.client_obj.name,
                "business_registration_number": "123-45-67890",
                "representative_name": "홍길동",
                "business_type": "제조업",
                "business_category": "기계",
                "address": "서울시 강남구",
                "manager": "담당자",
                "email": "client1@example.com",
                "phone": "010-1234-5678",
                "fax": "02-123-4567"
            },
            "due_date": "2025-07-31",
            "products": [
                {
                    "id": self.product1.id,
                    "name": self.product1.name,
                    "code": "P001",
                    "spec": "규격1",
                    "unit": "EA",
                    "quantity": 10,
                    "unit_price": 1000,
                    "amount": 10000
                },
                {
                    "id": self.product2.id,
                    "name": self.product2.name,
                    "code": "P002",
                    "spec": "규격2",
                    "unit": "EA",
                    "quantity": 5,
                    "unit_price": 2000,
                    "amount": 10000
                }
            ],
            "action": "save"
        }
        response = self.client.post(url, payload, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("quotation_id", response.json())
        # DB에 QuotationProduct가 2개 생성되었는지 확인
        qps = QuotationProduct.objects.filter(quotation=self.quotation)
        self.assertEqual(qps.count(), 2)
        # 업데이트 테스트: product1만 남기고 product2 삭제
        payload["products"] = [payload["products"][0]]
        response2 = self.client.post(url, payload, content_type="application/json")
        self.assertEqual(response2.status_code, 200)
        qps2 = QuotationProduct.objects.filter(quotation=self.quotation)
        self.assertEqual(qps2.count(), 1)
        self.assertEqual(qps2.first().product.name, self.product1.name)

    def test_list_quotation_products(self):
        """
        견적서 품목 목록 조회 API 테스트
        """
        # 테스트 데이터 생성
        qp1 = QuotationProduct.objects.create(quotation=self.quotation, product=self.product1, quantity=5, unit_price=500)
        qp2 = QuotationProduct.objects.create(quotation=self.quotation, product=self.product2, quantity=3, unit_price=1000)

        # quotation_id로 조회
        url = f"/v1/document/quotation/product/?quotation_id={self.quotation.id}"
        response = self.client.get(url)

        # 응답 검증
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["quotation"], self.quotation.id)
        self.assertEqual(data[1]["quotation"], self.quotation.id)

        # factory_id로 조회
        url2 = f"/v1/document/quotation/product/?factory_id={self.factory.id}"
        response2 = self.client.get(url2)

        # 응답 검증
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        self.assertEqual(len(data2), 2)

    def test_get_quotation_product_detail(self):
        """
        견적서 품목 상세 조회 테스트
        """
        # 테스트 데이터 생성
        qp = QuotationProduct.objects.create(quotation=self.quotation, product=self.product1, quantity=5, unit_price=500)

        url = f"/v1/document/quotation/product/{qp.id}"
        response = self.client.get(url)

        # 응답 검증
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], qp.id)
        self.assertEqual(data["quotation"], self.quotation.id)
        self.assertEqual(data["product"], self.product1.id)
        self.assertEqual(data["quantity"], 5)
        self.assertEqual(data["unit_price"], 500)

    def test_list_quotation_products_no_params(self):
        """
        견적서 품목 목록 조회 - 파라미터 없음 테스트
        """
        url = "/v1/document/quotation/product/"
        response = self.client.get(url)
        
        # 응답 검증 (400 에러 - quotation_id 또는 factory_id 필요)
        self.assertEqual(response.status_code, 400)

    def test_get_quotation_product_detail_not_found(self):
        """
        견적서 품목 상세 조회 - 존재하지 않는 ID 테스트
        """
        url = "/v1/document/quotation/product/99999"
        response = self.client.get(url)

        # 응답 검증 (404 에러)
        self.assertEqual(response.status_code, 404) 