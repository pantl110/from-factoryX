from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from document.schemas.inbound import (
    QuotationProductCreateIn, QuotationProductUpdateIn, QuotationProductDeliveryUpdateIn, 
    QuotationProductFilter, QuotationProductDetailIn, QuotationProductDeleteIn
)
from document.schemas.outbound import QuotationProductOut
from document.utils import get_quotation_product_by_id
from document.models import Quotation, QuotationProduct
from stock.models import Product
from asgiref.sync import sync_to_async
from typing import List

router = Router(tags=["QuotationProduct"])

@router.post(
    "/quotation_products",
    summary="[C] 견적서 품목 등록",
    description="견적서에 포함될 제품 품목을 등록합니다.",
    response={201: QuotationProductOut},
    auth=jwt_auth
)
async def create_quotation_product(request, payload: QuotationProductCreateIn):
    user = request.auth
    quotation = await Quotation.objects.aget(id=payload.quotation, factory__owner=user)
    product = await Product.objects.aget(id=payload.product)
    qp = await QuotationProduct.objects.acreate(
        quotation=quotation, product=product, quantity=payload.quantity, unit_price=payload.unit_price
    )
    return 201, qp

@router.get(
    "/quotation_products",
    summary="[C] 견적서 품목 목록 조회",
    description="견적서 품목 목록을 조회합니다. 견적서 ID, 제품 ID, 납품 여부로 필터링이 가능합니다.",
    response={200: List[QuotationProductOut]},
    auth=jwt_auth
)
@paginate
async def list_quotation_products(request, factory_id: int, filters: QuotationProductFilter = Query(...)):
    user = request.auth
    
    @sync_to_async
    def get_quotation_products():
        queryset = QuotationProduct.objects.filter(quotation__factory_id=factory_id, quotation__factory__owner=user).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)
    
    products = await get_quotation_products()
    return products

@router.get(
    "/quotation_products/{quotation_product_id}",
    summary="[C] 견적서 품목 상세 조회",
    description="견적서 품목 ID로 품목 정보를 상세 조회합니다.",
    response={200: QuotationProductOut},
    auth=jwt_auth
)
async def get_quotation_product(request, quotation_product_id: int, factory_id: int):
    user = request.auth
    qp = await get_quotation_product_by_id(quotation_product_id, user)
    return qp

@router.patch(
    "/quotation_products",
    summary="[C] 견적서 품목 정보 수정",
    description="견적서 품목의 수량, 단가 등의 정보를 수정합니다.",
    response={200: QuotationProductOut},
    auth=jwt_auth
)
async def update_quotation_product(request, payload: QuotationProductUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    quotation_product_id = data.pop("quotation_product_id")
    factory_id = data.pop("factory_id")
    qp = await get_quotation_product_by_id(quotation_product_id, user)
    for attr, value in data.items():
        if attr != "id":
            setattr(qp, attr, value)
    await qp.asave()
    return qp

@router.patch(
    "/quotation_products/{quotation_product_id}/delivery",
    summary="[C] 견적서 품목 납품 정보 수정",
    description="견적서 품목의 납품 여부와 납품 일자를 수정합니다.",
    response={200: QuotationProductOut},
    auth=jwt_auth
)
async def update_quotation_product_delivery(request, quotation_product_id: int, factory_id: int, payload: QuotationProductDeliveryUpdateIn):
    user = request.auth
    qp = await get_quotation_product_by_id(quotation_product_id, user)
    qp.is_delivery = payload.is_delivery
    qp.delivery_date = payload.delivery_date
    await qp.asave()
    return qp

@router.delete(
    "/quotation_products",
    summary="[C] 견적서 품목 삭제",
    description="견적서 품목 ID로 품목을 삭제합니다.",
    response={204: None},
    auth=jwt_auth
)
async def delete_quotation_product(request, payload: QuotationProductDeleteIn):
    user = request.auth
    qp = await get_quotation_product_by_id(payload.quotation_product_id, user)
    await qp.adelete()
    return 204, None 