import pytest
from django.test import TestCase, Client
from user.models import User
from factory.models import Factory, FactoryClient
from stock.models import Product
from document.models import Quotation, QuotationProduct
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class QuotationProductAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass')
        self.factory = Factory.objects.create(owner=self.user, name='공장')
        self.client_obj = FactoryClient.objects.create(factory=self.factory, name='거래처')
        self.product1 = Product.objects.create(factory=self.factory, name='제품1', code='P1', unit='EA', current_stock=10)
        self.product2 = Product.objects.create(factory=self.factory, name='제품2', code='P2', unit='EA', current_stock=20)
        self.product3 = Product.objects.create(factory=self.factory, name='제품3', code='P3', unit='EA', current_stock=30)
        from project.models import Project
        self.project = Project.objects.create()
        self.quotation = Quotation.objects.create(factory=self.factory, client=self.client_obj, project=self.project)
        self.client = Client()
        self.token = self.generate_jwt_token()

    def generate_jwt_token(self):
        payload = {
            'user_id': self.user.id,
            'exp': timezone.now() + timedelta(hours=1)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    def get_payload(self, products):
        return {
            "quotation_id": self.quotation.id,
            "client": {
                "name": "거래처"
            },
            "due_date": "2025-07-31",
            "products": products,
            "action": "save"
        }

    def test_create_update_delete_quotation_products(self):
        url = "/v1/document/quotation/product"
        # 1. 여러 품목 생성
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "규격1",
                "unit": self.product1.unit,
                "quantity": 5,
                "unit_price": 1000,
                "amount": 5000
            },
            {
                "id": self.product2.id,
                "name": self.product2.name,
                "code": self.product2.code,
                "spec": "규격2",
                "unit": self.product2.unit,
                "quantity": 10,
                "unit_price": 2000,
                "amount": 20000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 2)

        # 2. 일부 품목 수정 + 새로운 품목 추가
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "규격1",
                "unit": self.product1.unit,
                "quantity": 7,
                "unit_price": 1500,
                "amount": 10500
            },
            {
                "id": self.product3.id,
                "name": self.product3.name,
                "code": self.product3.code,
                "spec": "규격3",
                "unit": self.product3.unit,
                "quantity": 3,
                "unit_price": 3000,
                "amount": 9000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        qps = QuotationProduct.objects.filter(quotation=self.quotation)
        self.assertEqual(qps.count(), 2)
        # product1 수정 확인
        qp1 = qps.get(product=self.product1)
        self.assertEqual(qp1.quantity, 7)
        self.assertEqual(qp1.unit_price, 1500)
        # product3 추가 확인
        qp3 = qps.get(product=self.product3)
        self.assertEqual(qp3.quantity, 3)
        self.assertEqual(qp3.unit_price, 3000)
        # product2 삭제 확인
        self.assertFalse(qps.filter(product=self.product2).exists())

        # 3. 전체 삭제
        payload = self.get_payload([])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 0)

    def test_create_single_product(self):
        """단일 품목 생성 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "단일 품목 규격",
                "unit": self.product1.unit,
                "quantity": 1,
                "unit_price": 5000,
                "amount": 5000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 1)

    def test_update_only_quantity(self):
        """수량만 수정하는 테스트"""
        # 먼저 품목 생성
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "규격1",
                "unit": self.product1.unit,
                "quantity": 5,
                "unit_price": 1000,
                "amount": 5000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)

        # 수량만 수정
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "규격1",
                "unit": self.product1.unit,
                "quantity": 10,  # 수량만 변경
                "unit_price": 1000,
                "amount": 10000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 10)
        self.assertEqual(qp.unit_price, 1000)  # 기존 값 유지

    def test_partial_product_data(self):
        """일부 필드만 포함한 품목 데이터 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "quantity": 3,
                "unit_price": 2000
                # name, code, spec, unit, amount는 생략
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 1)

    def test_multiple_products_with_delivery_info(self):
        """배송 정보가 포함된 여러 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "규격1",
                "unit": self.product1.unit,
                "quantity": 5,
                "unit_price": 1000,
                "amount": 5000,
                "is_delivery": True,
                "delivery_date": "2025-07-15"
            },
            {
                "id": self.product2.id,
                "name": self.product2.name,
                "code": self.product2.code,
                "spec": "규격2",
                "unit": self.product2.unit,
                "quantity": 3,
                "unit_price": 2000,
                "amount": 6000,
                "is_delivery": False,
                "delivery_date": None
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qps = QuotationProduct.objects.filter(quotation=self.quotation)
        self.assertEqual(qps.count(), 2)
        
        # 배송 정보 확인
        qp1 = qps.get(product=self.product1)
        self.assertTrue(qp1.is_delivery)
        self.assertEqual(str(qp1.delivery_date), "2025-07-15")
        
        qp2 = qps.get(product=self.product2)
        self.assertFalse(qp2.is_delivery)
        self.assertIsNone(qp2.delivery_date)

    def test_empty_products_list(self):
        """빈 품목 리스트로 시작하는 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 0)

    def test_add_product_to_empty_quotation(self):
        """빈 견적서에 품목 추가 테스트"""
        url = "/v1/document/quotation/product"
        
        # 빈 상태로 시작
        payload = self.get_payload([])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 0)
        
        # 품목 추가
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "새로 추가된 품목",
                "unit": self.product1.unit,
                "quantity": 2,
                "unit_price": 1500,
                "amount": 3000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 1)

    def test_minimal_client_data(self):
        """최소한의 클라이언트 데이터로 테스트"""
        url = "/v1/document/quotation/product"
        payload = {
            "quotation_id": self.quotation.id,
            "client": {
                "name": "최소 데이터 거래처"
                # 다른 필드들은 모두 생략
            },
            "products": [
                {
                    "id": self.product1.id,
                    "quantity": 1,
                    "unit_price": 1000
                }
            ]
        }
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)

    def test_zero_quantity_product(self):
        """수량이 0인 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "수량 0 품목",
                "unit": self.product1.unit,
                "quantity": 0,
                "unit_price": 1000,
                "amount": 0
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 0)
        self.assertEqual(qp.unit_price, 1000)

    def test_high_value_products(self):
        """고가 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "고가 품목",
                "unit": self.product1.unit,
                "quantity": 1,
                "unit_price": 1000000,  # 100만원
                "amount": 1000000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.unit_price, 1000000) 

    def test_invalid_type_input(self):
        """unit_price에 문자열 등 잘못된 타입 입력 시 422 반환"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {"id": self.product1.id, "quantity": 1, "unit_price": "천원"}
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 422)

    def test_bulk_product_operations(self):
        """대량 품목 작업 테스트"""
        url = "/v1/document/quotation/product"
        
        # 대량 품목 생성 (10개)
        products = []
        for i in range(10):
            products.append({
                "id": self.product1.id,
                "name": f"대량품목{i+1}",
                "code": f"BULK{i+1}",
                "spec": f"대량규격{i+1}",
                "unit": "EA",
                "quantity": i + 1,
                "unit_price": 1000 + (i * 100),
                "amount": (i + 1) * (1000 + (i * 100))
            })
        
        payload = self.get_payload(products)
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 10)

    def test_product_with_special_characters(self):
        """특수문자가 포함된 품목명 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "특수문자 품목!@#$%^&*()",
                "code": "SPECIAL-001",
                "spec": "규격(특수문자)",
                "unit": self.product1.unit,
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        # name은 모델에 없으므로 product를 통해 확인
        self.assertEqual(qp.product.name, self.product1.name)

    def test_product_with_long_text(self):
        """긴 텍스트가 포함된 품목 테스트"""
        url = "/v1/document/quotation/product"
        long_spec = "매우 긴 규격 설명입니다. " * 10  # 200자 이상
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": long_spec,
                "unit": self.product1.unit,
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        # spec은 모델에 없으므로 quantity와 unit_price만 확인
        self.assertEqual(qp.quantity, 1)
        self.assertEqual(qp.unit_price, 1000)

    def test_product_price_calculation(self):
        """품목 가격 계산 정확성 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "가격계산테스트",
                "unit": self.product1.unit,
                "quantity": 7,
                "unit_price": 1250,
                "amount": 8750  # 7 * 1250
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 7)
        self.assertEqual(qp.unit_price, 1250)
        # amount는 모델에 없으므로 계산으로 검증
        self.assertEqual(qp.quantity * qp.unit_price, 8750)

    def test_product_update_with_same_data(self):
        """동일한 데이터로 업데이트하는 테스트"""
        url = "/v1/document/quotation/product"
        
        # 첫 번째 생성
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "동일데이터테스트",
                "unit": self.product1.unit,
                "quantity": 5,
                "unit_price": 1000,
                "amount": 5000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        # 동일한 데이터로 다시 업데이트
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 5)
        self.assertEqual(qp.unit_price, 1000)

    def test_product_with_different_units(self):
        """다양한 단위를 가진 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "KG 단위 품목",
                "code": "KG-001",
                "spec": "무게 단위",
                "unit": "KG",
                "quantity": 10,
                "unit_price": 500,
                "amount": 5000
            },
            {
                "id": self.product2.id,
                "name": "M 단위 품목",
                "code": "M-001",
                "spec": "길이 단위",
                "unit": "M",
                "quantity": 25,
                "unit_price": 200,
                "amount": 5000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qps = QuotationProduct.objects.filter(quotation=self.quotation)
        self.assertEqual(qps.count(), 2)
        
        kg_product = qps.get(product=self.product1)
        self.assertEqual(kg_product.quantity, 10)
        self.assertEqual(kg_product.unit_price, 500)
        
        m_product = qps.get(product=self.product2)
        self.assertEqual(m_product.quantity, 25)
        self.assertEqual(m_product.unit_price, 200)

    def test_product_sequential_operations(self):
        """순차적인 품목 작업 테스트"""
        url = "/v1/document/quotation/product"
        
        # 1단계: 첫 번째 품목 추가
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "순차테스트1",
                "code": "SEQ-001",
                "spec": "1단계",
                "unit": "EA",
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 1)
        
        # 2단계: 두 번째 품목 추가
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "순차테스트1",
                "code": "SEQ-001",
                "spec": "1단계",
                "unit": "EA",
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000
            },
            {
                "id": self.product2.id,
                "name": "순차테스트2",
                "code": "SEQ-002",
                "spec": "2단계",
                "unit": "EA",
                "quantity": 2,
                "unit_price": 2000,
                "amount": 4000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(QuotationProduct.objects.filter(quotation=self.quotation).count(), 2)
        
        # 3단계: 첫 번째 품목 수정
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "순차테스트1-수정",
                "code": "SEQ-001",
                "spec": "1단계-수정",
                "unit": "EA",
                "quantity": 3,
                "unit_price": 1500,
                "amount": 4500
            },
            {
                "id": self.product2.id,
                "name": "순차테스트2",
                "code": "SEQ-002",
                "spec": "2단계",
                "unit": "EA",
                "quantity": 2,
                "unit_price": 2000,
                "amount": 4000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp1 = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp1.quantity, 3)
        self.assertEqual(qp1.unit_price, 1500)

    def test_product_with_none_values(self):
        """None 값이 포함된 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": None,
                "code": None,
                "spec": None,
                "unit": None,
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 1)
        self.assertEqual(qp.unit_price, 1000)

    def test_product_with_empty_strings(self):
        """빈 문자열이 포함된 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "",
                "code": "",
                "spec": "",
                "unit": "",
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 1)
        self.assertEqual(qp.unit_price, 1000)

    def test_product_with_negative_values(self):
        """음수 값이 포함된 품목 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": self.product1.name,
                "code": self.product1.code,
                "spec": "음수테스트",
                "unit": self.product1.unit,
                "quantity": -5,
                "unit_price": -1000,
                "amount": 5000
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, -5)
        self.assertEqual(qp.unit_price, -1000)

    def test_product_with_decimal_quantities(self):
        """소수점이 있는 수량 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "소수점테스트",
                "code": "DEC-001",
                "spec": "소수점 수량",
                "unit": "KG",
                "quantity": 3.75,
                "unit_price": 1000,
                "amount": 3750
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        # quantity는 IntegerField이므로 소수점이 422 에러를 반환할 것으로 예상
        self.assertEqual(response.status_code, 422)

    def test_product_with_large_numbers(self):
        """큰 숫자 값 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "큰숫자테스트",
                "code": "LARGE-001",
                "spec": "큰 숫자",
                "unit": "EA",
                "quantity": 999999,
                "unit_price": 999999,
                "amount": 999999 * 999999
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qp = QuotationProduct.objects.get(quotation=self.quotation, product=self.product1)
        self.assertEqual(qp.quantity, 999999)
        self.assertEqual(qp.unit_price, 999999)

    def test_product_with_mixed_data_types(self):
        """혼합 데이터 타입 테스트"""
        url = "/v1/document/quotation/product"
        payload = self.get_payload([
            {
                "id": self.product1.id,
                "name": "혼합타입1",
                "code": "MIX-001",
                "spec": "혼합 데이터",
                "unit": "EA",
                "quantity": 1,
                "unit_price": 1000,
                "amount": 1000,
                "is_delivery": True,
                "delivery_date": "2025-07-15"
            },
            {
                "id": self.product2.id,
                "quantity": 2,
                "unit_price": 2000
                # 최소한의 데이터만 포함
            }
        ])
        response = self.client.post(url, payload, content_type="application/json", HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.assertEqual(response.status_code, 200)
        
        qps = QuotationProduct.objects.filter(quotation=self.quotation)
        self.assertEqual(qps.count(), 2)
        
        # 첫 번째 품목 (완전한 데이터)
        qp1 = qps.get(product=self.product1)
        self.assertTrue(qp1.is_delivery)
        self.assertEqual(qp1.quantity, 1)
        self.assertEqual(qp1.unit_price, 1000)
        
        # 두 번째 품목 (최소 데이터)
        qp2 = qps.get(product=self.product2)
        self.assertEqual(qp2.quantity, 2)
        self.assertEqual(qp2.unit_price, 2000) 

    def test_list_history_quotation_product_single_product(self):
        """단일 제품의 견적서 품목 히스토리 조회 테스트"""
        # 테스트 데이터 생성
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=50,
            unit_price=1800
        )
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=40,
            unit_price=2400
        )
        
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": str(self.product1.id)},
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 2)
        
        # 첫 번째 결과 확인 (최신순)
        first_result = data["results"][0]
        self.assertEqual(first_result["product_name"], "제품1")
        self.assertEqual(first_result["quantity"], 40)
        self.assertEqual(first_result["unit_price"], 2400)
        self.assertEqual(first_result["total_amount"], 96000)

    def test_list_history_quotation_product_multiple_products(self):
        """여러 제품의 견적서 품목 히스토리 조회 테스트"""
        # 테스트 데이터 생성
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=50,
            unit_price=1800
        )
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product2,
            quantity=20,
            unit_price=5000
        )
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product3,
            quantity=100,
            unit_price=800
        )
        
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": f"{self.product1.id},{self.product2.id},{self.product3.id}"},
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 3)
        
        # 모든 제품이 포함되었는지 확인
        product_names = [result["product_name"] for result in data["results"]]
        self.assertIn("제품1", product_names)
        self.assertIn("제품2", product_names)
        self.assertIn("제품3", product_names)

    def test_list_history_quotation_product_empty_product_ids(self):
        """빈 product_ids로 요청 시 에러 테스트"""
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": ""},
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("product_ids를 입력해야 합니다", str(data))

    def test_list_history_quotation_product_no_product_ids(self):
        """product_ids 파라미터 없이 요청 시 에러 테스트"""
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)  # Bad request

    def test_list_history_quotation_product_no_history(self):
        """히스토리가 없는 제품 조회 시 에러 테스트"""
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": "999"},  # 존재하지 않는 제품 ID
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 500)  # Internal server error
        data = response.json()
        self.assertIn("해당 제품의 견적 내역이 없습니다", str(data))

    def test_list_history_quotation_product_mixed_products(self):
        """일부 제품만 히스토리가 있는 경우 테스트"""
        # product1만 히스토리 생성
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=30,
            unit_price=1500
        )
        
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": f"{self.product1.id},{self.product2.id}"},  # product2는 히스토리 없음
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)  # product1만 결과에 포함
        self.assertEqual(data["results"][0]["product_name"], "제품1")

    def test_list_history_quotation_product_total_amount_calculation(self):
        """total_amount 계산 정확성 테스트"""
        QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=25,
            unit_price=2000
        )
        
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": str(self.product1.id)},
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        result = data["results"][0]
        
        # total_amount 계산 확인
        expected_total = 25 * 2000
        self.assertEqual(result["total_amount"], expected_total)
        self.assertEqual(result["quantity"] * result["unit_price"], expected_total)

    def test_list_history_quotation_product_ordering(self):
        """생성일 기준 내림차순 정렬 테스트"""
        # 오래된 데이터
        old_qp = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=10,
            unit_price=1000
        )
        
        # 최신 데이터
        new_qp = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product1,
            quantity=20,
            unit_price=2000
        )
        
        url = "/v1/document/quotation/product/history/list"
        response = self.client.get(
            url, 
            {"product_ids": str(self.product1.id)},
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        results = data["results"]
        
        # 최신 데이터가 먼저 나와야 함
        self.assertEqual(results[0]["quantity"], 20)
        self.assertEqual(results[0]["unit_price"], 2000)
        self.assertEqual(results[1]["quantity"], 10)
        self.assertEqual(results[1]["unit_price"], 1000) 