"""
OvaSense Health API — URL Routing.
"""

from django.urls import path
from apps.health.views import (
    MedicalReportOcrView,
    DigitalTwinView,
    ProfileValidationView,
    OnboardingValidationView,
    HealthSummaryPdfExportView,
)
from apps.health.views_nutrition import (
    CurrentNutritionPlanView,
    FoodLogDetailView,
    FoodLogsView,
    MealRemindersView,
    NutritionPlanDetailView,
    NutritionPlanHistoryView,
    NutritionPlanRegenerateView,
    NutritionPreferencesView,
    NutritionReadinessView,
    NutritionTargetsView,
    PlanLockMealView,
    PlanRegenerateDayView,
    PlanStatusUpdateView,
    PlanSwapMealView,
    WeeklyPlanGenerateView,
)

urlpatterns = [
    path("ocr/", MedicalReportOcrView.as_view(), name="health-ocr"),
    path("digital-twin/", DigitalTwinView.as_view(), name="health-digital-twin"),
    path("profile/validate/", ProfileValidationView.as_view(), name="health-profile-validate"),
    path("onboarding/validate/", OnboardingValidationView.as_view(), name="health-onboarding-validate"),
    path("summary/pdf/", HealthSummaryPdfExportView.as_view(), name="health-summary-pdf"),
    # BioPulse Nutrition & Meal Planning Endpoints
    path("nutrition/preferences/", NutritionPreferencesView.as_view(), name="nutrition-preferences"),
    path("nutrition/readiness/", NutritionReadinessView.as_view(), name="nutrition-readiness"),
    path("nutrition/targets/", NutritionTargetsView.as_view(), name="nutrition-targets"),
    path("nutrition/plan/weekly/", WeeklyPlanGenerateView.as_view(), name="nutrition-plan-weekly"),
    path("nutrition/plan/generate/", WeeklyPlanGenerateView.as_view(), name="nutrition-plan-generate"),
    path("nutrition/plan/current/", CurrentNutritionPlanView.as_view(), name="nutrition-plan-current"),
    path("nutrition/plan/history/", NutritionPlanHistoryView.as_view(), name="nutrition-plan-history"),
    path("nutrition/plan/<uuid:plan_id>/", NutritionPlanDetailView.as_view(), name="nutrition-plan-detail"),
    path("nutrition/plan/<uuid:plan_id>/status/", PlanStatusUpdateView.as_view(), name="nutrition-plan-status-update"),
    path("nutrition/plan/lock-meal/", PlanLockMealView.as_view(), name="nutrition-plan-lock-meal"),
    path("nutrition/plan/swap-meal/", PlanSwapMealView.as_view(), name="nutrition-plan-swap-meal"),
    path("nutrition/plan/regenerate-day/", PlanRegenerateDayView.as_view(), name="nutrition-plan-regenerate-day"),
    path("nutrition/plan/regenerate/", NutritionPlanRegenerateView.as_view(), name="nutrition-plan-regenerate"),
    # Food Logs & Adherence
    path("nutrition/food-logs/", FoodLogsView.as_view(), name="nutrition-food-logs"),
    path("nutrition/food-logs/<uuid:log_id>/", FoodLogDetailView.as_view(), name="nutrition-food-log-detail"),
    # Reminders
    path("nutrition/reminders/", MealRemindersView.as_view(), name="nutrition-meal-reminders"),
]
