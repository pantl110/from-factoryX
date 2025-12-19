from tax.models import NationalTaxService, CashReceipt, TaxInvoiceAccount, AccountStatus
from ninja.errors import HttpError
from tax.barobill_utils import get_state_barobill_tax_invoice


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
