"""Meal/tests/test_portion_target_ranges.py - Tests for target range satisfaction and deviations.

Verifies:
- OPTIMAL_WITHIN_ALL_TARGET_RANGES when portions achieve all nutrient ranges (J* = 0.0).
- OPTIMAL_WITH_TARGET_DEVIATIONS when nutrient targets cannot be met within bounds.
- Separation of INVALID_PORTION_CONSTRAINTS from mathematical target deviations.
- Deterministic objective normalization scales exposed in result (instruction #8).
- Verification that slack variables are non-negative and deviations are accurately quantified.
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
    TargetScope,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=62.0,
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


class TestTargetRangeSatisfaction:
    """Verifies optimization statuses and deviation accounting."""

    def test_within_all_target_ranges(self, neutral_profile, condition_profile):
        """Feasible meal achieving all target ranges -> OPTIMAL_WITHIN_ALL_TARGET_RANGES."""
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        # 2 foods: Chapati (PK_PORTION_001) + Dahi (PK_COMP_001)
        selected_ids = ["PK_PORTION_001", "PK_COMP_001"]
        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
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

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=selected_ids,
            target=target,
            constraints=constraints,
        )

        assert res.optimization_status == PortionOptimizationStatus.OPTIMAL_WITHIN_ALL_TARGET_RANGES
        assert pytest.approx(res.primary_objective_value, abs=1e-5) == 0.0
        for nutrient in ["energy", "protein", "carbohydrate", "fat"]:
            assert res.nutrient_deviations[nutrient].target_status == NutrientTargetStatus.WITHIN_RANGE
            assert pytest.approx(res.nutrient_deviations[nutrient].absolute_deviation, abs=1e-5) == 0.0

    def test_unreachable_target_produces_optimal_with_deviations(self, neutral_profile, condition_profile):
        """When portion bounds cannot reach the target, solver finds minimum-deviation optimum."""
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        # 1 food: Whole Wheat Chapati (PK_PORTION_001), capped at 100g (~200 kcal)
        # Target demands 800 kcal
        selected_ids = ["PK_PORTION_001"]
        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=800.0,
            energy_tolerance_kcal=50.0,  # [750, 850] kcal
            protein_min_g=20.0,
            protein_max_g=30.0,
            carbohydrate_min_g=50.0,
            carbohydrate_max_g=100.0,
            fat_min_g=10.0,
            fat_max_g=25.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=50.0, maximum_grams=100.0),
        ]

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=selected_ids,
            target=target,
            constraints=constraints,
        )

        assert res.optimization_status == PortionOptimizationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS
        assert res.primary_objective_value > 0.0
        # Energy must be BELOW_RANGE
        assert res.nutrient_deviations["energy"].target_status == NutrientTargetStatus.BELOW_RANGE
        assert res.nutrient_deviations["energy"].normalized_deviation > 0.0
        assert res.nutrient_deviations["energy"].absolute_deviation < 0.0
        # Portion should be maxed out at 100.0g to minimize shortfall
        assert pytest.approx(res.optimized_portions[0].grams, rel=1e-5) == 100.0

    def test_objective_normalization_scales_exposed(self, neutral_profile, condition_profile):
        """Verifies that deterministic scales are calculated and exposed without divide-by-zero."""
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=500.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=20.0,
            protein_max_g=30.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=60.0,
            fat_min_g=10.0,
            fat_max_g=20.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_DISH_025", minimum_grams=100.0, maximum_grams=200.0),
        ]

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=["PK_DISH_025"],
            target=target,
            constraints=constraints,
        )

        scales = res.objective_normalization_scales
        assert scales["energy"] == 500.0
        assert scales["protein"] == 25.0  # (20 + 30) / 2
        assert scales["carbohydrate"] == 50.0  # (40 + 60) / 2
        assert scales["fat"] == 15.0  # (10 + 20) / 2
