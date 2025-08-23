from subscription.models import Subscription, SubscriptionHistory, Payment
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


async def get_subscription_history_by_id(history_id: int) -> SubscriptionHistory:
    try:
        history = await SubscriptionHistory.objects.select_related(
            "subscription", "factory"
        ).aget(id=history_id)
        return history
    except SubscriptionHistory.DoesNotExist:
        raise HttpError(
            status_code=404,
            message="해당 구독 내역을 찾을 수 없습니다.",
        )


async def get_payment_by_id(payment_id: int) -> Payment:
    try:
        payment = await Payment.objects.select_related(
            "subscription_history", "subscription_history__factory"
        ).aget(id=payment_id)
        return payment
    except Payment.DoesNotExist:
        raise HttpError(
            status_code=404,
            message="해당 결제 내역을 찾을 수 없습니다.",
        )
