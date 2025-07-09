from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import FactoryCreateIn, FactoryUpdateIn, FactoryFilter, FactoryDetailIn, FactoryDeleteIn
from factory.schemas.outbound import FactoryOut
from factory.models import Factory
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import get_factory_by_id

router = Router(tags=["Factory"])


@router.post(
    "/factories",
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
    "/factories",
    summary="[C] 본인의 공장 목록 조회",
    description="등록된 공장 목록을 조회합니다.",
    response={200: List[FactoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_factories(request, filters: FactoryFilter = Query(...)):
    user = request.auth
    
    @sync_to_async
    def get_factories():
        queryset = Factory.objects.filter(owner=user).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)
    
    factories = await get_factories()
    return factories


@router.get(
    "/factories/{factory_id}",
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
    "/factories",
    summary="[C] 공장 정보 수정",
    description="공장 ID로 공장 정보를 수정합니다.",
    response={200: FactoryOut},
    auth=jwt_auth,
)
async def update_factory(request, payload: FactoryUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    factory_id = data.pop("factory_id")
    factory = await get_factory_by_id(factory_id, user)
    for attr, value in data.items():
        setattr(factory, attr, value)
    await factory.asave()
    return factory


@router.delete(
    "/factories",
    summary="[C] 공장 삭제",
    description="공장 ID로 공장을 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory(request, payload: FactoryDeleteIn):
    user = request.auth
    factory = await get_factory_by_id(payload.factory_id, user)
    await factory.adelete()
    return 204, None
