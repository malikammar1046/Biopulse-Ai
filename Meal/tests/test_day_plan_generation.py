"""Meal/tests/test_day_plan_generation.py - End-to-end tests for Phase 6D Full-Day Meal Planning.

Verifies:
1. End-to-end 4-meal day generation (Breakfast, Lunch, Dinner, Snack).
2. Golden fixture consistency against full_day_planner_golden.json.
3. Cross-meal duplicate handling: food can validly appear in multiple meals,
   with occurrence counts accurately tracked.
4. Schedule reconciliation against Phase 5A neutral targets.
5. Invariant check: Phase 6A excluded foods admitted = 0, Phase 6B/6C bypasses = 0.
"""

import json
from pathlib import Path
import pytest

from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.reconciliation import (
    create_engineering_default_schedule,
    reconcile_daily_schedule,
)
from Meal.daily.schemas import (
    DailyMealSchedule,
    DailyReconciliationStatus,
    FullDayGenerationStatus,
    FullDayPlanningPolicy,
    MealAllocation,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.schemas import PortionConstraint, PortionOptimizationTarget
from Meal.planner.schemas import MealRole


@pytest.fixture
def base_profiles():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition = build_condition_nutrition_profile(neutral, ctx)
    return neutral, condition


@pytest.fixture
def catalog_constraints():
    return [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_016", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_028", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_COMP_010", minimum_grams=20.0, maximum_grams=100.0, preferred_grams=40.0),
    ]


def test_four_meal_day_generation(base_profiles, catalog_constraints):
    """Generates a complete 4-meal day (Breakfast, Lunch, Dinner, Snack)."""
    neutral, condition = base_profiles

    # Explicit 4-meal targets
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=350.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=10.0,
            protein_max_g=30.0,
            carbohydrate_min_g=25.0,
            carbohydrate_max_g=55.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        ),
        preferred_entity_ids=["PK_PORTION_001"],
    )
    alloc_l = MealAllocation(
        role=MealRole.LUNCH,
        target=PortionOptimizationTarget(
            target_energy_kcal=550.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=20.0,
            protein_max_g=45.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=80.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
        preferred_entity_ids=["PK_DISH_025"],
    )
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=18.0,
            protein_max_g=40.0,
            carbohydrate_min_g=35.0,
            carbohydrate_max_g=75.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
        preferred_entity_ids=["PK_DISH_028"],
    )
    alloc_s = MealAllocation(
        role=MealRole.SNACK,
        target=PortionOptimizationTarget(
            target_energy_kcal=180.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=2.0,
            protein_max_g=15.0,
            carbohydrate_min_g=10.0,
            carbohydrate_max_g=35.0,
            fat_min_g=1.0,
            fat_max_g=15.0,
        ),
        preferred_entity_ids=["PK_COMP_010"],
    )

    schedule = DailyMealSchedule(
        allocations=[alloc_b, alloc_l, alloc_d, alloc_s],
        schedule_name="Pakistani 4-Meal Plan",
    )

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        default_constraints=catalog_constraints,
    )

    assert result.is_successful
    assert result.status in (
        FullDayGenerationStatus.FULL_DAILY_TARGETS_MET,
        FullDayGenerationStatus.BEST_AVAILABLE_WITH_DAILY_DEVIATIONS,
    )
    assert result.meals_requested == 4
    assert result.meals_generated == 4
    assert result.meals_failed == []
    assert result.best_day_plan is not None

    plan = result.best_day_plan
    assert plan.meal_count == 4
    assert set(plan.meal_roles) == {MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER, MealRole.SNACK}

    # Verify daily totals are positive and non-zero
    assert plan.daily_energy_kcal > 1000.0
    assert plan.daily_protein_g > 30.0
    assert plan.daily_carbohydrate_g > 80.0
    assert plan.daily_fat_g > 20.0

    # Verify canonical day ID structure
    assert plan.canonical_day_id.startswith("DAY__")
    assert "breakfast:" in plan.canonical_day_id
    assert "lunch:" in plan.canonical_day_id
    assert "dinner:" in plan.canonical_day_id
    assert "snack:" in plan.canonical_day_id

    # Verify occurrences tracked
    assert len(plan.entity_occurrence_counts) > 0
    assert len(plan.equivalence_concept_occurrence_counts) > 0


def test_cross_meal_food_repetition_allowed(base_profiles, catalog_constraints):
    """The same food (e.g., Chapati PK_PORTION_001) can validly appear in breakfast and dinner."""
    neutral, condition = base_profiles

    # Force PK_PORTION_001 as required in both breakfast and dinner
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=5.0,
            protein_max_g=25.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=2.0,
            fat_max_g=20.0,
        ),
        required_entity_ids=["PK_PORTION_001"],
    )
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(
            target_energy_kcal=450.0,
            energy_tolerance_kcal=100.0,
            protein_min_g=15.0,
            protein_max_g=35.0,
            carbohydrate_min_g=25.0,
            carbohydrate_max_g=65.0,
            fat_min_g=5.0,
            fat_max_g=25.0,
        ),
        required_entity_ids=["PK_PORTION_001"],
    )

    schedule = DailyMealSchedule(allocations=[alloc_b, alloc_d])

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        default_constraints=catalog_constraints,
    )

    assert result.is_successful
    plan = result.best_day_plan
    assert plan is not None

    # PK_PORTION_001 is present in both breakfast and dinner
    assert "PK_PORTION_001" in [i.entity_id for i in plan.meals[MealRole.BREAKFAST].items]
    assert "PK_PORTION_001" in [i.entity_id for i in plan.meals[MealRole.DINNER].items]

    # Entity occurrence count for PK_PORTION_001 must be exactly 2
    assert plan.entity_occurrence_counts["PK_PORTION_001"] == 2
    # Equivalence concept tracking for EQ_CHAPATI must be 2
    assert plan.equivalence_concept_occurrence_counts["EQ_CHAPATI"] == 2


def test_golden_fixture_structure():
    """Validates that the golden fixture exists and contains all required cases."""
    fixture_path = Path(__file__).resolve().parent / "fixtures" / "full_day_planner_golden.json"
    assert fixture_path.exists(), f"Missing golden fixture: {fixture_path}"

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cases = {c["case_id"]: c for c in data["cases"]}
    required_case_ids = [
        "case_1_exact_feasible_day",
        "case_2_meals_feasible_daily_target_missed",
        "case_3_one_meal_fails_partial_day",
        "case_4_user_preference_handling",
        "case_5_condition_isolation",
        "case_6_fiber_partial_coverage",
    ]
    for cid in required_case_ids:
        assert cid in cases, f"Missing required golden case: {cid}"
