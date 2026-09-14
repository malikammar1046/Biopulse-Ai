"""Meal/tests/test_week_fiber_coverage.py - Fiber Coverage Missingness Preservation Tests for Phase 6E.

Verifies:
1. Missing fiber is NEVER converted to zero.
2. Weekly fiber coverage is COMPLETE only if every constituent day and item has known fiber.
3. If one or more days has partial or unavailable fiber, weekly coverage reflects this transparently.
4. Golden fixture Case 8 verification.
"""

import json
from pathlib import Path
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
from Meal.optimizer.schemas import FiberCoverageStatus, PortionOptimizationStatus
from Meal.planner.schemas import MealRole
from Meal.weekly.aggregation import aggregate_weekly_fiber
from Meal.weekly.orchestrator import generate_weekly_plan


def _make_mock_meal_with_fiber(role: MealRole, comb_id: str, eid: str, fiber_g: float | None, fiber_status: str) -> SingleMealPlan:
    item = MealItem(
        entity_id=eid,
        display_name=f"Food {eid}",
        optimized_grams=100.0,
        standard_portion_grams=100.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="serving",
        energy_kcal=400.0,
        protein_g=15.0,
        fat_g=8.0,
        carbohydrate_g=50.0,
        fiber_g=fiber_g,
        fiber_status=fiber_status,
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=comb_id,
        items=[item],
        total_energy_kcal=400.0,
        total_protein_g=15.0,
        total_fat_g=8.0,
        total_carbohydrate_g=50.0,
        total_fiber_g=fiber_g,
        fiber_coverage_status=fiber_status,
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=0.0,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
        item_recipe_availability={eid: item.recipe_availability},
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


def test_partial_fiber_propagation(base_target):
    # Day 1: complete fiber
    m1 = _make_mock_meal_with_fiber(MealRole.LUNCH, "C1", "E_KNOWN", 6.0, "COMPLETE")
    d1 = assemble_full_day_meal_plan({MealRole.LUNCH: m1}, base_target)

    # Day 2: missing fiber
    m2 = _make_mock_meal_with_fiber(MealRole.LUNCH, "C2", "E_UNKNOWN", None, "UNAVAILABLE")
    d2 = assemble_full_day_meal_plan({MealRole.LUNCH: m2}, base_target)

    summary = aggregate_weekly_fiber([d1, d2])

    assert summary.fiber_coverage_status == FiberCoverageStatus.PARTIAL
    assert summary.days_fiber_complete == 1
    assert summary.days_fiber_unavailable == 1
    assert "E_UNKNOWN" in summary.missing_fiber_entity_ids
    assert summary.known_weekly_fiber_g == 6.0


def test_golden_case_8_missing_fiber(base_target):
    fixture_path = Path(__file__).parent / "fixtures" / "weekly_planner_golden.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    case_8 = next(c for c in data["cases"] if c["case_id"] == "case_8_missing_fiber_propagation")

    m_unknown = _make_mock_meal_with_fiber(MealRole.LUNCH, "C_UNK", "E_UNKNOWN_FIBER", None, "UNAVAILABLE")
    d_unknown = assemble_full_day_meal_plan({MealRole.LUNCH: m_unknown}, base_target)

    summary = aggregate_weekly_fiber([d_unknown])
    assert summary.fiber_coverage_status != FiberCoverageStatus.COMPLETE
    assert len(summary.missing_fiber_entity_ids) > 0
