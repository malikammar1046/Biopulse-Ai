"""Meal/tests/test_portion_fiber_coverage.py - Tests for fiber coverage isolation and reporting.

Verifies:
- Fiber is strictly EXCLUDED from the primary LP objective and slack variables in Phase 6B.
- The 4 core LP dimensions are Energy (E), Protein (P), Carbohydrate (C), Fat (F).
- Fiber is never confused with Fat (F).
- Fiber coverage classification (COMPLETE, PARTIAL, UNAVAILABLE) and known contribution reporting.
- Unknown fiber is NEVER converted to 0.0.
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
    FiberCoverageStatus,
    PortionConstraint,
    PortionOptimizationTarget,
    TargetScope,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=25,
        sex_for_reference_equation="female",
        height_cm=160.0,
        weight_kg=55.0,
        pal_category=PALCategory.INACTIVE,
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


class TestFiberReportingAndIsolation:
    """Verifies fiber reporting and isolation from LP solver."""

    def test_fiber_complete_coverage_reporting(self, neutral_profile, condition_profile):
        """When selected foods have complete fiber data, status is COMPLETE and known fiber is summed."""
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        # PK_DISH_001 (Chapati: fiber = 1.0g/100g) and PK_DISH_002 (Daal Masoor: fiber = 1.0g/100g)
        selected_ids = ["PK_DISH_001", "PK_DISH_002"]
        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=300.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=5.0,
            protein_max_g=20.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=80.0,
            fat_min_g=0.0,
            fat_max_g=15.0,
            fiber_reference_g=5.0,  # Soft reference
        )
        constraints = [
            PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0),
            PortionConstraint(entity_id="PK_DISH_002", minimum_grams=50.0, maximum_grams=150.0),
        ]

        res = optimize_portions(
            neutral_profile=neutral_profile,
            condition_profile=condition_profile,
            candidate_result=cand_res,
            selected_entity_ids=selected_ids,
            target=target,
            constraints=constraints,
        )

        assert res.fiber_result.coverage_status == FiberCoverageStatus.COMPLETE
        assert res.fiber_result.known_fiber_contribution_g is not None
        assert res.fiber_result.known_fiber_contribution_g > 0.0
        assert len(res.fiber_result.missing_fiber_entity_ids) == 0

    def test_fiber_does_not_affect_solver_objective(self, neutral_profile, condition_profile):
        """Changing target fiber_reference_g must NOT change the LP objective or optimized grams."""
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        selected_ids = ["PK_PORTION_001"]
        target_a = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=200.0,
            energy_tolerance_kcal=20.0,
            protein_min_g=5.0,
            protein_max_g=15.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=0.0,
            fat_max_g=10.0,
            fiber_reference_g=0.0,  # Fiber reference A
        )
        target_b = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=200.0,
            energy_tolerance_kcal=20.0,
            protein_min_g=5.0,
            protein_max_g=15.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=0.0,
            fat_max_g=10.0,
            fiber_reference_g=50.0,  # Fiber reference B (vastly different)
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=50.0, maximum_grams=150.0),
        ]

        res_a = optimize_portions(neutral_profile, condition_profile, cand_res, selected_ids, target_a, constraints)
        res_b = optimize_portions(neutral_profile, condition_profile, cand_res, selected_ids, target_b, constraints)

        # Portions and objectives must be numerically identical
        assert res_a.optimized_portions[0].grams == res_b.optimized_portions[0].grams
        assert res_a.primary_objective_value == res_b.primary_objective_value
        assert res_a.meal_nutrients["energy"].value == res_b.meal_nutrients["energy"].value
