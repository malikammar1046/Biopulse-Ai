"""Meal/tests/test_day_fiber_coverage.py - Tests strict preservation of Phase 5 fiber coverage semantics.

Strict Invariants:
1. If all foods in the day have known fiber -> COMPLETE.
2. If any food has unknown fiber (None) -> PARTIAL. Never claims COMPLETE.
3. If all foods have unknown fiber -> UNAVAILABLE.
4. Missing fiber is NEVER converted to zero.
5. missing_fiber_entity_ids reports exact entity IDs with unknown fiber.
"""

import pytest

from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealFeasibilityClass,
    MealItem,
    RecipeCoverageStatus,
    SingleMealPlan,
)
from Meal.daily.aggregation import aggregate_daily_nutrients
from Meal.optimizer.schemas import FiberCoverageStatus, PortionOptimizationStatus
from Meal.planner.schemas import MealRole


def _make_item(entity_id: str, fiber_g: float | None) -> MealItem:
    return MealItem(
        entity_id=entity_id,
        display_name=entity_id,
        optimized_grams=100.0,
        standard_portion_grams=100.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="portion",
        energy_kcal=200.0,
        protein_g=10.0,
        fat_g=5.0,
        carbohydrate_g=30.0,
        fiber_g=fiber_g,
        fiber_status="COMPLETE" if fiber_g is not None else "UNAVAILABLE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )


def _make_meal(role: MealRole, items: list[MealItem]) -> SingleMealPlan:
    return SingleMealPlan(
        canonical_combination_id=f"MEAL_{role.value.upper()}",
        items=items,
        total_energy_kcal=sum(i.energy_kcal for i in items),
        total_protein_g=sum(i.protein_g for i in items),
        total_fat_g=sum(i.fat_g for i in items),
        total_carbohydrate_g=sum(i.carbohydrate_g for i in items),
        total_fiber_g=sum(i.fiber_g for i in items if i.fiber_g is not None) or None,
        fiber_coverage_status="COMPLETE" if all(i.fiber_g is not None for i in items) else "PARTIAL",
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=0.0,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.NONE,
        item_recipe_availability={i.entity_id: i.recipe_availability for i in items},
        matched_preferred_entity_count=0,
        total_valid_preferred_entity_count=0,
        preference_coverage=0.0,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


def test_complete_fiber_coverage():
    """All foods have known fiber values -> COMPLETE."""
    meals = {
        MealRole.BREAKFAST: _make_meal(MealRole.BREAKFAST, [_make_item("FOOD_A", 3.5), _make_item("FOOD_B", 2.5)]),
        MealRole.LUNCH: _make_meal(MealRole.LUNCH, [_make_item("FOOD_C", 5.0)]),
    }
    *_, fiber_res, _, _, _, _, _, _, _ = aggregate_daily_nutrients(meals)

    assert fiber_res.fiber_coverage_status == FiberCoverageStatus.COMPLETE
    assert fiber_res.known_fiber_total_g == 11.0
    assert fiber_res.missing_fiber_entity_ids == []
    assert fiber_res.total_entities_evaluated == 3
    assert fiber_res.entities_with_known_fiber == 3


def test_partial_fiber_coverage_one_missing():
    """One food has unknown fiber -> PARTIAL. Never claims COMPLETE."""
    meals = {
        MealRole.BREAKFAST: _make_meal(MealRole.BREAKFAST, [_make_item("FOOD_A", 4.0), _make_item("FOOD_UNKNOWN", None)]),
        MealRole.LUNCH: _make_meal(MealRole.LUNCH, [_make_item("FOOD_C", 6.0)]),
    }
    *_, fiber_res, _, _, _, _, _, _, _ = aggregate_daily_nutrients(meals)

    assert fiber_res.fiber_coverage_status == FiberCoverageStatus.PARTIAL
    assert fiber_res.known_fiber_total_g == 10.0
    assert fiber_res.missing_fiber_entity_ids == ["FOOD_UNKNOWN"]
    assert fiber_res.total_entities_evaluated == 3
    assert fiber_res.entities_with_known_fiber == 2


def test_unavailable_fiber_coverage():
    """No foods have known fiber -> UNAVAILABLE."""
    meals = {
        MealRole.BREAKFAST: _make_meal(MealRole.BREAKFAST, [_make_item("FOOD_X", None)]),
        MealRole.LUNCH: _make_meal(MealRole.LUNCH, [_make_item("FOOD_Y", None)]),
    }
    *_, fiber_res, _, _, _, _, _, _, _ = aggregate_daily_nutrients(meals)

    assert fiber_res.fiber_coverage_status == FiberCoverageStatus.UNAVAILABLE
    assert fiber_res.known_fiber_total_g is None
    assert set(fiber_res.missing_fiber_entity_ids) == {"FOOD_X", "FOOD_Y"}
    assert fiber_res.total_entities_evaluated == 2
    assert fiber_res.entities_with_known_fiber == 0
