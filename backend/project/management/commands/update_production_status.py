from django.core.management.base import BaseCommand
from django.db import transaction
from project.models import Project, ProjectPlan
from factory.models import FactoryEquipment
from datetime import date
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '프로덕션 상태를 업데이트합니다'

    def handle(self, *args, **options):
        """명령어 실행"""
        self.stdout.write('프로덕션 상태 업데이트를 시작합니다')
        
        try:
            with transaction.atomic():
                # 오늘 날짜
                today = date.today()
                
                # 오늘 생산일자인 프로젝트 계획들 조회
                plans_to_update = ProjectPlan.objects.filter(
                    start_date=today,
                    status='pending'  # 가동 대기 상태
                ).select_related('equipment', 'project')
                
                updated_count = 0
                
                for plan in plans_to_update:
                    # 설비 상태를 가동 중으로 변경
                    plan.equipment.status = 'running'
                    plan.equipment.save()
                    
                    # 프로젝트 계획 상태를 생산 중으로 변경
                    plan.status = 'production'
                    plan.save()
                    
                    # 프로젝트 상태를 생산 중으로 변경
                    plan.project.status = 'production'
                    plan.project.save()
                    
                    updated_count += 1
                    self.stdout.write(
                        f'프로젝트 {plan.project.id} - 설비 {plan.equipment.name} 가동 시작'
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(f'업데이트 완료: {updated_count}개 프로젝트')
                )
                
        except Exception as e:
            logger.error(f'프로덕션 상태 업데이트 중 오류 발생: {e}')
            self.stdout.write(
                self.style.ERROR(f'오류 발생: {e}')
            )
            raise 