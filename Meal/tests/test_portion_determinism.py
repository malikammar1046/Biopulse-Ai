"""Meal/tests/test_portion_determinism.py - Tests for runtime determinism and input ordering invariance.

Verifies:
- Ascending sort of entity IDs before matrix construction ensures that input order does not affect optimization.
- Deterministic for identical inputs within the fixed tested SciPy/HiGHS implementation and numerical tolerance.
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
    PortionConstraint,
    PortionOptimizationTarget,
    TargetScope,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=29,
        sex_for_reference_equation="female",
        height_cm=160.0,
        weight_kg=60.0,
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


class TestPortionDeterminism:
    """Verifies bit-for-bit repeatability and permutation invariance."""

    def test_repeated_runs_identical(self, neutral_profile, condition_profile):
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        selected_ids = ["PK_PORTION_001", "PK_DISH_025"]
        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=450.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=15.0,
            protein_max_g=25.0,
            carbohydrate_min_g=50.0,
            carbohydrate_max_g=90.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_DISH_025", minimum_grams=100.0, maximum_grams=250.0),
        ]

        runs = [
            optimize_portions(neutral_profile, condition_profile, cand_res, selected_ids, target, constraints)
            for _ in range(10)
        ]

        first = runs[0]
        for subsequent in runs[1:]:
            for i in range(len(selected_ids)):
                assert first.optimized_portions[i].grams == subsequent.optimized_portions[i].grams
                assert first.optimized_portions[i].equivalent_standard_portions_exact == subsequent.optimized_portions[i].equivalent_standard_portions_exact
            assert first.primary_objective_value == subsequent.primary_objective_value
            assert first.secondary_objective_value == subsequent.secondary_objective_value

    def test_shuffled_selected_entity_ids_invariance(self, neutral_profile, condition_profile):
        """Passing [A, B] vs [B, A] must yield identical portions for each respective entity."""
        ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand_res = rank_meal_candidates(neutral_profile, condition_profile, ctx)

        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=450.0,
            energy_tolerance_kcal=50.0,
            protein_min_g=15.0,
            protein_max_g=25.0,
            carbohydrate_min_g=50.0,
            carbohydrate_max_g=90.0,
            fat_min_g=5.0,
            fat_max_g=20.0,
        )

        c1 = PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0)
        c2 = PortionConstraint(entity_id="PK_DISH_025", minimum_grams=100.0, maximum_grams=250.0)

        # Order 1: PK_PORTION_001, PK_DISH_025
        res1 = optimize_portions(neutral_profile, condition_profile, cand_res, ["PK_PORTION_001", "PK_DISH_025"], target, [c1, c2])

        # Order 2: PK_DISH_025, PK_PORTION_001
        res2 = optimize_portions(neutral_profile, condition_profile, cand_res, ["PK_DISH_025", "PK_PORTION_001"], target, [c2, c1])

        # Both results are sorted ascending by entity_id: PK_DISH_025, PK_PORTION_001
        assert res1.optimized_portions[0].entity_id == res2.optimized_portions[0].entity_id
        assert res1.optimized_portions[0].grams == res2.optimized_portions[0].grams
        assert res1.optimized_portions[1].entity_id == res2.optimized_portions[1].entity_id
        assert res1.optimized_portions[1].grams == res2.optimized_portions[1].grams
