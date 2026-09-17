from django.test import TestCase
from ninja.testing import TestAsyncClient
from pathlib import Path
import aiofiles
import base64
from unittest.mock import AsyncMock, patch

from user.api import router as user_router
from document.api_quotation import router as quotation_router

from user.models import User
from user.models import EmailVerification
from factory.models import Factory, FactoryMember


class TestDocumentOCR(TestCase):
    """Document OCR API tests"""

    def setUp(self):
        # API clients for authentication and document API
        self.auth_client = TestAsyncClient(user_router)
        self.quotation_client = TestAsyncClient(quotation_router)

        # Create a user & factory that owns the equipment
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password1234!",
        )
        
        # Create factory
        self.factory = Factory.objects.create(
            name='테스트 공장',
            owner=self.user
        )
        
        # Create factory member
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role='admin',
            status='active',
            invited_by=self.user
        )
        
        self.verification = EmailVerification.objects.create(
            email=self.user.email,
            code="123456",
            verification_type=EmailVerification.TypeChoice.SIGNUP,
            is_verified=True,
        )

        # Define test file paths
        self.test_data_dir = Path(__file__).parent / "data"
        self.pdf_file_path = self.test_data_dir / "test1.pdf"
        self.jpg_file_path = self.test_data_dir / "test1_01.jpg"

    async def authenticate(self):
        """Obtain JWT access token and return Authorization headers."""
        data = {
            "email": self.user.email,
            "password": "password1234!",  # password validation is disabled in user.api.login
        }
        response = await self.auth_client.post("/login", json=data)
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        return {
            "Authorization": f"Bearer {tokens['access_token']}",
        }

    @patch("document.api_quotation.content_ocr_document_parse", new_callable=AsyncMock)
    async def test_ocr_pdf_upload(self, mock_ocr):
        """PDF 파일 OCR 업로드 기본 동작 테스트 (썸네일 옵션 없이)"""
        mock_ocr.return_value = {
            "client_info": {"company_name": "테스트 거래처"},
            "request_items": [
                {
                    "item_name": "테스트 제품",
                    "unit": "EA",
                    "quantity": "1",
                    "unit_price": "1000",
                }
            ],
        }
        headers = await self.authenticate()
        async with aiofiles.open(self.pdf_file_path, "rb") as f:
            content = await f.read()
        payload = {
            "data": base64.b64encode(content).decode("utf-8"),
        }
        response = await self.quotation_client.post(
            f"/ocr?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)
        # 기본 OCR 결과 구조 확인
        self.assertIn("client_info", data)
        self.assertIn("request_items", data)

    @patch("document.api_quotation.render_pdf_first_page_to_image")
    @patch("document.api_quotation.content_ocr_document_parse", new_callable=AsyncMock)
    async def test_ocr_pdf_upload_with_thumbnail(self, mock_ocr, mock_render):
        """PDF 파일 OCR 업로드 + 썸네일 생성 옵션 테스트"""
        mock_ocr.return_value = {
            "client_info": {"company_name": "테스트 거래처"},
            "request_items": [
                {
                    "item_name": "테스트 제품",
                    "unit": "EA",
                    "quantity": "1",
                    "unit_price": "1000",
                }
            ],
        }
        mock_render.return_value = b"test-thumbnail"
        headers = await self.authenticate()
        async with aiofiles.open(self.pdf_file_path, "rb") as f:
            content = await f.read()
        payload = {
            "data": base64.b64encode(content).decode("utf-8"),
            "include_thumbnail": True,
        }
        response = await self.quotation_client.post(
            f"/ocr?factory_id={self.factory.id}",
            headers=headers,
            json=payload,
        )
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("client_info", data)
        self.assertIn("request_items", data)
        # 썸네일 필드는 존재해야 하며, 생성 실패 시 None 일 수 있음
        self.assertIn("thumbnail_image", data)
        self.assertEqual(
            data["thumbnail_image"],
            base64.b64encode(b"test-thumbnail").decode("ascii"),
        )
