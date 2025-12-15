from ninja import Router
from api.security import jwt_auth
from factory.schemas.inbound import FactoryUpdateIn
from factory.schemas.outbound import FactoryModelOut, FactoryModelDetailOut
from factory.models import Factory, FactoryMember
from user.models import User
from typing import List
from ninja.errors import HttpError
from factory.utils import get_factory_by_id, is_factory_member
from asgiref.sync import sync_to_async
from django.db.models import Prefetch
from subscription.models import Subscription, SubscriptionHistory
from datetime import date
from dateutil.relativedelta import relativedelta
from django.db import transaction


router = Router(tags=["Factory"])


# Onboarding Tab
@router.post(
    "",
    summary="[C] 공장 등록",
    description="공장을 등록하고 권한을 관리자로 설정합니다. 트라이얼 구독도 자동으로 생성됩니다. 이미 다른 공장의 멤버인 경우 기존 멤버십은 모두 삭제됩니다.",
    response={201: dict},
    auth=jwt_auth,
)
async def create_factory(request):
    user = request.auth

    @sync_to_async
    @transaction.atomic
    def create_factory_with_trial():
        # 새 공장 생성
        factory = Factory.objects.create(owner=user)

        # 새 공장에 관리자로 등록
        FactoryMember.objects.create(
            factory=factory,
            user=user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=user,
        )

        # 사용자가 다른 공장의 멤버인 경우 모두 삭제 (새 공장 제외)
        other_factory_members = FactoryMember.objects.filter(user=user).exclude(factory=factory)
        if other_factory_members.exists():
            other_factory_members.delete()

        # 트라이얼 구독 플랜 조회 (type으로 조회)
        trial_subscription = Subscription.objects.filter(type=Subscription.SubscriptionType.trial).first()
        if not trial_subscription:
            raise ValueError("트라이얼 구독 플랜이 존재하지 않습니다. 관리자에게 문의해주세요.")

        # 트라이얼 구독 히스토리 생성 (1개월)
        start_date = date.today()
        end_date = start_date + relativedelta(months=1)

        SubscriptionHistory.objects.create(
            factory=factory,
            subscription=trial_subscription,
            start_date=start_date,
            end_date=end_date,
            is_canceled=False,
        )

        return factory

    factory = await create_factory_with_trial()
    return 201, {"factory_id": factory.id}


@router.get(
    "",
    summary="[C] 본인의 공장 목록 조회",
    description="사용자가 멤버로 등록된 공장 목록을 조회합니다.",
    response={200: List[FactoryModelOut]},
    auth=jwt_auth,
)
async def list_factories(request):
    user = request.auth

    @sync_to_async
    def get_factories():
        # 현재 사용자의 활성 멤버십만 미리 로드
        user_member_prefetch = Prefetch(
            "members",
            queryset=FactoryMember.objects.filter(
                user=user, status=FactoryMember.MemberStatus.active
            ),
            to_attr="user_members",
        )

        factories = list(
            Factory.objects.prefetch_related("members", user_member_prefetch)
            .filter(
                members__user=user, members__status=FactoryMember.MemberStatus.active
            )
            # .annotate(
            #     trial_end_date=TruncDate(
            #         F("created_at") + timedelta(months=settings.TRIAL_PERIOD_MONTHS)
            #     )
            # )
            .order_by("-members__invited_at")
            .distinct()
        )
        
        # 각 공장에 멤버 정보 설정 (user_members 리스트의 첫 번째 요소)
        for factory in factories:
            if factory.user_members:
                factory.member = factory.user_members[0]

        return factories

    factories = await get_factories()

    return factories


@router.get(
    "/detail",
    summary="[C] 공장 상세 조회",
    description="공장 ID로 공장 정보를 조회합니다.",
    response={200: FactoryModelDetailOut},
    auth=jwt_auth,
)
async def get_factory(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth

    factory = await get_factory_by_id(int(factory_id))
    member = await is_factory_member(int(factory_id), user)
    factory.member = member
    return factory


@router.patch(
    "",
    summary="[C] 공장 정보 수정",
    description="공장 ID로 공장 정보를 수정합니다.",
    response={200: FactoryModelOut},
    auth=jwt_auth,
)
async def update_factory(request, payload: FactoryUpdateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    member = await is_factory_member(int(factory_id), user)
    factory = await get_factory_by_id(int(factory_id))

    # 사업자등록번호 변경 전 값 저장
    old_business_registration_number = factory.business_registration_number

    # None이 아닌 값만 업데이트
    data = payload.dict(exclude_unset=True)

    # 사업자등록번호가 변경되는지 확인
    business_registration_number_changed = (
        "business_registration_number" in data
        and data["business_registration_number"] != old_business_registration_number
    )

    for field, value in data.items():
        setattr(factory, field, value)

    await factory.asave()

    # 사업자등록번호가 변경되었고, 바로빌 인증이 있는 경우 모든 멤버의 인증 상태 초기화
    if business_registration_number_changed:
        @sync_to_async
        @transaction.atomic
        def reset_barobill_auth():
            # 해당 공장의 모든 멤버 중 바로빌 인증이 있는 멤버 확인
            barobill_members = FactoryMember.objects.filter(
                factory=factory, is_barobill_user=True
            )
            
            if barobill_members.exists():
                # 해당 공장의 모든 멤버의 바로빌 인증 상태 초기화
                # 먼저 초기화될 barobill_id 목록 저장 (User 초기화에 사용)
                reset_barobill_ids = [
                    bid for bid in barobill_members.values_list("barobill_id", flat=True)
                    if bid is not None
                ]
                
                FactoryMember.objects.filter(factory=factory).update(
                    is_barobill_user=False,
                    barobill_id=None,
                    barobill_password=None,
                )
                
                # 해당 공장의 멤버인 User들의 barobill_user_id도 초기화
                # 해당 공장의 멤버의 barobill_id와 일치하는 User의 barobill_user_id만 초기화
                if reset_barobill_ids:
                    User.objects.filter(
                        factory_members__factory=factory,
                        barobill_user_id__in=reset_barobill_ids
                    ).distinct().update(barobill_user_id=None)

        await reset_barobill_auth()

    factory.member = member
    return factory


@router.delete(
    "",
    summary="[C] 공장 삭제",
    description="공장 ID로 공장을 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory(request):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory = await get_factory_by_id(int(factory_id))

    await factory.adelete()
    return 204, None
