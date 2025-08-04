from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient
from project.models import Project, ProjectLog, Refund
from stock.models import Product
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta

User = get_user_model()


class ProjectRefundAPITestCase(TestCase):
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
        
        # 프로젝트 생성
        self.project = Project.objects.create()
        
        # FactoryMember 생성
        from factory.models import FactoryMember
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        
        # 견적서 생성 (프로젝트를 공장과 연결)
        from document.models import Quotation
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,
            project=self.project
        )
        
        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name='테스트 제품',
            code='TEST001',
            unit='개',
            spec='테스트 규격'
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

    def test_create_refund_success(self):
        """반품 생성 성공 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': self.product.id,
            'refund_date': '2024-01-15',
            'production_amount': 5
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('message', data)
        self.assertIn('refund_id', data)
        self.assertIn('log_id', data)
        self.assertEqual(data['message'], '반품이 성공적으로 생성되었습니다.')
        
        # 데이터베이스에 반품이 생성되었는지 확인
        refund = Refund.objects.get(id=data['refund_id'])
        self.assertEqual(refund.project_log.project.id, self.project.id)
        self.assertEqual(refund.product.id, self.product.id)
        self.assertEqual(refund.amount, 5)  # product.current_stock(0) + production_amount(5)
        self.assertEqual(refund.current_stock, 0)
        self.assertEqual(refund.production_amount, 5)
        self.assertEqual(refund.refund_date, datetime.strptime('2024-01-15', '%Y-%m-%d').date())
        
        # 프로젝트 로그도 생성되었는지 확인
        log = ProjectLog.objects.get(id=data['log_id'])
        self.assertEqual(log.project.id, self.project.id)
        self.assertEqual(log.type, '반품')
        self.assertEqual(log.title, '반품 접수 현황')
        self.assertEqual(log.content, f'{self.product.name} 5개가 반품되었어요.')

    def test_create_refund_nonexistent_project(self):
        """존재하지 않는 프로젝트로 반품 생성 시도 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': 999,
            'product_id': self.product.id,
            'refund_date': '2024-01-15',
            'production_amount': 5
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('해당 프로젝트를 찾을 수 없습니다', response.json().get('detail', ''))

    def test_create_refund_nonexistent_product(self):
        """존재하지 않는 제품으로 반품 생성 시도 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': 999,
            'refund_date': '2024-01-15',
            'production_amount': 5
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('해당 제품을 찾을 수 없습니다', response.json().get('detail', ''))

    def test_create_refund_zero_amount(self):
        """반품 수량이 0인 경우 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': self.product.id,
            'refund_date': '2024-01-15',
            'production_amount': 0
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('반품 수량은 0보다 커야 합니다', response.json().get('detail', ''))

    def test_create_refund_negative_amount(self):
        """반품 수량이 음수인 경우 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': self.product.id,
            'refund_date': '2024-01-15',
            'production_amount': -5
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('반품 수량은 0보다 커야 합니다', response.json().get('detail', ''))

    def test_create_refund_invalid_date_format(self):
        """올바르지 않은 날짜 형식 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': self.product.id,
            'refund_date': '2024/01/15',  # 잘못된 형식
            'production_amount': 5
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('올바르지 않은 날짜 형식입니다', response.json().get('detail', ''))

    def test_create_refund_without_auth(self):
        """인증 없이 반품 생성 시도 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': self.product.id,
            'refund_date': '2024-01-15',
            'production_amount': 5
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [401, 403])

    def test_update_refund_success(self):
        """반품 수정 성공 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # 반품 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'refund_date': '2024-01-20',
            'production_amount': 8
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('message', data)
        self.assertIn('refund_id', data)
        self.assertEqual(data['message'], '반품이 성공적으로 수정되었습니다.')
        
        # 데이터베이스에 반품이 수정되었는지 확인
        refund.refresh_from_db()
        self.assertEqual(refund.amount, 18)  # current_stock(10) + production_amount(8)
        self.assertEqual(refund.current_stock, 10)
        self.assertEqual(refund.production_amount, 8)
        self.assertEqual(refund.refund_date, datetime.strptime('2024-01-20', '%Y-%m-%d').date())
        
        # 프로젝트 로그 내용도 업데이트되었는지 확인
        log.refresh_from_db()
        self.assertEqual(log.content, f'{self.product.name} 18개가 반품되었어요.')

    def test_update_refund_partial_fields(self):
        """일부 필드만 수정하는 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # 날짜만 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'refund_date': '2024-01-25'
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 데이터베이스 확인
        refund.refresh_from_db()
        self.assertEqual(refund.amount, 15)  # 변경되지 않음
        self.assertEqual(refund.current_stock, 10)  # 변경되지 않음
        self.assertEqual(refund.production_amount, 5)  # 변경되지 않음
        self.assertEqual(refund.refund_date, datetime.strptime('2024-01-25', '%Y-%m-%d').date())

    def test_update_refund_nonexistent(self):
        """존재하지 않는 반품 수정 시도 테스트"""
        url = '/v1/project/refund/999'
        
        payload = {
            'refund_date': '2024-01-20',
            'production_amount': 8
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('해당 반품을 찾을 수 없습니다', response.json().get('detail', ''))

    def test_update_refund_invalid_date_format(self):
        """올바르지 않은 날짜 형식으로 수정 시도 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # 잘못된 날짜 형식으로 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'refund_date': '2024/01/20'  # 잘못된 형식
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('올바르지 않은 날짜 형식입니다', response.json().get('detail', ''))

    def test_update_refund_zero_amount(self):
        """수정 후 반품 수량이 0이 되는 경우 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # 반품 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'production_amount': -10
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('반품 수량은 0보다 커야 합니다', response.json().get('detail', ''))

    def test_update_refund_negative_amount(self):
        """수정 후 반품 수량이 음수가 되는 경우 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # 반품 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'production_amount': -20
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('반품 수량은 0보다 커야 합니다', response.json().get('detail', ''))

    def test_update_refund_without_auth(self):
        """인증 없이 반품 수정 시도 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # 인증 없이 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'refund_date': '2024-01-20',
            'production_amount': 8
        }
        
        response = self.client.patch(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [401, 403])

    def test_create_refund_with_production_amount_null(self):
        """production_amount가 null인 경우 반품 생성 테스트"""
        url = '/v1/project/refund'
        
        payload = {
            'project_id': self.project.id,
            'product_id': self.product.id,
            'refund_date': '2024-01-15',
            'production_amount': 1
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 데이터베이스 확인
        data = response.json()
        refund = Refund.objects.get(id=data['refund_id'])
        self.assertEqual(refund.amount, 1)  # product.current_stock(0) + production_amount(1)
        self.assertEqual(refund.production_amount, 1)

    def test_update_refund_only_current_stock(self):
        """current_stock만 수정하는 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # current_stock만 수정 (실제로는 수정되지 않음)
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'current_stock': 20
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 데이터베이스 확인
        refund.refresh_from_db()
        self.assertEqual(refund.amount, 15)  # current_stock은 수정되지 않음
        self.assertEqual(refund.current_stock, 10)  # 수정되지 않음
        self.assertEqual(refund.production_amount, 5)  # 변경되지 않음
        
        # 로그 내용도 업데이트되지 않음
        log.refresh_from_db()
        self.assertEqual(log.content, f'{self.product.name} 15개가 반품되었어요.')

    def test_update_refund_only_production_amount(self):
        """production_amount만 수정하는 테스트"""
        # 먼저 반품 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content=f'{self.product.name} 15개가 반품되었어요.'
        )
        
        refund = Refund.objects.create(
            project_log=log,
            product=self.product,
            amount=15,
            refund_date=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            current_stock=10,
            production_amount=5
        )
        
        # production_amount만 수정
        url = f'/v1/project/refund/{refund.id}'
        
        payload = {
            'production_amount': 15
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 데이터베이스 확인
        refund.refresh_from_db()
        self.assertEqual(refund.amount, 25)  # 10 + 15
        self.assertEqual(refund.current_stock, 10)  # 변경되지 않음
        self.assertEqual(refund.production_amount, 15)
        
        # 로그 내용도 업데이트되었는지 확인
        log.refresh_from_db()
        self.assertEqual(log.content, f'{self.product.name} 25개가 반품되었어요.')
