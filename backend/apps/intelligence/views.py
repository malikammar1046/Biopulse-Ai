"""
OvaSense Intelligence API — DRF Views.

Endpoints:
  GET  /api/v1/intelligence/status/     — Public service status & real model metadata
  GET  /api/v1/intelligence/health/     — Authenticated normalised health snapshot
  POST /api/v1/intelligence/assessment/ — Authenticated screening assessment & TreeSHAP
"""

import logging
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.intelligence.serializers import AssessmentSerializer
from apps.intelligence.services.intelligence_orchestrator import (
    get_health_snapshot,
    run_assessment,
)
from apps.intelligence.services.ovasense_ml_bridge import ovasense_ml_bridge

logger = logging.getLogger(__name__)


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
        model_ready = ovasense_ml_bridge.is_ready
        meta = ovasense_ml_bridge.metadata if model_ready else {}

        return Response({
            "status": "ok",
            "service": "OvaSense Intelligence API",
            "model": {
                "name": meta.get("model_name", "OvaSense Extra Trees (Screening Tuned)"),
                "version": meta.get("model_version", "1.0.0-phase3"),
                "algorithm": meta.get("classifier", "ExtraTreesClassifier"),
                "framework": meta.get("framework", "scikit-learn"),
                "feature_count": meta.get("feature_count", 16),
                "screening_threshold": meta.get("screening_threshold", 0.38),
                "shap_enabled": True,
                "ready": model_ready,
            },
            "disclaimer": meta.get("clinical_safety_warning", ""),
        })


class IntelligenceHealthView(APIView):
    """
    GET /api/v1/intelligence/health/

    Returns a normalised health snapshot for the authenticated patient.
    Does NOT run ML inference.
    """
    authentication_classes = [SupabaseAuthentication]

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


class IntelligenceAssessmentView(APIView):
    """
    POST /api/v1/intelligence/assessment/

    Runs full data-retrieval, 16-feature mapping, Joblib ML inference, and TreeSHAP.
    Requires Supabase Bearer JWT authentication.
    Derives patient identity strictly from verified token (request.user.id).
    """
    authentication_classes = [SupabaseAuthentication]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)
        client_payload = request.data if isinstance(request.data, dict) else {}
        logger.info(
            "Assessment requested for authenticated patient %s (client payload keys: %s)",
            patient_uuid[:8] + "***",
            list(client_payload.keys()),
        )

        try:
            result = run_assessment(
                patient_uuid,
                auth_token=auth_token,
                client_health_data=client_payload,
            )
        except Exception as exc:
            logger.error("Assessment pipeline failed: %s", exc, exc_info=True)
            return Response(
                {"error": "Intelligence pipeline encountered an unexpected error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data_to_serialize = {
            "risk_category": result.risk_category,
            "risk_category_description": result.risk_category_description,
            "pcos_probability": result.pcos_probability,
            "non_pcos_probability": result.non_pcos_probability,
            "screening_threshold": result.screening_threshold,
            "is_higher_risk": result.is_higher_risk,
            "confidence": result.confidence,
            "probabilities": result.probabilities,
            "data_quality": result.data_quality,
            "explanations": result.explanations,
            "model_metadata": result.model_metadata,
            "disclaimer": result.disclaimer,
            "shap_enabled": result.shap_enabled,
            "backend_mode": result.backend_mode,
            "fetch_errors": result.fetch_errors,
            "risk_pattern": result.risk_pattern,
            "risk_pattern_description": result.risk_pattern_description,
        }

        serializer = AssessmentSerializer(data=data_to_serialize)

        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        else:
            logger.error("Serializer validation error: %s", serializer.errors)
            return Response(
                {"error": "Response serialization error.", "details": serializer.errors},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


import time
import uuid
from apps.intelligence.serializers import (
    ChatMessageRequestSerializer,
    ChatMessageResponseSerializer,
)
from apps.intelligence.services.health_context_builder import HealthContextBuilder
from apps.intelligence.services.llm_provider import get_llm_provider
from apps.intelligence.services.safety_guardrails import SafetyGuardrails


class IntelligenceChatView(APIView):
    """
    POST /api/v1/intelligence/chat/

    Authenticated conversational intelligence endpoint.
    Derives patient UUID strictly from the verified Supabase JWT (request.user.id).
    Runs safety checks, aggregates patient context across trust tiers,
    and returns a structured, non-diagnostic response.
    """
    authentication_classes = [SupabaseAuthentication]

    def post(self, request):
        patient_uuid = str(request.user.id)
        auth_token = getattr(request.user, "raw_token", None)

        req_serializer = ChatMessageRequestSerializer(data=request.data)
        if not req_serializer.is_valid():
            return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = req_serializer.validated_data["message"]
        conversation_id = req_serializer.validated_data.get("conversation_id") or str(uuid.uuid4())
        conversation_history = req_serializer.validated_data.get("conversation_history", [])

        t0 = time.perf_counter()

        # 1. Immediate emergency red-flag escalation
        emergency_advisory = SafetyGuardrails.check_emergency(user_message)
        if emergency_advisory:
            logger.info("Chat: Emergency red flag triggered for patient %s", patient_uuid[:8] + "***")
            resp_data = {
                "success": True,
                "message": emergency_advisory,
                "conversation_id": conversation_id,
                "context_used": {
                    "profile": False,
                    "cycle": False,
                    "symptoms": True,
                    "reports": False,
                    "diet": False,
                    "fitness": False,
                    "medications": False,
                    "ml_screening": False,
                },
                "safety_level": "urgent",
                "needs_clinician": True,
                "model": "safety-escalation-guard",
            }
            return Response(ChatMessageResponseSerializer(resp_data).data, status=status.HTTP_200_OK)

        # 2. Prompt injection defense
        injection_refusal = SafetyGuardrails.check_prompt_injection(user_message)
        if injection_refusal:
            logger.info("Chat: Prompt injection attempt repelled for patient %s", patient_uuid[:8] + "***")
            resp_data = {
                "success": True,
                "message": injection_refusal,
                "conversation_id": conversation_id,
                "context_used": {
                    "profile": False,
                    "cycle": False,
                    "symptoms": False,
                    "reports": False,
                    "diet": False,
                    "fitness": False,
                    "medications": False,
                    "ml_screening": False,
                },
                "safety_level": "caution",
                "needs_clinician": False,
                "model": "safety-injection-guard",
            }
            return Response(ChatMessageResponseSerializer(resp_data).data, status=status.HTTP_200_OK)

        # 3. Assemble selective health context
        system_prompt, health_context, context_used = HealthContextBuilder.build_context(
            patient_uuid=patient_uuid,
            user_message=user_message,
            auth_token=auth_token,
        )

        # 4. Generate response via configured LLM provider
        provider = get_llm_provider()
        llm_resp = provider.generate_chat_response(
            system_instruction=system_prompt,
            user_message=user_message,
            health_context=health_context,
            conversation_history=conversation_history,
        )

        # 5. Sanitize output against non-diagnostic constraints
        clean_text, safety_level = SafetyGuardrails.sanitize_llm_response(llm_resp.answer)

        elapsed = time.perf_counter() - t0
        logger.info(
            "Chat response completed for patient %s in %.2fs (provider: %s, safety: %s)",
            patient_uuid[:8] + "***",
            elapsed,
            llm_resp.model_name,
            safety_level,
        )

        resp_data = {
            "success": True,
            "message": clean_text,
            "conversation_id": conversation_id,
            "context_used": context_used,
            "safety_level": safety_level,
            "needs_clinician": llm_resp.needs_clinician,
            "model": llm_resp.model_name,
        }

        serializer = ChatMessageResponseSerializer(resp_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
