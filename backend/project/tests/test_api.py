from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient
from project.models import Project
from document.models import Quotation
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta

User = get_user_model()


class ProjectAPITestCase(TestCase):
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

    def test_create_project_success(self):
        """프로젝트 생성 성공 테스트"""
        url = '/v1/project'
        
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 201)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('id', data)
        self.assertIsInstance(data['id'], int)
        
        # 데이터베이스에 프로젝트와 견적서가 생성되었는지 확인
        project_count = Project.objects.count()
        quotation_count = Quotation.objects.count()
        
        self.assertEqual(project_count, 1)
        self.assertEqual(quotation_count, 1)
        
        # 생성된 프로젝트와 견적서의 관계 확인
        project = Project.objects.first()
        quotation = Quotation.objects.first()
        
        self.assertEqual(quotation.project, project)
        self.assertEqual(quotation.id, data['id'])
        
        # 프로젝트의 기본 상태 확인
        self.assertEqual(project.status, Project.ProjectStatus.quotation)

    def test_create_project_without_auth(self):
        """인증 없이 프로젝트 생성 시도 테스트"""
        url = '/v1/project'
        
        response = self.client.post(
            url,
            content_type='application/json'
        )
        
        # 인증이 필요하므로 401 또는 403이 반환되어야 함
        self.assertIn(response.status_code, [401, 403])

    def test_create_project_invalid_token(self):
        """잘못된 토큰으로 프로젝트 생성 시도 테스트"""
        url = '/v1/project'
        
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer invalid_token'
        )
        
        # 잘못된 토큰이므로 401이 반환되어야 함
        self.assertEqual(response.status_code, 401)

    def test_create_multiple_projects(self):
        """여러 프로젝트 생성 테스트"""
        url = '/v1/project'
        
        # 첫 번째 프로젝트 생성
        response1 = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response1.status_code, 201)
        
        # 두 번째 프로젝트 생성
        response2 = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response2.status_code, 201)
        
        # 데이터베이스에 두 개의 프로젝트와 견적서가 생성되었는지 확인
        project_count = Project.objects.count()
        quotation_count = Quotation.objects.count()
        
        self.assertEqual(project_count, 2)
        self.assertEqual(quotation_count, 2)
        
        # 각 프로젝트에 견적서가 연결되어 있는지 확인
        projects = Project.objects.all()
        quotations = Quotation.objects.all()
        
        for project in projects:
            self.assertTrue(hasattr(project, 'quotations'))
            self.assertEqual(project.quotations.count(), 1)
        
        for quotation in quotations:
            self.assertIsNotNone(quotation.project)

    def test_project_quotation_relationship(self):
        """프로젝트와 견적서의 관계 확인 테스트"""
        url = '/v1/project'
        
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 201)
        
        # 프로젝트와 견적서의 관계 확인
        project = Project.objects.first()
        quotation = Quotation.objects.first()
        
        # 프로젝트에서 견적서 접근
        self.assertEqual(project.quotations.first(), quotation)
        
        # 견적서에서 프로젝트 접근
        self.assertEqual(quotation.project, project)
        
        # 견적서의 기본 필드 확인
        self.assertIsNone(quotation.factory)
        self.assertIsNone(quotation.client)
        self.assertIsNone(quotation.due_date)
        self.assertIsNone(quotation.uploaded_file)

    def test_project_default_status(self):
        """프로젝트 생성 시 기본 상태 확인 테스트"""
        url = '/v1/project'
        
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 201)
        
        project = Project.objects.first()
        
        # 프로젝트의 기본 상태가 'quotation'인지 확인
        self.assertEqual(project.status, Project.ProjectStatus.quotation)
        self.assertEqual(project.status, '견적 협의중')
        
        # 다른 기본 필드들 확인
        self.assertIsNone(project.transact_date)
        self.assertIsNone(project.tax_invoice)
