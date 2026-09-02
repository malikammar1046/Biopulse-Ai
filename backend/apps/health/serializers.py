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
