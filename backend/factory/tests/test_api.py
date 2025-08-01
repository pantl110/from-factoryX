from django.test import TestCase
from user.api import router as user_router
from factory.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory, FactoryMember
from user.models import EmailVerification
import jwt
from django.conf import settings
from datetime import datetime, timedelta


class FactoryCreateAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # 공장 생성
        self.factory = Factory.objects.create(
            name='테스트 공장',
            owner=self.user,
            business_address='서울시 강남구'
        )
        
        # FactoryMember 생성
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role='admin',
            status='active',
            invited_by=self.user
        )
        
        self.token = self.generate_jwt_token()
        self.client = self.client  # Django test client

    def generate_jwt_token(self):
        return jwt.encode(
            {
                "user_id": self.user.id,
                "exp": datetime.now() + timedelta(hours=1)
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

    def test_create_factory_url(self):
        """공장 생성 API URL 테스트 (입력값 없이, factory_id 반환)"""
        url = '/v1/factory'
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('factory_id', data)
        self.assertIsInstance(data['factory_id'], int)

    def test_list_factories_success(self):
        """공장 목록 조회 성공 테스트"""
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 페이지네이션 응답 형식 확인
        self.assertIn('data', data)
        self.assertIn('count', data)
        self.assertIsInstance(data['data'], list)
        self.assertGreater(len(data['data']), 0)
        
        # 첫 번째 공장 정보 확인
        factory_data = data['data'][0]
        self.assertIn('id', factory_data)
        self.assertIn('name', factory_data)
        self.assertIn('business_address', factory_data)
        self.assertEqual(factory_data['name'], '테스트 공장')
        self.assertEqual(factory_data['business_address'], '서울시 강남구')

    def test_list_factories_with_filter(self):
        """공장 목록 조회 (필터 적용) 테스트"""
        url = '/v1/factory?name=테스트'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 필터링된 결과 확인
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertGreater(len(data['data']), 0)
        
        # 모든 결과가 "테스트"를 포함하는지 확인
        for factory in data['data']:
            self.assertIn('테스트', factory['name'])



    def test_list_factories_as_viewer_member(self):
        """조회자 권한으로 공장 목록 조회 테스트"""
        # 다른 사용자와 공장 생성
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        
        other_factory = Factory.objects.create(
            name='다른 공장',
            owner=other_user,
            business_address='서울시 서초구'
        )
        
        # 현재 사용자를 다른 공장의 조회자로 등록
        viewer_member = FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role='viewer',
            status='active',
            invited_by=other_user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 두 개의 공장이 모두 조회되어야 함 (소유한 공장 + 멤버로 등록된 공장)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 2)
        
        # 공장 이름들 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertIn('다른 공장', factory_names)
