from django.contrib import admin
from .models import Project, ProjectPlan, ProjectLog, Refund

# Register your models here.


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "status",
        "transact_date",
        "tax_invoice",
        "created_at",
        "updated_at",
    ]
    list_filter = ["status", "transact_date", "created_at", "updated_at"]
    search_fields = ["id", "status"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("status", "transact_date", "tax_invoice")}),
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
