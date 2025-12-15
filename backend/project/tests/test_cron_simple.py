from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from factory.models import Factory, FactoryMember, FactoryEquipment
from project.models import Project, ProjectPlan
from document.models import Quotation, QuotationProduct
from stock.models import Product
from datetime import date, timedelta, datetime
import io

User = get_user_model()


class SimpleCronTest(TestCase):
    def setUp(self):
        """간단한 테스트 설정"""
        # 사용자 생성
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 공장 생성
        self.factory = Factory.objects.create(
            name='테스트 공장',
            owner=self.user
        )
        
        # FactoryMember 생성
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role='admin',
            status='active',
            invited_by=self.user
        )
        
        # 설비 생성 (가동 대기 상태)
        self.equipment = FactoryEquipment.objects.create(
            factory=self.factory,
            name='테스트 설비',
            priority=1,
            status='standby'  # 가동 대기
        )
        
        # 제품 생성
        self.product = Product.objects.create(
            factory=self.factory,
            name='테스트 제품',
            code='TEST001',
            unit='개',
            spec='10x10x10'
        )
        
        # 프로젝트 생성 (생산 중 상태) - 크론 명령어는 생산 중인 프로젝트만 처리
        self.project = Project.objects.create(
            status='production'  # 생산 중
        )
        
        # 견적서 생성
        self.quotation = Quotation.objects.create(
            factory=self.factory,
            client=None,
            project=self.project,
            due_date=date.today() + timedelta(days=30)
        )
        
        # 견적 제품 생성
        self.quotation_product = QuotationProduct.objects.create(
            quotation=self.quotation,
            product=self.product,
            quantity=100,
            unit_price=1000
        )
        
        # 프로젝트 계획 생성 (가동 대기 상태, 오늘 생산일자)
        now = datetime.now()
        self.project_plan = ProjectPlan.objects.create(
            project=self.project,
            product=self.quotation_product,
            quantity=100,
            equipment=self.equipment,
            start_date=now,  # 오늘 생산일자
            end_date=now + timedelta(days=7),
            avg_production_time=3600,  # 1시간
            status='pending'  # 가동 대기
        )

    def test_cron_command_basic(self):
        """기본 크론 명령어 테스트"""
        # 실행 전 상태 확인
        self.assertEqual(self.equipment.status, 'standby')
        self.assertEqual(self.project_plan.status, 'pending')
        self.assertEqual(self.project.status, 'pending')
        
        # 크론 명령어 실행
        out = io.StringIO()
        call_command('update_production_status', stdout=out)
        
        # 출력 확인
        output = out.getvalue()
        
        # 상태 변경 확인
        self.equipment.refresh_from_db()
        self.project_plan.refresh_from_db()
        self.project.refresh_from_db()
        
        # 상태가 변경되었는지 확인
        self.assertEqual(self.equipment.status, 'running')
        self.assertEqual(self.project_plan.status, 'production')
        self.assertEqual(self.project.status, 'production') 