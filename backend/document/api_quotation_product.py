from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from document.schemas.outbound import QuotationProductOut
from document.models import Quotation, QuotationProduct
from stock.models import Product
from document.schemas.inbound import QuotationProductCreateIn

router = Router(tags=["QuotationProduct"], auth=jwt_auth)

@router.post(
    "/quotation/product/create",
    summary="[C] 견적서 품목 등록",
    description="견적서에 포함될 제품 품목을 등록합니다.",
    response={201: QuotationProductOut}
)
async def create_quotation_product(request, payload: QuotationProductCreateIn):
    # 견적서 품목 등록을 위해 견적서 id와 제품 id 받아서 견적서 품목 생성
    quotation = await Quotation.objects.aget(id=payload.quotation_id)
    product = await Product.objects.aget(id=payload.product_id)
    # 견적서, 제품 연결(수량, 단가, 금액, 납기 일자)
    new_product = await QuotationProduct.objects.acreate(
        quotation=quotation,
        product=product,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        delivery_date=payload.delivery_date
    )
    return 201, new_product
    