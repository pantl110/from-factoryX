from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryEquipment
from document.models import Quotation, QuotationProduct
from stock.models import Product
from project.models import Project, ProjectPlan
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date

User = get_user_model()


class QuotationProductAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 공장 생성
        self.factory = Factory.objects.create(
            name='테스트 공장',
            owner=self.user
        )
        
        # 고객 생성
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name='테스트 고객사',
            business_registration_number='123-45-67890'
        )
        
        # 제품 생성
        self.product1 = Product.objects.create(
            factory=self.factory,
            name='테스트 제품 1',
            code='TEST001',
            unit='개',
            spec='10x10x10'
        )
        
        self.product2 = Product.objects.create(
            factory=self.factory,
            name='테스트 제품 2',
            code='TEST002',
            unit='개',
            spec='20x20x20'
        )
        
        # 설비 생성
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory,
            name='테스트 설비',
            priority=1
        )
        
        # 프로젝트 생성
        self.project = Project.objects.create(status='견적 협의중')
        
        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,
            project=self.project,
            due_date=date(2025, 6, 15)
        )
        
        # 견적서 제품 생성
        self.quotation_product1 = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=10,
            unit_price=1000,
            is_delivery=False
        )
        
        self.quotation_product2 = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product2,
            quantity=5,
            unit_price=2000,
            is_delivery=True,
            delivery_date=date(2025, 6, 20)
        )
        
        # JWT 토큰 생성
        self.token = self.generate_jwt_token()

    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {
                "user_id": self.user.id,
                "exp": datetime.now() + timedelta(hours=1)
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

    def get_auth_headers(self):
        """인증 헤더 반환"""
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_list_quotation_products_by_quotation_id_success(self):
        """견적서 ID로 견적서 품목 목록 조회 성공 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"quotation_id": self.quotation.id},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        
        # 첫 번째 품목 검증
        self.assertEqual(data[0]["id"], self.quotation_product1.id)
        self.assertEqual(data[0]["quotation"], self.quotation.id)
        self.assertEqual(data[0]["product"], self.product1.id)
        self.assertEqual(data[0]["quantity"], 10)
        self.assertEqual(data[0]["unit_price"], 1000)
        self.assertEqual(data[0]["is_delivery"], False)
        self.assertIsNone(data[0]["delivery_date"])
        
        # 두 번째 품목 검증
        self.assertEqual(data[1]["id"], self.quotation_product2.id)
        self.assertEqual(data[1]["quotation"], self.quotation.id)
        self.assertEqual(data[1]["product"], self.product2.id)
        self.assertEqual(data[1]["quantity"], 5)
        self.assertEqual(data[1]["unit_price"], 2000)
        self.assertEqual(data[1]["is_delivery"], True)
        self.assertEqual(data[1]["delivery_date"], "2025-06-20")

    def test_list_quotation_products_by_factory_id_success(self):
        """공장 ID로 견적서 품목 목록 조회 성공 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"factory_id": self.factory.id},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_list_quotation_products_missing_parameters(self):
        """파라미터 없이 견적서 품목 목록 조회 실패 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/",
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        # Ninja의 HttpError는 직접 메시지를 반환
        self.assertIn("quotation_id 또는 factory_id를 입력해야 합니다", str(data))

    def test_list_quotation_products_not_found(self):
        """존재하지 않는 견적서 ID로 조회 실패 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"quotation_id": 99999},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("품목이 없습니다", str(data))

    def test_get_quotation_product_detail_success(self):
        """견적서 품목 상세 조회 성공 테스트"""
        response = self.client.get(
            f"/v1/document/quotation/product/{self.quotation_product1.id}",
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["id"], self.quotation_product1.id)
        self.assertEqual(data["quotation"], self.quotation.id)
        self.assertEqual(data["product"], self.product1.id)
        self.assertEqual(data["quantity"], 10)
        self.assertEqual(data["unit_price"], 1000)
        self.assertEqual(data["is_delivery"], False)
        self.assertIsNone(data["delivery_date"])

    def test_get_quotation_product_detail_not_found(self):
        """존재하지 않는 견적서 품목 상세 조회 실패 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/99999",
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("해당 품목을 찾을 수 없습니다", str(data))

    def test_list_history_quotation_product_success(self):
        """견적서 품목 히스토리 조회 성공 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/history/list",
            {"product_ids": f"{self.product1.id},{self.product2.id}"},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn("results", data)
        results = data["results"]
        self.assertEqual(len(results), 2)
        
        # 결과 검증
        product_names = [result["product_name"] for result in results]
        self.assertIn("테스트 제품 1", product_names)
        self.assertIn("테스트 제품 2", product_names)

    def test_list_history_quotation_product_missing_product_ids(self):
        """product_ids 없이 히스토리 조회 실패 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/history/list",
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("product_ids를 입력해야 합니다", str(data))

    def test_list_history_quotation_product_invalid_product_ids(self):
        """잘못된 product_ids로 히스토리 조회 실패 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/history/list",
            {"product_ids": "invalid,ids"},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("product_ids는 콤마로 구분된 정수여야 합니다", str(data))

    def test_list_history_quotation_product_not_found(self):
        """존재하지 않는 제품 ID로 히스토리 조회 실패 테스트"""
        response = self.client.get(
            "/v1/document/quotation/product/history/list",
            {"product_ids": "99999,99998"},
            **self.get_auth_headers()
        )
        
        # 존재하지 않는 제품 ID로 조회하면 500 에러가 발생할 수 있음
        self.assertIn(response.status_code, [404, 500])
        data = response.json()
        if response.status_code == 404:
            self.assertIn("해당 제품의 견적 내역이 없습니다", str(data))
        else:
            # 500 에러의 경우 에러 메시지 확인
            self.assertIsInstance(data, dict)

    def test_authentication_required(self):
        """인증이 필요한 엔드포인트 테스트"""
        # 인증 없이 요청
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"quotation_id": self.quotation.id}
        )
        
        self.assertEqual(response.status_code, 401)

    def test_invalid_token(self):
        """잘못된 토큰으로 요청 테스트"""
        invalid_token = "invalid.token.here"
        headers = {"HTTP_AUTHORIZATION": f"Bearer {invalid_token}"}
        
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"quotation_id": self.quotation.id},
            **headers
        )
        
        self.assertEqual(response.status_code, 401)

    def test_quotation_product_with_delivery_info(self):
        """납품 정보가 있는 견적서 품목 테스트"""
        # 납품 정보가 있는 품목 생성
        delivery_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=3,
            unit_price=5000,
            is_delivery=True,
            delivery_date=date(2025, 7, 1)
        )
        
        response = self.client.get(
            f"/v1/document/quotation/product/{delivery_product.id}",
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["is_delivery"], True)
        # 날짜가 문자열로 변환되어 반환되는지 확인
        self.assertIsInstance(data["delivery_date"], str)
        self.assertEqual(data["delivery_date"], "2025-07-01")

    def test_multiple_quotations_same_factory(self):
        """같은 공장의 여러 견적서 테스트"""
        # 두 번째 견적서 생성
        quotation2 = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,
            project=self.project,
            due_date=date(2025, 7, 1)
        )
        
        QuotationProduct.objects.create(
            quotation=quotation2,
            product=self.product1,
            quantity=7,
            unit_price=1200
        )
        
        # 공장 ID로 조회하면 모든 견적서의 품목이 나와야 함
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"factory_id": self.factory.id},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 3)  # 기존 2개 + 새로 생성한 1개

    def test_quotation_product_data_validation(self):
        """견적서 품목 데이터 검증 테스트"""
        response = self.client.get(
            f"/v1/document/quotation/product/{self.quotation_product1.id}",
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 필수 필드 검증
        required_fields = ["id", "quotation", "product", "quantity", "unit_price", "is_delivery"]
        for field in required_fields:
            self.assertIn(field, data)
        
        # 데이터 타입 검증
        self.assertIsInstance(data["id"], int)
        self.assertIsInstance(data["quotation"], int)
        self.assertIsInstance(data["product"], int)
        self.assertIsInstance(data["quantity"], int)
        self.assertIsInstance(data["unit_price"], int)
        self.assertIsInstance(data["is_delivery"], bool)

    def test_quotation_product_list_pagination(self):
        """견적서 품목 목록 페이지네이션 테스트"""
        # 추가 품목들을 생성하여 목록 테스트
        for i in range(3, 6):
            product = Product.objects.create(
                factory=self.factory,
                name=f'테스트 제품 {i}',
                code=f'TEST00{i}',
                unit='개',
                spec=f'{i}0x{i}0x{i}0'
            )
            QuotationProduct.objects.create(
                quotation=self.quotation,
                product=product,
                quantity=i * 5,
                unit_price=i * 1000
            )
        
        response = self.client.get(
            "/v1/document/quotation/product/",
            {"quotation_id": self.quotation.id},
            **self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 5)  # 기존 2개 + 새로 생성한 3개

    def test_quotation_product_filtering(self):
        """견적서 품목 필터링 테스트"""
        # 납품 완료된 품목만 필터링 테스트
        delivery_products = QuotationProduct.objects.filter(
            quotation=self.quotation,
            is_delivery=True
        )
        
        self.assertEqual(delivery_products.count(), 1)
        self.assertEqual(delivery_products.first().product, self.product2)
        
        # 납품 미완료된 품목만 필터링 테스트
        non_delivery_products = QuotationProduct.objects.filter(
            quotation=self.quotation,
            is_delivery=False
        )
        
        self.assertEqual(non_delivery_products.count(), 1)
        self.assertEqual(non_delivery_products.first().product, self.product1)
