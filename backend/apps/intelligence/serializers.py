"""
backend/apps/intelligence/serializers.py
DRF Serializers for PCOS-ML Progressive Assessment and Conversational Intelligence.
"""

from rest_framework import serializers


class FeatureExplanationSerializer(serializers.Serializer):
    feature_key = serializers.CharField(required=False)
    feature_name = serializers.CharField(required=False)
    value = serializers.FloatField(required=False, allow_null=True)
    unit = serializers.CharField(required=False, allow_blank=True)
    tier = serializers.CharField(required=False, default="Tier 1")
    impact_score = serializers.FloatField(required=False)
    direction = serializers.CharField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)

    # Legacy field aliases
    human_label = serializers.CharField(required=False)
    patient_explanation = serializers.CharField(required=False)


class ProgressiveAssessmentSerializer(serializers.Serializer):
    """Standardized Progressive Assessment Response Schema."""
    has_assessment = serializers.BooleanField(required=False, default=True)
    patient_id = serializers.CharField(required=False, allow_blank=True)
    assessment_id = serializers.CharField(required=False, allow_blank=True)
    id = serializers.CharField(required=False, allow_blank=True)
    assessment_level = serializers.ChoiceField(
        choices=["tier_1", "tier_1_2", "tier_1_3", "tier_1_2_3", "insufficient_data"],
        required=False,
        default="tier_1",
    )
    tiers_included = serializers.ListField(child=serializers.IntegerField(), default=list)
    model_version = serializers.CharField(required=False, default="PCOS-ML v1.2")
    model_name = serializers.CharField(required=False, default="PCOS-ML Extra Trees")
    probability = serializers.FloatField(allow_null=True, required=False)
    probability_percent = serializers.FloatField(allow_null=True, required=False)
    threshold = serializers.FloatField(required=False, default=0.38)
    risk_category = serializers.CharField(required=False, default="lower")
    replaced_assessment_id = serializers.CharField(allow_null=True, required=False)
    explanations = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    shap_explanation = serializers.DictField(required=False, allow_null=True)
    longitudinal_shap_comparison = serializers.DictField(required=False, allow_null=True)
    limitations = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    next_available_tier = serializers.IntegerField(allow_null=True, required=False)
    pcom_status = serializers.CharField(allow_null=True, required=False)
    pcom_probability = serializers.FloatField(allow_null=True, required=False)
    gradcam_b64 = serializers.CharField(allow_null=True, required=False)
    gradcam_url = serializers.CharField(allow_null=True, required=False)
    is_active = serializers.BooleanField(required=False, default=True)
    disclaimer = serializers.CharField(required=False)
    created_at = serializers.CharField(required=False, allow_blank=True)
    notice = serializers.CharField(required=False, allow_blank=True)
    status_code = serializers.CharField(required=False, allow_blank=True)
    input_hash = serializers.CharField(required=False, allow_blank=True)

    # Module & Categorization
    module = serializers.CharField(required=False, default="female_pcos")
    risk_label = serializers.CharField(required=False, allow_blank=True)
    summary_text = serializers.CharField(required=False, allow_blank=True)
    next_step = serializers.CharField(required=False, allow_blank=True)
    available_features = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    missing_features = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    # Evidence Completeness Metadata
    tier_2_available_count = serializers.IntegerField(allow_null=True, required=False)
    tier_2_total_count = serializers.IntegerField(allow_null=True, required=False)
    tier_2_available_fields = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    tier_2_missing_fields = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    evidence_completeness_percent = serializers.FloatField(allow_null=True, required=False)
    evidence_completeness = serializers.DictField(required=False, default=dict)
    tier_2_inputs = serializers.DictField(required=False, default=dict)
    authoritative_tier_2_inputs = serializers.DictField(required=False, default=dict)
    input_features = serializers.DictField(required=False, default=dict)
    tier_1_inputs = serializers.DictField(required=False, default=dict)
    authoritative_tier_1_inputs = serializers.DictField(required=False, default=dict)
    hormone_pattern_interpretation = serializers.DictField(required=False, allow_null=True)
    direct_laboratory_values = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    evidence_used = serializers.DictField(required=False, default=dict)
    available_historical_evidence = serializers.DictField(required=False, default=dict)

    # Backwards compatibility legacy aliases
    pcos_probability = serializers.FloatField(allow_null=True, required=False)
    non_pcos_probability = serializers.FloatField(allow_null=True, required=False)
    screening_threshold = serializers.FloatField(required=False)
    risk_category_description = serializers.CharField(required=False, allow_blank=True)
    risk_pattern = serializers.CharField(required=False, allow_blank=True)
    risk_pattern_description = serializers.CharField(required=False, allow_blank=True)
    confidence = serializers.FloatField(allow_null=True, required=False)
    probabilities = serializers.DictField(child=serializers.FloatField(), required=False, default=dict)
    data_quality = serializers.DictField(required=False, default=dict)
    shap_enabled = serializers.BooleanField(required=False, default=True)
    backend_mode = serializers.CharField(required=False, default="ml")
    fetch_errors = serializers.ListField(child=serializers.CharField(), required=False, default=list)


# Alias for backward compatibility
AssessmentSerializer = ProgressiveAssessmentSerializer


class ChatMessageRequestSerializer(serializers.Serializer):
    """Validates the incoming user chat message payload."""
    message = serializers.CharField(max_length=2000, required=True, trim_whitespace=True, allow_blank=False)
    conversation_id = serializers.CharField(max_length=128, required=False, allow_blank=True, default="")
    pathway = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        allow_empty=True,
    )
    client_telemetry = serializers.DictField(
        required=False,
        default=dict,
    )


class ChatMessageResponseSerializer(serializers.Serializer):
    """Formats the conversational intelligence API response."""
    success = serializers.BooleanField(default=True)
    reply = serializers.CharField(required=False, default="")
    message = serializers.CharField()
    conversation_id = serializers.CharField()
    context_used = serializers.DictField(child=serializers.BooleanField())
    safety_level = serializers.CharField()
    needs_clinician = serializers.BooleanField(default=False)
    model = serializers.CharField(required=False, default="")

