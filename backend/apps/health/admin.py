"""
BioPulse AI Health App — Django Admin Configuration.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from apps.health.models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "specialty",
        "fee",
        "qualifications",
        "experience_years",
        "location",
        "phone",
        "is_active",
        "display_order",
        "image_preview",
        "created_at",
    )
    list_editable = ("is_active", "display_order", "fee")
    list_filter = ("is_active", "specialty", "location", "created_at")
    search_fields = (
        "name",
        "specialty",
        "qualifications",
        "location",
        "fee",
        "email",
        "phone",
        "short_bio",
        "services_offered",
        "slug",
    )
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")
    readonly_fields = ("created_at", "updated_at", "image_preview_large")

    fieldsets = (
        (
            "Core Identity",
            {
                "fields": ("name", "slug", "specialty", "is_active", "display_order"),
            },
        ),
        (
            "Clinical Credentials & Fee Structure",
            {
                "fields": (
                    "fee",
                    "qualifications",
                    "experience_years",
                    "rating",
                    "reviews_count",
                    "wait_time",
                    "services_offered",
                ),
            },
        ),
        (
            "Contact & Location",
            {
                "fields": ("phone", "email", "location"),
            },
        ),
        (
            "Profile Media & Biography",
            {
                "fields": (
                    "profile_image",
                    "profile_image_url",
                    "image_preview_large",
                    "short_bio",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = ["publish_doctors", "unpublish_doctors"]

    @admin.display(description="Thumbnail")
    def image_preview(self, obj: Doctor):
        img_url = obj.profile_image.url if obj.profile_image else obj.profile_image_url
        if img_url:
            return format_html(
                '<img src="{}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 50%;" />',
                img_url,
            )
        return mark_safe('<span style="color: #94a3b8;">No image</span>')

    @admin.display(description="Current Portrait")
    def image_preview_large(self, obj: Doctor):
        img_url = obj.profile_image.url if obj.profile_image else obj.profile_image_url
        if img_url:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 12px;" />',
                img_url,
            )
        return "No image uploaded yet."

    @admin.action(description="Publish selected doctors (Make Active)")
    def publish_doctors(self, request, queryset):
        updated_count = queryset.update(is_active=True)
        self.message_user(request, f"Successfully published {updated_count} doctor(s).")

    @admin.action(description="Unpublish selected doctors (Make Inactive)")
    def unpublish_doctors(self, request, queryset):
        updated_count = queryset.update(is_active=False)
        self.message_user(request, f"Successfully unpublished {updated_count} doctor(s).")
