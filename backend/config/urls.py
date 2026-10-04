"""
URL configuration for OvaSense backend.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root_api_index(request):
    """Root health and discovery endpoint."""
    return JsonResponse(
        {
            "status": "healthy",
            "service": "BioPulse AI Backend",
            "version": "1.0.0",
            "docs": "BioPulse Clinical Assessment & Multimodal AI Engine",
            "endpoints": {
                "health": "/api/v1/intelligence/health/",
                "status": "/api/v1/intelligence/status/",
                "assessment_tier1": "/api/v1/intelligence/assessment/tier1/",
                "assessment_tier2": "/api/v1/intelligence/assessment/tier2/",
                "male_tier1": "/api/v1/intelligence/assessment/male/tier1/",
                "male_tier2": "/api/v1/intelligence/assessment/male/tier2/",
                "ai_chat": "/api/ai/chat/",
                "doctors": "/api/v1/doctors/",
                "health_records": "/api/v1/health/",
            },
        },
        status=200,
    )


urlpatterns = [
    path("", root_api_index, name="root-index"),
    path("api/", root_api_index, name="api-index"),
    path("admin/", admin.site.urls),
    path("api/v1/doctors/", include("apps.health.doctor_urls")),
    path("api/v1/intelligence/", include("apps.intelligence.urls")),
    path("api/v1/health/", include("apps.health.urls")),
    # Clean AI boundary alias: POST /api/ai/chat/
    path("api/ai/", include("apps.intelligence.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
