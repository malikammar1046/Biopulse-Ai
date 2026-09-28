"""Meal/tests/test_day_cross_meal_optimization.py - Phase 6D.1 Cross-Meal Candidate-Day Optimization Tests.

Verifies:
1. Phase 6D selects a lower-ranked Phase 6C alternative meal when doing so improves the full-day target.
2. When Phase 6C rank #1 meals are already optimal for the full day, no unnecessary replacement occurs.
3. Day-search diagnostics are accurately reported:
   - meal_candidates_by_role
   - total_possible_day_combinations
   - day_combinations_evaluated
   - day_search_truncated
   - day_search_exhaustive
4. Truncation warning BETTER_UNEVALUATED_DAY_MAY_EXIST is emitted when bounds truncate search.
"""

from unittest.mock import patch
import pytest

from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealFeasibilityClass,
    MealItem,
    RecipeCoverageStatus,
    SingleMealGenerationResult,
    SingleMealGenerationStatus,
    SingleMealPlan,
)
from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
    FullDayGenerationStatus,
    FullDayPlanningPolicy,
    MealAllocation,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.schemas import (
    PortionOptimizationStatus,
    PortionOptimizationTarget,
)
from Meal.planner.schemas import MealRole


def _make_mock_meal_plan(
    canonical_id: str,
    energy_kcal: float,
    protein_g: float,
    carb_g: float,
    fat_g: float,
    primary_objective: float = 0.0,
    preference_coverage: float = 0.0,
) -> SingleMealPlan:
    item = MealItem(
        entity_id=f"ITEM_{canonical_id}",
        display_name=f"Display {canonical_id}",
        optimized_grams=100.0,
        standard_portion_grams=100.0,
        equivalent_standard_portions_display=1.0,
        standard_portion_label="serving",
        energy_kcal=energy_kcal,
        protein_g=protein_g,
        fat_g=fat_g,
        carbohydrate_g=carb_g,
        fiber_g=5.0,
        fiber_status="COMPLETE",
        recipe_availability=ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT,
        recipe_instruction_available=False,
    )
    return SingleMealPlan(
        canonical_combination_id=canonical_id,
        items=[item],
        total_energy_kcal=energy_kcal,
        total_protein_g=protein_g,
        total_fat_g=fat_g,
        total_carbohydrate_g=carb_g,
        total_fiber_g=5.0,
        fiber_coverage_status="COMPLETE",
        feasibility_class=MealFeasibilityClass.FEASIBLE,
        primary_objective=primary_objective,
        secondary_objective=0.0,
        secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
        item_recipe_availability={item.entity_id: item.recipe_availability},
        matched_preferred_entity_count=int(preference_coverage > 0),
        total_valid_preferred_entity_count=1,
        preference_coverage=preference_coverage,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


def _make_mock_meal_result(
    role: MealRole,
    best_meal: SingleMealPlan,
    alternatives: list[SingleMealPlan],
) -> SingleMealGenerationResult:
    return SingleMealGenerationResult(
        status=SingleMealGenerationStatus.FEASIBLE,
        requested_meal_role=role,
        best_meal=best_meal,
        alternative_meals=alternatives,
        total_possible_combinations=1 + len(alternatives),
        combinations_generated=1 + len(alternatives),
        combinations_evaluated=1 + len(alternatives),
        optimizer_success_count=1 + len(alternatives),
        optimizer_rejected_count=0,
        optimizer_rejections={},
        search_truncated=False,
        search_exhaustive=True,
        selection_scope="EXHAUSTIVE_SEARCH",  # type: ignore
        preferred_entity_matches=0,
        preferred_entity_ids_requested=[],
        valid_preferred_entity_ids=[],
        preferred_validation_records=[],
        preference_status="AVAILABLE",  # type: ignore
        preference_coverage=best_meal.preference_coverage,
    )


@pytest.fixture
def base_profiles():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition = build_condition_nutrition_profile(neutral, ctx)
    return neutral, condition


def test_lower_ranked_meal_selected_when_improves_day_target(base_profiles):
    """Section 6 Mandatory Regression:
    
    Breakfast:
      best_meal = A1 (550 kcal, J*=0, pref=1.0) -> rank 1
      alt_meal  = A2 (400 kcal, J*=0, pref=0.0) -> rank 2
    Lunch:
      best_meal = B1 (1500 kcal, J*=0)
    
    Daily Energy Target = 1900 kcal (+/- 50 kcal, Range: [1850, 1950] kcal).
    
    If Day chooses A1 + B1:
      daily_energy = 550 + 1500 = 2050 kcal -> MISSED (exceeds 1950 kcal, J_day > 0)
    If Day chooses A2 + B1:
      daily_energy = 400 + 1500 = 1900 kcal -> FULLY MET (in range, J_day = 0)
    
    Expected: Phase 6D selects A2 + B1 and achieves FULL_DAILY_TARGETS_MET!
    """
    neutral, condition = base_profiles

    # Construct mock single meals
    # Daily target ranges for neutral profile (28y F, 60kg, inactive ~ 2035 kcal)
    # We will override neutral profile energy target by setting it or using a custom profile
    target_e = neutral.energy_target_kcal  # ~ 2035 kcal
    tol = 30.0

    # Macro targets
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # A1 is oversized for the day (+150 kcal over what's needed), but has higher preference coverage
    a1 = _make_mock_meal_plan("A1", energy_kcal=target_e * 0.35 + 150.0, protein_g=prot_mid * 0.35, carb_g=carb_mid * 0.35, fat_g=fat_mid * 0.35, preference_coverage=1.0)
    # A2 fits the daily target exactly
    a2 = _make_mock_meal_plan("A2", energy_kcal=target_e * 0.35, protein_g=prot_mid * 0.35, carb_g=carb_mid * 0.35, fat_g=fat_mid * 0.35, preference_coverage=0.0)

    # B1 provides the remaining 65% of the day
    b1 = _make_mock_meal_plan("B1", energy_kcal=target_e * 0.65, protein_g=prot_mid * 0.65, carb_g=carb_mid * 0.65, fat_g=fat_mid * 0.65)

    schedule = DailyMealSchedule(
        allocations=[
            MealAllocation(role=MealRole.BREAKFAST, target=PortionOptimizationTarget(target_energy_kcal=target_e * 0.35)),
            MealAllocation(role=MealRole.LUNCH, target=PortionOptimizationTarget(target_energy_kcal=target_e * 0.65)),
        ]
    )

    def mock_generate_single_meal(**kwargs):
        role = kwargs["context"].meal_role
        if role == MealRole.BREAKFAST:
            return _make_mock_meal_result(MealRole.BREAKFAST, best_meal=a1, alternatives=[a2])
        else:
            return _make_mock_meal_result(MealRole.LUNCH, best_meal=b1, alternatives=[])

    with patch("Meal.daily.orchestrator.generate_single_meal", side_effect=mock_generate_single_meal):
        result = generate_full_day_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            schedule=schedule,
            policy=FullDayPlanningPolicy(
                energy_tolerance_kcal=tol,
                maximum_meal_candidates_per_role=2,
            ),
        )

    assert result.is_successful
    assert result.status == FullDayGenerationStatus.FULL_DAILY_TARGETS_MET
    assert result.best_day_plan is not None

    # Crucial assertion: Phase 6D selected A2 (the alternative), NOT A1 (the meal rank #1)!
    selected_breakfast = result.best_day_plan.meals[MealRole.BREAKFAST]
    assert selected_breakfast.canonical_combination_id == "A2"
    assert result.best_day_plan.all_daily_core_targets_within_range is True
    assert result.best_day_plan.daily_primary_objective == 0.0


def test_best_meals_selected_when_already_optimal(base_profiles):
    """Section 7: When Phase 6C best meals are already optimal for the day, no unnecessary replacement occurs."""
    neutral, condition = base_profiles

    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # A1 fits the day target exactly
    a1 = _make_mock_meal_plan("A1", energy_kcal=target_e * 0.40, protein_g=prot_mid * 0.40, carb_g=carb_mid * 0.40, fat_g=fat_mid * 0.40)
    # A2 deviates from the day target
    a2 = _make_mock_meal_plan("A2", energy_kcal=target_e * 0.40 + 200.0, protein_g=prot_mid * 0.40, carb_g=carb_mid * 0.40, fat_g=fat_mid * 0.40)

    # B1 fits the remaining 60%
    b1 = _make_mock_meal_plan("B1", energy_kcal=target_e * 0.60, protein_g=prot_mid * 0.60, carb_g=carb_mid * 0.60, fat_g=fat_mid * 0.60)

    schedule = DailyMealSchedule(
        allocations=[
            MealAllocation(role=MealRole.BREAKFAST, target=PortionOptimizationTarget(target_energy_kcal=target_e * 0.40)),
            MealAllocation(role=MealRole.LUNCH, target=PortionOptimizationTarget(target_energy_kcal=target_e * 0.60)),
        ]
    )

    def mock_generate_single_meal(**kwargs):
        role = kwargs["context"].meal_role
        if role == MealRole.BREAKFAST:
            return _make_mock_meal_result(MealRole.BREAKFAST, best_meal=a1, alternatives=[a2])
        else:
            return _make_mock_meal_result(MealRole.LUNCH, best_meal=b1, alternatives=[])

    with patch("Meal.daily.orchestrator.generate_single_meal", side_effect=mock_generate_single_meal):
        result = generate_full_day_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            schedule=schedule,
            policy=FullDayPlanningPolicy(
                energy_tolerance_kcal=50.0,
                maximum_meal_candidates_per_role=2,
            ),
        )

    assert result.is_successful
    assert result.status == FullDayGenerationStatus.FULL_DAILY_TARGETS_MET
    assert result.best_day_plan is not None

    # A1 is retained without unnecessary replacement
    assert result.best_day_plan.meals[MealRole.BREAKFAST].canonical_combination_id == "A1"
    assert result.best_day_plan.meals[MealRole.LUNCH].canonical_combination_id == "B1"


def test_day_search_diagnostics_and_truncation(base_profiles):
    """Section 8: Auditable day-search diagnostics and truncation warnings."""
    neutral, condition = base_profiles

    # 3 options for breakfast, 3 options for lunch
    b_meals = [_make_mock_meal_plan(f"B_{i}", 300.0 + i * 50.0, 15.0, 40.0, 8.0) for i in range(3)]
    l_meals = [_make_mock_meal_plan(f"L_{i}", 500.0 + i * 50.0, 25.0, 60.0, 15.0) for i in range(3)]

    schedule = DailyMealSchedule(
        allocations=[
            MealAllocation(role=MealRole.BREAKFAST, target=PortionOptimizationTarget(target_energy_kcal=300.0)),
            MealAllocation(role=MealRole.LUNCH, target=PortionOptimizationTarget(target_energy_kcal=500.0)),
        ]
    )

    def mock_generate_single_meal(**kwargs):
        role = kwargs["context"].meal_role
        if role == MealRole.BREAKFAST:
            return _make_mock_meal_result(MealRole.BREAKFAST, best_meal=b_meals[0], alternatives=b_meals[1:])
        else:
            return _make_mock_meal_result(MealRole.LUNCH, best_meal=l_meals[0], alternatives=l_meals[1:])

    # Test 1: Exhaustive search (3 x 3 = 9 combos, max allowed = 10)
    with patch("Meal.daily.orchestrator.generate_single_meal", side_effect=mock_generate_single_meal):
        res_exhaustive = generate_full_day_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            schedule=schedule,
            policy=FullDayPlanningPolicy(
                maximum_meal_candidates_per_role=3,
                maximum_day_combinations_evaluated=10,
            ),
        )

    assert res_exhaustive.day_search_truncated is False
    assert res_exhaustive.day_search_exhaustive is True
    assert res_exhaustive.total_possible_day_combinations == 9
    assert res_exhaustive.day_combinations_evaluated == 9
    assert res_exhaustive.meal_candidates_by_role[MealRole.BREAKFAST] == 3
    assert res_exhaustive.meal_candidates_by_role[MealRole.LUNCH] == 3
    assert not any("BETTER_UNEVALUATED_DAY_MAY_EXIST" in w for w in res_exhaustive.warnings)

    # Test 2: Truncated search (9 combos, max allowed = 4)
    with patch("Meal.daily.orchestrator.generate_single_meal", side_effect=mock_generate_single_meal):
        res_truncated = generate_full_day_plan(
            neutral_profile=neutral,
            condition_profile=condition,
            schedule=schedule,
            policy=FullDayPlanningPolicy(
                maximum_meal_candidates_per_role=3,
                maximum_day_combinations_evaluated=4,
            ),
        )

    assert res_truncated.day_search_truncated is True
    assert res_truncated.day_search_exhaustive is False
    assert res_truncated.total_possible_day_combinations == 9
    assert res_truncated.day_combinations_evaluated == 4
    assert any("BETTER_UNEVALUATED_DAY_MAY_EXIST" in w for w in res_truncated.warnings)
