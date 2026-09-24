"""
URL configuration for OvaSense backend.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/doctors/", include("apps.health.doctor_urls")),
    path("api/v1/intelligence/", include("apps.intelligence.urls")),
    path("api/v1/health/", include("apps.health.urls")),
    # Clean AI boundary alias: POST /api/ai/chat/
    path("api/ai/", include("apps.intelligence.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
