"""Meal/tests/test_week_variety.py - Phase 6E Hard vs Soft Variety & Constraint Enforcement Tests.

Verifies:
1. Test 1: Candidate week violating a HARD variety constraint is REJECTED entirely;
   a candidate week with slightly worse nutrition that satisfies HARD policy is selected.
2. Test 2: SOFT variety violation does NOT override daily nutrition quality;
   a week with better nutrition and soft repetition penalty is selected over a week with worse nutrition.
3. Test 3: If every weekly sequence violates a HARD constraint, returns NO_VALID_WEEK_PLAN under strict policy.
4. Test 4: Rejected hard-invalid weeks NEVER appear in best_week or alternative_weeks.
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
    WeeklyGenerationStatus,
    WeeklyRequiredOccurrence,
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


def test_hard_violation_rejected_and_compliant_selected(base_profiles):
    """Test 1:
    Day 1: Repeated chicken curry (E_CHICKEN) across 7 days.
           sum_J_day = 0.0 (Perfect nutrition).
           Violates HARD constraint: maximum_same_entity_occurrences_per_week = 5 (occurs 7 times).
    Day 2: Varied food (E_LENTILS), energy slightly off target (+30 kcal), sum_J_day = 0.05.
           Satisfies HARD constraint (occurs 3 times).

    Expected:
    The sequence repeating Day 1 is REJECTED entirely.
    The sequence with Day 2 is SELECTED as best_week!
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # Day A has perfect nutrition but uses E_CHICKEN
    day_a = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day_a", neutral, custom_eids=("E_ROTI_A", "E_CHICKEN", "E_RICE_A"))
    # Day B has slightly deviated nutrition (+50 kcal) but uses E_DAAL and distinct carbs
    day_b = _make_mock_day_plan(2, target_e + 50.0, prot_mid, carb_mid, fat_mid, "day_b", neutral, custom_eids=("E_ROTI_B", "E_DAAL", "E_RICE_B"))

    policy = WeeklyVarietyPolicy(
        maximum_same_entity_occurrences_per_week=5,
        entity_occurrence_enforcement=ConstraintEnforcementMode.HARD,
        maximum_candidate_days_per_slot=2,
    )

    # Slot candidates: provide day_a and day_b for each slot
    candidate_days_by_slot = {i: [day_a, day_b] for i in range(1, 8)}

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot=candidate_days_by_slot,
        planning_days=7,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    # Best week must NOT be 7 days of day_a, because day_a has E_CHICKEN which would appear 7 times (> 5 limit)
    assert result.best_week.repetition_metrics.entity_occurrence_counts["E_CHICKEN"] <= 5
    assert result.best_week.repetition_metrics.is_hard_valid is True
    assert result.weeks_rejected_hard_constraints > 0


def test_soft_violation_does_not_override_nutrition(base_profiles):
    """Test 2:
    Week A: sum_J_day = 0.00, SOFT repetition penalty > 0.
    Week B: sum_J_day = 0.80, SOFT repetition penalty = 0.

    Expected: Week A selected! (Daily nutrition strictly beats soft variety).
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # Day Perfect: sum_J_day = 0.0
    day_perfect = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "perfect", neutral, custom_eids=("E_ROTI", "E_SABZI", "E_RICE"))
    # Day Deviated: 300 kcal deficit -> sum_J_day > 0.1 per day
    day_deviated = _make_mock_day_plan(2, target_e - 300.0, prot_mid, carb_mid, fat_mid, "deviated", neutral, custom_eids=("E_UNIQUE_1", "E_UNIQUE_2", "E_UNIQUE_3"))

    policy = WeeklyVarietyPolicy(
        maximum_same_entity_occurrences_per_week=5,
        entity_occurrence_enforcement=ConstraintEnforcementMode.SOFT,  # SOFT enforcement
    )

    # For each slot, candidate pool has [day_perfect, day_deviated]
    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={i: [day_perfect, day_deviated] for i in range(1, 8)},
        planning_days=7,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    # Best week must have chosen day_perfect sequence despite soft repetition penalty
    assert result.best_week.nutrition_summary.sum_J_day < 0.10
    assert result.best_week.repetition_metrics.soft_repetition_penalty > 0.0


def test_all_sequences_violating_hard_constraint_returns_no_valid_plan(base_profiles):
    """Test 3: If every candidate sequence violates a caller-specified HARD constraint,
    the engine returns NO_VALID_WEEK_PLAN under strict policy without silently weakening the rule.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # Only one candidate day is available and it uses E_MEAT
    day = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "only_day", neutral, custom_eids=("E_ROTI", "E_MEAT", "E_RICE"))

    # Caller specifies HARD rule: maximum_same_entity_occurrences_per_week = 3
    # But 7 days means E_MEAT appears 7 times -> 100% of sequences violate
    policy = WeeklyVarietyPolicy(
        maximum_same_entity_occurrences_per_week=3,
        entity_occurrence_enforcement=ConstraintEnforcementMode.HARD,
        require_full_week=True,
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_day_pool=[day],
        planning_days=7,
        policy=policy,
    )

    assert result.status == WeeklyGenerationStatus.NO_VALID_WEEK_PLAN
    assert result.best_week is None
    assert result.alternative_weeks == []
    assert result.weeks_rejected_hard_constraints == 1
    assert result.weeks_remaining_after_hard_filtering == 0


def test_rejected_hard_invalid_weeks_never_appear_in_alternatives(base_profiles):
    """Test 4: Hard-invalid weeks must never appear as best_week or in alternative_weeks."""
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    day_a = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "a", neutral, custom_eids=("E_1", "E_2", "E_3"))
    day_b = _make_mock_day_plan(2, target_e, prot_mid, carb_mid, fat_mid, "b", neutral, custom_eids=("E_4", "E_5", "E_6"))

    # Require HARD occurrence of E_NONEXISTENT >= 1
    policy = WeeklyVarietyPolicy(
        required_occurrences=[
            WeeklyRequiredOccurrence(
                entity_or_concept_id="E_NONEXISTENT",
                minimum_occurrences=1,
                enforcement=ConstraintEnforcementMode.HARD,
            )
        ]
    )

    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_day_pool=[day_a, day_b],
        planning_days=7,
        policy=policy,
    )

    assert result.best_week is None
    assert len(result.alternative_weeks) == 0
    assert result.weeks_remaining_after_hard_filtering == 0


def test_golden_case_2_optimal_repetition_vs_varied_alternative(base_profiles):
    """Case 2 from golden fixture:
    When candidate days have identical or comparable nutritional compliance (sum_J_day=0),
    a sequence that introduces varied days incurs lower soft repetition penalty and is preferred
    over monotonously repeating the identical day plan.
    """
    neutral, condition = base_profiles
    target_e = neutral.energy_target_kcal
    prot_mid = ((neutral.protein_target_min_g or neutral.protein_amdr_min_g) + (neutral.protein_target_max_g or neutral.protein_amdr_max_g)) / 2.0
    carb_mid = ((neutral.carbohydrate_target_min_g or neutral.carbohydrate_amdr_min_g) + (neutral.carbohydrate_target_max_g or neutral.carbohydrate_amdr_max_g)) / 2.0
    fat_mid = (neutral.fat_amdr_min_g + neutral.fat_amdr_max_g) / 2.0

    # Two distinct days with identical target_e (sum_J_day=0 for both)
    day_1 = _make_mock_day_plan(1, target_e, prot_mid, carb_mid, fat_mid, "day_1", neutral, custom_eids=("E_ROTI", "E_DAAL", "E_RICE"))
    day_2 = _make_mock_day_plan(2, target_e, prot_mid, carb_mid, fat_mid, "day_2", neutral, custom_eids=("E_CHAPATI_2", "E_CHICKEN", "E_PULAO"))

    policy = WeeklyVarietyPolicy(
        maximum_same_day_plan_occurrences_per_week=2,
        day_plan_enforcement=ConstraintEnforcementMode.SOFT,
    )

    # Offer both days across 4 slots
    result = generate_weekly_plan(
        neutral_profile=neutral,
        condition_profile=condition,
        candidate_days_by_slot={
            1: [day_1, day_2],
            2: [day_1, day_2],
            3: [day_1, day_2],
            4: [day_1, day_2],
        },
        planning_days=4,
        policy=policy,
    )

    assert result.is_successful
    assert result.best_week is not None
    # Best week mixes both days to minimize day_plan repetition penalty rather than repeating day_1 4 times
    counts = result.best_week.repetition_metrics.day_plan_occurrence_counts
    assert len(counts) > 1
