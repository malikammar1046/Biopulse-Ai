"""Meal/tests/test_meal_optimizer_integration.py - Tests for Phase 6B Portion Optimizer integration.

Verifies:
- Requirement 12: Preservation of exact Phase 6B solver diagnostics.
- Requirement 13: Optimizer-rejected combinations tracked and never returned as meals.
"""

import pytest

from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
    MealFeasibilityClass,
    SingleMealGenerationContext,
    SingleMealGenerationStatus,
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
    PortionConstraint,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def base_context():
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
    planner_ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
    cand_result = rank_meal_candidates(neutral, condition, planner_ctx)
    return neutral, condition, cand_result


class TestMealOptimizerIntegration:
    """Tests portion solver invocation, rejection accounting, and diagnostics preservation."""

    def test_optimizer_rejection_tracking(self, base_context):
        """Requirement 13: Rejected combinations are tracked and never enter meal plans."""
        neutral, condition, cand_result = base_context

        # Target that cannot be satisfied by an impossible tight bound
        target = PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=10.0,
            protein_min_g=80.0,  # Impossible protein for standard breakfast portions
            protein_max_g=100.0,
            carbohydrate_min_g=10.0,
            carbohydrate_max_g=30.0,
            fat_min_g=5.0,
            fat_max_g=15.0,
        )
        # Tight constraints preventing optimizer from reaching target
        constraints = [
            PortionConstraint(
                entity_id="PK_PORTION_001",
                minimum_grams=40.0,
                maximum_grams=50.0,
            ),
            PortionConstraint(
                entity_id="PK_COMP_001",  # Curd / Dahi
                minimum_grams=40.0,
                maximum_grams=50.0,
            ),
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

        # In this target, optimizer will either find solutions with target deviations or reject
        assert result.combinations_evaluated > 0
        assert result.combinations_generated > 0
        # If any combination was rejected, verify it never enters returned meals
        if result.optimizer_rejected_count > 0:
            assert len(result.optimizer_rejections) == result.optimizer_rejected_count
            for rej_cid in result.optimizer_rejections:
                if result.best_meal:
                    assert result.best_meal.canonical_combination_id != rej_cid
                for alt in result.alternative_meals:
                    assert alt.canonical_combination_id != rej_cid

    def test_phase6b_diagnostics_preservation(self, base_context):
        """Requirement 12: Preserves Phase 6B objective values, modes, and target deviations."""
        neutral, condition, cand_result = base_context

        target = PortionOptimizationTarget(
            target_energy_kcal=250.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=6.0,
            protein_max_g=20.0,
            carbohydrate_min_g=20.0,
            carbohydrate_max_g=50.0,
            fat_min_g=2.0,
            fat_max_g=15.0,
        )
        constraints = [
            PortionConstraint(
                entity_id="PK_PORTION_001",
                minimum_grams=40.0,
                maximum_grams=120.0,
                preferred_grams=80.0,
            ),
            PortionConstraint(
                entity_id="PK_COMP_001",
                minimum_grams=50.0,
                maximum_grams=150.0,
                preferred_grams=100.0,
            ),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001", "PK_COMP_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=5,
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
        plan = result.best_meal
        assert plan is not None

        # Verify exact Phase 6B diagnostics exist on the meal plan
        assert hasattr(plan, "primary_objective")
        assert hasattr(plan, "secondary_objective")
        assert hasattr(plan, "secondary_objective_mode")
        assert hasattr(plan, "target_deviations")
        assert hasattr(plan, "optimization_status")

        # Verify deviation map contains core nutrients
        assert "energy" in plan.target_deviations
        assert "protein" in plan.target_deviations
        assert "carbohydrate" in plan.target_deviations
        assert "fat" in plan.target_deviations

        # Verify secondary objective is preserved and non-negative
        assert plan.secondary_objective_mode == "PREFERENCE_DEVIATION"
        assert plan.secondary_objective >= 0.0
