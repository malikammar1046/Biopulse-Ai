"""
OvaSense Health API — URL Routing.
"""

from django.urls import path
from apps.health.views import MedicalReportOcrView, DigitalTwinView

urlpatterns = [
    path("ocr/", MedicalReportOcrView.as_view(), name="health-ocr"),
    path("digital-twin/", DigitalTwinView.as_view(), name="health-digital-twin"),
]
