"""Meal/tests/test_day_partial_failure.py - Tests partial day failure and strict reporting.

Strict Invariants:
1. If breakfast succeeds but dinner fails, Phase 6D NEVER silently returns a successful full day.
2. Returns PARTIAL_DAY_GENERATED with exact failed roles and detailed machine-readable failure reason.
3. When policy.require_all_meals=True (default), best_day_plan is None.
4. When policy.require_all_meals=False, surviving meals are assembled with clear missing meal warnings.
"""

import pytest

from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
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
def default_constraints():
    return [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
    ]


def test_one_meal_fails_strict_policy(base_profiles, default_constraints):
    """When dinner has an impossible/invalid required entity, full-day planner returns PARTIAL_DAY_GENERATED."""
    neutral, condition = base_profiles

    # Breakfast is valid
    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=10.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        ),
    )
    # Dinner requests a non-existent required entity
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=20.0,
            protein_max_g=40.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=80.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
        required_entity_ids=["NON_EXISTENT_FOOD_999"],
    )

    schedule = DailyMealSchedule(
        allocations=[alloc_b, alloc_d],
        schedule_name="Test Partial Schedule",
    )

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        policy=FullDayPlanningPolicy(require_all_meals=True),
        default_constraints=default_constraints,
    )

    assert result.status == FullDayGenerationStatus.PARTIAL_DAY_GENERATED
    assert result.meals_requested == 2
    assert result.meals_generated == 1
    assert result.meals_failed == [MealRole.DINNER]
    assert MealRole.DINNER in result.failed_meal_details
    assert "REQUIRED_ENTITY_NOT_PHASE6A_ELIGIBLE" in result.failed_meal_details[MealRole.DINNER]
    # Under strict policy, best_day_plan must be None to prevent false claims of full day
    assert result.best_day_plan is None


def test_one_meal_fails_permissive_policy(base_profiles, default_constraints):
    """When policy.require_all_meals=False, surviving meals are assembled with partial day status and warning."""
    neutral, condition = base_profiles

    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=10.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        ),
    )
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=20.0,
            protein_max_g=40.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=80.0,
            fat_min_g=10.0,
            fat_max_g=30.0,
        ),
        required_entity_ids=["NON_EXISTENT_FOOD_999"],
    )

    schedule = DailyMealSchedule(
        allocations=[alloc_b, alloc_d],
        schedule_name="Test Permissive Schedule",
    )

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        policy=FullDayPlanningPolicy(require_all_meals=False),
        default_constraints=default_constraints,
    )

    assert result.status == FullDayGenerationStatus.PARTIAL_DAY_GENERATED
    assert result.meals_requested == 2
    assert result.meals_generated == 1
    assert result.meals_failed == [MealRole.DINNER]
    assert result.best_day_plan is not None
    assert result.best_day_plan.meal_count == 1
    assert MealRole.BREAKFAST in result.best_day_plan.meals
    assert any("Partial day" in w for w in result.best_day_plan.warnings)


def test_all_meals_fail(base_profiles, default_constraints):
    """When all meals fail, returns NO_VALID_DAY_PLAN."""
    neutral, condition = base_profiles

    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(target_energy_kcal=300.0),
        required_entity_ids=["NON_EXISTENT_1"],
    )
    alloc_d = MealAllocation(
        role=MealRole.DINNER,
        target=PortionOptimizationTarget(target_energy_kcal=500.0),
        required_entity_ids=["NON_EXISTENT_2"],
    )

    schedule = DailyMealSchedule(allocations=[alloc_b, alloc_d])

    result = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        policy=FullDayPlanningPolicy(require_all_meals=False),
        default_constraints=default_constraints,
    )

    assert result.status == FullDayGenerationStatus.NO_VALID_DAY_PLAN
    assert result.meals_generated == 0
    assert result.best_day_plan is None
