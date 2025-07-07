from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from stock.models import ProductHistory, Product
from asgiref.sync import sync_to_async
from typing import List

from ninja.errors import HttpError

from stock.schemas.inbound import ProductHistoryCreateIn, ProductHistoryUpdateIn
from stock.schemas.outbound import ProductHistoryOut
from stock.utils import get_history_by_id

router = Router(tags=["ProductHistory"], auth=jwt_auth)

@router.post(
    "",
    summary="[C] 제품 입출고 이력 등록",
    description="제품 입출고 이력을 등록합니다.",
    response={201: ProductHistoryOut},
    auth=jwt_auth
)
async def create_product_history(request, payload: ProductHistoryCreateIn):
    user = request.auth
    data = payload.dict()

    # Accept product primary key directly
    if isinstance(data.get("product"), int):
        data["product_id"] = data.pop("product")

    # Ensure product belongs to the authenticated user
    product = await Product.objects.select_related("factory").aget(id=data["product_id"])
    if product.factory.owner_id != user.id:
        raise HttpError(403, "해당 제품에 대한 권한이 없습니다.")

    history = await ProductHistory.objects.acreate(**data)
    return 201, history


@router.get(
    "",
    summary="[C] 제품 입출고 이력 목록 조회",
    description="사용자가 소유한 공장의 제품 입출고 이력을 조회합니다.",
    response={200: List[ProductHistoryOut]},
    auth=jwt_auth
)
@paginate
async def list_product_histories(request):
    user = request.auth
    histories = await sync_to_async(list)(
        ProductHistory.objects.filter(product__factory__owner=user).select_related("product").order_by("-created_at")
    )
    return histories


@router.get(
    "/{history_id}",
    summary="[C] 제품 입출고 이력 상세 조회",
    description="입출고 이력 ID로 상세 정보를 조회합니다.",
    response={200: ProductHistoryOut},
    auth=jwt_auth
)
async def get_product_history(request, history_id: int):
    history = await get_history_by_id(history_id)

    # 권한 체크
    if history.product.factory.owner_id != request.auth.id:
        raise HttpError(403, "해당 이력에 대한 권한이 없습니다.")

    return history


@router.patch(
    "/{history_id}",
    summary="[C] 제품 입출고 이력 수정",
    description="입출고 이력 정보를 수정합니다.",
    response={200: ProductHistoryOut},
    auth=jwt_auth
)
async def update_product_history(request, history_id: int, payload: ProductHistoryUpdateIn):
    history = await get_history_by_id(history_id)

    if history.product.factory.owner_id != request.auth.id:
        raise HttpError(403, "해당 이력에 대한 권한이 없습니다.")

    update_data = payload.dict(exclude_unset=True)
    if isinstance(update_data.get("product"), int):
        update_data["product_id"] = update_data.pop("product")

    for key, value in update_data.items():
        setattr(history, key, value)

    await sync_to_async(history.save)()
    return history


@router.delete(
    "/{history_id}",
    summary="[C] 제품 입출고 이력 삭제",
    description="입출고 이력을 삭제합니다.",
    response={204: None},
    auth=jwt_auth
)
async def delete_product_history(request, history_id: int):
    history = await get_history_by_id(history_id)

    if history.product.factory.owner_id != request.auth.id:
        raise HttpError(403, "해당 이력에 대한 권한이 없습니다.")

    await history.adelete()
    return 204, None
