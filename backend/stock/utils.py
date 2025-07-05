from ninja.errors import HttpError
from stock.models import Product


async def get_product_by_id(product_id: int):
    try:
        product = await Product.objects.aget(id=product_id)
        return product
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품이 존재하지 않습니다.")