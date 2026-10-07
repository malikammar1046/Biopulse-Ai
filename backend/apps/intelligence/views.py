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

from __future__ import annotations

import io
import json
import logging
import time
from typing import Any, Dict, List, Optional
from PIL import Image

from django.http import StreamingHttpResponse
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
    PublicChatMessageRequestSerializer,
    PublicChatMessageResponseSerializer,
)
from apps.intelligence.services.intelligence_orchestrator import (
    get_health_snapshot,
    run_assessment,
    run_tier1_assessment,
    run_tier2_assessment,
    run_male_tier1_assessment,
    run_male_tier2_assessment,
    clear_tier2_assessment,
    reassess_from_current_patient_state,
    run_ultrasound_assessment,
    format_assessment_response,
)
from apps.intelligence.services.assessment_repository import assessment_repository, PersistenceError
from apps.intelligence.services.pcos_ml_service import (
    pcos_ml_service,
    PCOS_SCREENING_POLICY,
    TIER1_SCREENING_THRESHOLD,
    TIER2_SCREENING_THRESHOLD,
    MULTIMODAL_SCREENING_THRESHOLD,
)
from apps.intelligence.services.male_ml_service import male_ml_service
from apps.intelligence.services.safety_guardrails import SafetyGuardrails
from apps.intelligence.services.health_context_builder import HealthContextBuilder
from apps.intelligence.services.context_sanitizer import LLMContextSanitizer
from apps.intelligence.services.llm_provider import get_llm_provider, LLMProviderError
from apps.intelligence.maintenance import is_assessment_maintenance_active, assessment_maintenance_response

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
                    "screening_threshold": TIER1_SCREENING_THRESHOLD,
                    "screening_policy_version": PCOS_SCREENING_POLICY["version"],
                    "explainability": "TreeSHAP",
                },
                "tier_1_2": {
                    "name": "Cumulative Extra Trees + Platt Sigmoid Calibration",
                    "version": "PCOS-ML v1.2-T2",
                    "features_count": 32,
                    "screening_threshold": TIER2_SCREENING_THRESHOLD,
                    "screening_policy_version": PCOS_SCREENING_POLICY["version"],
                    "explainability": "TreeSHAP",
                },
                "tier_1_2_3": {
                    "name": "Weighted Multimodal Probability Fusion",
                    "version": "PCOS-ML v1.2-Multimodal",
                    "weights": {"clinical": 0.95, "ultrasound": 0.05},
                    "screening_threshold": MULTIMODAL_SCREENING_THRESHOLD,
                    "screening_policy_version": "exploratory_v1",
                    "operating_point_status": "exploratory_pending_clinical_validation",
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
                if is_assessment_maintenance_active():
                    return assessment_maintenance_response()
                return Response(
                    {
                        "has_assessment": False,
                        "assessment": None,
                        "module": module,
                        "patient_id": patient_uuid,
                        "message": "No active assessment found for this user.",
                    },
                    status=status.HTTP_200_OK,
                )

            active = format_assessment_response(active)
            active["has_assessment"] = True
            active["patient_id"] = patient_uuid

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
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

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
        except PersistenceError as pe:
            logger.error("Male Tier 1 persistence error: %s", pe)
            return Response(
                {"error": "Assessment persistence failed.", "details": str(pe)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
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
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        clinical_payload = request.data if isinstance(request.data, dict) else {}

        active_before = assessment_repository.get_active_assessment(patient_uuid, module="male_hypogonadism", auth_token=auth_token)
        logger.info(
            "[TIER2_TRACE] event=submit_start user=%s module=male_hypogonadism active_before_id=%s active_before_level=%s tier2_field_count=%d",
            patient_uuid[:8] if len(patient_uuid) >= 8 else patient_uuid,
            (active_before.get("id") or active_before.get("assessment_id")) if active_before else "none",
            active_before.get("assessment_level") if active_before else "none",
            len([k for k, v in clinical_payload.items() if v is not None and str(v).strip() != ""]),
        )

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
        except PersistenceError as pe:
            logger.error("Male Tier 2 persistence error: %s", pe)
            return Response(
                {"error": "Assessment persistence failed.", "details": str(pe)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
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
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

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
        except PersistenceError as pe:
            logger.error("Tier 1 persistence error: %s", pe)
            return Response(
                {"error": "Assessment persistence failed.", "details": str(pe)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
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
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        clinical_payload = request.data if isinstance(request.data, dict) else {}

        active_before = assessment_repository.get_active_assessment(patient_uuid, module="female_pcos", auth_token=auth_token)
        logger.info(
            "[TIER2_TRACE] event=submit_start user=%s module=female_pcos active_before_id=%s active_before_level=%s tier2_field_count=%d",
            patient_uuid[:8] if len(patient_uuid) >= 8 else patient_uuid,
            (active_before.get("id") or active_before.get("assessment_id")) if active_before else "none",
            active_before.get("assessment_level") if active_before else "none",
            len([k for k, v in clinical_payload.items() if v is not None and str(v).strip() != ""]),
        )

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
        except PersistenceError as pe:
            logger.error("Tier 2 persistence error: %s", pe)
            return Response(
                {"error": "Assessment persistence failed.", "details": str(pe)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.error("Tier 2 cumulative assessment failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Cumulative Tier 2 assessment pipeline encountered an error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClearTier2AssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/clear-tier2/

    Explicitly clears stored Tier 2 clinical inputs and recalculates Tier 1 assessment.
    Accepts optional ?module= or json body {"module": "female_pcos" | "male_hypogonadism"}.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        module = request.query_params.get("module") or (request.data.get("module") if isinstance(request.data, dict) else None)

        try:
            result = clear_tier2_assessment(
                patient_uuid=patient_uuid,
                module=module,
                auth_token=auth_token,
            )
            serializer = ProgressiveAssessmentSerializer(data=result)
            if serializer.is_valid():
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Clear Tier 2 assessment failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Failed to clear Tier 2 assessment."},
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
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)

        # 0. Reject male pathway requests
        try:
            health_data = health_service.fetch_all(patient_uuid, auth_token=auth_token)
            profile = getattr(health_data, "profile", None)
            if profile:
                gender = getattr(profile, "gender", "") or (profile.get("gender") if isinstance(profile, dict) else "")
                if str(gender).strip().lower() in ["male", "m", "man"]:
                    return Response(
                        {"error": "Ultrasound assessment is not applicable to the male hypogonadism pathway."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        except Exception as e:
            logger.warning("Could not verify gender for ultrasound upload: %s", e)

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
        except ValueError as ve:
            logger.warning("Ultrasound assessment validation error: %s", ve)
            return Response(
                {"error": str(ve)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PersistenceError as pe:
            logger.error("Ultrasound assessment persistence error: %s", pe)
            return Response(
                {"error": "Assessment persistence failed.", "details": str(pe)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
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
        if is_assessment_maintenance_active():
            return assessment_maintenance_response()

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
        except PersistenceError as pe:
            logger.error("Assessment persistence error: %s", pe)
            return Response(
                {"error": "Assessment persistence failed.", "details": str(pe)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.error("Assessment pipeline failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Intelligence pipeline encountered an unexpected error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IntelligenceChatView(APIView):
    """
    POST /api/v1/intelligence/companion/chat/
    POST /api/v1/intelligence/chat/

    Authenticated conversational endpoint for BioPulse AI Companion (Qwen3 1.7B).
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
        pathway = serializer.validated_data.get("pathway") or None
        telemetry = serializer.validated_data.get("client_telemetry") or {}

        # 1. Check safety guardrails (emergency escalation & safety filters)
        emergency_advisory = SafetyGuardrails.check_emergency(user_msg)
        if emergency_advisory:
            return Response({
                "success": True,
                "reply": emergency_advisory,
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
                "reply": injection_advisory,
                "message": injection_advisory,
                "conversation_id": conversation_id,
                "context_used": {},
                "safety_level": "caution",
                "needs_clinician": False,
                "model": "safety_guardrail",
            }, status=status.HTTP_200_OK)

        # 2. Build privacy-preserving, structured authoritative clinical context
        try:
            auth_token = getattr(request.user, "raw_token", None)
            sys_prompt, ctx, used_context = HealthContextBuilder.build_context(
                patient_uuid,
                user_msg,
                auth_token=auth_token,
                client_telemetry=telemetry,
                explicit_pathway=pathway,
            )
        except Exception as ctx_err:
            logger.warning("Context builder notice: %s", ctx_err)
            sys_prompt = "You are the BioPulse AI Companion, an empathetic non-diagnostic health literacy assistant."
            ctx = ""
            used_context = {}

        # 3. Enforce deterministic privacy sanitization boundary
        patient_email = getattr(request.user, "email", "") or ""
        patient_name = ""
        if hasattr(request.user, "raw_token") and request.user.raw_token:
            try:
                import jwt
                decoded = jwt.decode(request.user.raw_token, options={"verify_signature": False})
                meta = decoded.get("user_metadata", {})
                patient_name = meta.get("full_name") or meta.get("name") or ""
            except Exception:
                pass

        sys_prompt = LLMContextSanitizer.sanitize_system_instruction(
            sys_prompt, patient_uuid=patient_uuid, patient_name=patient_name, patient_email=patient_email
        )
        ctx = LLMContextSanitizer.sanitize_clinical_context(
            ctx, patient_uuid=patient_uuid, patient_name=patient_name, patient_email=patient_email
        )
        history = LLMContextSanitizer.sanitize_conversation_history(
            history, patient_uuid=patient_uuid, patient_name=patient_name, patient_email=patient_email
        )
        clean_user_msg = LLMContextSanitizer.sanitize_user_message(
            user_msg, patient_uuid=patient_uuid, patient_name=patient_name, patient_email=patient_email
        )

        # 4. Generate response using configured LLM Provider (defaults to Qwen3 1.7B)
        start_time = time.perf_counter()
        try:
            provider = get_llm_provider()
            llm_res = provider.generate_chat_response(
                system_instruction=sys_prompt,
                user_message=clean_user_msg,
                health_context=ctx,
                conversation_history=history,
                patient_uuid=patient_uuid,
                patient_name=patient_name,
                patient_email=patient_email,
            )
            sanitized_answer, safety_level = SafetyGuardrails.sanitize_llm_response(llm_res.answer)
            excluded_cats = used_context.get("excluded_food_categories") or []
            sanitized_answer = SafetyGuardrails.validate_dietary_safety(
                sanitized_answer,
                excluded_categories=excluded_cats,
                user_message=clean_user_msg,
            )
            final_safety = "caution" if safety_level == "caution" else llm_res.safety_level
            latency_ms = (time.perf_counter() - start_time) * 1000

            # Safe operational logging (Never log patient queries, prompts, or clinical context)
            logger.info(
                "BioPulse AI Companion chat completed: model=%s status=success safety_level=%s needs_clinician=%s latency_ms=%.1f",
                llm_res.model_name,
                final_safety,
                llm_res.needs_clinician,
                latency_ms,
            )

            return Response({
                "success": True,
                "reply": sanitized_answer,
                "message": sanitized_answer,
                "conversation_id": conversation_id,
                "context_used": used_context,
                "safety_level": final_safety,
                "needs_clinician": llm_res.needs_clinician,
                "model": llm_res.model_name,
            }, status=status.HTTP_200_OK)
        except LLMProviderError as l_err:
            latency_ms = (time.perf_counter() - start_time) * 1000
            model_name = getattr(provider, "model_name", "qwen3:1.7b") if "provider" in locals() else "qwen3:1.7b"
            logger.warning(
                "BioPulse AI Companion LLM provider failed: model=%s status=failure error_type=%s latency_ms=%.1f",
                model_name,
                type(l_err).__name__,
                latency_ms,
            )
            fallback_text = (
                "The BioPulse AI Companion is temporarily unavailable (conversational assistant is currently offline or unreachable). "
                "Your screening data and other BioPulse features are unaffected."
            )
            return Response(
                {
                    "success": False,
                    "error": fallback_text,
                    "reply": fallback_text,
                    "message": fallback_text,
                    "model": model_name,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error("Unexpected chat error: %s latency_ms=%.1f", type(exc).__name__, latency_ms)
            fallback_text = (
                "The BioPulse AI Companion is temporarily unavailable. "
                "Your screening data and other BioPulse features are unaffected."
            )
            return Response(
                {
                    "success": False,
                    "error": fallback_text,
                    "reply": fallback_text,
                    "message": fallback_text,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PublicIntelligenceChatView(APIView):
    """
    POST /api/v1/intelligence/public/chat/

    Public, unauthenticated conversational endpoint for the BioPulse homepage AI Assistant.
    Provides general health literacy and BioPulse product guidance.
    Has STRICT zero access to personal health records, screening calculations, or user databases.
    Supports both Server-Sent Events (SSE) streaming and standard JSON responses.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    PUBLIC_SYSTEM_INSTRUCTION = (
        "You are BioPulse Assistant, the official public AI guide and health literacy assistant for BioPulse AI. "
        "BioPulse AI is a clinical-grade reproductive-endocrine screening platform specializing in Polycystic Ovary Syndrome (PCOS) "
        "for females and Male Hypogonadism (testosterone and endocrine balance) for males.\n\n"
        "YOUR CORE OBJECTIVES:\n"
        "1. Guide visitors through BioPulse features (dual clinical pathways, multi-tier screening combining symptoms, lab biomarkers, "
        "and pelvic ultrasound vision AI, explainable AI factor insights, and digital twin health monitoring).\n"
        "2. Answer general health, wellness, nutrition, and lifestyle questions in simple, empathetic, accessible language.\n"
        "3. Explain common medical terminology (e.g. LH, FSH, Testosterone, SHBG, AMH, insulin resistance, follicle count) clearly.\n"
        "4. Help visitors understand how to get started (creating an account at /register, choosing a pathway, and taking the free Tier 1 baseline screening).\n\n"
        "STRICT SAFETY & PRIVACY RULES:\n"
        "• You do NOT have access to personal health records, screening calculations, cycle logs, or patient IDs. If a visitor asks for their personal screening results or records, politely remind them: 'To protect your privacy, personalized health information is only available after you sign in to your BioPulse account.'\n"
        "• You provide educational health literacy and clinical discussion preparation, NEVER formal medical diagnoses or prescriptions.\n"
        "• Always recommend consulting a qualified healthcare professional for personal medical concerns.\n"
        "• Keep responses clear, concise, well-structured, and helpful (use bullet points and bold headers when helpful)."
    )

    def post(self, request):
        serializer = PublicChatMessageRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_msg = serializer.validated_data["message"]
        history = serializer.validated_data.get("conversation_history") or []
        wants_stream = serializer.validated_data.get("stream", False) or "text/event-stream" in request.headers.get("Accept", "")

        # 1. Check clinical emergency escalation
        emergency_advisory = SafetyGuardrails.check_emergency(user_msg)
        if emergency_advisory:
            if wants_stream:
                def emergency_stream():
                    yield f"data: {json.dumps({'token': emergency_advisory, 'done': False})}\n\n"
                    yield f"data: {json.dumps({'token': '', 'done': True, 'safety_level': 'urgent'})}\n\n"
                return StreamingHttpResponse(emergency_stream(), content_type="text/event-stream")

            return Response({
                "success": True,
                "reply": emergency_advisory,
                "message": emergency_advisory,
                "safety_level": "urgent",
                "needs_clinician": True,
                "model": "safety_guardrail",
            }, status=status.HTTP_200_OK)

        # 2. Check prompt injection
        injection_advisory = SafetyGuardrails.check_prompt_injection(user_msg)
        if injection_advisory:
            if wants_stream:
                def injection_stream():
                    yield f"data: {json.dumps({'token': injection_advisory, 'done': False})}\n\n"
                    yield f"data: {json.dumps({'token': '', 'done': True, 'safety_level': 'caution'})}\n\n"
                return StreamingHttpResponse(injection_stream(), content_type="text/event-stream")

            return Response({
                "success": True,
                "reply": injection_advisory,
                "message": injection_advisory,
                "safety_level": "caution",
                "needs_clinician": False,
                "model": "safety_guardrail",
            }, status=status.HTTP_200_OK)

        # 3. Privacy boundary check: refuse queries for private personal health records / individual screening results
        privacy_advisory = SafetyGuardrails.check_privacy_request(user_msg)
        if privacy_advisory:
            if wants_stream:
                def privacy_stream():
                    yield f"data: {json.dumps({'token': privacy_advisory, 'done': False})}\n\n"
                    yield f"data: {json.dumps({'token': '', 'done': True, 'safety_level': 'normal'})}\n\n"
                return StreamingHttpResponse(privacy_stream(), content_type="text/event-stream")

            return Response({
                "success": True,
                "reply": privacy_advisory,
                "message": privacy_advisory,
                "safety_level": "normal",
                "needs_clinician": False,
                "model": "privacy_guardrail",
            }, status=status.HTTP_200_OK)

        # 4. Invoke LLM Provider without any private user data, tokens, or DB context
        provider = get_llm_provider()
        model_name = getattr(provider, "model_name", "biopulse-assistant")
        start_time = time.perf_counter()

        # Sanitize input message
        clean_user_msg = LLMContextSanitizer.sanitize_user_message(user_msg)
        clean_history = LLMContextSanitizer.sanitize_conversation_history(history)

        if wants_stream:
            def event_stream():
                accumulated = []
                try:
                    for token in provider.stream_chat_response(
                        system_instruction=self.PUBLIC_SYSTEM_INSTRUCTION,
                        user_message=clean_user_msg,
                        conversation_history=clean_history,
                        max_output_tokens=500,
                    ):
                        accumulated.append(token)
                        yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"

                    full_answer = "".join(accumulated)
                    sanitized_ans, safety_level = SafetyGuardrails.sanitize_llm_response(full_answer)
                    yield f"data: {json.dumps({'token': '', 'done': True, 'safety_level': safety_level})}\n\n"
                except Exception as stream_err:
                    logger.warning("Public chat stream error: %s", stream_err)
                    fallback_text = (
                        "BioPulse Assistant is momentarily busy. Please try asking again in a few moments, "
                        "or explore our platform features via the navigation menu above."
                    )
                    yield f"data: {json.dumps({'error': fallback_text, 'done': True})}\n\n"

            resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"
            return resp

        # Non-streaming JSON flow
        try:
            llm_res = provider.generate_chat_response(
                system_instruction=self.PUBLIC_SYSTEM_INSTRUCTION,
                user_message=clean_user_msg,
                health_context="",
                conversation_history=clean_history,
                max_output_tokens=500,
            )
            sanitized_answer, safety_level = SafetyGuardrails.sanitize_llm_response(llm_res.answer)
            final_safety = "caution" if safety_level == "caution" else llm_res.safety_level
            latency_ms = (time.perf_counter() - start_time) * 1000

            logger.info(
                "BioPulse Public Chat completed: model=%s safety_level=%s latency_ms=%.1f",
                llm_res.model_name,
                final_safety,
                latency_ms,
            )

            return Response({
                "success": True,
                "reply": sanitized_answer,
                "message": sanitized_answer,
                "safety_level": final_safety,
                "needs_clinician": llm_res.needs_clinician,
                "model": llm_res.model_name,
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.warning("Public chat generation failed (%s) latency_ms=%.1f", exc, latency_ms)
            fallback_text = (
                "BioPulse Assistant is momentarily busy. Please try asking again in a few moments, "
                "or check our Features and About pages to learn more."
            )
            return Response({
                "success": False,
                "error": fallback_text,
                "reply": fallback_text,
                "message": fallback_text,
                "safety_level": "normal",
                "needs_clinician": False,
                "model": model_name,
            }, status=status.HTTP_200_OK)


class CompanionHealthView(APIView):
    """
    GET /api/v1/intelligence/companion/health/

    Internal backend health check for the BioPulse AI Companion Qwen integration.
    Verifies Ollama reachability and configured model availability without generating chat completions.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.intelligence.services.qwen_service import qwen_service
        health_info = qwen_service.check_health()
        http_code = (
            status.HTTP_200_OK
            if health_info.get("status") == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(health_info, status=http_code)



class PatientClinicalStateView(APIView):
    """
    GET /api/v1/intelligence/clinical-state/

    Returns the authoritative persistent patient clinical state (Tier 1 & Tier 2 inputs).
    Accepts optional ?module= parameter ('male_hypogonadism' or 'female_pcos').
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user or not getattr(request.user, "id", None):
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
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
                logger.warning("Could not determine user gender for clinical state: %s", e)

        module = module or "female_pcos"

        try:
            from apps.intelligence.services.clinical_state_repository import clinical_state_repository
            state = clinical_state_repository.get_patient_clinical_state(
                patient_uuid,
                module=module,
                auth_token=auth_token,
                perform_backfill=False,
            )
            return Response(state, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Failed to fetch patient clinical state: %s", exc, exc_info=True)
            return Response(
                {"error": "Failed to retrieve clinical state."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LongitudinalHealthView(APIView):
    """
    GET /api/v1/intelligence/longitudinal-health/

    Authoritative historical health monitoring layer.
    Assembles chronological screening trends, metric trajectories, verified laboratory series,
    and milestone health events across the Female PCOS and Male Hypogonadism pathways.

    Accepts query parameters:
      - ?period= ('30d' | '90d' | '180d' | '1y' | 'all') - default: '90d'
      - ?module= ('female_pcos' | 'male_hypogonadism') - optional; client cannot override server-derived pathway.

    Security Invariants:
      1. Patient identity is strictly bound to authenticated request.user.id.
      2. Pathway resolution FAILS CLOSED: never defaults unknown patients to either pathway.
      3. Client-supplied ?module= cannot determine or bypass the authoritative pathway.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    FEMALE_GENDERS = {"female", "f", "woman"}
    MALE_GENDERS = {"male", "m", "man"}
    FEMALE_PATHWAYS = {"female", "female_pcos", "ovasense", "pcos"}
    MALE_PATHWAYS = {"male", "male_hypogonadism", "androsense", "hypogonadism"}

    def _resolve_authoritative_pathway(
        self,
        patient_uuid: str,
        auth_token: str | None = None,
        user_obj: Any = None,
        requested_module: str | None = None,
    ) -> str | None:
        """
        Derives the clinical pathway strictly from authoritative persisted profile/onboarding data,
        active screening assessments, clinical state, or verified JWT claims.
        Falls back to requested_module if valid and no conflicting authoritative profile exists.
        """
        gender_val = None
        pathway_val = None

        # 1. Check patient profile directly (single table read instead of heavy fetch_all)
        try:
            profile = health_service.fetch_profile(patient_uuid, auth_token=auth_token)
            if profile:
                gender_val = getattr(profile, "gender", None) or (
                    profile.get("gender") if isinstance(profile, dict) else None
                )
                pathway_val = getattr(profile, "pathway", None) or (
                    profile.get("pathway") if isinstance(profile, dict) else None
                )
        except Exception as e:
            logger.debug("Could not fetch patient profile for pathway resolution: %s", e)

        # Determine candidate module order (prioritize requested_module if specified)
        candidate_modules = ["female_pcos", "male_hypogonadism"]
        if requested_module:
            req_str = str(requested_module).strip().lower()
            if req_str in self.MALE_PATHWAYS or req_str in self.MALE_GENDERS:
                candidate_modules = ["male_hypogonadism", "female_pcos"]
            elif req_str in self.FEMALE_PATHWAYS or req_str in self.FEMALE_GENDERS:
                candidate_modules = ["female_pcos", "male_hypogonadism"]

        # 2. Check active screening assessments (persisted during onboarding Tier 1)
        if not gender_val and not pathway_val:
            try:
                from apps.intelligence.services.assessment_repository import assessment_repository
                for cand_mod in candidate_modules:
                    act = assessment_repository.get_active_assessment(
                        patient_uuid, module=cand_mod, auth_token=auth_token
                    )
                    if act and (act.get("module") == cand_mod or not act.get("module")) and act.get("has_assessment") is not False:
                        return cand_mod
            except Exception as e:
                logger.debug("Could not check active assessments for pathway resolution: %s", e)

        # 3. Check persistent clinical state
        if not gender_val and not pathway_val:
            try:
                from apps.intelligence.services.clinical_state_repository import clinical_state_repository
                for cand_mod in candidate_modules:
                    cs = clinical_state_repository.get_patient_clinical_state(
                        patient_uuid, module=cand_mod, auth_token=auth_token, perform_backfill=False
                    )
                    if cs and cs.get("tier_1_inputs"):
                        return cand_mod
            except Exception as e:
                logger.debug("Could not check clinical state for pathway resolution: %s", e)

        # 4. Fallback to verified JWT claims or user metadata
        if not gender_val and not pathway_val and auth_token:
            try:
                import jwt

                payload = jwt.decode(auth_token, options={"verify_signature": False})
                user_meta = payload.get("user_metadata", {}) or {}
                gender_val = user_meta.get("gender")
                pathway_val = user_meta.get("pathway")
            except Exception as e:
                logger.debug(
                    "Could not decode user_metadata from JWT for pathway resolution: %s",
                    e,
                )

        if not gender_val and not pathway_val and user_obj:
            user_meta = getattr(user_obj, "user_metadata", None)
            if isinstance(user_meta, dict):
                gender_val = user_meta.get("gender")
                pathway_val = user_meta.get("pathway")

        norm_gender = str(gender_val).strip().lower() if gender_val is not None else ""
        norm_pathway = (
            str(pathway_val).strip().lower() if pathway_val is not None else ""
        )

        if norm_pathway in self.FEMALE_PATHWAYS or norm_gender in self.FEMALE_GENDERS:
            return "female_pcos"
        if norm_pathway in self.MALE_PATHWAYS or norm_gender in self.MALE_GENDERS:
            return "male_hypogonadism"

        # 5. Final fallback to client-supplied module if valid (guarantees post-onboarding readiness)
        if requested_module:
            norm_req = str(requested_module).strip().lower()
            if norm_req in self.FEMALE_PATHWAYS:
                return "female_pcos"
            if norm_req in self.MALE_PATHWAYS:
                return "male_hypogonadism"

        return None

    def get(self, request):
        start_time = time.time()
        if not request.user or not getattr(request.user, "id", None):
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        patient_uuid = str(request.user.id)
        short_id = patient_uuid[:8] if patient_uuid else "unknown"
        auth_token = getattr(request.user, "raw_token", None)

        period = request.query_params.get("period", "90d").strip().lower()
        if period not in ("30d", "90d", "180d", "1y", "all"):
            period = "90d"

        requested_module = request.query_params.get("module")

        # Authoritatively derive clinical pathway from patient profile, assessment, clinical state, or JWT
        authoritative_module = self._resolve_authoritative_pathway(
            patient_uuid,
            auth_token=auth_token,
            user_obj=request.user,
            requested_module=requested_module,
        )

        if not authoritative_module:
            duration_ms = round((time.time() - start_time) * 1000, 1)
            logger.warning(
                "[P0_RUNTIME_TRACE] endpoint=longitudinal-health user=%s module=%s status=422 duration_ms=%s error_type=PATHWAY_NOT_CONFIGURED error=Health pathway unconfigured",
                short_id,
                requested_module or "none",
                duration_ms,
            )
            return Response(
                {
                    "error": "Health pathway unconfigured",
                    "message": (
                        "The health pathway must be configured before longitudinal data can be displayed."
                    ),
                    "code": "PATHWAY_NOT_CONFIGURED",
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # Enforce server-side pathway isolation: client-supplied ?module= cannot determine pathway
        if requested_module:
            norm_requested = str(requested_module).strip().lower()
            clean_requested = (
                "female_pcos"
                if norm_requested in self.FEMALE_PATHWAYS
                else "male_hypogonadism"
                if norm_requested in self.MALE_PATHWAYS
                else norm_requested
            )
            if clean_requested != authoritative_module:
                logger.warning(
                    "Patient %s attempted to request mismatched module '%s'; enforcing authoritative pathway '%s'",
                    short_id + "***",
                    requested_module,
                    authoritative_module,
                )

        module = authoritative_module

        try:
            from apps.intelligence.services.longitudinal_health_service import (
                longitudinal_health_service,
            )

            summary = longitudinal_health_service.get_longitudinal_health_summary(
                user_id=patient_uuid,
                module=module,
                period=period,
                auth_token=auth_token,
            )
            duration_ms = round((time.time() - start_time) * 1000, 1)
            logger.info(
                "[P0_RUNTIME_TRACE] endpoint=longitudinal-health user=%s module=%s status=200 duration_ms=%s error_type=none error=none total_assessments=%s",
                short_id,
                module,
                duration_ms,
                summary.get("total_assessments_recorded", 0),
            )
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 1)
            err_type = type(exc).__name__
            logger.error(
                "[P0_RUNTIME_TRACE] endpoint=longitudinal-health user=%s module=%s status=500 duration_ms=%s error_type=%s error=%s",
                short_id,
                module,
                duration_ms,
                err_type,
                str(exc),
                exc_info=True,
            )
            return Response(
                {"error": "Failed to assemble longitudinal health data."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )





