"""Meal/tests/test_meal_golden.py - Golden regression tests for Phase 6C Single-Meal Generation.

Exercises:
- Golden cases from Meal/tests/fixtures/single_meal_generator_golden.json.
- Requirement 18: Cross-mode secondary objective non-interference.
- Requirement 19: Same-mode secondary objective non-interference.
- Preference tie-breaking and search truncation diagnostics.
"""

import json
from pathlib import Path
import pytest

from Meal.composition.combinations import (
    calculate_total_possible_combinations,
    generate_and_order_combinations,
)
from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.ranking import compute_meal_ranking_key
from Meal.composition.schemas import (
    MealCombinationPolicy,
    MealFeasibilityClass,
    RecipeCoverageStatus,
    SelectionScope,
    SingleMealGenerationContext,
    SingleMealPlan,
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
    NutrientDeviation,
    PortionConstraint,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def golden_fixture():
    fixture_path = Path(__file__).parent / "fixtures" / "single_meal_generator_golden.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


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


class TestSingleMealGolden:
    """Golden test suite for Phase 6C single-meal generation."""

    def test_case_1_single_food_feasible(self, base_profiles):
        """Case 1: Single eligible food meeting target energy and macros with J*=0."""
        neutral, condition = base_profiles
        planner_ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_result = rank_meal_candidates(neutral, condition, planner_ctx)

        # Single food target calibrated to Chapati portion (PK_PORTION_001) ~80g (160-220 kcal)
        target = PortionOptimizationTarget(
            target_energy_kcal=210.0,
            energy_tolerance_kcal=40.0,
            protein_min_g=4.0,
            protein_max_g=15.0,
            carbohydrate_min_g=25.0,
            carbohydrate_max_g=55.0,
            fat_min_g=0.5,
            fat_max_g=10.0,
        )
        constraints = [
            PortionConstraint(
                entity_id="PK_PORTION_001",
                minimum_grams=40.0,
                maximum_grams=120.0,
            )
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=1,
            maximum_items=1,
            maximum_combinations_evaluated=10,
        )

        result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=constraints,
            context=meal_ctx,
            policy=policy,
        )

        assert result.is_successful is True
        assert result.best_meal is not None
        assert result.best_meal.feasibility_class == MealFeasibilityClass.FEASIBLE
        assert pytest.approx(result.best_meal.primary_objective, abs=1e-5) == 0.0
        assert len(result.best_meal.items) == 1
        assert result.best_meal.items[0].entity_id == "PK_PORTION_001"

    def test_case_2_two_food_macro_balance(self, base_profiles):
        """Case 2: Two compatible foods balanced by optimizer to satisfy all core targets."""
        neutral, condition = base_profiles
        planner_ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_result = rank_meal_candidates(neutral, condition, planner_ctx)

        target = PortionOptimizationTarget(
            target_energy_kcal=400.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=12.0,
            protein_max_g=30.0,
            carbohydrate_min_g=30.0,
            carbohydrate_max_g=70.0,
            fat_min_g=6.0,
            fat_max_g=25.0,
        )
        constraints = [
            PortionConstraint(
                entity_id="PK_PORTION_001",  # Chapati portion
                minimum_grams=40.0,
                maximum_grams=120.0,
            ),
            PortionConstraint(
                entity_id="PK_DISH_009",  # Chicken Curry
                minimum_grams=60.0,
                maximum_grams=200.0,
            ),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.LUNCH,
            required_entity_ids=["PK_PORTION_001", "PK_DISH_009"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=10,
        )

        result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=constraints,
            context=meal_ctx,
            policy=policy,
        )

        assert result.is_successful is True
        assert result.best_meal is not None
        assert result.best_meal.feasibility_class == MealFeasibilityClass.FEASIBLE
        assert pytest.approx(result.best_meal.primary_objective, abs=1e-5) == 0.0
        assert len(result.best_meal.items) == 2
        entity_ids = {item.entity_id for item in result.best_meal.items}
        assert entity_ids == {"PK_PORTION_001", "PK_DISH_009"}

    def test_case_3_required_food_fixed(self, base_profiles):
        """Case 3: Required food is strictly present in every evaluated combination and best meal."""
        neutral, condition = base_profiles
        planner_ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_result = rank_meal_candidates(neutral, condition, planner_ctx)

        target = PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=8.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=60.0,
            fat_min_g=4.0,
            fat_max_g=20.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0),
            PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=10,
        )

        result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=constraints,
            context=meal_ctx,
            policy=policy,
        )

        assert result.is_successful is True
        assert result.best_meal is not None
        assert "PK_PORTION_001" in result.best_meal.entity_ids
        for alt in result.alternative_meals:
            assert "PK_PORTION_001" in alt.entity_ids

    def test_case_4_user_preference_tie_breaker(self, base_profiles):
        """Case 4: Two combinations both with J*=0; preferred combination ranks higher."""
        neutral, condition = base_profiles
        planner_ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_result = rank_meal_candidates(neutral, condition, planner_ctx)

        target = PortionOptimizationTarget(
            target_energy_kcal=300.0,
            energy_tolerance_kcal=80.0,
            protein_min_g=6.0,
            protein_max_g=30.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=65.0,
            fat_min_g=2.0,
            fat_max_g=20.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0),
            PortionConstraint(entity_id="PK_COMP_015", minimum_grams=50.0, maximum_grams=200.0),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=["PK_COMP_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=10,
        )

        result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=constraints,
            context=meal_ctx,
            policy=policy,
        )

        assert result.is_successful is True
        assert result.best_meal is not None
        assert result.best_meal.matched_preferred_entity_count > 0
        assert "PK_COMP_001" in result.best_meal.entity_ids

    def test_case_5_cross_mode_secondary_non_interference(self):
        """Case 5 (Requirement 18): Cross-mode secondary objective misuse regression test.

        Meal A: fully feasible, secondary mode = PREFERENCE_DEVIATION, secondary = 0.8, canonical_id = 'FOOD_B'
        Meal B: fully feasible, secondary mode = TOTAL_GRAMS_TIE_BREAKER, secondary = 100.0, canonical_id = 'FOOD_A'
        No meal-level user preference difference.

        Require: Ranking does NOT treat 0.8 < 100.0 (different units!).
        Falls back to canonical ID ordering: 'FOOD_A' < 'FOOD_B', so Meal B ranks ahead of Meal A.
        """
        def make_dummy_plan(cid: str, sec_val: float, sec_mode: str) -> SingleMealPlan:
            return SingleMealPlan(
                canonical_combination_id=cid,
                items=[],
                total_energy_kcal=300.0,
                total_protein_g=20.0,
                total_fat_g=10.0,
                total_carbohydrate_g=40.0,
                total_fiber_g=5.0,
                fiber_coverage_status="COMPLETE",
                feasibility_class=MealFeasibilityClass.FEASIBLE,
                primary_objective=0.0,
                secondary_objective=sec_val,  # Diagnostic only
                secondary_objective_mode=sec_mode,
                target_deviations={},
                recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
                item_recipe_availability={},
                matched_preferred_entity_count=0,
                total_valid_preferred_entity_count=0,
                preference_coverage=0.0,
                optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
            )

        meal_a = make_dummy_plan("FOOD_B", 0.8, "PREFERENCE_DEVIATION")
        meal_b = make_dummy_plan("FOOD_A", 100.0, "TOTAL_GRAMS_TIE_BREAKER")

        key_a = compute_meal_ranking_key(meal_a)
        key_b = compute_meal_ranking_key(meal_b)

        # Keys must be (feasibility_rank, primary_objective, -preference_coverage, canonical_id)
        assert key_a == (0, 0.0, -0.0, "FOOD_B")
        assert key_b == (0, 0.0, -0.0, "FOOD_A")

        # Sorted order MUST place FOOD_A first because canonical ID 'FOOD_A' < 'FOOD_B'
        # Secondary objective (0.8 vs 100.0) MUST have zero effect!
        sorted_plans = sorted([meal_a, meal_b], key=compute_meal_ranking_key)
        assert sorted_plans[0].canonical_combination_id == "FOOD_A"
        assert sorted_plans[1].canonical_combination_id == "FOOD_B"

    def test_case_6_same_mode_secondary_non_interference(self):
        """Case 6 (Requirement 19): Same-mode secondary objective non-interference.

        Even if both meals have PREFERENCE_DEVIATION, Phase 6B secondary objective is NOT used
        for cross-meal ranking. It only answers within-food-set portion guidance.
        Meal A: secondary = 0.2, canonical_id = 'FOOD_Y'
        Meal B: secondary = 0.8, canonical_id = 'FOOD_X'

        Deterministic canonical ordering places FOOD_X before FOOD_Y.
        """
        def make_dummy_plan(cid: str, sec_val: float) -> SingleMealPlan:
            return SingleMealPlan(
                canonical_combination_id=cid,
                items=[],
                total_energy_kcal=300.0,
                total_protein_g=20.0,
                total_fat_g=10.0,
                total_carbohydrate_g=40.0,
                total_fiber_g=5.0,
                fiber_coverage_status="COMPLETE",
                feasibility_class=MealFeasibilityClass.FEASIBLE,
                primary_objective=0.0,
                secondary_objective=sec_val,
                secondary_objective_mode="PREFERENCE_DEVIATION",
                target_deviations={},
                recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
                item_recipe_availability={},
                matched_preferred_entity_count=0,
                total_valid_preferred_entity_count=0,
                preference_coverage=0.0,
                optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
            )

        meal_a = make_dummy_plan("FOOD_Y", 0.2)
        meal_b = make_dummy_plan("FOOD_X", 0.8)

        sorted_plans = sorted([meal_a, meal_b], key=compute_meal_ranking_key)
        # FOOD_X comes first despite having higher secondary objective (0.8 > 0.2)
        assert sorted_plans[0].canonical_combination_id == "FOOD_X"
        assert sorted_plans[1].canonical_combination_id == "FOOD_Y"

    def test_case_7_target_deviations_ranking(self):
        """Case 7: Lower primary objective violation ranks ahead for target deviation meals."""
        def make_deviation_plan(cid: str, j_val: float) -> SingleMealPlan:
            return SingleMealPlan(
                canonical_combination_id=cid,
                items=[],
                total_energy_kcal=300.0,
                total_protein_g=20.0,
                total_fat_g=10.0,
                total_carbohydrate_g=40.0,
                total_fiber_g=5.0,
                fiber_coverage_status="COMPLETE",
                feasibility_class=MealFeasibilityClass.OPTIMAL_WITH_TARGET_DEVIATIONS,
                primary_objective=j_val,
                secondary_objective=50.0,
                secondary_objective_mode="TOTAL_GRAMS_TIE_BREAKER",
                target_deviations={},
                recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
                item_recipe_availability={},
                matched_preferred_entity_count=0,
                total_valid_preferred_entity_count=0,
                preference_coverage=0.0,
                optimization_status=PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
            )

        meal_1 = make_deviation_plan("COMB_A", 0.35)
        meal_2 = make_deviation_plan("COMB_B", 0.15)

        sorted_plans = sorted([meal_1, meal_2], key=compute_meal_ranking_key)
        assert sorted_plans[0].canonical_combination_id == "COMB_B"
        assert sorted_plans[0].primary_objective == 0.15

    def test_case_8_search_truncation_warning(self):
        """Case 8: Search space truncation sets TRUNCATED_SEARCH and emits warning."""
        policy = MealCombinationPolicy(
            minimum_items=1,
            maximum_items=3,
            maximum_combinations_evaluated=5,
        )
        optional_ids = [f"FOOD_{i:02d}" for i in range(10)]
        combs, total_possible, truncated, scope, warnings = generate_and_order_combinations(
            required_ids=[],
            optional_candidate_ids=optional_ids,
            valid_preferred_ids=set(),
            policy=policy,
        )

        assert truncated is True
        assert scope == SelectionScope.TRUNCATED_SEARCH
        assert len(combs) == 5
        assert total_possible > 5
        assert any("BETTER_UNEVALUATED_COMBINATION_MAY_EXIST" in w for w in warnings)
