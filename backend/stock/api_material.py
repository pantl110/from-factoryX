from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from stock.schemas.inbound import MaterialUpdateIn
from stock.schemas.outbound import MaterialListOut, MaterialDetailOut
from stock.models import Material
from factory.models import Factory
from django.db import IntegrityError
from stock.schemas.inbound import AssignMaterialProductIn
from stock.models import MaterialProduct
from factory.utils import get_factory_by_id
from stock.utils import get_product_by_id


router = Router(tags=["Material"], auth=jwt_auth)


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



@router.get(
    "/factory/{factory_id}", 
    summary="[C] 공장별 원자재 목록 조회", 
    description="특정 공장의 모든 원자재 정보를 조회합니다.",
    response={ 200: MaterialListOut, 404: dict, 500: dict }
    )
async def get_materials_by_factory(request, factory_id: int):
    """
    입력 필드:
    - factory_id: 공장 ID (경로 파라미터, 필수)

    반환 필드 (MaterialListOut):
    - materials: 원자재 정보 리스트
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
    
    materials = await sync_to_async(list)(
        Material.objects.filter(factory=factory).order_by('-created_at')
    )

    material_list = []
    for material in materials:
        material_list.append({
            "id": material.id,
            "name": material.name,
            "code": material.code,
            "spec": material.spec,
            "unit": material.unit,
            "current_stock": material.current_stock
        })
    
    return 200, MaterialListOut(materials=material_list)


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


@router.patch(
    "{material_id}", 
    summary="[C] 원자재 수정", 
    description="특정 원자재의 정보를 수정합니다.",
    response={ 200: MaterialDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def update_material(request, material_id: int, payload: MaterialUpdateIn):
    try:
        material = await Material.objects.aget(id=material_id)
    except Material.DoesNotExist:
        raise HttpError(404, "원자재 정보를 찾을 수 없습니다.")
    
    # 자재코드 변경 시 중복 검사
    if payload.code and payload.code != material.code:
        try:
            existing_material = await Material.objects.aget(
                factory_id=material.factory_id, 
                code=payload.code
            )
            raise HttpError(400, "이미 존재하는 자재코드입니다.")
        except Material.DoesNotExist:
            pass
    
    if payload.name is not None:
        material.name = payload.name
    if payload.code is not None:
        material.code = payload.code
    if payload.spec is not None:
        material.spec = payload.spec
    if payload.unit is not None:
        material.unit = payload.unit
    if payload.current_stock is not None:
        material.current_stock = payload.current_stock
    if payload.standard_stock is not None:
        material.standard_stock = payload.standard_stock
    
    await sync_to_async(material.save)()
    
    return 200, MaterialDetailOut(
        id=material.id,
        name=material.name,
        code=material.code,
        spec=material.spec,
        unit=material.unit,
        current_stock=material.current_stock,
        standard_stock=material.standard_stock,
        created_at=material.created_at.isoformat(),
        updated_at=material.updated_at.isoformat()
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