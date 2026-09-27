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
    ClearTier2AssessmentView,
    PatientClinicalStateView,
    UltrasoundAssessmentView,
    IntelligenceChatView,
    CompanionHealthView,
    LongitudinalHealthView,
)
from apps.intelligence.views_lifestyle import LifestyleRecommendationsView

urlpatterns = [
    path("status/", IntelligenceStatusView.as_view(), name="intelligence-status"),
    path("health/", IntelligenceHealthView.as_view(), name="intelligence-health"),
    path("clinical-state/", PatientClinicalStateView.as_view(), name="intelligence-clinical-state"),
    path("longitudinal-health/", LongitudinalHealthView.as_view(), name="intelligence-longitudinal-health"),
    path("assessment/", IntelligenceAssessmentView.as_view(), name="intelligence-assessment"),
    path("assessment/active/", ActiveAssessmentView.as_view(), name="intelligence-assessment-active"),
    path("assessment/history/", AssessmentHistoryView.as_view(), name="intelligence-assessment-history"),
    path("assessment/tier1/", Tier1AssessmentView.as_view(), name="intelligence-assessment-tier1"),
    path("assessment/tier2/", Tier2AssessmentView.as_view(), name="intelligence-assessment-tier2"),
    path("assessment/clear-tier2/", ClearTier2AssessmentView.as_view(), name="intelligence-assessment-clear-tier2"),
    path("assessment/male/tier1/", MaleTier1AssessmentView.as_view(), name="intelligence-assessment-male-tier1"),
    path("assessment/male/tier2/", MaleTier2AssessmentView.as_view(), name="intelligence-assessment-male-tier2"),
    path("assessment/ultrasound/", UltrasoundAssessmentView.as_view(), name="intelligence-assessment-ultrasound"),
    path("chat/", IntelligenceChatView.as_view(), name="intelligence-chat"),
    path("companion/chat/", IntelligenceChatView.as_view(), name="intelligence-companion-chat"),
    path("companion/health/", CompanionHealthView.as_view(), name="intelligence-companion-health"),
    path("lifestyle-recommendations/", LifestyleRecommendationsView.as_view(), name="intelligence-lifestyle-recommendations"),
]
