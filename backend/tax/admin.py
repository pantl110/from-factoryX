from django.contrib import admin
from .models import NationalTaxService, CashReceipt, TaxInvoiceAccount, PaymentDetail


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
    )
    list_filter = ("factory", "cash_receipt_type", "transaction_date")
    search_fields = ("id", "client__name", "factory__name", "nts_confirm_num")


@admin.register(TaxInvoiceAccount)
class TaxInvoiceAccountAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tax_invoice",
        "status",
        "total_billed_amount",
        "outstanding_balance",
        "invoice_sent_count",
        "collection_terms",
        "agreed_payment_date",
    )
    list_filter = ("status", "collection_terms")
    search_fields = ("id", "tax_invoice__id")
    autocomplete_fields = ("tax_invoice",)


@admin.register(PaymentDetail)
class PaymentDetailAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tax_invoice_account",
        "payment_date",
        "amount_received",
        "outstanding_amount_at_payment",
        "overdue_days",
    )
    list_filter = ("payment_date", "overdue_days")
    search_fields = ("id", "tax_invoice_account__id", "tax_invoice_account__tax_invoice__id")
