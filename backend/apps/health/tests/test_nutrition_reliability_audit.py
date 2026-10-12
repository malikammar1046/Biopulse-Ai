"""
backend/apps/health/tests/test_nutrition_reliability_audit.py

Final Lifestyle & Nutrition Reliability Audit Test Suite:
1. Unanswered allergies vs explicitly confirmed none (3-state allergy safety).
2. Unknown calories/macros vs actual zero values (preservation of None, [nutrition:unverified]).
3. Server-side meal selection persistence (public.meal_plans, schedule/get/delete).
4. Halal omnivore vs vegetarian food eligibility (meat permitted in halal, excluded in veg).
5. Duplicate meal logging prevention (idempotent food logging).
6. Correct user and date isolation.
7. Unsupported allergens and uncertain ingredients blocking with clinical review.
8. Complete 7-day plan generation, scheduling, and logging flow.
9. Male pathway regression (AndroSense compatibility).
"""

from __future__ import annotations

import os
import uuid
from datetime import date
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import jwt
import pytest
from django.test import RequestFactory
from rest_framework import status

from apps.health.nutrition_vocabularies import (
    CanonicalAllergen,
    DietaryPattern,
    build_dietary_compatibility_map,
    normalize_food_allergens,
)
from apps.health.services.meal_plan_repository import MealPlanRepository
from apps.health.services.meal_plan_service import (
    MealPlanService,
    NutritionReadinessException,
    meal_plan_service,
)
from apps.health.services.meal_profile_builder import MealProfileBuilder
from apps.health.views_nutrition import (
    FoodLogsView,
    ScheduledMealsView,
    ScheduledMealDetailView,
    WeeklyPlanGenerateView,
)
from apps.intelligence.services.pakistan_food_catalog import PakistanFoodCatalog

try:
    from Meal.engine.schemas import Allergen, DietaryClass, Goal, PALCategory
    HAS_MEAL_MODULE = True
except (ImportError, ModuleNotFoundError):
    HAS_MEAL_MODULE = False

if not HAS_MEAL_MODULE:
    pytestmark = pytest.mark.skip(reason="Meal Directory has been decoupled/moved")

TEST_JWT_SECRET = "test-secret-key-at-least-32-chars-long-123456"


@pytest.fixture(autouse=True)
def setup_env():
    prev_secret = os.environ.get("SUPABASE_JWT_SECRET")
    os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET
    yield
    if prev_secret is not None:
        os.environ["SUPABASE_JWT_SECRET"] = prev_secret
    else:
        os.environ.pop("SUPABASE_JWT_SECRET", None)


@pytest.fixture
def test_repo():
    return MealPlanRepository(in_memory=True)


@pytest.fixture
def test_service(test_repo):
    srv = MealPlanService(repository=test_repo)
    meal_plan_service.repository = test_repo
    return srv


@pytest.fixture
def rf():
    return RequestFactory()


def create_token(user_id: str, email: str = "test@pmosense.test") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


# ==============================================================================
# 1. Unanswered Allergies vs Explicitly Confirmed None
# ==============================================================================

def test_unanswered_allergies_blocked():
    """Unanswered or empty list of allergies MUST block planning."""
    raw_meta = {"gender": "female", "pathway": "female"}
    base_profile = {
        "date_of_birth": "1998-05-15",
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
    }

    # Case A: Missing entirely
    readiness_missing = MealProfileBuilder.check_nutrition_readiness(raw_meta, base_profile)
    assert not readiness_missing.ready
    assert "allergy_confirmation" in readiness_missing.safety_confirmations["missing"]

    # Case B: Empty list []
    profile_empty = dict(base_profile, food_allergies=[])
    readiness_empty = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile_empty)
    assert not readiness_empty.ready
    assert "allergy_confirmation" in readiness_empty.safety_confirmations["missing"]

    # Case C: Explicitly confirmed none ['none']
    profile_none = dict(base_profile, food_allergies=["none"])
    readiness_none = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile_none)
    assert readiness_none.ready
    assert "allergy_confirmation" not in readiness_none.safety_confirmations["missing"]


# ==============================================================================
# 2. Unknown Calories/Macros vs Actual Zero Values
# ==============================================================================

def test_unknown_calories_preserved_as_none_and_annotated(test_service):
    """Unknown nutrients must not be fabricated as zero."""
    user_id = str(uuid.uuid4())
    log_entry = test_service.log_food_item(
        user_id=user_id,
        meal_type="lunch",
        food_name="Homemade Lentil Soup",
        serving="1 bowl",
        calories=None,
        protein_g=None,
        carbs_g=None,
        fat_g=None,
        notes="Delicious lunch",
    )

    assert log_entry["calories"] is None
    assert log_entry["protein_g"] is None
    assert log_entry["carbs_g"] is None
    assert log_entry["fat_g"] is None
    assert "[nutrition:unverified]" in log_entry["notes"]


def test_verified_zero_or_positive_calories_preserved(test_service):
    """Verified values are stored accurately without unverified tag."""
    user_id = str(uuid.uuid4())
    log_entry = test_service.log_food_item(
        user_id=user_id,
        meal_type="breakfast",
        food_name="Boiled Egg",
        serving="1 egg",
        calories=78.0,
        protein_g=6.3,
        carbs_g=0.6,
        fat_g=5.3,
        notes="Standard egg",
    )

    assert log_entry["calories"] == 78
    assert log_entry["protein_g"] == 6.3
    assert "[nutrition:unverified]" not in log_entry["notes"]


# ==============================================================================
# 3. Server-Side Meal Selection Persistence
# ==============================================================================

def test_meal_selection_scheduling_and_retrieval(test_service):
    """Selected meal persists to server-side scheduled meals."""
    user_id = str(uuid.uuid4())
    today_str = date.today().isoformat()

    meal_data = {
        "id": "meal_lunch_01",
        "role": "lunch",
        "title": "Yellow Moong Daal with Besan Roti",
        "energy_kcal": 380,
    }

    # Schedule meal
    scheduled = test_service.schedule_meal(
        user_id=user_id,
        target_date=today_str,
        meal_type="lunch",
        meal_name="Yellow Moong Daal with Besan Roti",
        meal_data=meal_data,
    )

    assert scheduled["user_id"] == user_id
    assert scheduled["date"] == today_str
    assert scheduled["meal_type"] == "lunch"
    assert scheduled["meal_name"] == "Yellow Moong Daal with Besan Roti"

    # Retrieve scheduled meals
    retrieved = test_service.get_scheduled_meals(user_id=user_id, target_date=today_str)
    assert len(retrieved) >= 1
    assert any(m["meal_name"] == "Yellow Moong Daal with Besan Roti" for m in retrieved)

    # Delete scheduled meal
    del_res = test_service.delete_scheduled_meal(user_id=user_id, meal_id=scheduled["id"])
    assert del_res is True
    after_del = test_service.get_scheduled_meals(user_id=user_id, target_date=today_str)
    assert not any(m["id"] == scheduled["id"] for m in after_del)


# ==============================================================================
# 4. Dietary Rule Correctness: Halal Omnivore vs Vegetarian
# ==============================================================================

def test_dietary_rules_halal_omnivore_vs_vegetarian():
    """Halal omnivore allows meat/poultry; vegetarian strictly excludes meat/poultry."""
    all_foods = PakistanFoodCatalog.load_catalog()
    assert len(all_foods) > 0

    # 1. Halal Omnivore eligibility
    halal_foods = PakistanFoodCatalog.get_eligible_foods(
        allergens=["none"],
        dietary_preference="halal_omnivore",
    )
    # Must contain meat dishes (e.g. Chicken Curry or Alu Gosht or Shami Kabab)
    has_meat = any(f.contains_meat for f in halal_foods)
    assert has_meat, "Halal omnivore must not automatically exclude all meat and poultry."

    # 2. Vegetarian eligibility
    veg_foods = PakistanFoodCatalog.get_eligible_foods(
        allergens=["none"],
        dietary_preference="vegetarian",
    )
    # Must strictly exclude all meat and fish dishes
    assert not any(f.contains_meat for f in veg_foods), "Vegetarian must exclude meat and poultry."
    assert not any(f.contains_fish for f in veg_foods), "Vegetarian must exclude fish and seafood."

    # 3. Compatibility map verification
    compat_meat = build_dietary_compatibility_map(
        known_contains_meat=True,
        known_contains_fish=False,
        is_halal=True,
    )
    assert compat_meat["halal_omnivore"] == "COMPATIBLE"
    assert compat_meat["vegetarian"] == "INCOMPATIBLE"


# ==============================================================================
# 5. Duplicate Meal Logging Prevention
# ==============================================================================

def test_duplicate_meal_logging_prevention(test_service):
    """Submitting the same food log twice returns existing record without duplicating."""
    user_id = str(uuid.uuid4())
    today_str = date.today().isoformat()

    first_log = test_service.log_food_item(
        user_id=user_id,
        meal_type="breakfast",
        food_name="Oatmeal with Almonds",
        serving="1 bowl",
        calories=320,
        logged_at=today_str,
    )

    # Immediate second submission (e.g. double click or retry)
    second_log = test_service.log_food_item(
        user_id=user_id,
        meal_type="breakfast",
        food_name="Oatmeal with Almonds",
        serving="1 bowl",
        calories=320,
        logged_at=today_str,
    )

    assert second_log["id"] == first_log["id"], "Idempotency should return original log record."


# ==============================================================================
# 6. Correct User and Date Isolation
# ==============================================================================

def test_user_and_date_isolation(test_service):
    """Data for User A on Day X must not bleed into User B or Day Y."""
    user_a = str(uuid.uuid4())
    user_b = str(uuid.uuid4())
    day_1 = "2026-10-10"
    day_2 = "2026-10-11"

    test_service.schedule_meal(user_id=user_a, target_date=day_1, meal_type="breakfast", meal_name="User A Day 1")
    test_service.schedule_meal(user_id=user_b, target_date=day_1, meal_type="breakfast", meal_name="User B Day 1")
    test_service.schedule_meal(user_id=user_a, target_date=day_2, meal_type="breakfast", meal_name="User A Day 2")

    user_a_day_1 = test_service.get_scheduled_meals(user_id=user_a, target_date=day_1)
    assert len(user_a_day_1) == 1
    assert user_a_day_1[0]["meal_name"] == "User A Day 1"

    user_b_day_1 = test_service.get_scheduled_meals(user_id=user_b, target_date=day_1)
    assert len(user_b_day_1) == 1
    assert user_b_day_1[0]["meal_name"] == "User B Day 1"


# ==============================================================================
# 7. Unsupported Allergens Blocked with Clinical Review
# ==============================================================================

def test_unsupported_allergens_blocked():
    """Allergens lacking catalog coverage (shellfish, soy, sesame) block automated planning."""
    raw_meta = {"gender": "female", "pathway": "female"}
    base_profile = {
        "date_of_birth": "1998-05-15",
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
    }

    # Shellfish
    prof_shellfish = dict(base_profile, food_allergies=["shellfish"])
    res_shellfish = MealProfileBuilder.check_nutrition_readiness(raw_meta, prof_shellfish)
    assert not res_shellfish.ready
    assert "unsupported_allergen_requires_manual_review" in res_shellfish.safety_confirmations["missing"]

    # Soy
    prof_soy = dict(base_profile, food_allergies=["soy"])
    res_soy = MealProfileBuilder.check_nutrition_readiness(raw_meta, prof_soy)
    assert not res_soy.ready
    assert "unsupported_allergen_requires_manual_review" in res_soy.safety_confirmations["missing"]

    # Unknown arbitrary string
    prof_unknown = dict(base_profile, food_allergies=["random_chemical_x"])
    res_unknown = MealProfileBuilder.check_nutrition_readiness(raw_meta, prof_unknown)
    assert not res_unknown.ready
    assert "unsupported_allergen_requires_manual_review" in res_unknown.safety_confirmations["missing"]


# ==============================================================================
# 8. Complete 7-Day Plan Generation & Scheduled Meals Flow
# ==============================================================================

def test_complete_plan_generation_flow(test_service):
    """Complete 7-day plan generation for confirmed user."""
    user_id = str(uuid.uuid4())
    raw_meta = {"gender": "female", "pathway": "female"}
    profile = {
        "date_of_birth": "1997-04-10",
        "height_cm": 165.0,
        "weight_kg": 62.0,
        "activity_level": "moderate",
        "dietary_preference": "halal_omnivore",
        "food_allergies": ["none"],
    }

    plan_dto = test_service.generate_weekly_plan(
        user_id=user_id,
        raw_user_meta_data=raw_meta,
        profile_data=profile,
        active_assessment_module="female_pcos",
    )

    assert plan_dto["id"] is not None
    assert len(plan_dto["days"]) == 7
    for day in plan_dto["days"]:
        assert len(day["meals"]) >= 3
        assert day["energy_kcal"] > 0


# ==============================================================================
# 9. Male Pathway Regression (AndroSense Compatibility)
# ==============================================================================

def test_male_pathway_regression(test_service):
    """Male pathway remains 100% operational."""
    male_id = str(uuid.uuid4())
    raw_meta = {"gender": "male", "pathway": "male"}
    profile = {
        "date_of_birth": "1994-11-20",
        "height_cm": 180.0,
        "weight_kg": 78.0,
        "activity_level": "active",
        "dietary_preference": "halal_omnivore",
        "food_allergies": ["none"],
    }

    male_plan = test_service.generate_weekly_plan(
        user_id=male_id,
        raw_user_meta_data=raw_meta,
        profile_data=profile,
        active_assessment_module="male_hypogonadism",
    )

    assert male_plan["id"] is not None
    assert male_plan["profile_context"]["condition_pathway"].lower() in ("male_hypogonadism", "male")
    assert len(male_plan["days"]) == 7
