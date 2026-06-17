from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = (
        "name", "activity_type", "category", "city",
        "min_budget", "max_budget", "indoor", "outdoor",
        "is_free", "score_base", "source", "is_active",
    )
    list_filter = ("activity_type", "indoor", "outdoor", "is_free", "source", "is_active", "city")
    search_fields = ("name", "description", "category", "address")
    ordering = ("-score_base", "name")
    readonly_fields = ("created_at", "updated_at", "external_id")
    list_editable = ("score_base", "is_active")
    list_per_page = 50

    fieldsets = (
        ("Información principal", {
            "fields": ("name", "description", "category", "activity_type", "city", "place"),
        }),
        ("Presupuesto y grupo", {
            "fields": ("min_budget", "max_budget", "min_people", "max_people", "is_free"),
        }),
        ("Ambiente", {
            "fields": ("indoor", "outdoor", "score_base"),
        }),
        ("Ubicación", {
            "fields": ("address", "latitude", "longitude"),
        }),
        ("Links", {
            "fields": ("external_url", "image_url"),
        }),
        ("Metadatos", {
            "fields": ("source", "external_id", "is_active", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
