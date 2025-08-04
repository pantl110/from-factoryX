from ninja import Router, Query
from ninja.pagination import paginate
from ninja.errors import HttpError
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from typing import List

from stock.models import Product, ProductHistory
from stock.schemas.inbound import ProductHistoryCreateIn, ProductHistoryFilter
from stock.schemas.outbound import ProductHistoryOut

from factory.utils import is_factory_member


router = Router(tags=["ProductHistory"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 제품 입출고 이력 등록",
    description="제품 입출고 이력을 등록합니다.",
    response={201: ProductHistoryOut},
    auth=jwt_auth,
)
async def create_product_history(request, payload: ProductHistoryCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    product_id = data.pop("product")
    
    try:
        product = await Product.objects.aget(id=product_id, factory_id=int(factory_id))
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
    
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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        history = await ProductHistory.objects.select_related("product").aget(
            id=history_id,
            product__factory_id=int(factory_id)
        )
    except ProductHistory.DoesNotExist:
        raise HttpError(404, "해당 입출고 이력을 찾을 수 없습니다.")
    
    return history
