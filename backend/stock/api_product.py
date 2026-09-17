import logging

from ninja import Router, Query
from ninja.pagination import paginate
from ninja.errors import HttpError
from django.http import JsonResponse
from django.db import IntegrityError
from api.permissions import require_factory_access
from api.pagination import PartnerPageNumberPagination
from api.security import api_key_auth, jwt_auth
from api.throttling import PartnerApiKeyThrottle
from asgiref.sync import sync_to_async
from typing import List

from stock.models import Product, MaterialProduct
from stock.schemas.inbound import SingleProductCreateIn, ProductCreateIn, ProductUpdateIn, ProductFilter, AssignProductIn
from stock.schemas.outbound import SingleProductCreateOut, ProductListOut, ProductOut
from stock.utils import (
    drop_none_fields,
    raise_for_failed_codes,
    build_bulk_create_message,
)

from factory.utils import is_factory_member
from factory.models import Factory
from stock.models import Material



logger = logging.getLogger(__name__)

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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    factory_id = int(factory_id)
    try:
        factory = await Factory.objects.aget(id=factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장을 찾을 수 없습니다.")

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
    response={201: dict},
    auth=jwt_auth,
)
async def create_product(request, payload: List[ProductCreateIn]):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장을 찾을 수 없습니다.")

    # 기존 코드와 중복 체크
    codes = [item.code for item in payload]
    existing_codes = await sync_to_async(list)(
        Product.objects.filter(factory=factory, code__in=codes).values_list(
            "code", flat=True
        )
    )

    result: List[dict] = []
    duplicate_codes: List[str] = []
    failed_codes: List[str] = []
    processed_codes = set()  # 이미 처리한 코드들을 추적

    for item in payload:
        data = item.dict()
        code = data["code"]

        # 요청 내 중복 코드 체크 (이미 처리한 코드인지 확인)
        if code in processed_codes:
            duplicate_codes.append(code)
            continue

        # 기존 코드와 중복 체크
        if code in existing_codes:
            duplicate_codes.append(code)
            continue

        # None인 선택 필드는 제거 (모델의 기본값 사용)
        drop_none_fields(
            data,
            ("current_stock", "average_production_time", "buffer_rate", "note"),
        )

        try:
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
            processed_codes.add(code)  # 성공적으로 처리된 코드 추가
        except IntegrityError:
            # 중복은 위에서 이미 걸러졌으므로, 여기 걸리는 건 실제 DB 제약 위반이다.
            logger.exception(
                "제품 생성 실패 (factory_id=%s, code=%s, data=%s)",
                factory_id,
                code,
                data,
            )
            failed_codes.append(code)

    # 실제 오류는 중복으로 뭉뚱그리지 않고 에러로 알린다.
    raise_for_failed_codes(failed_codes, len(result), "제품을", "제품 코드")

    message = build_bulk_create_message(len(result), duplicate_codes, "제품이")

    return 201, {
        "data": result,
        "duplicate_codes": duplicate_codes,
        "message": message,
    }


@router.post(
    "/assign",
    summary="[C] 원자재에 품목 연결",
    description="원자재 하나에 여러 품목을 연결합니다.",
    response={201: None},
    auth=jwt_auth,
)
async def assign_product(request, payload: AssignProductIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    payload_factory_id = int(factory_id)
    material_id = data["material_id"]
    products_data = data["products"]

    try:
        factory = await Factory.objects.aget(id=payload_factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장을 찾을 수 없습니다.")
    
    try:
        material = await Material.objects.aget(id=material_id, factory_id=payload_factory_id)
    except Material.DoesNotExist:
        raise HttpError(404, "해당 원자재를 찾을 수 없습니다.")

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
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
@paginate(PartnerPageNumberPagination)
async def list_products(request, filters: ProductFilter = Query(None), q: str = None, factory_id: int = Query(...)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)

    @sync_to_async
    def get_products():
        queryset = Product.objects.filter(factory_id=int(factory_id)).order_by("-created_at")
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
    auth=[jwt_auth, api_key_auth],
    throttle=[PartnerApiKeyThrottle()],
)
async def get_product(request, product_id: int, factory_id: int = Query(...)):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await require_factory_access(int(factory_id), user)

    try:
        product = await Product.objects.aget(id=product_id, factory_id=int(factory_id))
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        product = await Product.objects.aget(id=product_id, factory_id=int(factory_id))
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    try:
        product = await Product.objects.aget(id=product_id, factory_id=int(factory_id))
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품을 찾을 수 없습니다.")
    await product.adelete()
    return 204, None
