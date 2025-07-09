from ninja.errors import HttpError
from location.models import Location
from stock.models import Material
from factory.utils import get_factory_by_id

async def get_location_by_id(location_id: int, factory_id: int, user=None):
    try:
        # material에서 factory 소유권 검증
        material = await Material.objects.aget(location_id=location_id, factory__id=factory_id, factory__owner=user)
        location = await Location.objects.aget(id=location_id)
        return location
    except (Material.DoesNotExist, Location.DoesNotExist):
        raise HttpError(404, "해당 위치가 존재하지 않거나 접근 권한이 없습니다.") 