from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List
from datetime import date
from django.db.models import F
from django.db import transaction
from api.security import jwt_auth
from api.pagination import CustomPageNumberPagination
from tax.models import TaxInvoiceAccount, PaymentDetail, AccountStatus
from tax.schemas.outbound import PaymentDetailOut
from tax.schemas.inbound import PaymentDetailCreateIn

router = Router(tags=["Tax Account Payment"], auth=jwt_auth)


@router.post(
    "/{tax_id}",
    summary="[C] 세금계산서 회수/지급 상세내역 생성",
    description="세금계산서 ID로 회수/지급 상세내역을 생성합니다.",
    response={201: PaymentDetailOut, 404: dict, 400: dict, 500: dict},
)
async def create_payment_detail(request, tax_id: int, payload: PaymentDetailCreateIn):
    @sync_to_async
    def create_payment():
        try:
            account = TaxInvoiceAccount.objects.get(tax_invoice_id=tax_id)
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
        
        # 미수금액이 0보다 작아지게 만드는 금액인지 체크
        if account.outstanding_balance < payload.amount_received:
            raise HttpError(
                400, 
                f"지급금액({payload.amount_received:,}원)이 미수금액({account.outstanding_balance:,}원)보다 큽니다."
            )
        
        # 트랜잭션으로 묶어서 PaymentDetail 생성 실패 시 차감/상태 업데이트가 실행되지 않도록 함
        with transaction.atomic():
            # 지급 후 미지급액 자동 계산 (지급 전 미지급액 - 지급 금액)
            outstanding_amount_after_payment = account.outstanding_balance - payload.amount_received
            
            # PaymentDetail 생성
            payment = PaymentDetail.objects.create(
                tax_invoice_account=account,
                payment_date=payload.payment_date,
                amount_received=payload.amount_received,
                outstanding_amount_at_payment=outstanding_amount_after_payment,
                expected_payment_date=payload.expected_payment_date,
            )
            
            # outstanding_balance에서 지급금액만큼 차감
            account.outstanding_balance -= payload.amount_received
            
            # 상태 업데이트 로직
            today = date.today()
            
            # 1. agreed_payment_date가 오늘보다 과거이고 outstanding_balance > 0이면 무조건 overdue
            if (
                account.agreed_payment_date 
                and account.agreed_payment_date < today 
                and account.outstanding_balance > 0
            ):
                account.status = AccountStatus.overdue
            # 2. outstanding_balance가 0이면 completed
            elif account.outstanding_balance == 0:
                account.status = AccountStatus.completed
            # 3. outstanding_balance > 0이고 total_billed_amount보다 작으면 partial
            elif (
                account.outstanding_balance > 0 
                and account.outstanding_balance < account.total_billed_amount
            ):
                account.status = AccountStatus.partial
            
            account.save()
            return payment
    
    payment = await create_payment()
    return 201, payment


@router.get(
    "/{tax_id}",
    summary="[C] 세금계산서 회수/지급 상세내역 조회",
    description="세금계산서 ID로 회수/지급 상세내역을 조회합니다. 입금예정일 기준 최신순으로 정렬됩니다.",
    response={
        200: List[PaymentDetailOut],
        404: dict,
        500: dict,
    },
)
@paginate(CustomPageNumberPagination)
async def get_payment_details(request, tax_id: int):
    @sync_to_async
    def get_payments():
        try:
            account = TaxInvoiceAccount.objects.get(tax_invoice_id=tax_id)
            # 입금예정일 기준 내림차순 정렬 (null 값은 마지막에)
            payments = PaymentDetail.objects.filter(
                tax_invoice_account=account
            ).order_by(
                F("expected_payment_date").desc(nulls_last=True),
                "-payment_date"
            )
            return list(payments)
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
    
    payments = await get_payments()
    return payments
