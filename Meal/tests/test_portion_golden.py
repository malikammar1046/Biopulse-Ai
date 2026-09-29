"""Meal/tests/test_portion_golden.py - Mathematical golden tests for Phase 6B LP solver.

Exercises the lower-level solver function `solve_portion_lp` directly using synthetic
coefficient matrices and targets from `Meal/tests/fixtures/portion_optimizer_golden.json`.
Does NOT touch the real Pakistani catalog or inject synthetic foods into the production pipeline.
"""

import json
from pathlib import Path
import pytest

from Meal.optimizer.schemas import SecondaryObjectiveMode
from Meal.optimizer.solver import solve_portion_lp


@pytest.fixture
def golden_data():
    fixture_path = Path(__file__).parent / "fixtures" / "portion_optimizer_golden.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


class TestPortionOptimizerGolden:
    """Exercises lower-level mathematical solver against synthetic golden test cases."""

    def test_case_1_one_food_exact_energy(self, golden_data):
        """Case 1: Single food exact energy match [200, 200] kcal. Secondary minimizes total grams."""
        case = next(c for c in golden_data["cases"] if c["case_id"] == "case_1_one_food_exact_energy")
        sol = solve_portion_lp(
            nutrient_coefficients=case["nutrient_coefficients"],
            target_ranges=case["target_ranges"],
            gram_bounds=case["gram_bounds"],
            preferred_grams=case["preferred_grams"],
        )

        assert sol.success is True
        assert sol.status_code == 0
        assert pytest.approx(sol.optimized_grams[0], rel=1e-5) == 200.0
        assert pytest.approx(sol.primary_objective_value, abs=1e-5) == 0.0
        assert pytest.approx(sol.violations["energy"][0], abs=1e-5) == 0.0
        assert pytest.approx(sol.violations["energy"][1], abs=1e-5) == 0.0
        assert sol.secondary_objective_mode == SecondaryObjectiveMode.TOTAL_GRAMS_TIE_BREAKER
        assert pytest.approx(sol.secondary_objective_value, rel=1e-4) == 200.0
        assert pytest.approx(sol.secondary_objective_recomputed, rel=1e-4) == 200.0
        assert pytest.approx(sol.secondary_objective_solver, rel=1e-4) == 200.0

    def test_case_2_two_food_macro_balance(self, golden_data):
        """Case 2: Two-food macro balance with zero target violations. Secondary minimizes total grams."""
        case = next(c for c in golden_data["cases"] if c["case_id"] == "case_2_two_food_macro_balance")
        sol = solve_portion_lp(
            nutrient_coefficients=case["nutrient_coefficients"],
            target_ranges=case["target_ranges"],
            gram_bounds=case["gram_bounds"],
            preferred_grams=case["preferred_grams"],
        )

        assert sol.success is True
        assert pytest.approx(sol.primary_objective_value, abs=1e-5) == 0.0
        for nutrient in ["energy", "protein", "carb", "fat"]:
            assert pytest.approx(sol.violations[nutrient][0], abs=1e-5) == 0.0
            assert pytest.approx(sol.violations[nutrient][1], abs=1e-5) == 0.0

        # Check total nutrients fall within target ranges
        coeffs = case["nutrient_coefficients"]
        for nutrient, (t_min, t_max) in case["target_ranges"].items():
            tot = sum(coeffs[nutrient][i] * sol.optimized_grams[i] for i in range(len(sol.optimized_grams)))
            assert t_min - 1e-5 <= tot <= t_max + 1e-5

        assert sol.secondary_objective_mode == SecondaryObjectiveMode.TOTAL_GRAMS_TIE_BREAKER
        expected_sec = sum(sol.optimized_grams)
        assert pytest.approx(sol.secondary_objective_value, rel=1e-4) == expected_sec
        assert pytest.approx(sol.secondary_objective_recomputed, rel=1e-4) == expected_sec
        assert pytest.approx(sol.secondary_objective_solver, rel=1e-4) == expected_sec

    def test_case_3_unreachable_energy_target(self, golden_data):
        """Case 3: J* > 0 and no preferences. Capped at 100g (100 kcal) for target [200, 250] kcal.
        
        Requires:
        - status: success (Pass 1 & 2 succeed)
        - primary_objective_value > 0 (J* = 100/225 = 0.444444)
        - secondary_objective_mode: TOTAL_GRAMS_TIE_BREAKER
        - secondary_objective: sum(optimized_grams) = 100.0g
        """
        case = next(c for c in golden_data["cases"] if c["case_id"] == "case_3_unreachable_energy_target")
        sol = solve_portion_lp(
            nutrient_coefficients=case["nutrient_coefficients"],
            target_ranges=case["target_ranges"],
            gram_bounds=case["gram_bounds"],
            preferred_grams=case["preferred_grams"],
        )

        assert sol.success is True
        assert pytest.approx(sol.optimized_grams[0], rel=1e-5) == 100.0
        assert pytest.approx(sol.violations["energy"][0], rel=1e-4) == 100.0
        assert pytest.approx(sol.violations["energy"][1], abs=1e-5) == 0.0
        assert sol.primary_objective_value > 0.0
        assert pytest.approx(sol.primary_objective_value, rel=1e-4) == (100.0 / 225.0)

        assert sol.secondary_objective_mode == SecondaryObjectiveMode.TOTAL_GRAMS_TIE_BREAKER
        assert pytest.approx(sol.secondary_objective_value, rel=1e-4) == 100.0
        assert pytest.approx(sol.secondary_objective_recomputed, rel=1e-4) == 100.0
        assert pytest.approx(sol.secondary_objective_solver, rel=1e-4) == 100.0

    def test_case_4_overconstrained_target_with_preferred_grams(self, golden_data):
        """Case 4: J* > 0 with preferred portions.
        
        Food lower bound 200g (200 kcal) exceeds target [100, 150] kcal.
        Optimal portion hits 200.0g, J* = (200 - 150) / 125 = 0.400000.
        Preferred portion is 250.0g with bounds [200, 300].
        Secondary objective: |200 - 250| / 100 = 0.500000 > 0.
        Mode: PREFERENCE_DEVIATION.
        """
        case = next(c for c in golden_data["cases"] if c["case_id"] == "case_4_overconstrained_target_with_preferred_grams")
        sol = solve_portion_lp(
            nutrient_coefficients=case["nutrient_coefficients"],
            target_ranges=case["target_ranges"],
            gram_bounds=case["gram_bounds"],
            preferred_grams=case["preferred_grams"],
        )

        assert sol.success is True
        assert pytest.approx(sol.optimized_grams[0], rel=1e-4) == 200.0
        assert sol.primary_objective_value > 0.0
        assert pytest.approx(sol.primary_objective_value, rel=1e-4) == 0.400000
        assert pytest.approx(sol.violations["energy"][1], rel=1e-4) == 50.0

        assert sol.secondary_objective_mode == SecondaryObjectiveMode.PREFERENCE_DEVIATION
        assert pytest.approx(sol.secondary_objective_value, rel=1e-4) == 0.500000
        assert pytest.approx(sol.secondary_objective_recomputed, rel=1e-4) == 0.500000
        assert pytest.approx(sol.secondary_objective_solver, rel=1e-4) == 0.500000

    def test_case_5_zero_preferred_grams_safe_normalization(self, golden_data):
        """Case 5: preferred_grams = 0.0g with bounds [0, 100]. Scale = max(100-0, 1.0) = 100. No divide-by-zero."""
        case = next(c for c in golden_data["cases"] if c["case_id"] == "case_5_zero_preferred_grams_safe_normalization")
        sol = solve_portion_lp(
            nutrient_coefficients=case["nutrient_coefficients"],
            target_ranges=case["target_ranges"],
            gram_bounds=case["gram_bounds"],
            preferred_grams=case["preferred_grams"],
        )

        assert sol.success is True
        assert pytest.approx(sol.optimized_grams[0], abs=1e-5) == 0.0
        assert pytest.approx(sol.primary_objective_value, abs=1e-5) == 0.0
        assert sol.secondary_objective_mode == SecondaryObjectiveMode.PREFERENCE_DEVIATION
        assert pytest.approx(sol.secondary_objective_value, abs=1e-5) == 0.0
        assert pytest.approx(sol.secondary_objective_recomputed, abs=1e-5) == 0.0
        assert pytest.approx(sol.secondary_objective_solver, abs=1e-5) == 0.0

    def test_case_6_preferred_away_from_optimum(self, golden_data):
        """Case 6: Target range [160, 200] kcal forces portion away from preferred 100g to 160g. Secondary obj = 0.4 > 0."""
        case = next(c for c in golden_data["cases"] if c["case_id"] == "case_6_preferred_away_from_optimum")
        sol = solve_portion_lp(
            nutrient_coefficients=case["nutrient_coefficients"],
            target_ranges=case["target_ranges"],
            gram_bounds=case["gram_bounds"],
            preferred_grams=case["preferred_grams"],
        )

        assert sol.success is True
        assert pytest.approx(sol.optimized_grams[0], rel=1e-5) == 160.0
        assert pytest.approx(sol.primary_objective_value, abs=1e-5) == 0.0
        assert sol.secondary_objective_mode == SecondaryObjectiveMode.PREFERENCE_DEVIATION
        assert pytest.approx(sol.secondary_objective_value, rel=1e-4) == 0.4
        assert sol.secondary_objective_value > 0.0
        assert pytest.approx(sol.secondary_objective_recomputed, rel=1e-4) == 0.4
        assert pytest.approx(sol.secondary_objective_solver, rel=1e-4) == 0.4
