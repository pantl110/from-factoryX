from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from api.security import jwt_auth

from stock.models import Material, MaterialHistory
from stock.schemas.outbound import MaterialAvailableLotOut
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

