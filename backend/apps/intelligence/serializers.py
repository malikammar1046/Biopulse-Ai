"""
OvaSense Intelligence API — DRF Serializers.

Validates and formats the screening assessment payload from ovasense_ml_bridge.
"""
from rest_framework import serializers


class FeatureExplanationSerializer(serializers.Serializer):
    feature = serializers.CharField()
    human_label = serializers.CharField()
    direction = serializers.ChoiceField(choices=["increases_risk", "decreases_risk", "positive", "negative"])
    magnitude = serializers.FloatField()
    patient_explanation = serializers.CharField()


class DataQualitySerializer(serializers.Serializer):
    completeness_percentage = serializers.FloatField()
    quality_level = serializers.ChoiceField(choices=["good", "limited", "insufficient_data"])
    missing_features = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    available_features = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    feature_details = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    cycle_records_count = serializers.IntegerField(required=False, default=0)
    symptom_records_count = serializers.IntegerField(required=False, default=0)
    total_records = serializers.IntegerField(required=False, default=0)


class AssessmentSerializer(serializers.Serializer):
    # Real Ovasense-ML fields
    risk_category = serializers.ChoiceField(
        choices=["lower_risk", "intermediate_risk", "higher_risk", "insufficient_data", "lower_pattern", "moderate_pattern", "higher_pattern"]
    )
    risk_category_description = serializers.CharField()
    pcos_probability = serializers.FloatField(allow_null=True, required=False)
    non_pcos_probability = serializers.FloatField(allow_null=True, required=False)
    screening_threshold = serializers.FloatField(required=False, default=0.38)
    is_higher_risk = serializers.BooleanField(required=False, default=False)
    confidence = serializers.FloatField(allow_null=True)
    probabilities = serializers.DictField(child=serializers.FloatField(), allow_empty=True)
    data_quality = DataQualitySerializer()
    explanations = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    model_metadata = serializers.DictField(allow_empty=True)
    disclaimer = serializers.CharField()
    shap_enabled = serializers.BooleanField()
    backend_mode = serializers.CharField()
    fetch_errors = serializers.ListField(child=serializers.CharField(), allow_empty=True)

    # Backwards compatibility aliases
    risk_pattern = serializers.CharField(required=False)
    risk_pattern_description = serializers.CharField(required=False)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure backwards compatibility aliases match risk_category
        return ret


class ChatMessageRequestSerializer(serializers.Serializer):
    """Validates the incoming user chat message payload."""
    message = serializers.CharField(max_length=2000, required=True, trim_whitespace=True)
    conversation_id = serializers.CharField(max_length=128, required=False, allow_blank=True, default="")
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        allow_empty=True,
    )


class ChatMessageResponseSerializer(serializers.Serializer):
    """Formats the conversational intelligence API response."""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()
    conversation_id = serializers.CharField()
    context_used = serializers.DictField(child=serializers.BooleanField())
    safety_level = serializers.CharField()
    needs_clinician = serializers.BooleanField(default=False)
    model = serializers.CharField(required=False, default="")
