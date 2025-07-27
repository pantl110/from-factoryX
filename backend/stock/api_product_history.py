from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from stock.models import ProductHistory, Product
from asgiref.sync import sync_to_async
from typing import List
from django.utils import timezone
from datetime import timedelta
from ninja.errors import HttpError

from stock.schemas.inbound import (
    ProductHistoryCreateIn,
    ProductHistoryFilter,
)
from stock.schemas.outbound import ProductHistoryOut
from stock.utils import get_history_by_id, get_product_by_id

router = Router(tags=["ProductHistory"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 제품 입출고 이력 등록",
    description="제품 입출고 이력을 등록합니다.",
    response={201: ProductHistoryOut},
    auth=jwt_auth,
)
async def create_product_history(request, payload: ProductHistoryCreateIn):
    user = request.auth
    data = payload.dict()
    product_id = data.pop("product")
    product = await get_product_by_id(product_id, user)
    product_history = await ProductHistory.objects.acreate(product=product, **data)
    return 201, product_history


@router.get(
    "",
    summary="[C] 제품 입출고 이력 목록 조회",
    description="사용자가 소유한 공장의 제품 입출고 이력을 조회합니다.",
    response={200: List[ProductHistoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_product_histories(request, filters: ProductHistoryFilter = Query(...)):
    user = request.auth

    @sync_to_async
    def get_histories():
        queryset = (
            ProductHistory.objects.filter(product__factory__owner=user)
            .select_related("product")
            .order_by("-created_at")
        )
        queryset = filters.filter(queryset)
        return list(queryset)

    histories = await get_histories()
    return histories


# Product Tab
@router.get(
    "/{history_id}",
    summary="[C] 제품 입출고 이력 상세 조회",
    description="입출고 이력 ID로 상세 정보를 조회합니다.",
    response={200: ProductHistoryOut},
    auth=jwt_auth,
)
async def get_product_history(request, history_id: int):
    user = request.auth
    history = await get_history_by_id(history_id, user)
    return history
