from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from stock.schemas.inbound import MaterialCreateIn, MaterialUpdateIn, MaterialBulkCreateIn
from stock.schemas.outbound import MaterialOut, MaterialDetailOut
from stock.models import Material, MaterialHistory
from factory.models import Factory, FactoryClient
from asgiref.sync import sync_to_async
from typing import List
from stock.utils import get_material_by_id, get_materials_by_factory
from ninja.errors import HttpError
from django.db.models import Avg, Min, Max
from django.utils import timezone
from datetime import timedelta

router = Router(tags=["Stock Material"])


@router.post(
    "",
    summary="[C] 원자재 등록",
    description="원자재를 등록합니다.",
    response={201: MaterialOut},
    auth=jwt_auth,
)
async def create_material(request, payload: MaterialCreateIn):
    user = request.auth
    factory = await Factory.objects.aget(owner=user)
    material = await Material.objects.acreate(
        factory=factory,
        **payload.dict(),
    )
    return 201, material


@router.post(
    "/bulk",
    summary="[C] 원자재 일괄 등록",
    description="엑셀로 여러 원자재를 한 번에 등록합니다.",
    response={201: List[MaterialOut]},
    auth=jwt_auth,
)
async def create_materials_bulk(request, payload: MaterialBulkCreateIn):
    user = request.auth
    factory = await Factory.objects.aget(owner=user)
    
    materials = []
    for material_data in payload.materials:
        material = await Material.objects.acreate(
            factory=factory,
            **material_data.dict(),
        )
        materials.append(material)
    
    return 201, materials


@router.get(
    "",
    summary="[C] 원자재 목록 조회",
    description="등록된 원자재 목록을 조회합니다.",
    response={200: List[MaterialOut]},
    auth=jwt_auth,
)
@paginate
async def list_materials(request, factory_id: int):
    user = request.auth
    materials = await get_materials_by_factory(factory_id, user)
    return await sync_to_async(list)(materials)


@router.get(
    "/{material_id}",
    summary="[C] 원자재 상세 조회",
    description="원자재 ID로 원자재 정보를 조회합니다.",
    response={200: MaterialOut},
    auth=jwt_auth,
)
async def get_material(request, material_id: int):
    user = request.auth
    material = await get_material_by_id(material_id, user)
    return material


@router.get(
    "/{material_id}/detail",
    summary="[C] 원자재 상세 조회 (업체별 단가 비교)",
    description="원자재의 업체별 단가 비교 정보를 포함한 상세 정보를 조회합니다. 조회 기간을 설정할 수 있습니다.",
    response={200: MaterialDetailOut},
    auth=jwt_auth,
)
async def get_material_detail(request, material_id: int, days: int = 90):
    user = request.auth
    material = await get_material_by_id(material_id, user)
    
    start_date = timezone.now() - timedelta(days=days)
    purchase_history = await sync_to_async(list)(
        MaterialHistory.objects.filter(
            material=material,
            type=MaterialHistory.MaterialHistoryType.purchase,
            created_at__gte=start_date
        ).select_related('client')
    )
    
    client_stats = {}
    for history in purchase_history:
        client_name = history.client.name
        if client_name not in client_stats:
            client_stats[client_name] = {
                'total_quantity': 0,
                'total_amount': 0,
                'prices': []
            }
        
        if history.price:
            client_stats[client_name]['total_quantity'] += history.quantity
            client_stats[client_name]['total_amount'] += history.quantity * history.price
            client_stats[client_name]['prices'].append(history.price)
    
    for client_name, stats in client_stats.items():
        if stats['prices']:
            stats['average_price'] = sum(stats['prices']) / len(stats['prices'])
        else:
            stats['average_price'] = 0
    
    material.client_stats = client_stats
    
    return material


@router.patch(
    "/{material_id}",
    summary="[C] 원자재 정보 수정",
    description="원자재 ID로 원자재 정보를 수정합니다.",
    response={200: MaterialOut},
    auth=jwt_auth,
)
async def update_material(request, material_id: int, payload: MaterialUpdateIn):
    user = request.auth
    material = await get_material_by_id(material_id, user)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(material, attr, value)
    await material.asave()
    return material


@router.delete(
    "/{material_id}",
    summary="[C] 원자재 삭제",
    description="원자재 ID로 원자재를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_material(request, material_id: int):
    user = request.auth
    material = await get_material_by_id(material_id, user)
    await material.adelete()
    return 204, None 