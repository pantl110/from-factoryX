from django.contrib import admin
from .models import Quotation, QuotationProduct, WorkInstruction

# Register your models here.


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ["id", "factory", "client", "project", "due_date", "created_at"]
    list_filter = ["due_date", "created_at", "factory"]
    search_fields = ["factory__name", "client__name", "project__id"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        (
            "기본 정보",
            {"fields": ("factory", "client", "project", "due_date", "uploaded_file")},
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(QuotationProduct)
class QuotationProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "quotation",
        "product",
        "quantity",
        "unit_price",
        "is_delivery",
        "delivery_date",
    ]
    list_filter = ["is_delivery", "delivery_date", "created_at"]
    search_fields = ["quotation__id", "product__name"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("quotation", "product", "quantity", "unit_price")}),
        ("납품 정보", {"fields": ("is_delivery", "delivery_date")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(WorkInstruction)
class WorkInstructionAdmin(admin.ModelAdmin):
    list_display = ["id", "memo", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["memo"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("factory", "plans", "memo")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
