"""Meal/tests/test_week_equivalence_repetition.py - Semantic Equivalence Repetition Tests.

Verifies:
1. Food entities belonging to the same provenance-backed equivalence group (e.g. PK_DISH_001
   and PK_PORTION_001 -> EQ_CHAPATI) are correctly mapped to their concept.
2. Alternating between different entity IDs from the same equivalence group does NOT fake diversity;
   repetition counters properly detect and aggregate concept occurrences.
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
from Meal.weekly.repetition import evaluate_weekly_repetition
from Meal.weekly.schemas import WeeklyVarietyPolicy


def _make_mock_meal(role: MealRole, comb_id: str, entity_id: str, energy_kcal: float) -> SingleMealPlan:
    item = MealItem(
        entity_id=entity_id,
        display_name=f"Food {entity_id}",
        optimized_grams=80.0,
        standard_portion_grams=80.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="serving",
        energy_kcal=energy_kcal,
        protein_g=5.0,
        fat_g=2.0,
        carbohydrate_g=30.0,
        fiber_g=3.0,
        fiber_status="COMPLETE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=comb_id,
        items=[item],
        total_energy_kcal=energy_kcal,
        total_protein_g=5.0,
        total_fat_g=2.0,
        total_carbohydrate_g=30.0,
        total_fiber_g=3.0,
        fiber_coverage_status="COMPLETE",
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=0.0,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
        item_recipe_availability={entity_id: item.recipe_availability},
        matched_preferred_entity_count=0,
        total_valid_preferred_entity_count=0,
        preference_coverage=0.0,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


@pytest.fixture
def base_target():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


def test_equivalence_repetition_tracking(base_target):
    """Verifies that alternating PK_DISH_001 and PK_PORTION_001 correctly accumulates
    in equivalence_concept_occurrence_counts under 'EQ_CHAPATI'.
    """
    # Day 1 uses PK_DISH_001
    meal_1 = _make_mock_meal(MealRole.LUNCH, "M1", "PK_DISH_001", 300.0)
    day_1 = assemble_full_day_meal_plan({MealRole.LUNCH: meal_1}, base_target, plan_day_index=1)

    # Day 2 uses PK_PORTION_001
    meal_2 = _make_mock_meal(MealRole.LUNCH, "M2", "PK_PORTION_001", 300.0)
    day_2 = assemble_full_day_meal_plan({MealRole.LUNCH: meal_2}, base_target, plan_day_index=2)

    # 4 days total: alternating Day 1 and Day 2
    week_days = [day_1, day_2, day_1, day_2]
    policy = WeeklyVarietyPolicy()

    metrics = evaluate_weekly_repetition(week_days, policy)

    # Entity counts should show 2 of each
    assert metrics.entity_occurrence_counts["PK_DISH_001"] == 2
    assert metrics.entity_occurrence_counts["PK_PORTION_001"] == 2

    # Equivalence concept counts MUST show 4 for EQ_CHAPATI!
    assert metrics.equivalence_concept_occurrence_counts["EQ_CHAPATI"] == 4

    # Consecutive concept runs must show run of 4
    assert metrics.consecutive_concept_runs["EQ_CHAPATI"] == 4
