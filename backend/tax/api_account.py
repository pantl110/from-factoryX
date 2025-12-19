from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from typing import Literal
from datetime import date
from django.conf import settings
from django.core.mail import send_mail
from api.security import jwt_auth
from tax.models import TaxInvoiceAccount, AccountStatus
from tax.schemas.outbound import TaxInvoiceAccountOut
from tax.schemas.inbound import TaxInvoiceAccountUpdateIn, SendEmailIn

router = Router(tags=["Tax Account"], auth=jwt_auth)


@router.post(
    "/send-email/{id}",
    summary="[C] 이메일 발송",
    description="매출 세금계산서 채권/채무 정보와 관련하여 이메일을 발송하고 청구서 발송 횟수를 증가시킵니다.",
    response={200: dict, 400: dict, 404: dict, 500: dict},
)
async def send_email_for_account(
    request,
    id: int,
    payload: SendEmailIn,
):
    @sync_to_async
    def send_email():
        # 매출 세금계산서의 TaxInvoiceAccount 조회
        try:
            account = TaxInvoiceAccount.objects.get(tax_invoice_id=id)
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
        
        # 이메일 발송
        try:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@factory-x.com")
            
            send_mail(
                payload.subject,
                payload.content,
                from_email,
                [payload.recipient],
                fail_silently=False,
            )
            
            # 청구서 발송 횟수 증가
            account.invoice_sent_count += 1
            account.save()
            
            return {
                "message": "이메일이 성공적으로 발송되었습니다.",
                "recipient": payload.recipient,
                "invoice_sent_count": account.invoice_sent_count
            }
        except Exception as e:
            raise HttpError(500, f"이메일 발송 중 오류가 발생했습니다: {str(e)}")
    
    result = await send_email()
    return result


@router.patch(
    "/{id}",
    summary="[U] 채권/채무 정보 수정",
    description="세금계산서 또는 현금영수증 ID로 채권/채무 정보를 수정합니다.",
    response={200: TaxInvoiceAccountOut, 404: dict, 400: dict, 500: dict},
)
async def update_tax_invoice_account(
    request, 
    id: int, 
    payload: TaxInvoiceAccountUpdateIn,
    type: Literal["tax", "cash-receipt"] = Query(..., description="타입: tax(세금계산서) 또는 cash-receipt(현금영수증)")
):
    @sync_to_async
    def update_account():
        try:
            if type == "tax":
                account = TaxInvoiceAccount.objects.select_related(
                    "tax_invoice", "tax_invoice__client"
                ).get(tax_invoice_id=id)
                error_msg = "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다."
            else:  # cash-receipt
                account = TaxInvoiceAccount.objects.select_related(
                    "cash_receipt", "cash_receipt__client"
                ).get(cash_receipt_id=id)
                error_msg = "해당 현금영수증의 채권/채무 정보를 찾을 수 없습니다."
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, error_msg)
        
        # 필드 업데이트
        update_data = payload.dict(exclude_unset=True)
        
        # 나머지 필드 업데이트
        for field, value in update_data.items():
            if hasattr(account, field):
                setattr(account, field, value)
        
        # 약정입금일이 오늘보다 과거이고 미수금액이 0보다 크면 상태를 overdue로 변경
        today = date.today()
        if (
            account.agreed_payment_date 
            and account.agreed_payment_date < today 
            and account.outstanding_balance > 0
        ):
            account.status = AccountStatus.overdue
        
        account.save()
        return account
    
    account = await update_account()
    return account


@router.get(
    "/{id}",
    summary="[C] 채권/채무 정보 조회",
    description="세금계산서 또는 현금영수증 ID로 채권/채무 정보를 조회합니다.",
    response={200: TaxInvoiceAccountOut, 404: dict, 500: dict},
)
async def get_tax_invoice_account(
    request, 
    id: int,
    type: Literal["tax", "cash-receipt"] = Query(..., description="타입: tax(세금계산서) 또는 cash-receipt(현금영수증)")
):
    @sync_to_async
    def get_account():
        try:
            if type == "tax":
                from project.models import Project
                
                account = TaxInvoiceAccount.objects.select_related(
                    "tax_invoice", "tax_invoice__client"
                ).get(tax_invoice_id=id)
                
                # 하나의 세금계산서에는 하나의 프로젝트만 연결된다는 전제 하에
                # tax_invoice 인스턴스에 project_id 속성을 미리 세팅해 둔다.
                project = Project.objects.filter(tax_invoice=account.tax_invoice).first()
                if project:
                    setattr(account.tax_invoice, "project_id", project.id)
                else:
                    setattr(account.tax_invoice, "project_id", None)
                
                return account
            else:  # cash-receipt
                account = TaxInvoiceAccount.objects.select_related(
                    "cash_receipt", "cash_receipt__client"
                ).get(cash_receipt_id=id)
                return account
        except TaxInvoiceAccount.DoesNotExist:
            if type == "tax":
                raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
            else:
                raise HttpError(404, "해당 현금영수증의 채권/채무 정보를 찾을 수 없습니다.")
    
    account = await get_account()
    return account
