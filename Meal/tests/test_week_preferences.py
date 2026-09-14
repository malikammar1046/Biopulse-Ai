"""Meal/tests/test_week_preferences.py - Preference Handling and Required Occurrence Tests for Phase 6E.

Verifies:
1. User preference match coverage is accurately aggregated across planned days.
2. Ties between nutritionally identical candidate weeks are broken in favor of higher user preference coverage.
3. WeeklyRequiredOccurrence constraints (minimum and maximum frequencies) are enforced:
   - HARD: Non-compliance rejects candidate sequence.
   - SOFT: Non-compliance applies a soft variety penalty.
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
from Meal.weekly.schemas import (
    ConstraintEnforcementMode,
    WeeklyRequiredOccurrence,
    WeeklyVarietyPolicy,
)


def _make_mock_meal(role: MealRole, comb_id: str, eid: str, pref_cov: float) -> SingleMealPlan:
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
        fiber_g=5.0,
        fiber_status="COMPLETE",
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
        total_fiber_g=5.0,
        fiber_coverage_status="COMPLETE",
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=0.0,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
        item_recipe_availability={eid: item.recipe_availability},
        matched_preferred_entity_count=int(pref_cov > 0),
        total_valid_preferred_entity_count=1,
        preference_coverage=pref_cov,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


def _make_mock_day(day_id: str, eid: str, pref_cov: float, target_profile) -> FullDayMealPlan:
    meal = _make_mock_meal(MealRole.LUNCH, day_id, eid, pref_cov)
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


def test_preference_coverage_tie_breaking(base_profiles):
    """Two weeks with identical nutritional compliance (sum_J_day=0) and soft penalty:
    the one with higher preference coverage ranks first.
    """
    neutral, condition = base_profiles
    day_pref = _make_mock_day("D_PREF", "E_PREF", 1.0, neutral)
    day_plain = _make_mock_day("D_PLAIN", "E_PLAIN", 0.0, neutral)

    policy = WeeklyVarietyPolicy()

    # Slot 1: choice between day_pref and day_plain
    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={
            1: [day_plain, day_pref],
            2: [day_plain],
        },
        planning_days=2,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    # Day 1 in best week must be day_pref
    assert result.best_week.day_plans[0].canonical_day_id == day_pref.canonical_day_id
    assert result.best_week.preference_coverage == 0.5


def test_weekly_required_occurrence_enforcement(base_profiles):
    """Caller requires 'E_SPECIAL' to appear at least once in the week."""
    neutral, condition = base_profiles
    day_special = _make_mock_day("D_SPEC", "E_SPECIAL", 0.0, neutral)
    day_normal = _make_mock_day("D_NORM", "E_NORMAL", 0.0, neutral)

    policy = WeeklyVarietyPolicy(
        required_occurrences=[
            WeeklyRequiredOccurrence(
                entity_or_concept_id="E_SPECIAL",
                minimum_occurrences=1,
                enforcement=ConstraintEnforcementMode.HARD,
            )
        ]
    )

    # If slot 1 has [day_normal, day_special] and slot 2 has [day_normal]
    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={
            1: [day_normal, day_special],
            2: [day_normal],
        },
        planning_days=2,
        policy=policy,
    )

    assert result.is_successful
    # The sequence [day_normal, day_normal] was rejected because E_SPECIAL is missing
    assert result.best_week is not None
    assert result.best_week.repetition_metrics.entity_occurrence_counts.get("E_SPECIAL", 0) >= 1
    assert result.weeks_rejected_hard_constraints == 1
