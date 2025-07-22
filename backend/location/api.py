from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from api.security import jwt_auth
from location.schemas.inbound import LocationCreateIn, LocationUpdateIn
from location.schemas.outbound import LocationListOut, LocationDetailOut, ItemLocationsListOut
from location.models import Location
from stock.models import Material, Product

router = Router(tags=["Location"], auth=jwt_auth)


@router.post(
    "", 
    summary="[C] 창고 위치 생성", 
    description="material id/product id에 창고 위치를 생성합니다.",
    response={ 200: LocationDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def create_location(request, payload: LocationCreateIn):
    """
    입력 필드:
    - type: 타입 ("material" 또는 "product", 필수)
    - id: 대상 아이템 ID (material 또는 product의 id, 필수)
    - location: 창고 위치명 (str, 필수)
    - images: 이미지 리스트 (list, 선택)

    반환 필드 (LocationDetailOut):
    - id: 위치 ID (int)
    - type: 타입 (str)
    - location: 창고 위치명 (str)
    - images: 이미지 리스트 (list)
    """

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

    location, created = await Location.objects.aget_or_create(
        type=payload.type,
        location=payload.location,
        defaults={'images': payload.images or []}
    )
    
    await sync_to_async(item.location.add)(location)
    
    return 200, LocationDetailOut(
        id=location.id,
        type=location.type,
        location=location.location,
        images=location.images or []
    )


# Product/Material Tab
@router.get(
    "", 
    summary="[C] 모든 창고 위치 목록 조회",
    description="material id/product id로 창고 위치를 조회합니다.",
    response={ 200: ItemLocationsListOut, 400: dict, 404: dict, 500: dict }
    )
async def list_locations(request, type: str, id: int):
    """
    입력 필드:
    - type: 타입 ("material" 또는 "product", 필수, 쿼리 파라미터)
    - id: 대상 아이템 ID (material 또는 product의 id, 필수, 쿼리 파라미터)

    반환 필드 (ItemLocationsListOut):
    - locations: 위치 정보 리스트 (LocationDetailOut의 리스트)
        - id: 위치 ID (int)
        - type: 타입 (str)
        - location: 창고 위치명 (str)
        - images: 이미지 리스트 (list)
    """

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

    locations = await sync_to_async(list)(item.location.all())

    if not locations:
        raise HttpError(404, "해당 아이템에 연결된 위치 정보가 없습니다.")

    locations_detail_list = [
        LocationDetailOut(
            id=loc.id,
            type=loc.type,
            location=loc.location,
            images=loc.images or []
        ) for loc in locations
    ]

    return 200, ItemLocationsListOut(
        locations=locations_detail_list
    )


@router.patch(
    "/{location_id}", 
    summary="[C] 창고 위치 수정", 
    description="material id/product id의 기존 위치를 새로운 위치로 수정합니다.",
    response={ 200: LocationDetailOut, 400: dict, 404: dict, 500: dict }
    )
async def update_location(request, location_id: int, payload: LocationUpdateIn):

    if payload.type == "material":
        target_model = Material
    elif payload.type == "product":
        target_model = Product
    else:
        raise HttpError(400, "올바르지 않은 타입입니다.")
    
    try:
        item = await target_model.objects.aget(id=location_id)
    except target_model.DoesNotExist:
        raise HttpError(404, "해당 아이템을 찾을 수 없습니다.")
    
    # 기존 위치 확인
    existing_locations = await sync_to_async(list)(item.location.all())
    if not existing_locations:
        raise HttpError(404, "위치 정보가 없습니다.")
    
    new_location, created = await Location.objects.aget_or_create(
        type=payload.type,
        location=payload.location,
        defaults={'images': payload.images or []}
    )
    
    # 기존 위치 제거 후 새 위치 추가
    await sync_to_async(item.location.clear)()
    await sync_to_async(item.location.add)(new_location)
    
    return 200, LocationDetailOut(
        id=new_location.id,
        type=new_location.type,
        location=new_location.location,
        images=new_location.images or []
    )


@router.delete(
    "/{location_id}", 
    summary="[C] 창고 위치 삭제", 
    description="material id/product id의 위치 연결을 해제합니다.",
    response={ 200: dict, 400: dict, 404: dict, 500: dict }
    )
async def delete_location(request, location_id: int, type: str):

    if type == "material":
        target_model = Material
    elif type == "product":
        target_model = Product
    else:
        raise HttpError(400, "올바르지 않은 타입입니다.")
    
    try:
        item = await target_model.objects.aget(id=location_id)
    except target_model.DoesNotExist:
        raise HttpError(404, "해당 아이템을 찾을 수 없습니다.")
    
    # 기존 위치 확인
    existing_locations = await sync_to_async(list)(item.location.all())
    if not existing_locations:
        raise HttpError(404, "위치 정보가 없습니다.")
    
    # 모든 위치 연결 해제
    await sync_to_async(item.location.clear)()
    
    return 200, {"message": "위치 연결이 해제되었습니다."}