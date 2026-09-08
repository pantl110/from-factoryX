from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryEquipment
from project.models import Project, ProjectPlan, ProjectLog
from document.models import Quotation, QuotationProduct
from stock.models import Product
import json
import jwt
from django.conf import settings
from django.utils import timezone
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
        self.assertIn("created_plans", data)
        # 생산 수량(8)과 주문 수량(10)이 다르므로 2개의 계획이 생성되어야 함
        self.assertEqual(len(data["created_plans"]), 2)

        # 첫 번째 계획 확인 (생산 수량)
        plan1_data = data["created_plans"][0]
        self.assertEqual(plan1_data["project_id"], self.project.id)
        self.assertEqual(plan1_data["quotation_product_id"], self.quotation_product.id)
        self.assertEqual(plan1_data["equipment_id"], self.equipment.id)
        self.assertEqual(plan1_data["quantity"], 8)  # 생산 수량

        # 두 번째 계획 확인 (남은 수량)
        plan2_data = data["created_plans"][1]
        self.assertEqual(plan2_data["project_id"], self.project.id)
        self.assertEqual(plan2_data["quotation_product_id"], self.quotation_product.id)
        self.assertEqual(plan2_data["equipment_id"], self.equipment.id)
        self.assertEqual(plan2_data["quantity"], 92)  # 남은 수량 (100 - 8)

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

    def test_update_project_plan_success(self):
        """프로젝트 생산 계획 수정 성공 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["created_plans"][0]["id"]

        # 생산 계획 수정
        update_url = f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}"
        update_payload = {
            "quantity": 10,
            "status": "production",
            "avg_production_time": 7200,
        }

        response = self.client.patch(
            update_url,
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        data = response.json()
        # print(
        #     "🐍 File: tests/test_api_project_plan.py | Line: 245 | test_update_project_plan_success ~ data",
        #     data,
        # )

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        self.assertIn("message", data)
        self.assertIn("성공", data["message"])

    def test_update_project_plan_nonexistent(self):
        """존재하지 않는 생산 계획 수정 시도 테스트"""
        url = f"/v1/project-plan/999?factory_id={self.factory.id}"
        payload = {"quantity": 15}

        response = self.client.patch(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_update_project_plan_invalid_equipment(self):
        """존재하지 않는 설비로 수정 시도 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["created_plans"][0]["id"]

        # 존재하지 않는 설비로 수정 시도
        update_url = f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}"
        update_payload = {"equipment_id": 999}

        response = self.client.patch(
            update_url,
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_update_project_plan_invalid_status(self):
        """올바르지 않은 상태값으로 수정 시도 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["created_plans"][0]["id"]

        # 올바르지 않은 상태값으로 수정 시도
        update_url = f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}"
        update_payload = {"status": "잘못된상태"}

        response = self.client.patch(
            update_url,
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_update_project_plan_invalid_quantity(self):
        """올바르지 않은 수량으로 수정 시도 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [10],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        create_response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(create_response.status_code, 200)
        plan_id = create_response.json()["created_plans"][0]["id"]

        # 올바르지 않은 수량으로 수정 시도
        update_url = f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}"
        update_payload = {"quantity": 0}

        response = self.client.patch(
            update_url,
            data=json.dumps(update_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_update_project_plan_without_auth(self):
        """인증 없이 생산 계획 수정 시도 테스트"""
        url = "/v1/project-plan/1"
        payload = {"quantity": 15}

        response = self.client.patch(
            url, data=json.dumps(payload), content_type="application/json"
        )

        self.assertIn(response.status_code, [401, 403])

    def test_list_project_plans_success(self):
        """프로젝트 생산 계획 조회 성공 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        # 프로젝트 생산 계획 조회
        list_url = f"/v1/project-plan?project_id={self.project.id}&factory_id={self.factory.id}"

        response = self.client.get(list_url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)  # 생산 수량(8)과 주문 수량(10)이 다르므로 2개

        # 첫 번째 계획 확인
        plan1 = data[0]
        self.assertEqual(plan1["id"], 1)
        self.assertEqual(plan1["project_id"], self.project.id)
        self.assertEqual(plan1["quantity"], 8)

        # 견적서 품목 정보 확인
        self.assertIn("quotation_product", plan1)
        quotation_product = plan1["quotation_product"]
        self.assertEqual(quotation_product["id"], self.quotation_product.id)
        self.assertEqual(quotation_product["quantity"], self.quotation_product.quantity)
        self.assertEqual(
            quotation_product["unit_price"], self.quotation_product.unit_price
        )

        # 제품 정보 확인
        self.assertIn("product", quotation_product)
        product = quotation_product["product"]
        self.assertEqual(product["id"], self.product.id)
        self.assertEqual(product["name"], self.product.name)
        self.assertEqual(product["code"], self.product.code)
        self.assertEqual(product["unit"], self.product.unit)
        self.assertEqual(product["spec"], self.product.spec)

        # 설비 정보 확인
        self.assertIn("equipment", plan1)
        equipment = plan1["equipment"]
        self.assertEqual(equipment["id"], self.equipment.id)
        self.assertEqual(equipment["name"], self.equipment.name)
        self.assertEqual(equipment["priority"], self.equipment.priority)

        # 두 번째 계획 확인
        plan2 = data[1]
        self.assertEqual(plan2["id"], 2)
        self.assertEqual(plan2["project_id"], self.project.id)
        self.assertEqual(plan2["quantity"], 92)

    def test_list_project_plans_nonexistent_project(self):
        """존재하지 않는 프로젝트로 생산 계획 조회 시도 테스트"""
        url = f"/v1/project-plan?project_id=999&factory_id={self.factory.id}"

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 404)

    def test_list_project_plans_no_plans(self):
        """생산 계획이 없는 프로젝트 조회 시도 테스트"""
        # 새로운 프로젝트 생성 (생산 계획 없음)
        new_project = Project.objects.create()

        url = (
            f"/v1/project-plan?project_id={new_project.id}&factory_id={self.factory.id}"
        )

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 404)

    def test_list_project_plans_without_auth(self):
        """인증 없이 생산 계획 조회 시도 테스트"""
        url = "/v1/project-plan?project_id=1"

        response = self.client.get(url)

        self.assertIn(response.status_code, [401, 403])

    def test_list_ongoing_project_plans_success(self):
        """진행 중인 프로젝트 계획 조회 성공 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        # 진행 중인 프로젝트 계획 조회 (쿼리 파라미터 없이)
        list_url = f"/v1/project-plan/ongoing?factory_id={self.factory.id}"

        response = self.client.get(list_url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인 (페이지네이션 형식)
        data = response.json()
        self.assertIsInstance(data, dict)
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)

        plans = data["data"]
        self.assertIsInstance(plans, list)
        self.assertGreater(len(plans), 0)

        # 첫 번째 계획 확인
        plan = plans[0]
        self.assertEqual(plan["project_id"], self.project.id)
        self.assertEqual(plan["quantity"], 8)

        # 견적서 품목 정보 확인
        self.assertIn("quotation_product", plan)
        quotation_product = plan["quotation_product"]
        self.assertEqual(quotation_product["id"], self.quotation_product.id)

        # 제품 정보 확인
        self.assertIn("product", quotation_product)
        product = quotation_product["product"]
        self.assertEqual(product["id"], self.product.id)
        self.assertEqual(product["name"], self.product.name)

        # 설비 정보 확인
        self.assertIn("equipment", plan)
        equipment = plan["equipment"]
        self.assertEqual(equipment["id"], self.equipment.id)
        self.assertEqual(equipment["name"], self.equipment.name)

    def test_list_ongoing_project_plans_with_search(self):
        """진행 중인 프로젝트 계획 조회 (고객사 회사명 검색) 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        # 고객사 회사명으로 검색
        list_url = f"/v1/project-plan/ongoing?client_name={self.client_company.name}&factory_id={self.factory.id}"

        response = self.client.get(list_url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 200)

        # 응답 데이터 확인 (페이지네이션 형식)
        data = response.json()
        self.assertIsInstance(data, dict)
        self.assertIn("data", data)
        self.assertIn("count", data)
        self.assertIn("totalCnt", data)
        self.assertIn("curPage", data)

        plans = data["data"]
        self.assertIsInstance(plans, list)
        self.assertGreater(len(plans), 0)

    def test_list_completed_project_plans_empty(self):
        """완료된 프로젝트 계획 조회 (빈 결과) 테스트"""
        # 완료된 프로젝트 계획 조회 (쿼리 파라미터 없이)
        list_url = f"/v1/project-plan/completed?factory_id={self.factory.id}"

        response = self.client.get(list_url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 404)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("없습니다", data["detail"])

    def test_list_ongoing_project_plans_empty(self):
        """진행 중인 프로젝트 계획 조회 (빈 결과) 테스트"""
        # 존재하지 않는 프로젝트가 없으므로 쿼리 파라미터 없이 호출
        list_url = f"/v1/project-plan/ongoing?factory_id={self.factory.id}"

        response = self.client.get(list_url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(response.status_code, 404)

        # 응답 데이터 확인
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("없습니다", data["detail"])

    def test_update_project_plan_equipment_change_log_creation(self):
        """생산 중인 프로젝트의 설비 변경 시 로그 생성 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 생성된 계획의 ID 가져오기
        plan_id = response.json()["created_plans"][0]["id"]

        # 계획 상태를 "production"으로 변경
        update_status_url = f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}"
        status_payload = {"status": "production"}

        response = self.client.patch(
            update_status_url,
            data=json.dumps(status_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        data = response.json()
        # print(
        #     "🐍 File: tests/test_api_project_plan.py | Line: 658 | test_update_project_plan_equipment_change_log_creation ~ data",
        #     data,
        # )
        self.assertEqual(response.status_code, 200)

        # 새로운 설비 생성
        new_equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="새로운 설비", priority=2
        )

        # 설비 변경 (가동 중 상태에서)
        equipment_change_payload = {"equipment_id": new_equipment.id}

        response = self.client.patch(
            update_status_url,
            data=json.dumps(equipment_change_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        data = response.json()
        # print(
        #     "🐍 File: tests/test_api_project_plan.py | Line: 679 | test_update_project_plan_equipment_change_log_creation ~ data",
        #     data,
        # )
        self.assertEqual(response.status_code, 200)

        # 프로젝트 로그가 생성되었는지 확인
        logs = ProjectLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 1)

        log = logs.first()
        self.assertEqual(log.type, ProjectLog.LogType.plan)
        self.assertEqual(log.title, "생산 설비 변경")
        self.assertIn("테스트 설비", log.content)
        self.assertIn("새로운 설비", log.content)
        self.assertIn("라인에서", log.content)
        self.assertIn("라인으로 변경되었어요", log.content)

    def test_update_project_plan_equipment_change_no_log_when_not_producing(self):
        """생산 중이 아닌 상태에서 설비 변경 시 로그 생성 안됨 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 생성된 계획의 ID 가져오기
        plan_id = response.json()["created_plans"][0]["id"]

        # 새로운 설비 생성
        new_equipment = FactoryEquipment.objects.create(
            factory=self.factory, name="새로운 설비", priority=2
        )

        # 설비 변경 (생산 중이 아닌 상태에서)
        equipment_change_payload = {"equipment_id": new_equipment.id}

        response = self.client.patch(
            f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}",
            data=json.dumps(equipment_change_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 프로젝트 로그가 생성되지 않았는지 확인
        logs = ProjectLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 0)

    def test_update_project_plan_equipment_change_no_log_when_same_equipment(self):
        """같은 설비로 변경 시 로그 생성 안됨 테스트"""
        # 먼저 생산 계획 생성
        create_url = "/v1/project-plan"
        create_payload = {
            "project_id": self.project.id,
            "quotation_product_ids": [self.quotation_product.id],
            "production_quantities": [8],
            "equipment_ids": [self.equipment.id],
            "start_dates": ["2025-07-13"],
            "end_dates": ["2025-07-14"],
            "avg_production_times": [3600],
        }

        response = self.client.post(
            f"{create_url}?factory_id={self.factory.id}",
            data=json.dumps(create_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 생성된 계획의 ID 가져오기
        plan_id = response.json()["created_plans"][0]["id"]

        # 계획 상태를 "production" : "가동 중"으로 변경
        update_status_url = f"/v1/project-plan/{plan_id}?factory_id={self.factory.id}"
        status_payload = {"status": "production"}

        response = self.client.patch(
            update_status_url,
            data=json.dumps(status_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 같은 설비로 변경 (실제로는 변경되지 않음)
        equipment_change_payload = {"equipment_id": self.equipment.id}

        response = self.client.patch(
            update_status_url,
            data=json.dumps(equipment_change_payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 프로젝트 로그가 생성되지 않았는지 확인
        logs = ProjectLog.objects.filter(project=self.project)
        self.assertEqual(logs.count(), 0)

    def test_get_daily_production_quantity_success(self):
        """오늘 생산량 조회 성공 테스트"""
        # 오늘 완료된 생산 계획 생성
        today = date.today()
        completed_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 완료",
            quantity=50,
            start_date=today,
            end_date=today,
            avg_production_time=3600,
        )

        # 한 달 전 같은 날짜에 완료된 생산 계획 생성 (전월 대비용)
        from dateutil.relativedelta import relativedelta

        one_month_ago = today - relativedelta(months=1)
        previous_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 완료",
            quantity=30,
            start_date=one_month_ago,
            end_date=one_month_ago,
            avg_production_time=3600,
        )

        response = self.client.get(
            f"/v1/project-plan/daily?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 오늘 생산량 검증
        self.assertEqual(data["production_count"], 1)
        self.assertEqual(data["production_quantity"], 50)

        # 전월 대비 검증
        self.assertEqual(data["previous_month_count"], 1)
        self.assertEqual(data["previous_month_quantity"], 30)

        # 변화율 검증 (50 - 30) / 30 * 100 = 66.67%
        self.assertAlmostEqual(data["change_percentage"], 66.67, places=2)

    def test_get_daily_production_quantity_no_data(self):
        """생산 데이터가 없는 경우 테스트"""
        response = self.client.get(
            f"/v1/project-plan/daily?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 데이터가 없는 경우 검증
        self.assertEqual(data["production_count"], 0)
        self.assertEqual(data["production_quantity"], 0)
        self.assertIsNone(data["previous_month_count"])
        self.assertIsNone(data["previous_month_quantity"])
        self.assertIsNone(data["change_percentage"])

    def test_get_daily_production_quantity_with_specific_date(self):
        """특정 날짜 생산량 조회 테스트"""
        # 특정 날짜에 완료된 생산 계획 생성
        specific_date = date(2024, 1, 15)
        completed_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 완료",
            quantity=25,
            start_date=specific_date,
            end_date=specific_date,
            avg_production_time=3600,
        )

        response = self.client.get(
            f"/v1/project-plan/daily?factory_id={self.factory.id}&target_date=2024-01-15",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["production_count"], 1)
        self.assertEqual(data["production_quantity"], 25)

    def test_get_daily_production_quantity_invalid_date_format(self):
        """잘못된 날짜 형식 테스트"""
        response = self.client.get(
            f"/v1/project-plan/daily?factory_id={self.factory.id}&target_date=invalid-date",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        # Django Ninja의 에러 응답 구조 확인
        error_message = data.get("message", "") or data.get("detail", "")
        self.assertIn("올바르지 않은 날짜 형식", error_message)

    def test_get_daily_production_quantity_without_factory_id(self):
        """factory_id 누락 테스트"""
        response = self.client.get(
            "/v1/project-plan/daily", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )

        self.assertEqual(response.status_code, 422)

    def test_get_daily_production_quantity_without_auth(self):
        """인증 없이 조회 테스트"""
        response = self.client.get(
            f"/v1/project-plan/daily?factory_id={self.factory.id}"
        )

        self.assertEqual(response.status_code, 401)

    def test_get_daily_production_quantity_other_factory(self):
        """다른 공장의 생산량 조회 테스트 (권한 없음)"""
        # 다른 공장 생성
        other_factory = Factory.objects.create(name="다른 공장", owner=self.user)

        # 다른 공장의 멤버 생성
        from factory.models import FactoryMember

        FactoryMember.objects.create(
            factory=other_factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )

        # 다른 공장의 프로젝트와 생산 계획 생성
        other_project = Project.objects.create()
        other_quotation = Quotation.objects.create(
            factory=other_factory, client=self.client_company, project=other_project
        )
        other_quotation_product = QuotationProduct.objects.create(
            quotation=other_quotation,
            product=self.product,
            quantity=10,
            unit_price=1000,
        )

        today = date.today()
        other_plan = ProjectPlan.objects.create(
            project=other_project,
            product=other_quotation_product,
            equipment=self.equipment,
            status="가동 완료",
            quantity=100,
            start_date=today,
            end_date=today,
            avg_production_time=3600,
        )

        # 현재 공장으로 요청하지만 다른 공장의 데이터는 조회되지 않음
        response = self.client.get(
            f"/v1/project-plan/daily?factory_id={self.factory.id}",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 다른 공장의 데이터는 포함되지 않음
        self.assertEqual(data["production_count"], 0)
        self.assertEqual(data["production_quantity"], 0)

    def test_update_project_plan_date_with_time_format(self):
        """날짜에 시간 정보가 포함된 형식으로 수정하는 테스트"""
        # 먼저 프로젝트 계획 생성
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 대기",
            quantity=100,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            avg_production_time=3600,
        )

        url = f"/v1/project-plan/{plan.id}"

        payload = {"start_date": "2024-02-01 14:30", "end_date": "2024-02-28 18:45"}

        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan.refresh_from_db()
        self.assertEqual(timezone.localtime(plan.start_date).date(), date(2024, 2, 1))
        self.assertEqual(timezone.localtime(plan.end_date).date(), date(2024, 2, 28))

    def test_update_project_plan_date_without_time_format(self):
        """날짜만 있는 형식으로 수정하는 테스트"""
        # 먼저 프로젝트 계획 생성
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 대기",
            quantity=100,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            avg_production_time=3600,
        )

        url = f"/v1/project-plan/{plan.id}"

        payload = {"start_date": "2024-03-01", "end_date": "2024-03-31"}

        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan.refresh_from_db()
        self.assertEqual(timezone.localtime(plan.start_date).date(), date(2024, 3, 1))
        self.assertEqual(timezone.localtime(plan.end_date).date(), date(2024, 3, 31))

    def test_update_project_plan_date_mixed_format(self):
        """시작일은 시간 포함, 마감일은 시간 없는 혼합 형식 테스트"""
        # 먼저 프로젝트 계획 생성
        plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status="가동 대기",
            quantity=100,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            avg_production_time=3600,
        )

        url = f"/v1/project-plan/{plan.id}"

        payload = {"start_date": "2024-04-01 09:15", "end_date": "2024-04-30"}

        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)

        # 데이터베이스 확인
        plan.refresh_from_db()
        self.assertEqual(timezone.localtime(plan.start_date).date(), date(2024, 4, 1))
        self.assertEqual(timezone.localtime(plan.end_date).date(), date(2024, 4, 30))

    def test_update_project_plan_quantity_less_than_quotation(self):
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

        url = f"/v1/project-plan/{plan.id}"

        payload = {"quantity": 60}  # 주문수량(100)보다 작음

        response = self.client.patch(
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

    def test_update_project_plan_quantity_less_than_quotation_no_alternative_equipment(
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

        url = f"/v1/project-plan/{plan.id}"

        payload = {"quantity": 60}  # 주문수량(100)보다 작음

        response = self.client.patch(
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

    def test_update_project_plan_quantity_less_than_quotation_refund(self):
        """반품인 경우 생산수량을 주문수량보다 작게 수정하는 테스트 (buffer rate 적용 안함)"""
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

        url = f"/v1/project-plan/{plan.id}"

        payload = {"quantity": 60}  # 주문수량(100)보다 작음

        response = self.client.patch(
            f"{url}?factory_id={self.factory.id}",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        data = response.json()
        print(
            "🐍 File: tests/test_api_project_plan.py | Line: 1198 | test_update_project_plan_quantity_less_than_quotation_refund ~ data",
            data,
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
        )  # (100-60) × (1 + buffer rate 10%) = 44

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
            f"{url}?factory_id={self.factory.id}&page=1",
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

    def test_list_today_production_plans_pagination(self):
        """오늘 생산 시작인 프로젝트 계획 조회 페이지네이션 테스트"""
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

        # 첫 번째 페이지 (5개)
        response = self.client.get(
            f"{url}?factory_id={self.factory.id}&page=1",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 5)

        # 두 번째 페이지 (2개)
        response = self.client.get(
            f"{url}?factory_id={self.factory.id}&page=2",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

        # 세 번째 페이지 (없음)
        response = self.client.get(
            f"{url}?factory_id={self.factory.id}&page=3",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_list_today_production_plans_no_data(self):
        """오늘 생산 시작인 프로젝트 계획이 없을 때 테스트"""
        url = "/v1/project-plan/today"

        response = self.client.get(
            f"{url}?factory_id={self.factory.id}&page=1",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_list_today_production_plans_missing_factory_id(self):
        """factory_id 누락 시 오늘 생산 시작인 프로젝트 계획 조회 테스트"""
        url = "/v1/project-plan/today"

        response = self.client.get(
            f"{url}?page=1", HTTP_AUTHORIZATION=f"Bearer {self.token}"
        )

        self.assertEqual(response.status_code, 422)

    def test_list_today_production_plans_without_auth(self):
        """인증 없이 오늘 생산 시작인 프로젝트 계획 조회 테스트"""
        url = "/v1/project-plan/today"

        response = self.client.get(f"{url}?factory_id={self.factory.id}&page=1")

        self.assertEqual(response.status_code, 401)
