from django.contrib import admin
from .models import Factory, FactoryEquipment, FactoryClient, FactoryMember

# Register your models here.

@admin.register(Factory)
class FactoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'owner', 'business_registration_number', 'representative_name', 'is_trial', 'created_at']
    list_filter = ['is_trial', 'created_at', 'updated_at']
    search_fields = ['name', 'business_registration_number', 'representative_name', 'manager_email']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('owner', 'name', 'business_registration_number', 'representative_name')
        }),
        ('담당자 정보', {
            'fields': ('manager_email', 'manager_phone', 'manager_fax')
        }),
        ('사업 정보', {
            'fields': ('business_type', 'business_category', 'business_address')
        }),
        ('시스템 정보', {
            'fields': ('is_trial', 'billing_key', 'inviting')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FactoryEquipment)
class FactoryEquipmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'factory', 'name', 'status', 'priority', 'location', 'created_at']
    list_filter = ['status', 'priority', 'created_at', 'factory']
    search_fields = ['factory__name', 'name', 'location']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('factory', 'name', 'status', 'priority')
        }),
        ('위치 정보', {
            'fields': ('location', 'note')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FactoryClient)
class FactoryClientAdmin(admin.ModelAdmin):
    list_display = ['id', 'factory', 'type', 'name', 'business_registration_number', 'representative_name', 'created_at']
    list_filter = ['type', 'created_at', 'factory']
    search_fields = ['factory__name', 'name', 'business_registration_number', 'representative_name']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('factory', 'type', 'name', 'business_registration_number', 'representative_name')
        }),
        ('연락처 정보', {
            'fields': ('email', 'phone', 'fax')
        }),
        ('사업 정보', {
            'fields': ('business_type', 'business_category', 'address', 'manager')
        }),
        ('기타 정보', {
            'fields': ('note',)
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FactoryMember)
class FactoryMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'factory', 'user', 'role', 'status', 'invited_by', 'invited_at', 'created_at']
    list_filter = ['role', 'status', 'invited_at', 'created_at', 'factory']
    search_fields = ['factory__name', 'user__email', 'invited_by__email']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('factory', 'user', 'role', 'status')
        }),
        ('초대 정보', {
            'fields': ('invited_by', 'invited_at', 'invitation_token', 'invitation_message')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
