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
from factory.schemas.outbound import FactoryEqOut, FactoryEqDetailOut
from factory.utils import is_factory_member
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
    # None 값 필터링
    data = {k: v for k, v in data.items() if v is not None}

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")

    factory_eq = await FactoryEquipment.objects.acreate(factory=factory, **data)

    return 201, {
        "id": factory_eq.id,
        "factory": factory_eq.factory_id,
        "name": factory_eq.name,
        "status": factory_eq.status,
        "priority": factory_eq.priority,
        "location": factory_eq.location,
        "note": factory_eq.note,
        "created_at": (
            factory_eq.created_at.isoformat() if factory_eq.created_at else None
        ),
        "updated_at": (
            factory_eq.updated_at.isoformat() if factory_eq.updated_at else None
        ),
    }


@router.get(
    "",
    summary="[R] 공장 설비 목록 조회",
    description="공장의 설비 목록을 조회합니다.",
    response={200: List[FactoryEqOut]},
    auth=jwt_auth,
)
@paginate
async def list_factory_eqs(request, filters: FactoryEqFilter = Query(...)):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")

    queryset = FactoryEquipment.objects.filter(factory=factory)

    # 필터 적용
    if filters.name:
        queryset = queryset.filter(name__icontains=filters.name)
    if filters.status:
        queryset = queryset.filter(status=filters.status)
    if filters.location:
        queryset = queryset.filter(location__icontains=filters.location)

    @sync_to_async
    def get_equipment_list():
        return list(queryset)

    equipment_list = await get_equipment_list()

    # 모델 객체를 딕셔너리로 변환
    result = []
    for equipment in equipment_list:
        result.append(
            {
                "id": equipment.id,
                "factory": equipment.factory_id,
                "name": equipment.name,
                "status": equipment.status,
                "priority": equipment.priority,
                "location": equipment.location,
                "note": equipment.note,
                "created_at": (
                    equipment.created_at.isoformat() if equipment.created_at else None
                ),
                "updated_at": (
                    equipment.updated_at.isoformat() if equipment.updated_at else None
                ),
            }
        )

    return result


@router.get(
    "/{factory_eq_id}",
    summary="[R] 공장 설비 상세 조회",
    description="공장 설비의 상세 정보를 조회합니다.",
    response={200: FactoryEqDetailOut},
    auth=jwt_auth,
)
async def get_factory_eq(request, factory_eq_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory_eq = await FactoryEquipment.objects.aget(
            id=factory_eq_id, factory_id=int(factory_id)
        )
    except FactoryEquipment.DoesNotExist:
        raise HttpError(404, "해당 설비가 존재하지 않습니다.")

    history = await sync_to_async(list)(
        ProjectPlan.objects.filter(equipment=factory_eq)
    )

    return {
        "id": factory_eq.id,
        "factory": factory_eq.factory_id,
        "name": factory_eq.name,
        "status": factory_eq.status,
        "priority": factory_eq.priority,
        "location": factory_eq.location,
        "note": factory_eq.note,
        "created_at": (
            factory_eq.created_at.isoformat() if factory_eq.created_at else None
        ),
        "updated_at": (
            factory_eq.updated_at.isoformat() if factory_eq.updated_at else None
        ),
        "history": history,
    }


@router.patch(
    "/{factory_eq_id}",
    summary="[U] 공장 설비 수정",
    description="공장 설비 정보를 수정합니다.",
    response={200: FactoryEqDetailOut},
    auth=jwt_auth,
)
async def update_factory_eq(request, factory_eq_id: int, payload: FactoryEqUpdateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory_eq = await FactoryEquipment.objects.aget(
            id=factory_eq_id, factory_id=int(factory_id)
        )
    except FactoryEquipment.DoesNotExist:
        raise HttpError(404, "해당 설비가 존재하지 않습니다.")

    # None이 아닌 값만 업데이트
    update_data = payload.dict(exclude_unset=True)
    update_data = {k: v for k, v in update_data.items() if v is not None}

    for field, value in update_data.items():
        setattr(factory_eq, field, value)

    await factory_eq.asave()

    history = await sync_to_async(list)(
        ProjectPlan.objects.filter(equipment=factory_eq)
    )

    return {
        "id": factory_eq.id,
        "factory": factory_eq.factory_id,
        "name": factory_eq.name,
        "status": factory_eq.status,
        "priority": factory_eq.priority,
        "location": factory_eq.location,
        "note": factory_eq.note,
        "created_at": (
            factory_eq.created_at.isoformat() if factory_eq.created_at else None
        ),
        "updated_at": (
            factory_eq.updated_at.isoformat() if factory_eq.updated_at else None
        ),
        "history": history,
    }


@router.delete(
    "/{factory_eq_id}",
    summary="[D] 공장 설비 삭제",
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

    try:
        factory_eq = await FactoryEquipment.objects.aget(
            id=factory_eq_id, factory_id=int(factory_id)
        )
    except FactoryEquipment.DoesNotExist:
        raise HttpError(404, "해당 설비가 존재하지 않습니다.")

    await factory_eq.adelete()
    return 204, None
