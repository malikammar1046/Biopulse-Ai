"""Meal/tests/test_week_daily_nutrition_preservation.py - Preservation of Daily Nutrition Standards.

Verifies:
1. Daily deviations are NEVER averaged away:
   - If Day 1 is 500 kcal below target and Day 2 is 500 kcal above target,
     the weekly average appears close to target, but both daily failures are explicitly recorded:
     days_with_target_deviations == 2, worst_day_deviation > 0.
2. Nutritional feasibility strictly dominates soft variety penalties.
3. A nutritionally inferior day is NEVER selected just to improve variety.
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
from Meal.daily.schemas import DailyFeasibilityClass, FullDayMealPlan
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import ConditionEvidenceContext, ConditionPathway, EvidenceContextStatus
from Meal.optimizer.schemas import PortionOptimizationStatus
from Meal.planner.schemas import MealRole
from Meal.weekly.aggregation import aggregate_weekly_nutrition
from Meal.weekly.orchestrator import generate_weekly_plan
from Meal.weekly.schemas import WeeklyVarietyPolicy


def _make_mock_meal(role: MealRole, comb_id: str, energy_kcal: float, prot_g: float, carb_g: float, fat_g: float) -> SingleMealPlan:
    item = MealItem(
        entity_id=f"E_{comb_id}",
        display_name=f"Food {comb_id}",
        optimized_grams=100.0,
        standard_portion_grams=100.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="serving",
        energy_kcal=energy_kcal,
        protein_g=prot_g,
        fat_g=fat_g,
        carbohydrate_g=carb_g,
        fiber_g=5.0,
        fiber_status="COMPLETE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=comb_id,
        items=[item],
        total_energy_kcal=energy_kcal,
        total_protein_g=prot_g,
        total_fat_g=fat_g,
        total_carbohydrate_g=carb_g,
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
    prot = ((target_profile.protein_target_min_g or target_profile.protein_amdr_min_g) + (target_profile.protein_target_max_g or target_profile.protein_amdr_max_g)) / 2.0
    carb = ((target_profile.carbohydrate_target_min_g or target_profile.carbohydrate_amdr_min_g) + (target_profile.carbohydrate_target_max_g or target_profile.carbohydrate_amdr_max_g)) / 2.0
    fat = (target_profile.fat_amdr_min_g + target_profile.fat_amdr_max_g) / 2.0

    meal = _make_mock_meal(MealRole.LUNCH, day_id, energy_kcal, prot, carb, fat)
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


def test_daily_deviations_not_averaged_away(base_profiles):
    """Verifies that an under-target day and an over-target day do not average away their daily failures."""
    neutral, _ = base_profiles
    target_e = neutral.energy_target_kcal

    # Day 1: 500 kcal deficit
    day_under = _make_mock_day("under", target_e - 500.0, neutral)
    # Day 2: 500 kcal surplus
    day_over = _make_mock_day("over", target_e + 500.0, neutral)

    assert day_under.all_daily_core_targets_within_range is False
    assert day_over.all_daily_core_targets_within_range is False

    summary = aggregate_weekly_nutrition([day_under, day_over])

    # Average energy equals exactly target_e!
    avg_energy = summary.weekly_energy_known_total / 2.0
    assert abs(avg_energy - target_e) < 1e-6

    # But both days must be recorded as deviations!
    assert summary.days_full_targets_met == 0
    assert summary.days_with_target_deviations == 2
    assert summary.sum_J_day > 0.0
    assert summary.mean_J_day > 0.0
    assert summary.max_J_day > 0.0
    assert summary.daily_statuses == [
        DailyFeasibilityClass.OPTIMAL_WITH_DAILY_DEVIATIONS,
        DailyFeasibilityClass.OPTIMAL_WITH_DAILY_DEVIATIONS,
    ]


def test_nutrition_dominates_soft_variety_penalty(base_profiles):
    """Verifies that a week with better nutritional compliance ranks higher than a week
    with zero variety penalty but worse nutrition.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal

    # Option 1: Perfectly compliant day (sum_J_day = 0), but repetition penalty exists
    day_opt = _make_mock_day("opt", target_e, neutral)

    # Option 2: Severely deviated day (200 kcal off), varied food names
    day_dev_1 = _make_mock_day("dev_1", target_e + 200.0, neutral)
    day_dev_2 = _make_mock_day("dev_2", target_e - 200.0, neutral)

    policy = WeeklyVarietyPolicy(
        maximum_same_entity_occurrences_per_week=2,  # Repeating day_opt across 4 days triggers soft penalty
    )

    # Slot 1..4 have choice between day_opt and day_dev
    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={
            1: [day_opt, day_dev_1],
            2: [day_opt, day_dev_2],
            3: [day_opt, day_dev_1],
            4: [day_opt, day_dev_2],
        },
        planning_days=4,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    # Best week chose day_opt for all days because sum_J_day = 0.0 dominates soft variety penalty
    assert result.best_week.nutrition_summary.sum_J_day == 0.0
    assert result.best_week.nutrition_summary.days_with_target_deviations == 0
