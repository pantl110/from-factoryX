from ninja.errors import HttpError
from unit_conversion.models import UnitConversion


async def get_unit_conversion_by_id(unit_conversion_id: int, factory_id: int):
    try:
        unit_conversion = await UnitConversion.objects.aget(
            id=unit_conversion_id, factory_id=factory_id
        )
        return unit_conversion
    except UnitConversion.DoesNotExist:
        raise HttpError(404, "해당 단위변환 정보가 존재하지 않습니다.")