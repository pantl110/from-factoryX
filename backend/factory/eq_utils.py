from factory.models import FactoryEquipment
from django.db.models import Prefetch, F
from project.models import ProjectPlan
from ninja.errors import HttpError
from asgiref.sync import sync_to_async


async def get_equipment_by_id(equipment_id, factory_id):
    @sync_to_async
    def _get_equipment():
        try:
            return (
                FactoryEquipment.objects.select_related("factory")
                .prefetch_related(
                    Prefetch(
                        "plans",
                        queryset=ProjectPlan.objects.select_related(
                            "product__product"
                        ).annotate(
                            product_name=F("product__product__name"),
                            product_unit=F("product__product__unit"),
                        ),
                    )
                )
                .get(id=equipment_id, factory_id=factory_id)
            )
        except FactoryEquipment.DoesNotExist:
            raise HttpError(404, "해당 설비가 존재하지 않습니다.")

    return await _get_equipment()
