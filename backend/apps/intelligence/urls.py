"""
backend/apps/intelligence/urls.py
PCOS-ML Intelligence API — URL Routing.
"""

from django.urls import path
from apps.intelligence.views import (
    IntelligenceStatusView,
    IntelligenceHealthView,
    IntelligenceAssessmentView,
    ActiveAssessmentView,
    AssessmentHistoryView,
    Tier1AssessmentView,
    Tier2AssessmentView,
    MaleTier1AssessmentView,
    MaleTier2AssessmentView,
    UltrasoundAssessmentView,
    IntelligenceChatView,
)

urlpatterns = [
    path("status/", IntelligenceStatusView.as_view(), name="intelligence-status"),
    path("health/", IntelligenceHealthView.as_view(), name="intelligence-health"),
    path("assessment/", IntelligenceAssessmentView.as_view(), name="intelligence-assessment"),
    path("assessment/active/", ActiveAssessmentView.as_view(), name="intelligence-assessment-active"),
    path("assessment/history/", AssessmentHistoryView.as_view(), name="intelligence-assessment-history"),
    path("assessment/tier1/", Tier1AssessmentView.as_view(), name="intelligence-assessment-tier1"),
    path("assessment/tier2/", Tier2AssessmentView.as_view(), name="intelligence-assessment-tier2"),
    path("assessment/male/tier1/", MaleTier1AssessmentView.as_view(), name="intelligence-assessment-male-tier1"),
    path("assessment/male/tier2/", MaleTier2AssessmentView.as_view(), name="intelligence-assessment-male-tier2"),
    path("assessment/ultrasound/", UltrasoundAssessmentView.as_view(), name="intelligence-assessment-ultrasound"),
    path("chat/", IntelligenceChatView.as_view(), name="intelligence-chat"),
]
