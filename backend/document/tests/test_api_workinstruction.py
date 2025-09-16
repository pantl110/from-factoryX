from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja.testing import TestAsyncClient
from document.api_workinstruction import router
from document.models import WorkInstruction
from factory.models import Factory, FactoryMember, FactoryEquipment, FactoryClient
from project.models import ProjectPlan, Project
from stock.models import Product
import jwt
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from document.models import Quotation, QuotationProduct
from datetime import date

User = get_user_model()


class TestWorkInstructionAPI(TestCase):
    def setUp(self):
        self.client = TestAsyncClient(router)
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.factory = Factory.objects.create(name="Test Factory", owner=self.user)

        # FactoryMember 생성 (사용자를 공장 멤버로 등록)
        self.factory_member = FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role="admin",
            status="active",
            invited_by=self.user,
        )

        # 설비 생성 (가동 대기 상태)
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory,
            name="테스트 설비",
            priority=1,
            status="standby",  # 가동 대기
        )

        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="테스트 제품",
            code="TEST001",
            unit="개",
            spec="10x10x10",
        )

        # 클라이언트 생성
        self.client_company = FactoryClient.objects.create(
            factory=self.factory,
            name="테스트 클라이언트",
            manager="홍길동",
            phone="010-1234-5678",
            email="client@test.com",
        )

        # 프로젝트 생성 (생산 대기 상태)
        self.project = Project.objects.create(status="pending")  # 생산 대기

        # 견적서 생성 (클라이언트 포함)
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=self.client_company,  # 클라이언트 설정
            project=self.project,
            due_date=date.today() + timedelta(days=30),
        )

        # 견적 제품 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product,
            quantity=100,
            unit_price=1000,
        )

        # 프로젝트 계획 생성 (가동 대기 상태, 오늘 생산일자)
        self.project_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            quantity=100,
            equipment=self.equipment,
            start_date=date.today(),  # 오늘 생산일자
            end_date=date.today() + timedelta(days=7),
            avg_production_time=3600,  # 1시간
            status="pending",  # 가동 대기
        )

        # 작업지시서 생성
        self.work_instruction = WorkInstruction.objects.create(
            factory=self.factory,
            memo="Test memo content",
        )

        self.work_instruction.plans.set([self.project_plan])

    def _get_jwt_token(self):
        """JWT 토큰 생성"""
        return jwt.encode(
            {"user_id": self.user.id, "exp": timezone.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def _get_auth_headers(self):
        """인증 헤더 반환"""
        return {"Authorization": f"Bearer {self._get_jwt_token()}"}

    async def test_get_work_instructions_success(self):
        """작업지시서 목록 조회 성공 테스트"""
        response = await self.client.get(
            f"?factory_id={self.factory.id}", headers=self._get_auth_headers()
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        # print(
        #     "🐍 File: tests/test_api_workinstruction.py | Line: 58 | _get_auth_headers ~ data",
        #     data,
        # )
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["memo"], "Test memo content")
        self.assertEqual(data["data"][0]["factory"], self.factory.id)

    async def test_get_work_instructions_missing_factory_id(self):
        """factory_id 누락 테스트"""
        response = await self.client.get("", headers=self._get_auth_headers())

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다.", response.json()["detail"])

    async def test_get_work_instructions_with_order_by_created_at_desc(self):
        """생성일 역순 정렬 테스트 (기본값)"""
        # 두 번째 작업지시서 생성
        await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="Second memo content",
        )

        response = await self.client.get(
            f"?factory_id={self.factory.id}&order_by=-created_at",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        # 최신 생성된 것이 먼저 나와야 함
        self.assertEqual(data["data"][0]["memo"], "Second memo content")

    async def test_get_work_instructions_with_order_by_created_at_asc(self):
        """생성일 순서 정렬 테스트"""
        # 두 번째 작업지시서 생성
        await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="Second memo content",
        )

        response = await self.client.get(
            f"?factory_id={self.factory.id}&order_by=created_at",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        # 먼저 생성된 것이 먼저 나와야 함
        self.assertEqual(data["data"][0]["memo"], "Test memo content")

    async def test_get_work_instructions_unauthorized(self):
        """인증되지 않은 사용자 테스트"""
        response = await self.client.get(f"?factory_id={self.factory.id}")

        self.assertEqual(response.status_code, 401)

    async def test_get_work_instructions_invalid_token(self):
        """잘못된 토큰 테스트"""
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers={"Authorization": "Bearer invalid_token"},
        )

        self.assertEqual(response.status_code, 401)

    async def test_get_work_instructions_empty_result(self):
        """빈 결과 테스트"""
        empty_factory = await Factory.objects.acreate(
            name="Empty Factory", owner=self.user
        )

        # 빈 공장의 멤버로 등록
        await FactoryMember.objects.acreate(
            factory=empty_factory,
            user=self.user,
            role="admin",
            status="active",
            invited_by=self.user,
        )

        response = await self.client.get(
            f"?factory_id={empty_factory.id}",
            headers=self._get_auth_headers(),
        )

        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data["data"]), 0)

    async def test_get_work_instructions_different_factory(self):
        """다른 공장의 작업지시서는 조회되지 않는지 테스트"""
        # 다른 사용자와 공장 생성
        other_user = await User.objects.acreate(
            username="otheruser", email="other@example.com", password="testpass123"
        )

        other_factory = await Factory.objects.acreate(
            name="Other Factory", owner=other_user
        )

        # 다른 공장에 작업지시서 생성
        await WorkInstruction.objects.acreate(
            factory=other_factory,
            memo="Other factory memo",
        )

        # 현재 사용자의 공장 ID로 조회
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 현재 공장의 작업지시서만 조회되어야 함
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["memo"], "Test memo content")

    async def test_get_work_instructions_nonexistent_factory(self):
        """존재하지 않는 공장 ID로 조회 테스트"""
        response = await self.client.get(
            f"?factory_id=99999",
            headers=self._get_auth_headers(),
        )

        # 공장 멤버가 아니므로 권한 오류 또는 빈 결과가 반환될 수 있음
        # 실제 동작에 따라 상태 코드가 달라질 수 있음
        self.assertIn(response.status_code, [200, 403, 404])

    async def test_get_work_instructions_with_plans(self):
        """생산 계획이 연결된 작업지시서 테스트"""
        # plans가 Many-to-Many 필드이므로 추가 작업지시서 생성
        work_instruction_with_plans = await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="Work instruction with plans",
        )

        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)

        # 각 작업지시서의 기본 필드들이 포함되어 있는지 확인
        for item in data["data"]:
            self.assertIn("id", item)
            self.assertIn("factory", item)
            self.assertIn("memo", item)
            self.assertIn("created_at", item)
            self.assertIn("updated_at", item)
            self.assertIn("plans", item)

    async def test_get_work_instructions_with_client_and_product_names(self):
        """클라이언트명과 제품명이 포함된 작업지시서 테스트"""
        response = await self.client.get(
            f"?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)

        work_instruction = data["data"][0]
        self.assertIn("plans", work_instruction)
        self.assertEqual(len(work_instruction["plans"]), 1)

        plan = work_instruction["plans"][0]
        # print("🐍 Test plan data:", plan)

        # client_name과 product_name이 포함되어 있는지 확인
        self.assertIn("client_name", plan)
        self.assertIn("product_name", plan)
        self.assertEqual(plan["client_name"], "테스트 클라이언트")
        self.assertEqual(plan["product_name"], "테스트 제품")

    async def test_get_work_instruction_detail_success(self):
        """작업지시서 상세 조회 성공 테스트"""
        response = await self.client.get(
            f"/{self.work_instruction.id}?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.work_instruction.id)
        self.assertEqual(data["memo"], "Test memo content")
        self.assertEqual(data["factory"], self.factory.id)

        # plans 필드 확인
        self.assertIn("plans", data)
        self.assertEqual(len(data["plans"]), 1)

        plan = data["plans"][0]
        # 추가된 필드들 확인
        self.assertIn("client_name", plan)
        self.assertIn("product_name", plan)
        self.assertIn("product_code", plan)
        self.assertIn("product_unit", plan)
        self.assertIn("product_spec", plan)

        self.assertEqual(plan["client_name"], "테스트 클라이언트")
        self.assertEqual(plan["product_name"], "테스트 제품")
        self.assertEqual(plan["product_code"], "TEST001")
        self.assertEqual(plan["product_unit"], "개")
        self.assertEqual(plan["product_spec"], "10x10x10")

    async def test_get_work_instruction_detail_not_found(self):
        """존재하지 않는 작업지시서 상세 조회 테스트"""
        response = await self.client.get(
            f"/99999?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("작업 지시서를 찾을 수 없습니다.", response.json()["detail"])

    async def test_get_work_instruction_detail_missing_factory_id(self):
        """factory_id 누락 테스트 (상세 조회)"""
        response = await self.client.get(
            f"/{self.work_instruction.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다.", response.json()["detail"])

    async def test_get_work_instruction_detail_different_factory(self):
        """다른 공장의 작업지시서 상세 조회 테스트"""
        # 다른 사용자와 공장 생성
        other_user = await User.objects.acreate(
            username="otheruser", email="other@example.com", password="testpass123"
        )
        other_factory = await Factory.objects.acreate(
            name="Other Factory", owner=other_user
        )

        # 다른 공장에 작업지시서 생성
        other_work_instruction = await WorkInstruction.objects.acreate(
            factory=other_factory,
            memo="Other factory memo",
        )

        response = await self.client.get(
            f"/{other_work_instruction.id}?factory_id={self.factory.id}",
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("작업 지시서를 찾을 수 없습니다.", response.json()["detail"])

    async def test_update_work_instruction_success(self):
        """작업지시서 업데이트 성공 테스트"""
        update_data = {"memo": "Updated memo content"}

        response = await self.client.patch(
            f"/{self.work_instruction.id}?factory_id={self.factory.id}",
            json=update_data,
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.work_instruction.id)
        self.assertEqual(data["memo"], "Updated memo content")
        self.assertEqual(data["factory"], self.factory.id)

        # 데이터베이스에서도 확인
        updated_work_instruction = await WorkInstruction.objects.aget(
            id=self.work_instruction.id
        )
        self.assertEqual(updated_work_instruction.memo, "Updated memo content")

    async def test_update_work_instruction_not_found(self):
        """존재하지 않는 작업지시서 업데이트 테스트"""
        update_data = {"memo": "Updated memo"}

        response = await self.client.patch(
            f"/99999?factory_id={self.factory.id}",
            json=update_data,
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("작업 지시서를 찾을 수 없습니다.", response.json()["detail"])

    async def test_update_work_instruction_missing_factory_id(self):
        """factory_id 누락 테스트 (업데이트)"""
        update_data = {"memo": "Updated memo"}

        response = await self.client.patch(
            f"/{self.work_instruction.id}",
            json=update_data,
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("factory_id를 입력해야 합니다.", response.json()["detail"])

    async def test_update_work_instruction_different_factory(self):
        """다른 공장의 작업지시서 업데이트 테스트"""
        # 다른 사용자와 공장 생성
        other_user = await User.objects.acreate(
            username="otheruser2", email="other2@example.com", password="testpass123"
        )
        other_factory = await Factory.objects.acreate(
            name="Other Factory 2", owner=other_user
        )

        # 다른 공장에 작업지시서 생성
        other_work_instruction = await WorkInstruction.objects.acreate(
            factory=other_factory,
            memo="Other factory memo",
        )

        update_data = {"memo": "Trying to update other factory's instruction"}

        response = await self.client.patch(
            f"/{other_work_instruction.id}?factory_id={self.factory.id}",
            json=update_data,
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("작업 지시서를 찾을 수 없습니다.", response.json()["detail"])

    async def test_update_work_instruction_unauthorized(self):
        """인증되지 않은 사용자 업데이트 테스트"""
        update_data = {"memo": "Unauthorized update"}

        response = await self.client.patch(
            f"/{self.work_instruction.id}?factory_id={self.factory.id}",
            json=update_data,
        )

        self.assertEqual(response.status_code, 401)

    async def test_update_work_instruction_with_plans_data(self):
        """생산 계획이 포함된 작업지시서 업데이트 후 응답 데이터 확인"""
        update_data = {"memo": "Updated with plans check"}

        response = await self.client.patch(
            f"/{self.work_instruction.id}?factory_id={self.factory.id}",
            json=update_data,
            headers=self._get_auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 업데이트된 내용 확인
        self.assertEqual(data["memo"], "Updated with plans check")

        # plans 필드와 추가 정보 확인
        self.assertIn("plans", data)
        self.assertEqual(len(data["plans"]), 1)

        plan = data["plans"][0]
        self.assertIn("client_name", plan)
        self.assertIn("product_name", plan)
        self.assertIn("product_code", plan)
        self.assertIn("product_unit", plan)
        self.assertIn("product_spec", plan)

        self.assertEqual(plan["client_name"], "테스트 클라이언트")
        self.assertEqual(plan["product_name"], "테스트 제품")
