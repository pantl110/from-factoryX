from django.test import TestCase, Client
from factory.models import Factory, FactoryClient
from project.models import Project
from document.models import Quotation, QuotationProduct
from stock.models import Product
from user.models import User
import datetime

class QuotationProductAPITestCase(TestCase):
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
        
        # 테스트 제품 생성
        self.product = Product.objects.create(name="제품", factory=self.factory)
        
        # JWT 인증 로그인
        self.login()

    def login(self):
        # JWT 로그인
        response = self.client.post(
            "/v1/auth/login",
            {"email": self.user.email, "password": "pw"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        
        # Authorization 헤더에 Bearer 토큰 설정
        self.client.defaults['HTTP_AUTHORIZATION'] = f"Bearer {tokens['access_token']}"

    def test_create_quotation_product(self):
        """
        견적서 품목 생성 API 테스트
        """
        url = "/v1/document/quotation-product/quotation_products/"
        data = {
            "quotation": self.quotation.id,
            "product": self.product.id,
            "quantity": 10,
            "unit_price": 1000
        }
        response = self.client.post(url, data, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 201)  # Created
        self.assertEqual(response.json()["quotation"], self.quotation.id)
        self.assertEqual(response.json()["product"], self.product.id)

    def test_list_quotation_products(self):
        """
        견적서 품목 목록 조회 API 테스트
        """
        # 테스트 데이터 생성
        QuotationProduct.objects.create(quotation=self.quotation, product=self.product, quantity=5, unit_price=500)
        
        url = "/v1/document/quotation-product/quotation_products/list"
        data = {
            "quotation_id": self.quotation.id,
            "product_id": None,
            "is_delivery": None
        }
        response = self.client.post(url, data, content_type="application/json")
        
        # 에러 발생 시 디버깅 정보 출력
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response content: {response.content}")
        
        # 응답 검증
        self.assertEqual(response.status_code, 200)  # OK
        self.assertTrue(len(response.json()) >= 1)  # 최소 1개 이상의 품목이 조회되어야 함

    def test_get_quotation_product_detail(self):
        """
        견적서 품목 상세 조회 테스트
        """
        # 테스트 데이터 생성
        qp = QuotationProduct.objects.create(quotation=self.quotation, product=self.product, quantity=5, unit_price=500)
        
        url = "/v1/document/quotation-product/quotation_products/detail"
        data = {"id": qp.id}
        response = self.client.post(url, data, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 200)  # OK
        self.assertEqual(response.json()["id"], qp.id)

    def test_update_quotation_product(self):
        """
        견적서 품목 정보 수정 테스트
        """
        # 테스트 데이터 생성
        qp = QuotationProduct.objects.create(quotation=self.quotation, product=self.product, quantity=5, unit_price=500)
        
        url = "/v1/document/quotation-product/quotation_products/update"
        data = {"id": qp.id, "quantity": 20, "unit_price": 2000}
        response = self.client.patch(url, data, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 200)  # OK
        self.assertEqual(response.json()["quantity"], 20)
        self.assertEqual(response.json()["unit_price"], 2000)

    def test_update_quotation_product_delivery(self):
        """
        견적서 품목 납품 정보 수정 테스트
        """
        # 테스트 데이터 생성
        qp = QuotationProduct.objects.create(quotation=self.quotation, product=self.product, quantity=5, unit_price=500)
        
        url = "/v1/document/quotation-product/quotation_products/update-delivery"
        data = {"id": qp.id, "is_delivery": True, "delivery_date": "2024-06-01"}
        response = self.client.patch(url, data, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 200)  # OK
        self.assertEqual(response.json()["is_delivery"], True)
        self.assertEqual(response.json()["delivery_date"], "2024-06-01") 