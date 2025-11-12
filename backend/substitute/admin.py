from django.contrib import admin
from .models import Substitute


@admin.register(Substitute)
class SubstituteAdmin(admin.ModelAdmin):
    list_display = ["id", "source_material", "factory", "target_material_count", "created_at"]
    list_filter = ["factory", "created_at"]
    search_fields = ["source_material__name", "source_material__code"]
    filter_horizontal = ["target_materials"]
    readonly_fields = ["created_at", "updated_at", "target_material_count"]
    
    fieldsets = (
        ("기본 정보", {
            "fields": ("factory", "source_material")
        }),
        ("대체 자재", {
            "fields": ("target_materials",),
            "description": "source_material의 대체 가능한 자재 목록 (단방향)"
        }),
        ("시스템 정보", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def target_material_count(self, obj):
        """대체 자재 개수 표시"""
        return obj.target_materials.count()
    
    target_material_count.short_description = "대체 자재 수"
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        qs = super().get_queryset(request)
        return qs.select_related("factory", "source_material").prefetch_related("target_materials")
