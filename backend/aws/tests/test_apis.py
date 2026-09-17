from django.test import TestCase, override_settings
from unittest.mock import AsyncMock, MagicMock, patch
from user.api import router as user_router
from aws.api import router
from ninja.testing import TestAsyncClient
from user.models import User
from user.models import EmailVerification


class TestAWS(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.auth_client = TestAsyncClient(user_router)
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password1234!",
        )
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

    async def authenticate(self):
        data = {
            "email": self.user.email,
            "password": "password1234!",
        }
        response = await self.auth_client.post("/login", json=data)
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn("refresh_token", response.json())
        return {
            "Authorization": f"Bearer {data['access_token']}",
        }

    @override_settings(
        AWS_STORAGE_BUCKET_NAME="test-bucket",
        AWS_CLOUDFRONT_URL="https://cdn.example.com",
    )
    @patch("aws.api.get_boto3_s3_client", new_callable=AsyncMock)
    async def test_upload_file(self, mock_get_s3_client):
        """
        실제 AWS 연결 없이 S3 업로드 서명 응답 계약을 테스트
        """
        s3_client = MagicMock()
        s3_client.generate_presigned_post.return_value = {
            "url": "https://s3.example.com/test-bucket",
            "fields": {"key": "objects/test/test_image.png"},
        }
        mock_get_s3_client.return_value = s3_client

        headers = await self.authenticate()
        payload = {
            "file_name": "test_image.png",
        }
        response = await self.client.post("/upload", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            data["upload_url"]["url"],
            s3_client.generate_presigned_post.return_value["url"],
        )
        self.assertTrue(
            data["object_url"].startswith("https://cdn.example.com/objects/")
        )
        s3_client.generate_presigned_post.assert_called_once()
