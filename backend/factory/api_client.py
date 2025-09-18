from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import (
    FactoryClientCreateIn,
    FactoryClientUpdateIn,
    FactoryClientSearchFilter,
)
from factory.schemas.outbound import FactoryClientOut, FactoryClientDetailOut
from factory.models import FactoryClient, Factory
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import is_factory_member


router = Router(tags=["Factory Client"])


@router.post(
    "",
    summary="[C] 공장 거래처 등록",
    description="공장에 거래처를 등록합니다.",
    response={201: FactoryClientOut},
    auth=jwt_auth,
)
async def create_factory_client(request, payload: FactoryClientCreateIn):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    data = payload.dict()
    # Normalize role flags: None -> False (avoid NOT NULL errors)
    if data.get("is_customer") is None:
        data["is_customer"] = False
    if data.get("is_supplier") is None:
        data["is_supplier"] = False

    existing_client = await FactoryClient.objects.filter(
        factory_id=int(factory_id), name=data["name"]
    ).afirst()

    if existing_client:
        raise HttpError(400, f"이미 등록된 거래처입니다: {data['name']}")

    # data = payload.dict()
    
    # if "type" in data and data["type"] is not None:
    #     valid_types = ["customer", "supplier"]
    #     if data["type"] not in valid_types:
    #         raise HttpError(
    #             400,
    #             f"잘못된 거래처 타입입니다. 'customer' 또는 'supplier' 중 하나를 입력해주세요.",
    #         )
    # else:
    #     if "type" in data:
    #         del data["type"]

    factory = await Factory.objects.aget(id=int(factory_id))
    client = await FactoryClient.objects.acreate(factory=factory, **data)
    return 201, {
        "id": client.id,
        # "type": client.type,
        "name": client.name,
        "is_customer": client.is_customer,
        "is_supplier": client.is_supplier,
        "business_registration_number": client.business_registration_number,
        "representative_name": client.representative_name,
        "business_type": client.business_type,
        "business_category": client.business_category,
        "phone": client.phone,
        "email": client.email,
        "fax": client.fax,
        "address": client.address,
        "manager": client.manager,
        "note": client.note,
    }


# Factory Client Information Tab
@router.get(
    "",
    summary="[C] 공장 거래처 통합 검색",
    description="검색창 하나로 모든 주요 필드 부분검색, 미입력시 전체",
    response={200: List[FactoryClientOut]},
    auth=jwt_auth,
)
@paginate
async def list_factory_clients(
    request, filters: FactoryClientSearchFilter = Query(None)
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    @sync_to_async
    def get_factory_clients():
        queryset = FactoryClient.objects.filter(
            factory_id=factory_id, factory__owner=user
        )
        if filters and filters.q:
            qs = queryset.filter(name__icontains=filters.q)
            qs = qs.union(
                queryset.filter(business_registration_number__icontains=filters.q)
            )
            qs = qs.union(queryset.filter(representative_name__icontains=filters.q))
            qs = qs.union(queryset.filter(business_type__icontains=filters.q))
            qs = qs.union(queryset.filter(business_category__icontains=filters.q))
            qs = qs.union(queryset.filter(phone__icontains=filters.q))
            qs = qs.union(queryset.filter(email__icontains=filters.q))
            queryset = qs
        return list(queryset.order_by("-created_at"))

    clients = await get_factory_clients()
    result = [
        FactoryClientOut(
            id=c.id,
            # type=c.type,
            name=c.name,
            is_customer=c.is_customer,
            is_supplier=c.is_supplier,
            business_registration_number=c.business_registration_number,
            representative_name=c.representative_name,
            business_type=c.business_type,
            business_category=c.business_category,
            phone=c.phone,
            email=c.email,
            fax=c.fax,
            address=c.address,
            manager=c.manager,
            note=c.note,
        )
        for c in clients
    ]
    return result


# Material, Factory Client Information Tab
@router.get(
    "/{client_id}",
    summary="[C] 공장 거래처 상세 조회",
    description="공장 거래처 ID로 거래처 정보를 조회합니다.",
    response={200: FactoryClientDetailOut, 404: dict},
    auth=jwt_auth,
)
async def get_factory_client(request, client_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        client = await FactoryClient.objects.aget(
            id=client_id, factory_id=int(factory_id)
        )
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")

    return {
        "id": client.id,
        # "type": client.type,
        "name": client.name,
        "is_customer": client.is_customer,
        "is_supplier": client.is_supplier,
        "business_registration_number": client.business_registration_number,
        "representative_name": client.representative_name,
        "business_type": client.business_type,
        "business_category": client.business_category,
        "phone": client.phone,
        "email": client.email,
        "fax": client.fax,
        "address": client.address,
        "manager": client.manager,
        "note": client.note,
    }


# Factory Client Information Tab
@router.patch(
    "/{client_id}",
    summary="[C] 공장 거래처 정보 수정",
    description="공장 거래처 정보를 수정합니다.",
    response={200: FactoryClientDetailOut, 404: dict},
    auth=jwt_auth,
)
async def update_factory_client(
    request, client_id: int, payload: FactoryClientUpdateIn
):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        client = await FactoryClient.objects.aget(
            id=client_id, factory_id=int(factory_id)
        )
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")
    for field in [
        # "type",
        "is_customer",
        "is_supplier",
        "name",
        "business_registration_number",
        "representative_name",
        "business_type",
        "business_category",
        "phone",
        "email",
        "fax",
        "address",
        "manager",
        "note",
    ]:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(client, field, value)
    await sync_to_async(client.save)()
    return {
        "id": client.id,
        # "type": client.type,
        "name": client.name,
        "is_customer": client.is_customer,
        "is_supplier": client.is_supplier,
        "business_registration_number": client.business_registration_number,
        "representative_name": client.representative_name,
        "business_type": client.business_type,
        "business_category": client.business_category,
        "phone": client.phone,
        "email": client.email,
        "fax": client.fax,
        "address": client.address,
        "manager": client.manager,
        "note": client.note,
    }


# Factory Client Information Tab
@router.delete(
    "/{client_id}",
    summary="[C] 공장 거래처 삭제",
    description="공장 거래처 ID로 거래처를 삭제합니다.",
    response={204: None, 404: dict},
    auth=jwt_auth,
)
async def delete_factory_client(request, client_id: int):
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        client = await FactoryClient.objects.aget(
            id=client_id, factory_id=int(factory_id)
        )
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "거래처 정보를 찾을 수 없습니다.")

    await client.adelete()
    return 204, None
