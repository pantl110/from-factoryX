from subscription.models import Subscription, SubscriptionHistory, Payment, PaymentAuth
from ninja.errors import HttpError
from typing import Optional
from asgiref.sync import sync_to_async
from django.db import transaction
from datetime import timedelta
import logging
from factory.utils import get_factory_by_id, is_factory_member
from subscription.schemas.inbound import SubscriptionPaymentIn
from django.utils import timezone


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


logger = logging.getLogger(__name__)


async def change_subscription_plan(
    request,
    factory_id: int,
    payload: SubscriptionPaymentIn,
    existing_history_id: int,
):
    """구독 플랜 변경 - 기존 구독은 만료일까지 유지, 다음 날부터 새 플랜으로 시작"""
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    new_subscription = await get_subscription_by_id(payload.subscription_id)

    # 기존 히스토리 로드
    existing_history = await sync_to_async(
        lambda: SubscriptionHistory.objects.select_related("subscription", "factory").get(id=existing_history_id)
    )()

    @sync_to_async
    @transaction.atomic
    def update_existing_subscription():
        # 기존 구독의 종료일은 그대로 유지 (이미 설정된 종료일)
        # 다음 구독 히스토리 생성 (기존 구독 종료일 + 1일부터 시작)
        from dateutil.relativedelta import relativedelta
        
        next_start_date = existing_history.end_date + timedelta(days=1) # 기존 구독 종료일 + 1일
        scheduled_next = (
            SubscriptionHistory.objects.filter(
                factory=factory,
                start_date=next_start_date,
            )
            .select_related("subscription")
            .first()
        )

        if scheduled_next:
            # 이미 예약된 다음 구독이 있으면 해당 구독 갱신
            scheduled_next.subscription = new_subscription
            scheduled_next.end_date = existing_history.end_date + relativedelta(months=1)
            scheduled_next.billing_key = payload.billing_key
            scheduled_next.customer_key = payload.customer_key
            scheduled_next.is_canceled = False
            scheduled_next.save(
                update_fields=[
                    "subscription",
                    "end_date",
                    "billing_key",
                    "customer_key",
                    "is_canceled",
                ]
            )
            return scheduled_next

        # 예약된 구독이 없으면 새로 생성
        return SubscriptionHistory.objects.create(
            factory=factory,
            subscription=new_subscription,
            start_date=next_start_date,
            end_date=existing_history.end_date + relativedelta(months=1), # 기존 구독 종료일 + 1개월
            billing_key=payload.billing_key,
            customer_key=payload.customer_key,
            is_canceled=False,
        )

    next_subscription_history = await update_existing_subscription()

    result = {
        "message": "구독 플랜이 변경되었습니다. 기존 구독은 설정된 종료일까지 유지되고, 그 다음부터 새 플랜이 시작됩니다.",
        "current_subscription": {
            "id": existing_history.subscription_id,
            "type": existing_history.subscription.type,
            "end_date": existing_history.end_date.isoformat(),
        },
        "next_subscription": {
            "id": next_subscription_history.subscription_id,
            "type": next_subscription_history.subscription.type,
            "start_date": next_subscription_history.start_date.isoformat(),
            "end_date": next_subscription_history.end_date.isoformat(),
        }
    }

    logger.info(
        f"구독 플랜 변경: factory_id={factory_id}, "
        f"기존={existing_history.subscription.type} (종료: {existing_history.end_date}), "
        f"신규={new_subscription.type} (시작: {next_subscription_history.start_date})"
    )
    
    return 200, result
