"""
URL configuration for OvaSense backend.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/intelligence/", include("apps.intelligence.urls")),
    path("api/v1/health/", include("apps.health.urls")),
    # Clean AI boundary alias: POST /api/ai/chat/
    path("api/ai/", include("apps.intelligence.urls")),
]
