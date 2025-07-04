from ninja.errors import HttpError
from factory.models import Factory, FactoryEquipment


async def get_factory_by_id(factory_id: int, user=None):
    try:
        factory = await Factory.objects.aget(id=factory_id, owner=user)
        return factory
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")


async def get_factory_eq_by_id(equipment_id: int, user=None):
    try:
        # Get equipment and ensure it belongs to a factory owned by the user
        equipment = await FactoryEquipment.objects.select_related("factory").aget(id=equipment_id, factory__owner=user)
        return equipment
    except FactoryEquipment.DoesNotExist:
        raise HttpError(404, "해당 설비가 존재하지 않습니다.")