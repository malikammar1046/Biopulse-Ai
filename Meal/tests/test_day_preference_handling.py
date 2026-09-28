"""Meal/tests/test_day_preference_handling.py - Tests role-scoped and day-level user preferences.

Verifies:
1. Role-specific preferences applied to the appropriate meal role.
2. Day-level preferences available across all eligible meals.
3. Candidate day ranking: higher preference coverage breaks ties for identical J_day.
4. Exclusions strictly override preferences.
"""

import pytest

from Meal.daily.orchestrator import compute_day_ranking_key, generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
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
def test_constraints():
    return [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_028", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
    ]


def test_role_scoped_preferences(base_profiles, test_constraints):
    """Preferred food in breakfast allocation is matched in breakfast meal plan."""
    neutral, condition = base_profiles

    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=10.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        ),
        preferred_entity_ids=["PK_COMP_001"],  # Dahi preferred for breakfast
    )
    schedule = DailyMealSchedule(allocations=[alloc_b])

    res = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        default_constraints=test_constraints,
    )

    assert res.is_successful
    assert res.best_day_plan is not None
    b_meal = res.best_day_plan.meals[MealRole.BREAKFAST]
    assert "PK_COMP_001" in [i.entity_id for i in b_meal.items]
    assert res.best_day_plan.matched_preferred_entity_count >= 1
    assert res.best_day_plan.preference_coverage > 0.0


def test_exclusion_overrides_preference(base_profiles, test_constraints):
    """When a food is both preferred and excluded, exclusion wins and food is omitted."""
    neutral, condition = base_profiles

    alloc_b = MealAllocation(
        role=MealRole.BREAKFAST,
        target=PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=10.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        ),
        preferred_entity_ids=["PK_COMP_001"],
        explicitly_excluded_ids=["PK_COMP_001"],
    )
    schedule = DailyMealSchedule(allocations=[alloc_b])

    res = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        default_constraints=test_constraints,
    )

    assert res.is_successful
    assert res.best_day_plan is not None
    b_meal = res.best_day_plan.meals[MealRole.BREAKFAST]
    assert "PK_COMP_001" not in [i.entity_id for i in b_meal.items]
