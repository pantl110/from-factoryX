from django.contrib import admin
from .models import UnitConversion


@admin.register(UnitConversion)
class UnitConversionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory",
        "material",
        "product",
        "from_unit",
        "to_unit",
        "from_quantity",
        "to_quantity",
        "decimal_rule",
        "created_at",
    ]
    list_filter = ["factory", "from_unit", "to_unit", "created_at"]
    search_fields = [
        "factory__name",
        "material__name",
        "product__name",
        "from_unit",
        "to_unit",
    ]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20
    ordering = ["-created_at"]

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "factory",
                    "material",
                    "product",
                    "from_unit",
                    "to_unit",
                    "from_quantity",
                    "to_quantity",
                    "decimal_rule",
                )
            },
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

