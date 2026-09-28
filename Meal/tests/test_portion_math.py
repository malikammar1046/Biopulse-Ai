"""Meal/tests/test_portion_math.py - Unit tests for mathematical scaling and portion equivalence.

Verifies:
- Linear nutrient scaling at 100g (identity), 50g (half), 150g (1.5x) with zero intermediate rounding.
- Preservation of None fiber (unknown fiber is NEVER converted to zero).
- Source-backed standard portion equivalence (PK_PORTION_001 = 80g, PK_PORTION_002 = 75g).
- Separation of full-precision unrounded exact equivalence from display rounding.
- Accurate target deviation and status computation (WITHIN_RANGE, BELOW_RANGE, ABOVE_RANGE).
- Fiber coverage classification (COMPLETE, PARTIAL, UNAVAILABLE).
"""

import pytest

from Meal.optimizer.nutrients import (
    aggregate_fiber,
    compute_deviation,
    compute_standard_portion_equivalence,
    scale_nutrients,
)
from Meal.optimizer.schemas import FiberCoverageStatus, NutrientTargetStatus
from Meal.planner.catalog import load_master_planner_catalog


@pytest.fixture
def catalog():
    return load_master_planner_catalog()


class TestNutrientScaling:
    """Verifies linear scaling of nutrient values with full float precision."""

    def test_exact_linear_scaling_100g(self, catalog):
        """100g scaling should return identical nutrient values."""
        entity = catalog["PK_PORTION_001"]  # Whole Wheat Chapati
        e_kcal, p_g, f_g, c_g, fib_g, fib_stat = scale_nutrients(entity, 100.0)

        assert e_kcal == entity.normalized_energy_kcal_per_100g
        assert p_g == entity.normalized_protein_g_per_100g
        assert c_g == entity.normalized_carb_g_per_100g
        assert f_g == entity.normalized_fat_g_per_100g

    def test_exact_linear_scaling_half_and_fractional(self, catalog):
        """50g and 150g scaling should produce exact unrounded fractions."""
        entity = catalog["PK_PORTION_001"]
        e_50, p_50, f_50, c_50, fib_50, _ = scale_nutrients(entity, 50.0)
        assert pytest.approx(e_50, rel=1e-6) == entity.normalized_energy_kcal_per_100g * 0.5
        assert pytest.approx(p_50, rel=1e-6) == entity.normalized_protein_g_per_100g * 0.5
        assert pytest.approx(c_50, rel=1e-6) == entity.normalized_carb_g_per_100g * 0.5
        assert pytest.approx(f_50, rel=1e-6) == entity.normalized_fat_g_per_100g * 0.5

        e_150, p_150, f_150, c_150, fib_150, _ = scale_nutrients(entity, 150.0)
        assert pytest.approx(e_150, rel=1e-6) == entity.normalized_energy_kcal_per_100g * 1.5
        assert pytest.approx(p_150, rel=1e-6) == entity.normalized_protein_g_per_100g * 1.5

    def test_fiber_unknown_preserved_never_converted_to_zero(self, catalog):
        """Unknown fiber (None) must remain None and never be coerced to 0.0."""
        # Find catalog entity where fiber is None
        no_fiber_ent = next((ent for ent in catalog.values() if ent.normalized_fiber_g_per_100g is None), None)
        assert no_fiber_ent is not None, "Catalog should have entities with None fiber"

        e_kcal, p_g, f_g, c_g, fib_g, fib_stat = scale_nutrients(no_fiber_ent, 120.0)
        assert fib_g is None
        assert fib_stat == "UNAVAILABLE"


class TestStandardPortionEquivalence:
    """Verifies source-backed standard portion derivations."""

    def test_chapati_standard_portion(self, catalog):
        """PK_PORTION_001: 80g standard portion (1 medium chapati)."""
        entity = catalog["PK_PORTION_001"]
        # 80g = exactly 1.0 portion
        std_g, exact, display, label = compute_standard_portion_equivalence(entity, 80.0)
        assert std_g == 80.0
        assert exact == 1.0
        assert display == 1.0

        # 120g = exactly 1.5 portions
        std_g, exact, display, label = compute_standard_portion_equivalence(entity, 120.0)
        assert exact == 1.5
        assert display == 1.5

        # 75g = 75 / 80 = 0.9375, display = 0.94
        std_g, exact, display, label = compute_standard_portion_equivalence(entity, 75.0)
        assert exact == 0.9375
        assert display == 0.94

    def test_boiled_rice_standard_portion(self, catalog):
        """PK_PORTION_002: 75g standard portion."""
        entity = catalog["PK_PORTION_002"]
        # 100g = 100 / 75 = 1.3333333333333333, display = 1.33
        std_g, exact, display, label = compute_standard_portion_equivalence(entity, 100.0)
        assert std_g == 75.0
        assert pytest.approx(exact, rel=1e-6) == 100.0 / 75.0
        assert display == 1.33

    def test_entity_without_standard_portion(self, catalog):
        """Entities without standard portion metadata return None."""
        entity = catalog["PK_COMP_001"]  # Curd / Dahi
        std_g, exact, display, label = compute_standard_portion_equivalence(entity, 100.0)
        assert std_g is None
        assert label is None
        assert exact is None
        assert display is None


class TestNutrientDeviation:
    """Verifies target deviation calculations."""

    def test_within_range(self):
        dev = compute_deviation(
            nutrient_name="energy",
            actual_value=500.0,
            target_min=450.0,
            target_max=550.0,
            normalization_scale=500.0,
        )
        assert dev.target_status == NutrientTargetStatus.WITHIN_RANGE
        assert dev.absolute_deviation == 0.0
        assert dev.normalized_deviation == 0.0

    def test_below_range(self):
        dev = compute_deviation(
            nutrient_name="protein",
            actual_value=20.0,
            target_min=25.0,
            target_max=35.0,
            normalization_scale=30.0,
        )
        assert dev.target_status == NutrientTargetStatus.BELOW_RANGE
        assert dev.absolute_deviation < 0.0
        assert pytest.approx(dev.normalized_deviation, rel=1e-5) == 5.0 / 30.0

    def test_above_range(self):
        dev = compute_deviation(
            nutrient_name="fat",
            actual_value=25.0,
            target_min=10.0,
            target_max=20.0,
            normalization_scale=15.0,
        )
        assert dev.target_status == NutrientTargetStatus.ABOVE_RANGE
        assert dev.absolute_deviation > 0.0
        assert pytest.approx(dev.normalized_deviation, rel=1e-5) == 5.0 / 15.0


class TestFiberAggregation:
    """Verifies diagnostic fiber coverage aggregation."""

    def test_complete_coverage(self):
        portion_fibers = [("PK_PORTION_001", 1.28), ("PK_PORTION_002", 0.375)]
        fiber_res = aggregate_fiber(portion_fibers, target_reference_g=5.0)

        assert fiber_res.coverage_status == FiberCoverageStatus.COMPLETE
        assert fiber_res.known_fiber_contribution_g is not None
        assert len(fiber_res.missing_fiber_entity_ids) == 0

    def test_partial_coverage(self):
        portion_fibers = [("PK_PORTION_001", 1.28), ("PK_COMP_001", None)]
        fiber_res = aggregate_fiber(portion_fibers, target_reference_g=5.0)

        assert fiber_res.coverage_status == FiberCoverageStatus.PARTIAL
        assert "PK_COMP_001" in fiber_res.missing_fiber_entity_ids

    def test_unavailable_coverage(self):
        portion_fibers = [("E1", None), ("E2", None)]
        fiber_res = aggregate_fiber(portion_fibers, target_reference_g=5.0)

        assert fiber_res.coverage_status == FiberCoverageStatus.UNAVAILABLE
        assert fiber_res.known_fiber_contribution_g is None
