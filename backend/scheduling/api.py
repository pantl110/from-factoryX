from ninja import Router
from helpers.decorators import scheduling_only
from project.models import Project, ProjectPlan
from asgiref.sync import sync_to_async
from django.utils import timezone
from datetime import timedelta
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
            materials = product_material_map.get(plan.product.product.id, [])
            for mp in materials:
                required_qty = mp.quantity * plan.quantity
                if mp.material.current_stock < required_qty:
                    break
            else:  # for문이 break 없이 끝났으면 재고 충분
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
