from django.contrib import admin
from .models import NationalTaxService, CashReceipt


# Register your models here.
@admin.register(NationalTaxService)
class NationalTaxServiceAdmin(admin.ModelAdmin):
    pass


@admin.register(CashReceipt)
class CashReceiptAdmin(admin.ModelAdmin):
    pass
