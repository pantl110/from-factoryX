from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from factory.schemas.inbound import FactoryClientCreateIn, FactoryClientUpdateIn, FactoryClientSearchFilter
from factory.schemas.outbound import FactoryClientOut, FactoryClientDetailOut
from factory.models import FactoryClient
from asgiref.sync import sync_to_async
from typing import List
from factory.utils import get_factory_client_by_id, get_factory_by_id

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
    return 201, {
        "id": client.id,
        "client_type": client.get_type_display() if hasattr(client, 'get_type_display') else client.type,
        "name": client.name,
        "business_registration_number": client.business_registration_number,
        "representative_name": client.representative_name,
        "business_type": client.business_type,
        "business_category": client.business_category,
        "phone": client.phone,
        "email": client.email,
        "fax": client.fax,  # 팩스번호 필드 추가
        "address": client.address,  # 주소 필드 추가
        "manager": client.manager,  # 담당자 필드 추가
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
    request, 
    factory_id: int, 
    filters: FactoryClientSearchFilter = Query(None)
):
    """
    입력 필드:
    - factory_id: 공장 ID (필수, 쿼리 파라미터)
    - q: 검색어 (선택, 미입력시 전체)

    검색 대상 필드:
    - name: 회사명
    - business_registration_number: 사업자등록번호
    - representative_name: 대표자명
    - business_type: 업태
    - business_category: 종목
    - phone: 연락처
    - email: 이메일

    반환 필드:
    - client_type: 거래처
    - name: 회사명
    - business_registration_number: 사업자등록번호
    - representative_name: 대표자명
    - business_type: 업태
    - business_category: 종목
    - phone: 연락처
    - email: 이메일
    - fax: 팩스번호
    - address: 주소
    - manager: 담당자
    """
    user = request.auth
    await get_factory_by_id(factory_id, user)

    @sync_to_async
    def get_factory_clients():
        queryset = FactoryClient.objects.filter(factory_id=factory_id, factory__owner=user)
        if filters and filters.q:
            qs = queryset.filter(name__icontains=filters.q)
            qs = qs.union(queryset.filter(business_registration_number__icontains=filters.q))
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
            client_type=c.type,
            name=c.name,
            business_registration_number=c.business_registration_number,
            representative_name=c.representative_name,
            business_type=c.business_type,
            business_category=c.business_category,
            phone=c.phone,
            email=c.email,
            fax=c.fax,  # 팩스번호 필드 추가
            address=c.address,  # 주소 필드 추가
            manager=c.manager,  # 담당자 필드 추가
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
async def get_factory_client(
    request, 
    client_id: int, 
    factory_id: int
):
    """
    입력 필드:
    - client_id: 거래처 ID (필수, 쿼리 파라미터)

    반환 필드:
    - id: 거래처 ID
    - client_type: 거래처
    - name: 회사명
    - business_registration_number: 사업자등록번호
    - representative_name: 대표자명
    - business_type: 업태
    - business_category: 종목
    - phone: 연락처
    - email: 이메일
    - fax: 팩스번호
    - address: 주소
    - manager: 담당자
    - note: 비고
    """
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    return {
        "id": client.id,
        "client_type": client.type,
        "name": client.name,
        "business_registration_number": client.business_registration_number,
        "representative_name": client.representative_name,
        "business_type": client.business_type,
        "business_category": client.business_category,
        "phone": client.phone,
        "email": client.email,
        "fax": client.fax,  # 팩스번호 필드 추가
        "address": client.address,  # 주소 필드 추가
        "manager": client.manager,  # 담당자 필드 추가
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
    request,
    client_id: int,
    factory_id: int,
    payload: FactoryClientUpdateIn,
):
    """
    입력 필드:
    - client_id: 거래처 ID (필수, 경로)
    - factory_id: 공장 ID (필수, 경로)
    - client_type: 거래처
    - name: 회사명
    - business_registration_number: 사업자등록번호
    - representative_name: 대표자명
    - business_type: 업태
    - business_category: 종목
    - phone: 연락처
    - email: 이메일
    - fax: 팩스번호
    - address: 주소
    - manager: 담당자
    - note: 비고

    반환 필드:
    - client_type: 거래처
    - name: 회사명
    - business_registration_number: 사업자등록번호
    - representative_name: 대표자명
    - business_type: 업태
    - business_category: 종목
    - phone: 연락처
    - email: 이메일
    - fax: 팩스번호
    - address: 주소
    - manager: 담당자
    - note: 비고
    """
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    for field in [
        "type", "name", "business_registration_number", "representative_name",
        "business_type", "business_category", "phone", "email", "fax", "address", "manager", "note"
    ]:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(client, field, value)
    await sync_to_async(client.save)()
    return {
        "id": client.id,
        "client_type": client.type,
        "name": client.name,
        "business_registration_number": client.business_registration_number,
        "representative_name": client.representative_name,
        "business_type": client.business_type,
        "business_category": client.business_category,
        "phone": client.phone,
        "email": client.email,
        "fax": client.fax,  # 팩스번호 필드 추가
        "address": client.address,  # 주소 필드 추가
        "manager": client.manager,  # 담당자 필드 추가
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
async def delete_factory_client(request, client_id: int, factory_id: int):
    user = request.auth
    client = await get_factory_client_by_id(client_id, factory_id, user)
    await client.adelete()
    return 204, None 