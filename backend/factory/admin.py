from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Factory, FactoryEquipment, FactoryClient, FactoryMember


class FactoryMemberInline(admin.TabularInline):
    model = FactoryMember
    extra = 1
    readonly_fields = ["created_at", "updated_at"]
    fields = ["user", "role", "status", "invited_by", "invited_at"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "invited_by")


# Register your models here.


@admin.register(Factory)
class FactoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "owner",
        "business_registration_number",
        "representative_name",
        "is_trial",
        "member_count",
        "created_at",
    ]
    list_filter = ["is_trial", "created_at", "updated_at"]
    search_fields = [
        "name",
        "business_registration_number",
        "representative_name",
        "manager_email",
    ]
    readonly_fields = ["created_at", "updated_at", "member_count"]
    list_per_page = 20
    ordering = ["-created_at"]
    inlines = [FactoryMemberInline]

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "owner",
                    "name",
                    "business_registration_number",
                    "representative_name",
                )
            },
        ),
        ("담당자 정보", {"fields": ("manager_email", "manager_phone", "manager_fax")}),
        (
            "사업 정보",
            {"fields": ("business_type", "business_category", "business_address")},
        ),
        ("시스템 정보", {"fields": ("is_trial", "billing_key", "inviting")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def member_count(self, obj):
        """공장별 멤버 수 표시"""
        return obj.members.count()

    member_count.short_description = "멤버 수"

    def get_queryset(self, request):
        """쿼리셋 최적화"""
        qs = super().get_queryset(request)
        return qs.select_related("owner").prefetch_related("members")


@admin.register(FactoryEquipment)
class FactoryEquipmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory",
        "name",
        "status",
        "priority",
        "location",
        "created_at",
    ]
    list_filter = ["status", "priority", "created_at", "factory"]
    search_fields = ["factory__name", "name", "location"]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        ("기본 정보", {"fields": ("factory", "name", "status", "priority")}),
        ("위치 정보", {"fields": ("location", "note")}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(FactoryClient)
class FactoryClientAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory",
        "type",
        "name",
        "business_registration_number",
        "representative_name",
        "created_at",
    ]
    list_filter = ["type", "created_at", "factory"]
    search_fields = [
        "factory__name",
        "name",
        "business_registration_number",
        "representative_name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 20

    fieldsets = (
        (
            "기본 정보",
            {
                "fields": (
                    "factory",
                    "type",
                    "name",
                    "business_registration_number",
                    "representative_name",
                )
            },
        ),
        ("연락처 정보", {"fields": ("email", "phone", "fax")}),
        (
            "사업 정보",
            {"fields": ("business_type", "business_category", "address", "manager")},
        ),
        ("기타 정보", {"fields": ("note",)}),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(FactoryMember)
class FactoryMemberAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "factory",
        "user",
        "role",
        "status",
        "invited_by",
        "invited_at",
        "created_at",
    ]
    list_filter = ["role", "status", "invited_at", "created_at", "factory"]
    search_fields = ["factory__name", "user__email", "user__name", "invited_by__email"]
    readonly_fields = ["created_at", "updated_at", "invited_at"]
    list_per_page = 20
    list_editable = ["role", "status"]  # 목록에서 직접 편집 가능
    ordering = ["-created_at"]

    fieldsets = (
        ("기본 정보", {"fields": ("factory", "user", "role", "status")}),
        (
            "초대 정보",
            {
                "fields": (
                    "invited_by",
                    "invited_at",
                    "invitation_token",
                    "invitation_message",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "시스템 정보",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """관리자 권한 체크 및 쿼리셋 최적화"""
        qs = super().get_queryset(request)
        return qs.select_related("factory", "user", "invited_by")

    def has_delete_permission(self, request, obj=None):
        """삭제 권한 제한 - superuser가 아닌 경우 관리자 삭제 불가"""
        # superuser는 모든 멤버를 삭제할 수 있음
        if request.user.is_superuser:
            return super().has_delete_permission(request, obj)

        # 일반 사용자는 관리자 멤버 삭제 불가
        if obj and obj.role == "admin":
            return False  # 관리자는 삭제 불가
        return super().has_delete_permission(request, obj)

    def save_model(self, request, obj, form, change):
        """모델 저장 시 추가 로직"""
        if not change:  # 새로 생성하는 경우
            obj.invited_by = request.user
        super().save_model(request, obj, form, change)
