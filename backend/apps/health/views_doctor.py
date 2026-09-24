"""
BioPulse AI Health App — Public Doctor ViewSet.
"""
from rest_framework import permissions, viewsets
from apps.health.models import Doctor
from apps.health.serializers_doctor import DoctorSerializer


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API endpoint for querying active doctor profiles.
    Only active doctors (is_active=True) are exposed, ordered by display_order.
    Modification, creation, and deletion are strictly disallowed.
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        return Doctor.objects.filter(is_active=True).order_by("display_order", "name", "id")
