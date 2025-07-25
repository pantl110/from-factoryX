from tax.models import NationalTaxService
from ninja.errors import HttpError


async def get_tax_service_by_id(tax_service_id: int):
    try:
        tax_service = (
            await NationalTaxService.objects.select_related("client", "factory", "user")
            .prefetch_related("product")
            .aget(id=tax_service_id)
        )
        return tax_service
    except NationalTaxService.DoesNotExist:
        raise HttpError(404, "세금계산서가 존재하지 않습니다.")
