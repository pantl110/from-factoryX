from ninja.errors import HttpError
from factory.models import Factory


async def get_factory_by_id(factory_id: int, user=None):
    try:
        factory = await Factory.objects.aget(id=factory_id, owner=user)
        return factory
    except Factory.DoesNotExist:
        raise HttpError(404, "해당 공장이 존재하지 않습니다.")
