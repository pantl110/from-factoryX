from ninja.errors import HttpError
from substitute.models import Substitute


async def get_substitute_by_id(factory_id, substitute_id: int):
    try:
        substitute = (
            await Substitute.objects.select_related("factory", "source_material")
            .prefetch_related("target_materials")
            .aget(id=substitute_id, factory_id=factory_id)
        )
    except Substitute.DoesNotExist:
        raise HttpError(404, "해당 대체 자재 관계를 찾을 수 없습니다.")

    return substitute
