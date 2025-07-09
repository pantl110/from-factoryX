from ninja import Router, File
from ninja.files import UploadedFile
from api.security import jwt_auth
from document.schemas.inbound import QuotationCreateIn, QuotationSendEmailIn, TaxInvoiceCreateIn
from document.schemas.outbound import QuotationOut
from document.utils import get_quotation_by_id
from factory.models import Factory
from factory.models import FactoryClient
from project.models import Project
from document.models import Quotation
from asgiref.sync import sync_to_async

router = Router(tags=["Quotation"])


@router.post(
    "/quotations/",
    summary="[C] 견적서 생성",
    description="공장, 고객, 프로젝트 정보를 바탕으로 새로운 견적서를 생성합니다.",
    response={201: QuotationOut},
    auth=jwt_auth
)
async def create_quotation(request, payload: QuotationCreateIn):
    user = request.auth
    factory = await Factory.objects.aget(id=payload.factory, owner=user)
    client = await FactoryClient.objects.aget(id=payload.client, factory=factory)
    project = await Project.objects.aget(id=payload.project, factory=factory)
    quotation = await Quotation.objects.acreate(
        factory=factory, client=client, project=project, due_date=payload.due_date
    )
    return 201, quotation


@router.patch(
    "/quotations/{id}/upload-file/",
    summary="[C] 견적서 파일 업로드",
    description="견적서에 첨부할 파일을 업로드하고, 파일 URL을 저장합니다.",
    response={200: dict},
    auth=jwt_auth
)
async def upload_quotation_file(request, id: int, file: UploadedFile = File(...)):
    user = request.auth
    quotation = await get_quotation_by_id(id, user)
    # 파일 저장 로직 (예: S3 업로드 후 URL 저장)
    file_url = f"/media/quotations/{file.name}"  # 실제 구현에서는 파일 저장 필요
    quotation.uploaded_file = file_url
    await quotation.asave()
    return {"message": "파일 업로드 성공", "file_url": file_url}


@router.post(
    "/quotations/{id}/run-ocr/",
    summary="[C] 견적서 OCR 처리 요청",
    description="업로드된 견적서 파일에 대해 OCR 처리를 비동기로 요청합니다. 파일이 없으면 400 에러를 반환합니다.",
    response={202: dict},
    auth=jwt_auth
)
async def run_quotation_ocr(request, id: int):
    user = request.auth
    quotation = await get_quotation_by_id(id, user)
    if not quotation.uploaded_file:
        from ninja.errors import HttpError
        raise HttpError(400, "업로드된 파일이 없습니다.")
    # OCR 비동기 작업 큐 등록 (예: Celery)
    # run_ocr_task.delay(quotation.id)
    return 202, {"message": "OCR 처리를 시작했습니다."}


@router.post(
    "/quotations/{id}/send-email/",
    summary="[C] 견적서 이메일 전송",
    description="견적서를 지정한 이메일로 비동기 전송합니다.",
    response={202: dict},
    auth=jwt_auth
)
async def send_quotation_email(request, id: int, payload: QuotationSendEmailIn):
    user = request.auth
    quotation = await get_quotation_by_id(id, user)
    # 이메일 비동기 발송
    # send_email_task.delay(quotation.id, payload.recipient_email, payload.subject, payload.body)
    return 202, {"message": "이메일 전송을 시작했습니다."}


@router.post(
    "/quotations/{id}/generate-tax-invoice/",
    summary="[C] 세금계산서 생성 요청",
    description="견적서 정보를 바탕으로 세금계산서 생성을 비동기로 요청합니다.",
    response={202: dict},
    auth=jwt_auth
)
async def generate_tax_invoice(request, id: int, payload: TaxInvoiceCreateIn):
    user = request.auth
    quotation = await get_quotation_by_id(id, user)
    # 비동기 세금계산서 생성
    # generate_tax_invoice_task.delay(quotation.id, **payload.dict())
    return 202, {"message": "세금계산서 생성 요청이 접수되었습니다."} 