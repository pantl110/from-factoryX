from django.contrib import admin
from .models import MaterialRepackaging


@admin.register(MaterialRepackaging)
class MaterialRepackagingAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "parent_history",
        "lot_number",
        "quantity",
        "warehouse_location",
        "expiration_date",
        "created_at",
    ]
    list_filter = ["created_at", "parent_history__material__factory"]
    search_fields = [
        "parent_history__lot_number",
        "lot_number",
        "parent_history__material__name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "parent_history",
                    "lot_number",
                    "quantity",
                    "warehouse_location",
                    "expiration_date",
                )
            },
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
