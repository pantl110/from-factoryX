import json
import jwt
from datetime import datetime, timedelta, date
from django.test import TestCase
from django.conf import settings
from django.utils import timezone
from user.models import User
from factory.models import Factory, FactoryMember, FactoryEquipment
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from stock.models import Product
from notification.models import Notification
from unittest.mock import patch, AsyncMock
from stock.models import Material, MaterialProduct


class SchedulingAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(
            name="테스트 공장", owner=self.user, business_address="서울시 강남구"
        )

        # FactoryMember 생성
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 설비 생성
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 설비", priority=1
        )

        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="테스트 제품",
            code="TEST001",
            unit="개",
            spec="테스트 규격",
        )

        # 프로젝트 생성 (pending 상태로 설정하여 알림 대상이 되도록)
        self.project = Project.objects.create(
            name="테스트 프로젝트", status=Project.ProjectStatus.pending
        )

        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            project=self.project,
            due_date=date.today() + timedelta(days=2),  # 2일 후 마감
            due_date_notification=False,
        )

        # 견적서 제품 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation, product=self.product, quantity=10, unit_price=5000
        )

        # 프로젝트 계획 생성
        self.project_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=10,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() - timedelta(hours=1),  # 1시간 전 마감
            avg_production_time=3600,
            end_notification=False,
        )

        self.token = self.generate_jwt_token()
        self.headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": settings.SCHEDULING_SECRET_KEY,
        }

    def generate_jwt_token(self):
        return jwt.encode(
            {"user_id": self.user.id, "exp": timezone.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )


class ProjectPlanStartStatusChangeTestCase(SchedulingAPITestCase):
    """프로젝트 생산 계획 시작 상태변경 테스트"""

    def setUp(self):
        super().setUp()
        # 프로젝트를 production 상태로 변경
        self.project.status = Project.ProjectStatus.production
        self.project.save()

        # 자재 생성
        self.material = Material.objects.create(
            factory=self.factory,
            name="테스트 자재",
            code="MAT001",
            unit="kg",
            current_stock=100,
        )

        # 자재-제품 관계 생성
        self.material_product = MaterialProduct.objects.create(
            product=self.product,
            material=self.material,
            quantity=5,  # 제품 1개당 자재 5kg 필요
        )

        # pending 상태의 프로젝트 계획 생성 (시작일이 지남)
        self.pending_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.pending,
            quantity=10,  # 총 50kg 자재 필요 (5 * 10)
            start_date=timezone.now() - timedelta(hours=1),  # 1시간 전 시작 예정
            end_date=timezone.now() + timedelta(hours=5),
            avg_production_time=1800,
        )

    def test_project_plan_start_status_change_success(self):
        """프로젝트 계획 시작 상태변경 성공 테스트 (원본 엔드포인트)"""
        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 1)

        # 프로젝트 계획 상태가 production으로 변경되었는지 확인
        self.pending_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )

    def test_project_plan_start_status_change_upgrade_success(self):
        """프로젝트 계획 시작 상태변경 성공 테스트"""
        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 1)

        # 프로젝트 계획 상태가 production으로 변경되었는지 확인
        self.pending_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )

    # def test_project_plan_start_insufficient_material_stock(self):
    #     """자재 재고 부족 시 상태변경 안됨 테스트"""
    #     # 자재 재고를 부족하게 설정 (필요: 50kg, 보유: 30kg)
    #     self.material.current_stock = 30
    #     self.material.save()

    #     url = "/v1/scheduling/project-plan/start"

    #     response = self.client.get(url, headers=self.headers)

    #     self.assertEqual(response.status_code, 200)
    #     data = response.json()
    #     self.assertEqual(data["plans"], 0)

    #     # 프로젝트 계획 상태가 pending으로 유지되어야 함
    #     self.pending_plan.refresh_from_db()
    #     self.assertEqual(self.pending_plan.status, ProjectPlan.ProductionStatus.pending)

    # def test_project_plan_start_upgrade_insufficient_material_stock(self):
    #     """자재 재고 부족 시 상태변경 안됨 테스트"""
    #     # 자재 재고를 부족하게 설정
    #     self.material.current_stock = 30
    #     self.material.save()

    #     url = "/v1/scheduling/project-plan/start"

    #     response = self.client.get(url, headers=self.headers)

    #     self.assertEqual(response.status_code, 200)
    #     data = response.json()
    #     self.assertEqual(data["plans"], 0)

    #     # 프로젝트 계획 상태가 pending으로 유지되어야 함
    #     self.pending_plan.refresh_from_db()
    #     self.assertEqual(self.pending_plan.status, ProjectPlan.ProductionStatus.pending)

    def test_project_plan_start_future_start_date(self):
        """시작 예정일이 미래인 경우 상태변경 안됨 테스트"""
        # 시작일을 미래로 설정
        self.pending_plan.start_date = timezone.now() + timedelta(hours=1)
        self.pending_plan.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 0)

        # 프로젝트 계획 상태가 pending으로 유지되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(self.pending_plan.status, ProjectPlan.ProductionStatus.pending)

    def test_project_plan_start_upgrade_future_start_date(self):
        """시작 예정일이 미래인 경우 상태변경 안됨 테스트"""
        # 시작일을 미래로 설정
        self.pending_plan.start_date = timezone.now() + timedelta(hours=1)
        self.pending_plan.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 0)

        # 프로젝트 계획 상태가 pending으로 유지되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(self.pending_plan.status, ProjectPlan.ProductionStatus.pending)

    def test_project_plan_start_non_production_project(self):
        """프로젝트가 생산중 상태가 아닌 경우 테스트"""
        # 프로젝트 상태를 pending으로 변경
        self.project.status = Project.ProjectStatus.pending
        self.project.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 0)

        # 프로젝트 계획 상태가 pending으로 유지되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(self.pending_plan.status, ProjectPlan.ProductionStatus.pending)

    def test_project_plan_start_upgrade_non_production_project(self):
        """프로젝트가 생산중 상태가 아닌 경우 테스트"""
        # 프로젝트 상태를 pending으로 변경
        self.project.status = Project.ProjectStatus.pending
        self.project.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 0)

        # 프로젝트 계획 상태가 pending으로 유지되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(self.pending_plan.status, ProjectPlan.ProductionStatus.pending)

    def test_project_plan_start_already_production_status(self):
        """이미 production 상태인 계획은 처리 안됨 테스트"""
        # 프로젝트 계획을 production 상태로 변경
        self.pending_plan.status = ProjectPlan.ProductionStatus.production
        self.pending_plan.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 0)

    def test_project_plan_start_upgrade_already_production_status(self):
        """이미 production 상태인 계획은 처리 안됨 테스트"""
        # 프로젝트 계획을 production 상태로 변경
        self.pending_plan.status = ProjectPlan.ProductionStatus.production
        self.pending_plan.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 0)

    def test_project_plan_start_multiple_plans(self):
        """여러 프로젝트 계획 동시 처리 테스트"""
        # 추가 프로젝트 계획 생성
        additional_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.pending,
            quantity=5,  # 총 25kg 자재 필요 (5 * 5)
            start_date=timezone.now() - timedelta(minutes=30),
            end_date=timezone.now() + timedelta(hours=3),
            avg_production_time=1200,
        )

        # 총 자재 필요량: 50kg + 25kg = 75kg, 보유: 100kg (충분)
        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 2)

        # 두 프로젝트 계획 모두 production 상태로 변경되었는지 확인
        self.pending_plan.refresh_from_db()
        additional_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )
        self.assertEqual(
            additional_plan.status, ProjectPlan.ProductionStatus.production
        )

    def test_project_plan_start_upgrade_multiple_plans(self):
        """여러 프로젝트 계획 동시 처리 테스트"""
        # 추가 프로젝트 계획 생성
        additional_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.pending,
            quantity=5,
            start_date=timezone.now() - timedelta(minutes=30),
            end_date=timezone.now() + timedelta(hours=3),
            avg_production_time=1200,
        )

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 2)

        # 두 프로젝트 계획 모두 production 상태로 변경되었는지 확인
        self.pending_plan.refresh_from_db()
        additional_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )
        self.assertEqual(
            additional_plan.status, ProjectPlan.ProductionStatus.production
        )

    def test_project_plan_start_without_scheduling_key(self):
        """스케줄링 키 없이 접근하는 경우 테스트"""
        url = "/v1/scheduling/project-plan/start"
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        response = self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 401)

    def test_project_plan_start_upgrade_without_scheduling_key(self):
        """스케줄링 키 없이 접근하는 경우 테스트"""
        url = "/v1/scheduling/project-plan/start"
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        response = self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 401)

    def test_project_plan_start_invalid_scheduling_key(self):
        """잘못된 스케줄링 키로 접근하는 경우 테스트"""
        url = "/v1/scheduling/project-plan/start"
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": "invalid_key",
        }

        response = self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 403)

    def test_project_plan_start_upgrade_invalid_scheduling_key(self):
        """잘못된 스케줄링 키로 접근하는 경우 테스트"""
        url = "/v1/scheduling/project-plan/start"
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.token}",
            "X-Scheduling-Key": "invalid_key",
        }

        response = self.client.get(url, headers=headers)

        self.assertEqual(response.status_code, 403)

    def test_project_plan_start_no_material_products(self):
        """자재-제품 관계가 없는 경우 테스트"""
        # 기존 자재-제품 관계 삭제
        self.material_product.delete()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 1)

        # 자재가 없으면 상태가 변경되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )

    def test_project_plan_start_upgrade_no_material_products(self):
        """자재-제품 관계가 없는 경우 테스트"""
        # 기존 자재-제품 관계 삭제
        self.material_product.delete()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 1)

        # 자재가 없으면 상태가 변경되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )

    def test_compare_original_vs_upgrade_endpoints(self):
        """원본과 업그레이드 엔드포인트 결과 비교 테스트"""
        # 동일한 데이터로 두 엔드포인트 테스트

        # 첫 번째 계획으로 원본 엔드포인트 테스트
        original_response = self.client.get(
            "/v1/scheduling/project-plan/start", headers=self.headers
        )

        # 계획 상태 초기화
        self.pending_plan.status = ProjectPlan.ProductionStatus.pending
        self.pending_plan.save()

        # 같은 계획으로 업그레이드 엔드포인트 테스트
        upgrade_response = self.client.get(
            "/v1/scheduling/project-plan/start", headers=self.headers
        )

        # 두 응답이 동일해야 함
        self.assertEqual(original_response.status_code, upgrade_response.status_code)
        self.assertEqual(original_response.json(), upgrade_response.json())

    def test_edge_case_exact_material_requirement(self):
        """자재가 정확히 필요한 만큼만 있는 경우 테스트"""
        # 자재 재고를 정확히 필요한 만큼만 설정 (필요: 50kg, 보유: 50kg)
        self.material.current_stock = 50
        self.material.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 1)

        # 정확히 맞으면 상태가 변경되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )

    def test_edge_case_upgrade_exact_material_requirement(self):
        """자재가 정확히 필요한 만큼만 있는 경우 테스트"""
        # 자재 재고를 정확히 필요한 만큼만 설정
        self.material.current_stock = 50
        self.material.save()

        url = "/v1/scheduling/project-plan/start"

        response = self.client.get(url, headers=self.headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["plans"], 1)

        # 정확히 맞으면 상태가 변경되어야 함
        self.pending_plan.refresh_from_db()
        self.assertEqual(
            self.pending_plan.status, ProjectPlan.ProductionStatus.production
        )
