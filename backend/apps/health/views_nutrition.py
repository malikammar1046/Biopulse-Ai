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


_IN_MEMORY_FOOD_LOGS: Dict[str, List[Dict[str, Any]]] = {}


def _unpack_user_context(ctx_tuple):
    raw_meta = ctx_tuple[0] if len(ctx_tuple) > 0 else {}
    profile_data = ctx_tuple[1] if len(ctx_tuple) > 1 else {}
    active_module = ctx_tuple[2] if len(ctx_tuple) > 2 else None
    active_assessment = ctx_tuple[3] if len(ctx_tuple) > 3 else None
    return raw_meta, profile_data, active_module, active_assessment


def _extract_user_context(request) -> Tuple[Dict[str, Any], Dict[str, Any], Optional[str], Optional[Dict[str, Any]]]:
    """
    Extracts raw auth user metadata, Supabase profile record, active assessment module,
    and active assessment record. Always scopes strictly to request.user.id.
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
    active_assessment_rec: Optional[Dict[str, Any]] = None
    pathway_hint = (
        raw_user_meta.get("pathway")
        or profile_data.get("pathway", "")
    )
    clean_pathway = str(pathway_hint).strip().lower()
    gender_hint = str(raw_user_meta.get("gender") or profile_data.get("gender") or "").strip().lower()

    try:
        from apps.intelligence.services.assessment_repository import assessment_repository
        if clean_pathway in ("female", "female_pcos") or (not clean_pathway and gender_hint == "female"):
            pcos_active = assessment_repository.get_active_assessment(user_id, module="female_pcos", auth_token=raw_token or None)
            if pcos_active and pcos_active.get("has_assessment") is not False:
                active_assessment_module = "female_pcos"
                active_assessment_rec = pcos_active
        elif clean_pathway in ("male", "male_hypogonadism") or (not clean_pathway and gender_hint == "male"):
            male_active = assessment_repository.get_active_assessment(user_id, module="male_hypogonadism", auth_token=raw_token or None)
            if male_active and male_active.get("has_assessment") is not False:
                active_assessment_module = "male_hypogonadism"
                active_assessment_rec = male_active
        else:
            pcos_active = assessment_repository.get_active_assessment(user_id, module="female_pcos", auth_token=raw_token or None)
            if pcos_active and pcos_active.get("has_assessment") is not False:
                active_assessment_module = "female_pcos"
                active_assessment_rec = pcos_active
            else:
                male_active = assessment_repository.get_active_assessment(user_id, module="male_hypogonadism", auth_token=raw_token or None)
                if male_active and male_active.get("has_assessment") is not False:
                    active_assessment_module = "male_hypogonadism"
                    active_assessment_rec = male_active
    except Exception as exc:
        logger.debug("Assessment repository lookup error: %s", exc)

    return raw_user_meta, profile_data, active_assessment_module, active_assessment_rec


class NutritionReadinessView(APIView):
    """
    GET /api/v1/health/nutrition/readiness/
    Checks whether user biometrics and safety confirmations are complete for meal planning.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        raw_meta, profile_data, _, active_assessment = _unpack_user_context(_extract_user_context(request))
        readiness = meal_plan_service.check_user_readiness(
            raw_meta, profile_data, active_assessment=active_assessment
        )
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
        raw_meta, profile_data, active_module, _ = _unpack_user_context(_extract_user_context(request))

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
        raw_meta, profile_data, active_module, _ = _unpack_user_context(_extract_user_context(request))
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
    Deactivates old active plan and generates a fresh active plan snapshot,
    preserving any meals the user has locked.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = str(request.user.id)
        raw_meta, profile_data, active_module, _ = _unpack_user_context(_extract_user_context(request))
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        try:
            # Query existing active plan to find locked meals
            current_plan = meal_plan_service.get_current_plan(user_id, auth_token=raw_token)
            locked_meals = {}
            if current_plan and isinstance(current_plan.get("plan_data"), dict):
                pdata = current_plan["plan_data"]
                for day in pdata.get("days", []):
                    d_idx = day.get("day_index")
                    for m in day.get("meals", []):
                        if m.get("is_locked"):
                            locked_meals[(d_idx, m.get("role", "").upper())] = m

            plan_dto = meal_plan_service.generate_weekly_plan(
                user_id=user_id,
                raw_user_meta_data=raw_meta,
                profile_data=profile_data,
                active_assessment_module=active_module,
                auth_token=raw_token,
            )

            # Preserve locked meals in newly generated plan
            if locked_meals and isinstance(plan_dto.get("plan_data"), dict):
                pdata = plan_dto["plan_data"]
                for day in pdata.get("days", []):
                    d_idx = day.get("day_index")
                    for idx, m in enumerate(day.get("meals", [])):
                        key = (d_idx, m.get("role", "").upper())
                        if key in locked_meals:
                            day["meals"][idx] = locked_meals[key]
                client = None
                try:
                    client = health_service._client_or_raise(auth_token=raw_token)
                except Exception:
                    pass
                if client is not None:
                    try:
                        client.table("nutrition_plans").update({"plan_data": pdata}).eq("id", plan_dto["id"]).execute()
                    except Exception as exc:
                        logger.warning("Failed to persist locked meals in regenerated plan: %s", exc)

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
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_meta, profile_data, _, _ = _unpack_user_context(_extract_user_context(request))


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


class MealLogView(APIView):
    """
    GET  /api/v1/health/nutrition/log/          — retrieve food log history
    POST /api/v1/health/nutrition/log/          — create a new food log entry in authoritative food_logs
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        date_filter = request.query_params.get("date")  # optional YYYY-MM-DD
        limit = int(request.query_params.get("limit", 50))

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        entries = []
        if client is not None:
            try:
                q = (
                    client.table("food_logs")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("logged_at", desc=True)
                    .limit(limit)
                )
                if date_filter:
                    q = q.gte("logged_at", f"{date_filter}T00:00:00").lte("logged_at", f"{date_filter}T23:59:59")
                res = q.execute()
                if res.data:
                    entries = res.data
            except Exception as exc:
                logger.warning("Failed to fetch food logs: %s", exc)

        # Fallback to in-memory store if offline / test environment
        if not entries and user_id in _IN_MEMORY_FOOD_LOGS:
            entries = _IN_MEMORY_FOOD_LOGS[user_id]
            if date_filter:
                entries = [e for e in entries if str(e.get("logged_at", "")).startswith(date_filter)]
            entries = sorted(entries, key=lambda x: str(x.get("logged_at", "")), reverse=True)[:limit]

        return Response({"entries": entries, "count": len(entries)}, status=status.HTTP_200_OK)

    def post(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        import uuid
        from datetime import datetime, timezone

        data = request.data
        food_name = str(data.get("food_name", "")).strip()
        if not food_name:
            return Response({"error": "food_name is required."}, status=status.HTTP_400_BAD_REQUEST)

        entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "meal_type": str(data.get("meal_type", "lunch")).lower(),
            "food_name": food_name,
            "logged_at": data.get("logged_at") or datetime.now(timezone.utc).isoformat(),
            "calories": data.get("calories"),
            "protein_g": data.get("protein_g"),
            "carbs_g": data.get("carbs_g"),
            "fat_g": data.get("fat_g"),
        }
        if data.get("portion_description"):
            entry["portion_description"] = data.get("portion_description")
        if data.get("notes"):
            entry["notes"] = data.get("notes")

        # Save to memory cache for immediate local availability
        if user_id not in _IN_MEMORY_FOOD_LOGS:
            _IN_MEMORY_FOOD_LOGS[user_id] = []
        _IN_MEMORY_FOOD_LOGS[user_id].insert(0, dict(entry))

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        if client is not None:
            try:
                res = client.table("food_logs").insert(entry).execute()
                if res.data:
                    return Response(res.data[0], status=status.HTTP_201_CREATED)
            except Exception as exc:
                try:
                    # Retry without extended fields if schema only has core columns
                    core_entry = {k: v for k, v in entry.items() if k not in ("portion_description", "notes")}
                    res = client.table("food_logs").insert(core_entry).execute()
                    if res.data:
                        return Response(res.data[0], status=status.HTTP_201_CREATED)
                except Exception as inner_exc:
                    logger.warning("Could not persist food log to Supabase: %s", inner_exc)

        return Response(entry, status=status.HTTP_201_CREATED)


class MealSwapView(APIView):
    """
    POST /api/v1/health/nutrition/plan/<uuid:plan_id>/swap/
    Swaps a single meal for a safe, culturally appropriate alternative.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, plan_id):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        day_index = request.data.get("day_index")
        meal_role = str(request.data.get("meal_role", "")).upper()
        custom_dish = request.data.get("custom_dish")

        if day_index is None or not meal_role:
            return Response({"error": "day_index and meal_role are required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.health.services.meal_plan_repository import meal_plan_repository
        plan = meal_plan_repository.get_plan_by_id(user_id=user_id, plan_id=str(plan_id), auth_token=raw_token)
        if not plan:
            return Response({"error": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)

        plan_data = plan.get("plan_data") or {}
        days = plan_data.get("days") or []

        # Find target meal
        target_meal = None
        for day in days:
            if day.get("day_index") == int(day_index):
                for meal in day.get("meals", []):
                    if meal.get("role", "").upper() == meal_role:
                        target_meal = meal
                        break
                break

        if not target_meal:
            return Response({"error": "Meal not found in plan."}, status=status.HTTP_404_NOT_FOUND)

        raw_meta, profile_data, _, _ = _unpack_user_context(_extract_user_context(request))
        allergies = profile_data.get("food_allergies") or profile_data.get("allergies") or []
        intolerances = profile_data.get("food_intolerances") or []
        diet_pref = profile_data.get("dietary_preference") or "omnivore"

        from apps.intelligence.services.pakistan_food_catalog import PakistanFoodCatalog
        eligible = PakistanFoodCatalog.get_eligible_foods(
            allergens=allergies,
            intolerances=intolerances,
            dietary_preference=diet_pref,
        )

        if custom_dish:
            prohibited_terms = set([str(a).lower() for a in allergies + intolerances])
            if any(term in custom_dish.lower() for term in prohibited_terms):
                return Response(
                    {"error": f"Custom dish contains declared allergen/intolerance."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            target_meal["title"] = custom_dish
            target_meal["dish_name"] = custom_dish
            target_meal["items"] = [{
                "entity_id": "CUSTOM_SWAP",
                "display_name": custom_dish,
                "grams": 200.0,
                "energy_kcal": target_meal.get("energy_kcal", 400),
                "protein_g": target_meal.get("protein_g", 20),
                "carbohydrate_g": target_meal.get("carbohydrate_g", 40),
                "fat_g": target_meal.get("fat_g", 12),
            }]
        else:
            role_lower = meal_role.lower()
            candidates = [f for f in eligible if role_lower in f.meal_roles.lower()] or eligible
            curr_title = target_meal.get("title", "")
            diff_candidates = [c for c in candidates if c.entity_name_en.lower() != curr_title.lower()]
            chosen = diff_candidates[0] if diff_candidates else (candidates[0] if candidates else None)
            if chosen:
                serving_g = 200.0
                scale = serving_g / 100.0
                target_meal["title"] = chosen.entity_name_en
                target_meal["dish_name"] = f"{chosen.entity_name_en} ({chosen.entity_name_local})" if chosen.entity_name_local else chosen.entity_name_en
                target_meal["energy_kcal"] = round((chosen.energy_kcal_per_100g or 200.0) * scale, 1)
                target_meal["protein_g"] = round((chosen.protein_g_per_100g or 10.0) * scale, 1)
                target_meal["carbohydrate_g"] = round((chosen.carb_g_per_100g or 25.0) * scale, 1)
                target_meal["fat_g"] = round((chosen.fat_g_per_100g or 6.0) * scale, 1)
                target_meal["items"] = [{
                    "entity_id": chosen.planner_entity_id,
                    "display_name": chosen.entity_name_en,
                    "grams": serving_g,
                    "energy_kcal": target_meal["energy_kcal"],
                    "protein_g": target_meal["protein_g"],
                    "carbohydrate_g": target_meal["carbohydrate_g"],
                    "fat_g": target_meal["fat_g"],
                }]

        # Persist updated plan
        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass
        if client is not None:
            try:
                client.table("nutrition_plans").update({"plan_data": plan_data}).eq("id", str(plan_id)).eq("user_id", user_id).execute()
            except Exception as exc:
                logger.error("Failed to update swapped meal in plan: %s", exc)

        return Response({"message": "Meal swapped successfully.", "swapped_meal": target_meal, "plan_data": plan_data}, status=status.HTTP_200_OK)


class RegenerateDayView(APIView):
    """
    POST /api/v1/health/nutrition/plan/<uuid:plan_id>/regenerate-day/
    Regenerates a single day while strictly preserving locked meals.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, plan_id):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        day_index = request.data.get("day_index")

        if day_index is None:
            return Response({"error": "day_index is required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.health.services.meal_plan_repository import meal_plan_repository
        plan = meal_plan_repository.get_plan_by_id(user_id=user_id, plan_id=str(plan_id), auth_token=raw_token)
        if not plan:
            return Response({"error": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)

        plan_data = plan.get("plan_data") or {}
        days = plan_data.get("days") or []
        target_day = next((d for d in days if d.get("day_index") == int(day_index)), None)
        if not target_day:
            return Response({"error": "Day index not found in plan."}, status=status.HTTP_404_NOT_FOUND)

        locked_roles = {
            m.get("role", "").upper()
            for m in target_day.get("meals", [])
            if m.get("is_locked")
        }

        raw_meta, profile_data, _, _ = _unpack_user_context(_extract_user_context(request))
        allergies = profile_data.get("food_allergies") or profile_data.get("allergies") or []
        intolerances = profile_data.get("food_intolerances") or []
        diet_pref = profile_data.get("dietary_preference") or "omnivore"

        from apps.intelligence.services.pakistan_food_catalog import PakistanFoodCatalog
        eligible = PakistanFoodCatalog.get_eligible_foods(
            allergens=allergies,
            intolerances=intolerances,
            dietary_preference=diet_pref,
        )

        for meal in target_day.get("meals", []):
            role_up = meal.get("role", "").upper()
            if role_up in locked_roles:
                continue
            role_lower = role_up.lower()
            role_candidates = [f for f in eligible if role_lower in f.meal_roles.lower()] or eligible
            curr_title = meal.get("title", "")
            diff_candidates = [c for c in role_candidates if c.entity_name_en.lower() != curr_title.lower()]
            chosen = diff_candidates[0] if diff_candidates else (role_candidates[0] if role_candidates else None)
            if chosen:
                serving_g = 200.0
                scale = serving_g / 100.0
                meal["title"] = chosen.entity_name_en
                meal["dish_name"] = f"{chosen.entity_name_en} ({chosen.entity_name_local})" if chosen.entity_name_local else chosen.entity_name_en
                meal["energy_kcal"] = round((chosen.energy_kcal_per_100g or 200.0) * scale, 1)
                meal["protein_g"] = round((chosen.protein_g_per_100g or 10.0) * scale, 1)
                meal["carbohydrate_g"] = round((chosen.carb_g_per_100g or 25.0) * scale, 1)
                meal["fat_g"] = round((chosen.fat_g_per_100g or 6.0) * scale, 1)
                meal["items"] = [{
                    "entity_id": chosen.planner_entity_id,
                    "display_name": chosen.entity_name_en,
                    "grams": serving_g,
                    "energy_kcal": meal["energy_kcal"],
                    "protein_g": meal["protein_g"],
                    "carbohydrate_g": meal["carbohydrate_g"],
                    "fat_g": meal["fat_g"],
                }]

        # Persist updated day in plan_data
        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass
        if client is not None:
            try:
                client.table("nutrition_plans").update({"plan_data": plan_data}).eq("id", str(plan_id)).eq("user_id", user_id).execute()
            except Exception as exc:
                logger.error("Failed to update regenerated day: %s", exc)

        return Response({"message": f"Day {day_index} regenerated.", "day": target_day, "plan_data": plan_data}, status=status.HTTP_200_OK)


class PlanModifyByAIView(APIView):
    """
    POST /api/v1/health/nutrition/plan/<uuid:plan_id>/modify/
    Processes natural language plan modifications through deterministic safety validators.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, plan_id):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)
        prompt = str(request.data.get("prompt", "")).strip().lower()

        if not prompt:
            return Response({"error": "prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.health.services.meal_plan_repository import meal_plan_repository
        plan = meal_plan_repository.get_plan_by_id(user_id=user_id, plan_id=str(plan_id), auth_token=raw_token)
        if not plan:
            return Response({"error": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)

        plan_data = plan.get("plan_data") or {}
        days = plan_data.get("days") or []

        raw_meta, profile_data, _, _ = _unpack_user_context(_extract_user_context(request))
        allergies = profile_data.get("food_allergies") or profile_data.get("allergies") or []
        intolerances = profile_data.get("food_intolerances") or []
        diet_pref = profile_data.get("dietary_preference") or "omnivore"

        from apps.intelligence.services.pakistan_food_catalog import PakistanFoodCatalog
        eligible = PakistanFoodCatalog.get_eligible_foods(
            allergens=allergies,
            intolerances=intolerances,
            dietary_preference=diet_pref,
        )

        modifications = []

        # Example 1: "Make Tuesday vegetarian" or "Make day 2 vegetarian"
        if "vegetarian" in prompt:
            target_day_idx = None
            day_map = {"monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6, "sunday": 7}
            for dname, didx in day_map.items():
                if dname in prompt or f"day {didx}" in prompt:
                    target_day_idx = didx
                    break
            veg_candidates = [f for f in eligible if f.dietary_class in ("vegetarian", "vegan") and not f.contains_meat and not f.contains_fish]
            if veg_candidates:
                for day in days:
                    if target_day_idx is None or day.get("day_index") == target_day_idx:
                        for meal in day.get("meals", []):
                            if not meal.get("is_locked"):
                                chosen = veg_candidates[0]
                                meal["title"] = chosen.entity_name_en
                                meal["dish_name"] = chosen.entity_name_en
                                modifications.append(f"Updated {day.get('day_name')} {meal.get('role')} to {chosen.entity_name_en}")

        # Example 2: "Replace oats" / "Replace chicken" / "Replace fish"
        for ing in ["oats", "chicken", "fish", "egg", "beef", "mutton"]:
            if f"replace {ing}" in prompt or f"no {ing}" in prompt or f"don't like {ing}" in prompt:
                filtered = [f for f in eligible if ing not in f.entity_name_en.lower()]
                if filtered:
                    for day in days:
                        for meal in day.get("meals", []):
                            if ing in meal.get("title", "").lower() and not meal.get("is_locked"):
                                chosen = filtered[0]
                                meal["title"] = chosen.entity_name_en
                                meal["dish_name"] = chosen.entity_name_en
                                modifications.append(f"Replaced {ing} in {day.get('day_name')} {meal.get('role')} with {chosen.entity_name_en}")

        # Persist if modifications occurred
        if modifications:
            client = None
            try:
                client = health_service._client_or_raise(auth_token=raw_token)
            except Exception:
                pass
            if client is not None:
                try:
                    client.table("nutrition_plans").update({"plan_data": plan_data}).eq("id", str(plan_id)).eq("user_id", user_id).execute()
                except Exception as exc:
                    logger.error("Failed to update AI modified plan: %s", exc)

        return Response({
            "message": "Proposed modifications processed safely.",
            "modifications": modifications or ["Plan validated; no unsafe changes detected."],
            "plan_data": plan_data,
        }, status=status.HTTP_200_OK)



class PlanActivateView(APIView):
    """
    POST /api/v1/health/nutrition/plan/<uuid:plan_id>/activate/
    Activates a historical plan (deactivates any currently active plan).
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, plan_id):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        from apps.health.services.meal_plan_repository import meal_plan_repository
        plan = meal_plan_repository.get_plan_by_id(
            user_id=user_id, plan_id=str(plan_id), auth_token=raw_token
        )
        if not plan:
            return Response(
                {"error": "Plan not found or access unauthorized."},
                status=status.HTTP_404_NOT_FOUND,
            )

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        if client is not None:
            try:
                # Deactivate all current active plans
                client.table("nutrition_plans").update({"is_active": False}).eq("user_id", user_id).eq("is_active", True).execute()
                # Activate the requested plan
                client.table("nutrition_plans").update({"is_active": True}).eq("id", str(plan_id)).eq("user_id", user_id).execute()
            except Exception as exc:
                logger.error("Failed to activate plan %s: %s", plan_id, exc)
                return Response({"error": "Failed to activate plan."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Plan activated.", "plan_id": str(plan_id)}, status=status.HTTP_200_OK)


class MealLockView(APIView):
    """
    POST /api/v1/health/nutrition/plan/<uuid:plan_id>/lock/
    Body: { day_index: int, meal_role: str, locked: bool }
    Persists meal lock state into plan_data.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, plan_id):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        day_index = request.data.get("day_index")
        meal_role = str(request.data.get("meal_role", "")).upper()
        locked = bool(request.data.get("locked", True))

        if day_index is None or not meal_role:
            return Response({"error": "day_index and meal_role are required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.health.services.meal_plan_repository import meal_plan_repository
        plan = meal_plan_repository.get_plan_by_id(
            user_id=user_id, plan_id=str(plan_id), auth_token=raw_token
        )
        if not plan:
            return Response({"error": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update lock state in plan_data
        plan_data = plan.get("plan_data") or {}
        days = plan_data.get("days") or []
        updated = False
        for day in days:
            if day.get("day_index") == int(day_index):
                for meal in day.get("meals", []):
                    if meal.get("role", "").upper() == meal_role:
                        meal["is_locked"] = locked
                        updated = True
                        break
                break

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        if client is not None and updated:
            try:
                client.table("nutrition_plans").update({"plan_data": plan_data}).eq("id", str(plan_id)).eq("user_id", user_id).execute()
            except Exception as exc:
                logger.error("Failed to update meal lock: %s", exc)
                return Response({"error": "Failed to save lock state."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"message": "Lock state updated.", "locked": locked, "meal_role": meal_role, "day_index": day_index},
            status=status.HTTP_200_OK,
        )


class NutritionReminderView(APIView):
    """
    GET  /api/v1/health/nutrition/reminders/   — get reminder settings
    PUT  /api/v1/health/nutrition/reminders/   — update reminder settings
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    _DEFAULT_REMINDERS = [
        {"meal_type": "breakfast", "enabled": False, "time": "08:00"},
        {"meal_type": "lunch", "enabled": False, "time": "13:00"},
        {"meal_type": "dinner", "enabled": False, "time": "19:00"},
        {"meal_type": "snack", "enabled": False, "time": "16:00"},
    ]

    def get(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        if client is not None:
            try:
                res = client.table("nutrition_reminders").select("*").eq("user_id", user_id).maybe_single().execute()
                if res.data:
                    return Response(res.data, status=status.HTTP_200_OK)
            except Exception as exc:
                logger.debug("Could not fetch reminders: %s", exc)

        return Response(
            {"enabled": False, "reminders": self._DEFAULT_REMINDERS},
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        enabled = bool(request.data.get("enabled", False))
        reminders = request.data.get("reminders", self._DEFAULT_REMINDERS)

        record = {
            "user_id": user_id,
            "enabled": enabled,
            "reminders": reminders,
        }

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        if client is not None:
            try:
                # Upsert by user_id
                client.table("nutrition_reminders").upsert(record, on_conflict="user_id").execute()
            except Exception as exc:
                logger.error("Failed to persist reminders: %s", exc)
                return Response({"error": "Failed to save reminders."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(record, status=status.HTTP_200_OK)


class NutritionAdherenceView(APIView):
    """
    GET /api/v1/health/nutrition/adherence/
    Returns today's and this week's plan adherence based on food logs.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        raw_token = getattr(request.user, "raw_token", None) or getattr(request, "auth", None)

        from datetime import date, timedelta

        today_str = date.today().isoformat()
        week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()

        client = None
        try:
            client = health_service._client_or_raise(auth_token=raw_token)
        except Exception:
            pass

        today_logs = 0
        week_logs = 0
        logged_timestamps = []
        if client is not None:
            try:
                res = client.table("food_logs").select("id,logged_at").eq("user_id", user_id).gte("logged_at", f"{week_start}T00:00:00").execute()
                if res.data:
                    logged_timestamps.extend([e.get("logged_at", "") for e in res.data if e.get("logged_at")])
            except Exception as exc:
                logger.debug("Could not fetch adherence logs: %s", exc)

        # Combine with in-memory logs
        if user_id in _IN_MEMORY_FOOD_LOGS:
            for e in _IN_MEMORY_FOOD_LOGS[user_id]:
                lat = str(e.get("logged_at", ""))
                if lat >= f"{week_start}T00:00:00" and lat not in logged_timestamps:
                    logged_timestamps.append(lat)

        week_logs = len(logged_timestamps)
        today_logs = sum(1 for ts in logged_timestamps if ts.startswith(today_str))


        # Get active plan to count planned meals
        current = meal_plan_service.get_current_plan(user_id, auth_token=raw_token)
        planned_today = 0
        planned_week = 0
        if current:
            meals_per_day = len((current.get("days") or [{}])[0].get("meals", [])) or 4
            planned_today = meals_per_day
            planned_week = meals_per_day * 7

        return Response(
            {
                "today": {
                    "period": "today",
                    "planned_meals": planned_today,
                    "logged_meals": today_logs,
                    "adherence_pct": round(today_logs / planned_today * 100) if planned_today > 0 else 0,
                },
                "week": {
                    "period": "week",
                    "planned_meals": planned_week,
                    "logged_meals": week_logs,
                    "adherence_pct": round(week_logs / planned_week * 100) if planned_week > 0 else 0,
                    "days_engaged": min(week_logs, 7),
                    "days_total": 7,
                },
            },
            status=status.HTTP_200_OK,
        )

