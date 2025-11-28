from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from datetime import datetime
from api.security import jwt_auth

from stock.models import Material, MaterialHistory
from stock.schemas.outbound import MaterialAvailableLotOut, MaterialHistoryDetailOut
from stock.schemas.inbound import MaterialHistoryUpdateIn
from factory.utils import is_factory_member
from repackaging.models import MaterialRepackaging

router = Router(tags=["MaterialHistory V2"], auth=jwt_auth)


@router.get(
    "/available-lots",
    summary="[C] 원자재별 사용 가능한 로트 목록 조회",
    description="특정 원자재에 대해 MaterialHistory와 소분(MaterialRepackaging)에서 잔여 수량이 0이 아닌 로트 번호 목록을 페이지네이션하여 조회합니다.",
    response=List[MaterialAvailableLotOut],
)
@paginate
async def list_available_lots(
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
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    try:

        @sync_to_async
        def get_available_lots():
            lots: list[dict] = []

            # 1) 구매 이력 중 remaining_quantity > 0인 로트
            history_qs = MaterialHistory.objects.filter(
                material_id=material.id,
                material__factory_id=int(factory_id),
                type=MaterialHistory.MaterialHistoryType.purchase,
                remaining_quantity__gt=0,
            )
            for h in history_qs:
                lots.append(
                    {
                        "source": "history",
                        "id": h.id,
                        "lot_number": h.lot_number,
                        "available_quantity": h.remaining_quantity,
                        "warehouse_location": h.warehouse_location,
                        "expiration_date": h.expiration_date.isoformat()
                        if h.expiration_date
                        else None,
                    }
                )

            # 2) 소분 이력 중 quantity > 0인 로트
            repack_qs = MaterialRepackaging.objects.filter(
                parent_history__material_id=material.id,
                parent_history__material__factory_id=int(factory_id),
                quantity__gt=0,
            ).select_related("parent_history")
            for r in repack_qs:
                lots.append(
                    {
                        "source": "repackaging",
                        "id": r.id,
                        "lot_number": r.lot_number,
                        "available_quantity": r.quantity,
                        "warehouse_location": r.warehouse_location,
                        "expiration_date": r.expiration_date.isoformat()
                        if r.expiration_date
                        else None,
                    }
                )

            # 유통기한 → 로트 번호 순 정렬
            def sort_key(item: dict):
                exp = item.get("expiration_date") or ""
                lot = item.get("lot_number") or ""
                return (exp, lot)

            lots.sort(key=sort_key)
            return lots

        lots = await get_available_lots()
        return lots

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(
            500, f"사용 가능한 로트 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get(
    "/{history_id}",
    summary="[R] 원자재 이력 상세 조회",
    description="원자재 이력 ID로 상세 정보를 조회합니다. lot번호, 입고수량, 남은수량, 창고위치, 유통기한을 반환합니다.",
    response={200: MaterialHistoryDetailOut, 404: dict, 500: dict},
)
async def get_material_history(
    request,
    history_id: int,
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        @sync_to_async
        def get_history_detail():
            try:
                history = MaterialHistory.objects.select_related(
                    "material"
                ).get(
                    id=history_id,
                    material__factory_id=int(factory_id)
                )
            except MaterialHistory.DoesNotExist:
                raise HttpError(404, "해당 원자재 이력을 찾을 수 없습니다.")

            return history

        history = await get_history_detail()
        return 200, MaterialHistoryDetailOut.model_validate(history)

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(
            500, f"원자재 이력 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.patch(
    "/{history_id}",
    summary="[U] 원자재 이력 수정",
    description="원자재 이력의 창고위치와 유통기한을 수정합니다.",
    response={200: MaterialHistoryDetailOut, 400: dict, 404: dict, 500: dict},
)
async def update_material_history(
    request,
    history_id: int,
    payload: MaterialHistoryUpdateIn,
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        @sync_to_async
        def update_history():
            try:
                history = MaterialHistory.objects.select_related(
                    "material"
                ).get(
                    id=history_id,
                    material__factory_id=int(factory_id)
                )
            except MaterialHistory.DoesNotExist:
                raise HttpError(404, "해당 원자재 이력을 찾을 수 없습니다.")

            # 창고위치 업데이트
            if payload.warehouse_location is not None:
                history.warehouse_location = payload.warehouse_location

            # 유통기한 업데이트
            if payload.expiration_date is not None:
                try:
                    expiration_date = datetime.strptime(
                        payload.expiration_date, "%Y-%m-%d"
                    ).date()
                    history.expiration_date = expiration_date
                except (ValueError, AttributeError):
                    raise HttpError(400, "유통기한 형식이 올바르지 않습니다. (YYYY-MM-DD)")

            history.save(update_fields=["warehouse_location", "expiration_date"])

            return history

        history = await update_history()
        return 200, MaterialHistoryDetailOut.model_validate(history)

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(
            500, f"원자재 이력 수정 중 오류가 발생했습니다: {str(e)}"
        )

