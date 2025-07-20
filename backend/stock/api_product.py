from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from asgiref.sync import sync_to_async
from typing import List
from stock.models import Product
from stock.schemas.inbound import ProductCreateIn, ProductUpdateIn, ProductFilter
from stock.schemas.outbound import ProductOut
from stock.utils import get_product_by_id
from factory.utils import get_factory_by_id


router = Router(tags=["Product"])


@router.post(
    "",
    summary="[C] 제품 등록",
    description="제품을 등록합니다.",
    response={201: List[ProductOut]},
    auth=jwt_auth,
)
async def create_product(request, payload: List[ProductCreateIn]):
    user = request.auth
    result: List[dict] = []
    for item in payload:
        data = item.dict()
        factory_id = data.pop("factory")
        factory = await get_factory_by_id(factory_id, user)
        product = await Product.objects.acreate(factory=factory, **data)

        # 응답 데이터 직렬화
        response_data = {
            "id": product.id,
            "factory": product.factory_id,
            "name": product.name,
            "code": product.code,
            "unit": product.unit,
            "spec": product.spec,
            "current_stock": product.current_stock,
            "average_production_time": product.average_production_time,
            "buffer_rate": float(product.buffer_rate),
            "note": product.note,
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat(),
        }
        result.append(response_data)
    return 201, result


@router.get(
    "",
    summary="[C] 제품 목록 조회",
    description="등록된 제품 목록을 조회합니다.",
    response={200: List[ProductOut]},
    auth=jwt_auth,
)
@paginate
async def list_products(request, filters: ProductFilter = Query(...)):
    user = request.auth

    @sync_to_async
    def get_products():
        queryset = Product.objects.filter(factory__owner=user).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)

    products = await get_products()

    # 응답 데이터 직렬화
    response_data = []
    for product in products:
        response_data.append(
            {
                "id": product.id,
                "factory": product.factory_id,
                "name": product.name,
                "code": product.code,
                "unit": product.unit,
                "spec": product.spec,
                "current_stock": product.current_stock,
                "average_production_time": product.average_production_time,
                "buffer_rate": float(product.buffer_rate),
                "note": product.note,
                "created_at": product.created_at.isoformat(),
                "updated_at": product.updated_at.isoformat(),
            }
        )

    return response_data


@router.get(
    "/{product_id}",
    summary="[C] 제품 상세 조회",
    description="제품 ID로 제품 정보를 조회합니다.",
    response={200: ProductOut},
    auth=jwt_auth,
)
async def get_product(request, product_id: int):
    user = request.auth
    product = await get_product_by_id(product_id, user)

    # 응답 데이터 직렬화
    response_data = {
        "id": product.id,
        "factory": product.factory_id,
        "name": product.name,
        "code": product.code,
        "unit": product.unit,
        "spec": product.spec,
        "current_stock": product.current_stock,
        "average_production_time": product.average_production_time,
        "buffer_rate": float(product.buffer_rate),
        "note": product.note,
        "created_at": product.created_at.isoformat(),
        "updated_at": product.updated_at.isoformat(),
    }
    return response_data


@router.patch(
    "/{product_id}",
    summary="[C] 제품 수정",
    description="제품 정보를 수정합니다.",
    response={200: ProductOut},
    auth=jwt_auth,
)
async def update_product(request, product_id: int, payload: ProductUpdateIn):
    user = request.auth
    product = await get_product_by_id(product_id, user)
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    await product.asave()

    # 응답 데이터 직렬화
    response_data = {
        "id": product.id,
        "factory": product.factory_id,
        "name": product.name,
        "code": product.code,
        "unit": product.unit,
        "spec": product.spec,
        "current_stock": product.current_stock,
        "average_production_time": product.average_production_time,
        "buffer_rate": float(product.buffer_rate),
        "note": product.note,
        "created_at": product.created_at.isoformat(),
        "updated_at": product.updated_at.isoformat(),
    }
    return response_data


@router.delete(
    "/{product_id}",
    summary="[C] 제품 삭제",
    description="제품을 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_product(request, product_id: int):
    user = request.auth
    product = await get_product_by_id(product_id, user)
    await product.adelete()
    return 204, None
