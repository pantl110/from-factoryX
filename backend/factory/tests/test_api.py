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
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
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

    def test_list_factories_without_filter(self):
        """공장 목록 조회 (필터 없이 모든 공장 조회) 테스트"""
        # 추가 공장 생성
        additional_factory = Factory.objects.create(
            name='추가 공장',
            owner=self.user,
            business_address='서울시 마포구'
        )
        
        # FactoryMember 생성
        additional_member = FactoryMember.objects.create(
            factory=additional_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 모든 공장이 조회되는지 확인
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 2)  # 테스트 공장 + 추가 공장
        
        # 공장 이름들 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertIn('추가 공장', factory_names)

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
            role=FactoryMember.FactoryMemberType.viewer,
            status=FactoryMember.MemberStatus.active,
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

    def test_list_factories_owner_and_member(self):
        """본인이 소유한 공장과 멤버로 등록된 공장 모두 조회 테스트"""
        # 다른 사용자 생성
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        
        # 다른 사용자가 소유한 공장 생성
        other_factory = Factory.objects.create(
            name='다른 사용자 공장',
            owner=other_user,
            business_address='서울시 서초구'
        )
        
        # 현재 사용자를 다른 공장의 멤버로 등록
        member = FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.active,
            invited_by=other_user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 두 개의 공장이 모두 조회되어야 함
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 2)
        
        # 공장 이름들 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertIn('다른 사용자 공장', factory_names)

    def test_list_factories_inactive_member_excluded(self):
        """비활성 멤버는 조회되지 않아야 함"""
        # 다른 사용자 생성
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        
        # 다른 사용자가 소유한 공장 생성
        other_factory = Factory.objects.create(
            name='비활성 멤버 공장',
            owner=other_user,
            business_address='서울시 마포구'
        )
        
        # 현재 사용자를 비활성 멤버로 등록
        inactive_member = FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.viewer,
            status=FactoryMember.MemberStatus.invited,  # 비활성 상태
            invited_by=other_user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 비활성 멤버 공장은 조회되지 않아야 함
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 1)  # 본인 공장만 조회
        
        # 공장 이름 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertNotIn('비활성 멤버 공장', factory_names)

    def test_list_factories_multiple_roles(self):
        """다양한 권한의 멤버로 등록된 공장들 조회 테스트"""
        # 다른 사용자들 생성
        user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        
        # 공장들 생성
        factory1 = Factory.objects.create(
            name='관리자 공장',
            owner=user1,
            business_address='서울시 강남구'
        )
        factory2 = Factory.objects.create(
            name='운영자 공장',
            owner=user2,
            business_address='서울시 서초구'
        )
        
        # 현재 사용자를 다양한 권한으로 등록
        admin_member = FactoryMember.objects.create(
            factory=factory1,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=user1
        )
        manager_member = FactoryMember.objects.create(
            factory=factory2,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.active,
            invited_by=user2
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 세 개의 공장이 모두 조회되어야 함 (본인 공장 + 2개 멤버 공장)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 3)
        
        # 공장 이름들 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertIn('관리자 공장', factory_names)
        self.assertIn('운영자 공장', factory_names)

    def test_list_factories_empty_result(self):
        """멤버로 등록된 공장이 없는 경우 빈 결과 반환 테스트"""
        # 기존 공장과 멤버 삭제
        FactoryMember.objects.filter(user=self.user).delete()
        Factory.objects.filter(owner=self.user).delete()
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 빈 결과 확인
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 0)

    def test_list_factories_only_active_members(self):
        """활성 상태의 멤버만 조회되는지 테스트"""
        # 기존 데이터 정리
        FactoryMember.objects.filter(user=self.user).delete()
        Factory.objects.filter(owner=self.user).delete()
        
        # 다른 사용자 생성
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        
        # 다른 사용자가 소유한 공장 생성
        other_factory = Factory.objects.create(
            name='활성 멤버 공장',
            owner=other_user,
            business_address='서울시 강남구'
        )
        
        # 현재 사용자를 활성 멤버로 등록
        active_member = FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.viewer,
            status=FactoryMember.MemberStatus.active,
            invited_by=other_user
        )
        
        # 비활성 멤버도 추가
        inactive_member = FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.invited,  # 비활성 상태
            invited_by=other_user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 활성 멤버 공장만 조회되어야 함
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 1)  # 활성 멤버 공장만
        
        # 공장 이름 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('활성 멤버 공장', factory_names)

    def test_list_factories_owner_automatically_included(self):
        """공장 소유자는 자동으로 멤버로 포함되는지 테스트"""
        # 새로운 공장 생성 (소유자)
        new_factory = Factory.objects.create(
            name='소유자 공장',
            owner=self.user,
            business_address='서울시 서초구'
        )
        
        # FactoryMember는 자동으로 생성되지 않으므로 수동으로 생성
        owner_member = FactoryMember.objects.create(
            factory=new_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 두 개의 공장이 모두 조회되어야 함
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 2)
        
        # 공장 이름들 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertIn('소유자 공장', factory_names)

    def test_list_factories_with_different_roles(self):
        """다양한 역할의 멤버로 등록된 공장들이 올바르게 조회되는지 테스트"""
        # 다른 사용자들 생성
        user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        user3 = User.objects.create_user(
            email='user3@example.com',
            password='testpass123'
        )
        
        # 공장들 생성
        factory1 = Factory.objects.create(
            name='관리자 공장',
            owner=user1,
            business_address='서울시 강남구'
        )
        factory2 = Factory.objects.create(
            name='운영자 공장',
            owner=user2,
            business_address='서울시 서초구'
        )
        factory3 = Factory.objects.create(
            name='조회자 공장',
            owner=user3,
            business_address='서울시 마포구'
        )
        
        # 현재 사용자를 다양한 역할로 등록
        admin_member = FactoryMember.objects.create(
            factory=factory1,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=user1
        )
        manager_member = FactoryMember.objects.create(
            factory=factory2,
            user=self.user,
            role=FactoryMember.FactoryMemberType.manager,
            status=FactoryMember.MemberStatus.active,
            invited_by=user2
        )
        viewer_member = FactoryMember.objects.create(
            factory=factory3,
            user=self.user,
            role=FactoryMember.FactoryMemberType.viewer,
            status=FactoryMember.MemberStatus.active,
            invited_by=user3
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 네 개의 공장이 모두 조회되어야 함 (본인 공장 + 3개 멤버 공장)
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 4)
        
        # 공장 이름들 확인
        factory_names = [factory['name'] for factory in data['data']]
        self.assertIn('테스트 공장', factory_names)
        self.assertIn('관리자 공장', factory_names)
        self.assertIn('운영자 공장', factory_names)
        self.assertIn('조회자 공장', factory_names)

    def test_list_factories_ordered_by_created_at_desc(self):
        """공장 목록이 생성일 기준 내림차순으로 정렬되는지 테스트"""
        # 기존 데이터 정리
        FactoryMember.objects.filter(user=self.user).delete()
        Factory.objects.filter(owner=self.user).delete()
        
        # 새로운 공장들 생성 (시간 간격을 두고)
        from django.utils import timezone
        import time
        
        factory1 = Factory.objects.create(
            name='첫 번째 공장',
            owner=self.user,
            business_address='서울시 강남구'
        )
        time.sleep(0.1)  # 시간 간격
        
        factory2 = Factory.objects.create(
            name='두 번째 공장',
            owner=self.user,
            business_address='서울시 서초구'
        )
        time.sleep(0.1)  # 시간 간격
        
        factory3 = Factory.objects.create(
            name='세 번째 공장',
            owner=self.user,
            business_address='서울시 마포구'
        )
        
        # FactoryMember들 생성
        member1 = FactoryMember.objects.create(
            factory=factory1,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user
        )
        member2 = FactoryMember.objects.create(
            factory=factory2,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user
        )
        member3 = FactoryMember.objects.create(
            factory=factory3,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user
        )
        
        url = '/v1/factory'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 세 개의 공장이 조회되어야 함
        self.assertIn('data', data)
        self.assertIsInstance(data['data'], list)
        self.assertEqual(len(data['data']), 3)
        
        # 생성일 기준 내림차순 정렬 확인 (최신이 먼저)
        factory_names = [factory['name'] for factory in data['data']]
        self.assertEqual(factory_names[0], '세 번째 공장')  # 가장 최근
        self.assertEqual(factory_names[1], '두 번째 공장')
        self.assertEqual(factory_names[2], '첫 번째 공장')  # 가장 오래됨

    def test_create_factory_success(self):
        """공장 등록 성공 테스트"""
        # 기존 공장과 멤버 삭제
        FactoryMember.objects.filter(user=self.user).delete()
        Factory.objects.filter(owner=self.user).delete()
        
        url = '/v1/factory'
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        
        # 응답 형식 확인
        self.assertIn('factory_id', data)
        self.assertIsInstance(data['factory_id'], int)
        
        # 데이터베이스에 공장이 생성되었는지 확인
        factory = Factory.objects.get(id=data['factory_id'])
        self.assertEqual(factory.owner, self.user)
        self.assertIsNotNone(factory.created_at)
        self.assertIsNotNone(factory.updated_at)
        
        # FactoryMember가 자동으로 생성되었는지 확인
        member = FactoryMember.objects.get(factory=factory, user=self.user)
        self.assertEqual(member.role, FactoryMember.FactoryMemberType.admin)
        self.assertEqual(member.status, FactoryMember.MemberStatus.active)
        self.assertEqual(member.invited_by, self.user)

    def test_create_factory_multiple_factories(self):
        """여러 공장 등록 테스트"""
        # 기존 공장과 멤버 삭제
        FactoryMember.objects.filter(user=self.user).delete()
        Factory.objects.filter(owner=self.user).delete()
        
        url = '/v1/factory'
        
        # 첫 번째 공장 등록
        response1 = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response1.status_code, 201)
        data1 = response1.json()
        factory_id1 = data1['factory_id']
        
        # 두 번째 공장 등록
        response2 = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response2.status_code, 201)
        data2 = response2.json()
        factory_id2 = data2['factory_id']
        
        # 두 공장이 다른 ID를 가지는지 확인
        self.assertNotEqual(factory_id1, factory_id2)
        
        # 두 공장 모두 데이터베이스에 존재하는지 확인
        factory1 = Factory.objects.get(id=factory_id1)
        factory2 = Factory.objects.get(id=factory_id2)
        self.assertEqual(factory1.owner, self.user)
        self.assertEqual(factory2.owner, self.user)
        
        # 두 공장 모두 멤버로 등록되었는지 확인
        member1 = FactoryMember.objects.get(factory=factory1, user=self.user)
        member2 = FactoryMember.objects.get(factory=factory2, user=self.user)
        self.assertEqual(member1.role, FactoryMember.FactoryMemberType.admin)
        self.assertEqual(member2.role, FactoryMember.FactoryMemberType.admin)

    def test_create_factory_and_list_verification(self):
        """공장 등록 후 목록 조회로 검증 테스트"""
        # 기존 공장과 멤버 삭제
        FactoryMember.objects.filter(user=self.user).delete()
        Factory.objects.filter(owner=self.user).delete()
        
        # 공장 등록
        create_url = '/v1/factory'
        create_response = self.client.post(
            create_url,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(create_response.status_code, 201)
        factory_id = create_response.json()['factory_id']
        
        # 데이터베이스에서 직접 확인
        factory = Factory.objects.get(id=factory_id)
        self.assertEqual(factory.owner, self.user)
        
        # FactoryMember가 생성되었는지 확인
        member = FactoryMember.objects.get(factory=factory, user=self.user)
        self.assertEqual(member.role, FactoryMember.FactoryMemberType.admin)
        self.assertEqual(member.status, FactoryMember.MemberStatus.active)
        
        # 공장 목록 조회
        list_url = '/v1/factory'
        list_response = self.client.get(
            list_url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(list_response.status_code, 200)
        list_data = list_response.json()
        
        # 목록에 새로 생성된 공장이 포함되어 있는지 확인
        self.assertIn('data', list_data)
        self.assertIsInstance(list_data['data'], list)
        self.assertEqual(len(list_data['data']), 1)
        
        # 공장 정보 확인
        factory_data = list_data['data'][0]
        self.assertEqual(factory_data['id'], factory_id)
        self.assertEqual(factory_data['owner'], self.user.id)

    def test_create_factory_without_auth(self):
        """인증 없이 공장 등록 시도 테스트"""
        url = '/v1/factory'
        response = self.client.post(
            url,
            content_type='application/json'
        )
        
        # 인증 없이는 401 에러가 발생해야 함
        self.assertEqual(response.status_code, 401)

    def test_create_factory_invalid_token(self):
        """잘못된 토큰으로 공장 등록 시도 테스트"""
        url = '/v1/factory'
        response = self.client.post(
            url,
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer invalid_token'
        )
        
        # 잘못된 토큰으로는 401 에러가 발생해야 함
        self.assertEqual(response.status_code, 401)
