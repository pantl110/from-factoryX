from tax.models import NationalTaxService, CashReceipt, TaxInvoiceAccount, AccountStatus, PaymentDetail
from ninja.errors import HttpError
from datetime import date


async def get_tax_service_by_id(tax_service_id: int):
    try:
        tax_service = (
            await NationalTaxService.objects.select_related("client", "factory", "user")
            .prefetch_related("projects")
            .aget(id=tax_service_id)
        )
        return tax_service
    except NationalTaxService.DoesNotExist:
        raise HttpError(404, "세금계산서가 존재하지 않습니다.")


async def check_state_tax_invoice(tax_invoice):
    pass


async def create_accounts_for_cash_receipts(cash_receipts: list[CashReceipt]):
    """현금영수증 리스트에 대한 TaxInvoiceAccount를 일괄 생성"""
    if not cash_receipts:
        return
    
    accounts = []
    for cash_receipt in cash_receipts:
        # transaction_amount, tax_amount, service_charge를 합산하여 total_billed_amount 계산
        total_billed_amount = (
            (cash_receipt.transaction_amount or 0) 
            + (cash_receipt.tax_amount or 0) 
            + (cash_receipt.service_charge or 0)
        )
        accounts.append(
            TaxInvoiceAccount(
                cash_receipt=cash_receipt,
                status=AccountStatus.waiting,
                invoice_sent_count=0,
                total_billed_amount=total_billed_amount,
                outstanding_balance=total_billed_amount,
            )
        )
    
    if accounts:
        await TaxInvoiceAccount.objects.abulk_create(accounts)


def recalculate_payment_details_balance(account: TaxInvoiceAccount):
    """모든 PaymentDetail의 outstanding_amount_at_payment를 날짜순으로 재계산"""
    # payment_date 기준 오름차순 정렬 (가장 오래된 것부터)
    payments = PaymentDetail.objects.filter(
        tax_invoice_account=account
    ).order_by("payment_date", "id")
    
    # 초기 잔액은 청구금액
    current_balance = account.total_billed_amount
    
    # 날짜순으로 잔액 누적 차감
    for payment in payments:
        current_balance -= payment.amount_received
        payment.outstanding_amount_at_payment = current_balance
        payment.save(update_fields=["outstanding_amount_at_payment"])
    
    # 최종 잔액 업데이트
    account.outstanding_balance = current_balance
    account.save(update_fields=["outstanding_balance"])


def update_account_balance_and_status(account: TaxInvoiceAccount, new_balance: int):
    """Account 잔액을 업데이트하고 상태를 자동으로 업데이트하는 함수
    
    상태 우선순위:
    1. 약정 지급일이 지났고 잔액이 있으면 무조건 연체(overdue) - 최우선
    2. 잔액이 0이면 완료(completed)
    3. 잔액이 있고 청구금액보다 작으면 일부(partial)
    4. 그 외는 대기(waiting)
    """
    account.outstanding_balance = new_balance
    
    today = date.today()
    
    # 1. 약정 지급일이 지났고 잔액이 있으면 무조건 연체 (최우선)
    if (
        account.agreed_payment_date 
        and account.agreed_payment_date < today 
        and account.outstanding_balance > 0
    ):
        account.status = AccountStatus.overdue
    # 2. 잔액이 0이면 완료
    elif account.outstanding_balance == 0:
        account.status = AccountStatus.completed
    # 3. 잔액이 있고 청구금액보다 작으면 일부
    elif (
        account.outstanding_balance > 0 
        and account.outstanding_balance < account.total_billed_amount
    ):
        account.status = AccountStatus.partial
    # 4. 그 외는 대기
    else:
        account.status = AccountStatus.waiting
    
    account.save()
