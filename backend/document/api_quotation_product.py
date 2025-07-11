from ninja import Router
from ninja.pagination import paginate
from api.security import jwt_auth
from document.models import Quotation, QuotationProduct
from stock.models import Product
from document.schemas.inbound import QuotationSaveIn
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from factory.models import FactoryClient
from document.schemas.outbound import QuotationProductOut
from ninja import Query

router = Router(tags=["QuotationProduct"], auth=jwt_auth)


@router.post(
    "",
    summary="[C] 견적서 품목 업데이트",
    description="견적서 품목 중 존재하는 품목은 업데이트, 처음 생성되는 품목은 생성, 삭제된 품목은 삭제합니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict}
)
async def upsert_quotation_products(request, payload: QuotationSaveIn):
    # Quotation 조회
    try:
        quotation = await Quotation.objects.aget(id=payload.quotation_id)
    except Quotation.DoesNotExist:
        raise HttpError(404, "해당 견적서를 찾을 수 없습니다.")

    try:
        client = await FactoryClient.objects.aget(id=quotation.client_id)
    except FactoryClient.DoesNotExist:
        raise HttpError(404, "해당 거래처를 찾을 수 없습니다.")

    client_data = payload.client.dict()
    for field, value in client_data.items():
        setattr(client, field, value)
    await sync_to_async(client.save)()

    existing_qps = await sync_to_async(list)(
        QuotationProduct.objects.filter(quotation=quotation)
    )
    existing_qp_map = {qp.product_id: qp for qp in existing_qps}

    incoming_product_ids = {prod.id for prod in payload.products}

    for prod in payload.products:
        try:
            product = await Product.objects.aget(id=prod.id)
        except Product.DoesNotExist:
            raise HttpError(404, f"해당 품목(id={prod.id})을 찾을 수 없습니다.")

        if prod.id in existing_qp_map:
            qp = existing_qp_map[prod.id]
            qp.quantity = prod.quantity
            qp.unit_price = prod.unit_price
            qp.is_delivery = getattr(prod, 'is_delivery', False)
            qp.delivery_date = getattr(prod, 'delivery_date', None)
            await sync_to_async(qp.save)()
        else:
            await QuotationProduct.objects.acreate(
                quotation=quotation,
                product=product,
                quantity=prod.quantity,
                unit_price=prod.unit_price,
                is_delivery=getattr(prod, 'is_delivery', False),
                delivery_date=getattr(prod, 'delivery_date', None)
            )

    for product_id, qp in existing_qp_map.items():
        if product_id not in incoming_product_ids:
            await sync_to_async(qp.delete)()

    return 200, {"quotation_id": quotation.id}

@router.get("/", summary="[C] 견적서 품목 목록 조회", response={200: list, 400: dict, 404: dict, 500: dict})
async def list_quotation_products(request, quotation_id: int = Query(None), factory_id: int = Query(None)):
    if quotation_id is None and factory_id is None:
        raise HttpError(400, "quotation_id 또는 factory_id를 입력해야 합니다.")
    try:
        if quotation_id:
            qps = await sync_to_async(list)(QuotationProduct.objects.filter(quotation_id=quotation_id))
        elif factory_id:
            qps = await sync_to_async(list)(QuotationProduct.objects.filter(quotation__factory_id=factory_id))
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")
    if not qps:
        raise HttpError(404, "품목이 없습니다.")
    return 200, [
        {
            "id": qp.id,
            "quotation": qp.quotation_id,
            "product": qp.product_id,
            "quantity": qp.quantity,
            "unit_price": qp.unit_price,
            "is_delivery": qp.is_delivery,
            "delivery_date": qp.delivery_date
        } for qp in qps
    ]

@router.get("/{id}", summary="[C] 견적서 품목 상세 조회", response={200: QuotationProductOut, 404: dict, 500: dict})
async def get_quotation_product_detail(request, id: int):
    try:
        qp = await QuotationProduct.objects.aget(id=id)
    except QuotationProduct.DoesNotExist:
        raise HttpError(404, "해당 품목을 찾을 수 없습니다.")
    except Exception as e:
        raise HttpError(500, f"조회 중 오류: {str(e)}")
    return 200, {
        "id": qp.id,
        "quotation": qp.quotation_id,
        "product": qp.product_id,
        "quantity": qp.quantity,
        "unit_price": qp.unit_price,
        "is_delivery": qp.is_delivery,
        "delivery_date": qp.delivery_date
    }
    