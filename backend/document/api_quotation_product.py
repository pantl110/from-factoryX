from ninja import Router
from api.security import jwt_auth
from document.schemas.inbound import (
    QuotationProductCreateIn, QuotationProductUpdateIn, QuotationProductDeliveryUpdateIn, QuotationProductFilter, QuotationProductListIn, QuotationProductDetailIn
)
from document.schemas.outbound import QuotationProductOut
from document.utils import get_quotation_product_by_id
from document.models import Quotation, QuotationProduct
from stock.models import Product
from asgiref.sync import sync_to_async
from typing import List

router = Router(tags=["QuotationProduct"])

@router.post(
    "/quotation_products/",
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

@router.post(
    "/quotation_products/list",
    summary="[C] 견적서 품목 목록 조회",
    description="견적서 품목 목록을 조회합니다. 견적서 ID, 제품 ID, 납품 여부로 필터링이 가능합니다.",
    response={200: List[QuotationProductOut]},
    auth=jwt_auth
)
async def list_quotation_products(request, payload: QuotationProductListIn):
    user = request.auth
    queryset = QuotationProduct.objects.filter(quotation__factory__owner=user)
    if payload.quotation_id:
        queryset = queryset.filter(quotation_id=payload.quotation_id)
    if payload.product_id:
        queryset = queryset.filter(product_id=payload.product_id)
    if payload.is_delivery is not None:
        queryset = queryset.filter(is_delivery=payload.is_delivery)
    return await sync_to_async(list)(queryset)

@router.post(
    "/quotation_products/detail",
    summary="[C] 견적서 품목 상세 조회",
    description="견적서 품목 ID로 품목 정보를 상세 조회합니다.",
    response={200: QuotationProductOut},
    auth=jwt_auth
)
async def get_quotation_product(request, payload: QuotationProductDetailIn):
    user = request.auth
    qp = await get_quotation_product_by_id(payload.id, user)
    return qp

@router.patch(
    "/quotation_products/update",
    summary="[C] 견적서 품목 정보 수정",
    description="견적서 품목의 수량, 단가 등의 정보를 수정합니다.",
    response={200: QuotationProductOut},
    auth=jwt_auth
)
async def update_quotation_product(request, payload: QuotationProductUpdateIn):
    user = request.auth
    qp = await get_quotation_product_by_id(payload.id, user)
    for attr, value in payload.dict(exclude_unset=True).items():
        if attr != "id":
            setattr(qp, attr, value)
    await qp.asave()
    return qp

@router.patch(
    "/quotation_products/update-delivery",
    summary="[C] 견적서 품목 납품 정보 수정",
    description="견적서 품목의 납품 여부와 납품 일자를 수정합니다.",
    response={200: QuotationProductOut},
    auth=jwt_auth
)
async def update_quotation_product_delivery(request, payload: QuotationProductDeliveryUpdateIn):
    user = request.auth
    qp = await get_quotation_product_by_id(payload.id, user)
    qp.is_delivery = payload.is_delivery
    qp.delivery_date = payload.delivery_date
    await qp.asave()
    return qp 