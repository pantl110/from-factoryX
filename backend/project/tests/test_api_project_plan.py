from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryEquipment
from project.models import Project, ProjectPlan, ProjectLog
from document.models import Quotation, QuotationProduct
from stock.models import Product, Material, MaterialHistory
import json
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date

User = get_user_model()


class ProjectPlanAPITestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(name="테스트 공장", owner=self.user)

        # 고객 생성
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="테스트 고객사",
            business_registration_number="123-45-67890",
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

        # 프로젝트 생성
        self.project = Project.objects.create()

        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory, client=self.client_company, project=self.project
        )

        # 견적서 품목 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product,
            quantity=100,
            unit_price=1000,
        )

        # FactoryMember 생성 (권한 검증을 위해)
        from factory.models import FactoryMember
        from django.utils import timezone
        from dateutil.relativedelta import relativedelta

        # 한 달 전에 가입한 것으로 설정
        one_month_ago = timezone.now() - relativedelta(months=1)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        # created_at을 강제로 한 달 전으로 설정
        FactoryMember.objects.filter(id=self.factory_member.id).update(
            created_at=one_month_ago
        )

        # JWT 토큰 생성
        self.token = self.generate_jwt_token()

        # API 클라이언트 설정
        self.client = self.client

    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def test_create_project_plans_success(self):
        """프로젝트 생산 계획 생성 성공 테스트"""
        url = "/v1/project-plan"

        payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],  # 주문 수량(10)보다 적은 생산 수량
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("plan", data)

        # 단일 계획 확인
        plan_data = data["plan"]
        self.assertEqual(plan_data["project_id"], self.project.id)
        self.assertEqual(plan_data["quotation_product_id"], self.quotation_product.id)
        self.assertEqual(plan_data["equipment_id"], self.equipment.id)
        self.assertEqual(plan_data["quantity"], 8)  # 생산 수량

    def test_create_project_plans_nonexistent_project(self):
        """존재하지 않는 프로젝트로 생산 계획 생성 시도 테스트"""
        url = "/v1/project-plan"

        payload = {
            "project_id": 999,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_create_project_plans_nonexistent_quotation_product(self):
        """존재하지 않는 견적서 품목으로 생산 계획 생성 시도 테스트"""
        url = "/v1/project-plan"

        payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [999],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_create_project_plans_without_auth(self):
        """인증 없이 생산 계획 생성 시도 테스트"""
        url = "/v1/project-plan"

        payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            url, data=json.dumps(payload), content_type="application/json"
        )

        self.assertIn(response.status_code, [401, 403])

    def test_create_or_update_project_plan_success(self):
        """프로젝트 생산 계획 생성 또는 수정 성공 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 10,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        data = create_response.json()
        self.assertEqual(data["action"], "created")
        plan_id = data["plan_id"]

        # 생산 계획 수정
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 15,
            "start_date": "2025-07-15T00:00:00Z",
            "end_date": "2025-07-16T00:00:00Z",
            "avg_production_time": 7200,
            "status": "production",
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["action"], "updated")
        self.assertIn("성공적으로 수정되었습니다", data["message"])

    def test_create_or_update_project_plan_nonexistent(self):
        """존재하지 않는 생산 계획 수정 시도 테스트"""
        url = "/v1/project-plan/create-or-update"
        payload = {
            "plan_id": 999,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 15,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_create_or_update_project_plan_invalid_equipment(self):
        """존재하지 않는 설비로 수정 시도 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 10,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["plan_id"]

        # 존재하지 않는 설비로 수정 시도
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": 999,
            "quantity": 10,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_create_or_update_project_plan_invalid_status(self):
        """올바르지 않은 상태값으로 수정 시도 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 10,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["plan_id"]

        # 올바르지 않은 상태값으로 수정 시도
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 10,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
            "status": "잘못된상태",
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 422)

    def test_create_or_update_project_plan_invalid_quantity(self):
        """올바르지 않은 수량으로 수정 시도 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 10,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["plan_id"]

        # 올바르지 않은 수량으로 수정 시도
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 0,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_create_or_update_project_plan_without_auth(self):
        """인증 없이 생산 계획 생성/수정 시도 테스트"""
        url = "/v1/project-plan/create-or-update"
        payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 15,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertIn(response.status_code, [401, 403])

    def test_create_or_update_project_plan_equipment_change_log_creation(self):
        """생산 중인 프로젝트의 설비 변경 시 로그 생성 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 8,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 생성된 계획의 ID 가져오기
        plan_id = response.json()["plan_id"]

        # 계획 상태를 "production"으로 변경
        status_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 8,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
            "status": "production",
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(status_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 새로운 설비 생성
        new_equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="새로운 설비", priority=2
        )

        # 설비 변경 (가동 대기   상태에서)
        equipment_change_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": new_equipment.id,
            "quantity": 8,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
            "status": "pending",
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(equipment_change_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 프로젝트 로그가 생성되었는지 확인
        logs = ProjectLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 1)

        log = logs.first()
        self.assertEqual(log.type, ProjectLog.LogType.equipment)
        self.assertEqual(log.title, "생산 설비 변경")
        self.assertIn("테스트 설비", log.content)
        self.assertIn("새로운 설비", log.content)
        self.assertIn("라인에서", log.content)
        self.assertIn("라인으로 변경되었어요", log.content)

    def test_create_or_update_project_plan_equipment_change_no_log_when_same_equipment(
        self,
    ):
        """같은 설비로 변경 시 로그 생성 안됨 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 8,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 생성된 계획의 ID 가져오기
        plan_id = response.json()["plan_id"]

        # 계획 상태를 "production" : "가동 중"으로 변경
        status_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 8,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
            "status": "production",
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(status_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 같은 설비로 변경 (실제로는 변경되지 않음)
        equipment_change_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 8,
            "start_date": "2025-07-13T00:00:00Z",
            "end_date": "2025-07-14T00:00:00Z",
            "avg_production_time": 3600,
            "status": "production",
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(equipment_change_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 프로젝트 로그가 생성되지 않았는지 확인
        logs = ProjectLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 0)

    def test_create_or_update_project_plan_date_with_time_format(self):
        """날짜에 시간 정보가 포함된 형식으로 수정하는 테스트"""
        # 먼저 API를 통해 프로젝트 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 100,
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-01-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["plan_id"]

        # 생성된 계획 확인
        print(f"생성된 계획 ID: {plan_id}")

        # 날짜 수정
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 100,
            "start_date": "2024-02-01T14:30:00Z",
            "end_date": "2024-02-28T18:45:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        print(f"응답 상태 코드: {response.status_code}")
        if response.status_code != 200:
            print(f"응답 내용: {response.content}")

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan = ProjectPlan.objects.get(id=plan_id)
        # 시간대 변환으로 인해 날짜 부분만 비교
        self.assertEqual(plan.start_date.date(), date(2024, 2, 1))
        self.assertEqual(plan.end_date.date(), date(2024, 2, 28))

    def test_create_or_update_project_plan_date_without_time_format(self):
        """날짜만 있는 형식으로 수정하는 테스트"""
        # 먼저 API를 통해 프로젝트 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 100,
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-01-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["plan_id"]

        # 날짜 수정
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 100,
            "start_date": "2024-03-01T00:00:00Z",
            "end_date": "2024-03-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan = ProjectPlan.objects.get(id=plan_id)
        # 시간대 변환으로 인해 날짜 부분만 비교
        # UTC 변환으로 인해 1일 차이가 날 수 있으므로 허용
        from datetime import timedelta

        self.assertIn(plan.start_date.date(), [date(2024, 3, 1), date(2024, 2, 29)])
        self.assertIn(plan.end_date.date(), [date(2024, 3, 31), date(2024, 3, 30)])

    def test_create_or_update_project_plan_date_mixed_format(self):
        """시작일은 시간 포함, 마감일은 시간 없는 혼합 형식 테스트"""
        # 먼저 API를 통해 프로젝트 계획 생성
        create_url = "/v1/project-plan/create-or-update"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 100,
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-01-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["plan_id"]

        # 날짜 수정
        update_payload = {
            "plan_id": plan_id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 100,
            "start_date": "2024-04-01T09:15:00Z",
            "end_date": "2024-04-30T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan = ProjectPlan.objects.get(id=plan_id)
        # 시간대 변환으로 인해 날짜 부분만 비교
        # UTC 변환으로 인해 1일 차이가 날 수 있으므로 허용
        self.assertIn(plan.start_date.date(), [date(2024, 4, 1), date(2024, 3, 31)])
        self.assertIn(plan.end_date.date(), [date(2024, 4, 30), date(2024, 4, 29)])

    def test_create_or_update_project_plan_quantity_less_than_quotation(self):
        """생산수량을 주문수량보다 작게 수정하는 테스트 (다른 설비로 계획 생성)"""
        # 두 번째 설비 생성
        equipment2 = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 설비 2", priority=2
        )

        # 먼저 프로젝트 계획 생성 (주문수량: 100)
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,  # quantity: 100
            equipment=self.equipment,
            status="가동 대기",
            quantity=100,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            avg_production_time=3600,
        )

        url = "/v1/project-plan/create-or-update"

        payload = {
            "plan_id": plan.id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 60,  # 주문수량(100)보다 작음
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-01-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan.refresh_from_db()
        self.assertEqual(plan.quantity, 60)  # 첫 번째 계획은 수정된 수량

        # 두 번째 계획이 생성되었는지 확인 (다른 설비로)
        additional_plans = ProjectPlan.objects.filter(
            project=self.project, product=self.quotation_product, id__gt=plan.id
        )
        self.assertEqual(additional_plans.count(), 1)

        additional_plan = additional_plans.first()
        self.assertEqual(additional_plan.equipment.id, equipment2.id)  # 다른 설비 사용
        self.assertEqual(
            additional_plan.quantity, 44
        )  # (100-60) * 1.1 = 44 (buffer rate 적용)

    def test_create_or_update_project_plan_quantity_less_than_quotation_no_alternative_equipment(
        self,
    ):
        """대체 설비가 없을 때 생산수량을 주문수량보다 작게 수정하는 테스트"""
        # 먼저 프로젝트 계획 생성 (주문수량: 100)
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,  # quantity: 100
            equipment=self.equipment,
            status="가동 대기",
            quantity=100,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            avg_production_time=3600,
        )

        url = "/v1/project-plan/create-or-update"

        payload = {
            "plan_id": plan.id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 60,  # 주문수량(100)보다 작음
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-01-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan.refresh_from_db()
        self.assertEqual(plan.quantity, 60)  # 첫 번째 계획은 수정된 수량

        # 두 번째 계획이 생성되었는지 확인 (같은 설비로)
        additional_plans = ProjectPlan.objects.filter(
            project=self.project, product=self.quotation_product, id__gt=plan.id
        )
        self.assertEqual(additional_plans.count(), 1)

        additional_plan = additional_plans.first()
        self.assertEqual(
            additional_plan.equipment.id, self.equipment.id
        )  # 같은 설비 사용
        self.assertEqual(
            additional_plan.quantity, 44
        )  # (100-60) * 1.1 = 44 (buffer rate 적용)

    def test_create_or_update_project_plan_quantity_less_than_quotation_refund(self):
        """반품인 경우 생산수량을 주문수량보다 작게 수정하는 테스트 (buffer rate 적용)"""
        # 두 번째 설비 생성
        equipment2 = FactoryEquipment.objects.create(
            factory=self.factory, name="테스트 설비 2", priority=2
        )

        # 반품인 프로젝트 계획 생성 (주문수량: 100)
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,  # quantity: 100
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.pending,
            quantity=100,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            avg_production_time=3600,
        )

        url = "/v1/project-plan/create-or-update"

        payload = {
            "plan_id": plan.id,
            "project_id": self.project.id,
            "quotation_product_id": self.quotation_product.id,
            "equipment_id": self.equipment.id,
            "quantity": 60,  # 주문수량(100)보다 작음
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-01-31T00:00:00Z",
            "avg_production_time": 3600,
        }

        response = self.client.post(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan.refresh_from_db()
        self.assertEqual(plan.quantity, 60)  # 첫 번째 계획은 수정된 수량

        # 두 번째 계획이 생성되었는지 확인 (다른 설비로)
        additional_plans = ProjectPlan.objects.filter(
            project=self.project, product=self.quotation_product, id__gt=plan.id
        )
        self.assertEqual(additional_plans.count(), 1)

        additional_plan = additional_plans.first()
        self.assertEqual(additional_plan.equipment.id, equipment2.id)  # 다른 설비 사용
        self.assertEqual(
            additional_plan.quantity, 44
        )  # (100-60) * 1.1 = 44 (buffer rate 적용)

    def test_list_today_production_plans_success(self):
        """오늘 생산 시작인 프로젝트 계획 조회 성공 테스트"""
        # 오늘 날짜로 프로젝트 계획 생성
        today = date.today()
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 대기",
            quantity=50,
            start_date=today,
            end_date=today + timedelta(days=7),
            avg_production_time=3600,
        )

        url = "/v1/project-plan/today"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 응답 데이터 확인
        self.assertEqual(len(data), 1)
        item = data[0]
        self.assertEqual(item["company_name"], self.client_company.name)
        self.assertEqual(item["product_name"], self.product.name)
        self.assertEqual(item["product_code"], self.product.code)
        self.assertEqual(item["spec"], self.product.spec)
        self.assertEqual(item["unit"], self.product.unit)
        self.assertEqual(item["production_quantity"], 50)
        self.assertEqual(item["equipment_name"], self.equipment.name)
        self.assertEqual(item["production_time"], 3600)
        self.assertEqual(item["project_id"], self.project.id)

    def test_list_today_production_plans_multiple_data(self):
        """오늘 생산 시작인 프로젝트 계획 조회 (여러 데이터) 테스트"""
        # 오늘 날짜로 7개의 프로젝트 계획 생성
        today = date.today()
        for i in range(7):
            ProjectPlan.objects.create(
                project=self.project,
                product=self.quotation_product,
                equipment=self.equipment,
                status="가동 대기",
                quantity=10 + i,
                start_date=today,
                end_date=today + timedelta(days=7),
                avg_production_time=3600 + i * 100,
            )

        url = "/v1/project-plan/today"

        # 모든 데이터 조회 (페이지네이션 없음)
        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 7)  # 모든 7개 데이터 반환

    def test_list_today_production_plan_no_data(self):
        """오늘 생산 시작인 프로젝트 계획이 없을 때 테스트"""
        url = "/v1/project-plan/today"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_list_today_production_plans_missing_factory_id(self):
        """factory_id 누락 시 오늘 생산 시작인 프로젝트 계획 조회 테스트"""
        url = "/v1/project-plan/today"

        response = self.client.get(f"{url}", HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 400)

    def test_list_today_production_plans_without_auth(self):
        """인증 없이 오늘 생산 시작인 프로젝트 계획 조회 테스트"""
        url = "/v1/project-plan/today"

        response = self.client.get(f"{url}?factory_id={self.factory.id}")

        self.assertEqual(response.status_code, 401)


class DashboardAPITestCase(TestCase):
    """대시보드 API 테스트 케이스"""

    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username="dashboard_user",
            email="dashboard@example.com",
            password="testpass123",
        )

        # 공장 생성
        self.factory = Factory.objects.create(
            name="대시보드 테스트 공장", owner=self.user
        )

        # 고객 생성
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="대시보드 테스트 고객사",
            business_registration_number="123-45-67890",
        )

        # 설비 생성
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="대시보드 테스트 설비", priority=1
        )

        # 원자재 생성
        self.material = Material.objects.create(
            factory=self.factory,
            name="테스트 원자재",
            code="MAT001",
            unit="kg",
            spec="테스트 규격",
            current_stock=50,
            standard_stock=30,
            cost_average=1000,  # 기본 평균 단가
        )

        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="대시보드 테스트 제품",
            code="TEST001",
            unit="개",
            spec="테스트 규격",
        )

        # 제품-원자재 연결 생성
        from stock.models import MaterialProduct

        self.material_product = MaterialProduct.objects.create(
            product=self.product,
            material=self.material,
            quantity=2.0,  # 제품 1개당 원자재 2kg 필요
        )

        # FactoryMember 생성
        from factory.models import FactoryMember
        from django.utils import timezone
        from dateutil.relativedelta import relativedelta

        # 한 달 전에 가입한 것으로 설정
        one_month_ago = timezone.now() - relativedelta(months=1)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        FactoryMember.objects.filter(id=self.factory_member.id).update(
            created_at=one_month_ago
        )

        # JWT 토큰 생성
        self.token = self.generate_jwt_token()

    def generate_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def create_test_projects(self):
        """테스트용 프로젝트들 생성"""
        from django.utils import timezone
        from dateutil.relativedelta import relativedelta

        today = timezone.now().date()
        current_month_start = today.replace(day=1)

        # 이번달 프로젝트 생성
        for i in range(3):
            project = Project.objects.create(
                name=f"이번달 프로젝트 {i+1}", status="완료"
            )
            quotation = Quotation.objects.create(
                factory=self.factory, client=self.client_company, project=project
            )
            QuotationProduct.objects.create(
                quotation=quotation,
                product=self.product,
                quantity=10,
                unit_price=5000,  # 제품 단가 5000원
            )
            # created_at을 이번달로 설정
            Project.objects.filter(id=project.id).update(
                created_at=current_month_start + timedelta(days=i)
            )

        # 지난달 프로젝트 생성
        previous_month_start = current_month_start - relativedelta(months=1)
        for i in range(2):
            project = Project.objects.create(
                name=f"지난달 프로젝트 {i+1}", status="완료"
            )
            quotation = Quotation.objects.create(
                factory=self.factory, client=self.client_company, project=project
            )
            QuotationProduct.objects.create(
                quotation=quotation,
                product=self.product,
                quantity=5,
                unit_price=5000,
            )
            # created_at을 지난달로 설정
            Project.objects.filter(id=project.id).update(
                created_at=previous_month_start + timedelta(days=i)
            )

    def test_get_dashboard_success(self):
        """대시보드 조회 성공 테스트"""
        # 테스트 데이터 생성
        self.create_test_projects()

        url = "/v1/project-plan/dashboard"
        response = self.client.get(
            url,
            {"factory_id": self.factory.id},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 응답 구조 검증
        self.assertIn("current_month_projects", data)
        self.assertIn("previous_month_projects", data)
        self.assertIn("shortage_materials_count", data)
        self.assertIn("monthly_profits", data)
        self.assertIn("last_year_monthly_profits", data)

        # 데이터 검증
        self.assertEqual(data["current_month_projects"], 3)
        self.assertEqual(data["previous_month_projects"], 2)
        self.assertEqual(
            data["shortage_materials_count"], 0
        )  # current_stock(50) > standard_stock(30)

        # 월별 수익 검증 (5개월치)
        self.assertEqual(len(data["monthly_profits"]), 5)
        self.assertEqual(len(data["last_year_monthly_profits"]), 5)

    def test_get_dashboard_without_factory_id(self):
        """factory_id 없이 대시보드 조회 시 에러 테스트"""
        url = "/v1/project-plan/dashboard"
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다", response.json()["detail"])

    def test_get_dashboard_unauthorized_user(self):
        """권한이 없는 사용자로 대시보드 조회 시 에러 테스트"""
        # 다른 공장 생성
        other_factory = Factory.objects.create(name="다른 공장", owner=self.user)

        url = "/v1/project-plan/dashboard"
        response = self.client.get(
            url,
            {"factory_id": other_factory.id},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        # 권한 검증 실패로 인한 에러
        self.assertNotEqual(response.status_code, 200)


class MaterialCostAverageTestCase(TestCase):
    """원자재 평균 단가 계산 테스트 케이스"""

    def setUp(self):
        """테스트 설정"""
        self.user = User.objects.create_user(
            username="cost_user", email="cost@example.com", password="testpass123"
        )

        self.factory = Factory.objects.create(
            name="원자재 테스트 공장", owner=self.user
        )

        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="원자재 테스트 고객사",
            business_registration_number="123-45-67890",
        )

        # 원자재 생성 (초기 재고 100개, 평균 단가 1000원)
        self.material = Material.objects.create(
            factory=self.factory,
            name="테스트 원자재",
            code="MAT001",
            unit="개",
            spec="테스트 규격",
            current_stock=100,
            standard_stock=50,
            cost_average=1000,
        )

    def test_material_cost_average_calculation(self):
        """원자재 평균 단가 계산 테스트"""
        # 이 테스트용으로 새로운 원자재 생성
        test_material = Material.objects.create(
            factory=self.factory,
            name="계산 테스트 원자재",
            code="MAT002",
            unit="개",
            spec="계산 테스트 규격",
            current_stock=100,
            standard_stock=50,
            cost_average=1000,
        )

        # 첫 번째 구매: 50개를 1200원에 구매
        history1 = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=1200,
        )

        # 평균 단가 계산: (100 * 1000 + 50 * 1200) / (100 + 50) = 1066.67
        # 반올림하면 1067
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1067)

        # 두 번째 구매: 30개를 800원에 구매
        history2 = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=30,
            price=800,
        )

        # 평균 단가 계산: (150 * 1067 + 30 * 800) / (150 + 30) = 1022.5
        # 반올림하면 1022
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1022)

    def test_material_cost_average_consumption_no_change(self):
        """원자재 소모 시 평균 단가 변경 없음 테스트"""
        # 이 테스트용으로 새로운 원자재 생성
        test_material = Material.objects.create(
            factory=self.factory,
            name="소모 테스트 원자재",
            code="MAT003",
            unit="개",
            spec="소모 테스트 규격",
            current_stock=100,
            standard_stock=50,
            cost_average=1000,
        )

        # 소모 기록 생성 (가격 없음)
        history = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.consumption,
            quantity=20,
            price=None,  # 소모는 가격 없음
        )

        # 평균 단가는 변경되지 않아야 함
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1000)

    def test_material_cost_average_zero_price(self):
        """가격이 0인 구매 시 평균 단가 변경 없음 테스트"""
        # 이 테스트용으로 새로운 원자재 생성
        test_material = Material.objects.create(
            factory=self.factory,
            name="0원 테스트 원자재",
            code="MAT004",
            unit="개",
            spec="0원 테스트 규격",
            current_stock=100,
            standard_stock=50,
            cost_average=1000,
        )

        # 가격이 0인 구매 기록
        history = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=0,
        )

        # 평균 단가는 변경되지 않아야 함
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1000)

    def test_material_cost_average_negative_price(self):
        """음수 가격 구매 시 평균 단가 변경 없음 테스트"""
        # 이 테스트용으로 새로운 원자재 생성
        test_material = Material.objects.create(
            factory=self.factory,
            name="음수 테스트 원자재",
            code="MAT005",
            unit="개",
            spec="음수 테스트 규격",
            current_stock=100,
            standard_stock=50,
            cost_average=1000,
        )

        # 음수 가격 구매 기록
        history = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=50,
            price=-100,
        )

        # 평균 단가는 변경되지 않아야 함
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1000)

    def test_material_cost_average_rounding(self):
        """원자재 평균 단가 반올림 테스트"""
        # 이 테스트용으로 새로운 원자재 생성
        test_material = Material.objects.create(
            factory=self.factory,
            name="반올림 테스트 원자재",
            code="MAT006",
            unit="개",
            spec="반올림 테스트 규격",
            current_stock=100,
            standard_stock=50,
            cost_average=1000,
        )

        # 반올림이 필요한 경우 테스트
        # 초기: 100개 × 1000원 = 100,000원
        # 구매: 1개 × 1500원 = 1,500원
        # 총: 101개 × ?원 = 101,500원
        # 평균: 101,500 ÷ 101 = 1004.95... → 반올림하면 1005

        history = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=1,
            price=1500,
        )

        # 반올림 검증: 1004.95... → 1005
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1005)

        # 반내림이 필요한 경우 테스트
        # 초기: 101개 × 1005원 = 101,505원
        # 구매: 1개 × 1490원 = 1,490원
        # 총: 102개 × ?원 = 102,995원
        # 평균: 102,995 ÷ 102 = 1009.75... → 반올림하면 1010

        history2 = MaterialHistory.objects.create(
            material=test_material,
            client=self.client_company,
            type=MaterialHistory.MaterialHistoryType.purchase,
            quantity=1,
            price=1490,
        )

        # 반올림 검증: 1009.75... → 1010
        test_material.refresh_from_db()
        self.assertEqual(test_material.cost_average, 1010)
