from ninja import Router
from ninja.errors import HttpError
from ninja.responses import Response
from api.security import jwt_auth
from document.utils import content_ocr_document_parse, render_pdf_first_page_to_image
from document.schemas.inbound import OcrIn, QuotationEmailSendIn
from document.schemas.outbound import QuotationDetailOut, OCRResultOut
from document.models import Quotation, QuotationProduct
from stock.models import Product
from typing import Dict, Any
import base64
import unicodedata
from ninja.errors import HttpError
from factory.utils import is_factory_member, get_factory_by_id
from factory.utils import send_email_with_attachments
from asgiref.sync import sync_to_async


router = Router(tags=["Quotation"], auth=jwt_auth)


def _normalize_product_match(value: str | None) -> str:
    """화면과 동일하게 앞뒤 공백과 전각 문자를 정규화한다."""
    return unicodedata.normalize("NFKC", value or "").strip()


async def _attach_products_to_ocr_items(data: Dict[str, Any], factory_id: int) -> None:
    """OCR 품목을 제품 마스터에 보수적으로 연결한다.

    제품코드는 정확히 일치할 때, 제품명은 공장 안에서 같은 이름이 하나뿐일 때만
    연결한다. 연결된 행은 제품 ID와 기준 정보를 반환해 화면 재렌더링 뒤에도
    선택 상태가 유지되게 한다.
    """
    products = await sync_to_async(list)(
        Product.objects.filter(factory_id=factory_id).values(
            "id", "code", "name", "spec", "unit"
        )
    )
    by_code = {
        _normalize_product_match(product["code"]): product
        for product in products
        if _normalize_product_match(product["code"])
    }
    by_name: Dict[str, list[Dict[str, Any]]] = {}
    for product in products:
        normalized_name = _normalize_product_match(product["name"])
        if normalized_name:
            by_name.setdefault(normalized_name, []).append(product)

    for item in data.get("request_items", []):
        product = None
        normalized_code = _normalize_product_match(item.get("item_code"))
        if normalized_code:
            product = by_code.get(normalized_code)
        if product is None:
            name_matches = by_name.get(
                _normalize_product_match(item.get("item_name")), []
            )
            if len(name_matches) == 1:
                product = name_matches[0]
        if product is not None:
            item.update(
                {
                    "product_id": product["id"],
                    "item_code": product["code"],
                    "item_name": product["name"],
                    "spec": product["spec"],
                    "unit": product["unit"],
                }
            )


@router.post(
    "/ocr",
    summary="[C] 견적서 OCR 업로드",
    description="OCR 업로드",
    response=OCRResultOut,
    auth=jwt_auth,
)
async def upload_file(request, payload: OcrIn):
    factory_id = request.GET.get("factory_id")
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

        # OCR 결과 (client_info / request_items)
        data = await content_ocr_document_parse(
            content, document_type=payload.document_type
        )
        await _attach_products_to_ocr_items(data, int(factory_id))

        # PDF인 경우에는 항상 썸네일 생성 시도
        try:
            if content.startswith(b"%PDF"):
                thumbnail_bytes = render_pdf_first_page_to_image(content)
                thumbnail_b64 = base64.b64encode(thumbnail_bytes).decode("ascii")
                data["thumbnail_image"] = thumbnail_b64
            else:
                # 이미지 등 비-PDF는 썸네일 생성하지 않음
                data["thumbnail_image"] = None
        except Exception:
            # 썸네일 생성 실패 시 OCR 데이터만 반환
            data["thumbnail_image"] = None

        return data
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"OCR 중 오류 발생: {str(e)}")


@router.post(
    "/send-email",
    summary="견적서 첨부파일 이메일 전송",
    description="견적서 첨부파일을 이메일로 전송합니다.",
    response={200: dict, 404: dict, 403: dict, 500: dict},
    auth=jwt_auth,
)
async def send_quotation_email(request, payload: QuotationEmailSendIn):
    factory_id = payload.factory_id
    user = request.auth
    await is_factory_member(int(factory_id), user)  # 멤버(소유자·관리자·조회자)만 전송 가능
    factory = await get_factory_by_id(int(factory_id), None)  # 멤버 검증 후 공장 조회(소유자만이 아님)

    try:
        # PDF 파일 처리
        pdf_content = None

        if payload.pdf_data:
            # 옵션 1: Base64로 인코딩된 PDF 데이터 사용
            try:
                # Base64 패딩 문제 해결
                pdf_data = payload.pdf_data
                # Base64 문자열에서 공백 제거
                pdf_data = pdf_data.replace(" ", "").replace("\n", "").replace("\r", "")

                # 패딩 추가 (필요한 경우)
                missing_padding = len(pdf_data) % 4
                if missing_padding:
                    pdf_data += "=" * (4 - missing_padding)

                pdf_content = base64.b64decode(pdf_data)

                # PDF 파일 유효성 검증 (PDF 헤더 확인)
                if not pdf_content.startswith(b"%PDF-"):
                    raise ValueError("유효한 PDF 파일이 아닙니다.")

            except Exception as e:
                raise HttpError(400, f"PDF 데이터 디코딩 실패: {str(e)}")

        # HTML 이메일 템플릿 생성
        factory_name = factory.name if factory.name else "Factory X"
        client_name = payload.client_name if payload.client_name else "고객님"
        doc_label = "주문서" if getattr(payload, "is_confirmed", False) else "견적서"
        filename = "order.pdf" if doc_label == "주문서" else "quotation.pdf"

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{doc_label} 전송</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">[{factory_name}] {doc_label}가 도착했습니다</h2>
                <p>안녕하세요, {client_name}!</p>
                <p>요청하신 {doc_label}를 첨부파일로 보내드립니다.</p>
                <p>첨부된 {doc_label}를 검토해 주시고, 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>{doc_label} 정보:</strong><br>
                    <ul style="margin: 10px 0;">
                        <li>공장명: {factory_name}</li>
                    </ul>
                </div>
                
                <p>감사합니다.</p>
                <br>
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    {factory_name}<br>
                    이 이메일은 자동으로 발송된 메일입니다.
                </p>
            </div>
        </body>
        </html>
        """

        success = await sync_to_async(send_email_with_attachments)(
            to_emails=[payload.email],
            subject=f"[{factory_name}] {doc_label}가 도착했습니다",
            html_message=html_message,
            text_message="",  # 빈 문자열로 설정하여 HTML만 표시
            attachments=[
                {
                    "filename": filename,
                    "content": pdf_content,
                    "mimetype": "application/pdf",
                }
            ],
        )

        if not success:
            raise HttpError(500, "이메일 전송에 실패했습니다.")

        return {"status": "success", "message": "이메일이 전송되었습니다."}

    except HttpError as e:
        return Response({"status": "error", "message": str(e)}, status=e.status_code)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@router.get(
    "/{quotation_id}",
    summary="[C] 견적서 조회",
    description="견적서 ID로 견적서 상세 정보를 조회합니다.",
    response={200: QuotationDetailOut, 404: dict, 403: dict, 500: dict},
    auth=jwt_auth,
)
async def get_quotation_detail(request, quotation_id: int):
    # Only those related to the factory can view
    factory_id = request.GET.get("factory_id")
    if not factory_id:
        raise HttpError(400, "factory_id를 입력해야 합니다.")

    user = request.auth
    await is_factory_member(int(factory_id), user)

    try:
        quotation = (
            await Quotation.objects.filter(id=quotation_id)
            .select_related("client", "factory")
            .afirst()
        )
        if not quotation:
            raise HttpError(404, "견적서를 찾을 수 없습니다.")

        if quotation.factory_id != int(factory_id):
            raise HttpError(403, "해당 공장의 견적서가 아닙니다.")

        client = quotation.client
        factory_info = {
            "factory_name": client.name if client and client.name else "",
            "client_id": (client.id if client else None),
            "business_registration_number": getattr(
                client, "business_registration_number", None
            ),
            "representative_name": getattr(client, "representative_name", None),
            "manager_name": getattr(client, "manager", None),
            "email": getattr(client, "email", None),
            "phone": getattr(client, "phone", None),
            "fax": getattr(client, "fax", None),
            "business_type": getattr(client, "business_type", None),
            "business_category": getattr(client, "business_category", None),
            "address": getattr(client, "address", None),
        }

        products = []
        async for qp in QuotationProduct.objects.select_related("product").filter(
            quotation=quotation
        ):
            product = qp.product
            supply_amount = (qp.quantity or 0) * (qp.unit_price or 0)
            tax_amount = int(supply_amount * 0.1)
            products.append(
                {
                    "productId": product.id,
                    "product_code": product.code,
                    "product_name": product.name,
                    "spec": product.spec,
                    "unit": product.unit,
                    "quantity": qp.quantity,
                    "unit_price": qp.unit_price,
                    "supply_amount": supply_amount,
                    "tax_amount": tax_amount,
                }
            )

        response_data = {**factory_info, "products": products}
        if quotation.due_date:
            response_data["due_date"] = quotation.due_date.isoformat()
        else:
            response_data["due_date"] = ""

        # 업로드 파일 경로/식별자 추가
        response_data["uploaded_file"] = quotation.uploaded_file

        return response_data

    except HttpError as e:
        return Response({"status": "error", "message": str(e)}, status=e.status_code)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


# 견적서 첨부파일 이메일 전송
# @router.post(
#     "/{quotation_id}/send-email",
#     summary="견적서 첨부파일 이메일 전송",
#     description="견적서 첨부파일을 이메일로 전송합니다.",
#     response={200: dict, 404: dict, 403: dict, 500: dict},
#     auth=jwt_auth,
# )
# async def send_quotation_email(
#     request, quotation_id: int, payload: QuotationEmailSendIn
# ):
#     # Only those related to the factory can send email
#     factory_id = request.GET.get("factory_id")
#     if not factory_id:
#         raise HttpError(400, "factory_id를 입력해야 합니다.")

#     user = request.auth
#     await is_factory_member(int(factory_id), user)

#     try:
#         quotation = (
#             await Quotation.objects.filter(id=quotation_id)
#             .select_related("client", "factory")
#             .afirst()
#         )
#         if not quotation:
#             raise HttpError(404, "견적서를 찾을 수 없습니다.")

#         if quotation.factory_id != int(factory_id):
#             raise HttpError(403, "해당 공장의 견적서가 아닙니다.")

#         # PDF 파일 처리
#         pdf_content = None
#         filename = "quotation.pdf"

#         if payload.pdf_data:
#             # 옵션 1: Base64로 인코딩된 PDF 데이터 사용
#             import base64

#             try:
#                 # Base64 패딩 문제 해결
#                 pdf_data = payload.pdf_data
#                 # Base64 문자열에서 공백 제거
#                 pdf_data = pdf_data.replace(" ", "").replace("\n", "").replace("\r", "")

#                 # 패딩 추가 (필요한 경우)
#                 missing_padding = len(pdf_data) % 4
#                 if missing_padding:
#                     pdf_data += "=" * (4 - missing_padding)

#                 pdf_content = base64.b64decode(pdf_data)

#                 # PDF 파일 유효성 검증 (PDF 헤더 확인)
#                 if not pdf_content.startswith(b"%PDF-"):
#                     raise ValueError("유효한 PDF 파일이 아닙니다.")

#             except Exception as e:
#                 raise HttpError(400, f"PDF 데이터 디코딩 실패: {str(e)}")
#         else:
#             # 옵션 2: 기존 업로드된 파일 사용
#             if quotation.uploaded_file:
#                 import os
#                 from django.conf import settings

#                 file_path = os.path.join(settings.MEDIA_ROOT, quotation.uploaded_file)
#                 if os.path.exists(file_path):
#                     with open(file_path, "rb") as f:
#                         pdf_content = f.read()
#                     filename = os.path.basename(quotation.uploaded_file)
#                 else:
#                     raise HttpError(404, "업로드된 파일을 찾을 수 없습니다.")
#             else:
#                 raise HttpError(400, "PDF 데이터 또는 업로드된 파일이 필요합니다.")

#         # HTML 이메일 템플릿 생성
#         factory_name = quotation.factory.name if quotation.factory else "Factory X"
#         client_name = quotation.client.name if quotation.client else "고객님"

#         html_message = f"""
#         <!DOCTYPE html>
#         <html>
#         <head>
#             <meta charset="UTF-8">
#             <title>견적서 전송</title>
#         </head>
#         <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
#             <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
#                 <h2 style="color: #2c3e50;">[{factory_name}] 견적 요청서가 도착했습니다</h2>
#                 <p>안녕하세요, {client_name}!</p>
#                 <p>요청하신 견적 요청서를 첨부파일로 보내드립니다.</p>
#                 <p>첨부된 견적 요청서를 검토해 주시고, 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>

#                 <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
#                     <strong>견적 요청서 정보:</strong><br>
#                     <ul style="margin: 10px 0;">
#                         <li>공장명: {factory_name}</li>
#                         <li>견적서 ID: {quotation.id}</li>
#                         {f'<li>납기일: {quotation.due_date.strftime("%Y년 %m월 %d일")}</li>' if quotation.due_date else ''}
#                     </ul>
#                 </div>

#                 <p>감사합니다.</p>
#                 <br>
#                 <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
#                 <p style="color: #6c757d; font-size: 12px;">
#                     {factory_name}<br>
#                     이 이메일은 자동으로 발송된 메일입니다.
#                 </p>
#             </div>
#         </body>
#         </html>
#         """

#         success = await sync_to_async(send_email_with_attachments)(
#             to_emails=[payload.email],
#             subject=f"[{factory_name}] 견적 요청서가 도착했습니다",
#             html_message=html_message,
#             text_message="",  # 빈 문자열로 설정하여 HTML만 표시
#             attachments=[
#                 {
#                     "filename": filename,
#                     "content": pdf_content,
#                     "mimetype": "application/pdf",
#                 }
#             ],
#         )

#         if not success:
#             raise HttpError(500, "이메일 전송에 실패했습니다.")

#         return {"status": "success", "message": "이메일이 전송되었습니다."}

#     except HttpError as e:
#         return Response({"status": "error", "message": str(e)}, status=e.status_code)
#     except Exception as e:
#         return Response({"status": "error", "message": str(e)}, status=500)
