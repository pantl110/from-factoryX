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
    readonly_fields = ["date_joined", "last_login"]
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('email', 'name', 'phone_number', 'profile_image')
        }),
        ('상태 정보', {
            'fields': ('status', 'is_active', 'is_staff', 'is_superuser')
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
