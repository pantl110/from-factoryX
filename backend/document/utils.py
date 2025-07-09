from ninja.errors import HttpError
from document.models import Quotation, QuotationProduct
from factory.models import Factory
from factory.models import FactoryClient
from project.models import Project
from stock.models import Product

async def get_quotation_by_id(quotation_id: int, user):
    try:
        quotation = await Quotation.objects.aget(id=quotation_id, factory__owner=user)
        return quotation
    except Quotation.DoesNotExist:
        raise HttpError(404, "해당 견적서가 존재하지 않거나 접근 권한이 없습니다.")

async def get_quotation_product_by_id(qp_id: int, user):
    try:
        qp = await QuotationProduct.objects.aget(id=qp_id, quotation__factory__owner=user)
        return qp
    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 견적서 품목이 존재하지 않거나 접근 권한이 없습니다.") 