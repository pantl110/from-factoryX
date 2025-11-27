from django.contrib import admin
from .models import (
    Material,
    MaterialHistory,
    Product,
    ProductHistory,
    MaterialProduct,
    MaterialUsage,
)

# 순환 import 방지를 위해 여기서 import
try:
    from repackaging.models import MaterialRepackaging

    class MaterialRepackagingInline(admin.TabularInline):
        """MaterialHistory의 소분 내역 인라인"""
        model = MaterialRepackaging
        extra = 0
        fields = [
            "lot_number",
            "quantity",
            "warehouse_location",
            "expiration_date",
        ]
        readonly_fields = ["lot_number"]
        can_delete = True

except ImportError:
    # repackaging 앱이 없을 경우를 대비
    MaterialRepackagingInline = None

# Register your models here.


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory",
        "name",
        "code",
        "unit",
        "current_stock",
        "standard_stock",
        "created_at",
    ]
    list_filter = ["unit", "created_at", "factory"]
    search_fields = ["factory__name", "name", "code", "spec"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("factory", "name", "code", "unit", "spec")}),
        ("재고 정보", {"fields": ("current_stock", "standard_stock", "location")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(MaterialHistory)
class MaterialHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "type",
        "material",
        "client",
        "quantity",
        "price",
        "lot_number",
        "warehouse_location",
        "expiration_date",
        "total_stock",
        "remaining_quantity",
        "created_at",
    ]
    list_filter = ["type", "created_at", "material__factory"]
    search_fields = ["material__name", "client__name"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20
    inlines = [MaterialRepackagingInline] if MaterialRepackagingInline else []

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "type",
                    "material",
                    "client",
                    "quantity",
                    "price",
                    "lot_number",
                    "warehouse_location",
                    "expiration_date",
                    "total_stock",
                    "remaining_quantity",
                )
            },
        ),
        ("세금 정보", {"fields": ("cash_receipt",)}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_inlines(self, request, obj):
        """구매 타입일 때만 소분 인라인 표시"""
        if obj and obj.type == MaterialHistory.MaterialHistoryType.purchase and MaterialRepackagingInline:
            return [MaterialRepackagingInline]
        return []


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory",
        "name",
        "code",
        "unit",
        "current_stock",
        "average_production_time",
        "created_at",
    ]
    list_filter = ["unit", "created_at", "factory"]
    search_fields = ["factory__name", "name", "code", "spec"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("factory", "name", "code", "unit", "spec")}),
        (
            "재고 정보",
            {
                "fields": (
                    "current_stock",
                    "average_production_time",
                    "buffer_rate",
                    "location",
                )
            },
        ),
        ("기타 정보", {"fields": ("note",)}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(ProductHistory)
class ProductHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "quantity",
        "total_stock",
        "is_canceled",
        "created_at",
    ]
    list_filter = ["created_at", "product__factory"]
    search_fields = ["product__name"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "product",
                    "project_id",
                    "client_name",
                    "production_quantity",
                    "delivery_quantity",
                    "quantity",
                    "total_stock",
                    "is_canceled",
                )
            },
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(MaterialProduct)
class MaterialProductAdmin(admin.ModelAdmin):
    list_display = ["id", "product", "material", "quantity", "created_at"]
    list_filter = ["created_at", "product__factory"]
    search_fields = ["product__name", "material__name"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("product", "material", "quantity")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(MaterialUsage)
class MaterialUsageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "plan",
        "original_material",
        "material",
        "usage_amount",
        "get_lot_number",
        "get_source_type",
        "created_at",
    ]
    list_filter = ["created_at", "plan"]
    search_fields = [
        "plan__id",
        "material__name",
        "material__code",
        "original_material__name",
        "original_material__code",
        "material_history__lot_number",
        "material_repackaging__lot_number",
    ]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20
    list_select_related = [
        "plan",
        "material",
        "original_material",
        "material_history",
        "material_repackaging",
    ]

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "plan",
                    "original_material",
                    "material",
                    "usage_amount",
                )
            },
        ),
        (
            "자재 이력 정보",
            {
                "fields": (
                    "material_history",
                    "material_repackaging",
                ),
                "description": "MaterialHistory 또는 MaterialRepackaging 중 하나만 설정하세요.",
            },
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_lot_number(self, obj):
        """LOT 번호 표시"""
        if obj.material_history:
            return obj.material_history.lot_number
        elif obj.material_repackaging:
            return obj.material_repackaging.lot_number
        return "-"

    get_lot_number.short_description = "LOT 번호"

    def get_source_type(self, obj):
        """자재 출처 타입 표시"""
        if obj.material_history:
            return "MaterialHistory"
        elif obj.material_repackaging:
            return "MaterialRepackaging"
        return "-"

    get_source_type.short_description = "출처"
