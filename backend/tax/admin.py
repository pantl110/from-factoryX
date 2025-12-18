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
        "project",
        "status",
        "total_billed_amount",
        "outstanding_balance",
        "invoice_sent_count",
        "collection_terms",
        "agreed_payment_date",
    )
    list_filter = ("status", "collection_terms", "project")
    search_fields = ("id", "tax_invoice__id", "project__name")
    autocomplete_fields = ("tax_invoice", "project")

    def save_model(self, request, obj, form, change):
        # tax_invoice가 선택되었고 project가 없으면, tax_invoice와 연결된 project를 자동 설정
        if obj.tax_invoice and not obj.project:
            # tax_invoice와 연결된 project가 있으면 자동으로 설정
            linked_project = obj.tax_invoice.projects.first()
            if linked_project:
                obj.project = linked_project
        super().save_model(request, obj, form, change)


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
