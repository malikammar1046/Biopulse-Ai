"""Meal/tests/test_week_plan_generation.py - End-to-end 7-Day Meal Planning Tests for Phase 6E.

Verifies:
1. Generation of an exact 7-day valid week where all daily targets are met.
2. Canonical week ID format (WEEK__D1:...__D7:...).
3. Aggregation of weekly totals and compliance statistics.
4. Validation of golden fixture Case 1 (exact 7-day valid week).
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
from Meal.daily.schemas import DailyFeasibilityClass, FullDayMealPlan
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import ConditionEvidenceContext, ConditionPathway, EvidenceContextStatus
from Meal.optimizer.schemas import PortionOptimizationStatus
from Meal.planner.schemas import MealRole
from Meal.weekly.orchestrator import generate_weekly_plan
from Meal.weekly.schemas import (
    WeeklyGenerationStatus,
    WeeklyVarietyPolicy,
)


def _make_mock_meal(
    role: MealRole,
    comb_id: str,
    entity_id: str,
    energy_kcal: float,
    protein_g: float,
    carb_g: float,
    fat_g: float,
    fiber_g: float = 5.0,
) -> SingleMealPlan:
    item = MealItem(
        entity_id=entity_id,
        display_name=f"Food {entity_id}",
        optimized_grams=100.0,
        standard_portion_grams=100.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="serving",
        energy_kcal=energy_kcal,
        protein_g=protein_g,
        fat_g=fat_g,
        carbohydrate_g=carb_g,
        fiber_g=fiber_g,
        fiber_status="COMPLETE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=comb_id,
        items=[item],
        total_energy_kcal=energy_kcal,
        total_protein_g=protein_g,
        total_fat_g=fat_g,
        total_carbohydrate_g=carb_g,
        total_fiber_g=fiber_g,
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


def _make_mock_day_plan(
    day_idx: int,
    energy_kcal: float,
    prot_g: float,
    carb_g: float,
    fat_g: float,
    entity_prefix: str,
    target_profile,
) -> FullDayMealPlan:
    m_b = _make_mock_meal(MealRole.BREAKFAST, f"B_{entity_prefix}", f"E_B_{entity_prefix}", energy_kcal * 0.25, prot_g * 0.25, carb_g * 0.25, fat_g * 0.25)
    m_l = _make_mock_meal(MealRole.LUNCH, f"L_{entity_prefix}", f"E_L_{entity_prefix}", energy_kcal * 0.40, prot_g * 0.40, carb_g * 0.40, fat_g * 0.40)
    m_d = _make_mock_meal(MealRole.DINNER, f"D_{entity_prefix}", f"E_D_{entity_prefix}", energy_kcal * 0.35, prot_g * 0.35, carb_g * 0.35, fat_g * 0.35)
    
    meals = {
        MealRole.BREAKFAST: m_b,
        MealRole.LUNCH: m_l,
        MealRole.DINNER: m_d,
    }
    return assemble_full_day_meal_plan(
        meals=meals,
        daily_target=target_profile,
        plan_day_index=day_idx,
    )


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


def test_exact_7day_valid_week_generation(base_profiles):
    """Verifies that an exact 7-day valid plan is generated and aggregated cleanly."""
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # Create 7 distinct valid candidate days
    candidate_days = [
        _make_mock_day_plan(
            day_idx=i,
            energy_kcal=target_e,
            prot_g=prot_mid,
            carb_g=carb_mid,
            fat_g=fat_mid,
            entity_prefix=f"day_{i}",
            target_profile=neutral,
        )
        for i in range(1, 8)
    ]

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_day_pool=candidate_days,
        planning_days=7,
        policy=WeeklyVarietyPolicy(
            maximum_same_entity_occurrences_per_week=14,
            maximum_same_meal_combination_occurrences_per_week=3,
        ),
    )

    assert result.is_successful
    assert result.status == WeeklyGenerationStatus.FULL_WEEK_GENERATED
    assert result.planning_days_requested == 7
    assert result.planning_days_generated == 7
    assert result.best_week is not None

    week = result.best_week
    assert week.day_count == 7
    assert week.nutrition_summary.days_full_targets_met == 7
    assert week.nutrition_summary.days_with_target_deviations == 0
    assert week.nutrition_summary.sum_J_day == 0.0
    assert week.canonical_week_id.startswith("WEEK__D1:")
    assert len(week.day_plans) == 7


def test_golden_fixture_case_1(base_profiles):
    """Validates Case 1 against Meal/tests/fixtures/weekly_planner_golden.json."""
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    fixture_path = Path(__file__).parent / "fixtures" / "weekly_planner_golden.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    case_1 = next(c for c in data["cases"] if c["case_id"] == "case_1_exact_7day_valid_week")

    candidate_days = [
        _make_mock_day_plan(i, target_e, prot_mid, carb_mid, fat_mid, f"fixture_{i}", neutral)
        for i in range(1, 8)
    ]

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_day_pool=candidate_days,
        planning_days=case_1["planning_days"],
    )

    assert result.status.value == case_1["expected"]["status"]
    assert result.planning_days_requested == case_1["expected"]["days_requested"]
    assert result.planning_days_generated == case_1["expected"]["days_generated"]
    assert result.best_week is not None
    assert result.best_week.nutrition_summary.days_full_targets_met == case_1["expected"]["days_full_targets_met"]
    assert result.best_week.nutrition_summary.days_with_target_deviations == case_1["expected"]["days_with_target_deviations"]
    assert result.best_week.nutrition_summary.sum_J_day == case_1["expected"]["sum_J_day"]
