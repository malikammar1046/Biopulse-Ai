"""
backend/apps/intelligence/views_lifestyle.py

DRF Views for BioPulse AI Dynamic Lifestyle Recommendations API.
Endpoint:
- GET  /api/v1/intelligence/lifestyle-recommendations/
- POST /api/v1/intelligence/lifestyle-recommendations/

Guarantees 100% decoupling from legacy Meal Directory.
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
        module = request.query_params.get("module")
        auth_token = _extract_auth_token(request)

        try:
            # 1. Build Comprehensive Context
            context = LifestyleContextBuilder.build_context(
                user_id=user_id,
                module=module,
                auth_token=auth_token,
            )

            # 2. Evaluate Clinical Safety & Boundaries
            safety = LifestyleSafetyEngine.evaluate_safety(context)

            # 3. Generate Synchronized Recommendations
            recommendations = LifestyleRecommendationEngine.generate(context, safety)

            return Response(recommendations.to_dict(), status=status.HTTP_200_OK)

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
        module = request.data.get("module") or request.query_params.get("module")
        auth_token = _extract_auth_token(request)

        try:
            context = LifestyleContextBuilder.build_context(
                user_id=user_id,
                module=module,
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
