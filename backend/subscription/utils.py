from subscription.models import Subscription, SubscriptionHistory, Payment, PaymentAuth
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
            "subscription_history__subscription", "subscription_history__factory"
        ).aget(id=payment_id)
        return payment
    except Payment.DoesNotExist:
        raise HttpError(
            status_code=404,
            message="해당 결제 내역을 찾을 수 없습니다.",
        )


async def get_payment_auth_by_factory(factory_id: int) -> PaymentAuth:
    """팩토리의 PaymentAuth 정보를 가져옵니다."""
    try:
        payment_auth = await PaymentAuth.objects.select_related("factory").aget(
            factory_id=factory_id
        )
        return payment_auth
    except PaymentAuth.DoesNotExist:
        raise HttpError(
            status_code=404,
            message="해당 팩토리의 결제 인증 정보를 찾을 수 없습니다.",
        )


async def get_payment_auth_by_billing_key(billing_key: str) -> PaymentAuth:
    """빌링키로 PaymentAuth 정보를 가져옵니다."""
    try:
        payment_auth = await PaymentAuth.objects.select_related("factory").aget(
            billing_key=billing_key
        )
        return payment_auth
    except PaymentAuth.DoesNotExist:
        raise HttpError(
            status_code=404,
            message="해당 빌링키의 결제 인증 정보를 찾을 수 없습니다.",
        )
