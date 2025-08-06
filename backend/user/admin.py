from django.contrib import admin
from user.models import User, Jwt, EmailVerification

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "email",
        "name",
        "status",
        "phone_number",
        "is_active",
        "is_staff",
        "factory_roles",
        "date_joined",
    ]
    list_filter = [
        "status",
        "is_active",
        "is_staff",
        "is_superuser",
        "terms_of_service",
        "privacy_policy_agreement",
        "marketing_agreement",
        "date_joined",
    ]
    search_fields = ["email", "name", "phone_number"]
    readonly_fields = ["date_joined", "last_login", "factory_roles"]
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('email', 'name', 'phone_number', 'profile_image')
        }),
        ('상태 정보', {
            'fields': ('status', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('공장 권한', {
            'fields': ('factory_roles',),
            'description': '사용자가 속한 공장과 권한 정보'
        }),
        ('약관 동의', {
            'fields': ('terms_of_service', 'privacy_policy_agreement', 'marketing_agreement')
        }),
        ('외부 서비스', {
            'fields': ('barobill_user_id',)
        }),
        ('권한 정보', {
            'fields': ('groups', 'user_permissions')
        }),
        ('시스템 정보', {
            'fields': ('date_joined', 'last_login'),
            'classes': ('collapse',)
        }),
    )
    
    def factory_roles(self, obj):
        """사용자의 공장별 권한 정보 표시"""
        memberships = obj.factory_members.select_related('factory').all()
        if not memberships:
            return "공장 권한 없음"
        
        roles = []
        for membership in memberships:
            status_text = "활성" if membership.status == 'active' else "초대됨"
            roles.append(f"{membership.factory.name or f'공장{membership.factory.id}'} ({membership.get_role_display()}, {status_text})")
        
        return " | ".join(roles)
    factory_roles.short_description = '공장 권한'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        qs = super().get_queryset(request)
        return qs.prefetch_related('factory_members__factory')

@admin.register(Jwt)
class JwtAdmin(admin.ModelAdmin):
    list_display = ['id', 'user']
    search_fields = ['user__email', 'user__name']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'access', 'refresh')
        }),
    )

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'email', 'verification_type', 'is_verified', 'created_at']
    list_filter = ['verification_type', 'is_verified', 'created_at']
    search_fields = ['email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('email', 'code', 'verification_type', 'is_verified')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
