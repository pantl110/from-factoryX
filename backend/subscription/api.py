from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from typing import List
from asgiref.sync import sync_to_async
from subscription.models import Subscription, SubscriptionHistory
from subscription.schemas.inbound import SubscriptionHistoryIn
from subscription.schemas.outbound import SubscriptionOut, SubscriptionHistoryOut
from factory.utils import get_factory_by_id, is_factory_member
from subscription.utils import get_subscription_by_id
from django.utils import timezone
from datetime import timedelta
from django.db import transaction


router = Router(tags=["Subscription"])


@router.get(
    "",
    summary="[C] 플랜 목록 조회",
    description="플랜 목록을 조회합니다.",
    response=List[SubscriptionOut],
)
@paginate
async def get_subscriptions(request):
    subscriptions = await sync_to_async(list)(Subscription.objects.all())
    return subscriptions


@router.get(
    "/{factory_id}",
    summary="[C] 공장 구독 내역 조회",
    description="특정 공장의 구독 내역을 조회합니다.",
    response=List[SubscriptionHistoryOut],
    auth=jwt_auth,
)
@paginate
async def get_subscription_histories(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)

    histories = await sync_to_async(list)(
        SubscriptionHistory.objects.filter(factory=factory).select_related(
            "subscription", "factory"
        )
    )

    return histories


@router.post(
    "/{factory_id}",
    summary="[C] 구독 생성",
    description="특정 공장에 대한 구독을 생성합니다.",
    response={201: SubscriptionHistoryOut},
    auth=jwt_auth,
)
async def create_subscription_history(
    request, factory_id: int, payload: SubscriptionHistoryIn
):
    user = request.auth
    factory = await get_factory_by_id(factory_id)
    member = await is_factory_member(factory_id, user)
    subscription = await get_subscription_by_id(payload.subscription)

    # 이미 구독이 있는지 확인
    existing_history = await SubscriptionHistory.objects.filter(
        factory=factory,
        end_date__gt=timezone.now(),
    ).aexists()
    if existing_history:
        raise HttpError(
            status_code=400,
            message="이미 결제된 구독이 존재합니다.",
        )

    @sync_to_async
    @transaction.atomic
    def create_subscription():
        subscription_history = SubscriptionHistory.objects.create(
            factory=factory,
            subscription=subscription,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
        )
        return subscription_history

    subscription_history = await create_subscription()
    return 201, subscription_history
