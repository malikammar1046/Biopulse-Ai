"""Meal/tests/test_day_target_aggregation.py - Tests daily nutrient aggregation and feasibility evaluation.

Verifies:
- Exact unrounded floating-point summation of daily macro nutrients.
- Preservation of fiber completeness semantics.
- Meal-level feasibility vs day-level feasibility independence:
  all meals may have J*=0 while day aggregate misses Phase 5A target (J_day > 0).
- NutrientDeviation calculation for energy, protein, carbohydrate, and fat.
"""

import pytest

from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealFeasibilityClass,
    MealItem,
    RecipeCoverageStatus,
    SingleMealPlan,
)
from Meal.daily.aggregation import (
    aggregate_daily_nutrients,
    assemble_full_day_meal_plan,
    evaluate_daily_nutrient_deviations,
)
from Meal.daily.schemas import DailyFeasibilityClass
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.optimizer.schemas import (
    FiberCoverageStatus,
    NutrientDeviation,
    NutrientTargetStatus,
    PortionOptimizationStatus,
)
from Meal.planner.schemas import MealRole


def _create_mock_single_meal(
    role: MealRole,
    energy_kcal: float,
    protein_g: float,
    carb_g: float,
    fat_g: float,
    fiber_g: float | None = 5.0,
    items: list[MealItem] | None = None,
) -> SingleMealPlan:
    if items is None:
        items = [
            MealItem(
                entity_id=f"FOOD_{role.value.upper()}_1",
                display_name=f"Food {role.value}",
                optimized_grams=100.0,
                standard_portion_grams=100.0,
                equivalent_standard_portions_display=1.0,
                standard_portion_label="serving",
                energy_kcal=energy_kcal,
                protein_g=protein_g,
                fat_g=fat_g,
                carbohydrate_g=carb_g,
                fiber_g=fiber_g,
                fiber_status="COMPLETE" if fiber_g is not None else "UNAVAILABLE",
                recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
                recipe_instruction_available=False,
            )
        ]
    return SingleMealPlan(
        canonical_combination_id=f"MOCK_{role.value.upper()}",
        items=items,
        total_energy_kcal=energy_kcal,
        total_protein_g=protein_g,
        total_fat_g=fat_g,
        total_carbohydrate_g=carb_g,
        total_fiber_g=fiber_g,
        fiber_coverage_status="COMPLETE" if fiber_g is not None else "UNAVAILABLE",
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=0.0,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.NONE,
        item_recipe_availability={items[0].entity_id: items[0].recipe_availability},
        matched_preferred_entity_count=0,
        total_valid_preferred_entity_count=0,
        preference_coverage=0.0,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


def test_exact_unrounded_summation():
    """Daily macros must be exact unrounded float summations of meal totals."""
    meals = {
        MealRole.BREAKFAST: _create_mock_single_meal(MealRole.BREAKFAST, 450.1234, 25.1111, 55.2222, 12.3333, 4.0),
        MealRole.LUNCH: _create_mock_single_meal(MealRole.LUNCH, 650.5678, 35.4444, 80.5555, 20.6666, 6.0),
        MealRole.DINNER: _create_mock_single_meal(MealRole.DINNER, 550.9876, 30.7777, 70.8888, 18.9999, 5.0),
        MealRole.SNACK: _create_mock_single_meal(MealRole.SNACK, 200.1234, 10.2222, 25.3333, 6.4444, 2.0),
    }
    (
        energy,
        protein,
        carb,
        fat,
        fiber_res,
        _,
        _,
        _,
        _,
        _,
        _,
        _,
    ) = aggregate_daily_nutrients(meals)

    expected_energy = 450.1234 + 650.5678 + 550.9876 + 200.1234
    expected_protein = 25.1111 + 35.4444 + 30.7777 + 10.2222
    expected_carb = 55.2222 + 80.5555 + 70.8888 + 25.3333
    expected_fat = 12.3333 + 20.6666 + 18.9999 + 6.4444

    assert abs(energy - expected_energy) < 1e-12
    assert abs(protein - expected_protein) < 1e-12
    assert abs(carb - expected_carb) < 1e-12
    assert abs(fat - expected_fat) < 1e-12
    assert fiber_res.known_fiber_total_g == 17.0
    assert fiber_res.fiber_coverage_status == FiberCoverageStatus.COMPLETE


def test_meal_level_success_but_day_level_deviation():
    """All meals may individually have J*=0, while the full day's totals miss Phase 5A target."""
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    daily_target = build_nutrition_target_profile(user)

    # Suppose meals were each optimized to smaller custom meal targets that sum to 1200 kcal
    # Daily target is ~1800-2000 kcal, so aggregate energy will be below daily range!
    meals = {
        MealRole.BREAKFAST: _create_mock_single_meal(MealRole.BREAKFAST, 300.0, 15.0, 40.0, 8.0),
        MealRole.LUNCH: _create_mock_single_meal(MealRole.LUNCH, 400.0, 20.0, 50.0, 12.0),
        MealRole.DINNER: _create_mock_single_meal(MealRole.DINNER, 350.0, 18.0, 45.0, 10.0),
        MealRole.SNACK: _create_mock_single_meal(MealRole.SNACK, 150.0, 5.0, 20.0, 5.0),
    }
    # Notice: all meals have primary_objective == 0.0 (J* = 0)
    for m in meals.values():
        assert m.primary_objective == 0.0

    day_plan = assemble_full_day_meal_plan(
        meals=meals,
        daily_target=daily_target,
        energy_tolerance_kcal=50.0,
    )

    # But day-level aggregate misses the Phase 5A daily energy target!
    assert day_plan.daily_energy_kcal == 1200.0
    assert day_plan.all_daily_core_targets_within_range is False
    assert day_plan.feasibility_class == DailyFeasibilityClass.OPTIMAL_WITH_DAILY_DEVIATIONS
    assert day_plan.daily_primary_objective > 0.0
    assert day_plan.daily_target_deviations["energy"].status == NutrientTargetStatus.BELOW_RANGE


def test_all_daily_core_targets_within_range():
    """When aggregate daily nutrients fall squarely within all Phase 5A target ranges, J_day=0."""
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    daily_target = build_nutrition_target_profile(user)
    target_energy = daily_target.energy_target_kcal

    # Distribute exact target across 4 meals
    e_b = target_energy * 0.25
    e_l = target_energy * 0.35
    e_d = target_energy * 0.30
    e_s = target_energy * 0.10

    prot_mid = ((daily_target.protein_target_min_g or daily_target.protein_amdr_min_g) +
                (daily_target.protein_target_max_g or daily_target.protein_amdr_max_g)) / 2.0
    carb_mid = ((daily_target.carbohydrate_target_min_g or daily_target.carbohydrate_amdr_min_g) +
                (daily_target.carbohydrate_target_max_g or daily_target.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (daily_target.fat_amdr_min_g + daily_target.fat_amdr_max_g) / 2.0

    meals = {
        MealRole.BREAKFAST: _create_mock_single_meal(MealRole.BREAKFAST, e_b, prot_mid * 0.25, carb_mid * 0.25, fat_mid * 0.25),
        MealRole.LUNCH: _create_mock_single_meal(MealRole.LUNCH, e_l, prot_mid * 0.35, carb_mid * 0.35, fat_mid * 0.35),
        MealRole.DINNER: _create_mock_single_meal(MealRole.DINNER, e_d, prot_mid * 0.30, carb_mid * 0.30, fat_mid * 0.30),
        MealRole.SNACK: _create_mock_single_meal(MealRole.SNACK, e_s, prot_mid * 0.10, carb_mid * 0.10, fat_mid * 0.10),
    }

    day_plan = assemble_full_day_meal_plan(
        meals=meals,
        daily_target=daily_target,
        energy_tolerance_kcal=50.0,
    )

    assert day_plan.all_daily_core_targets_within_range is True
    assert day_plan.feasibility_class == DailyFeasibilityClass.FEASIBLE
    assert day_plan.daily_primary_objective == 0.0
    for dev in day_plan.daily_target_deviations.values():
        assert dev.status == NutrientTargetStatus.WITHIN_RANGE
        assert dev.absolute_deviation == 0.0
        assert dev.normalized_deviation == 0.0
