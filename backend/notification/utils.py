from ninja.errors import HttpError
from notification.models import Notification


async def get_notification_by_id(notification_id: int) -> Notification:
    """
    Fetch a notification by its ID.
    """
    try:
        notification = await Notification.objects.aget(id=notification_id)
        return notification
    except Notification.DoesNotExist:
        raise HttpError(404, "해당 알림을 찾을 수 없습니다.")
