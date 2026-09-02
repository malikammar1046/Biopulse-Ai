"""
OvaSense Intelligence API — URL Routing.
"""
from django.urls import path
from apps.intelligence.views import (
    IntelligenceStatusView,
    IntelligenceHealthView,
    IntelligenceAssessmentView,
)

urlpatterns = [
    path("status/", IntelligenceStatusView.as_view(), name="intelligence-status"),
    path("health/", IntelligenceHealthView.as_view(), name="intelligence-health"),
    path("assessment/", IntelligenceAssessmentView.as_view(), name="intelligence-assessment"),
]
