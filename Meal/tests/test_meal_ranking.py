"""Meal/tests/test_meal_ranking.py - Tests for Phase 6C lexicographic meal ranking.

Verifies:
- Requirement 1 & 2: Revised ranking contract (feasibility, J*, -preference_coverage, canonical ID).
- Secondary objective is NEVER used for cross-combination ranking.
- Requirement 14: Fully feasible meals (J*=0) are broken strictly by preference coverage then canonical ID.
  No protein, fiber, energy density, or condition heuristics.
- Requirement 16: Alternative meals count respected and unique.
"""

import pytest

from Meal.composition.ranking import compute_meal_ranking_key
from Meal.composition.schemas import (
    MealFeasibilityClass,
    RecipeCoverageStatus,
    SingleMealPlan,
)
from Meal.optimizer.schemas import PortionOptimizationStatus


def create_mock_plan(
    cid: str,
    feas_class: MealFeasibilityClass = MealFeasibilityClass.FEASIBLE,
    j_star: float = 0.0,
    pref_coverage: float = 0.0,
    secondary_val: float = 0.0,
    secondary_mode: str = "TOTAL_GRAMS_TIE_BREAKER",
) -> SingleMealPlan:
    return SingleMealPlan(
        canonical_combination_id=cid,
        items=[],
        total_energy_kcal=300.0,
        total_protein_g=20.0,
        total_fat_g=10.0,
        total_carbohydrate_g=40.0,
        total_fiber_g=5.0,
        fiber_coverage_status="COMPLETE",
        feasibility_class=feas_class,
        primary_objective=j_star,
        secondary_objective=secondary_val,
        secondary_objective_mode=secondary_mode,
        target_deviations={},
        recipe_instruction_coverage_status=RecipeCoverageStatus.FULL,
        item_recipe_availability={},
        matched_preferred_entity_count=int(pref_coverage * 2),
        total_valid_preferred_entity_count=2 if pref_coverage > 0 else 0,
        preference_coverage=pref_coverage,
        optimization_status=PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
    )


class TestMealRanking:
    """Tests lexicographic ordering invariants of Phase 6C single-meal ranking."""

    def test_feasibility_class_dominance(self):
        """Feasibility class strictly dominates primary objective and preference."""
        plan_feasible = create_mock_plan("COMB_A", feas_class=MealFeasibilityClass.FEASIBLE, j_star=0.0)
        plan_deviations = create_mock_plan("COMB_B", feas_class=MealFeasibilityClass.OPTIMAL_WITH_TARGET_DEVIATIONS, j_star=0.1, pref_coverage=1.0)
        plan_infeasible = create_mock_plan("COMB_C", feas_class=MealFeasibilityClass.INFEASIBLE_UPSTREAM, j_star=0.0)

        plans = [plan_deviations, plan_infeasible, plan_feasible]
        sorted_plans = sorted(plans, key=compute_meal_ranking_key)

        assert sorted_plans[0].canonical_combination_id == "COMB_A"
        assert sorted_plans[1].canonical_combination_id == "COMB_B"
        assert sorted_plans[2].canonical_combination_id == "COMB_C"

    def test_primary_objective_dominates_preference_and_id(self):
        """Within target-deviation meals, lower J* strictly dominates preference and ID."""
        plan_low_j = create_mock_plan(
            "COMB_Z",
            feas_class=MealFeasibilityClass.OPTIMAL_WITH_TARGET_DEVIATIONS,
            j_star=0.12,
            pref_coverage=0.0,
        )
        plan_high_j = create_mock_plan(
            "COMB_A",
            feas_class=MealFeasibilityClass.OPTIMAL_WITH_TARGET_DEVIATIONS,
            j_star=0.35,
            pref_coverage=1.0,
        )

        sorted_plans = sorted([plan_high_j, plan_low_j], key=compute_meal_ranking_key)
        assert sorted_plans[0].canonical_combination_id == "COMB_Z"

    def test_preference_coverage_breaks_ties_when_j_equal(self):
        """When J* are equal (e.g. fully feasible J*=0), higher preference coverage ranks earlier."""
        plan_pref = create_mock_plan("COMB_Z", j_star=0.0, pref_coverage=0.75)
        plan_no_pref = create_mock_plan("COMB_A", j_star=0.0, pref_coverage=0.25)

        sorted_plans = sorted([plan_no_pref, plan_pref], key=compute_meal_ranking_key)
        assert sorted_plans[0].canonical_combination_id == "COMB_Z"

    def test_canonical_id_breaks_ties_when_everything_else_equal(self):
        """When feasibility, J*, and preference are identical, alphabetical canonical ID breaks ties."""
        plan_1 = create_mock_plan("PK_CANON_002+PK_PORTION_001", j_star=0.0, pref_coverage=0.5)
        plan_2 = create_mock_plan("PK_CANON_001+PK_PORTION_001", j_star=0.0, pref_coverage=0.5)

        sorted_plans = sorted([plan_1, plan_2], key=compute_meal_ranking_key)
        assert sorted_plans[0].canonical_combination_id == "PK_CANON_001+PK_PORTION_001"
        assert sorted_plans[1].canonical_combination_id == "PK_CANON_002+PK_PORTION_001"

    def test_secondary_objective_completely_ignored_in_ranking(self):
        """Requirement 1, 18, 19: Proves secondary objective value has zero influence on ranking."""
        # COMB_B has small secondary value (0.01) while COMB_A has large secondary value (999.0)
        # However, COMB_A has lower canonical ID.
        plan_a = create_mock_plan("COMB_A", j_star=0.0, pref_coverage=0.0, secondary_val=999.0)
        plan_b = create_mock_plan("COMB_B", j_star=0.0, pref_coverage=0.0, secondary_val=0.01)

        sorted_plans = sorted([plan_b, plan_a], key=compute_meal_ranking_key)
        # Ranking must NOT pick COMB_B just because 0.01 < 999.0!
        assert sorted_plans[0].canonical_combination_id == "COMB_A"
        assert sorted_plans[1].canonical_combination_id == "COMB_B"
