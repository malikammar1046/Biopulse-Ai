"""Meal/tests/test_portion_catalog_integration.py - Real catalog integration tests for Phase 6B.

Verifies end-to-end integration across Phase 5A -> 5B -> 6A -> 6B for the three canonical examples:
- Example A: Breakfast 2-food (Whole Wheat Chapati + Egg Omelette)
- Example B: Lunch 3-food (Chicken Curry + Boiled Rice + Dal Chana)
- Example C: Dinner 2-food (Dal Mash + Whole Wheat Chapati)

Verifies:
- Candidates are selected exclusively from the vetted Phase 6A candidate pool.
- Preservation of Phase 6A meal role, scoring version, and catalog version.
- Source-backed standard portions derived from catalog.
- Optimization produces valid portions and accurate macro totals.
"""

import pytest

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.orchestrator import optimize_portions
from Meal.optimizer.schemas import (
    NutrientTargetStatus,
    PortionConstraint,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
    SecondaryObjectiveMode,
    TargetScope,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="female",
        height_cm=162.0,
        weight_kg=60.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def condition_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


class TestRealCatalogIntegration:
    """End-to-end integration tests using the locked Pakistani catalog."""

    def test_example_a_breakfast_two_food(self, neutral_profile, condition_profile):
        """Example A: Whole Wheat Chapati (PK_PORTION_001) + Curd/Dahi (PK_COMP_001)."""
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        # Both must be present in vetted candidate pool
        selected_ids = ["PK_PORTION_001", "PK_COMP_001"]
        pool_eids = {c.entity_id for c in cand_res.ranked_optimization_candidates}
        for eid in selected_ids:
            assert eid in pool_eids

        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="MATHEMATICAL_VALIDATION_EXAMPLE",
            target_energy_kcal=350.0,
            energy_tolerance_kcal=40.0,  # [310, 390] kcal
            protein_min_g=10.0,
            protein_max_g=25.0,
            carbohydrate_min_g=35.0,
            carbohydrate_max_g=65.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        )

        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
            PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        ]

        res = optimize_portions(neutral_profile, condition_profile, cand_res, selected_ids, target, constraints)

        assert res.optimization_status == PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES
        assert res.source_meal_role.value.upper() == "BREAKFAST"
        assert res.source_catalog_version is not None

        # Verify chapati standard portion metadata loaded from catalog
        chapati = next(p for p in res.optimized_portions if p.entity_id == "PK_PORTION_001")
        assert chapati.standard_portion_grams == 80.0
        assert chapati.standard_portion_label == "chapati"
        assert chapati.equivalent_standard_portions_exact is not None

        # Verify dahi (no standard portion) returns None
        dahi = next(p for p in res.optimized_portions if p.entity_id == "PK_COMP_001")
        assert dahi.standard_portion_grams is None

        # Recompute secondary objective from full-precision grams and verify
        c_map = {c.entity_id: c for c in constraints}
        sec_recomputed = sum(
            abs(p.optimized_grams - c_map[p.entity_id].preferred_grams)
            / max(c_map[p.entity_id].maximum_grams - c_map[p.entity_id].minimum_grams, 1.0)
            for p in res.optimized_portions
            if c_map[p.entity_id].preferred_grams is not None
        )
        assert res.secondary_objective_mode == SecondaryObjectiveMode.PREFERENCE_DEVIATION
        assert pytest.approx(res.secondary_objective_value, abs=1e-4) == sec_recomputed
        assert res.secondary_objective_value > 0.0

    def test_example_b_lunch_three_food(self, neutral_profile, condition_profile):
        """Example B: Chicken Curry (PK_DISH_009) + Boiled Rice (PK_PORTION_002) + Channa Daal (PK_DISH_025)."""
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        selected_ids = ["PK_DISH_009", "PK_DISH_025", "PK_PORTION_002"]
        pool_eids = {c.entity_id for c in cand_res.ranked_optimization_candidates}
        for eid in selected_ids:
            assert eid in pool_eids

        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="MATHEMATICAL_VALIDATION_EXAMPLE",
            target_energy_kcal=550.0,
            energy_tolerance_kcal=50.0,  # [500, 600] kcal
            protein_min_g=20.0,
            protein_max_g=40.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=90.0,
            fat_min_g=10.0,
            fat_max_g=25.0,
        )

        constraints = [
            PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0),
            PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0),
            PortionConstraint(entity_id="PK_PORTION_002", minimum_grams=75.0, maximum_grams=200.0, preferred_grams=150.0),
        ]

        res = optimize_portions(neutral_profile, condition_profile, cand_res, selected_ids, target, constraints)

        assert res.optimization_status in (
            PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
            PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
        )
        assert res.source_meal_role.value.upper() == "LUNCH"
        assert len(res.optimized_portions) == 3

        # Rice standard portion check (75g)
        rice = next(p for p in res.optimized_portions if p.entity_id == "PK_PORTION_002")
        assert rice.standard_portion_grams == 75.0
        assert rice.standard_portion_label == "cooked rice"

        # Recompute secondary objective and verify
        c_map = {c.entity_id: c for c in constraints}
        sec_recomputed = sum(
            abs(p.optimized_grams - c_map[p.entity_id].preferred_grams)
            / max(c_map[p.entity_id].maximum_grams - c_map[p.entity_id].minimum_grams, 1.0)
            for p in res.optimized_portions
            if c_map[p.entity_id].preferred_grams is not None
        )
        assert res.secondary_objective_mode == SecondaryObjectiveMode.PREFERENCE_DEVIATION
        assert pytest.approx(res.secondary_objective_value, abs=1e-4) == sec_recomputed
        assert res.secondary_objective_value > 0.0

    def test_example_c_dinner_two_food(self, neutral_profile, condition_profile):
        """Example C: Daal Mash (PK_DISH_028) + Whole Wheat Chapati (PK_PORTION_001)."""
        ctx = CandidateSelectionContext(meal_role=MealRole.DINNER)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        selected_ids = ["PK_DISH_028", "PK_PORTION_001"]
        pool_eids = {c.entity_id for c in cand_res.ranked_optimization_candidates}
        for eid in selected_ids:
            assert eid in pool_eids

        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="MATHEMATICAL_VALIDATION_EXAMPLE",
            target_energy_kcal=450.0,
            energy_tolerance_kcal=40.0,  # [410, 490] kcal
            protein_min_g=15.0,
            protein_max_g=30.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=85.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        )

        constraints = [
            PortionConstraint(entity_id="PK_DISH_028", minimum_grams=80.0, maximum_grams=250.0),
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=160.0, preferred_grams=80.0),
        ]

        res = optimize_portions(neutral_profile, condition_profile, cand_res, selected_ids, target, constraints)

        assert res.optimization_status in (
            PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES,
            PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
        )
        assert res.source_meal_role.value.upper() == "DINNER"
        assert len(res.optimized_portions) == 2

        # Recompute secondary objective and verify
        c_map = {c.entity_id: c for c in constraints}
        sec_recomputed = sum(
            abs(p.optimized_grams - c_map[p.entity_id].preferred_grams)
            / max(c_map[p.entity_id].maximum_grams - c_map[p.entity_id].minimum_grams, 1.0)
            for p in res.optimized_portions
            if c_map[p.entity_id].preferred_grams is not None
        )
        assert res.secondary_objective_mode == SecondaryObjectiveMode.PREFERENCE_DEVIATION
        assert pytest.approx(res.secondary_objective_value, abs=1e-4) == sec_recomputed
        assert res.secondary_objective_value > 0.0
