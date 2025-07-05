from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.models import Factory
from stock.models import Product
from asgiref.sync import sync_to_async
from typing import List
from stock.schemas.inbound import ProductCreateIn, ProductUpdateIn
from stock.schemas.outbound import ProductOut
from stock.utils import get_product_by_id

router = Router(tags=["Product"])

@router.post(
    "",
    summary="[C] 제품 등록",
    description="제품을 등록합니다.",
    response={201:ProductOut},
    auth=jwt_auth,
)
async def create_product(request, payload: ProductCreateIn):
    user = request.auth
    product = await Product.objects.acreate(
        **payload.dict(),
    )
    return 201, product

@router.get(
    "",
    summary="[C] 제품 목록 조회",
    description="등록된 제품 목록을 조회합니다.",
    response={200: List[ProductOut]},
    auth=jwt_auth,
)
@paginate
async def list_products(request):
    user = request.auth
    # 단일 쿼리로 사용자가 소유한 공장의 제품 조회
    products = await sync_to_async(list)(
        Product.objects.filter(factory__owner=user).order_by("-created_at")
    )
    return products

@router.get(
    "/{product_id}",
    summary="[C] 제품 상세 조회",
    description="제품 ID로 제품 정보를 조회합니다.",
    response={200: ProductOut},
    auth=jwt_auth,
)
async def get_product(request, product_id: int):
    product = await get_product_by_id(product_id)
    return product

@router.patch(
    "/{product_id}",
    summary="[C] 제품 수정",
    description="제품 정보를 수정합니다.",
    response={200: ProductOut},
    auth=jwt_auth,
)
async def update_product(request, product_id: int, payload: ProductUpdateIn):
    product = await get_product_by_id(product_id)
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    await sync_to_async(product.save)()
    return product

@router.delete(
    "/{product_id}",
    summary="[C] 제품 삭제",
    description="제품을 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_product(request, product_id: int):
    product = await get_product_by_id(product_id)
    await product.adelete()
    return 204, None

