"""
BioPulse AI Health App — Doctor Serializers.
"""
from rest_framework import serializers
from apps.health.models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    """
    Public read-only serializer for active Doctor records.
    """
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            "id",
            "name",
            "slug",
            "profile_image",
            "specialty",
            "short_bio",
            "phone",
            "email",
            "location",
            "fee",
            "qualifications",
            "experience_years",
            "rating",
            "reviews_count",
            "wait_time",
            "services_offered",
            "is_active",
            "display_order",
        ]
        read_only_fields = fields

    def get_profile_image(self, obj: Doctor) -> str | None:
        if obj.profile_image:
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        if obj.profile_image_url:
            return obj.profile_image_url
        return None
