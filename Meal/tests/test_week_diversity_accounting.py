"""Meal/tests/test_week_diversity_accounting.py - Phase 6E.1 Diversity & Search-Space Accounting Tests.

Verifies:
1. Duplicate day candidates are deduplicated deterministically by canonical_day_id.
2. candidate_days_per_slot reflects unique canonical day IDs.
3. total_possible_week_sequences is calculated strictly AFTER deduplication.
4. Duplicate canonical weekly sequences are collapsed and tracked in diagnostics.
5. Equal-nutrition candidate weeks use SOFT variety as tie-break (varied week beats repetition).
6. Nutritionally worse week does NOT beat a better week merely for cosmetic diversity.
7. Real candidate pool from Phase 6D contains true distinct canonical days where claimed.
8. Search diagnostics are strictly internally consistent.
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
from Meal.daily.orchestrator import generate_full_day_plan
from Meal.daily.schemas import (
    DailyMealSchedule,
    FullDayMealPlan,
    FullDayPlanningPolicy,
    MealAllocation,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import ConditionEvidenceContext, ConditionPathway, EvidenceContextStatus
from Meal.optimizer.schemas import PortionConstraint, PortionOptimizationStatus, PortionOptimizationTarget
from Meal.planner.schemas import MealRole
from Meal.weekly.orchestrator import deduplicate_candidate_days_by_canonical_id, generate_weekly_plan
from Meal.weekly.schemas import (
    ConstraintEnforcementMode,
    WeeklyGenerationStatus,
    WeeklyVarietyPolicy,
)


def _make_mock_meal(role: MealRole, comb_id: str, entity_id: str, energy_kcal: float, prot_g: float, carb_g: float, fat_g: float) -> SingleMealPlan:
    item = MealItem(
        entity_id=entity_id,
        display_name=f"Food {entity_id}",
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
    custom_eids: tuple = None,
) -> FullDayMealPlan:
    eid_b = custom_eids[0] if custom_eids else f"E_B_{entity_prefix}"
    eid_l = custom_eids[1] if custom_eids else f"E_L_{entity_prefix}"
    eid_d = custom_eids[2] if custom_eids else f"E_D_{entity_prefix}"

    m_b = _make_mock_meal(MealRole.BREAKFAST, f"B_{entity_prefix}", eid_b, energy_kcal * 0.25, prot_g * 0.25, carb_g * 0.25, fat_g * 0.25)
    m_l = _make_mock_meal(MealRole.LUNCH, f"L_{entity_prefix}", eid_l, energy_kcal * 0.40, prot_g * 0.40, carb_g * 0.40, fat_g * 0.40)
    m_d = _make_mock_meal(MealRole.DINNER, f"D_{entity_prefix}", eid_d, energy_kcal * 0.35, prot_g * 0.35, carb_g * 0.35, fat_g * 0.35)
    
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


def test_deduplicate_candidate_days_by_canonical_id(base_profiles):
    """Verifies that deduplicate_candidate_days_by_canonical_id deterministically preserves
    one instance per canonical_day_id.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = 60.0
    carb_mid = 250.0
    fat_mid = 60.0

    day_1 = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day1", neutral)
    day_1_dup = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day1", neutral)
    day_2 = _make_mock_day_plan(2, target_e, prot_mid, carb_mid, fat_mid, "day2", neutral)

    assert day_1.canonical_day_id == day_1_dup.canonical_day_id
    assert day_1.canonical_day_id != day_2.canonical_day_id

    raw_list = [day_1, day_1_dup, day_2, day_1]
    deduped = deduplicate_candidate_days_by_canonical_id(raw_list)

    assert len(deduped) == 2
    canonical_ids = [d.canonical_day_id for d in deduped]
    assert len(canonical_ids) == len(set(canonical_ids))
    assert day_1.canonical_day_id in canonical_ids
    assert day_2.canonical_day_id in canonical_ids


def test_candidate_counts_and_search_space_accounting_after_dedup(base_profiles):
    """Verifies candidate_days_per_slot and total_possible_week_sequences are computed
    strictly AFTER deduplicating canonical days.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = 60.0
    carb_mid = 250.0
    fat_mid = 60.0

    day_1 = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day1", neutral)
    day_1_dup = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day1", neutral)

    # Supply 3 copies of day_1 per slot across 7 days
    candidate_days_by_slot = {i: [day_1, day_1_dup, day_1] for i in range(1, 8)}

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot=candidate_days_by_slot,
        planning_days=7,
    )

    # Invariant: Each slot must have exactly 1 candidate, NOT 3
    for slot, count in result.candidate_days_per_slot.items():
        assert count == 1, f"Slot {slot} has count {count}, expected 1 after deduplication"

    # Invariant: total_possible_week_sequences must be 1^7 = 1, NOT 3^7 = 2187
    assert result.total_possible_week_sequences == 1
    assert result.week_sequences_evaluated == 1
    assert result.unique_canonical_weeks_evaluated == 1
    assert result.duplicate_week_sequences_collapsed == 0


def test_equal_nutrition_weeks_use_soft_variety_as_tie_break(base_profiles):
    """Test 5 & 9: When candidate days D1, D2, D3 have identical nutritional compliance
    (sum_J_day = 0.0), a sequence mixing D1, D2, D3 has lower soft repetition penalty
    than D1 repeating 7 times. Phase 6E must select the varied sequence.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # 3 distinct days with identical energy and macro targets (sum_J_day = 0.0)
    day_1 = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day1", neutral, custom_eids=("E_ROTI_1", "E_DAAL_1", "E_RICE_1"))
    day_2 = _make_mock_day_plan(2, target_e, prot_mid, carb_mid, fat_mid, "day2", neutral, custom_eids=("E_ROTI_2", "E_CHICKEN", "E_RICE_2"))
    day_3 = _make_mock_day_plan(3, target_e, prot_mid, carb_mid, fat_mid, "day3", neutral, custom_eids=("E_ROTI_3", "E_SABZI", "E_RICE_3"))

    policy = WeeklyVarietyPolicy(
        maximum_same_day_plan_occurrences_per_week=3,
        day_plan_enforcement=ConstraintEnforcementMode.SOFT,
        maximum_candidate_days_per_slot=3,
        maximum_week_candidate_sequences_evaluated=2500,
    )

    candidate_days_by_slot = {i: [day_1, day_2, day_3] for i in range(1, 8)}

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot=candidate_days_by_slot,
        planning_days=7,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    # Best week must NOT be Day 1 repeated 7 times!
    counts = result.best_week.repetition_metrics.day_plan_occurrence_counts
    assert len(counts) > 1, f"Expected varied days, but got counts: {counts}"
    assert result.best_week.repetition_metrics.soft_repetition_penalty < 300.0


def test_nutritionally_worse_week_does_not_beat_better_week(base_profiles):
    """Test 6: Week A has better daily nutrition (sum_J_day=0.0) but soft repetition penalty.
    Week B has worse nutrition (sum_J_day=0.8) with zero soft repetition penalty.
    Phase 6E must select Week A.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = 60.0
    carb_mid = 250.0
    fat_mid = 60.0

    day_opt = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "opt", neutral, custom_eids=("E_A1", "E_A2", "E_A3"))
    day_bad = _make_mock_day_plan(2, target_e - 300.0, prot_mid, carb_mid, fat_mid, "bad", neutral, custom_eids=("E_B1", "E_B2", "E_B3"))

    policy = WeeklyVarietyPolicy(
        maximum_same_day_plan_occurrences_per_week=2,
        day_plan_enforcement=ConstraintEnforcementMode.SOFT,
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={i: [day_opt, day_bad] for i in range(1, 8)},
        planning_days=7,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    assert result.best_week.nutrition_summary.sum_J_day < 0.10


def test_real_candidate_pool_from_phase6d_contains_distinct_days(base_profiles):
    """Test 7: Verifies that Phase 6D with alternative options produces genuine distinct
    candidate days with unique canonical_day_id.
    """
    neutral, condition = base_profiles
    constraints = [
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_PORTION_002", minimum_grams=75.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_COMP_010", minimum_grams=20.0, maximum_grams=100.0, preferred_grams=40.0),
        PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
        PortionConstraint(entity_id="PK_DISH_028", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
    ]
    alloc_b = MealAllocation(role=MealRole.BREAKFAST, target=PortionOptimizationTarget(target_energy_kcal=380.0, energy_tolerance_kcal=80.0, protein_min_g=12.0, protein_max_g=30.0, carbohydrate_min_g=25.0, carbohydrate_max_g=60.0, fat_min_g=6.0, fat_max_g=22.0, target_source="TEST"), preferred_entity_ids=["PK_COMP_001"])
    alloc_l = MealAllocation(role=MealRole.LUNCH, target=PortionOptimizationTarget(target_energy_kcal=620.0, energy_tolerance_kcal=100.0, protein_min_g=25.0, protein_max_g=50.0, carbohydrate_min_g=45.0, carbohydrate_max_g=90.0, fat_min_g=12.0, fat_max_g=35.0, target_source="TEST"), preferred_entity_ids=["PK_DISH_025"])
    alloc_d = MealAllocation(role=MealRole.DINNER, target=PortionOptimizationTarget(target_energy_kcal=580.0, energy_tolerance_kcal=100.0, protein_min_g=22.0, protein_max_g=45.0, carbohydrate_min_g=40.0, carbohydrate_max_g=85.0, fat_min_g=12.0, fat_max_g=32.0, target_source="TEST"), preferred_entity_ids=["PK_DISH_028"])
    alloc_s = MealAllocation(role=MealRole.SNACK, target=PortionOptimizationTarget(target_energy_kcal=180.0, energy_tolerance_kcal=60.0, protein_min_g=2.0, protein_max_g=15.0, carbohydrate_min_g=10.0, carbohydrate_max_g=35.0, fat_min_g=1.0, fat_max_g=15.0, target_source="TEST"), preferred_entity_ids=["PK_COMP_010"])
    schedule = DailyMealSchedule(allocations=[alloc_b, alloc_l, alloc_d, alloc_s], schedule_name="Test", schedule_source="TEST")

    day_res = generate_full_day_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        schedule=schedule,
        policy=FullDayPlanningPolicy(maximum_meal_candidates_per_role=3, maximum_alternative_day_plans=3),
        default_constraints=constraints,
    )

    assert day_res.is_successful
    assert day_res.best_day_plan is not None
    assert len(day_res.alternative_day_plans) >= 1

    all_days = [day_res.best_day_plan] + day_res.alternative_day_plans
    canonical_ids = [d.canonical_day_id for d in all_days]
    unique_ids = set(canonical_ids)
    assert len(unique_ids) == len(canonical_ids), "Phase 6D produced duplicate canonical_day_ids!"


def test_search_diagnostics_internal_consistency(base_profiles):
    """Test 8: Verifies strict internal consistency between search diagnostic fields."""
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = 60.0
    carb_mid = 250.0
    fat_mid = 60.0

    day_1 = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day1", neutral)
    day_2 = _make_mock_day_plan(2, target_e, prot_mid, carb_mid, fat_mid, "day2", neutral)

    policy = WeeklyVarietyPolicy(
        maximum_candidate_days_per_slot=2,
        maximum_week_candidate_sequences_evaluated=50,
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={i: [day_1, day_2] for i in range(1, 8)},
        planning_days=7,
        policy=policy,
    )

    # Invariant 1: week_sequences_evaluated == weeks_rejected_hard + hard_valid_sequences_evaluated
    assert result.week_sequences_evaluated == result.weeks_rejected_hard_constraints + result.hard_valid_sequences_evaluated

    # Invariant 2: hard_valid_sequences_evaluated == unique_canonical_weeks_evaluated + duplicate_week_sequences_collapsed
    assert result.hard_valid_sequences_evaluated == result.unique_canonical_weeks_evaluated + result.duplicate_week_sequences_collapsed

    # Invariant 3: weeks_remaining_after_hard_filtering == unique_canonical_weeks_evaluated
    assert result.weeks_remaining_after_hard_filtering == result.unique_canonical_weeks_evaluated
