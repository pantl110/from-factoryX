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
        url = '/v1/location/location/create'
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
        self.assertIsNotNone(self.material.location)
        self.assertEqual(self.material.location.location, 'A-1-1')
        self.assertEqual(self.material.location.type, 'material')

    def test_create_product_location(self):
        """품목 위치 생성 테스트"""
        url = '/v1/location/location/create'
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
        self.assertIsNotNone(self.product.location)
        self.assertEqual(self.product.location.location, 'B-2-1')
        self.assertEqual(self.product.location.type, 'product')
        self.assertEqual(self.product.location.images, ['image1.jpg', 'image2.jpg'])

    def test_create_location_invalid_type(self):
        """잘못된 타입으로 위치 생성 시도 테스트"""
        url = '/v1/location/location/create'
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
        url = '/v1/location/location/create'
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
        url = '/v1/location/location/create'
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

    def test_list_material_location(self):
        """원자재 위치 조회 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        self.material.location = location
        self.material.save()
        
        # 위치가 실제로 설정되었는지 확인
        self.material.refresh_from_db()
        self.assertIsNotNone(self.material.location)
        
        url = f'/v1/location/location/list?type=material&id={self.material.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['location'], 'A-1-1')
        self.assertEqual(response.json()['type'], 'material')

    def test_list_product_location(self):
        """품목 위치 조회 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='product',
            location='B-2-1',
            images=['image1.jpg']
        )
        self.product.location = location
        self.product.save()
        
        # 위치가 실제로 설정되었는지 확인
        self.product.refresh_from_db()
        self.assertIsNotNone(self.product.location)
        
        url = f'/v1/location/location/list?type=product&id={self.product.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['location'], 'B-2-1')
        self.assertEqual(response.json()['type'], 'product')
        self.assertEqual(response.json()['images'], ['image1.jpg'])

    def test_list_location_without_location(self):
        """위치가 연결되지 않은 원자재/품목 조회 테스트"""
        url = f'/v1/location/location/list?type=material&id={self.material.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        # 위치가 없으면 404를 반환해야 함
        self.assertEqual(response.status_code, 404)

    def test_list_location_nonexistent_material(self):
        """존재하지 않는 원자재 ID로 위치 조회 시도 테스트"""
        url = '/v1/location/location/list?type=material&id=99999'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_location_nonexistent_product(self):
        """존재하지 않는 품목 ID로 위치 조회 시도 테스트"""
        url = '/v1/location/location/list?type=product&id=99999'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_list_location_invalid_type(self):
        """잘못된 타입으로 위치 조회 시도 테스트"""
        url = f'/v1/location/location/list?type=invalid_type&id={self.material.id}'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_location_reuse(self):
        """동일한 위치 재사용 테스트"""
        # 첫 번째 원자재에 위치 생성
        data1 = {
            'type': 'material',
            'id': self.material.id,
            'location': 'A-1-1',
            'images': []
        }
        response1 = self.client.post(
            '/v1/location/location/create', 
            data1, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response1.status_code, 200)
        
        # 새로운 원자재 생성
        material2 = Material.objects.create(
            factory=self.factory,
            name='테스트 원자재 2',
            code='MAT-002',
            unit='kg',
            spec='200x300mm',
            current_stock=200
        )
        
        # 동일한 위치를 두 번째 원자재에 연결
        data2 = {
            'type': 'material',
            'id': material2.id,
            'location': 'A-1-1',
            'images': []
        }
        response2 = self.client.post(
            '/v1/location/location/create', 
            data2, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response2.status_code, 200)
        
        # 두 원자재가 같은 위치 객체를 참조하는지 확인
        self.material.refresh_from_db()
        material2.refresh_from_db()
        self.assertEqual(self.material.location.id, material2.location.id)

    def test_update_material_location(self):
        """원자재 위치 수정 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        self.material.location = location
        self.material.save()
        
        # 위치 수정
        url = '/v1/location/location/update'
        data = {
            'type': 'material',
            'id': self.material.id,
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
        
        # 원자재의 위치가 수정되었는지 확인
        self.material.refresh_from_db()
        self.assertEqual(self.material.location.location, 'B-2-2')
        self.assertEqual(self.material.location.images, ['new_image.jpg'])

    def test_update_product_location(self):
        """품목 위치 수정 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='product',
            location='B-2-1',
            images=['old_image.jpg']
        )
        self.product.location = location
        self.product.save()
        
        # 위치 수정
        url = '/v1/location/location/update'
        data = {
            'type': 'product',
            'id': self.product.id,
            'location': 'C-3-3',
            'images': ['updated_image1.jpg', 'updated_image2.jpg']
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 품목의 위치가 수정되었는지 확인
        self.product.refresh_from_db()
        self.assertEqual(self.product.location.location, 'C-3-3')
        self.assertEqual(self.product.location.images, ['updated_image1.jpg', 'updated_image2.jpg'])

    def test_update_location_invalid_type(self):
        """잘못된 타입으로 위치 수정 시도 테스트"""
        url = '/v1/location/location/update'
        data = {
            'type': 'invalid_type',
            'id': self.material.id,
            'location': 'A-1-1',
            'images': []
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_update_location_nonexistent_material(self):
        """존재하지 않는 원자재 ID로 위치 수정 시도 테스트"""
        url = '/v1/location/location/update'
        data = {
            'type': 'material',
            'id': 99999,  # 존재하지 않는 ID
            'location': 'A-1-1',
            'images': []
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_update_location_nonexistent_product(self):
        """존재하지 않는 품목 ID로 위치 수정 시도 테스트"""
        url = '/v1/location/location/update'
        data = {
            'type': 'product',
            'id': 99999,  # 존재하지 않는 ID
            'location': 'B-2-1',
            'images': []
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_update_location_without_location(self):
        """위치가 연결되지 않은 원자재/품목 수정 시도 테스트"""
        url = '/v1/location/location/update'
        data = {
            'type': 'material',
            'id': self.material.id,
            'location': 'A-1-1',
            'images': []
        }
        
        response = self.client.patch(
            url,
            data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_delete_material_location(self):
        """원자재 위치 삭제 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='material',
            location='A-1-1',
            images=[]
        )
        self.material.location = location
        self.material.save()
        
        # 위치 삭제
        url = f'/v1/location/location/delete?type=material&id={self.material.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 원자재의 위치가 해제되었는지 확인
        self.material.refresh_from_db()
        self.assertIsNone(self.material.location)

    def test_delete_product_location(self):
        """품목 위치 삭제 테스트"""
        # 먼저 위치 생성
        location = Location.objects.create(
            type='product',
            location='B-2-1',
            images=['image1.jpg']
        )
        self.product.location = location
        self.product.save()
        
        # 위치 삭제
        url = f'/v1/location/location/delete?type=product&id={self.product.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 품목의 위치가 해제되었는지 확인
        self.product.refresh_from_db()
        self.assertIsNone(self.product.location)

    def test_delete_location_invalid_type(self):
        """잘못된 타입으로 위치 삭제 시도 테스트"""
        url = '/v1/location/location/delete?type=invalid_type&id=1'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_delete_location_nonexistent_material(self):
        """존재하지 않는 원자재 ID로 위치 삭제 시도 테스트"""
        url = '/v1/location/location/delete?type=material&id=99999'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_delete_location_nonexistent_product(self):
        """존재하지 않는 품목 ID로 위치 삭제 시도 테스트"""
        url = '/v1/location/location/delete?type=product&id=99999'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)

    def test_delete_location_without_location(self):
        """위치가 연결되지 않은 원자재/품목 삭제 시도 테스트"""
        url = f'/v1/location/location/delete?type=material&id={self.material.id}'
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
