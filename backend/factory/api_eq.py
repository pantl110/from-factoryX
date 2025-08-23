from ninja import Router, Query
from ninja.pagination import paginate
from ninja.errors import HttpError
from api.security import jwt_auth
from factory.models import FactoryEquipment, Factory
from asgiref.sync import sync_to_async
from typing import List
from factory.schemas.inbound import (
    FactoryEqCreateIn,
    FactoryEqUpdateIn,
    FactoryEqFilter,
)
from factory.schemas.outbound import FactoryEqOut, FactoryEqModelOut
from factory.utils import is_factory_member
from factory.eq_utils import get_equipment_by_id
from project.models import ProjectPlan


router = Router(tags=["FactoryEquipment"])


@router.post(
    "",
    summary="[C] 공장 설비 등록",
    description="공장 설비를 등록합니다.",
    response={201: FactoryEqOut},
    auth=jwt_auth,
)
async def create_factory_eq(request, payload: FactoryEqCreateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict(exclude_unset=True)

    factory_eq = await FactoryEquipment.objects.acreate(factory_id=factory_id, **data)

    return 201, factory_eq


@router.get(
    "",
    summary="[R] 공장 설비 목록 조회",
    description="공장의 설비 목록을 조회합니다.",
    response={200: List[FactoryEqOut]},
    auth=jwt_auth,
)
@paginate
async def list_factory_eqs(
    request, factory_id: int, filters: FactoryEqFilter = Query(...)
):

    user = request.auth
    await is_factory_member(factory_id, user)

    @sync_to_async
    def get_factory_eqs():
        queryset = FactoryEquipment.objects.filter(factory_id=factory_id)
        queryset = filters.filter(queryset)
        return list(queryset)

    equipment_list = await get_factory_eqs()
    return equipment_list


@router.get(
    "/{factory_eq_id}",
    summary="[C] 공장 설비 상세 조회",
    description="공장 설비의 상세 정보를 조회합니다.",
    response={200: FactoryEqModelOut},
    auth=jwt_auth,
)
async def get_factory_eq(request, factory_eq_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory_eq = await get_equipment_by_id(factory_eq_id, factory_id)

    return factory_eq


@router.patch(
    "/{factory_eq_id}",
    summary="[C] 공장 설비 수정",
    description="공장 설비 정보를 수정합니다.",
    response={200: FactoryEqModelOut},
    auth=jwt_auth,
)
async def update_factory_eq(request, factory_eq_id: int, payload: FactoryEqUpdateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory_eq = await get_equipment_by_id(factory_eq_id, factory_id)

    # None이 아닌 값만 업데이트
    data = payload.dict(exclude_unset=True)

    for field, value in data.items():
        setattr(factory_eq, field, value)

    await factory_eq.asave()

    return factory_eq


@router.delete(
    "/{factory_eq_id}",
    summary="[C] 공장 설비 삭제",
    description="공장 설비를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory_eq(request, factory_eq_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    factory_eq = await get_equipment_by_id(factory_eq_id, factory_id)

    await factory_eq.adelete()
    return 204, None
