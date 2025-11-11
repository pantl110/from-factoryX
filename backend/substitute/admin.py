from django.contrib import admin
from .models import Substitute


@admin.register(Substitute)
class SubstituteAdmin(admin.ModelAdmin):
    list_display = ["name", "factory", "created_at"]
    list_filter = ["factory", "created_at"]
    search_fields = ["name", "description"]
    filter_horizontal = ["materials"]
    readonly_fields = ["created_at", "updated_at"]
