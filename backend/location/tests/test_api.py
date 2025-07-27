import pytest
import jwt
from django.test import TestCase, Client
from django.urls import reverse
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from location.models import Location
from stock.models import Material, Product
from factory.models import Factory
from user.models import User


class LocationAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 테스트용 공장 생성
        self.factory = Factory.objects.create(
            owner=self.user,
            name='테스트 공장',
            business_registration_number='123-45-67890'
        )
        
        # 테스트용 원자재 생성
        self.material = Material.objects.create(
            factory=self.factory,
            name='테스트 원자재',
            code='MAT-001',
            unit='kg',
            spec='100x200mm',
            current_stock=100
        )
        
        # 테스트용 품목 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name='테스트 품목',
            code='PROD-001',
            unit='개',
            spec='150x300mm',
            current_stock=50
        )
        
        # API 클라이언트 설정
        self.client = Client()
        
        # JWT 토큰 생성
        self.token = self.generate_jwt_token()

    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        payload = {
            'user_id': self.user.id,
            'exp': timezone.now() + timedelta(hours=1)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    def test_create_material_location(self):
        """원자재 위치 생성 테스트"""
        url = '/v1/location'
        data = {
            'type': 'material',
            'id': self.material.id,
            'location': 'A-1-1',
            'images': []
        }
        
        response = self.client.post(
            url, 
            data, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 원자재가 위치와 연결되었는지 확인
        self.material.refresh_from_db()
        locations = self.material.location.all()
        self.assertEqual(locations.count(), 1)
        self.assertEqual(locations.first().location, 'A-1-1')
        self.assertEqual(locations.first().type, 'material')

    def test_create_product_location(self):
        """품목 위치 생성 테스트"""
        url = '/v1/location'
        data = {
            'type': 'product',
            'id': self.product.id,
            'location': 'B-2-1',
            'images': ['image1.jpg', 'image2.jpg']
        }
        
        response = self.client.post(
            url, 
            data, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 품목이 위치와 연결되었는지 확인
        self.product.refresh_from_db()
        locations = self.product.location.all()
        self.assertEqual(locations.count(), 1)
        self.assertEqual(locations.first().location, 'B-2-1')
        self.assertEqual(locations.first().type, 'product')
        self.assertEqual(locations.first().images, ['image1.jpg', 'image2.jpg'])

    def test_create_multiple_locations(self):
        """한 아이템에 여러 위치 생성 테스트"""
        url = '/v1/location'
        
        # 첫 번째 위치 생성
        data1 = {
            'type': 'material',
            'id': self.material.id,
            'location': 'A-1-1',
            'images': []
        }
        response1 = self.client.post(
            url, 
            data1, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response1.status_code, 200)
        
        # 두 번째 위치 생성
        data2 = {
            'type': 'material',
            'id': self.material.id,
            'location': 'A-1-2',
            'images': ['image1.jpg']
        }
        response2 = self.client.post(
            url, 
            data2, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response2.status_code, 200)
        
        # 두 개의 위치가 모두 연결되었는지 확인
        self.material.refresh_from_db()
        locations = self.material.location.all()
        self.assertEqual(locations.count(), 2)
        location_names = [loc.location for loc in locations]
        self.assertIn('A-1-1', location_names)
        self.assertIn('A-1-2', location_names)

    def test_create_location_invalid_type(self):
        """잘못된 타입으로 위치 생성 시도 테스트"""
        url = '/v1/location'
        data = {
            'type': 'invalid_type',
            'id': self.material.id,
            'location': 'A-1-1',
            'images': []
        }
        
        response = self.client.post(
            url, 
            data, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_create_location_nonexistent_material(self):
        """존재하지 않는 원자재 ID로 위치 생성 시도 테스트"""
        url = '/v1/location'
        data = {
            'type': 'material',
            'id': 99999,  # 존재하지 않는 ID
            'location': 'A-1-1',
            'images': []
        }
        
        response = self.client.post(
            url, 
            data, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_create_location_nonexistent_product(self):
        """존재하지 않는 품목 ID로 위치 생성 시도 테스트"""
        url = '/v1/location'
        data = {
            'type': 'product',
            'id': 99999,  # 존재하지 않는 ID
            'location': 'B-2-1',
            'images': []
        }
        
        response = self.client.post(
            url, 
            data, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_material_locations(self):
        """원자재 위치 목록 조회 테스트"""
        # 먼저 위치 생성
        location1 = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        location2 = Location.objects.create(
            type='material',
            location='A-1-2',
            images=['image1.jpg']
        )
        self.material.location.add(location1, location2)
        
        url = f'/v1/location?type=material&id={self.material.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['locations']), 2)
        
        location_names = [loc['location'] for loc in data['locations']]
        self.assertIn('A-1-1', location_names)
        self.assertIn('A-1-2', location_names)

    def test_list_product_locations(self):
        """품목 위치 목록 조회 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='product',
            location='B-2-1',
            images=['image1.jpg']
        )
        self.product.location.add(location)
        
        url = f'/v1/location?type=product&id={self.product.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['locations']), 1)
        self.assertEqual(data['locations'][0]['location'], 'B-2-1')
        self.assertEqual(data['locations'][0]['type'], 'product')
        self.assertEqual(data['locations'][0]['images'], ['image1.jpg'])

    def test_list_locations_without_location(self):
        """위치가 연결되지 않은 원자재/품목 조회 테스트"""
        url = f'/v1/location?type=material&id={self.material.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        # 위치가 없으면 404를 반환해야 함
        self.assertEqual(response.status_code, 404)

    def test_list_locations_nonexistent_material(self):
        """존재하지 않는 원자재 ID로 위치 조회 시도 테스트"""
        url = '/v1/location?type=material&id=99999'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_locations_nonexistent_product(self):
        """존재하지 않는 품목 ID로 위치 조회 시도 테스트"""
        url = '/v1/location?type=product&id=99999'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_locations_invalid_type(self):
        """잘못된 타입으로 위치 조회 시도 테스트"""
        url = f'/v1/location?type=invalid_type&id={self.material.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_update_material_location_specific(self):
        """원자재에 연결된 특정 위치 정보 수정 테스트 (location_id 직접 지정)"""
        # 위치 2개 생성 및 연결
        location1 = Location.objects.create(
            type='material',
            location='A-1-1',
            images=['old1.jpg']
        )
        location2 = Location.objects.create(
            type='material',
            location='A-1-2',
            images=['old2.jpg']
        )
        self.material.location.add(location1, location2)
        # location2의 정보만 수정 (새로운 API 구조)
        url = f'/v1/location/{location2.id}'
        data = {
            'location': 'B-2-2',
            'images': ['new_image.jpg']
        }
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # location2만 수정되었는지 확인
        location2.refresh_from_db()
        self.assertEqual(location2.location, 'B-2-2')
        self.assertEqual(location2.images, ['new_image.jpg'])
        # location1은 그대로
        location1.refresh_from_db()
        self.assertEqual(location1.location, 'A-1-1')
        self.assertEqual(location1.images, ['old1.jpg'])

    def test_update_location_not_connected(self):
        """자재에 연결되지 않은 location_id로 수정 시도 시 200 반환 (새로운 API는 연결 여부와 무관)"""
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        # 연결하지 않음 (새로운 API는 연결 여부와 무관하게 수정 가능)
        url = f'/v1/location/{location.id}'
        data = {
            'location': 'B-2-2',
            'images': ['new_image.jpg']
        }
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # 수정 확인
        location.refresh_from_db()
        self.assertEqual(location.location, 'B-2-2')
        self.assertEqual(location.images, ['new_image.jpg'])

    def test_update_location_invalid_type(self):
        """새로운 API에서는 type 필드가 제거되어 타입 검증이 없음"""
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        self.material.location.add(location)
        url = f'/v1/location/{location.id}'
        data = {
            'location': 'B-2-2',
            'images': ['new_image.jpg']
        }
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # 수정 확인
        location.refresh_from_db()
        self.assertEqual(location.location, 'B-2-2')
        self.assertEqual(location.images, ['new_image.jpg'])

    def test_update_location_nonexistent_location(self):
        """존재하지 않는 location_id로 수정 시도 시 404 반환"""
        url = '/v1/location/99999'  # 존재하지 않는 id
        data = {
            'location': 'B-2-2',
            'images': ['new_image.jpg']
        }
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 404)
        msg = response.json().get('message') or response.json().get('detail') or str(response.content)
        self.assertIn('해당 위치를 찾을 수 없습니다', msg)

    def test_delete_material_locations(self):
        """원자재 위치 삭제 테스트 (새로운 API 구조)"""
        # 위치 2개 생성 및 연결
        location1 = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        location2 = Location.objects.create(
            type='material',
            location='A-1-2',
            images=['image1.jpg']
        )
        self.material.location.add(location1, location2)
        # location2만 삭제 (새로운 API 구조)
        url = f'/v1/location/{location2.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # location2가 실제로 삭제되었는지 확인
        self.assertFalse(Location.objects.filter(id=location2.id).exists())
        # location1은 그대로 존재
        self.assertTrue(Location.objects.filter(id=location1.id).exists())

    def test_delete_product_locations(self):
        """품목 위치 삭제 테스트 (새로운 API 구조)"""
        location = Location.objects.create(
            type='product',
            location='B-2-1',
            images=['image1.jpg']
        )
        self.product.location.add(location)
        url = f'/v1/location/{location.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # location이 실제로 삭제되었는지 확인
        self.assertFalse(Location.objects.filter(id=location.id).exists())

    def test_delete_location_invalid_type(self):
        """새로운 API에서는 type 파라미터가 제거되어 타입 검증이 없음"""
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        self.material.location.add(location)
        url = f'/v1/location/{location.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # location이 삭제되었는지 확인
        self.assertFalse(Location.objects.filter(id=location.id).exists())

    def test_delete_location_nonexistent_material(self):
        """존재하지 않는 Location ID로 삭제 시도 테스트"""
        url = '/v1/location/99999'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_location_nonexistent_product(self):
        """존재하지 않는 Location ID로 삭제 시도 테스트 (product 타입)"""
        url = '/v1/location/99999'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_location_without_location(self):
        """새로운 API에서는 연결 여부와 무관하게 Location을 삭제할 수 있음"""
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        # 연결하지 않음 (새로운 API는 연결 여부와 무관)
        url = f'/v1/location/{location.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        # location이 삭제되었는지 확인
        self.assertFalse(Location.objects.filter(id=location.id).exists())

    def test_update_location_direct_by_id(self):
        """Location ID로 직접 위치 수정 테스트 (새로운 API 구조)"""
        # 위치 생성
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=['old_image.jpg']
        )
        
        # 새로운 API 구조로 수정
        url = f'/v1/location/{location.id}'
        data = {
            'location': 'B-2-2',
            'images': ['new_image.jpg', 'new_image2.jpg']
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 수정 확인
        location.refresh_from_db()
        self.assertEqual(location.location, 'B-2-2')
        self.assertEqual(location.images, ['new_image.jpg', 'new_image2.jpg'])

    def test_update_location_direct_by_id_not_found(self):
        """존재하지 않는 Location ID로 수정 시도 시 404 반환"""
        url = '/v1/location/99999'
        data = {
            'location': 'B-2-2',
            'images': ['new_image.jpg']
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_update_location_direct_by_id_partial(self):
        """Location ID로 부분 수정 테스트 (images만 수정)"""
        # 위치 생성
        location = Location.objects.create(
            type='product',
            location='C-3-1',
            images=['old_image.jpg']
        )
        
        # images만 수정
        url = f'/v1/location/{location.id}'
        data = {
            'images': ['new_image.jpg']
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # location은 그대로, images만 수정됨
        location.refresh_from_db()
        self.assertEqual(location.location, 'C-3-1')  # 기존 값 유지
        self.assertEqual(location.images, ['new_image.jpg'])  # 수정됨

    def test_delete_location_direct_by_id(self):
        """Location ID로 직접 위치 삭제 테스트 (새로운 API 구조)"""
        # 위치 생성
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=['image.jpg']
        )
        
        # 새로운 API 구조로 삭제
        url = f'/v1/location/{location.id}'
        
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 삭제 확인
        self.assertFalse(Location.objects.filter(id=location.id).exists())

    def test_delete_location_direct_by_id_not_found(self):
        """존재하지 않는 Location ID로 삭제 시도 시 404 반환"""
        url = '/v1/location/99999'
        
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_update_location_direct_by_id_material_type(self):
        """Material 타입 Location 수정 테스트"""
        # material 타입 위치 생성
        location = Location.objects.create(
            type='material',
            location='Material-A-1',
            images=[]
        )
        
        url = f'/v1/location/{location.id}'
        data = {
            'location': 'Material-B-2',
            'images': ['material_image.jpg']
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 수정 확인
        location.refresh_from_db()
        self.assertEqual(location.type, 'material')  # 타입은 그대로
        self.assertEqual(location.location, 'Material-B-2')  # 위치 수정됨
        self.assertEqual(location.images, ['material_image.jpg'])  # 이미지 수정됨

    def test_update_location_direct_by_id_product_type(self):
        """Product 타입 Location 수정 테스트"""
        # product 타입 위치 생성
        location = Location.objects.create(
            type='product',
            location='Product-A-1',
            images=[]
        )
        
        url = f'/v1/location/{location.id}'
        data = {
            'location': 'Product-B-2',
            'images': ['product_image.jpg']
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 수정 확인
        location.refresh_from_db()
        self.assertEqual(location.type, 'product')  # 타입은 그대로
        self.assertEqual(location.location, 'Product-B-2')  # 위치 수정됨
        self.assertEqual(location.images, ['product_image.jpg'])  # 이미지 수정됨
