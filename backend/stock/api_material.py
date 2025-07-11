from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from stock.schemas.inbound import MaterialCreateIn, MaterialUpdateIn, MaterialFilter, MaterialSearchIn, MaterialDetailIn, MaterialDeleteIn
from stock.schemas.outbound import MaterialOut, MaterialDetailOut
from stock.models import Material
from asgiref.sync import sync_to_async
from typing import List
from stock.utils import get_material_by_id, get_materials_by_factory, search_materials_by_factory, get_factory_by_id
from ninja.errors import HttpError

router = Router(tags=["Stock Material"])


@router.post(
    "/materials",
    summary="[C] 원자재 등록",
    description="공장에 원자재를 등록합니다.",
    response={201: MaterialOut},
    auth=jwt_auth,
)
async def create_stock_material(request, payload: MaterialCreateIn):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    try:
        factory = await get_factory_by_id(factory_id, user)
    except HttpError as e:
        if e.status_code == 404:
            raise
        raise HttpError(422, str(e))
    # 중복 코드 검증
    @sync_to_async
    def check_duplicate_code():
        return Material.objects.filter(factory=factory, code=data['code']).exists()
    if await check_duplicate_code():
        raise HttpError(422, "이미 존재하는 자재코드입니다.")
    material = await Material.objects.acreate(factory=factory, **data)
    return 201, material


@router.get(
    "/materials",
    summary="[C] 원자재 목록 조회",
    description="공장의 원원자재 목록을 조회합니다. 필터링이 가능합니다.",
    response={200: List[MaterialOut]},
    auth=jwt_auth,
)
@paginate
async def list_stock_materials(request, factory_id: int, filters: MaterialFilter = Query(...)):
    user = request.auth
    
    @sync_to_async
    def get_stock_materials():
        queryset = Material.objects.filter(factory_id=factory_id, factory__owner=user).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)
    
    materials = await get_stock_materials()
    return materials


@router.post(
    "/materials/search",
    summary="[C] 원원자재 검색",
    description="공장의 원자재를 이름, 코드, 카테고리로 검색합니다.",
    response={200: List[MaterialOut]},
    auth=jwt_auth,
)
@paginate
async def search_stock_materials(request, payload: MaterialSearchIn):
    user = request.auth
    factory_id = payload.factory_id
    
    # 공장 소유권 검증
    await get_factory_by_id(factory_id, user)
    
    @sync_to_async
    def get_materials():
        queryset = Material.objects.filter(factory_id=factory_id, factory__owner=user)
        
        if payload.q:
            queryset = queryset.filter(
                name__icontains=payload.q
            ) | queryset.filter(
                code__icontains=payload.q
            ) | queryset.filter(
                spec__icontains=payload.q
            )
        
        return list(queryset.order_by("-created_at"))
    
    materials = await get_materials()
    return materials


@router.post(
    "/materials/detail",
    summary="[C] 원자재 상세 조회",
    description="원자재 ID로 자재 정보를 조회합니다.",
    response={200: MaterialDetailOut},
    auth=jwt_auth,
)
async def get_stock_material(request, payload: MaterialDetailIn):
    user = request.auth
    material = await get_material_by_id(payload.material_id, payload.factory_id, user)
    
    @sync_to_async
    def get_material_details():
        material.factory_name = material.factory.name
        material.created_at_formatted = material.created_at.strftime("%Y-%m-%d %H:%M:%S")
        material.updated_at_formatted = material.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        return material
    
    return await get_material_details()


@router.patch(
    "/materials",
    summary="[C] 원자재 정보 수정",
    description="원자재 ID로 자재 정보를 수정합니다.",
    response={200: MaterialOut},
    auth=jwt_auth,
)
async def update_stock_material(request, payload: MaterialUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    material_id = data.pop("material_id")
    factory_id = data.pop("factory_id")
    material = await get_material_by_id(material_id, factory_id, user)
    for attr, value in data.items():
        setattr(material, attr, value)
    await material.asave()
    return material


@router.delete(
    "/materials",
    summary="[C] 원자재 삭제",
    description="원자재 ID로 자재를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_stock_material(request, payload: MaterialDeleteIn):
    user = request.auth
    material = await get_material_by_id(payload.material_id, payload.factory_id, user)
    await material.adelete()
    return 204, None 