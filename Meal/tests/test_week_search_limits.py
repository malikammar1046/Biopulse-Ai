"""Meal/tests/test_week_search_limits.py - Weekly Search-Space Bounds & Truncation Diagnostics Tests.

Verifies:
1. Search space bounds: maximum_candidate_days_per_slot and maximum_week_candidate_sequences_evaluated.
2. Truncation flags: week_search_truncated=True, week_search_exhaustive=False.
3. Emission of warning BETTER_UNEVALUATED_WEEK_MAY_EXIST when evaluation limit truncates search.
4. Exhaustive search tracking when all candidate combinations are evaluated within limits.
"""

import pytest

from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealFeasibilityClass,
    MealItem,
    RecipeCoverageStatus,
    SingleMealPlan,
)
from Meal.daily.aggregation import assemble_full_day_meal_plan
from Meal.daily.schemas import FullDayMealPlan
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import ConditionEvidenceContext, ConditionPathway, EvidenceContextStatus
from Meal.optimizer.schemas import PortionOptimizationStatus
from Meal.planner.schemas import MealRole
from Meal.weekly.orchestrator import generate_weekly_plan
from Meal.weekly.schemas import WeeklyVarietyPolicy


def _make_mock_meal(role: MealRole, comb_id: str, energy_kcal: float) -> SingleMealPlan:
    item = MealItem(
        entity_id=f"E_{comb_id}",
        display_name=f"Food {comb_id}",
        optimized_grams=100.0,
        standard_portion_grams=100.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="serving",
        energy_kcal=energy_kcal,
        protein_g=10.0,
        fat_g=5.0,
        carbohydrate_g=40.0,
        fiber_g=4.0,
        fiber_status="COMPLETE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=comb_id,
        items=[item],
        total_energy_kcal=energy_kcal,
        total_protein_g=10.0,
        total_fat_g=5.0,
        total_carbohydrate_g=40.0,
        total_fiber_g=4.0,
        fiber_coverage_status="COMPLETE",
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=0.0,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
        item_recipe_availability={item.entity_id: item.recipe_availability},
        matched_preferred_entity_count=0,
        total_valid_preferred_entity_count=0,
        preference_coverage=0.0,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


def _make_mock_day(day_id: str, energy_kcal: float, target_profile) -> FullDayMealPlan:
    meal = _make_mock_meal(MealRole.LUNCH, day_id, energy_kcal)
    return assemble_full_day_meal_plan({MealRole.LUNCH: meal}, target_profile)


@pytest.fixture
def base_profiles():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition = build_condition_nutrition_profile(neutral, ctx)
    return neutral, condition


def test_exhaustive_search_within_limits(base_profiles):
    """When total possible weekly sequences <= evaluation limit, search is exhaustive."""
    neutral, condition = base_profiles
    day_1 = _make_mock_day("D1", 1000.0, neutral)
    day_2 = _make_mock_day("D2", 1000.0, neutral)

    # 3 days planning with 2 options each -> 2^3 = 8 sequences
    pool = [day_1, day_2]
    policy = WeeklyVarietyPolicy(
        maximum_week_candidate_sequences_evaluated=20,
        maximum_candidate_days_per_slot=2,
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_day_pool=pool,
        planning_days=3,
        policy=policy,
    )

    assert result.total_possible_week_sequences == 8
    assert result.week_sequences_evaluated == 8
    assert result.week_search_truncated is False
    assert result.week_search_exhaustive is True
    assert not any("BETTER_UNEVALUATED_WEEK_MAY_EXIST" in w for w in result.warnings)


def test_truncated_search_surfaces_warning(base_profiles):
    """When candidate sequences exceed evaluation limit, search is truncated and warning emitted."""
    neutral, condition = base_profiles
    day_1 = _make_mock_day("D1", 1000.0, neutral)
    day_2 = _make_mock_day("D2", 1000.0, neutral)

    # 4 days with 2 options each -> 2^4 = 16 sequences, but cap evaluated sequences at 5
    pool = [day_1, day_2]
    policy = WeeklyVarietyPolicy(
        maximum_week_candidate_sequences_evaluated=5,
        maximum_candidate_days_per_slot=2,
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_day_pool=pool,
        planning_days=4,
        policy=policy,
    )

    assert result.total_possible_week_sequences == 16
    assert result.week_sequences_evaluated == 5
    assert result.week_search_truncated is True
    assert result.week_search_exhaustive is False
    assert any("BETTER_UNEVALUATED_WEEK_MAY_EXIST" in w for w in result.warnings)
