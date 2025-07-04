from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import FactoryClientCreateIn, FactoryClientUpdateIn
from factory.schemas.outbound import FactoryClientOut
from factory.models import Factory, FactoryClient
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import get_factory_client_by_id, get_factory_clients_by_factory

router = Router(tags=["Factory Client"])


@router.post(
    "/{factory_id}/clients",
    summary="[C] 공장 거래처 등록",
    description="공장에 거래처를 등록합니다.",
    response={201: FactoryClientOut},
    auth=jwt_auth,
)
async def create_factory_client(request, factory_id: int, payload: FactoryClientCreateIn):
    user = request.auth
    factory = await Factory.objects.aget(id=factory_id, owner=user)
    client = await FactoryClient.objects.acreate(
        factory=factory,
        **payload.dict(),
    )
    return 201, client


@router.get(
    "/{factory_id}/clients",
    summary="[C] 공장 거래처 목록 조회",
    description="공장의 거래처 목록을 조회합니다.",
    response={200: List[FactoryClientOut]},
    auth=jwt_auth,
)
@paginate
async def list_factory_clients(request, factory_id: int):
    user = request.auth
    clients = await get_factory_clients_by_factory(factory_id, user)
    return await sync_to_async(list)(clients)


@router.get(
    "/{factory_id}/clients/{client_id}",
    summary="[C] 공장 거래처 상세 조회",
    description="공장 거래처 ID로 거래처 정보를 조회합니다.",
    response={200: FactoryClientOut},
    auth=jwt_auth,
)
async def get_factory_client(request, factory_id: int, client_id: int):
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    return client


@router.patch(
    "/{factory_id}/clients/{client_id}",
    summary="[C] 공장 거래처 정보 수정",
    description="공장 거래처 ID로 거래처 정보를 수정합니다.",
    response={200: FactoryClientOut},
    auth=jwt_auth,
)
async def update_factory_client(request, factory_id: int, client_id: int, payload: FactoryClientUpdateIn):
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(client, attr, value)
    await client.asave()
    return client


@router.delete(
    "/{factory_id}/clients/{client_id}",
    summary="[C] 공장 거래처 삭제",
    description="공장 거래처 ID로 거래처를 삭제합니다.",
    response={204: None},
    auth=jwt_auth,
)
async def delete_factory_client(request, factory_id: int, client_id: int):
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    await client.adelete()
    return 204, None 