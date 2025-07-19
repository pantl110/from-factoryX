from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient
from stock.models import Material, Product, MaterialProduct
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta

User = get_user_model()


class MaterialProductAPITestCase(TestCase):
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
        
        # 원자재 생성
        self.material1 = Material.objects.create(
            factory=self.factory,
            name='철판',
            code='STEEL001',
            unit='kg',
            spec='3mm 두께'
        )
        
        self.material2 = Material.objects.create(
            factory=self.factory,
            name='고무',
            code='RUBBER001',
            unit='kg',
            spec='실리콘 고무'
        )
        
        self.material3 = Material.objects.create(
            factory=self.factory,
            name='유리',
            code='GLASS001',
            unit='개',
            spec='5mm 두께'
        )
        
        # 제품 생성
        self.product1 = Product.objects.create(
            factory=self.factory,
            name='자동차',
            code='CAR001',
            unit='대',
            spec='승용차'
        )
        
        self.product2 = Product.objects.create(
            factory=self.factory,
            name='건물',
            code='BUILDING001',
            unit='동',
            spec='상업용 건물'
        )
        
        self.product3 = Product.objects.create(
            factory=self.factory,
            name='가구',
            code='FURNITURE001',
            unit='개',
            spec='책상'
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

    def test_create_material_product_connections_product_type(self):
        """제품 기준으로 원자재 연결 생성 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': self.product1.id,
            'connections': [
                {'id': self.material1.id, 'quantity': 500.0},
                {'id': self.material2.id, 'quantity': 50.0},
                {'id': self.material3.id, 'quantity': 20.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('message', data)
        self.assertIn('created_connections', data)
        self.assertIn('total_count', data)
        self.assertEqual(data['total_count'], 3)
        
        # 데이터베이스에 연결이 생성되었는지 확인
        connections = MaterialProduct.objects.filter(product=self.product1)
        self.assertEqual(connections.count(), 3)
        
        # 각 연결의 수량 확인
        steel_connection = connections.get(material=self.material1)
        self.assertEqual(float(steel_connection.quantity), 500.0)
        
        rubber_connection = connections.get(material=self.material2)
        self.assertEqual(float(rubber_connection.quantity), 50.0)
        
        glass_connection = connections.get(material=self.material3)
        self.assertEqual(float(glass_connection.quantity), 20.0)

    def test_create_material_product_connections_material_type(self):
        """원자재 기준으로 제품 연결 생성 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'material',
            'target_id': self.material1.id,
            'connections': [
                {'id': self.product1.id, 'quantity': 500.0},
                {'id': self.product2.id, 'quantity': 1000.0},
                {'id': self.product3.id, 'quantity': 10.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertEqual(data['total_count'], 3)
        
        # 데이터베이스에 연결이 생성되었는지 확인
        connections = MaterialProduct.objects.filter(material=self.material1)
        self.assertEqual(connections.count(), 3)

    def test_create_material_product_connections_invalid_type(self):
        """올바르지 않은 타입으로 연결 생성 시도 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'invalid_type',
            'target_id': self.product1.id,
            'connections': [
                {'id': self.material1.id, 'quantity': 500.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('올바르지 않은 타입입니다', response.json().get('detail', ''))

    def test_create_material_product_connections_nonexistent_target(self):
        """존재하지 않는 대상으로 연결 생성 시도 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': 999,
            'connections': [
                {'id': self.material1.id, 'quantity': 500.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('해당 제품을 찾을 수 없습니다', response.json().get('detail', ''))

    def test_create_material_product_connections_nonexistent_connection(self):
        """존재하지 않는 연결 대상으로 연결 생성 시도 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': self.product1.id,
            'connections': [
                {'id': 999, 'quantity': 500.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('일부 원자재를 찾을 수 없습니다', response.json().get('detail', ''))

    def test_create_material_product_connections_duplicate(self):
        """중복 연결 생성 테스트 (이미 존재하는 연결은 스킵)"""
        # 먼저 연결 생성
        MaterialProduct.objects.create(
            product=self.product1,
            material=self.material1,
            quantity=500.0
        )
        
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': self.product1.id,
            'connections': [
                {'id': self.material1.id, 'quantity': 600.0},  # 이미 존재하는 연결
                {'id': self.material2.id, 'quantity': 50.0}    # 새로운 연결
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인 (중복은 스킵되어 1개만 생성됨)
        data = response.json()
        self.assertEqual(data['total_count'], 1)
        
        # 데이터베이스 확인 (기존 연결은 그대로, 새로운 연결만 추가됨)
        connections = MaterialProduct.objects.filter(product=self.product1)
        self.assertEqual(connections.count(), 2)

    def test_get_material_product_connections_product_type(self):
        """제품 기준으로 연결 조회 테스트"""
        # 먼저 연결 생성
        MaterialProduct.objects.create(
            product=self.product1,
            material=self.material1,
            quantity=500.0
        )
        MaterialProduct.objects.create(
            product=self.product1,
            material=self.material2,
            quantity=50.0
        )
        
        url = f'/v1/stock/materialproduct/{self.product1.id}?type=product'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertEqual(len(data), 2)
        
        # 각 연결의 정보 확인
        material_ids = [item['material_id'] for item in data]
        self.assertIn(self.material1.id, material_ids)
        self.assertIn(self.material2.id, material_ids)

    def test_get_material_product_connections_material_type(self):
        """원자재 기준으로 연결 조회 테스트"""
        # 먼저 연결 생성
        MaterialProduct.objects.create(
            product=self.product1,
            material=self.material1,
            quantity=500.0
        )
        MaterialProduct.objects.create(
            product=self.product2,
            material=self.material1,
            quantity=1000.0
        )
        
        url = f'/v1/stock/materialproduct/{self.material1.id}?type=material'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertEqual(len(data), 2)
        
        # 각 연결의 정보 확인
        product_ids = [item['product_id'] for item in data]
        self.assertIn(self.product1.id, product_ids)
        self.assertIn(self.product2.id, product_ids)

    def test_get_material_product_connections_invalid_type(self):
        """올바르지 않은 타입으로 조회 시도 테스트"""
        url = f'/v1/stock/materialproduct/{self.product1.id}?type=invalid_type'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('올바르지 않은 타입입니다', response.json().get('detail', ''))

    def test_get_material_product_connections_nonexistent_target(self):
        """존재하지 않는 대상으로 조회 시도 테스트"""
        url = '/v1/stock/materialproduct/999?type=product'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('해당 제품을 찾을 수 없습니다', response.json().get('detail', ''))

    def test_get_material_product_connections_no_connections(self):
        """연결이 없는 경우 조회 테스트"""
        url = f'/v1/stock/materialproduct/{self.product1.id}?type=product'
        
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인 (빈 리스트)
        data = response.json()
        self.assertEqual(len(data), 0)

    def test_delete_material_product_connection(self):
        """MaterialProduct 연결 삭제 테스트"""
        # 먼저 연결 생성
        connection = MaterialProduct.objects.create(
            product=self.product1,
            material=self.material1,
            quantity=500.0
        )
        
        url = f'/v1/stock/materialproduct/connection/{connection.id}'
        
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        data = response.json()
        self.assertIn('message', data)
        self.assertIn('deleted_connection_id', data)
        self.assertEqual(data['deleted_connection_id'], connection.id)
        
        # 데이터베이스에서 삭제되었는지 확인
        self.assertFalse(MaterialProduct.objects.filter(id=connection.id).exists())

    def test_delete_material_product_connection_nonexistent(self):
        """존재하지 않는 연결 삭제 시도 테스트"""
        url = '/v1/stock/materialproduct/connection/999'
        
        response = self.client.delete(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('해당 연결을 찾을 수 없습니다', response.json().get('detail', ''))

<<<<<<< HEAD
=======
    def test_patch_material_product_connection(self):
        # 연결 생성
        connection = MaterialProduct.objects.create(
            product=self.product1,
            material=self.material1,
            quantity=100.0
        )
        url = f'/v1/stock/materialproduct/connection/{connection.id}'
        payload = {'quantity': 777.0}
        response = self.client.patch(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['quantity'], 777.0)
        connection.refresh_from_db()
        self.assertEqual(float(connection.quantity), 777.0)

>>>>>>> fb70c120b1ed6d3b6149272fc7561cd66c18b44d
    def test_create_material_product_connections_without_auth(self):
        """인증 없이 연결 생성 시도 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': self.product1.id,
            'connections': [
                {'id': self.material1.id, 'quantity': 500.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [401, 403])

    def test_get_material_product_connections_without_auth(self):
        """인증 없이 연결 조회 시도 테스트"""
        url = f'/v1/stock/materialproduct/{self.product1.id}?type=product'
        
        response = self.client.get(url)
        
        self.assertIn(response.status_code, [401, 403])

    def test_delete_material_product_connection_without_auth(self):
        """인증 없이 연결 삭제 시도 테스트"""
        # 먼저 연결 생성
        connection = MaterialProduct.objects.create(
            product=self.product1,
            material=self.material1,
            quantity=500.0
        )
        
        url = f'/v1/stock/materialproduct/connection/{connection.id}'
        
        response = self.client.delete(url)
        
        self.assertIn(response.status_code, [401, 403])

    def test_create_material_product_connections_empty_connections(self):
        """빈 연결 리스트로 생성 시도 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': self.product1.id,
            'connections': []
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인 (생성된 연결이 없음)
        data = response.json()
        self.assertEqual(data['total_count'], 0)
        self.assertEqual(len(data['created_connections']), 0)

    def test_create_material_product_connections_negative_quantity(self):
        """음수 수량으로 연결 생성 시도 테스트"""
        url = '/v1/stock/materialproduct'
        
        payload = {
            'type': 'product',
            'target_id': self.product1.id,
            'connections': [
                {'id': self.material1.id, 'quantity': -500.0}
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        # 음수 수량도 허용되는지 확인 (모델에서 DecimalField 사용)
        self.assertEqual(response.status_code, 200)
        
        # 데이터베이스에 음수 값이 저장되었는지 확인
        connection = MaterialProduct.objects.get(product=self.product1, material=self.material1)
        self.assertEqual(float(connection.quantity), -500.0)