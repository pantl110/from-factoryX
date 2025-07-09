from django.test import TestCase, Client
from user.models import User
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from factory.models import Factory, FactoryEquipment, FactoryClient
from stock.models import Product
import datetime
import json
import jwt
from django.conf import settings

class ProjectAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(email="test@user.com", password="pw1234!")
        self.factory = Factory.objects.create(owner=self.user, name="공장", business_registration_number="123-45-67890")
        self.factory_client = FactoryClient.objects.create(
            factory=self.factory,
            name="Test Client",
            business_registration_number="987-65-43210",
            representative_name="홍길동",
            email="test@client.com",
            phone="010-1234-5678",
        )
        self.project = Project.objects.create(status=Project.ProjectStatus.quotation)
        self.quotation = Quotation.objects.create(factory=self.factory, client=self.factory_client, project=self.project, due_date=datetime.date.today())
        self.equipment = FactoryEquipment.objects.create(factory=self.factory, name="설비1", priority=1)
        self.stock_product = Product.objects.create(
            factory=self.factory,
            name="테스트제품",
            code="P001",
            unit="EA",
            spec="스펙",
            current_stock=100,
        )
        self.product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.stock_product,
            quantity=1,
            unit_price=1000
        )
        
        # JWT 토큰 생성
        self.token = jwt.encode(
            {
                "user_id": self.user.id,
                "exp": datetime.datetime.now() + datetime.timedelta(hours=1)
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

    def test_create_project(self):
        """
        프로젝트 생성 테스트
        """
        payload = {"quotation_id": self.quotation.id}
        response = self.client.post("/v1/project/projects", data=json.dumps(payload), content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], Project.ProjectStatus.quotation)

    def test_list_active_projects(self):
        """
        활성 프로젝트 목록 조회 
        테스트"""
        Project.objects.create(status=Project.ProjectStatus.quotation)
        response = self.client.get("/v1/project/projects/active", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 페이지네이션된 응답 구조 확인
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)

    def test_update_project(self):
        """
        프로젝트 수정 테스트
        """
        project = Project.objects.create(status=Project.ProjectStatus.quotation)
        payload = {"status": Project.ProjectStatus.pending}
        response = self.client.patch(f"/v1/project/projects/{project.id}", data=json.dumps(payload), content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], Project.ProjectStatus.pending)

    def test_delete_project(self):
        """
        프로젝트 삭제 API 테스트
        """
        project = Project.objects.create(status=Project.ProjectStatus.quotation)
        response = self.client.delete(f"/v1/project/projects/{project.id}", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 204)

    def test_create_project_plan(self):
        """
        생산계획 생성 API 테스트
        """
        project = Project.objects.create(status=Project.ProjectStatus.quotation)
        payload = {
            "product_id": self.product.id,
            "quantity": 10,
            "equipment_id": self.equipment.id,
            "start_date": str(datetime.date.today()),
            "end_date": str(datetime.date.today()),
            "avg_production_time": 100
        }
        response = self.client.post(f"/v1/project/projects/{project.id}/plans", data=json.dumps(payload), content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["quantity"], 10)

    def test_list_project_plans(self):
        """
        생산계획 목록 조회 API 테스트
        """
        project = Project.objects.create(status=Project.ProjectStatus.quotation)
        ProjectPlan.objects.create(
            project=project, product=self.product, quantity=1, equipment=self.equipment,
            start_date=datetime.date.today(), end_date=datetime.date.today(),
            avg_production_time=10, status=ProjectPlan.ProductionStatus.pending
        )
        response = self.client.get(f"/v1/project/projects/{project.id}/plans", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 페이지네이션된 응답 구조 확인
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)

    def test_update_project_plan(self):
        """
        생산계획 수정 API 테스트
        """
        project = Project.objects.create(status=Project.ProjectStatus.quotation)
        plan = ProjectPlan.objects.create(
            project=project, product=self.product, quantity=1, equipment=self.equipment,
            start_date=datetime.date.today(), end_date=datetime.date.today(),
            avg_production_time=10, status=ProjectPlan.ProductionStatus.pending
        )
        payload = {"quantity": 5}
        response = self.client.patch(f"/v1/project/plans/{plan.id}", data=json.dumps(payload), content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["quantity"], 5)
