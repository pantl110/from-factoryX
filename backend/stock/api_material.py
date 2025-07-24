from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from stock.schemas.inbound import MaterialUpdateIn
from stock.schemas.outbound import MaterialDetailOut
from stock.models import Material
from factory.models import Factory
from django.db import IntegrityError
from stock.schemas.inbound import AssignMaterialIn
from stock.models import MaterialProduct
from factory.utils import get_factory_by_id
from stock.utils import get_product_by_id
from ninja.pagination import paginate
from typing import List
from stock.schemas.outbound import MaterialSummaryOut
from django.http import JsonResponse
from stock.utils import get_factory_by_id
from stock.models import MaterialProduct
from django.db import IntegrityError
from ninja.errors import HttpError


router = Router(tags=["Material"], auth=jwt_auth)


# Onboarding, Product Tab
@router.post(
    "/assign",
    summary="[C] 원자재 생성 및 품목 연결",
    description="원자재들을 생성, 있다면 기존 원자재를 품목과 연결합니다.",
    response={201: None},
    auth=jwt_auth,
)
async def assign_material(request, payload: AssignMaterialIn):
    """
    입력 필드:
    - factory_id: 공장 ID
    - product_id: 품목 ID
    - materials: 원자재 목록 (name, code, spec, quantity)
    반환 필드: 없음
    """
    user = request.auth
    data = payload.dict()
    factory_id = data["factory_id"]
    product_id = data["product_id"]
    materials_data = data["materials"]

    # code 중복 체크
    codes = [m["code"] for m in materials_data]
    if len(codes) != len(set(codes)):
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")

    factory = await get_factory_by_id(factory_id, user)
    product = await get_product_by_id(product_id, user)

    if product.factory_id != factory_id:
        raise HttpError(400, "품목이 해당 공장에 속하지 않습니다.")

    try:
        for material_info in materials_data:
            material, created = await Material.objects.aget_or_create(
                factory=factory,
                code=material_info["code"],
                defaults={
                    "name": material_info["name"],
                    "spec": material_info["spec"],
                    "unit": "EA",
                    "current_stock": 0,
                    "standard_stock": 0
                }
            )
            material_product, created = await MaterialProduct.objects.aget_or_create(
                product=product,
                material=material,
                defaults={"quantity": material_info["quantity"]}
            )
            if not created:
                material_product.quantity = material_info["quantity"]
                await material_product.asave()
        return 201, None
    except IntegrityError:
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")


# Material Tab
@router.get(
    "/factory/{factory_id}", 
    summary="[C] 공장별 원자재 목록 조회", 
    description="특정 공장의 모든 원자재 정보를 조회합니다.",
    response={ 200: List[MaterialSummaryOut], 404: dict, 500: dict }
    )
@paginate
async def get_materials_by_factory(request, factory_id: int, q: str = None, order: str = "desc"):
    """
    입력 필드:
    - factory_id: 공장 ID (경로 파라미터, 필수)
    - q: 검색어 (자재명 또는 자재코드, 선택)
    - order: 재고 기준 정렬 (asc: 오름차순, desc: 내림차순, 기본값 desc)
    - page: 페이지 번호 (기본값: 1)
    - limit: 페이지당 항목 수 (기본값: 20)

    반환 필드 (List[MaterialOut]):
    - id: 원자재 ID (int)
    - name: 원자재명 (str)
    - code: 원자재 코드 (str)
    - spec: 규격 (str)
    - unit: 단위 (str)
    - current_stock: 현재 재고 (int)
    """
    try:
        factory = await Factory.objects.aget(id=factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")
    
    @sync_to_async
    def get_materials():
        queryset = Material.objects.filter(factory=factory)
        if q:
            qs1 = queryset.filter(name__icontains=q)
            qs2 = queryset.filter(code__icontains=q)
            ids = set(list(qs1.values_list("id", flat=True)) + list(qs2.values_list("id", flat=True)))
            queryset = queryset.filter(id__in=ids)
        if order == "asc":
            queryset = queryset.order_by("current_stock")
        else:
            queryset = queryset.order_by("-current_stock")
        return list(queryset)

    materials = await get_materials()

    material_list = []
    for material in materials:
        material_list.append({
            "id": material.id,
            "name": material.name,
            "code": material.code,
            "spec": material.spec,
            "unit": material.unit,
            "current_stock": material.current_stock,
            "standard_stock": material.standard_stock
        })
    
    return material_list


# Material Tab
@router.get(
    "{material_id}", 
    summary="[C] 원자재 상세 조회", 
    description="특정 원자재의 상세 정보를 조회합니다.",
    response={ 200: MaterialDetailOut, 404: dict, 500: dict }
    )
async def get_material_detail(request, material_id: int):
    """원자재 상세 조회 API"""
    
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    return 200, MaterialDetailOut(
        id=material.id,
        name=material.name,
        code=material.code,
        spec=material.spec,
        unit=material.unit,
        current_stock=material.current_stock,
        standard_stock=material.standard_stock
    )


# Material Tab
@router.patch(
    "{material_id}", 
    summary="[C] 원자재 수정", 
    description="특정 원자재의 정보를 수정합니다.",
    response={ 200: MaterialDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def update_material(request, material_id: int, payload: MaterialUpdateIn):
    """
    입력 필드:
    - material_id: 수정할 원자재 ID (필수, 경로 파라미터)
    - name: 원자재명 (선택)
    - code: 자재코드 (선택, 중복 불가)
    - spec: 규격 (선택)
    - unit: 단위 (선택)
    - current_stock: 현재 재고 (선택)
    - standard_stock: 기준 재고 (선택)

    반환 필드:
    - id: 원자재 ID (int)
    - name: 원자재명 (str)
    - code: 자재코드 (str)
    - spec: 규격 (str)
    - unit: 단위 (str)
    - current_stock: 현재 재고 (int)
    - standard_stock: 기준 재고 (int)
    """
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    update_data = payload.dict(exclude_unset=True)

    # null, blank가 허용되는 필드 목록 (예: note 등 null=True인 필드)
    nullable_fields = []
    blank_fields = [
        field for field, value in update_data.items()
        if (field not in nullable_fields and value in [None, ""])
    ]
    if blank_fields:
        return JsonResponse({"detail": f"공란 또는 null 불가: {', '.join(blank_fields)}"}, status=400)

    # 자재코드 변경 시 중복 검사
    if "code" in update_data and update_data["code"] != material.code:
        try:
            existing_material = await Material.objects.aget(
                factory_id=material.factory_id, 
                code=update_data["code"]
            )
            raise HttpError(400, "이미 존재하는 자재코드입니다.")
        except Material.DoesNotExist:
            pass

    for key, value in update_data.items():
        setattr(material, key, value)
    await sync_to_async(material.save)()

    return 200, MaterialDetailOut(
        id=material.id,
        name=material.name,
        code=material.code,
        spec=material.spec,
        unit=material.unit,
        current_stock=material.current_stock,
        standard_stock=material.standard_stock
    )


@router.delete(
    "{material_id}", 
    summary="[C] 원자재 삭제", 
    description="특정 원자재를 삭제합니다.",
    response={ 200: dict, 404: dict, 500: dict }
    )
async def delete_material(request, material_id: int):
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    await sync_to_async(material.delete)()
    
    return 200, {"message": "원자재가 성공적으로 삭제되었습니다."}