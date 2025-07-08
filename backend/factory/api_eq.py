from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.models import FactoryEquipment, Factory
from asgiref.sync import sync_to_async
from typing import List
from factory.schemas.inbound import (
    FactoryEqCreateIn,
    FactoryEqUpdateIn,
    FactoryEqFilter,
)
from factory.schemas.outbound import FactoryEqOut
from factory.utils import get_factory_eq_by_id, get_factory_by_id

router = Router(tags=["FactoryEquipment"])


@router.post(
    "",
    summary="[C] 공장 설비 등록",
    description="공장 설비를 등록합니다.",
    response={201: FactoryEqOut},
    auth=jwt_auth,
)
async def create_factory_eq(request, payload: FactoryEqCreateIn):
    user = request.auth
    data = payload.dict()
    # 본인의 공장인지 검증
    factory_id = data.pop("factory")
    factory = await get_factory_by_id(factory_id, user)
    factory_eq = await FactoryEquipment.objects.acreate(factory=factory, **data)
    return 201, factory_eq


@router.get(
    "",
    summary="[C] 공장 설비 목록 조회",
    description="등록된 공장 설비 목록을 조회합니다.",
    response={200: List[FactoryEqOut]},
    auth=jwt_auth,
)
@paginate
async def list_factoriesEq(request, filters: FactoryEqFilter = Query(...)):
    user = request.auth

    # 단일 쿼리로 사용자가 소유한 공장의 모든 설비 조회
    # factoriesEq = await sync_to_async(list)(
    #     FactoryEquipment.objects.filter(factory__owner=user).order_by("-created_at")
    # )
    @sync_to_async
    def get_factories_eq():
        queryset = FactoryEquipment.objects.filter(factory__owner=user).order_by(
            "-created_at"
        )
        queryset = filters.filter(queryset)
        return list(queryset)

    factoriesEq = await get_factories_eq()

    return factoriesEq


@router.get(
    "/{factory_eq_id}",
    summary="[C] 공장 설비 상세 조회",
    description="공장 설비 ID로 공장 설비 정보를 조회합니다.",
    response={200: FactoryEqOut},
    auth=jwt_auth,
)
async def get_factory_eq(request, factory_eq_id: int):
    user = request.auth
    factory_eq = await get_factory_eq_by_id(factory_eq_id, user)
    return factory_eq


@router.patch(
    "/{factory_eq_id}",
    summary="[C] 공장 설비 수정",
    description="공장 설비 정보를 수정합니다.",
    response={200: FactoryEqOut},
    auth=jwt_auth,
)
async def update_factory_eq(request, factory_eq_id: int, payload: FactoryEqUpdateIn):
    user = request.auth
    factory_eq = await get_factory_eq_by_id(factory_eq_id, user)
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(factory_eq, key, value)
    await sync_to_async(factory_eq.save)()
    return factory_eq


@router.delete(
    "/{factory_eq_id}",
    summary="[C] 공장 설비 삭제",
    description="공장 설비를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory_eq(request, factory_eq_id: int):
    user = request.auth
    factory_eq = await get_factory_eq_by_id(factory_eq_id, user)
    await factory_eq.adelete()
    return 204, None
