from ninja import Router
from ninja.responses import Response
from api.security import jwt_auth
from document.utils import content_ocr
from document.schemas.inbound import OcrIn
from document.schemas.outbound import QuotationDetailOut
from document.models import Quotation, QuotationProduct
from typing import Dict, Any
import base64
from ninja.errors import HttpError
from factory.utils import is_factory_member

router = Router(tags=["Quotation"], auth=jwt_auth)


@router.post(
    "/ocr",
    summary="[C] 견적서 OCR 업로드",
    description="OCR 업로드",
    response={200: Dict[str, Any]},
    auth=jwt_auth,
)
async def upload_file(request, payload: OcrIn):
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)
    
    """
    Endpoint to upload a file and read it as binary data.

    Args:
        payload: The uploaded file

    Returns:
        Dict containing file information and upload status
    """
    try:
        # Read the file as binary data
        file_content = payload.data
        content = base64.b64decode(file_content)
        data = await content_ocr(content)
        print(data)
        # Here you would process the binary data as needed
        # For now, just returning basic file information
        return {"status": "success"}
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)


@router.get(
    "/{quotation_id}",
    summary="[C] 견적서 조회",
    description="견적서 ID로 견적서 상세 정보를 조회합니다.",
    response={200: QuotationDetailOut, 404: dict, 403: dict, 500: dict},
    auth=jwt_auth,
)
async def get_quotation_detail(request, quotation_id: int):
    # Only those related to the factory can view
    factory_id = request.GET.get('factory_id')
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")
    
    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        quotation = await Quotation.objects.filter(id=quotation_id).select_related("client", "factory").afirst()
        if not quotation:
            raise HttpError(404, "견적서를 찾을 수 없습니다.")
        
        if quotation.factory_id != int(factory_id):
            raise HttpError(403, "해당 공장의 견적서가 아닙니다.")

        client = quotation.client
        factory_info = {
            "factory_name": client.name if client and client.name else "",
            "business_registration_number": getattr(client, "business_registration_number", None),
            "representative_name": getattr(client, "representative_name", None),
            "email": getattr(client, "email", None),
            "phone": getattr(client, "phone", None),
            "fax": getattr(client, "fax", None),
            "business_type": getattr(client, "business_type", None),
            "business_category": getattr(client, "business_category", None),
            "address": getattr(client, "address", None),
        }

        products = []
        async for qp in QuotationProduct.objects.select_related("product").filter(quotation=quotation):
            product = qp.product
            supply_amount = (qp.quantity or 0) * (qp.unit_price or 0)
            tax_amount = int(supply_amount * 0.1)
            products.append({
                "productId": product.id,
                "product_code": product.code,
                "product_name": product.name,
                "spec": product.spec,
                "unit": product.unit,
                "quantity": qp.quantity,
                "unit_price": qp.unit_price,
                "supply_amount": supply_amount,
                "tax_amount": tax_amount,
            })

        response_data = {**factory_info, "products": products}
        if quotation.due_date:
            response_data["due_date"] = quotation.due_date.isoformat()
        else:
            response_data["due_date"] = ""
            
        return response_data

    except HttpError as e:
        return Response({"status": "error", "message": str(e)}, status=e.status_code)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)
