from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja.testing import TestAsyncClient
from scheduling.api import router
from document.models import WorkInstruction
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from factory.models import Factory, FactoryMember, FactoryEquipment
from stock.models import Product
from django.utils import timezone
from datetime import datetime, timedelta
import jwt
from django.conf import settings

User = get_user_model()


class TestWorkInstructionSchedulingAPI(TestCase):
    def setUp(self):
        # 테스트용 사용자 생성
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(
            name="테스트 공장",
            owner=self.user,
            business_registration_number="123-45-67890",
        )

        # 공장 멤버 생성
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
        )

        # 설비 생성
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory,
            name="테스트 설비",
            priority=1,
        )

        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name="테스트 제품",
            code="TEST001",
            unit="EA",
            spec="테스트 스펙",
        )

        # 프로젝트 생성
        self.project = Project.objects.create(
            name="테스트 프로젝트",
            status=Project.ProjectStatus.production,
        )

        # 견적서 생성
        self.quotation = Quotation.objects.create(
            project=self.project,
            factory=self.factory,
            due_date=timezone.now().date(),
        )

        # 견적서 품목 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product,
            quantity=10,
            unit_price=1000,
        )

        # 테스트용 클라이언트 생성
        self.client = TestAsyncClient(router)
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

    def _get_auth_headers(self):
        """JWT 인증 헤더 생성"""
        payload = {
            "user_id": self.user.id,
            "exp": datetime.utcnow().timestamp() + 3600,  # 1시간 후 만료
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        return {"Authorization": f"Bearer {token}"}

    async def test_create_work_instruction_success(self):
        """작업 지시서 생성 성공 테스트"""
        # 오늘 시작하는 생산 중인 프로젝트 계획 생성
        start_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end_date = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)

        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=5,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        response = await self.client.post(
            "/work-instruction",
            headers=self.headers,
        )

        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["work_instructions"], 1)

        # 작업 지시서가 실제로 생성되었는지 확인
        work_instruction = await WorkInstruction.objects.aget(factory=self.factory)
        self.assertIsNotNone(work_instruction)

        # 생산 계획이 작업 지시서에 연결되었는지 확인
        plans_count = await work_instruction.plans.acount()
        self.assertEqual(plans_count, 1)

    async def test_create_work_instruction_multiple_factories(self):
        """여러 공장의 작업 지시서 생성 테스트"""
        # 두 번째 공장 생성
        factory2 = await Factory.objects.acreate(
            name="테스트 공장2",
            owner=self.user,
            business_registration_number="123-45-67891",
        )

        equipment2 = await FactoryEquipment.objects.acreate(
            factory=factory2,
            name="테스트 설비2",
            priority=1,
        )

        # 오늘 시작하는 생산 중인 프로젝트 계획들 생성
        start_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end_date = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)

        # 첫 번째 공장의 계획
        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=5,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        # 두 번째 공장의 계획
        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=equipment2,
            status=ProjectPlan.ProductionStatus.production,
            quantity=3,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        response = await self.client.post(
            "/work-instruction",
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["work_instructions"], 2)

        # 두 공장 모두에 작업 지시서가 생성되었는지 확인
        work_instructions_count = await WorkInstruction.objects.acount()
        self.assertEqual(work_instructions_count, 2)

    async def test_create_work_instruction_no_production_plans(self):
        """오늘 시작하는 생산 중인 계획이 없는 경우 테스트"""
        # 기존의 모든 Plan 삭제 (다른 테스트의 영향 제거)
        await ProjectPlan.objects.filter(equipment=self.equipment).adelete()
        
        # 생산 완료 상태의 계획만 생성 (WorkInstruction에 포함되지 않아야 함)
        start_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end_date = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)

        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.completed,  # 생산 완료 상태
            quantity=5,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        response = await self.client.post(
            "/work-instruction",
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["work_instructions"], 0)

        # 작업 지시서가 생성되지 않았는지 확인
        work_instructions_count = await WorkInstruction.objects.acount()
        self.assertEqual(work_instructions_count, 0)

    async def test_create_work_instruction_different_date(self):
        """다른 날짜에 시작하는 계획이 있는 경우 테스트"""
        # 내일 시작하는 생산 중인 계획 생성
        tomorrow = timezone.now().replace(
            hour=9, minute=0, second=0, microsecond=0
        ) + timezone.timedelta(days=1)
        end_date = timezone.now().replace(
            hour=18, minute=0, second=0, microsecond=0
        ) + timezone.timedelta(days=1)

        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=5,
            start_date=tomorrow,
            end_date=end_date,
            avg_production_time=3600,
        )

        response = await self.client.post(
            "/work-instruction",
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["work_instructions"], 0)

        # 작업 지시서가 생성되지 않았는지 확인
        work_instructions_count = await WorkInstruction.objects.acount()
        self.assertEqual(work_instructions_count, 0)

    async def test_create_work_instruction_duplicate_same_day(self):
        """같은 날짜에 이미 작업 지시서가 있는 경우 테스트"""
        # 기존 작업 지시서 생성 (오늘 날짜로)
        work_instruction = await WorkInstruction.objects.acreate(
            factory=self.factory,
            memo="기존 작업 지시서",
        )
        # created_at을 오늘로 설정하기 위해 저장 시간을 조정
        work_instruction.created_at = timezone.now().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        await work_instruction.asave()

        # 오늘 시작하는 생산 중인 계획 생성
        start_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end_date = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)

        plan = await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=5,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        response = await self.client.post(
            "/work-instruction",
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["work_instructions"], 1)

        # 작업 지시서가 중복 생성되지 않았는지 확인
        work_instructions_count = await WorkInstruction.objects.acount()
        self.assertEqual(work_instructions_count, 1)

        # 기존 작업 지시서에 계획이 추가되었는지 확인
        work_instruction = await WorkInstruction.objects.aget(factory=self.factory)
        plans_count = await work_instruction.plans.acount()
        self.assertEqual(plans_count, 1)

    async def test_create_work_instruction_multiple_plans_same_factory(self):
        """같은 공장에 여러 생산 계획이 있는 경우 테스트"""
        # 두 개의 프로젝트 계획 생성
        start_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end_date = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)

        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=5,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        await ProjectPlan.objects.acreate(
            project=self.project,
            product=self.quotation_product,
            equipment=self.equipment,
            status=ProjectPlan.ProductionStatus.production,
            quantity=3,
            start_date=start_date,
            end_date=end_date,
            avg_production_time=3600,
        )

        response = await self.client.post(
            "/work-instruction",
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["work_instructions"], 1)

        # 하나의 작업 지시서에 두 개의 계획이 모두 연결되었는지 확인
        work_instruction = await WorkInstruction.objects.aget(factory=self.factory)
        plans_count = await work_instruction.plans.acount()
        self.assertEqual(plans_count, 2)
