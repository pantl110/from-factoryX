from ninja import Router
from api.security import jwt_auth
from location.schemas.inbound import LocationCreateIn, LocationUpdateIn
from location.schemas.outbound import LocationListOut, ErrorOut
from location.models import Location
from stock.models import Material, Product

router = Router(tags=["Location"], auth=jwt_auth)

@router.post(
    "/location/create", 
    summary="[C] 창고 위치 생성", 
    description="material id/product id에 창고 위치를 생성합니다.",
    response={ 200: LocationListOut, 400: ErrorOut, 404: ErrorOut, 500: ErrorOut }
    )
async def create_location(request,payload: LocationCreateIn):

    model_map = {
        "material": Material,
        "product": Product
    }
    
    if payload.type not in model_map:
        return 400, ErrorOut(detail="")

    location, created = await Location.objects.aget_or_create(
        type=payload.type,
        location=payload.location,
        defaults={'images': payload.images or []}
    )
    
    try:
        target_model = model_map[payload.type]
        
        item = await target_model.objects.aget(id=payload.id)
        
        item.location = location
        await item.asave()
        
        # location 객체의 값을 완전히 분리해서 추출
        loc = await Location.objects.aget(id=item.location_id)
        location_name = loc.location
        location_images = loc.images or []
        
        return 200, LocationListOut.model_validate({
            "id": item.id,
            "type": payload.type,
            "location": location_name,
            "images": location_images
        })

    except target_model.DoesNotExist:
        return 404, ErrorOut(detail="")

    except Exception as e:
        return 500, ErrorOut(detail="")


@router.get(
    "/location/list", 
    summary="[C] 창고 위치 목록 조회",
    description="material id/product id로 창고 위치를 조회합니다.",
    response={ 200: LocationListOut, 400: ErrorOut, 404: ErrorOut, 500: ErrorOut }
    )
async def list_locations(request, type: str, id: int):
    model_map = {
        "material": Material,
        "product": Product
    }

    if type not in model_map:
        return 400, ErrorOut(detail="")

    target_model = model_map[type]

    try:
        item = await target_model.objects.aget(id=id)

        if not item.location_id:
            return 404, ErrorOut(detail="")

        loc = await Location.objects.aget(id=item.location_id)
        location_name = loc.location
        location_images = loc.images or []

        return 200, LocationListOut.model_validate({
            "id": item.id,
            "type": type,
            "location": location_name,
            "images": location_images
        })

    except target_model.DoesNotExist:
        return 404, ErrorOut(detail="")

    except Exception as e:
        return 500, ErrorOut(detail="")


@router.patch(
    "/location/update", 
    summary="[C] 창고 위치 수정", 
    description="material id/product id의 기존 위치를 새로운 위치로 수정합니다.",
    response={ 200: LocationListOut, 400: ErrorOut, 404: ErrorOut, 500: ErrorOut }
    )
async def update_location(request, payload: LocationUpdateIn):

    model_map = {
        "material": Material,
        "product": Product
    }
    
    if payload.type not in model_map:
        return 400, ErrorOut(detail="")

    try:
        target_model = model_map[payload.type]
        
        item = await target_model.objects.aget(id=payload.id)
        
        if not item.location_id:
            return 404, ErrorOut(detail="")
        
        new_location, created = await Location.objects.aget_or_create(
            type=payload.type,
            location=payload.location,
            defaults={'images': payload.images or []}
        )
        
        item.location = new_location
        await item.asave()
        
        loc = await Location.objects.aget(id=item.location_id)
        location_name = loc.location
        location_images = loc.images or []
        
        return 200, LocationListOut.model_validate({
            "id": item.id,
            "type": payload.type,
            "location": location_name,
            "images": location_images
        })

    except target_model.DoesNotExist:
        return 404, ErrorOut(detail="")

    except Exception as e:
        return 500, ErrorOut(detail="")


@router.delete(
    "/location/delete", 
    summary="[C] 창고 위치 삭제", 
    description="material id/product id의 위치 연결을 해제합니다.",
    response={ 200: dict, 400: ErrorOut, 404: ErrorOut, 500: ErrorOut }
    )
async def delete_location(request, type: str, id: int):

    model_map = {
        "material": Material,
        "product": Product
    }
    
    if type not in model_map:
        return 400, ErrorOut(detail="")

    try:
        target_model = model_map[type]
        
        item = await target_model.objects.aget(id=id)
        
        if not item.location_id:
            return 404, ErrorOut(detail="")
        
        # 위치 연결 해제
        item.location = None
        await item.asave()
        
        return 200, {"detail": ""}

    except target_model.DoesNotExist:
        return 404, ErrorOut(detail="")

    except Exception as e:
        return 500, ErrorOut(detail="")