from ninja import Router
from helpers.decorators import scheduling_only
from project.models import Project, ProjectPlan
from asgiref.sync import sync_to_async
from django.utils import timezone
from datetime import timedelta
from websocket.utils import send_notification_to_factory
from notification.models import Notification
from document.models import Quotation


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
            is_completed=False,
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
