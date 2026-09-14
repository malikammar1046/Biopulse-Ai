"""
backend/apps/intelligence/views.py
PCOS-ML Intelligence API — DRF Views.

Endpoints:
  GET  /api/v1/intelligence/status/               — Public service status & model registry metadata
  GET  /api/v1/intelligence/health/               — Authenticated normalised health snapshot
  GET  /api/v1/intelligence/assessment/active/    — Authenticated single active assessment
  GET  /api/v1/intelligence/assessment/history/   — Authenticated chronological assessment history
  POST /api/v1/intelligence/assessment/tier1/     — Authenticated Tier 1 assessment runner
  POST /api/v1/intelligence/assessment/tier2/     — Authenticated cumulative Tier 2 assessment runner
  POST /api/v1/intelligence/assessment/ultrasound/— Authenticated ultrasound image upload & fusion runner
  POST /api/v1/intelligence/assessment/           — Unified progressive assessment runner
"""

import io
import json
import logging
from PIL import Image

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.health.services.supabase_health_service import health_service
from apps.intelligence.serializers import (
    ProgressiveAssessmentSerializer,
    ChatMessageRequestSerializer,
    ChatMessageResponseSerializer,
)
from apps.intelligence.services.intelligence_orchestrator import (
    get_health_snapshot,
    run_assessment,
    run_tier1_assessment,
    run_tier2_assessment,
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    run_ultrasound_assessment,
    format_assessment_response,
)
from apps.intelligence.services.assessment_repository import assessment_repository
from apps.intelligence.services.pcos_ml_service import pcos_ml_service
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.safety_guardrails import SafetyGuardrails
from apps.intelligence.services.health_context_builder import HealthContextBuilder
from apps.intelligence.services.llm_provider import get_llm_provider, LLMProviderError

logger = logging.getLogger(__name__)

# Constants
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


class IntelligenceStatusView(APIView):
    """
    GET /api/v1/intelligence/status/

    Public endpoint — returns real model metadata and service health.
    Does NOT require authentication.
    Does NOT return any patient data.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            pcos_ml_service.load()
            pcos_ready = pcos_ml_service.is_ready
        except Exception as e:
            logger.warning("PCOS-ML service status check error: %s", e)
            pcos_ready = False

        try:
            male_ml_service.load()
            male_ready = male_ml_service.is_ready
        except Exception as e:
            logger.warning("Male-ML service status check error: %s", e)
            male_ready = False

        return Response({
            "status": "ok" if (pcos_ready and male_ready) else ("degraded" if (pcos_ready or male_ready) else "initializing"),
            "service": "PMOSense Intelligence API (PCOS-ML & Male-ML)",
            "models": {
                "tier_1": {
                    "name": "Extra Trees + Platt Sigmoid Calibration",
                    "version": "PCOS-ML v1.2-T1",
                    "features_count": 16,
                    "screening_threshold": 0.38,
                    "explainability": "TreeSHAP",
                },
                "tier_1_2": {
                    "name": "Cumulative Extra Trees + Platt Sigmoid Calibration",
                    "version": "PCOS-ML v1.2-T2",
                    "features_count": 32,
                    "screening_threshold": 0.29,
                    "explainability": "TreeSHAP",
                },
                "tier_1_2_3": {
                    "name": "Weighted Multimodal Probability Fusion",
                    "version": "PCOS-ML v1.2-Multimodal",
                    "weights": {"clinical": 0.95, "ultrasound": 0.05},
                    "screening_threshold": 0.29,
                },
                "tier3_vision": {
                    "name": "EfficientNet-B0 + PCOM Classifier",
                    "version": "PCOS-ML v1.2-Vision",
                    "explainability": "Grad-CAM",
                },
                "tier_1_3": {
                    "supported": False,
                    "notice": "Dedicated Tier 1+3 fusion model is not yet trained in PCOS-ML.",
                }
            },
            "male_models": {
                "tier_1": {
                    "name": "Calibrated Logistic Regression",
                    "version": "Male-ML v1.0-T1",
                    "features_count": 11,
                    "screening_threshold": 0.1808,
                    "explainability": "Standardized Coefficients",
                },
                "tier_2": {
                    "name": "Calibrated Random Forest + Hormone Pattern Rules",
                    "version": "Male-ML v1.0-T2",
                    "features_count": 16,
                    "screening_threshold": 0.3379,
                    "explainability": "Feature Importances",
                },
            },
            "ready": pcos_ready and male_ready,
            "pcos_ready": pcos_ready,
            "male_ready": male_ready,
            "disclaimer": "AI screening estimate — not a medical diagnosis.",
        })


class IntelligenceHealthView(APIView):
    """
    GET /api/v1/intelligence/health/

    Returns a normalised health snapshot for the authenticated patient.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        try:
            snapshot = get_health_snapshot(patient_uuid, auth_token=auth_token)
            return Response(snapshot, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Failed to build health snapshot: %s", exc, exc_info=True)
            return Response(
                {"error": "Failed to retrieve health snapshot."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ActiveAssessmentView(APIView):
    """
    GET /api/v1/intelligence/assessment/active/

    Returns the single currently active cumulative assessment for the authenticated patient.
    Accepts optional ?module= parameter ('male_hypogonadism' or 'female_pcos').
    If omitted, detects module from user profile gender.
    If no assessment exists, automatically executes Tier 1 for the corresponding module.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        module = request.query_params.get("module")

        if not module:
            try:
                health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
                profile = getattr(health_data, "profile", None)
                if profile:
                    gender = getattr(profile, "gender", "") or (profile.get("gender") if isinstance(profile, dict) else "")
                    if str(gender).strip().lower() in ["male", "m", "man"]:
                        module = "male_hypogonadism"
            except Exception as e:
                logger.warning("Could not determine user gender for active assessment: %s", e)

        module = module or "female_pcos"

        try:
            active = assessment_repository.get_active_assessment(patient_uuid, module=module, auth_token=auth_token)
            if not active:
                if module == "male_hypogonadism":
                    active = run_male_tier1_assessment(patient_uuid, auth_token=auth_token)
                else:
                    active = run_tier1_assessment(patient_uuid, auth_token=auth_token)
            else:
                active = format_assessment_response(active)

            serializer = ProgressiveAssessmentSerializer(data=active)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(active, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Failed to fetch active assessment: %s", exc, exc_info=True)
            return Response(
                {"error": "Failed to retrieve active assessment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AssessmentHistoryView(APIView):
    """
    GET /api/v1/intelligence/assessment/history/

    Returns the complete chronological history of all assessments for the authenticated patient.
    Accepts optional ?module= parameter ('male_hypogonadism' or 'female_pcos').
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        module = request.query_params.get("module")

        try:
            history = assessment_repository.get_assessment_history(patient_uuid, module=module, auth_token=auth_token)
            return Response({"history": history, "count": len(history)}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Failed to fetch assessment history: %s", exc, exc_info=True)
            return Response(
                {"error": "Failed to retrieve assessment history."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MaleTier1AssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/male/tier1/

    Executes Male Tier 1 (Questionnaire/Biometric) assessment, marks it active,
    and returns the result.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        client_payload = request.data if isinstance(request.data, dict) else {}

        try:
            result = run_male_tier1_assessment(
                patient_uuid,
                auth_token=auth_token,
                client_health_data=client_payload,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Male Tier 1 assessment failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Male Tier 1 screening pipeline encountered an error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MaleTier2AssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/male/tier2/

    Executes Male Tier 2 (Clinical Labs + Hormone Pattern Rules) assessment,
    replaces active Tier 1 result, preserves history, and returns the result.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        clinical_payload = request.data if isinstance(request.data, dict) else {}

        try:
            result = run_male_tier2_assessment(
                patient_uuid,
                auth_token=auth_token,
                clinical_inputs=clinical_payload,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as val_err:
            logger.warning("Male Tier 2 clinical input validation error: %s", val_err)
            return Response(
                {"error": str(val_err)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error("Male Tier 2 assessment failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Male Tier 2 assessment pipeline encountered an error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class Tier1AssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/tier1/

    Executes Tier 1 assessment, marks it active, and returns the result.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        client_payload = request.data if isinstance(request.data, dict) else {}

        try:
            result = run_tier1_assessment(
                patient_uuid,
                auth_token=auth_token,
                client_health_data=client_payload,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Tier 1 assessment failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Tier 1 screening pipeline encountered an error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class Tier2AssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/tier2/

    Executes cumulative Tier 1 + Clinical assessment (32 features),
    replaces active Tier 1 result, preserves history, and returns the result.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        clinical_payload = request.data if isinstance(request.data, dict) else {}

        try:
            result = run_tier2_assessment(
                patient_uuid,
                auth_token=auth_token,
                clinical_inputs=clinical_payload,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as val_err:
            logger.warning("Tier 2 clinical input validation error: %s", val_err)
            return Response(
                {"error": str(val_err)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error("Tier 2 cumulative assessment failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Cumulative Tier 2 assessment pipeline encountered an error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UltrasoundAssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/ultrasound/

    Accepts secure multipart ultrasound upload.
    Validates MIME type, extension, size, and image integrity.
    If clinical labs exist: runs complete Tier 1+2+3 multimodal fusion and activates it.
    If only Tier 1 exists: processes ultrasound for PCOM/Grad-CAM, returns tier_1_3_model_unavailable,
    and keeps Tier 1 active.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)

        # 1. Check for uploaded file
        uploaded_file = request.FILES.get("image") or request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No ultrasound image file was provided in the upload request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. File size validation
        if uploaded_file.size > MAX_IMAGE_SIZE_BYTES:
            return Response(
                {"error": f"Image file exceeds maximum allowable size of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. MIME type validation
        mime_type = getattr(uploaded_file, "content_type", "")
        if mime_type not in ALLOWED_MIME_TYPES:
            return Response(
                {"error": f"Unsupported file type '{mime_type}'. Supported formats: JPEG, PNG, WEBP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Open and validate image with PIL
        try:
            image_bytes = uploaded_file.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
            pil_image.verify()  # Verify file integrity
            # Re-open for actual processing (verify closes stream in PIL)
            pil_image = Image.open(io.BytesIO(image_bytes))
        except Exception as img_err:
            logger.warning("Corrupted image file uploaded: %s", img_err)
            return Response(
                {"error": "The uploaded file is not a valid or readable image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5. Execute Progressive Ultrasound Pipeline
        try:
            result = run_ultrasound_assessment(
                patient_uuid,
                pil_image=pil_image,
                auth_token=auth_token,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Ultrasound assessment pipeline failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Ultrasound assessment pipeline encountered an unexpected error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IntelligenceAssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/

    Unified progressive assessment endpoint.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        client_payload = request.data if isinstance(request.data, dict) else {}

        try:
            result = run_assessment(
                patient_uuid,
                auth_token=auth_token,
                client_health_data=client_payload,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Assessment pipeline failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Intelligence pipeline encountered an unexpected error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IntelligenceChatView(APIView):
    """
    POST /api/v1/intelligence/chat/

    Authenticated conversational endpoint for OvaSense AI.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatMessageRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        patient_uuid = str(request.user.id)
        user_msg = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get("conversation_id") or ""
        history = serializer.validated_data.get("conversation_history") or []

        # 1. Check safety guardrails (emergency escalation & safety filters)
        emergency_advisory = SafetyGuardrails.check_emergency(user_msg)
        if emergency_advisory:
            return Response({
                "success": True,
                "message": emergency_advisory,
                "conversation_id": conversation_id,
                "context_used": {},
                "safety_level": "urgent",
                "needs_clinician": True,
                "model": "safety_guardrail",
            }, status=status.HTTP_200_OK)

        injection_advisory = SafetyGuardrails.check_prompt_injection(user_msg)
        if injection_advisory:
            return Response({
                "success": True,
                "message": injection_advisory,
                "conversation_id": conversation_id,
                "context_used": {},
                "safety_level": "caution",
                "needs_clinician": False,
                "model": "safety_guardrail",
            }, status=status.HTTP_200_OK)

        # 2. Build privacy-preserving, structured clinical context
        try:
            auth_token = getattr(request.user, "raw_token", None)
            sys_prompt, ctx, used_context = HealthContextBuilder.build_context(
                patient_uuid,
                user_msg,
                auth_token=auth_token,
            )
        except Exception as ctx_err:
            logger.warning("Context builder error: %s", ctx_err)
            sys_prompt = "You are OvaSense AI health companion."
            ctx = ""
            used_context = {}

        # 3. Generate response using configured LLM Provider
        try:
            provider = get_llm_provider()
            llm_res = provider.generate_chat_response(
                system_instruction=sys_prompt,
                user_message=user_msg,
                health_context=ctx,
                conversation_history=history,
            )
            return Response({
                "success": True,
                "message": llm_res.answer,
                "conversation_id": conversation_id,
                "context_used": used_context,
                "safety_level": llm_res.safety_level,
                "needs_clinician": llm_res.needs_clinician,
                "model": llm_res.model_name,
            }, status=status.HTTP_200_OK)
        except LLMProviderError as l_err:
            logger.error("LLM Provider failed: %s", l_err)
            model_name = getattr(provider, "model_name", "medgemma:4b") if "provider" in locals() else "medgemma:4b"
            return Response(
                {
                    "success": False,
                    "error": "Conversational assistant is currently offline or unreachable.",
                    "message": "Conversational assistant is currently offline or unreachable. Please try again later.",
                    "model": model_name,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.error("Unexpected chat error: %s", exc, exc_info=True)
            return Response(
                {"error": "Chat pipeline encountered an unexpected error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

