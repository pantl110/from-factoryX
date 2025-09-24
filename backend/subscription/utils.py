from subscription.models import Subscription, SubscriptionHistory, Payment, PaymentAuth
from ninja.errors import HttpError
from typing import Optional


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


# Toss issuerCode → 카드사명 매핑 유틸
ISSUER_CODE_TO_NAME = {
    "11": "KB국민카드",
    "21": "하나카드",
    "31": "BC카드",
    "33": "우리BC카드",
    "W1": "우리카드",
    "41": "신한카드",
    "51": "삼성카드",
    "61": "현대카드",
    "71": "롯데카드",
    "91": "NH농협카드",
    "15": "카카오뱅크",
    "3A": "케이뱅크",
    "24": "토스뱅크",
    "34": "Sh수협은행",
    "35": "전북은행",
    "42": "제주은행",
    "46": "광주은행",
    "30": "한국산업은행",
    "36": "씨티카드",
    "37": "우체국예금보험",
    "38": "새마을금고",
    "39": "저축은행중앙회",
    "62": "신협",
    "3K": "기업 BC",
    "4V": "VISA",
    "4M": "MasterCard",
    "7A": "American Express",
    "4J": "JCB",
    "6D": "Diners Club",
    "3C": "UnionPay",
}


def resolve_card_company_from_issuer(issuer_code: Optional[str]) -> Optional[str]:
    if not issuer_code:
        return None
    return ISSUER_CODE_TO_NAME.get(str(issuer_code))
