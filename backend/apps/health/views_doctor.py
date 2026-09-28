"""
BioPulse AI Health App — Public Doctor ViewSet.
"""
from django.db.models import Case, IntegerField, Value, When
from rest_framework import permissions, viewsets
from apps.health.models import Doctor
from apps.health.serializers_doctor import DoctorSerializer


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public & authenticated API endpoint for querying active doctor profiles.
    Only active doctors (is_active=True) are exposed.
    Supports pathway filtering (?pathway=female_pcos or ?pathway=male_hypogonadism)
    with strict isolation or pathway prioritization.
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        qs = Doctor.objects.filter(is_active=True)
        pathway = self.request.query_params.get("pathway", "").strip().lower()
        strict = self.request.query_params.get("strict", "").strip().lower() in ("true", "1")
        recommended_only = self.request.query_params.get("recommended_only", "").strip().lower() in ("true", "1")

        if pathway in ("female_pcos", "female", "pcos"):
            if strict or recommended_only:
                # Return only female PCOS specialists and shared endocrine specialists
                # Zero male urologist/andrologist leakage
                qs = qs.filter(pathway__in=["female_pcos", "both"]).order_by("display_order", "name", "id")
                return qs
            else:
                # Prioritize female PCOS first (order 0), both (order 1), male (order 2)
                qs = qs.annotate(
                    pathway_priority=Case(
                        When(pathway="female_pcos", then=Value(0)),
                        When(pathway="both", then=Value(1)),
                        default=Value(2),
                        output_field=IntegerField(),
                    )
                ).order_by("pathway_priority", "display_order", "name", "id")
                return qs

        elif pathway in ("male_hypogonadism", "male", "hypogonadism"):
            if strict or recommended_only:
                # Return only male hypogonadism/andrology specialists and shared endocrine specialists
                # Zero gynecologist/obstetrician leakage
                qs = qs.filter(pathway__in=["male_hypogonadism", "both"]).order_by("display_order", "name", "id")
                return qs
            else:
                # Prioritize male hypogonadism first (order 0), both (order 1), female (order 2)
                qs = qs.annotate(
                    pathway_priority=Case(
                        When(pathway="male_hypogonadism", then=Value(0)),
                        When(pathway="both", then=Value(1)),
                        default=Value(2),
                        output_field=IntegerField(),
                    )
                ).order_by("pathway_priority", "display_order", "name", "id")
                return qs

        return qs.order_by("display_order", "name", "id")

