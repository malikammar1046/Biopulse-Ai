"""
OvaSense — Health & Medical Report Serializers for DRF.
"""

from rest_framework import serializers


class OcrResultItemSerializer(serializers.Serializer):
    test_name = serializers.CharField(max_length=200)
    result_value = serializers.CharField(max_length=100)
    result_numeric = serializers.FloatField(allow_null=True, required=False)
    unit = serializers.CharField(max_length=50, allow_blank=True)
    reference_range = serializers.CharField(max_length=100, allow_blank=True)
    reference_low = serializers.FloatField(allow_null=True, required=False)
    reference_high = serializers.FloatField(allow_null=True, required=False)
    status = serializers.ChoiceField(
        choices=["within_range", "outside_range", "needs_review", "insufficient_info"]
    )
    confidence = serializers.FloatField()
    source_text = serializers.CharField(max_length=500, allow_blank=True)
    extraction_method = serializers.CharField(max_length=50)
    page_number = serializers.IntegerField(default=1)
    requires_review = serializers.BooleanField(default=False)
    explanation = serializers.CharField(max_length=500, allow_blank=True)


class OcrDocumentMetaSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    total_pages = serializers.IntegerField(default=1)
    has_selectable_text = serializers.BooleanField(default=False)
    avg_confidence = serializers.FloatField(default=0.0)
    engine = serializers.CharField(default="PaddleOCR PP-OCRv4 (ONNX)")


class OcrResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    document = OcrDocumentMetaSerializer()
    results = OcrResultItemSerializer(many=True)
    raw_text_snippet = serializers.CharField(allow_blank=True)
    requires_review = serializers.BooleanField(default=False)
    disclaimer = serializers.CharField(max_length=500)


import datetime


def validate_age_and_dob(dob: datetime.date | str) -> int:
    """
    Validates that Date of Birth is present, a valid date, not in the future,
    and meets the minimum age requirement of 13 years old.
    Returns calculated age in complete years.
    """
    if not dob:
        raise serializers.ValidationError("Date of birth is required.")

    if isinstance(dob, str):
        try:
            dob = datetime.date.fromisoformat(dob.strip())
        except (ValueError, TypeError):
            raise serializers.ValidationError("Please enter a valid date of birth (YYYY-MM-DD).")

    today = datetime.date.today()
    if dob > today:
        raise serializers.ValidationError("Date of birth cannot be in the future.")

    # Calculate exact age from complete date of birth
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    if age < 13:
        raise serializers.ValidationError("You must be at least 13 years old to use PMOSense.")

    return age


class ProfileValidationSerializer(serializers.Serializer):
    """
    Validates user profile and onboarding demographic input data,
    enforcing minimum age of 13 years old and prohibiting future dates.
    """
    date_of_birth = serializers.DateField(required=True)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    gender = serializers.CharField(max_length=50, required=False, allow_blank=True)
    pathway = serializers.CharField(max_length=50, required=False, allow_blank=True)
    height_cm = serializers.FloatField(required=False, allow_null=True)
    weight_kg = serializers.FloatField(required=False, allow_null=True)
    waist_cm = serializers.FloatField(required=False, allow_null=True)

    def validate_date_of_birth(self, value):
        validate_age_and_dob(value)
        return value


class OnboardingValidationSerializer(ProfileValidationSerializer):
    """Alias for onboarding validation."""
    pass

