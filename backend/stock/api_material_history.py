from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from stock.schemas.inbound import (
    MaterialHistoryCreateIn, MaterialHistoryUpdateIn, MaterialHistoryFilter,
    MaterialHistoryDetailIn, MaterialHistoryRecentIn, MaterialHistoryDeleteIn
)
from stock.schemas.outbound import MaterialHistoryOut, MaterialHistoryDetailOut
from stock.models import Material, MaterialHistory
from factory.models import FactoryClient
from asgiref.sync import sync_to_async
from typing import List
from stock.utils import (
    get_material_by_id, 
    get_material_history_by_material, 
    get_material_history_by_id,
    create_material_history
)
from factory.utils import get_factory_by_id
from ninja.errors import HttpError

router = Router(tags=["Stock Material History"])


@router.post(
    "/history",
    summary="[C] 원자재 히스토리 생성",
    description="원자재의 구매/소모 히스토리를 생성합니다.",
    response={201: MaterialHistoryOut},
    auth=jwt_auth,
)
async def create_material_history_api(request, payload: MaterialHistoryCreateIn):
    user = request.auth
    data = payload.dict()
    material_id = data.pop("material_id")
    client_id = data.pop("client_id")
    factory_id = data.pop("factory_id")
    
    await get_factory_by_id(factory_id, user)
    
    material = await get_material_by_id(material_id, factory_id, user)
    
    try:
        client = await FactoryClient.objects.aget(
            id=client_id,
            factory_id=factory_id,
            factory__owner=user
        )
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "해당 거래처가 존재하지 않습니다.")
    
    # 히스토리 생성
    history = await create_material_history(
        material=material,
        client=client,
        type=data.get('type'),
        quantity=data.get('quantity'),
        price=data.get('price'),
        user=user
    )
    
    return 201, history


@router.get(
    "/history",
    summary="[C] 원자재 히스토리 조회",
    description="원자재의 전체 히스토리를 조회합니다. 필터링이 가능합니다.",
    response={200: List[MaterialHistoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_material_history(request, material_id: int, factory_id: int, filters: MaterialHistoryFilter = Query(...)):
    user = request.auth
    await get_material_by_id(material_id, factory_id, user)
    
    @sync_to_async
    def get_material_histories():
        queryset = MaterialHistory.objects.filter(
            material_id=material_id,
            material__factory_id=factory_id,
            material__factory__owner=user
        ).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)
    
    history = await get_material_histories()
    return history


@router.post(
    "/history/recent",
    summary="[C] 원자재 최근 히스토리 조회",
    description="원자재의 최근 3개월 히스토리를 조회합니다.",
    response={200: List[MaterialHistoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_material_history_recent(request, payload: MaterialHistoryRecentIn):
    user = request.auth
    material_id = payload.material_id
    factory_id = payload.factory_id
    months = payload.months
    await get_material_by_id(material_id, factory_id, user)
    history = await get_material_history_by_material(material_id, factory_id, user, months)
    return await sync_to_async(list)(history)


@router.post(
    "/history/detail",
    summary="[C] 원자재 히스토리 상세 조회",
    description="원자재 히스토리 ID로 히스토리 정보를 조회합니다.",
    response={200: MaterialHistoryDetailOut},
    auth=jwt_auth,
)
async def get_material_history(request, payload: MaterialHistoryDetailIn):
    user = request.auth
    history_id = payload.history_id
    history = await get_material_history_by_id(history_id, user)
    
    history.client_name = await sync_to_async(lambda: history.client.name)()
    history.material_name = await sync_to_async(lambda: history.material.name)()
    history.material_code = await sync_to_async(lambda: history.material.code)()
    history.created_at_formatted = await sync_to_async(lambda: history.created_at.strftime("%Y-%m-%d %H:%M:%S"))()
    
    return history


@router.patch(
    "/history",
    summary="[C] 원자재 히스토리 수정",
    description="원자재 히스토리 ID로 히스토리 정보를 수정합니다.",
    response={200: MaterialHistoryOut},
    auth=jwt_auth,
)
async def update_material_history(request, payload: MaterialHistoryUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    history_id = data.pop("history_id")
    history = await get_material_history_by_id(history_id, user)
    
    if data.get('quantity') is not None and data.get('quantity') != history.quantity:
        if history.type == MaterialHistory.MaterialHistoryType.purchase:
            material = await sync_to_async(lambda: history.material)()
            material.current_stock -= history.quantity
        else:
            material = await sync_to_async(lambda: history.material)()
            material.current_stock += history.quantity
        
        if history.type == MaterialHistory.MaterialHistoryType.purchase:
            material.current_stock += data.get('quantity')
        else:
            material.current_stock -= data.get('quantity')
        
        if material.current_stock < 0:
            raise HttpError(400, "재고가 부족합니다.")
        
        await sync_to_async(material.save)()
        history.quantity = data.get('quantity')
        history.total_stock = material.current_stock
    
    if data.get('price') is not None:
        history.price = data.get('price')
    
    await history.asave()
    return history


@router.delete(
    "/history",
    summary="[C] 원자재 히스토리 삭제",
    description="원자재 히스토리 ID로 히스토리를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_material_history(request, payload: MaterialHistoryDeleteIn):
    user = request.auth
    history_id = payload.history_id
    history = await get_material_history_by_id(history_id, user)
    
    if history.type == MaterialHistory.MaterialHistoryType.purchase:
        material = await sync_to_async(lambda: history.material)()
        material.current_stock -= history.quantity
    else:
        material = await sync_to_async(lambda: history.material)()
        material.current_stock += history.quantity
    
    if material.current_stock < 0:
        raise HttpError(400, "재고가 부족합니다.")
    
    await sync_to_async(material.save)()
    await history.adelete()
    
    return 204, None 