from ninja import Router, Query
from ninja.pagination import paginate
from api.security import jwt_auth
from location.schemas.inbound import (
    LocationCreateIn, LocationUpdateIn, LocationDeleteIn, LocationDetailIn, LocationFilter
)
from location.schemas.outbound import LocationOut
from location.models import Location
from location.utils import get_location_by_id
from factory.utils import get_factory_by_id
from stock.models import Material
from asgiref.sync import sync_to_async
from typing import List

router = Router(tags=["Location"])

@router.post(
    "/locations",
    summary="위치 생성",
    response={201: LocationOut},
    auth=jwt_auth,
)
async def create_location(request, payload: LocationCreateIn):
    user = request.auth
    data = payload.dict()
    factory_id = data.pop("factory_id")
    await get_factory_by_id(factory_id, user)
    location = await Location.objects.acreate(**data)
    return 201, location

@router.get(
    "/locations",
    summary="위치 목록 조회",
    response={200: List[LocationOut]},
    auth=jwt_auth,
)
@paginate
async def list_locations(request, factory_id: int, filters: LocationFilter = Query(...)):
    user = request.auth
    await get_factory_by_id(factory_id, user)
    @sync_to_async
    def get_locations():
        location_ids = list(
            set(
                Material.objects.filter(factory_id=factory_id, factory__owner=user)
                .exclude(location_id=None)
                .values_list("location_id", flat=True)
            )
        )
        queryset = Location.objects.filter(id__in=location_ids).order_by("-created_at")
        queryset = filters.filter(queryset)
        return list(queryset)
    return await get_locations()

@router.post(
    "/locations/detail",
    summary="위치 상세 조회",
    response={200: LocationOut},
    auth=jwt_auth,
)
async def get_location(request, payload: LocationDetailIn):
    user = request.auth
    location = await get_location_by_id(payload.location_id, payload.factory_id, user)
    return location

@router.patch(
    "/locations",
    summary="위치 수정",
    response={200: LocationOut},
    auth=jwt_auth,
)
async def update_location(request, payload: LocationUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    location_id = data.pop("location_id")
    factory_id = data.pop("factory_id")
    location = await get_location_by_id(location_id, factory_id, user)
    for attr, value in data.items():
        setattr(location, attr, value)
    await location.asave()
    return location

@router.delete(
    "/locations",
    summary="위치 삭제",
    response={204: None},
    auth=jwt_auth,
)
async def delete_location(request, payload: LocationDeleteIn):
    user = request.auth
    location = await get_location_by_id(payload.location_id, payload.factory_id, user)
    await location.adelete()
    return 204, None
