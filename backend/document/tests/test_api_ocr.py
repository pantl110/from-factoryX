from django.test import TestCase
from ninja.testing import TestAsyncClient
from pathlib import Path
import aiofiles
import base64
from unittest.mock import AsyncMock, patch
from asgiref.sync import sync_to_async

from user.api import router as user_router
from document.api_quotation import router as quotation_router

from user.models import User
from user.models import EmailVerification
from factory.models import Factory, FactoryMember
from stock.models import Product


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

        self.product = Product.objects.create(
            factory=self.factory,
            code="P-001",
            name="테스트 제품",
            spec="10kg",
            unit="EA",
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

    @patch("document.api_quotation.content_ocr_document_parse", new_callable=AsyncMock)
    async def test_order_ocr_passes_document_role(self, mock_ocr):
        """주문서 OCR은 발주자를 수주처로 판별할 수 있게 문서 유형을 전달한다."""
        mock_ocr.return_value = {
            "client_info": {"company_name": "발주 고객사"},
            "request_items": [
                {
                    "item_name": "테스트 제품",
                    "item_code": "Ｐ-001",
                    "spec": "OCR 규격",
                    "unit": "BOX",
                    "quantity": "2",
                    "unit_price": "1000",
                }
            ],
        }
        headers = await self.authenticate()
        async with aiofiles.open(self.pdf_file_path, "rb") as f:
            content = await f.read()

        response = await self.quotation_client.post(
            f"/ocr?factory_id={self.factory.id}",
            headers=headers,
            json={
                "data": base64.b64encode(content).decode("utf-8"),
                "document_type": "order",
            },
        )

        self.assertEqual(response.status_code, 200)
        mock_ocr.assert_awaited_once_with(content, document_type="order")
        item = response.json()["request_items"][0]
        self.assertEqual(item["product_id"], self.product.id)
        self.assertEqual(item["item_code"], self.product.code)
        self.assertEqual(item["item_name"], self.product.name)
        self.assertEqual(item["spec"], self.product.spec)
        self.assertEqual(item["unit"], self.product.unit)

    @patch("document.api_quotation.content_ocr_document_parse", new_callable=AsyncMock)
    async def test_ocr_does_not_match_ambiguous_product_names(self, mock_ocr):
        """동명 제품이 여러 개면 제품명만으로 임의 연결하지 않는다."""
        await sync_to_async(Product.objects.create)(
            factory=self.factory,
            code="P-002",
            name=self.product.name,
            spec="20kg",
            unit="BOX",
        )
        mock_ocr.return_value = {
            "client_info": {"company_name": "발주 고객사"},
            "request_items": [
                {
                    "item_name": self.product.name,
                    "item_code": "",
                    "spec": "",
                    "unit": "EA",
                    "quantity": "1",
                    "unit_price": "1000",
                }
            ],
        }
        headers = await self.authenticate()
        async with aiofiles.open(self.pdf_file_path, "rb") as f:
            content = await f.read()

        response = await self.quotation_client.post(
            f"/ocr?factory_id={self.factory.id}",
            headers=headers,
            json={
                "data": base64.b64encode(content).decode("utf-8"),
                "document_type": "order",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["request_items"][0]["product_id"])
