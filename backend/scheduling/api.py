from ninja import Router
from helpers.decorators import scheduling_only
from project.models import Project, ProjectPlan
from asgiref.sync import sync_to_async
from django.utils import timezone
from datetime import timedelta
from websocket.utils import send_notification, send_notification_to_factory
from notification.models import Notification


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
    def get_projects_with_deadline():
        queryset = Project.objects.filter(
            is_refunded=False,
            # deadline__lt=timezone.now() + timedelta(days=3)
        )
        return list(queryset)

    projects = await get_projects_with_deadline()
    return {"projects": len(projects)}


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
        return queryset

    @sync_to_async
    def update_end_notification(plans):
        plans.update(end_notification=True)
        return plans.count()

    plans = await get_end_project_plan()
    for plan in plans:
        await send_notification_to_factory(
            factory_id=plan.equipment.factory.id,
            notification_type=Notification.NotificationType.completed,
            notification_case=Notification.NotificationCase.product_completed,
            content=f"{plan.product.product.name} 생산 완료",
        )

    plan_count = await update_end_notification(plans)
    return {"plans": plan_count}
