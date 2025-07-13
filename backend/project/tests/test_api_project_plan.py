from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryEquipment
from project.models import Project
from document.models import Quotation, QuotationProduct
from stock.models import Product
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date

User = get_user_model()


class ProjectPlanAPITestCase(TestCase):
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
        
        # 설비 생성
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory,
            name='테스트 설비',
            priority=1
        )
        
        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name='테스트 제품',
            code='TEST001',
            unit='개',
            spec='테스트 규격'
        )
        
        # 프로젝트 생성
        self.project = Project.objects.create()
        
        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,
            project=self.project
        )
        
        # 견적서 품목 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product,
            quantity=10,
            unit_price=1000
        )
        
        # JWT 토큰 생성
        self.token = self.generate_jwt_token()
        
        # API 클라이언트 설정
        self.client = self.client

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

    def test_create_project_plans_success(self):
        """프로젝트 생산 계획 생성 성공 테스트"""
        url = '/v1/project/plan'
        
        payload = {
            'project_id': self.project.id,
            'quotation_product_ids': [self.quotation_product.id],
            'production_quantities': [8],  # 주문 수량(10)보다 적은 생산 수량
            'equipment_ids': [self.equipment.id],
            'start_dates': ['2025-07-13'],
            'end_dates': ['2025-07-14'],
            'avg_production_times': [3600]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        # 응답 내용 출력
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.content}")
        print(f"Response headers: {dict(response.headers)}")
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('message', data)
        self.assertIn('created_plans', data)
        # 생산 수량(8)과 주문 수량(10)이 다르므로 2개의 계획이 생성되어야 함
        self.assertEqual(len(data['created_plans']), 2)
        
        # 첫 번째 계획 확인 (생산 수량)
        plan1_data = data['created_plans'][0]
        self.assertEqual(plan1_data['project_id'], self.project.id)
        self.assertEqual(plan1_data['quotation_product_id'], self.quotation_product.id)
        self.assertEqual(plan1_data['equipment_id'], self.equipment.id)
        self.assertEqual(plan1_data['quantity'], 8)  # 생산 수량
        
        # 두 번째 계획 확인 (남은 수량)
        plan2_data = data['created_plans'][1]
        self.assertEqual(plan2_data['project_id'], self.project.id)
        self.assertEqual(plan2_data['quotation_product_id'], self.quotation_product.id)
        self.assertEqual(plan2_data['equipment_id'], self.equipment.id)
        self.assertEqual(plan2_data['quantity'], 2)  # 남은 수량 (10 - 8)

    def test_create_project_plans_nonexistent_project(self):
        """존재하지 않는 프로젝트로 생산 계획 생성 시도 테스트"""
        url = '/v1/project/plan'
        
        payload = {
            'project_id': 999,
            'quotation_product_ids': [self.quotation_product.id],
            'production_quantities': [10],
            'equipment_ids': [self.equipment.id],
            'start_dates': ['2025-07-13'],
            'end_dates': ['2025-07-14'],
            'avg_production_times': [3600]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_create_project_plans_nonexistent_quotation_product(self):
        """존재하지 않는 견적서 품목으로 생산 계획 생성 시도 테스트"""
        url = '/v1/project/plan'
        
        payload = {
            'project_id': self.project.id,
            'quotation_product_ids': [999],
            'production_quantities': [10],
            'equipment_ids': [self.equipment.id],
            'start_dates': ['2025-07-13'],
            'end_dates': ['2025-07-14'],
            'avg_production_times': [3600]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_create_project_plans_without_auth(self):
        """인증 없이 생산 계획 생성 시도 테스트"""
        url = '/v1/project/plan'
        
        payload = {
            'project_id': self.project.id,
            'quotation_product_ids': [self.quotation_product.id],
            'production_quantities': [10],
            'equipment_ids': [self.equipment.id],
            'start_dates': ['2025-07-13'],
            'end_dates': ['2025-07-14'],
            'avg_production_times': [3600]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [401, 403])

    def test_list_project_plans_success(self):
        """프로젝트 생산 계획 조회 성공 테스트"""
        # 먼저 생산 계획 생성
        create_url = '/v1/project/plan'
        create_payload = {
            'project_id': self.project.id,
            'quotation_product_ids': [self.quotation_product.id],
            'production_quantities': [8],
            'equipment_ids': [self.equipment.id],
            'start_dates': ['2025-07-13'],
            'end_dates': ['2025-07-14'],
            'avg_production_times': [3600]
        }
        
        self.client.post(
            create_url,
            data=json.dumps(create_payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        # 생산 계획 조회
        list_url = f'/v1/project/plan?project_id={self.project.id}'
        
        response = self.client.get(
            list_url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)  # 생산 수량(8)과 주문 수량(10)이 다르므로 2개
        
        # 첫 번째 계획 확인
        plan1 = data[0]
        self.assertEqual(plan1['project_id'], self.project.id)
        self.assertEqual(plan1['quotation_product_id'], self.quotation_product.id)
        self.assertEqual(plan1['equipment_id'], self.equipment.id)
        self.assertEqual(plan1['quantity'], 8)
        
        # 두 번째 계획 확인
        plan2 = data[1]
        self.assertEqual(plan2['project_id'], self.project.id)
        self.assertEqual(plan2['quotation_product_id'], self.quotation_product.id)
        self.assertEqual(plan2['equipment_id'], self.equipment.id)
        self.assertEqual(plan2['quantity'], 2)

    def test_list_project_plans_nonexistent_project(self):
        """존재하지 않는 프로젝트로 생산 계획 조회 시도 테스트"""
        url = '/v1/project/plan?project_id=999'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_project_plans_no_plans(self):
        """생산 계획이 없는 프로젝트 조회 시도 테스트"""
        url = f'/v1/project/plan?project_id={self.project.id}'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_project_plans_without_auth(self):
        """인증 없이 생산 계획 조회 시도 테스트"""
        url = f'/v1/project/plan?project_id={self.project.id}'
        
        response = self.client.get(url)
        
        self.assertIn(response.status_code, [401, 403]) 