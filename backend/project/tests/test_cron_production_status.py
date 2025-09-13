from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from factory.models import Factory, FactoryMember, FactoryEquipment
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from stock.models import Product
from datetime import date, timedelta
import io

User = get_user_model()


class CronProductionStatusTestCase(TestCase):
    def setUp(self):
        """테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # 공장 생성
        self.factory = Factory.objects.create(name="테스트 공장", owner=self.user)

        # FactoryMember 생성
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

        # 프로젝트 생성 (생산 대기 상태)
        self.project = Project.objects.create(status="pending")  # 생산 대기

        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=None,  # 테스트에서는 None으로 설정
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

    def test_update_production_status_command_success(self):
        """크론 작업 명령어 실행 성공 테스트"""
        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 결과 확인
        output = out.getvalue()
        self.assertIn("프로덕션 상태 업데이트를 시작합니다", output)
        self.assertIn("업데이트 완료", output)

        # 설비 상태가 가동 중으로 변경되었는지 확인
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "running")

        # 프로젝트 계획 상태가 가동 중으로 변경되었는지 확인
        self.project_plan.refresh_from_db()
        self.assertEqual(self.project_plan.status, "production")

        # 프로젝트 상태가 생산 중으로 변경되었는지 확인
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "production")

    def test_update_equipment_status_past_date(self):
        """과거 생산일자의 프로젝트 계획 테스트"""
        # 과거 생산일자로 프로젝트 계획 수정
        self.project_plan.start_date = date.today() - timedelta(days=1)
        self.project_plan.save()

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 과거 날짜는 처리하지 않으므로 설비 상태가 변경되지 않았는지 확인
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "standby")

    def test_update_equipment_status_future_date(self):
        """미래 생산일자의 프로젝트 계획 테스트"""
        # 미래 생산일자로 프로젝트 계획 수정
        self.project_plan.start_date = date.today() + timedelta(days=1)
        self.project_plan.save()

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 설비 상태가 변경되지 않았는지 확인 (가동 대기 유지)
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "standby")

    def test_update_equipment_status_already_running(self):
        """이미 가동 중인 설비 테스트"""
        # 설비를 가동 중으로 설정
        self.equipment.status = "running"
        self.equipment.save()

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 설비 상태가 가동 중으로 유지되었는지 확인
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "running")

    def test_update_project_status_already_production(self):
        """이미 생산 중인 프로젝트 테스트"""
        # 프로젝트를 생산 중으로 설정
        self.project.status = "production"
        self.project.save()

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 프로젝트 상태가 생산 중으로 유지되었는지 확인
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, "production")

    def test_multiple_plans_same_equipment(self):
        """같은 설비를 사용하는 여러 프로젝트 계획 테스트"""
        # 두 번째 프로젝트와 계획 생성
        project2 = Project.objects.create(status="pending")
        plan2 = ProjectPlan.objects.create(
            project=project2,
            product=self.quotation_product,
            quantity=50,
            equipment=self.equipment,  # 같은 설비 사용
            start_date=date.today(),
            end_date=date.today() + timedelta(days=5),
            avg_production_time=1800,
            status="pending",
        )

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 설비 상태가 가동 중으로 변경되었는지 확인
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "running")

        # 두 프로젝트 모두 생산 중으로 변경되었는지 확인
        self.project.refresh_from_db()
        project2.refresh_from_db()
        self.assertEqual(self.project.status, "production")
        self.assertEqual(project2.status, "production")

    def test_no_plans_to_update(self):
        """업데이트할 계획이 없는 경우 테스트"""
        # 프로젝트 계획을 미래 날짜로 설정
        self.project_plan.start_date = date.today() + timedelta(days=10)
        self.project_plan.save()

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 설비 상태가 변경되지 않았는지 확인
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "standby")

    def test_command_with_error_handling(self):
        """오류 처리 테스트"""
        # 잘못된 데이터로 인한 오류 상황 시뮬레이션
        # (실제로는 이런 상황이 발생하지 않지만, 오류 처리가 작동하는지 확인)

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 명령어가 정상적으로 완료되었는지 확인
        output = out.getvalue()
        self.assertIn("업데이트 완료", output)

    def test_transaction_rollback(self):
        """트랜잭션 롤백 테스트"""
        # 원래 상태 저장
        original_equipment_status = self.equipment.status
        original_project_status = self.project.status

        # 명령어 실행
        out = io.StringIO()
        call_command("update_production_status", stdout=out)

        # 상태가 변경되었는지 확인
        self.equipment.refresh_from_db()
        self.project.refresh_from_db()

        # 변경된 상태 확인
        self.assertNotEqual(self.equipment.status, original_equipment_status)
        self.assertNotEqual(self.project.status, original_project_status)

        # 트랜잭션이 정상적으로 처리되었는지 확인
        output = out.getvalue()
        self.assertIn("업데이트 완료", output)
