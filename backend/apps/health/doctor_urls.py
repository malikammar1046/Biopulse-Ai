"""
BioPulse AI Health App — Doctor Endpoint Routing.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.health.views_doctor import DoctorViewSet

router = DefaultRouter()
router.register(r"", DoctorViewSet, basename="doctor")

urlpatterns = [
    path("", include(router.urls)),
]
