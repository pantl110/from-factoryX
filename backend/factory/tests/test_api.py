from django.test import TestCase
from user.api import router as user_router
from factory.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from factory.models import Factory
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
