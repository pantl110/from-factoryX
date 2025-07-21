from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from stock.schemas.inbound import MaterialUpdateIn
from stock.schemas.outbound import MaterialListOut, MaterialSummaryOut, MaterialDetailOut
from stock.models import Material
from factory.models import Factory

router = Router(tags=["Material"], auth=jwt_auth)





@router.get(
    "/factory/{factory_id}", 
    summary="[C] 공장별 원자재 목록 조회", 
    description="특정 공장의 모든 원자재 정보를 조회합니다.",
    response={ 200: MaterialListOut, 404: dict, 500: dict }
    )
async def get_materials_by_factory(request, factory_id: int):
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


