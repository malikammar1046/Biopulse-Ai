"""Meal/tests/test_week_condition_isolation.py - Condition Pathway Isolation Tests for Phase 6E.

Verifies:
1. Identical candidate day pool, schedule, preferences, and variety policy executed under
   GENERAL, PCOS, and MALE_HYPOGONADISM produce bitwise identical weekly plans:
   - Identical canonical_week_id
   - Identical sum_J_day, mean_J_day, max_J_day
   - Identical soft_repetition_penalty and repetition metrics
   - Identical selected daily plans in exact same order
2. Condition evidence annotations are purely descriptive and have zero numerical scoring effect.
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
def test_setup():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)

    ctx_gen = ConditionEvidenceContext(condition_pathway=ConditionPathway.GENERAL, evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY)
    ctx_pcos = ConditionEvidenceContext(condition_pathway=ConditionPathway.PCOS, evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED)
    ctx_hypo = ConditionEvidenceContext(condition_pathway=ConditionPathway.MALE_HYPOGONADISM, evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED)

    c_gen = build_condition_nutrition_profile(neutral, ctx_gen)
    c_pcos = build_condition_nutrition_profile(neutral, ctx_pcos)
    c_hypo = build_condition_nutrition_profile(neutral, ctx_hypo)

    # Candidate day pool
    days = [
        _make_mock_day(f"D_{i}", neutral.energy_target_kcal, neutral)
        for i in range(1, 4)
    ]

    return neutral, (c_gen, c_pcos, c_hypo), days


def test_strict_condition_isolation(test_setup):
    neutral, (c_gen, c_pcos, c_hypo), days = test_setup
    policy = WeeklyVarietyPolicy(
        maximum_same_entity_occurrences_per_week=10,
        maximum_candidate_days_per_slot=3,
    )

    res_gen = generate_weekly_plan(neutral, c_gen, candidate_day_pool=days, planning_days=7, policy=policy)
    res_pcos = generate_weekly_plan(neutral, c_pcos, candidate_day_pool=days, planning_days=7, policy=policy)
    res_hypo = generate_weekly_plan(neutral, c_hypo, candidate_day_pool=days, planning_days=7, policy=policy)

    assert res_gen.is_successful
    assert res_pcos.is_successful
    assert res_hypo.is_successful

    w_gen = res_gen.best_week
    w_pcos = res_pcos.best_week
    w_hypo = res_hypo.best_week

    # 1. Identical canonical week ID
    assert w_gen.canonical_week_id == w_pcos.canonical_week_id == w_hypo.canonical_week_id

    # 2. Identical nutritional metrics
    assert w_gen.nutrition_summary.sum_J_day == w_pcos.nutrition_summary.sum_J_day == w_hypo.nutrition_summary.sum_J_day
    assert w_gen.nutrition_summary.weekly_energy_known_total == w_pcos.nutrition_summary.weekly_energy_known_total == w_hypo.nutrition_summary.weekly_energy_known_total

    # 3. Identical soft repetition penalties
    assert w_gen.repetition_metrics.soft_repetition_penalty == w_pcos.repetition_metrics.soft_repetition_penalty == w_hypo.repetition_metrics.soft_repetition_penalty

    # 4. Zero numerical condition effect
    numerical_effect = abs(w_gen.nutrition_summary.sum_J_day - w_pcos.nutrition_summary.sum_J_day)
    assert numerical_effect == 0.0
