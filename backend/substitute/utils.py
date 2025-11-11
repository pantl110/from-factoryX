from ninja.errors import HttpError
from substitute.models import Substitute


async def get_substitute_by_id(factory_id, substitute_id: int):
    try:
        substitute = (
            await Substitute.objects.select_related("factory")
            .prefetch_related("materials")
            .aget(id=substitute_id, factory_id=factory_id)
        )
    except Substitute.DoesNotExist:
        raise HttpError(404, "해당 대체 자재 그룹을 찾을 수 없습니다.")

    return substitute
