from ninja import Router
from helpers.decorators import scheduling_only
from project.models import Project, ProjectPlan
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.conf import settings
from datetime import timedelta, datetime
import pytz
from websocket.utils import send_notification_to_factory
from notification.models import Notification
from document.models import Quotation
from tax.models import NationalTaxService, PublishStatus
from tax.barobill_utils import get_state_barobill_tax_invoice
from barobill.barobill_state import (
    barobill_tax_service_states,
    nts_tax_service_states,
)
from stock.models import MaterialProduct, Material
from django.db.models import F, OuterRef, Exists, Q
from itertools import groupby
from operator import attrgetter
from django.db import transaction
from document.models import WorkInstruction


router = Router(tags=["Scheduling"])


@router.get(
    "/project/deadline",
    summary="[S] 프로젝트 납기일이 3일 남았을 때 알림",
    description="프로젝트 납기일이 3일 남았을 때 알림을 보냅니다.",
)
@scheduling_only
async def project_deadline_notification(request):

    # 프로젝트 리스트 조회(3일 이내 납기일이 있는 프로젝트)
    # 알림이 이미 보내졌는지 확인
    # Project 모델에 마감기한이 어디에 있는지?
    @sync_to_async
    def get_quotations_with_deadline():
        # 3일 후 날짜를 계산 (date 타입으로)
        queryset = Quotation.objects.select_related("project", "factory").filter(
            project__status__in=[
                Project.ProjectStatus.pending,
                Project.ProjectStatus.production,
                Project.ProjectStatus.manufactured,
                Project.ProjectStatus.delivery,
            ],
            due_date__lte=timezone.now().date() + timedelta(days=3),
            due_date_notification=False,
        )
        quotations = list(queryset)
        queryset.update(due_date_notification=True)
        return quotations

    quotations = await get_quotations_with_deadline()

    if len(quotations) == 0:
        return {"quotations": 0}

    for quotation in quotations:
        await send_notification_to_factory(
            factory_id=quotation.factory.id,
            notification_type=Notification.NotificationType.information,
            notification_case=Notification.NotificationCase.due_date_approaching,
            content=f"{quotation.project.name} 납기일이 3일 남았어요.",
        )
    return {"quotations": len(quotations)}


@router.get(
    "/project-plan/start",
    summary="[S] 프로젝트 생산 계획 시작 상태변경(매분 실행)",
    description="프로젝트 생산 계획의 시작 예정일이 지난 경우 상태를 '가동 중'으로 변경합니다.",
)
@scheduling_only
async def project_plan_start_status_change(request):
    @sync_to_async
    def update_start_project_plans():
        now = timezone.now()
        # 가동 대기 상태이면서 시작 예정일 지난 플랜 조회
        plans = list(
            ProjectPlan.objects.select_related(
                "equipment__factory",
                "product__product",
                "project",
            ).filter(
                project__status=Project.ProjectStatus.production,
                status=ProjectPlan.ProductionStatus.pending,
                start_date__lt=now,
            )
        )

        if not plans:
            return 0

        # 관련 MaterialProduct, Material들을 플랜의 product에 대해 모두 가져오기
        product_ids = [plan.product.product.id for plan in plans]
        material_products = (
            MaterialProduct.objects.select_related("material")
            .filter(product_id__in=product_ids)
            .all()
        )

        # product별 material 리스트 사전 생성
        product_material_map = {}
        for mp in material_products:
            product_material_map.setdefault(mp.product_id, []).append(mp)

        update_count = 0
        for plan in plans:
            # 원자재 부족해도 가동중으로 변경 허용하기로 함
            # materials = product_material_map.get(plan.product.product.id, [])
            # for mp in materials:
            #     required_qty = mp.quantity * plan.quantity
            #     if mp.material.current_stock < required_qty:
            #         break
            # else:  # for문이 break 없이 끝났으면 재고 충분
            plan.status = ProjectPlan.ProductionStatus.production
            plan.save(update_fields=["status"])
            update_count += 1

        return update_count

    updated = await update_start_project_plans()

    return {"plans": updated}


@router.get(
    "/project-plan/end",
    summary="[S] 프로젝트 생산 계획 마감 알림",
    description="프로젝트 생산 계획의 마감 예정일이 지난 경우 알림을 보냅니다.",
)
@scheduling_only
async def project_plan_end_notification(request):
    @sync_to_async
    def get_end_project_plan():
        queryset = ProjectPlan.objects.select_related(
            "equipment__factory", "product__product"
        ).filter(
            status=ProjectPlan.ProductionStatus.production,
            end_date__lt=timezone.now(),
            end_notification=False,
        )
        plans = list(queryset)
        queryset.update(end_notification=True)
        return plans

    plans = await get_end_project_plan()
    if len(plans) == 0:
        return {"plans": 0}

    for plan in plans:
        await send_notification_to_factory(
            factory_id=plan.equipment.factory.id,
            notification_type=Notification.NotificationType.completed,
            notification_case=Notification.NotificationCase.product_completed,
            content=f"{plan.product.product.name} 생산 완료",
        )

    return {"plans": len(plans)}


@router.get(
    "/tax/state",
    summary="[S] 세금계산서 상태 조회",
    description="세금계산서의 상태를 조회합니다.",
)
@scheduling_only
async def tax_invoice_state_check(request):

    @sync_to_async
    def get_tax_invoice():
        queryset = NationalTaxService.objects.select_related("factory").filter(
            publish_status__in=[
                PublishStatus.temporary,
                PublishStatus.pending,
                PublishStatus.processing,
            ]
        )
        return list(queryset)

    @sync_to_async
    def bulk_update_tax_invoices(tax_invoices_to_update):
        if tax_invoices_to_update:
            NationalTaxService.objects.bulk_update(
                tax_invoices_to_update,
                ["publish_status", "barobill_state", "nts_send_state"],
            )

    tax_invoices = await get_tax_invoice()
    tax_invoices_to_update = []

    for tax_invoice in tax_invoices:
        result = get_state_barobill_tax_invoice(
            tax_invoice.factory.business_registration_number,
            tax_invoice.mgt_key,
        )
        barobill_state = barobill_tax_service_states.get(result.BarobillState)
        nts_send_state = nts_tax_service_states.get(result.NTSSendState)

        new_status = None
        if nts_send_state == "전송완료":
            new_status = PublishStatus.published
        elif nts_send_state == "전송실패":
            new_status = PublishStatus.failed
        elif nts_send_state == "전송중":
            new_status = PublishStatus.processing
        elif nts_send_state == "전송대기":
            new_status = PublishStatus.pending

        # 상태가 변경된 경우에만 업데이트 목록에 추가
        if new_status and tax_invoice.publish_status != new_status:
            tax_invoice.publish_status = new_status
            tax_invoice.barobill_state = barobill_state
            tax_invoice.nts_send_state = nts_send_state
            tax_invoices_to_update.append(tax_invoice)

    # 한 번에 모든 변경사항을 DB에 반영
    await bulk_update_tax_invoices(tax_invoices_to_update)

    return {"tax_invoices": len(tax_invoices_to_update)}


@router.post(
    "/work-instruction",
    summary="[S] 작업 지시서 생성",
    description="매일 자정에 작업 지시서를 생성합니다.",
)
@scheduling_only
async def create_work_instruction(request):

    @sync_to_async
    @transaction.atomic
    def get_today_project_plans():
        today = datetime.now(pytz.timezone(settings.TIME_ZONE)).date()
        yesterday = today - timedelta(days=1)
        
        # 1단계: 어제 WorkInstruction 아카이빙 (불변으로 만들기)
        from django.db.models import Q
        yesterday_instructions = WorkInstruction.objects.filter(
            Q(created_at__date=yesterday) &
            (Q(plan_info__isnull=True) | Q(plan_info=[]))  # 아직 아카이빙 안된 것만
        ).prefetch_related('plans__product__product', 'plans__project')
        
        for instruction in yesterday_instructions:
            if instruction.plans.exists():
                # plans → plan_info로 스냅샷 저장
                instruction.plan_info = [
                    {
                        "id": plan.id,
                        "project_name": plan.project.name if plan.project.name else f"프로젝트 {plan.project.id}",
                        "product_name": plan.product.product.name,
                        "quantity": plan.quantity,
                        "status": plan.status,
                        "start_date": plan.start_date.isoformat(),
                        "end_date": plan.end_date.isoformat(),
                    }
                    for plan in instruction.plans.all()
                ]
                instruction.save(update_fields=['plan_info'])
                
                # ManyToMany 관계 제거 (Plan 삭제 시 CASCADE 영향 차단)
                instruction.plans.clear()
        
        # 2단계: 오늘 생산 계획 조회
        plans = list(
            ProjectPlan.objects.select_related(
                "project",
                "product__product",
                "equipment__factory",
            )
            .filter(
                project__status__in=[
                    Project.ProjectStatus.production,
                    Project.ProjectStatus.manufactured,
                    Project.ProjectStatus.delivery,
                    Project.ProjectStatus.completed,
                ],
                status__in=[
                    ProjectPlan.ProductionStatus.pending,
                    ProjectPlan.ProductionStatus.production,
                    ProjectPlan.ProductionStatus.completed,
                ],
                start_date__date=today,
            )
            .order_by("equipment__factory")  # groupby를 위해 정렬 필요
        )

        # factory별로 그룹화
        factory_plans = {}
        for factory_id, group in groupby(plans, key=lambda p: p.equipment.factory.id):
            plans_list = list(group)
            factory_plans[factory_id] = {
                "factory": plans_list[0].equipment.factory,
                "plans": plans_list,
            }

        # 3단계: 오늘 WorkInstruction 생성/업데이트
        for factory_id, data in factory_plans.items():
            # 오늘 날짜의 WorkInstruction 조회
            work_instruction = WorkInstruction.objects.filter(
                factory_id=factory_id,
                created_at__date=today,
            ).first()
            
            if not work_instruction:
                # 없으면 새로 생성
                work_instruction = WorkInstruction.objects.create(
                    factory_id=factory_id,
                )
            
            # 기존 또는 새로 생성된 WorkInstruction의 plans 업데이트
            work_instruction.plans.set(data["plans"])

        return {"work_instructions": len(factory_plans), "archived": yesterday_instructions.count()}

    result = await get_today_project_plans()
    return result

def update_work_instruction_for_factory(factory_id, target_date=None):
    """특정 factory의 WorkInstruction을 실시간으로 갱신"""
    if target_date is None:
        target_date = datetime.now(pytz.timezone(settings.TIME_ZONE)).date()
    
    # 해당 날짜의 생산 중인 Plan들 조회
    plans = list(
        ProjectPlan.objects.select_related(
            "project",
            "product__product",
            "equipment__factory",
        )
        .filter(
            equipment__factory_id=factory_id,
            project__status__in=[
                Project.ProjectStatus.production,
                Project.ProjectStatus.manufactured,
                Project.ProjectStatus.delivery,
                Project.ProjectStatus.completed,
            ],
            status__in=[
                ProjectPlan.ProductionStatus.pending,
                ProjectPlan.ProductionStatus.production,
                ProjectPlan.ProductionStatus.completed,
            ],
            start_date__date=target_date,
        )
        .order_by("equipment__factory")
    )
    
    if plans:
        # 해당 날짜의 WorkInstruction 조회
        work_instruction = WorkInstruction.objects.filter(
            factory_id=factory_id,
            created_at__date=target_date,
        ).first()
        
        created = False
        if not work_instruction:
            # 없으면 새로 생성
            work_instruction = WorkInstruction.objects.create(
                factory_id=factory_id,
            )
            created = True
        
        # 기존 또는 새로 생성된 WorkInstruction의 plans 업데이트
        work_instruction.plans.set(plans)
        return {"created": created}
    else:
        # Plan이 없으면 기존 WorkInstruction 삭제
        WorkInstruction.objects.filter(
            factory_id=factory_id,
            created_at__date=target_date
        ).delete()
        return {"created": False}