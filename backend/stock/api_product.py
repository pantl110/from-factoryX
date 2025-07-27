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
from stock.models import MaterialProduct
from ninja.errors import HttpError
from stock.schemas.inbound import SingleProductCreateIn
from stock.schemas.outbound import SingleProductCreateOut
from stock.schemas.outbound import ProductListOut
from django.http import JsonResponse
from stock.utils import get_material_by_id
from stock.schemas.inbound import AssignProductIn


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


@router.post(
    "/assign",
    summary="[C] 원자재에 품목 연결",
    description="원자재 하나에 여러 품목을 연결합니다.",
    response={201: None},
    auth=jwt_auth,
)
async def assign_product(request, payload: AssignProductIn):
    """
    입력 필드:
    - factory_id: 공장 ID
    - material_id: 원자재 ID
    - products: 품목 목록 (name, code, spec, unit, quantity)
    반환 필드: 없음
    """
    user = request.auth
    data = payload.dict()
    factory_id = data["factory_id"]
    material_id = data["material_id"]
    products_data = data["products"]

    factory = await get_factory_by_id(factory_id, user)
    material = await get_material_by_id(material_id, factory_id, user)

    try:
        for product_info in products_data:
            product, created = await Product.objects.aget_or_create(
                factory=factory,
                code=product_info["code"],
                defaults={
                    "name": product_info["name"],
                    "spec": product_info["spec"],
                    "unit": product_info["unit"],
                    "current_stock": 0,
                }
            )
            material_product, created = await MaterialProduct.objects.aget_or_create(
                product=product,
                material=material,
                defaults={"quantity": product_info["quantity"]}
            )
            if not created:
                material_product.quantity = product_info["quantity"]
                await material_product.asave()
        return 201, None
    except IntegrityError:
        raise HttpError(400, "품목 연결 정보에 오류가 있습니다.")




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


# Product Tab
@router.patch(
    "/{product_id}",
    summary="[C] 제품 수정",
    description="제품 정보를 수정합니다.",
    response={200: ProductOut},
    auth=jwt_auth,
)
async def update_product(request, product_id: int, payload: ProductUpdateIn):
    """
    입력 필드:
    - product_id: 수정할 제품 ID (필수, 경로 파라미터)
    - name: 제품명 (선택)
    - code: 제품 코드 (선택)
    - unit: 단위 (선택)
    - spec: 규격 (선택)
    - current_stock: 현재 재고 (선택)
    - average_production_time: 평균 생산 시간 (선택)
    - buffer_rate: 버퍼율 (선택)
    - location: 위치 (선택, null 허용)
    - note: 비고 (선택, null 허용)

    반환 필드:
    - id: 제품 ID (int)
    - factory: 팩토리 ID (int)
    - name: 제품명 (str)
    - code: 제품 코드 (str)
    - unit: 단위 (str)
    - spec: 규격 (str)
    - current_stock: 현재 재고 (int)
    - average_production_time: 평균 생산 시간 (int, null 허용)
    - buffer_rate: 버퍼율 (float)
    - note: 비고 (str, null 허용)
    """
    user = request.auth
    product = await get_product_by_id(product_id, user)
    update_data = payload.dict(exclude_unset=True)

    # null, blank가가 허용되는 필드 목록
    nullable_fields = ["average_production_time", "location", "note"]
    # current_stock도 null 허용으로 추가
    nullable_fields.append("current_stock")
    
    # null 허용 필드 목록 (None 값이어도 허용)
    null_allowed_fields = ["current_stock", "average_production_time", "location", "note"]
    
    blank_fields = [
        field for field, value in update_data.items()
        if (
            (field not in null_allowed_fields and value in [None, ""]) or
            (field in null_allowed_fields and value == "")
        )
    ]
    if blank_fields:
        return JsonResponse({"detail": f"공란 또는 null 불가: {', '.join(blank_fields)}"}, status=400)

    for key, value in update_data.items():
        # current_stock과 average_production_time이 null이면 수정하지 않음
        if key in ["current_stock", "average_production_time"] and value is None:
            continue
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
        "note": product.note
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

