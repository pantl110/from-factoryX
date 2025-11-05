from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from location.schemas.inbound import LocationCreateIn, LocationUpdateIn
from location.schemas.outbound import LocationDetailOut, LocationListOut, ItemLocationsListOut
from location.models import Location
from stock.models import Material, Product
from factory.utils import is_factory_member

router = Router(tags=["Location"], auth=jwt_auth)


# Material/Product Tab
@router.post(
    "", 
    summary="[C] 창고 위치 생성", 
    description="material id/product id에 창고 위치를 생성합니다.",
    response={ 200: LocationDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def create_location(request, payload: LocationCreateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    if payload.type == "material":
        target_model = Material
    elif payload.type == "product":
        target_model = Product
    else:
        raise HttpError(400, "올바르지 않은 타입입니다.")
    
    try:
        item = await target_model.objects.aget(id=payload.id)
    except target_model.DoesNotExist:
        raise HttpError(404, "해당 아이템을 찾을 수 없습니다.")

    location = await Location.objects.acreate(
        type=payload.type,
        location=payload.location,
        images=payload.images or [],
        member=member,
        detail_location=payload.detail_location,
        memo=payload.memo
    )
    
    await sync_to_async(item.location.add)(location)
    
    return 200, LocationDetailOut(
        id=location.id,
        type=location.type,
        location=location.location,
        member=location.member_id,
        detail_location=location.detail_location,
        memo=location.memo,
        images=location.images or [],
        created_at=location.created_at,
        updated_at=location.updated_at
    )


# Product/Material Tab
@router.get(
    "", 
    summary="[C] 모든 창고 위치 목록 조회",
    description="material id/product id로 창고 위치를 조회합니다.",
    response={ 200: ItemLocationsListOut, 400: dict, 404: dict, 500: dict }
    )
async def list_locations(request, type: str, id: int):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    if type == "material":
        target_model = Material
    elif type == "product":
        target_model = Product
    else:
        raise HttpError(400, "올바르지 않은 타입입니다.")

    try:
        item = await target_model.objects.aget(id=id)
    except target_model.DoesNotExist:
        raise HttpError(404, "해당 아이템을 찾을 수 없습니다.")

    locations = await sync_to_async(list)(
        item.location.select_related('member', 'member__user').all()
    )

    if not locations:
        raise HttpError(404, "해당 아이템에 연결된 위치 정보가 없습니다.")

    locations_detail_list = []
    for loc in locations:
        # member 정보 가져오기
        member_email = None
        member_role = None
        if loc.member and loc.member.user:
            member_email = loc.member.user.email
            member_role = getattr(loc.member, "role", None)
        
        locations_detail_list.append(
            LocationListOut(
                id=loc.id,
                type=loc.type,
                location=loc.location,
                email=member_email,
                role=member_role,
                detail_location=loc.detail_location,
                memo=loc.memo,
                images=loc.images or [],
                created_at=loc.created_at,
                updated_at=loc.updated_at
            )
        )

    return 200, ItemLocationsListOut(
        locations=locations_detail_list
    )


@router.patch(
    "/{location_id}",
    summary="[C] 창고 위치 정보 수정",
    description="특정 위치(Location)의 이름과 이미지 목록을 수정합니다.",
    response={200: LocationDetailOut, 400: dict, 404: dict, 500: dict}
)
async def update_location(request, location_id: int, payload: LocationUpdateIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    member = await is_factory_member(int(factory_id), user)

    # Location 객체 직접 조회
    try:
        location = await Location.objects.aget(id=location_id)
    except Location.DoesNotExist:
        raise HttpError(404, "해당 위치를 찾을 수 없습니다.")
    
    # 위치 정보 수정 (부분 수정 지원)
    if payload.location is not None:
        location.location = payload.location
    if payload.images is not None:
        location.images = payload.images
    if payload.detail_location is not None:
        location.detail_location = payload.detail_location
    if payload.memo is not None:
        location.memo = payload.memo
    
    await sync_to_async(location.save)()
    
    return 200, LocationDetailOut(
        id=location.id,
        type=location.type,
        location=location.location,
        member=location.member_id,
        detail_location=location.detail_location,
        memo=location.memo,
        images=location.images or [],
        created_at=location.created_at,
        updated_at=location.updated_at
    )


@router.delete(
    "/{location_id}",
    summary="[C] 창고 위치 삭제",
    description="특정 위치(Location)를 삭제합니다.",
    response={ 200: dict, 400: dict, 404: dict, 500: dict }
    )
async def delete_location(request, location_id: int):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    # Location 객체 직접 조회
    try:
        location = await Location.objects.aget(id=location_id)
    except Location.DoesNotExist:
        raise HttpError(404, "해당 위치를 찾을 수 없습니다.")
    
    # Location 삭제
    await sync_to_async(location.delete)()
    
    return 200, {
        "message": "위치가 삭제되었습니다.", 
        "deleted_location_id": location_id
    }