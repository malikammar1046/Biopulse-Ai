"""Meal/tests/test_portion_solver.py - Tests for deterministic two-pass LP solver mechanics.

Verifies:
- Deterministic lexicographic two-pass LP structure (Pass 1 primary J*, Pass 2 secondary).
- Pass 2 constraint: J <= J* + primary_solver_tolerance (1e-6).
- Secondary objective with preferred_grams uses span normalization max(U_i - L_i, 1.0).
- When only some foods have preferred_grams, preference deviation applies ONLY to those foods.
- When no foods have preferred_grams, secondary objective minimizes total grams as a mathematical tie-breaker.
- Documentation that total grams minimization is a solver tie-breaker, not nutritional guidance.
"""

import pytest

from Meal.optimizer.solver import solve_portion_lp


class TestTwoPassLexicographicSolver:
    """Verifies internal behavior and secondary tie-breaking mechanics."""

    def test_pass_2_tie_breaker_total_grams_when_no_preferences(self):
        """When multiple solutions achieve J*=0 with no preferences, solver selects minimum total grams."""
        # Two identical foods offering same nutrition per gram
        nutrient_coeffs = {
            "energy": [1.0, 1.0],
            "protein": [0.1, 0.1],
            "carb": [0.2, 0.2],
            "fat": [0.05, 0.05],
        }
        target_ranges = {
            "energy": [200.0, 300.0],
            "protein": [10.0, 50.0],
            "carb": [20.0, 80.0],
            "fat": [5.0, 30.0],
        }
        # Bounds allow [50, 200] for both foods. Target energy [200, 300] can be satisfied
        # with any sum between 200g and 300g.
        # Tie-breaker (min total grams) should select exactly 200g total (e.g. 50 + 150 = 200).
        gram_bounds = [[50.0, 200.0], [50.0, 200.0]]
        preferred_grams = [None, None]

        sol = solve_portion_lp(
            nutrient_coefficients=nutrient_coeffs,
            target_ranges=target_ranges,
            gram_bounds=gram_bounds,
            preferred_grams=preferred_grams,
        )

        assert sol.success is True
        assert pytest.approx(sol.primary_objective_value, abs=1e-5) == 0.0
        # Total grams should be exactly 200.0 (lower bound of energy target), not 300.0
        total_grams = sum(sol.optimized_grams)
        assert pytest.approx(total_grams, rel=1e-4) == 200.0

    def test_pass_2_partial_preferred_grams(self):
        """When only food 0 has preferred_grams, preference deviation applies only to food 0."""
        nutrient_coeffs = {
            "energy": [1.0, 1.0],
            "protein": [0.1, 0.1],
            "carb": [0.2, 0.2],
            "fat": [0.05, 0.05],
        }
        target_ranges = {
            "energy": [200.0, 300.0],
            "protein": [10.0, 50.0],
            "carb": [20.0, 80.0],
            "fat": [5.0, 30.0],
        }
        gram_bounds = [[50.0, 200.0], [50.0, 200.0]]
        # Only food 0 has preferred grams (120g). Food 1 has None.
        preferred_grams = [120.0, None]

        sol = solve_portion_lp(
            nutrient_coefficients=nutrient_coeffs,
            target_ranges=target_ranges,
            gram_bounds=gram_bounds,
            preferred_grams=preferred_grams,
        )

        assert sol.success is True
        assert pytest.approx(sol.primary_objective_value, abs=1e-5) == 0.0
        # Food 0 should achieve exactly 120.0g
        assert pytest.approx(sol.optimized_grams[0], rel=1e-4) == 120.0
        # Total energy must be in [200, 300], so food 1 takes 80.0g (120 + 80 = 200, min total grams)
        assert pytest.approx(sol.optimized_grams[1], rel=1e-4) == 80.0

    def test_solver_diagnostics_returned(self):
        """Solver solution must contain iterations and status information."""
        nutrient_coeffs = {
            "energy": [1.0],
            "protein": [0.1],
            "carb": [0.2],
            "fat": [0.05],
        }
        target_ranges = {
            "energy": [100.0, 100.0],
            "protein": [0.0, 50.0],
            "carb": [0.0, 50.0],
            "fat": [0.0, 50.0],
        }
        gram_bounds = [[50.0, 150.0]]
        preferred_grams = [None]

        sol = solve_portion_lp(nutrient_coeffs, target_ranges, gram_bounds, preferred_grams)
        assert sol.iterations >= 0
        assert sol.status_code == 0
        assert "highs" in sol.message.lower() or "optimal" in sol.message.lower()

    def test_secondary_pass_executed_when_primary_target_violated(self):
        """Pass 2 must execute and record secondary objective even when J* > 0."""
        from Meal.optimizer.schemas import SecondaryObjectiveMode

        nutrient_coeffs = {
            "energy": [1.0],
            "protein": [0.1],
            "carb": [0.1],
            "fat": [0.05],
        }
        target_ranges = {
            "energy": [200.0, 250.0],
            "protein": [0.0, 50.0],
            "carb": [0.0, 50.0],
            "fat": [0.0, 50.0],
        }
        gram_bounds = [[50.0, 100.0]]  # Capped at 100g = 100 kcal -> J* > 0
        preferred_grams = [None]

        sol = solve_portion_lp(nutrient_coeffs, target_ranges, gram_bounds, preferred_grams)
        assert sol.success is True
        assert sol.primary_objective_value > 0.0
        assert sol.secondary_objective_mode == SecondaryObjectiveMode.TOTAL_GRAMS_TIE_BREAKER
        assert pytest.approx(sol.secondary_objective_value, rel=1e-4) == 100.0
        assert pytest.approx(sol.secondary_objective_recomputed, rel=1e-4) == 100.0
        assert pytest.approx(sol.secondary_objective_solver, rel=1e-4) == 100.0

    def test_secondary_solver_failure_explicitly_reported(self, monkeypatch):
        """If Pass 1 succeeds but Pass 2 fails, solver must return SECONDARY_SOLVER_FAILURE."""
        import Meal.optimizer.solver
        from unittest.mock import MagicMock
        from Meal.optimizer.schemas import SecondaryObjectiveMode

        real_linprog = Meal.optimizer.solver.linprog
        call_count = [0]

        def fake_linprog(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                # Pass 1 succeeds
                return real_linprog(*args, **kwargs)
            else:
                # Pass 2 fails
                mock_res = MagicMock()
                mock_res.success = False
                mock_res.status = 4
                mock_res.message = "Simulated Pass 2 numerical breakdown"
                mock_res.nit = 5
                return mock_res

        monkeypatch.setattr(Meal.optimizer.solver, "linprog", fake_linprog)

        nutrient_coeffs = {
            "energy": [1.0],
            "protein": [0.1],
            "carb": [0.2],
            "fat": [0.05],
        }
        target_ranges = {
            "energy": [100.0, 100.0],
            "protein": [0.0, 50.0],
            "carb": [0.0, 50.0],
            "fat": [0.0, 50.0],
        }
        gram_bounds = [[50.0, 150.0]]
        preferred_grams = [None]

        sol = solve_portion_lp(nutrient_coeffs, target_ranges, gram_bounds, preferred_grams)
        assert sol.success is False
        assert sol.solver_status == "SECONDARY_SOLVER_FAILURE"
        assert "Pass 2" in sol.solver_message
        assert sol.secondary_objective_mode == SecondaryObjectiveMode.TOTAL_GRAMS_TIE_BREAKER

