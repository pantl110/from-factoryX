from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from api.security import jwt_auth

from stock.models import MaterialHistory, Material
from repackaging.models import MaterialRepackaging
from repackaging.schemas.inbound import (
    MaterialRepackagingCreateIn,
    MaterialRepackagingUpdateIn,
)
from repackaging.schemas.outbound import MaterialRepackagingOut
from repackaging.utils import generate_repackaging_lot_number
from factory.utils import is_factory_member


router = Router(tags=["Repackaging"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 원자재 소분 생성",
    description="MaterialHistory(구매)에서 소분 내역을 생성합니다. 부모 이력의 잔량을 확인하고 소분합니다.",
    response={200: MaterialRepackagingOut, 400: dict, 404: dict, 500: dict},
)
async def create_material_repackaging(
    request, payload: MaterialRepackagingCreateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 부모 이력 조회
    try:
        parent_history = await MaterialHistory.objects.select_related(
            "material"
        ).aget(id=payload.parent_history_id)
    except MaterialHistory.DoesNotExist:
        raise HttpError(404, "부모 구매 이력을 찾을 수 없습니다.")

    # 구매 타입인지 확인
    if parent_history.type != MaterialHistory.MaterialHistoryType.purchase:
        raise HttpError(
            400, "소분은 구매(purchase) 타입의 이력에서만 가능합니다."
        )

    # 공장 소유권 확인
    if parent_history.material.factory_id != int(factory_id):
        raise HttpError(403, "해당 공장의 원자재 이력이 아닙니다.")

    # 잔량 확인
    current_remaining = parent_history.remaining_quantity or 0
    if payload.quantity > current_remaining:
        raise HttpError(
            400,
            f"소분 수량이 부족합니다. 현재 잔량: {current_remaining}, 요청 수량: {payload.quantity}",
        )

    if payload.quantity <= 0:
        raise HttpError(400, "소분 수량은 0보다 커야 합니다.")

    # 소분 로트 번호 생성
    lot_number = await sync_to_async(generate_repackaging_lot_number)(
        parent_history.lot_number
    )

    # 소분 내역 생성
    repackaging = await MaterialRepackaging.objects.select_related(
        "parent_history"
    ).acreate(
        parent_history=parent_history,
        lot_number=lot_number,
        quantity=payload.quantity,
        warehouse_location=payload.warehouse_location,
        expiration_date=payload.expiration_date,
    )

    # 부모 이력의 잔량 업데이트
    parent_history.remaining_quantity = current_remaining - payload.quantity
    await sync_to_async(parent_history.save)(update_fields=["remaining_quantity"])

    # 모델을 새로고침하여 property 접근 가능하도록
    await sync_to_async(repackaging.refresh_from_db)()

    return 200, MaterialRepackagingOut.model_validate(repackaging)


@router.get(
    "",
    summary="[R] 원자재 소분 내역 조회",
    description="material_id로 특정 원자재의 소분 내역을 조회합니다.",
    response=List[MaterialRepackagingOut],
)
@paginate
async def list_material_repackagings(
    request,
    material_id: int = Query(..., description="원자재 ID"),
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 원자재 존재 및 소유권 확인
    try:
        material = await Material.objects.aget(
            id=material_id, factory_id=int(factory_id)
        )
    except Material.DoesNotExist:
        raise HttpError(404, "원자재를 찾을 수 없습니다.")

    @sync_to_async
    def get_repackagings():
        queryset = (
            MaterialRepackaging.objects.filter(
                parent_history__material_id=material_id,
                parent_history__material__factory_id=int(factory_id),
            )
            .select_related("parent_history", "parent_history__material")
            .order_by("-created_at")
        )
        return list(queryset)

    repackagings = await get_repackagings()

    return [
        MaterialRepackagingOut.model_validate(repackaging) for repackaging in repackagings
    ]


@router.get(
    "/{repackaging_id}",
    summary="[R] 원자재 소분 내역 상세 조회",
    description="소분 내역 ID로 상세 정보를 조회합니다.",
    response={200: MaterialRepackagingOut, 400: dict, 404: dict, 500: dict},
)
async def get_material_repackaging_detail(request, repackaging_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 소분 내역 조회
    try:
        repackaging = await MaterialRepackaging.objects.select_related(
            "parent_history", "parent_history__material"
        ).aget(id=repackaging_id)
    except MaterialRepackaging.DoesNotExist:
        raise HttpError(404, "소분 내역을 찾을 수 없습니다.")

    # 공장 소유권 확인
    if repackaging.parent_history.material.factory_id != int(factory_id):
        raise HttpError(403, "해당 공장의 소분 내역이 아닙니다.")

    # 모델을 새로고침하여 property 접근 가능하도록
    await sync_to_async(repackaging.refresh_from_db)()

    return 200, MaterialRepackagingOut.model_validate(repackaging)


@router.patch(
    "/{repackaging_id}",
    summary="[U] 원자재 소분 내역 수정",
    description="소분 내역의 수량, 창고 위치, 유통기한을 수정합니다. 수량 수정 시 부모 이력의 잔량이 자동으로 조정됩니다.",
    response={200: MaterialRepackagingOut, 400: dict, 404: dict, 500: dict},
)
async def update_material_repackaging(
    request, repackaging_id: int, payload: MaterialRepackagingUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 소분 내역 조회
    try:
        repackaging = await MaterialRepackaging.objects.select_related(
            "parent_history", "parent_history__material"
        ).aget(id=repackaging_id)
    except MaterialRepackaging.DoesNotExist:
        raise HttpError(404, "소분 내역을 찾을 수 없습니다.")

    # 공장 소유권 확인
    if repackaging.parent_history.material.factory_id != int(factory_id):
        raise HttpError(403, "해당 공장의 소분 내역이 아닙니다.")

    fields_set = getattr(payload, "model_fields_set", set())

    # 수량 수정 처리
    if "quantity" in fields_set:
        if payload.quantity is None:
            raise HttpError(400, "수정하려는 수량은 비워둘 수 없습니다.")
        if payload.quantity <= 0:
            raise HttpError(400, "수량은 0보다 커야 합니다.")
        
        old_quantity = repackaging.quantity
        new_quantity = payload.quantity
        quantity_diff = new_quantity - old_quantity
        
        # 부모 이력의 현재 잔량 확인
        parent_history = repackaging.parent_history
        current_remaining = parent_history.remaining_quantity or 0
        
        # 수량이 증가하는 경우: 부모 잔량에서 차감
        if quantity_diff > 0:
            if quantity_diff > current_remaining:
                raise HttpError(
                    400,
                    f"수량 증가가 불가능합니다. 부모 이력의 잔량이 부족합니다. (현재 잔량: {current_remaining}, 증가량: {quantity_diff})",
                )
            parent_history.remaining_quantity = current_remaining - quantity_diff
        # 수량이 감소하는 경우: 부모 잔량에 반환
        elif quantity_diff < 0:
            parent_history.remaining_quantity = current_remaining + abs(quantity_diff)
        
        # 부모 이력 잔량 업데이트
        await sync_to_async(parent_history.save)(update_fields=["remaining_quantity"])
        
        # 소분 내역 수량 업데이트
        repackaging.quantity = new_quantity

    # 창고 위치 수정 (None 포함)
    if "warehouse_location" in fields_set:
        repackaging.warehouse_location = payload.warehouse_location

    # 유통기한 수정 (None 포함)
    if "expiration_date" in fields_set:
        repackaging.expiration_date = payload.expiration_date

    # 저장
    await sync_to_async(repackaging.save)()

    # 모델을 새로고침하여 property 접근 가능하도록
    await sync_to_async(repackaging.refresh_from_db)()

    return 200, MaterialRepackagingOut.model_validate(repackaging)


@router.delete(
    "/{repackaging_id}",
    summary="[D] 원자재 소분 내역 삭제",
    description="소분 내역을 삭제합니다. 삭제 시 부모 이력의 잔량에 소분 수량이 자동으로 반환됩니다.",
    response={204: None, 400: dict, 404: dict, 500: dict},
)
async def delete_material_repackaging(request, repackaging_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    # 소분 내역 조회
    try:
        repackaging = await MaterialRepackaging.objects.select_related(
            "parent_history", "parent_history__material"
        ).aget(id=repackaging_id)
    except MaterialRepackaging.DoesNotExist:
        raise HttpError(404, "소분 내역을 찾을 수 없습니다.")

    # 공장 소유권 확인
    if repackaging.parent_history.material.factory_id != int(factory_id):
        raise HttpError(403, "해당 공장의 소분 내역이 아닙니다.")

    # 부모 이력의 잔량에 소분 수량 반환
    parent_history = repackaging.parent_history
    current_remaining = parent_history.remaining_quantity or 0
    parent_history.remaining_quantity = current_remaining + repackaging.quantity
    await sync_to_async(parent_history.save)(update_fields=["remaining_quantity"])

    # 소분 내역 삭제
    await sync_to_async(repackaging.delete)()

    return 204, None

