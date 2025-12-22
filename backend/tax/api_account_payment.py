from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async
from typing import List, Literal
from datetime import date
from django.db.models import F
from django.db import transaction
from api.security import jwt_auth
from api.pagination import CustomPageNumberPagination
from tax.models import TaxInvoiceAccount, PaymentDetail
from tax.schemas.outbound import PaymentDetailOut
from tax.schemas.inbound import PaymentDetailIn
from tax.utils import update_account_balance_and_status

router = Router(tags=["Tax Account Payment"], auth=jwt_auth)


@router.post(
    "/{id}",
    summary="[C] 회수/지급 상세내역 생성",
    description="세금계산서 또는 현금영수증 ID로 회수/지급 상세내역을 생성합니다.",
    response={201: PaymentDetailOut, 404: dict, 400: dict, 500: dict},
)
async def create_payment_detail(
    request, 
    id: int, 
    payload: PaymentDetailIn,
    type: Literal["tax", "cash-receipt"] = Query(..., description="타입: tax(세금계산서) 또는 cash-receipt(현금영수증)")
):
    @sync_to_async
    def create_payment():
        try:
            if type == "tax":
                account = TaxInvoiceAccount.objects.get(tax_invoice_id=id)
                error_msg = "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다."
            else:  # cash-receipt
                account = TaxInvoiceAccount.objects.get(cash_receipt_id=id)
                error_msg = "해당 현금영수증의 채권/채무 정보를 찾을 수 없습니다."
        except TaxInvoiceAccount.DoesNotExist:
            raise HttpError(404, error_msg)
        
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
            
            # Account 잔액 차감 및 상태 업데이트
            update_account_balance_and_status(account, outstanding_amount_after_payment)
            
            return payment
    
    payment = await create_payment()
    return 201, payment


@router.get(
    "/{id}",
    summary="[C] 회수/지급 상세내역 조회",
    description="세금계산서 또는 현금영수증 ID로 회수/지급 상세내역을 조회합니다. 입금예정일 기준 최신순으로 정렬됩니다.",
    response={
        200: List[PaymentDetailOut],
        404: dict,
        500: dict,
    },
)
@paginate(CustomPageNumberPagination)
async def get_payment_details(
    request, 
    id: int,
    type: Literal["tax", "cash-receipt"] = Query(..., description="타입: tax(세금계산서) 또는 cash-receipt(현금영수증)")
):
    @sync_to_async
    def get_payments():
        try:
            if type == "tax":
                account = TaxInvoiceAccount.objects.get(tax_invoice_id=id)
            else:  # cash-receipt
                account = TaxInvoiceAccount.objects.get(cash_receipt_id=id)
            # 입금예정일 기준 내림차순 정렬 (null 값은 마지막에)
            payments = PaymentDetail.objects.filter(
                tax_invoice_account=account
            ).order_by(
                F("expected_payment_date").desc(nulls_last=True),
                "-payment_date"
            )
            return list(payments)
        except TaxInvoiceAccount.DoesNotExist:
            if type == "tax":
                raise HttpError(404, "해당 세금계산서의 채권/채무 정보를 찾을 수 없습니다.")
            else:
                raise HttpError(404, "해당 현금영수증의 채권/채무 정보를 찾을 수 없습니다.")
    
    payments = await get_payments()
    return payments


@router.patch(
    "/payment/{payment_id}",
    summary="[U] 회수/지급 상세내역 수정",
    description="회수/지급 상세내역을 수정하고 account 상태와 잔액을 업데이트합니다.",
    response={200: PaymentDetailOut, 400: dict, 404: dict, 500: dict},
)
async def update_payment_detail(
    request,
    payment_id: int,
    payload: PaymentDetailIn,
):
    @sync_to_async
    def update_payment():
        try:
            payment = PaymentDetail.objects.select_related(
                "tax_invoice_account"
            ).get(id=payment_id)
        except PaymentDetail.DoesNotExist:
            raise HttpError(404, "해당 회수/지급 상세내역을 찾을 수 없습니다.")
        
        account = payment.tax_invoice_account
        
        # 트랜잭션으로 묶어서 일관성 유지
        with transaction.atomic():
            # amount_received가 변경되는 경우 잔액 재계산
            old_amount = payment.amount_received
            amount_diff = payload.amount_received - old_amount
            
            # 새로운 잔액 계산
            new_outstanding_balance = account.outstanding_balance - amount_diff
            
            # 잔액이 음수가 되지 않도록 체크
            if new_outstanding_balance < 0:
                raise HttpError(
                    400,
                    f"수정 후 미수금액이 음수가 됩니다. (현재 미수금액: {account.outstanding_balance:,}원, 변경 금액: {amount_diff:+,}원)"
                )
            
            # PaymentDetail 필드 업데이트
            payment.payment_date = payload.payment_date
            payment.expected_payment_date = payload.expected_payment_date
            payment.amount_received = payload.amount_received
            payment.outstanding_amount_at_payment = new_outstanding_balance
            payment.save()
            
            # Account 잔액 및 상태 업데이트
            update_account_balance_and_status(account, new_outstanding_balance)
            
            return payment
    
    payment = await update_payment()
    return payment


@router.delete(
    "/payment/{payment_id}",
    summary="[D] 회수/지급 상세내역 삭제",
    description="회수/지급 상세내역을 삭제하고 account 상태와 잔액을 복구합니다.",
    response={200: dict, 404: dict, 500: dict},
)
async def delete_payment_detail(
    request,
    payment_id: int,
):
    @sync_to_async
    def delete_payment():
        try:
            payment = PaymentDetail.objects.select_related(
                "tax_invoice_account"
            ).get(id=payment_id)
        except PaymentDetail.DoesNotExist:
            raise HttpError(404, "해당 회수/지급 상세내역을 찾을 수 없습니다.")
        
        account = payment.tax_invoice_account
        
        # 트랜잭션으로 묶어서 일관성 유지
        with transaction.atomic():
            # 삭제할 금액 저장
            amount_to_restore = payment.amount_received
            
            # PaymentDetail 삭제
            payment.delete()
            
            # Account 잔액 복구 및 상태 업데이트
            new_balance = account.outstanding_balance + amount_to_restore
            update_account_balance_and_status(account, new_balance)
            
            return {"message": "회수/지급 상세내역이 삭제되었습니다."}
    
    result = await delete_payment()
    return result
