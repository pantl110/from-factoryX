from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from django.db import IntegrityError
from api.security import jwt_auth
from typing import List

from stock.models import Material, MaterialProduct, Product
from stock.schemas.inbound import MaterialUpdateIn, AssignMaterialIn, SingleMaterialCreateIn
from stock.schemas.outbound import MaterialDetailOut, AssignMaterialOut, MaterialSummaryOut
from factory.models import Factory

from factory.utils import is_factory_member


router = Router(tags=["Material"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 원자재 생성",
    description="공장에 연결된 원자재를 생성합니다. 하나 또는 여러 개를 한 번에 생성할 수 있습니다.",
    response={201: dict},
    auth=jwt_auth,
)
async def create_materials(request, payload: List[SingleMaterialCreateIn]):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        factory = await Factory.objects.aget(id=int(factory_id))
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장을 찾을 수 없습니다.")

    # 중복 코드 체크
    codes = [item.code for item in payload]
    if len(codes) != len(set(codes)):
        raise HttpError(400, "원자재 코드가 중복되었습니다.")

    # 기존 코드와 중복 체크
    existing_codes = await sync_to_async(list)(Material.objects.filter(factory=factory, code__in=codes).values_list('code', flat=True))
    if existing_codes:
        raise HttpError(400, f"이미 존재하는 원자재 코드: {existing_codes}")

    material_ids = []
    for item in payload:
        data = item.dict()
        
        # 기본값 설정
        if "unit" not in data or data["unit"] is None:
            data["unit"] = "EA"
        # current_stock과 standard_stock은 None이면 제거 (모델의 기본값 사용)
        if data.get("current_stock") is None:
            data.pop("current_stock", None)
        if data.get("standard_stock") is None:
            data.pop("standard_stock", None)
        
        material = await Material.objects.acreate(
            factory=factory,
            **data
        )
        material_ids.append(material.id)
    
    return 201, {
        "material_ids": material_ids,
        "message": f"{len(material_ids)}개의 원자재가 성공적으로 생성되었습니다."
    }


# Onboarding
@router.post(
    "/assign",
    summary="[C] 원자재 생성 및 품목 연결",
    description="원자재들을 생성, 있다면 기존 원자재를 품목과 연결합니다.",
    response={201: AssignMaterialOut},
    auth=jwt_auth,
)
async def assign_material(request, payload: AssignMaterialIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    factory_id = int(factory_id)
    product_id = data["product_id"]
    materials_data = data["materials"]

    codes = [m["code"] for m in materials_data]
    if len(codes) != len(set(codes)):
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")

    try:
        factory = await Factory.objects.aget(id=factory_id)
    except Factory.DoesNotExist:
        raise HttpError(404, "공장 정보를 찾을 수 없습니다.")

    try:
        product = await Product.objects.select_related("factory").aget(
            id=product_id, factory_id=int(factory_id)
        )
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품이 존재하지 않습니다.")

    material_ids = []
    material_codes = []
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
            material_ids.append(material.id)
            material_codes.append(material.code)
            
            material_product, created = await MaterialProduct.objects.aget_or_create(
                product=product,
                material=material,
                defaults={"quantity": material_info["quantity"]}
            )
            if not created:
                material_product.quantity = material_info["quantity"]
                await material_product.asave()
        
        return 201, AssignMaterialOut(
            material_ids=material_ids,
            material_codes=material_codes,
            message="원자재가 성공적으로 생성 및 연결되었습니다."
        )
    except IntegrityError:
        raise HttpError(400, "원자재 코드가 중복되거나 연결 정보에 오류가 있습니다.")


# Material Tab
@router.get(
    "", 
    summary="[C] 공장별 원자재 목록 조회", 
    description="특정 공장의 모든 원자재 정보를 조회합니다.",
    response={ 200: List[MaterialSummaryOut], 404: dict, 500: dict }
    )
@paginate
async def get_materials_by_factory(request, q: str = None, order: str = "desc"):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")

    update_data = payload.dict(exclude_unset=True)

    nullable_fields = ["current_stock", "standard_stock"]
    blank_fields = []
    for field, value in update_data.items():
        if field not in nullable_fields and value in [None, ""]:
            blank_fields.append(field)
    
    if blank_fields:
        raise HttpError(400, f"공란 또는 null 불가: {', '.join(blank_fields)}")

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
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    await sync_to_async(material.delete)()
    
    return 200, {"message": "원자재가 성공적으로 삭제되었습니다."}