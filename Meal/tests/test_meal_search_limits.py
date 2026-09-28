"""Meal/tests/test_meal_search_limits.py - Tests for search bounds and engineering complexity documentation.

Verifies:
- Requirement 17: Search defaults are strictly engineering limits, not dietary recommendations.
- Single-item to 4-item meal search behavior.
- Minimal combination limits (maximum_combinations_evaluated = 1).
"""

import pytest

from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
    SelectionScope,
    SingleMealGenerationContext,
)
from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.optimizer.schemas import PortionConstraint, PortionOptimizationTarget
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


class TestMealSearchLimits:
    """Tests engineering boundaries and documentation invariants."""

    def test_engineering_complexity_documentation(self, base_context):
        """Requirement 17: Trace explicitly documents complexity bounds as engineering limits only."""
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
            PortionConstraint("PK_PORTION_001", 40.0, 120.0),
            PortionConstraint("PK_COMP_001", 50.0, 150.0),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_PORTION_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=1,
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

        trace_text = " ".join(result.trace)
        assert "engineering limits" in trace_text
        assert "not dietary or clinical recommendations" in trace_text

    def test_minimal_combinations_evaluated_limit(self, base_context):
        """Evaluates exactly 1 combination when maximum_combinations_evaluated = 1."""
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
            PortionConstraint("PK_PORTION_001", 40.0, 120.0),
            PortionConstraint("PK_COMP_001", 50.0, 150.0),
            PortionConstraint("PK_COMP_010", 20.0, 100.0),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=1,
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

        assert result.combinations_evaluated == 1
        assert result.total_possible_combinations == 3
        assert result.search_truncated is True
        assert result.selection_scope == SelectionScope.TRUNCATED_SEARCH
        assert any("BETTER_UNEVALUATED_COMBINATION_MAY_EXIST" in w for w in result.warnings)
