"""
OvaSense Health API — URL Routing.
"""

from django.urls import path
from apps.health.views import MedicalReportOcrView

urlpatterns = [
    path("ocr/", MedicalReportOcrView.as_view(), name="health-ocr"),
]
