"""
backend/apps/health/tests/test_nutrition_api.py

Comprehensive tests for BioPulse Nutrition & Meal Planning API:
- Authentication & authorization isolation (User A vs User B).
- Readiness validation (fail-closed, minimum age 12, under-12 blocked, allergies, dietary, activity).
- Pathway mapping & condition isolation (PCOS, Male Hypogonadism, General, screening probability zero effect).
- Evidence context status (SCREENING_PATHWAY with matching assessment, UNKNOWN without assessment).
- Portion registry cannot bypass Phase 6A safety checks.
- Weekly plan generation & stable DTO format.
- Snapshot immutability (old plan payload unchanged after regeneration).
- Active-plan uniqueness (exactly one active plan per user).
"""

from __future__ import annotations

import copy
import os
import uuid
from datetime import date, timedelta
from typing import Any, Dict
from unittest.mock import MagicMock, patch

import jwt
import pytest
from django.test import RequestFactory
from rest_framework import status

from apps.authentication.supabase_auth import SupabaseAuthentication, SupabaseUser
from apps.health.services.meal_constraint_provider import (
    gate_phase6a_candidates,
    get_production_eligible_entity_ids,
    get_production_portion_constraints,
)
from apps.health.services.meal_plan_repository import MealPlanRepository
from apps.health.services.meal_plan_service import (
    MealPlanService,
    NutritionReadinessException,
    meal_plan_service,
)
from apps.health.services.meal_profile_builder import (
    MealProfileBuilder,
    calculate_age_and_decimal,
)
from apps.health.views_nutrition import (
    CurrentNutritionPlanView,
    NutritionPlanDetailView,
    NutritionPlanHistoryView,
    NutritionPlanRegenerateView,
    NutritionReadinessView,
    NutritionTargetsView,
    WeeklyPlanGenerateView,
)
from Meal.engine.schemas import Allergen, DietaryClass, Goal, PALCategory
from Meal.evidence.schemas import ConditionPathway, EvidenceContextStatus
from Meal.planner.schemas import CandidateEvaluation, CandidateRankingResult, PrimaryDisposition

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
    # Also link global meal_plan_service to in-memory repo during tests
    meal_plan_service.repository = test_repo
    return srv


@pytest.fixture
def rf():
    return RequestFactory()


def create_token(user_id: str = "00000000-0000-0000-0000-000000000001", email: str = "patient1@example.com") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999,
        "user_metadata": {"gender": "female", "pathway": "female"},
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


# ─── 1. READINESS & PROFILE BUILDER TESTS ──────────────────────────────────────

def test_readiness_valid_profile():
    raw_meta = {"gender": "female", "pathway": "female"}
    profile = {
        "date_of_birth": "1998-05-15",
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is True
    assert readiness.required_biometrics["status"] == "PASS"
    assert readiness.safety_confirmations["status"] == "PASS"
    assert readiness.planning_inputs["status"] == "PASS"


def test_readiness_minimum_age_12():
    # Exactly 12 years old today
    today = date.today()
    dob_12 = (today - timedelta(days=12 * 365 + 4)).isoformat()
    raw_meta = {"gender": "female", "pathway": "female"}
    profile = {
        "date_of_birth": dob_12,
        "height_cm": 150.0,
        "weight_kg": 45.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is True
    assert readiness.required_biometrics["status"] == "PASS"

    user_profile = MealProfileBuilder.build_user_nutrition_profile("user-1", raw_meta, profile)
    assert user_profile.age >= 12


def test_readiness_under_12_blocked():
    # 11 years old
    today = date.today()
    dob_11 = (today - timedelta(days=11 * 365)).isoformat()
    raw_meta = {"gender": "female"}
    profile = {
        "date_of_birth": dob_11,
        "height_cm": 140.0,
        "weight_kg": 35.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is False
    assert readiness.required_biometrics["status"] == "FAIL"
    assert "minimum_age_12_required" in readiness.required_biometrics["missing"]

    with pytest.raises(ValueError, match="Minimum supported age is 12"):
        MealProfileBuilder.build_user_nutrition_profile("user-1", raw_meta, profile)


def test_readiness_missing_biometrics():
    raw_meta = {}
    profile = {
        "date_of_birth": None,
        "height_cm": None,
        "weight_kg": 0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is False
    assert "date_of_birth" in readiness.required_biometrics["missing"]
    assert "height_cm" in readiness.required_biometrics["missing"]
    assert "weight_kg" in readiness.required_biometrics["missing"]
    assert "reference_equation_sex" in readiness.required_biometrics["missing"]


def test_readiness_unknown_allergies_blocked():
    # Empty list must NOT default to None
    raw_meta = {"gender": "female"}
    profile = {
        "date_of_birth": "1995-01-01",
        "height_cm": 160.0,
        "weight_kg": 55.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": [],  # unanswered / empty
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is False
    assert "allergy_confirmation" in readiness.safety_confirmations["missing"]

    # Null / None allergies
    profile["allergies"] = None
    readiness2 = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness2.ready is False
    assert "allergy_confirmation" in readiness2.safety_confirmations["missing"]


def test_readiness_unsupported_allergies_blocked():
    # Shellfish is not in verified catalog metadata
    raw_meta = {"gender": "female"}
    profile = {
        "date_of_birth": "1995-01-01",
        "height_cm": 160.0,
        "weight_kg": 55.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["shellfish"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is False
    assert "unsupported_allergen_requires_manual_review" in readiness.safety_confirmations["missing"]


def test_readiness_supported_allergies_mapped():
    raw_meta = {"gender": "female"}
    profile = {
        "date_of_birth": "1995-01-01",
        "height_cm": 160.0,
        "weight_kg": 55.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["dairy", "wheat"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is True

    user = MealProfileBuilder.build_user_nutrition_profile("user-1", raw_meta, profile)
    assert Allergen.DAIRY in user.food_allergies
    assert Allergen.WHEAT in user.food_allergies


def test_readiness_missing_dietary_blocked():
    raw_meta = {"gender": "female"}
    profile = {
        "date_of_birth": "1995-01-01",
        "height_cm": 160.0,
        "weight_kg": 55.0,
        "activity_level": "moderate",
        "dietary_preference": None,
        "allergies": ["None"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is False
    assert "dietary_preference_confirmation" in readiness.safety_confirmations["missing"]


def test_readiness_missing_activity_blocked():
    raw_meta = {"gender": "female"}
    profile = {
        "date_of_birth": "1995-01-01",
        "height_cm": 160.0,
        "weight_kg": 55.0,
        "activity_level": None,
        "dietary_preference": "standard",
        "allergies": ["None"],
    }
    readiness = MealProfileBuilder.check_nutrition_readiness(raw_meta, profile)
    assert readiness.ready is False
    assert "activity_level" in readiness.planning_inputs["missing"]


# ─── 2. PATHWAY & EVIDENCE CONTEXT MAPPING TESTS ─────────────────────────────

def test_pathway_mapping():
    # Female pathway
    ctx_f = MealProfileBuilder.build_condition_evidence_context(
        "u1", {"pathway": "female"}, {}, active_assessment_module="female_pcos"
    )
    assert ctx_f.condition_pathway == ConditionPathway.PCOS
    assert ctx_f.evidence_context_status == EvidenceContextStatus.SCREENING_PATHWAY

    # Male pathway
    ctx_m = MealProfileBuilder.build_condition_evidence_context(
        "u2", {"pathway": "male"}, {}, active_assessment_module="male_hypogonadism"
    )
    assert ctx_m.condition_pathway == ConditionPathway.MALE_HYPOGONADISM
    assert ctx_m.evidence_context_status == EvidenceContextStatus.SCREENING_PATHWAY

    # General pathway
    ctx_g = MealProfileBuilder.build_condition_evidence_context(
        "u3", {"pathway": "general"}, {}, active_assessment_module=None
    )
    assert ctx_g.condition_pathway == ConditionPathway.GENERAL
    assert ctx_g.evidence_context_status == EvidenceContextStatus.UNKNOWN


def test_evidence_context_status_without_assessment_is_unknown():
    # Pathway female but no active assessment -> UNKNOWN (Mandatory Correction #1)
    ctx = MealProfileBuilder.build_condition_evidence_context(
        "u1", {"pathway": "female"}, {}, active_assessment_module=None
    )
    assert ctx.condition_pathway == ConditionPathway.PCOS
    assert ctx.evidence_context_status == EvidenceContextStatus.UNKNOWN

    # Pathway male but no active assessment -> UNKNOWN
    ctx_m = MealProfileBuilder.build_condition_evidence_context(
        "u2", {"pathway": "male"}, {}, active_assessment_module=None
    )
    assert ctx_m.condition_pathway == ConditionPathway.MALE_HYPOGONADISM
    assert ctx_m.evidence_context_status == EvidenceContextStatus.UNKNOWN


def test_gender_alone_does_not_activate_condition_evidence():
    # User has gender="female" but pathway="general"
    ctx = MealProfileBuilder.build_condition_evidence_context(
        "u1", {"gender": "female", "pathway": "general"}, {}, active_assessment_module="female_pcos"
    )
    assert ctx.condition_pathway == ConditionPathway.GENERAL
    assert ctx.evidence_context_status == EvidenceContextStatus.UNKNOWN


def test_screening_risk_probability_has_zero_nutrition_effect(test_service):
    # Identical neutral profile under female PCOS vs female General yields identical neutral targets
    profile_data = {
        "date_of_birth": "1998-01-01",
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }
    # User 1: Female PCOS
    t_f = test_service.get_nutrition_targets(
        user_id="u_f",
        raw_user_meta_data={"gender": "female", "pathway": "female"},
        profile_data=profile_data,
        active_assessment_module="female_pcos",
    )
    # User 2: Female General
    t_g = test_service.get_nutrition_targets(
        user_id="u_g",
        raw_user_meta_data={"gender": "female", "pathway": "general"},
        profile_data=profile_data,
        active_assessment_module=None,
    )
    assert t_f["energy_kcal"] == t_g["energy_kcal"]
    assert t_f["protein_g"] == t_g["protein_g"]
    assert t_f["carbohydrate_g"] == t_g["carbohydrate_g"]
    assert t_f["fat_g"] == t_g["fat_g"]


# ─── 3. PORTION REGISTRY CANNOT BYPASS PHASE 6A ──────────────────────────────

def test_portion_registry_cannot_bypass_phase6a():
    """
    Proves that a food in verified_meal_portion_constraints.csv CANNOT bypass Phase 6A exclusion.
    final_eligible_ids = phase6a_ready_ids ∩ production_portion_eligible_ids
    """
    from Meal.engine.orchestrator import build_nutrition_target_profile
    from Meal.evidence.orchestrator import build_condition_nutrition_profile
    from Meal.evidence.schemas import ConditionEvidenceContext, ConditionPathway, EvidenceContextStatus
    from Meal.planner.orchestrator import rank_meal_candidates
    from Meal.planner.schemas import CandidateSelectionContext, MealRole

    # 1. User with dairy allergy
    user = MealProfileBuilder.build_user_nutrition_profile(
        user_id="u-dairy-allergy",
        raw_user_meta_data={"gender": "female"},
        profile_data={
            "date_of_birth": "1995-01-01",
            "height_cm": 160.0,
            "weight_kg": 55.0,
            "activity_level": "moderate",
            "dietary_preference": "standard",
            "allergies": ["dairy"],
        },
    )
    neutral = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition = build_condition_nutrition_profile(neutral, ctx)

    # 2. Rank candidates for Breakfast (where Dahi / Yogurt PK_COMP_001 is a candidate)
    pctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST, allergies=user.food_allergies)
    cand_res = rank_meal_candidates(neutral, condition, pctx)

    # Verify PK_COMP_001 is excluded by Phase 6A due to dairy allergy
    assert any(c.entity_id == "PK_COMP_001" for c in cand_res.excluded_candidates)
    assert not any(c.entity_id == "PK_COMP_001" for c in cand_res.ranked_optimization_candidates)

    # 3. Apply production portion gate
    gated = gate_phase6a_candidates(cand_res)

    # Even though PK_COMP_001 is in verified_meal_portion_constraints.csv,
    # the portion registry gate CANNOT bypass Phase 6A exclusion!
    eligible_ids = get_production_eligible_entity_ids()
    assert "PK_COMP_001" in eligible_ids
    assert not any(c.entity_id == "PK_COMP_001" for c in gated.ranked_optimization_candidates)
    assert any(c.entity_id == "PK_COMP_001" for c in gated.excluded_candidates)


# ─── 4. REPOSITORY & IMMUTABILITY TESTS ────────────────────────────────────────

def test_repository_save_and_retrieve(test_repo):
    user_id = str(uuid.uuid4())
    saved = test_repo.save_plan(
        user_id=user_id,
        plan_type="WEEKLY_7_DAY",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=6),
        profile_snapshot={"age": 25},
        target_profile={"energy_kcal": 2000},
        condition_context={"condition_pathway": "PCOS"},
        plan_data={"weekly_status": "FULL_WEEK_GENERATED", "days": []},
        audit_diagnostics={"evaluated": 50},
    )

    assert saved["is_active"] is True
    assert saved["user_id"] == user_id

    # Retrieve active
    active = test_repo.get_active_plan(user_id)
    assert active is not None
    assert active["id"] == saved["id"]

    # History
    history = test_repo.get_plan_history(user_id)
    assert len(history) == 1
    assert history[0]["id"] == saved["id"]


def test_regeneration_immutability_and_single_active_plan(test_repo):
    user_id = str(uuid.uuid4())

    # 1. Initial Plan
    plan1 = test_repo.save_plan(
        user_id=user_id,
        plan_type="WEEKLY_7_DAY",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=6),
        profile_snapshot={"age": 25},
        target_profile={"energy_kcal": 2000},
        condition_context={"condition_pathway": "PCOS"},
        plan_data={"weekly_status": "FULL_WEEK_GENERATED", "energy_total": 14000},
        audit_diagnostics={"v": 1},
    )
    plan1_id = plan1["id"]
    plan1_data_original = copy.deepcopy(plan1["plan_data"])

    # 2. Regenerate Plan
    plan2 = test_repo.save_plan(
        user_id=user_id,
        plan_type="WEEKLY_7_DAY",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=6),
        profile_snapshot={"age": 25},
        target_profile={"energy_kcal": 2000},
        condition_context={"condition_pathway": "PCOS"},
        plan_data={"weekly_status": "FULL_WEEK_GENERATED", "energy_total": 14200},
        audit_diagnostics={"v": 2},
    )
    plan2_id = plan2["id"]

    # Invariants:
    # A. Exactly one active plan
    active = test_repo.get_active_plan(user_id)
    assert active["id"] == plan2_id
    assert active["is_active"] is True

    # B. Old plan is now inactive
    old_plan = test_repo.get_plan_by_id(user_id, plan1_id)
    assert old_plan["is_active"] is False
    assert plan2["replaced_plan_id"] == plan1_id

    # C. MANDATORY CORRECTION #3: Old plan payload is 100% UNCHANGED
    assert old_plan["plan_data"] == plan1_data_original
    assert old_plan["target_profile"] == plan1["target_profile"]
    assert old_plan["profile_snapshot"] == plan1["profile_snapshot"]


def test_authorization_isolation(test_repo):
    user_a = str(uuid.uuid4())
    user_b = str(uuid.uuid4())

    plan_a = test_repo.save_plan(
        user_id=user_a,
        plan_type="WEEKLY_7_DAY",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=6),
        profile_snapshot={"age": 25},
        target_profile={"energy_kcal": 2000},
        condition_context={"condition_pathway": "PCOS"},
        plan_data={"weekly_status": "FULL_WEEK_GENERATED"},
        audit_diagnostics={},
    )

    # User B cannot retrieve User A's plan by ID
    assert test_repo.get_plan_by_id(user_id=user_b, plan_id=plan_a["id"]) is None

    # User B history does not contain User A's plan
    history_b = test_repo.get_plan_history(user_id=user_b)
    assert len(history_b) == 0


# ─── 5. FULL END-TO-END WEEKLY PLAN GENERATION TESTS ─────────────────────────

def test_generate_weekly_plan_female_pcos(test_service):
    user_id = str(uuid.uuid4())
    raw_meta = {"gender": "female", "pathway": "female"}
    profile = {
        "date_of_birth": "1996-03-20",
        "height_cm": 162.0,
        "weight_kg": 58.0,
        "activity_level": "moderate",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }

    result = test_service.generate_weekly_plan(
        user_id=user_id,
        raw_user_meta_data=raw_meta,
        profile_data=profile,
        active_assessment_module="female_pcos",
    )

    assert result["plan_type"] == "WEEKLY_7_DAY"
    assert result["is_active"] is True
    assert result["profile_context"]["condition_pathway"] == "PCOS"
    assert result["profile_context"]["evidence_context_status"] == "SCREENING_PATHWAY"
    assert len(result["days"]) == 7
    for day in result["days"]:
        assert len(day["meals"]) == 4  # Breakfast, Lunch, Dinner, Snack
        assert day["energy_kcal"] > 0
        assert "target_adherence" in day

    assert result["coverage"]["recipes"] is not None
    assert result["coverage"]["verified_subset_notice"] is not None


def test_generate_weekly_plan_male_hypogonadism(test_service):
    user_id = str(uuid.uuid4())
    raw_meta = {"gender": "male", "pathway": "male"}
    profile = {
        "date_of_birth": "1994-08-10",
        "height_cm": 175.0,
        "weight_kg": 75.0,
        "activity_level": "active",
        "dietary_preference": "standard",
        "allergies": ["None"],
    }

    result = test_service.generate_weekly_plan(
        user_id=user_id,
        raw_user_meta_data=raw_meta,
        profile_data=profile,
        active_assessment_module="male_hypogonadism",
    )

    assert result["plan_type"] == "WEEKLY_7_DAY"
    assert result["is_active"] is True
    assert result["profile_context"]["condition_pathway"] == "MALE_HYPOGONADISM"
    assert result["profile_context"]["evidence_context_status"] == "SCREENING_PATHWAY"
    assert len(result["days"]) == 7


# ─── 6. DRF VIEW ENDPOINTS INTEGRATION TESTS ─────────────────────────────────

@patch("apps.health.views_nutrition._extract_user_context")
def test_nutrition_readiness_view(mock_extract, test_service, rf):
    user_id = "00000000-0000-0000-0000-000000000001"
    token = create_token(user_id=user_id)

    mock_extract.return_value = (
        {"gender": "female", "pathway": "female"},
        {
            "date_of_birth": "1998-05-15",
            "height_cm": 165.0,
            "weight_kg": 60.0,
            "activity_level": "moderate",
            "dietary_preference": "standard",
            "allergies": ["None"],
        },
        "female_pcos",
    )

    view = NutritionReadinessView.as_view()
    req = rf.get("/api/v1/health/nutrition/readiness/", HTTP_AUTHORIZATION=f"Bearer {token}")

    resp = view(req)
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["ready"] is True


@patch("apps.health.views_nutrition._extract_user_context")
def test_nutrition_targets_view(mock_extract, test_service, rf):
    user_id = "00000000-0000-0000-0000-000000000001"
    token = create_token(user_id=user_id)

    mock_extract.return_value = (
        {"gender": "female", "pathway": "female"},
        {
            "date_of_birth": "1998-05-15",
            "height_cm": 165.0,
            "weight_kg": 60.0,
            "activity_level": "moderate",
            "dietary_preference": "standard",
            "allergies": ["None"],
        },
        "female_pcos",
    )

    view = NutritionTargetsView.as_view()
    req = rf.get("/api/v1/health/nutrition/targets/", HTTP_AUTHORIZATION=f"Bearer {token}")

    resp = view(req)
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["energy_kcal"] > 0
    assert "protein_g" in resp.data


@patch("apps.health.views_nutrition._extract_user_context")
def test_weekly_plan_generate_view(mock_extract, test_service, rf):
    user_id = "00000000-0000-0000-0000-000000000001"
    token = create_token(user_id=user_id)

    mock_extract.return_value = (
        {"gender": "female", "pathway": "female"},
        {
            "date_of_birth": "1998-05-15",
            "height_cm": 165.0,
            "weight_kg": 60.0,
            "activity_level": "moderate",
            "dietary_preference": "standard",
            "allergies": ["None"],
        },
        "female_pcos",
    )

    view = WeeklyPlanGenerateView.as_view()
    req = rf.post("/api/v1/health/nutrition/plan/weekly/", HTTP_AUTHORIZATION=f"Bearer {token}")

    resp = view(req)
    assert resp.status_code == status.HTTP_201_CREATED
    assert resp.data["plan_type"] == "WEEKLY_7_DAY"
    assert len(resp.data["days"]) == 7

    # Test Current Plan View
    curr_view = CurrentNutritionPlanView.as_view()
    req_curr = rf.get("/api/v1/health/nutrition/plan/current/", HTTP_AUTHORIZATION=f"Bearer {token}")
    resp_curr = curr_view(req_curr)
    assert resp_curr.status_code == status.HTTP_200_OK
    assert resp_curr.data["id"] == resp.data["id"]

    # Test Detail View
    detail_view = NutritionPlanDetailView.as_view()
    req_det = rf.get(f"/api/v1/health/nutrition/plan/{resp.data['id']}/", HTTP_AUTHORIZATION=f"Bearer {token}")
    resp_det = detail_view(req_det, plan_id=resp.data["id"])
    assert resp_det.status_code == status.HTTP_200_OK

    # Test Unauthorized Detail View (User B)
    token_b = create_token(user_id="00000000-0000-0000-0000-000000000002", email="userb@example.com")
    req_det_unauth = rf.get(f"/api/v1/health/nutrition/plan/{resp.data['id']}/", HTTP_AUTHORIZATION=f"Bearer {token_b}")
    resp_det_unauth = detail_view(req_det_unauth, plan_id=resp.data["id"])
    assert resp_det_unauth.status_code == status.HTTP_404_NOT_FOUND


@patch("apps.health.views_nutrition._extract_user_context")
def test_cross_user_female_male_plan_isolation(mock_extract, test_service, rf):
    """
    Explicit cross-user isolation test:
    - female token -> female plan = allowed (200)
    - female token -> male plan = denied/not returned (404)
    - male token -> male plan = allowed (200)
    - male token -> female plan = denied/not returned (404)
    - request body user_id spoofing attempt has zero effect on plan ownership
    """
    female_id = "11111111-1111-1111-1111-111111111111"
    male_id = "22222222-2222-2222-2222-222222222222"
    attacker_id = "99999999-9999-9999-9999-999999999999"

    female_token = create_token(user_id=female_id, email="female@pmosense.test")
    male_token = create_token(user_id=male_id, email="male@pmosense.test")

    female_context = (
        {"gender": "female", "pathway": "female"},
        {
            "date_of_birth": "1997-04-10",
            "height_cm": 165.0,
            "weight_kg": 62.0,
            "activity_level": "moderate",
            "dietary_preference": "standard",
            "allergies": ["None"],
        },
        "female_pcos",
    )
    male_context = (
        {"gender": "male", "pathway": "male"},
        {
            "date_of_birth": "1995-08-20",
            "height_cm": 178.0,
            "weight_kg": 75.0,
            "activity_level": "active",
            "dietary_preference": "standard",
            "allergies": ["None"],
        },
        "male_hypogonadism",
    )

    def extract_side_effect(request):
        if str(request.user.id) == female_id:
            return female_context
        elif str(request.user.id) == male_id:
            return male_context
        return ({}, {}, None)

    mock_extract.side_effect = extract_side_effect

    generate_view = WeeklyPlanGenerateView.as_view()
    current_view = CurrentNutritionPlanView.as_view()
    detail_view = NutritionPlanDetailView.as_view()

    # 1. Generate female plan (attempting body user_id spoof with attacker_id)
    req_gen_fem = rf.post(
        "/api/v1/health/nutrition/plan/weekly/",
        data={"user_id": attacker_id},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {female_token}",
    )
    resp_fem = generate_view(req_gen_fem)
    assert resp_fem.status_code == status.HTTP_201_CREATED
    female_plan_id = resp_fem.data["id"]
    # Confirm user_id is authoritatively the female caller, NOT the spoofed body ID
    assert test_service.repository.get_plan_by_id(user_id=female_id, plan_id=female_plan_id) is not None
    assert test_service.repository.get_plan_by_id(user_id=attacker_id, plan_id=female_plan_id) is None

    # 2. Generate male plan
    req_gen_male = rf.post(
        "/api/v1/health/nutrition/plan/weekly/",
        data={},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {male_token}",
    )
    resp_male = generate_view(req_gen_male)
    assert resp_male.status_code == status.HTTP_201_CREATED
    male_plan_id = resp_male.data["id"]
    assert test_service.repository.get_plan_by_id(user_id=male_id, plan_id=male_plan_id) is not None

    # 3. female token -> female plan = allowed (200)
    req_fem_own = rf.get(f"/api/v1/health/nutrition/plan/{female_plan_id}/", HTTP_AUTHORIZATION=f"Bearer {female_token}")
    res_fem_own = detail_view(req_fem_own, plan_id=female_plan_id)
    assert res_fem_own.status_code == status.HTTP_200_OK
    assert res_fem_own.data["id"] == female_plan_id

    # 4. female token -> male plan = denied/not returned (404)
    req_fem_cross = rf.get(f"/api/v1/health/nutrition/plan/{male_plan_id}/", HTTP_AUTHORIZATION=f"Bearer {female_token}")
    res_fem_cross = detail_view(req_fem_cross, plan_id=male_plan_id)
    assert res_fem_cross.status_code == status.HTTP_404_NOT_FOUND

    # 5. male token -> male plan = allowed (200)
    req_male_own = rf.get(f"/api/v1/health/nutrition/plan/{male_plan_id}/", HTTP_AUTHORIZATION=f"Bearer {male_token}")
    res_male_own = detail_view(req_male_own, plan_id=male_plan_id)
    assert res_male_own.status_code == status.HTTP_200_OK
    assert res_male_own.data["id"] == male_plan_id

    # 6. male token -> female plan = denied/not returned (404)
    req_male_cross = rf.get(f"/api/v1/health/nutrition/plan/{female_plan_id}/", HTTP_AUTHORIZATION=f"Bearer {male_token}")
    res_male_cross = detail_view(req_male_cross, plan_id=female_plan_id)
    assert res_male_cross.status_code == status.HTTP_404_NOT_FOUND

    # 7. current plan isolation check
    curr_fem = current_view(rf.get("/api/v1/health/nutrition/plan/current/", HTTP_AUTHORIZATION=f"Bearer {female_token}"))
    assert curr_fem.status_code == status.HTTP_200_OK
    assert curr_fem.data["id"] == female_plan_id

    curr_male = current_view(rf.get("/api/v1/health/nutrition/plan/current/", HTTP_AUTHORIZATION=f"Bearer {male_token}"))
    assert curr_male.status_code == status.HTTP_200_OK
    assert curr_male.data["id"] == male_plan_id

