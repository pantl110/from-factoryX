from ninja import Router
from api.security import jwt_auth
from factory.schemas.inbound import FactoryUpdateIn
from factory.schemas.outbound import FactoryModelOut, FactoryModelDetailOut
from factory.models import Factory, FactoryMember
from typing import List
from ninja.errors import HttpError
from factory.utils import get_factory_by_id, is_factory_member
from asgiref.sync import sync_to_async
from django.db.models import Prefetch
from django.db.models import F
from django.db.models.functions import TruncDate
from datetime import timedelta
from django.conf import settings


router = Router(tags=["Factory"])


# Onboarding Tab
@router.post(
    "",
    summary="[C] 공장 등록",
    description="공장을 등록하고 권한을 관리자로 설정합니다. 이미 다른 공장의 멤버인 경우 기존 멤버십은 모두 삭제됩니다.",
    response={201: dict},
    auth=jwt_auth,
)
async def create_factory(request):
    user = request.auth

    # 새 공장 생성
    factory = await Factory.objects.acreate(owner=user)

    # 새 공장에 관리자로 등록
    await FactoryMember.objects.acreate(
        factory=factory,
        user=user,
        role=FactoryMember.FactoryMemberType.admin,
        status=FactoryMember.MemberStatus.active,
        invited_by=user,
    )

    # 사용자가 다른 공장의 멤버인 경우 모두 삭제 (새 공장 제외)
    other_factory_members = (
        await FactoryMember.objects.filter(user=user).exclude(factory=factory).aexists()
    )

    if other_factory_members:
        await FactoryMember.objects.filter(user=user).exclude(factory=factory).adelete()

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
            .annotate(
                trial_end_date=TruncDate(
                    F("created_at") + timedelta(months=settings.TRIAL_PERIOD_MONTHS)
                )
            )
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

    # None이 아닌 값만 업데이트
    data = payload.dict(exclude_unset=True)

    for field, value in data.items():
        setattr(factory, field, value)

    await factory.asave()

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
