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


def validate_male_screening_age(dob: datetime.date | str) -> int:
    """
    Validates that Date of Birth is present, a valid date, not in the future,
    and meets the male screening age requirement of 19–60 years old inclusive.
    Returns calculated age in complete years.
    """
    if not dob:
        raise serializers.ValidationError("Date of birth is required.")

    if isinstance(dob, str):
        try:
            dob = datetime.date.fromisoformat(dob.strip()[:10])
        except (ValueError, TypeError):
            raise serializers.ValidationError("Please enter a valid date of birth (YYYY-MM-DD).")

    today = datetime.date.today()
    if dob > today:
        raise serializers.ValidationError("Date of birth cannot be in the future.")

    # Calculate exact age from complete date of birth, respecting birthdays and leap years
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    if age < 19:
        raise serializers.ValidationError(
            "BioPulse AI male screening is calibrated for adult men aged 19 to 60. "
            "You must be at least 19 years old to complete male onboarding."
        )
    if age > 60:
        raise serializers.ValidationError(
            "BioPulse AI male screening is calibrated for adult men aged 19 to 60. "
            "In men older than 60, age-related endocrine changes require direct clinical evaluation with a physician."
        )

    return age


class ProfileValidationSerializer(serializers.Serializer):
    """
    Validates user profile and onboarding demographic input data,
    enforcing minimum age of 13 years old and prohibiting future dates.
    For male screening pathways, strictly enforces ages 19–60 inclusive.
    """
    date_of_birth = serializers.DateField(required=True)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    gender = serializers.CharField(max_length=50, required=False, allow_blank=True)
    pathway = serializers.CharField(max_length=50, required=False, allow_blank=True)
    age = serializers.IntegerField(required=False, allow_null=True)
    height_cm = serializers.FloatField(required=False, allow_null=True)
    weight_kg = serializers.FloatField(required=False, allow_null=True)
    waist_cm = serializers.FloatField(required=False, allow_null=True)

    def validate_date_of_birth(self, value):
        validate_age_and_dob(value)
        return value

    def validate(self, data):
        gender = str(data.get("gender") or "").strip().lower()
        pathway = str(data.get("pathway") or "").strip().lower()
        is_male = gender in ("male", "m", "man") or pathway in ("male", "male_hypogonadism", "androsense", "hypogonadism")
        dob = data.get("date_of_birth")
        submitted_age = data.get("age")

        if dob:
            calc_age = validate_age_and_dob(dob)
            if submitted_age is not None and submitted_age != calc_age:
                raise serializers.ValidationError(
                    {"age": f"Submitted age ({submitted_age}) conflicts with date of birth (age {calc_age})."}
                )

        if is_male and dob:
            try:
                calc_male_age = validate_male_screening_age(dob)
                if submitted_age is not None and submitted_age != calc_male_age:
                    raise serializers.ValidationError(
                        {"age": f"Submitted age ({submitted_age}) conflicts with date of birth (age {calc_male_age})."}
                    )
            except serializers.ValidationError as err:
                raise serializers.ValidationError({"date_of_birth": err.detail})
        return data


class OnboardingValidationSerializer(ProfileValidationSerializer):
    """Alias for onboarding validation."""
    pass

