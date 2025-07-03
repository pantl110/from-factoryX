from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import FactoryCreateIn, FactoryUpdateIn
from factory.schemas.outbound import FactoryOut
from factory.models import Factory
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import get_factory_by_id

router = Router(tags=["Factory"])


@router.post(
    "",
    summary="[C] 공장 등록",
    description="공장을 등록합니다.",
    response={201: FactoryOut},
    auth=jwt_auth,
)
async def create_factory(request, payload: FactoryCreateIn):
    user = request.auth
    factory = await Factory.objects.acreate(
        owner=user,
        **payload.dict(),
    )
    return 201, factory


@router.get(
    "",
    summary="[C] 본인의 공장 목록 조회",
    description="등록된 공장 목록을 조회합니다.",
    response={200: List[FactoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_factories(request):
    user = request.auth
    factories = await sync_to_async(list)(
        Factory.objects.filter(owner=user).order_by("-created_at")
    )
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
    factory = await get_factory_by_id(factory_id, user)
    for attr, value in payload.dict(exclude_unset=True).items():
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
