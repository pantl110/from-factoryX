from django.test import TestCase, Client
from user.models import User
from factory.models import Factory, FactoryClient
from project.models import Project
from document.models import Quotation

class QuotationActionAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="pw", email="testuser@example.com")
        self.factory = Factory.objects.create(owner=self.user, name="Test Factory")
        self.client_obj = FactoryClient.objects.create(factory=self.factory, name="Client1")
        self.project = Project.objects.create()
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_obj,
            project=self.project,
            due_date="2025-07-31"
        )
        
        # JWT 인증 로그인
        self.login()

    def login(self):
        # JWT 로그인
        response = self.client.post(
            "/v1/auth/login",
            {"email": self.user.email, "password": "pw"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        tokens = response.json()
        self.assertIn("access_token", tokens)
        
        # Authorization 헤더에 Bearer 토큰 설정
        self.client.defaults['HTTP_AUTHORIZATION'] = f"Bearer {tokens['access_token']}"

    def test_generate_tax_invoice_success(self):
        """
        세금계산서 생성 요청 성공 테스트
        """
        url = f"/v1/document/quotation/quotations/{self.quotation.id}/generate-tax-invoice/"
        payload = {"issue_type": "normal"}
        response = self.client.post(url, payload, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 202)  # Accepted (비동기 처리)
        self.assertIn("세금계산서", response.json()["message"])

    def test_generate_tax_invoice_invalid_id(self):
        """
        존재하지 않는 견적서 ID로 세금계산서 생성 요청 테스트
        """
        url = f"/v1/document/quotation/quotations/99999/generate-tax-invoice/"
        payload = {"issue_type": "normal"}
        response = self.client.post(url, payload, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 404)  # Not Found

    def test_generate_tax_invoice_no_permission(self):
        """
        다른 사용자의 견적서에 대한 권한 없는 세금계산서 생성 요청 테스트
        """
        # 다른 사용자 및 관련 데이터 생성
        other_user = User.objects.create_user(username="other", password="pw", email="other@example.com")
        other_factory = Factory.objects.create(owner=other_user, name="Other Factory")
        other_client = FactoryClient.objects.create(factory=other_factory, name="Other Client")
        
        # 다른 사용자의 Project와 Quotation 생성
        other_project = Project.objects.create()
        other_quotation = Quotation.objects.create(
            factory=other_factory,
            client=other_client,
            project=other_project,
            due_date="2025-08-01"
        )
        
        # 다른 사용자의 견적서에 대해 세금계산서 생성 요청
        url = f"/v1/document/quotation/quotations/{other_quotation.id}/generate-tax-invoice/"
        payload = {"issue_type": "normal"}
        response = self.client.post(url, payload, content_type="application/json")
        
        # 응답 검증 (권한 없음으로 404 반환)
        self.assertEqual(response.status_code, 404)  # Not Found

    def test_generate_tax_invoice_missing_required_field(self):
        """
        필수 필드 누락 시 세금계산서 생성 요청 테스트
        """
        url = f"/v1/document/quotation/quotations/{self.quotation.id}/generate-tax-invoice/"
        payload = {}  # issue_type 누락
        response = self.client.post(url, payload, content_type="application/json")
        
        # 응답 검증 (400 Bad Request 또는 422 Unprocessable Entity)
        self.assertIn(response.status_code, [400, 422])

    def test_generate_tax_invoice_async_trigger(self):
        """
        세금계산서 생성 비동기 작업 트리거 테스트
        """
        url = f"/v1/document/quotation/quotations/{self.quotation.id}/generate-tax-invoice/"
        payload = {"issue_type": "normal"}
        response = self.client.post(url, payload, content_type="application/json")
        
        # 응답 검증
        self.assertEqual(response.status_code, 202)  # Accepted
        # 실제로는 비동기 작업 큐에 태워졌는지 mock/assert 가능

    def test_generate_tax_invoice_extra_fields(self):
        """
        추가 필드가 포함된 세금계산서 생성 요청 테스트
        """
        url = f"/v1/document/quotation/quotations/{self.quotation.id}/generate-tax-invoice/"
        payload = {"issue_type": "normal", "extra_field": "value"}
        response = self.client.post(url, payload, content_type="application/json")
        
        # 응답 검증 (추가 필드는 무시되고 정상 처리되어야 함)
        self.assertEqual(response.status_code, 202)  # Accepted 