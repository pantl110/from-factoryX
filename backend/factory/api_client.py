from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import FactoryClientCreateIn, FactoryClientUpdateIn, FactoryClientFilter, FactoryClientSearchIn
from factory.schemas.outbound import FactoryClientOut, FactoryClientDetailOut
from factory.models import Factory, FactoryClient
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import get_factory_client_by_id, get_factory_clients_by_factory, search_factory_clients_by_factory, get_factory_by_id

router = Router(tags=["Factory Client"])


@router.post(
    "",
    summary="[C] 공장 거래처 등록",
    description="공장에 거래처를 등록합니다.",
    response={201: FactoryClientOut},
    auth=jwt_auth,
)
async def create_factory_client(request, payload: FactoryClientCreateIn):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    factory = await get_factory_by_id(factory_id, user)
    client = await FactoryClient.objects.acreate(factory=factory, **data)
    return 201, client


@router.get(
    "",
    summary="[C] 공장 거래처 목록 조회",
    description="공장의 거래처 목록을 조회합니다. 필터링이 가능합니다.",
    response={200: List[FactoryClientOut]},
    auth=jwt_auth,
)
@paginate
async def list_factory_clients(request, factory_id: int, filters: FactoryClientFilter = Query(...)):
    user = request.auth
    
    # 공장 소유권 검증
    await get_factory_by_id(factory_id, user)
    
    @sync_to_async
    def get_factory_clients():
        queryset = FactoryClient.objects.filter(factory_id=factory_id, factory__owner=user).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)
    
    clients = await get_factory_clients()
    return clients


@router.post(
    "/search",
    summary="[C] 공장 거래처 검색",
    description="공장의 거래처를 이름, 사업자등록번호, 대표자명으로 검색합니다.",
    response={200: List[FactoryClientOut]},
    auth=jwt_auth,
)
@paginate
async def search_factory_clients(request, payload: FactoryClientSearchIn):
    user = request.auth
    factory_id = payload.factory_id
    
    # 공장 소유권 검증
    await get_factory_by_id(factory_id, user)
    
    @sync_to_async
    def get_factory_clients():
        queryset = FactoryClient.objects.filter(factory_id=factory_id, factory__owner=user)
        
        if payload.q:
            queryset = queryset.filter(
                name__icontains=payload.q
            ) | queryset.filter(
                business_registration_number__icontains=payload.q
            ) | queryset.filter(
                representative_name__icontains=payload.q
            )
        
        return list(queryset.order_by("-created_at"))
    
    clients = await get_factory_clients()
    return clients


@router.get(
    "/{client_id}",
    summary="[C] 공장 거래처 상세 조회",
    description="공장 거래처 ID로 거래처 정보를 조회합니다.",
    response={200: FactoryClientDetailOut, 404: dict},
    auth=jwt_auth,
)
async def get_factory_client(request, client_id: int, factory_id: int):
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    
    client.factory_name = await sync_to_async(lambda: client.factory.name)()
    client.created_at_formatted = client.created_at.strftime("%Y-%m-%d %H:%M:%S")
    client.updated_at_formatted = client.updated_at.strftime("%Y-%m-%d %H:%M:%S")
    
    return client


@router.patch(
    "/{client_id}",
    summary="[C] 공장 거래처 정보 수정",
    description="공장 거래처 ID로 거래처 정보를 수정합니다.",
    response={200: FactoryClientOut, 404: dict},
    auth=jwt_auth,
)
async def update_factory_client(request, client_id: int, factory_id: int, payload: FactoryClientUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    client = await get_factory_client_by_id(client_id, factory_id, user)
    for attr, value in data.items():
        setattr(client, attr, value)
    await client.asave()
    return client


@router.delete(
    "/{client_id}",
    summary="[C] 공장 거래처 삭제",
    description="공장 거래처 ID로 거래처를 삭제합니다.",
    response={204: None, 404: dict},
    auth=jwt_auth,
)
async def delete_factory_client(request, client_id: int, factory_id: int):
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    await client.adelete()
    return 204, None 