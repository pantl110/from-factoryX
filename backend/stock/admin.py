from django.contrib import admin
from .models import Material, MaterialHistory, Product, ProductHistory, MaterialProduct

# Register your models here.

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['id', 'factory', 'name', 'code', 'unit', 'current_stock', 'standard_stock', 'created_at']
    list_filter = ['unit', 'created_at', 'factory']
    search_fields = ['factory__name', 'name', 'code', 'spec']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('factory', 'name', 'code', 'unit', 'spec')
        }),
        ('재고 정보', {
            'fields': ('current_stock', 'standard_stock', 'location')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(MaterialHistory)
class MaterialHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'material', 'client', 'quantity', 'price', 'total_stock', 'created_at']
    list_filter = ['type', 'created_at', 'material__factory']
    search_fields = ['material__name', 'client__name']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('type', 'material', 'client', 'quantity', 'price', 'total_stock')
        }),
        ('세금 정보', {
            'fields': ('purchase_tax_invoice', 'cash_receipt')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'factory', 'name', 'code', 'unit', 'current_stock', 'average_production_time', 'created_at']
    list_filter = ['unit', 'created_at', 'factory']
    search_fields = ['factory__name', 'name', 'code', 'spec']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('factory', 'name', 'code', 'unit', 'spec')
        }),
        ('재고 정보', {
            'fields': ('current_stock', 'average_production_time', 'buffer_rate', 'location')
        }),
        ('기타 정보', {
            'fields': ('note',)
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ProductHistory)
class ProductHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'product', 'quantity', 'total_stock', 'created_at']
    list_filter = ['type', 'created_at', 'product__factory']
    search_fields = ['product__name']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('type', 'product', 'quantity', 'total_stock')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(MaterialProduct)
class MaterialProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'material', 'quantity', 'created_at']
    list_filter = ['created_at', 'product__factory']
    search_fields = ['product__name', 'material__name']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('product', 'material', 'quantity')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
