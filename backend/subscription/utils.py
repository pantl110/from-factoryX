from subscription.models import Subscription
from ninja.errors import HttpError


async def get_subscription_by_id(subscription_id: int) -> Subscription:
    try:
        subscription = await Subscription.objects.aget(id=subscription_id)
        return subscription
    except Subscription.DoesNotExist:
        raise HttpError(
            status_code=404,
            message="해당 구독을 찾을 수 없습니다.",
        )
