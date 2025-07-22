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
from django.db import IntegrityError
from stock.schemas.inbound import AssignMaterialProductIn
from stock.models import Material, MaterialProduct
from ninja.errors import HttpError
from stock.schemas.inbound import SingleProductCreateIn
from stock.schemas.outbound import SingleProductCreateOut
from stock.schemas.outbound import ProductListOut


router = Router(tags=["Product"])


# Onboarding Tab
@router.post(
    "/single",
    summary="[C] 단일 품목 생성",
    description="공장에 연결된 단일 품목을 생성합니다.",
    response={201: SingleProductCreateOut},
    auth=jwt_auth,
)
async def create_single_product(request, payload: SingleProductCreateIn):
    """
    입력 필드:
    - factory_id: 공장 ID
    - name: 품목명
    - code: 품목 코드
    - spec: 규격
    - unit: 단위

    반환 필드:
    - factory_id: 공장 ID
    - product_id: 생성된 품목 ID
    """
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    factory = await get_factory_by_id(factory_id, user)

    # 중복 코드 체크
    exists = await Product.objects.filter(factory=factory, code=data["code"]).aexists()
    if exists:
        raise HttpError(400, "해당 공장에 이미 존재하는 품목 코드입니다.")

    product = await Product.objects.acreate(
        factory=factory,
        **data
    )
    response_data = {
        "factory_id": factory_id,
        "product_id": product.id
    }
    return 201, response_data


# Onboarding Tab
@router.post(
    "/assign",
    summary="[C] 원자재 생성 및 품목 연결",
    description="원자재를 생성하고 품목과 연결합니다.",
    response={201: None},
    auth=jwt_auth,
)
async def assign_materialproduct(request, payload: AssignMaterialProductIn):
    """
    입력 필드:
    - factory_id: 공장 ID
    - product_id: 품목 ID
    - materials: 원자재 목록 (name, code, spec, quantity)
    
    반환 필드: 없음
    """
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    product_id = data.pop("product_id")
    materials_data = data.pop("materials")

    # code 중복 체크
    codes = [m["code"] for m in materials_data]
    if len(codes) != len(set(codes)):
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")
    
    factory = await get_factory_by_id(factory_id, user)
    
    product = await get_product_by_id(product_id, user)
    
    if product.factory_id != factory_id:
        raise HttpError(400, "품목이 해당 공장에 속하지 않습니다.")
    
    try:
        for material_data in materials_data:
            material, created = await Material.objects.aget_or_create(
                factory=factory,
                code=material_data["code"],
                defaults={
                    "name": material_data["name"],
                    "spec": material_data["spec"],
                    "unit": "EA",
                    "current_stock": 0,
                    "standard_stock": 0
                }
            )
            
            material_product, created = await MaterialProduct.objects.aget_or_create(
                product=product,
                material=material,
                defaults={"quantity": material_data["quantity"]}
            )
            
            if not created:
                material_product.quantity = material_data["quantity"]
                await material_product.asave()
        
        return 201, None
        
    except IntegrityError:
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")


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
        # current_stock이 None이면 0으로 저장
        if data.get("current_stock") is None:
            data["current_stock"] = 0
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


# Product Tab
@router.get(
    "",
    summary="[C] 제품 목록 검색 및 조회",
    description="등록된 제품 목록을 조회합니다.",
    response={200: List[ProductListOut]},
    auth=jwt_auth,
)
@paginate
async def list_products(request, filters: ProductFilter = Query(None), q: str = None):
    """
    입력 필드:
    - q: 검색어 (품목명 또는 품목코드, 선택)
    - factory_id: 공장 ID (필수, 인증된 유저의 소유 공장만 조회)

    반환 필드 (ProductListOut):
    - id: 제품 ID (int)
    - factory: 공장 ID (int)
    - name: 제품명 (str)
    - code: 제품코드 (str)
    - unit: 단위 (str)
    - spec: 규격 (str)
    - current_stock: 현재 재고 (int)
    """
    user = request.auth

    @sync_to_async
    def get_products():
        queryset = Product.objects.filter(factory__owner=user).order_by("-created_at")
        if q:
            qs1 = queryset.filter(name__icontains=q)
            qs2 = queryset.filter(code__icontains=q)
            ids = set(list(qs1.values_list("id", flat=True)) + list(qs2.values_list("id", flat=True)))
            queryset = queryset.filter(id__in=ids)
        queryset = filters.filter(queryset)
        return list(queryset)

    products = await get_products()

    response_data = [
        {
            "id": product.id,
            "factory": product.factory_id,
            "name": product.name,
            "code": product.code,
            "unit": product.unit,
            "spec": product.spec,
            "current_stock": product.current_stock,
        }
        for product in products
    ]
    return response_data


# Product Tab
@router.get(
    "/{product_id}",
    summary="[C] 제품 상세 조회",
    description="제품 ID로 제품 정보를 조회합니다.",
    response={200: ProductOut},
    auth=jwt_auth,
)
async def get_product(request, product_id: int):
    """
    입력 필드:
    - product_id: 제품 ID (경로 파라미터, 필수)

    반환 필드 (ProductOut):
    - id: 제품 ID (int)
    - factory: 공장 ID (int)
    - name: 제품명 (str)
    - code: 제품코드 (str)
    - unit: 단위 (str)
    - spec: 규격 (str)
    - current_stock: 현재 재고 (int)
    - average_production_time: 평균 생산 시간 (초, int, nullable)
    - note: 특이사항 (str, nullable)
    """
    user = request.auth
    product = await get_product_by_id(product_id, user)
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
        "note": product.note
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
    if "current_stock" in update_data and update_data["current_stock"] is None:
        update_data["current_stock"] = 0
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

