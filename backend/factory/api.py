from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import (
    FactoryCreateIn,
    FactoryUpdateIn,
    FactoryDetailIn,
    FactoryDeleteIn,
)
from factory.schemas.outbound import FactoryOut
from factory.models import Factory
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import get_factory_by_id
from ninja.errors import HttpError
from factory.utils import is_factory_member

router = Router(tags=["Factory"])


# Onboarding Tab
@router.post(
    "",
    summary="[C] 공장 등록",
    description="공장을 등록하고 권한을 관리자로 설정합니다.",
    response={201: dict},
    auth=jwt_auth,
)
async def create_factory(request):
    user = request.auth
    factory = await Factory.objects.acreate(owner=user)
    # owner를 admin 권한으로 FactoryMember에 자동 등록
    from factory.models import FactoryMember

    await FactoryMember.objects.acreate(
        factory=factory,
        user=user,
        role=FactoryMember.FactoryMemberType.admin,
        status=FactoryMember.MemberStatus.active,
        invited_by=user,
    )
    return 201, {"factory_id": factory.id}


@router.get(
    "",
    summary="[C] 본인의 공장 목록 조회",
    description="사용자가 멤버로 등록된 공장 목록을 조회합니다.",
    response={200: List[FactoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_factories(request):
    user = request.auth

    @sync_to_async
    def get_factories():
        from factory.models import FactoryMember
        member_factories = FactoryMember.objects.filter(
            user=user, 
            status=FactoryMember.MemberStatus.active
        ).values_list('factory_id', flat=True)
        
        queryset = Factory.objects.filter(id__in=member_factories).order_by("-created_at")
        return list(queryset)

    factories = await get_factories()
    return factories


@router.get(
    "/{factory_id}",
    summary="[C] 공장 상세 조회",
    description="공장 ID로 공장 정보를 조회합니다.",
    response={200: FactoryOut},
    auth=jwt_auth,
)
async def get_factory(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id, user)
    return factory


@router.patch(
    "/{factory_id}",
    summary="[C] 공장 정보 수정",
    description="공장 ID로 공장 정보를 수정합니다.",
    response={200: FactoryOut},
    auth=jwt_auth,
)
async def update_factory(request, factory_id: int, payload: FactoryUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    factory = await get_factory_by_id(factory_id, user)
    for attr, value in data.items():
        setattr(factory, attr, value)
    await factory.asave()
    return factory


@router.delete(
    "/{factory_id}",
    summary="[C] 공장 삭제",
    description="공장 ID로 공장을 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory(request, factory_id: int):
    user = request.auth
    factory = await get_factory_by_id(factory_id, user)
    await factory.adelete()
    return 204, None
