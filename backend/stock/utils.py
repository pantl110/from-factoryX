from ninja.errors import HttpError
from stock.models import Product, ProductHistory


async def get_product_by_id(product_id: int):
    try:
        product = await Product.objects.aget(id=product_id)
        return product
    except Product.DoesNotExist:
        raise HttpError(404, "해당 제품이 존재하지 않습니다.")
    

async def get_history_by_id(history_id: int):
    try:
        return await ProductHistory.objects.select_related("product__factory").aget(id=history_id)
    except ProductHistory.DoesNotExist:
        raise HttpError(404, "해당 입출고 이력이 존재하지 않습니다.")