from django.contrib import admin
from .models import Material, MaterialHistory, Product, ProductHistory, MaterialProduct

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
