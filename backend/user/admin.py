from django.contrib import admin
from django.contrib.auth.hashers import make_password
from django.forms import PasswordInput
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
        ('비밀번호', {
            'fields': ('password',),
            'description': '비밀번호를 변경하려면 새 비밀번호를 입력하세요. 비밀번호는 자동으로 해시화됩니다. 기존 사용자 편집 시 비밀번호 필드를 비워두면 변경되지 않습니다.'
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
    
    def formfield_for_dbfield(self, db_field, request, **kwargs):
        """비밀번호 필드를 PasswordInput 위젯으로 표시"""
        if db_field.name == 'password':
            kwargs['widget'] = PasswordInput(attrs={'placeholder': '비밀번호를 입력하세요'})
            kwargs['required'] = False
        return super().formfield_for_dbfield(db_field, request, **kwargs)
    
    def get_form(self, request, obj=None, **kwargs):
        """기존 사용자 편집 시 비밀번호 필드를 빈 값으로 초기화"""
        form = super().get_form(request, obj, **kwargs)
        if obj:  # 기존 사용자 편집 시
            form.base_fields['password'].initial = ''
        return form
    
    def save_model(self, request, obj, form, change):
        """비밀번호가 변경되었을 때 해시화하여 저장"""
        password = form.cleaned_data.get('password', '')
        
        if change:
            # 기존 사용자 편집 시
            if password:
                # 비밀번호가 입력된 경우 해시화하여 저장
                obj.password = make_password(password)
            else:
                # 비밀번호가 입력되지 않았으면 기존 비밀번호 유지
                obj.password = User.objects.get(pk=obj.pk).password
        else:
            # 새 사용자 생성 시
            if password:
                obj.password = make_password(password)
            else:
                # 기본 비밀번호 설정
                obj.password = make_password('changeme123!')
        
        super().save_model(request, obj, form, change)
    
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
