"""
backend/apps/intelligence/views_lifestyle.py

DRF Views for BioPulse AI Dynamic Lifestyle Recommendations API.
Endpoints:
- GET   /api/v1/intelligence/lifestyle-recommendations/
- POST  /api/v1/intelligence/lifestyle-recommendations/
- PATCH /api/v1/intelligence/lifestyle-recommendations/status/
- POST  /api/v1/intelligence/lifestyle-recommendations/status/

Guarantees:
- Context fingerprinting prevents redundant re-evaluations on simple page refresh.
- Fresh patient state changes (weight, BMI, symptoms, labs, screening tier) automatically trigger re-evaluation.
- Recommendations persist in Supabase (with SQLite local fallback).
- User adherence actions (START, COMPLETE, SKIP) persist across sessions.
- 100% decoupling from legacy Meal Directory.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.intelligence.services.lifestyle_context_builder import LifestyleContextBuilder
from apps.intelligence.services.lifestyle_repository import lifestyle_repository
from apps.intelligence.services.lifestyle_safety_rules import LifestyleSafetyEngine
from apps.intelligence.services.lifestyle_recommendation_engine import LifestyleRecommendationEngine

logger = logging.getLogger(__name__)


def _extract_auth_token(request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None


class LifestyleRecommendationsView(APIView):
    """
    Authoritative API endpoint delivering dynamically generated, personalized
    lifestyle recommendations across Nutrition, Fitness, and Lifestyle pillars.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        user_id = str(request.user.id)
        raw_module = request.query_params.get("module")
        auth_token = _extract_auth_token(request)
        force_refresh = request.query_params.get("refresh", "").lower() in ("true", "1")

        try:
            canonical_module = LifestyleContextBuilder.normalize_module(raw_module)

            # 1. Fast path: Check persistent repository for active recommendations + lightweight freshness verification
            if not force_refresh:
                cached_record = lifestyle_repository.get_active_recommendations(
                    user_id=user_id,
                    module=canonical_module,
                    auth_token=auth_token,
                )
                if cached_record:
                    is_fresh, freshness_reason = LifestyleContextBuilder.is_cache_fresh(
                        user_id=user_id,
                        canonical_module=canonical_module,
                        cached_record=cached_record,
                        auth_token=auth_token,
                    )
                    if is_fresh:
                        payload = cached_record.get("payload")
                        if payload and isinstance(payload, dict):
                            logger.info(
                                "Returning verified fresh recommendations for user %s (version %s)",
                                user_id[:8],
                                cached_record.get("context_version", ""),
                            )
                            return Response(payload, status=status.HTTP_200_OK)
                    else:
                        logger.info(
                            "Cache stale for user %s (%s). Rebuilding full context and regenerating...",
                            user_id[:8],
                            freshness_reason,
                        )

            # 2. Context changed, uncached, stale, or force_refresh -> Build Comprehensive Context
            context = LifestyleContextBuilder.build_context(
                user_id=user_id,
                module=canonical_module,
                auth_token=auth_token,
            )
            canonical_module = context.demographics.pathway
            current_version = context.context_version

            # 3. Evaluate Clinical Safety & Boundaries
            safety = LifestyleSafetyEngine.evaluate_safety(context)

            # 4. Generate Synchronized Recommendations
            recommendations_result = LifestyleRecommendationEngine.generate(context, safety)
            payload = recommendations_result.to_dict()

            # Embed lightweight freshness signature for subsequent O(1) checks (<50ms)
            freshness_inputs = LifestyleContextBuilder.extract_freshness_inputs_from_context(context)
            freshness_fingerprint = LifestyleContextBuilder.compute_freshness_fingerprint(freshness_inputs)
            payload["freshness_fingerprint"] = freshness_fingerprint
            payload["freshness_inputs"] = freshness_inputs

            # Preserve previously recorded item adherence statuses if any
            existing_record = lifestyle_repository.get_active_recommendations(
                user_id=user_id,
                module=canonical_module,
                auth_token=auth_token,
            )
            item_statuses = existing_record.get("item_statuses") if existing_record else {}

            # 5. Persist to Supabase / SQLite repository
            lifestyle_repository.save_recommendations(
                user_id=user_id,
                module=canonical_module,
                context_version=current_version,
                payload=payload,
                item_statuses=item_statuses,
                auth_token=auth_token,
            )

            return Response(payload, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Error generating lifestyle recommendations for user %s: %s", user_id[:8], e, exc_info=True)
            return Response(
                {
                    "error": "Failed to generate personalized lifestyle recommendations.",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request) -> Response:
        """
        Interactive preview or preference override endpoint.
        Allows testing tailored recommendations with simulated dietary or lifestyle parameters.
        """
        user_id = str(request.user.id)
        raw_module = request.data.get("module") or request.query_params.get("module")
        auth_token = _extract_auth_token(request)

        try:
            context = LifestyleContextBuilder.build_context(
                user_id=user_id,
                module=raw_module,
                auth_token=auth_token,
            )

            # Apply user overrides from POST body if provided
            if "dietary_preference" in request.data:
                context.demographics.dietary_preference = str(request.data["dietary_preference"]).lower()
            if "activity_level" in request.data:
                context.demographics.activity_level = str(request.data["activity_level"]).lower()
            if "allergens" in request.data and isinstance(request.data["allergens"], list):
                context.demographics.allergens = [str(a).lower() for a in request.data["allergens"]]

            safety = LifestyleSafetyEngine.evaluate_safety(context)
            recommendations = LifestyleRecommendationEngine.generate(context, safety)

            return Response(recommendations.to_dict(), status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Error simulating lifestyle recommendations for user %s: %s", user_id[:8], e, exc_info=True)
            return Response(
                {
                    "error": "Failed to simulate lifestyle recommendations.",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LifestyleRecommendationStatusView(APIView):
    """
    Authoritative API endpoint for recording patient adherence actions on recommendation items
    (e.g., ACTIVE, COMPLETED, SKIPPED, MAINTAIN).
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request) -> Response:
        return self._handle_update(request)

    def post(self, request) -> Response:
        return self._handle_update(request)

    def _handle_update(self, request) -> Response:
        user_id = str(request.user.id)
        raw_module = request.data.get("module") or request.query_params.get("module")
        rec_id = request.data.get("recommendation_id") or request.data.get("id")
        new_status = request.data.get("status")
        note = request.data.get("note", "")
        auth_token = _extract_auth_token(request)

        if not rec_id:
            return Response({"error": "recommendation_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not new_status:
            return Response({"error": "status is required."}, status=status.HTTP_400_BAD_REQUEST)

        canonical_module = LifestyleContextBuilder.normalize_module(raw_module)

        try:
            updated = lifestyle_repository.update_item_status(
                user_id=user_id,
                module=canonical_module,
                recommendation_id=str(rec_id),
                new_status=str(new_status),
                note=str(note),
                auth_token=auth_token,
            )
            if not updated:
                return Response(
                    {"error": "No active recommendations found for this user and pathway."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(updated, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Error updating recommendation status for user %s: %s", user_id[:8], e, exc_info=True)
            return Response(
                {"error": "Failed to update recommendation status.", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
