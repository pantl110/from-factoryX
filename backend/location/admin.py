from django.contrib import admin
from .models import Location

# Register your models here.

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'location', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['location']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('type', 'location', 'images')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
