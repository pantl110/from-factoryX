from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from notification.models import Notification
from notification.schemas.outbound import NotificationOut
from factory.utils import is_factory_member
from asgiref.sync import sync_to_async
from typing import List
from notification.utils import get_notification_by_id
from factory.utils import get_factory_by_id
from channels.layers import get_channel_layer
from websocket.utils import send_notification_to_factory
from django.utils import timezone
from datetime import timedelta


router = Router(tags=["Notification"], auth=jwt_auth)


@router.get(
    "",
    summary="[C] 알림 조회(3일 이내)",
    description="해당 공장에 대한 알림을 조회합니다.",
    response=List[NotificationOut],
)
@paginate
async def get_notifications(request, factory_id: int):

    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    @sync_to_async
    def get_notifications_for_member():
        queryset = Notification.objects.filter(
            receiver=member, created_at__gte=timezone.now() - timedelta(days=3)
        )
        queryset = queryset.order_by("-created_at")
        return list(queryset)

    notifications = await get_notifications_for_member()

    return notifications


@router.get(
    "/read",
    summary="[C] 알림 모두 읽음 처리",
    description="읽지 않은 알림을 모두 읽음 처리합니다.",
    response=List[NotificationOut],
)
async def get_unread_notifications(request, factory_id: int):

    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    @sync_to_async
    def mark_all_notifications_as_read():
        all_notifications = Notification.objects.filter(receiver=member).order_by(
            "-created_at"
        )
        notifications = Notification.objects.filter(receiver=member, is_read=False)
        notifications.update(is_read=True)
        return list(all_notifications)

    notifications = await mark_all_notifications_as_read()

    return notifications


@router.get(
    "/test/{factory_id}",
    summary="[C] 알림 테스트",
    description="새로운 알림을 생성합니다.",
)
async def websocket_test_notification(request, factory_id: int):

    user = request.auth
    factory = await get_factory_by_id(factory_id)

    # 기존 코드 (주석 처리)
    # channel_layer = get_channel_layer()
    # await channel_layer.group_send(
    #     f"notification_{factory.id}",
    #     {
    #         "type": "send_notification",
    #         "notification": "test",
    #         "message": "This is a test notification.",
    #     },
    # )

    # utils.py의 NotificationSender를 사용하여 factory member들에게 알림 전송
    result = await send_notification_to_factory(
        factory_id=factory.id,
        notification_type="information",
        notification_case="test",
        content="This is a test notification.",
        additional_data={"test": True},
    )

    return {"message": "Test notification sent to factory members", "result": result}


@router.get(
    "/{notification_id}",
    summary="[C] 알림 상세 조회(개별 읽음 처리)",
    description="알림의 상세 정보를 조회합니다.",
    response=NotificationOut,
)
async def get_notification_detail(request, factory_id: int, notification_id: int):

    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    notification = await get_notification_by_id(notification_id)
    notification.is_read = True
    await notification.asave()

    return notification
