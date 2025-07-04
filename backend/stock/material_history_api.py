from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from stock.schemas.inbound import MaterialHistoryCreateIn, MaterialHistoryUpdateIn
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
from ninja.errors import HttpError

router = Router(tags=["Stock Material History"])


@router.post(
    "/{material_id}/history",
    summary="[C] 원자재 히스토리 생성",
    description="원자재의 구매/소모 히스토리를 생성합니다.",
    response={201: MaterialHistoryOut},
    auth=jwt_auth,
)
async def create_material_history_api(request, material_id: int, payload: MaterialHistoryCreateIn):
    user = request.auth
    material = await get_material_by_id(material_id, user)
    
    # 거래처 조회
    try:
        client = await FactoryClient.objects.aget(
            id=payload.client_id,
            factory__owner=user
        )
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "해당 거래처가 존재하지 않습니다.")
    
    # 히스토리 생성
    history = await create_material_history(
        material=material,
        client=client,
        type=payload.type,
        quantity=payload.quantity,
        price=payload.price
    )
    
    return 201, history


@router.get(
    "/{material_id}/history",
    summary="[C] 원자재 히스토리 조회",
    description="원자재의 전체 히스토리를 조회합니다.",
    response={200: List[MaterialHistoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_material_history(request, material_id: int):
    user = request.auth
    await get_material_by_id(material_id, user)
    history = await get_material_history_by_material(material_id, user)
    return await sync_to_async(list)(history)


@router.get(
    "/{material_id}/history/recent",
    summary="[C] 원자재 최근 히스토리 조회",
    description="원자재의 최근 3개월 히스토리를 조회합니다.",
    response={200: List[MaterialHistoryOut]},
    auth=jwt_auth,
)
@paginate
async def list_material_history_recent(request, material_id: int, months: int = 3):
    user = request.auth
    await get_material_by_id(material_id, user)
    history = await get_material_history_by_material(material_id, user, months)
    return await sync_to_async(list)(history)


@router.get(
    "/history/{history_id}",
    summary="[C] 원자재 히스토리 상세 조회",
    description="원자재 히스토리 ID로 히스토리 정보를 조회합니다.",
    response={200: MaterialHistoryOut},
    auth=jwt_auth,
)
async def get_material_history(request, history_id: int):
    user = request.auth
    history = await get_material_history_by_id(history_id, user)
    return history


@router.patch(
    "/history/{history_id}",
    summary="[C] 원자재 히스토리 수정",
    description="원자재 히스토리 ID로 히스토리 정보를 수정합니다.",
    response={200: MaterialHistoryOut},
    auth=jwt_auth,
)
async def update_material_history(request, history_id: int, payload: MaterialHistoryUpdateIn):
    user = request.auth
    history = await get_material_history_by_id(history_id, user)
    
    if payload.quantity is not None and payload.quantity != history.quantity:
        if history.type == MaterialHistory.MaterialHistoryType.purchase:
            material = await sync_to_async(lambda: history.material)()
            material.current_stock -= history.quantity
        else:
            material = await sync_to_async(lambda: history.material)()
            material.current_stock += history.quantity
        
        if history.type == MaterialHistory.MaterialHistoryType.purchase:
            material.current_stock += payload.quantity
        else:
            material.current_stock -= payload.quantity
        
        if material.current_stock < 0:
            raise HttpError(400, "재고가 부족합니다.")
        
        await sync_to_async(material.save)()
        history.quantity = payload.quantity
        history.total_stock = material.current_stock
    
    if payload.price is not None:
        history.price = payload.price
    
    await history.asave()
    return history


@router.delete(
    "/history/{history_id}",
    summary="[C] 원자재 히스토리 삭제",
    description="원자재 히스토리 ID로 히스토리를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_material_history(request, history_id: int):
    user = request.auth
    history = await get_material_history_by_id(history_id, user)
    
    # 재고 재계산
    if history.type == MaterialHistory.MaterialHistoryType.purchase:
        material = await sync_to_async(lambda: history.material)()
        material.current_stock -= history.quantity
    else:  # consumption
        material = await sync_to_async(lambda: history.material)()
        material.current_stock += history.quantity
    
    if material.current_stock < 0:
        raise HttpError(400, "재고가 부족합니다.")
    
    await sync_to_async(material.save)()
    await history.adelete()
    
    return 204, None 