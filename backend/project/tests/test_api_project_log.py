from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient
from project.models import Project, ProjectLog
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date

User = get_user_model()


class ProjectLogAPITestCase(TestCase):
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
        
        # FactoryMember 생성
        from factory.models import FactoryMember
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        
        # 프로젝트 생성
        self.project = Project.objects.create()
        
        # 견적서 생성 (프로젝트를 공장과 연결)
        from document.models import Quotation
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,
            project=self.project
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

    def test_create_project_log_success(self):
        """프로젝트 로그 생성 성공 테스트"""
        url = '/v1/project/log'
        
        payload = {
            'project_id': self.project.id,
            'type': '메모',
            'title': '테스트 메모',
            'content': '이것은 테스트 메모입니다.'
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
        self.assertIn('log_id', data)
        self.assertEqual(data['message'], '프로젝트 로그가 성공적으로 생성되었습니다.')
        
        # 데이터베이스에 로그가 생성되었는지 확인
        log = ProjectLog.objects.get(id=data['log_id'])
        self.assertEqual(log.project.id, self.project.id)
        self.assertEqual(log.type, '메모')
        self.assertEqual(log.title, '테스트 메모')
        self.assertEqual(log.content, '이것은 테스트 메모입니다.')

    def test_create_project_log_nonexistent_project(self):
        """존재하지 않는 프로젝트로 로그 생성 시도 테스트"""
        url = '/v1/project/log'
        
        payload = {
            'project_id': 999,
            'type': '메모',
            'title': '테스트 메모',
            'content': '이것은 테스트 메모입니다.'
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_create_project_log_invalid_type(self):
        """올바르지 않은 로그 타입으로 생성 시도 테스트"""
        url = '/v1/project/log'
        
        payload = {
            'project_id': self.project.id,
            'type': '잘못된타입',
            'title': '테스트 메모',
            'content': '이것은 테스트 메모입니다.'
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_create_project_log_title_too_long(self):
        """제목이 너무 긴 경우 테스트"""
        url = '/v1/project/log'
        
        payload = {
            'project_id': self.project.id,
            'type': '메모',
            'title': 'A' * 101,  # 101자 제목
            'content': '이것은 테스트 메모입니다.'
        }
        
        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_create_project_log_without_auth(self):
        """인증 없이 로그 생성 시도 테스트"""
        url = '/v1/project/log'
        
        payload = {
            'project_id': self.project.id,
            'type': '메모',
            'title': '테스트 메모',
            'content': '이것은 테스트 메모입니다.'
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [401, 403])

    def test_list_project_logs_success(self):
        """프로젝트 로그 조회 성공 테스트"""
        # 먼저 로그 생성
        log1 = ProjectLog.objects.create(
            project=self.project,
            type='메모',
            title='첫 번째 메모',
            content='첫 번째 메모 내용'
        )
        
        log2 = ProjectLog.objects.create(
            project=self.project,
            type='계획 변경',
            title='계획 변경 로그',
            content='계획이 변경되었습니다.'
        )
        
        # 로그 조회
        url = f'/v1/project/log?project_id={self.project.id}&factory_id={self.factory.id}'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인 (페이지네이션 형식)
        data = response.json()
        self.assertIsInstance(data, dict)
        self.assertIn('data', data)
        self.assertIn('count', data)
        self.assertIn('totalCnt', data)
        self.assertIn('curPage', data)
        
        logs = data['data']
        self.assertIsInstance(logs, list)
        self.assertEqual(len(logs), 2)
        
        # 로그 순서 확인 (최신순)
        self.assertEqual(logs[0]['id'], log2.id)
        self.assertEqual(logs[1]['id'], log1.id)
        
        # 첫 번째 로그 상세 확인
        first_log = logs[0]
        self.assertEqual(first_log['project_id'], self.project.id)
        self.assertEqual(first_log['type'], '계획 변경')
        self.assertEqual(first_log['title'], '계획 변경 로그')
        self.assertEqual(first_log['content'], '계획이 변경되었습니다.')

    def test_list_project_logs_nonexistent_project(self):
        """존재하지 않는 프로젝트로 로그 조회 시도 테스트"""
        url = f'/v1/project/log?project_id=999&factory_id={self.factory.id}'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_project_logs_no_logs(self):
        """로그가 없는 프로젝트 조회 시도 테스트"""
        url = f'/v1/project/log?project_id={self.project.id}&factory_id={self.factory.id}'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_project_logs_without_auth(self):
        """인증 없이 로그 조회 시도 테스트"""
        url = f'/v1/project/log?project_id={self.project.id}&factory_id={self.factory.id}'
        
        response = self.client.get(url)
        
        self.assertIn(response.status_code, [401, 403])

    def test_list_project_logs_with_refund_log(self):
        """반품 로그가 포함된 프로젝트 로그 조회 테스트"""
        # 반품 로그 생성
        refund_log = ProjectLog.objects.create(
            project=self.project,
            type='refund',
            title='반품 접수 현황',
            content='테스트 제품 10개가 반품되었어요.'
        )
        
        # 반품 생성 (로그와 연결)
        from project.models import Refund
        from stock.models import Product
        
        product = Product.objects.create(
            factory=self.factory,
            name='테스트 제품',
            code='TEST001',
            unit='개',
            spec='테스트 규격'
        )
        
        refund = Refund.objects.create(
            project_log=refund_log,
            product=product,
            amount=10,
            refund_date=date(2024, 1, 15),
            current_stock=5,
            production_amount=5
        )
        
        # 일반 로그 생성
        general_log = ProjectLog.objects.create(
            project=self.project,
            type='plan',
            title='생산 계획 생성',
            content='테스트 제품 생산 계획이 생성되었습니다.'
        )
        
        url = f'/v1/project/log?project_id={self.project.id}'
        
        response = self.client.get(
            f"{url}&factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data['items']), 2)
        
        # 반품 로그 확인
        refund_log_data = next(log for log in data['items'] if log['type'] == 'refund')
        self.assertEqual(refund_log_data['id'], refund_log.id)
        self.assertEqual(refund_log_data['refund_id'], refund.id)
        self.assertEqual(refund_log_data['title'], '반품 접수 현황')
        
        # 일반 로그 확인
        general_log_data = next(log for log in data['items'] if log['type'] == 'plan')
        self.assertEqual(general_log_data['id'], general_log.id)
        self.assertIsNone(general_log_data['refund_id'])
        self.assertEqual(general_log_data['title'], '생산 계획 생성')

    def test_update_project_log_success(self):
        """프로젝트 로그 수정 성공 테스트"""
        # 먼저 로그 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='메모',
            title='원본 제목',
            content='원본 내용'
        )
        
        # 로그 수정
        url = f'/v1/project/log/{log.id}'
        
        payload = {
            'title': '수정된 제목',
            'content': '수정된 내용'
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
        self.assertEqual(data['message'], '프로젝트 로그가 성공적으로 수정되었습니다.')
        
        # 데이터베이스에서 수정된 내용 확인
        log.refresh_from_db()
        self.assertEqual(log.title, '수정된 제목')
        self.assertEqual(log.content, '수정된 내용')
        self.assertEqual(log.type, '메모')  # 수정하지 않은 필드는 그대로 유지

    def test_update_project_log_nonexistent(self):
        """존재하지 않는 로그 수정 시도 테스트"""
        url = '/v1/project/log/999'
        
        payload = {
            'title': '수정된 제목',
            'content': '수정된 내용'
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_update_project_log_invalid_type(self):
        """올바르지 않은 로그 타입으로 수정 시도 테스트"""
        # 먼저 로그 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='메모',
            title='원본 제목',
            content='원본 내용'
        )
        
        # 로그 수정
        url = f'/v1/project/log/{log.id}'
        
        payload = {
            'type': '잘못된타입'
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_update_project_log_title_too_long(self):
        """제목이 너무 긴 경우 수정 테스트"""
        # 먼저 로그 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='메모',
            title='원본 제목',
            content='원본 내용'
        )
        
        # 로그 수정
        url = f'/v1/project/log/{log.id}'
        
        payload = {
            'title': 'A' * 101  # 101자 제목
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_update_project_log_without_auth(self):
        """인증 없이 로그 수정 시도 테스트"""
        # 먼저 로그 생성
        log = ProjectLog.objects.create(
            project=self.project,
            type='메모',
            title='원본 제목',
            content='원본 내용'
        )
        
        # 로그 수정
        url = f'/v1/project/log/{log.id}'
        
        payload = {
            'title': '수정된 제목'
        }
        
        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [401, 403]) 