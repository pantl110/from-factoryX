from django.test import TestCase
from ninja.testing import TestAsyncClient
from pathlib import Path
import aiofiles
import base64

from user.api import router as user_router
from document.api_quotation import router as quotation_router

from user.models import User
from user.models import EmailVerification


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

    async def test_ocr_pdf_upload(self):
        """Test uploading a PDF file to the OCR endpoint"""
        # Authenticate first
        headers = await self.authenticate()
        # Prepare the file for upload``
        async with aiofiles.open(self.pdf_file_path, "rb") as f:
            content = await f.read()
        payload = {
            "data": base64.b64encode(content).decode("utf-8"),
        }
        # Upload the PDF file - Django client handles file uploads differently
        response = await self.quotation_client.post(
            "/ocr",
            headers=headers,
            json=payload,
        )
        print(response.json())

        # Assert response
        # self.assertEqual(response.status_code, 200)
        # data = response.json()
        # self.assertEqual(data["status"], "success")
        # self.assertEqual(data["filename"], "test1.pdf")
        # self.assertEqual(data["content_type"], "application/pdf")
        # self.assertGreater(data["size"], 0)

    # async def test_ocr_jpg_upload(self):
    #     """Test uploading a JPG file to the OCR endpoint"""
    #     # Authenticate first
    #     auth_headers = await self.authenticate()

    #     # Prepare the file for upload
    #     with open(self.jpg_file_path, "rb") as f:
    #         # Upload the JPG file - consistent with the PDF test method
    #         response = await self.quotation_client.post(
    #             "/ocr", {"file": f}, HTTP_AUTHORIZATION=auth_headers["Authorization"]
    #         )

    #     # Assert response
    #     self.assertEqual(response.status_code, 200)
    #     data = response.json()
    #     self.assertEqual(data["status"], "success")
    #     self.assertEqual(data["filename"], "test1_01.jpg")
    #     self.assertEqual(data["content_type"], "image/jpeg")
    #     self.assertGreater(data["size"], 0)
