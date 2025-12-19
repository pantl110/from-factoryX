from django.contrib import admin
from .models import NationalTaxService, CashReceipt, TaxInvoiceAccount, PaymentDetail


class TaxInvoiceAccountInline(admin.StackedInline):
    model = TaxInvoiceAccount
    extra = 0
    can_delete = False


@admin.register(NationalTaxService)
class NationalTaxServiceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "factory",
        "client",
        "transaction_date",
        "transaction_amount",
        "tax_amount",
        "publish_status",
        "tax_invoice_type",
        "transaction_type",
        "is_hidden",
    )
    inlines = [TaxInvoiceAccountInline]
    list_filter = ("factory", "publish_status", "tax_invoice_type", "transaction_type")
    search_fields = ("id", "client__name", "factory__name", "mgt_key", "nts_send_key")


@admin.register(CashReceipt)
class CashReceiptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "factory",
        "client",
        "transaction_date",
        "transaction_amount",
        "tax_amount",
        "cash_receipt_type",
        "get_account_status",
        "get_outstanding_balance",
    )
    inlines = [TaxInvoiceAccountInline]
    list_filter = ("factory", "cash_receipt_type", "transaction_date")
    search_fields = ("id", "client__name", "factory__name", "nts_confirm_num")
    
    def get_account_status(self, obj):
        """Account 상태 조회"""
        try:
            account = obj.cash_receipt_account
            return account.get_status_display()
        except TaxInvoiceAccount.DoesNotExist:
            return "-"
    get_account_status.short_description = "Account 상태"
    
    def get_outstanding_balance(self, obj):
        """미수금액 조회"""
        try:
            account = obj.cash_receipt_account
            return f"{account.outstanding_balance:,}원"
        except TaxInvoiceAccount.DoesNotExist:
            return "-"
    get_outstanding_balance.short_description = "미수금액"


@admin.register(TaxInvoiceAccount)
class TaxInvoiceAccountAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tax_invoice",
        "cash_receipt",
        "status",
        "total_billed_amount",
        "outstanding_balance",
        "invoice_sent_count",
        "collection_terms",
        "agreed_payment_date",
    )
    list_filter = ("status", "collection_terms")
    search_fields = ("id", "tax_invoice__id", "cash_receipt__id", "cash_receipt__nts_confirm_num")
    autocomplete_fields = ("tax_invoice", "cash_receipt")


@admin.register(PaymentDetail)
class PaymentDetailAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tax_invoice_account",
        "payment_date",
        "amount_received",
        "outstanding_amount_at_payment",
        "expected_payment_date",
    )
    list_filter = ("payment_date", "expected_payment_date")
    search_fields = (
        "id",
        "tax_invoice_account__id",
        "tax_invoice_account__tax_invoice__id",
        "tax_invoice_account__cash_receipt__id",
    )
