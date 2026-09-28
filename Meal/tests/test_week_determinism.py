"""Meal/tests/test_week_determinism.py - Determinism and Input Invariance Tests for Phase 6E.

Verifies:
1. Shuffling candidate day pool inputs produces the exact same selected week and canonical_week_id.
2. Multiple consecutive invocations are bitwise repeatable.
"""

import random
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
        protein_g=15.0,
        fat_g=8.0,
        carbohydrate_g=50.0,
        fiber_g=5.0,
        fiber_status="COMPLETE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=comb_id,
        items=[item],
        total_energy_kcal=energy_kcal,
        total_protein_g=15.0,
        total_fat_g=8.0,
        total_carbohydrate_g=50.0,
        total_fiber_g=5.0,
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
    ctx = ConditionEvidenceContext(condition_pathway=ConditionPathway.GENERAL, evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY)
    condition = build_condition_nutrition_profile(neutral, ctx)
    return neutral, condition


def test_candidate_pool_shuffling_invariance(base_profiles):
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal

    days = [
        _make_mock_day("Alpha", target_e, neutral),
        _make_mock_day("Beta", target_e + 10.0, neutral),
        _make_mock_day("Gamma", target_e - 10.0, neutral),
    ]

    policy = WeeklyVarietyPolicy(maximum_candidate_days_per_slot=3)

    # Run 1: Original order
    res_1 = generate_weekly_plan(neutral, condition, candidate_day_pool=list(days), planning_days=5, policy=policy)

    # Run 2: Shuffled order
    shuffled = list(days)
    random.Random(42).shuffle(shuffled)
    res_2 = generate_weekly_plan(neutral, condition, candidate_day_pool=shuffled, planning_days=5, policy=policy)

    # Run 3: Reversed order
    reversed_days = list(reversed(days))
    res_3 = generate_weekly_plan(neutral, condition, candidate_day_pool=reversed_days, planning_days=5, policy=policy)

    assert res_1.best_week.canonical_week_id == res_2.best_week.canonical_week_id == res_3.best_week.canonical_week_id
    assert res_1.best_week.nutrition_summary.sum_J_day == res_2.best_week.nutrition_summary.sum_J_day == res_3.best_week.nutrition_summary.sum_J_day
