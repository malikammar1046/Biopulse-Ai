"""
backend/apps/health/views_nutrition.py

Django REST Framework Views for BioPulse Nutrition & Meal Planning API:
1. GET  /api/v1/health/nutrition/readiness/
2. GET  /api/v1/health/nutrition/targets/
3. POST /api/v1/health/nutrition/plan/weekly/
4. GET  /api/v1/health/nutrition/plan/current/
5. GET  /api/v1/health/nutrition/plan/history/
6. GET  /api/v1/health/nutrition/plan/<uuid:plan_id>/
7. POST /api/v1/health/nutrition/plan/regenerate/

Security Guarantees:
- Authentication: SupabaseAuthentication + IsAuthenticated.
- Identity: Exclusively request.user.id (from verified Supabase JWT).
- Never trusts request.data.user_id or query parameter user_id.
- User A cannot retrieve, regenerate, or view User B's plan.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple

import jwt
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.supabase_auth import SupabaseAuthentication
from apps.health.serializers_nutrition import (
    NutritionPreferencesSerializer,
    NutritionReadinessSerializer,
    NutritionTargetsSerializer,
    PlanHistoryItemSerializer,
    WeeklyNutritionPlanSerializer,
)
from apps.health.services.meal_plan_service import (
    NutritionReadinessException,
    meal_plan_service,
)
from apps.health.nutrition_vocabularies import (
    normalize_food_allergens,
    normalize_food_intolerances,
    normalize_dietary_pattern,
    normalize_ingredient_name,
)
from apps.health.services.meal_profile_builder import MealProfileBuilder
from apps.health.services.supabase_health_service import health_service

logger = logging.getLogger(__name__)


def _extract_user_context(request) -> Tuple[Dict[str, Any], Dict[str, Any], Optional[str]]:
    """
    Extracts raw auth user metadata, Supabase profile record, and active assessment module.
    Always scopes strictly to request.user.id.
    """
    user_id = str(request.user.id)
    raw_user_meta: Dict[str, Any] = {}

    # 1. User metadata from JWT payload
    raw_token = getattr(request.user, "raw_token", "")
    if raw_token:
        try:
            payload = jwt.decode(raw_token, options={"verify_signature": False})
            raw_user_meta = payload.get("user_metadata", {}) or {}
        except Exception as exc:
            logger.debug("Failed to decode user_metadata from raw_token: %s", exc)

    # 2. Supabase profile record (including allergies, dietary_preference, biometrics)
    profile_data: Dict[str, Any] = {}
    client = None
    try:
        client = health_service._client_or_raise(auth_token=raw_token)
    except Exception:
        pass

    if client is not None:
        try:
            res = client.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
            if res.data:
                profile_data = res.data
        except Exception as exc:
            logger.debug("Could not fetch profile from Supabase: %s", exc)

    # 3. Active assessment module check (PCOS vs Male Hypogonadism)
    active_assessment_module: Optional[str] = None
    pathway_hint = (
        raw_user_meta.get("pathway")
        or profile_data.get("pathway", "")
    )
    clean_pathway = str(pathway_hint).strip().lower()

    try:
        from apps.intelligence.services.assessment_repository import assessment_repository
        if clean_pathway in ("female", "female_pcos"):
            pcos_active = assessment_repository.get_active_assessment(user_id, module="female_pcos", auth_token=raw_token or None)
            if pcos_active:
                active_assessment_module = "female_pcos"
        elif clean_pathway in ("male", "male_hypogonadism"):
            male_active = assessment_repository.get_active_assessment(user_id, module="male_hypogonadism", auth_token=raw_token or None)
            if male_active:
                active_assessment_module = "male_hypogonadism"
    except Exception as exc:
        logger.debug("Assessment repository lookup error: %s", exc)

    return raw_user_meta, profile_data, active_assessment_module


class NutritionReadinessView(APIView):
    """
    GET /api/v1/health/nutrition/readiness/
    Checks whether user biometrics and safety confirmations are complete for meal planning.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        raw_meta, profile_data, _ = _extract_user_context(request)
        readiness = meal_plan_service.check_user_readiness(raw_meta, profile_data)
        serializer = NutritionReadinessSerializer(data=readiness)
        serializer.is_valid()
        return Response(readiness, status=status.HTTP_200_OK)


class NutritionTargetsView(APIView):
    """
    GET /api/v1/health/nutrition/targets/
    Computes Phase 5A neutral targets and Phase 5B condition profile.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_meta, profile_data, active_module = _extract_user_context(request)

        try:
            targets_dto = meal_plan_service.get_nutrition_targets(
                user_id=user_id,
                raw_user_meta_data=raw_meta,
                profile_data=profile_data,
                active_assessment_module=active_module,
            )
            serializer = NutritionTargetsSerializer(data=targets_dto)
            serializer.is_valid()
            return Response(targets_dto, status=status.HTTP_200_OK)
        except NutritionReadinessException as exc:
            return Response(
                {
                    "error": "Profile is not ready for automated nutrition planning.",
                    "readiness": exc.readiness_result,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error("Error calculating nutrition targets for %s: %s", user_id[:8] + "***", exc)
            return Response(
                {"error": "Failed to calculate nutrition targets.", "details": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WeeklyPlanGenerateView(APIView):
    """
    POST /api/v1/health/nutrition/plan/weekly/
    Generates a full 7-day Pakistani meal plan and stores an immutable snapshot.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = str(request.user.id)
        raw_meta, profile_data, active_module = _extract_user_context(request)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        try:
            plan_dto = meal_plan_service.generate_weekly_plan(
                user_id=user_id,
                raw_user_meta_data=raw_meta,
                profile_data=profile_data,
                active_assessment_module=active_module,
                auth_token=raw_token,
            )
            serializer = WeeklyNutritionPlanSerializer(data=plan_dto)
            serializer.is_valid()
            return Response(plan_dto, status=status.HTTP_201_CREATED)
        except NutritionReadinessException as exc:
            return Response(
                {
                    "error": "Profile is not ready for automated nutrition planning.",
                    "readiness": exc.readiness_result,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error("Error generating weekly plan for %s: %s", user_id[:8] + "***", exc)
            return Response(
                {"error": "Failed to generate weekly meal plan.", "details": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CurrentNutritionPlanView(APIView):
    """
    GET /api/v1/health/nutrition/plan/current/
    Retrieves the user's currently active nutrition plan.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        current = meal_plan_service.get_current_plan(user_id, auth_token=raw_token)
        if not current:
            return Response(
                {"error": "No active nutrition plan found.", "has_plan": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WeeklyNutritionPlanSerializer(data=current)
        serializer.is_valid()
        return Response(current, status=status.HTTP_200_OK)


class NutritionPlanHistoryView(APIView):
    """
    GET /api/v1/health/nutrition/plan/history/
    Retrieves the user's historical nutrition plans list.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        limit = int(request.query_params.get("limit", 10))
        history = meal_plan_service.get_plan_history(user_id, limit=limit, auth_token=raw_token)
        serializer = PlanHistoryItemSerializer(data=history, many=True)
        serializer.is_valid()
        return Response(history, status=status.HTTP_200_OK)


class NutritionPlanDetailView(APIView):
    """
    GET /api/v1/health/nutrition/plan/<uuid:plan_id>/
    Retrieves a specific plan by ID, verifying user ownership.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, plan_id):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        plan = meal_plan_service.get_plan_by_id(user_id=user_id, plan_id=str(plan_id), auth_token=raw_token)
        if not plan:
            return Response(
                {"error": "Nutrition plan not found or access unauthorized."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WeeklyNutritionPlanSerializer(data=plan)
        serializer.is_valid()
        return Response(plan, status=status.HTTP_200_OK)


class NutritionPlanRegenerateView(APIView):
    """
    POST /api/v1/health/nutrition/plan/regenerate/
    Deactivates old active plan and generates a fresh active plan snapshot.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = str(request.user.id)
        raw_meta, profile_data, active_module = _extract_user_context(request)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        try:
            plan_dto = meal_plan_service.generate_weekly_plan(
                user_id=user_id,
                raw_user_meta_data=raw_meta,
                profile_data=profile_data,
                active_assessment_module=active_module,
                auth_token=raw_token,
            )
            serializer = WeeklyNutritionPlanSerializer(data=plan_dto)
            serializer.is_valid()
            return Response(plan_dto, status=status.HTTP_201_CREATED)
        except NutritionReadinessException as exc:
            return Response(
                {
                    "error": "Profile is not ready for automated nutrition planning.",
                    "readiness": exc.readiness_result,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.error("Error regenerating weekly plan for %s: %s", user_id[:8] + "***", exc)
            return Response(
                {"error": "Failed to regenerate weekly meal plan.", "details": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class NutritionPreferencesView(APIView):
    """
    GET  /api/v1/health/nutrition/preferences/
    PUT  /api/v1/health/nutrition/preferences/

    Reads and updates authoritative nutrition preferences:
    - food_allergies (canonical IDs)
    - food_intolerances (canonical IDs)
    - dietary_pattern (omnivore, halal_omnivore, vegetarian, vegan, pescatarian)
    - favorite_ingredients
    - disliked_ingredients
    - preferred_cuisines
    - budget_tier (low, medium, flexible)
    - cooking_time_preference (quick, moderate, flexible)
    - meals_per_day (3-5)
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_meta, profile_data, _ = _extract_user_context(request)

        # 1. Food Allergies
        food_allergies_raw = profile_data.get("food_allergies")
        allergies_raw = profile_data.get("allergies") or raw_meta.get("allergies")
        if food_allergies_raw is not None and isinstance(food_allergies_raw, list):
            norm_allergies, _, _ = normalize_food_allergens(food_allergies_raw)
        elif allergies_raw is not None and isinstance(allergies_raw, list):
            norm_allergies, _, _ = normalize_food_allergens(allergies_raw)
        else:
            norm_allergies = []

        # 2. Food Intolerances
        intolerances_raw = profile_data.get("food_intolerances", [])
        if isinstance(intolerances_raw, list):
            norm_intolerances, _ = normalize_food_intolerances(intolerances_raw)
        else:
            norm_intolerances = []

        # 3. Dietary Pattern
        diet_raw = profile_data.get("dietary_preference") or raw_meta.get("dietary_preference") or "halal_omnivore"
        dietary_pattern = normalize_dietary_pattern(diet_raw)

        # 4. Ingredients & Cuisines
        fav_raw = profile_data.get("favorite_ingredients") or []
        dis_raw = profile_data.get("disliked_ingredients") or []
        cuisines_raw = profile_data.get("preferred_cuisines") or ["pakistani"]

        response_data = {
            "food_allergies": norm_allergies,
            "food_intolerances": norm_intolerances,
            "dietary_pattern": dietary_pattern.value,
            "favorite_ingredients": [normalize_ingredient_name(x) for x in fav_raw if normalize_ingredient_name(x)],
            "disliked_ingredients": [normalize_ingredient_name(x) for x in dis_raw if normalize_ingredient_name(x)],
            "preferred_cuisines": cuisines_raw if isinstance(cuisines_raw, list) else ["pakistani"],
            "budget_tier": profile_data.get("budget_tier", "medium") or "medium",
            "cooking_time_preference": profile_data.get("cooking_time_preference", "moderate") or "moderate",
            "meals_per_day": int(profile_data.get("meals_per_day", 4) or 4),
        }
        return Response(response_data, status=status.HTTP_200_OK)

    def put(self, request):
        user_id = str(request.user.id)
        serializer = NutritionPreferencesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        update_fields = {
            "food_allergies": validated.get("food_allergies", []),
            "food_intolerances": validated.get("food_intolerances", []),
            "dietary_preference": validated.get("dietary_pattern", "halal_omnivore"),
            "favorite_ingredients": validated.get("favorite_ingredients", []),
            "disliked_ingredients": validated.get("disliked_ingredients", []),
            "preferred_cuisines": validated.get("preferred_cuisines", ["pakistani"]),
            "budget_tier": validated.get("budget_tier", "medium"),
            "cooking_time_preference": validated.get("cooking_time_preference", "moderate"),
            "meals_per_day": validated.get("meals_per_day", 4),
        }

        if client is not None:
            try:
                client.table("profiles").update(update_fields).eq("id", user_id).execute()
            except Exception as exc:
                logger.error("Failed to persist nutrition preferences for user %s: %s", user_id[:8] + "***", exc)
                return Response(
                    {"error": "Failed to persist nutrition preferences.", "details": str(exc)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(validated, status=status.HTTP_200_OK)
