from django.contrib import admin
from .models import Project, ProjectPlan, ProjectLog, Refund
from stock.models import MaterialUsage

# Register your models here.


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "status",
        "confirmed_at",
        "pending_at",
        "transact_date",
        "tax_invoice",
        "created_at",
        "updated_at",
    ]
    list_filter = [
        "status",
        "confirmed_at",
        "pending_at",
        "transact_date",
        "created_at",
        "updated_at",
    ]
    search_fields = ["id", "status"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "status",
                    "confirmed_at",
                    "pending_at",
                    "transact_date",
                    "tax_invoice",
                )
            },
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(ProjectPlan)
class ProjectPlanAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "project",
        "status",
        "product",
        "quantity",
        "equipment",
        "start_date",
        "end_date",
    ]
    list_filter = ["status", "start_date", "end_date", "equipment", "created_at"]
    search_fields = ["project__id", "product__product__name", "equipment__name"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        (
            "기본 정보",
            {"fields": ("project", "status", "product", "quantity", "equipment")},
        ),
        ("일정 정보", {"fields": ("start_date", "end_date", "avg_production_time")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(ProjectLog)
class ProjectLogAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "type", "title", "created_at"]
    list_filter = ["type", "created_at"]
    search_fields = ["project__id", "title", "content"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("project", "type", "title", "content")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "amount",
        "refund_date",
        "current_stock",
        "production_amount",
    ]
    list_filter = ["refund_date", "created_at"]
    search_fields = ["product__name"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("product", "amount", "refund_date")}),
        ("재고 정보", {"fields": ("current_stock", "production_amount")}),
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
    list_select_related = ["plan", "material", "original_material", "material_history", "material_repackaging"]

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
