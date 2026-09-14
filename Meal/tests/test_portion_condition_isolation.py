"""Meal/tests/test_portion_condition_isolation.py - Tests proving 0.0 condition effect on numerical optimization.

Verifies instruction #16:
- Optimization across GENERAL_HEALTH, PCOS, and MALE_HYPOGONADISM produces exact numerical equality:
  * optimized grams for all foods
  * energy, protein, carbohydrate, fat totals
  * primary and secondary objective values
  * target statuses (WITHIN_RANGE, BELOW_RANGE, ABOVE_RANGE)
  * nutrient deviations
- Condition profiles are passed for clinical traceability only and have exactly ZERO numerical influence.
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
        age=26,
        sex_for_reference_equation="female",
        height_cm=163.0,
        weight_kg=58.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def general_condition_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.GENERAL,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


@pytest.fixture
def pcos_condition_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.PCOS,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


@pytest.fixture
def hypogonadism_condition_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


class TestPortionConditionIsolation:
    """Proves that condition profile has 0.0 numerical effect on portion optimization."""

    def test_numerical_equality_across_all_condition_pathways(
        self,
        neutral_profile,
        general_condition_profile,
        pcos_condition_profile,
        hypogonadism_condition_profile,
    ):
        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST",
            target_energy_kcal=450.0,
            energy_tolerance_kcal=40.0,
            protein_min_g=15.0,
            protein_max_g=30.0,
            carbohydrate_min_g=45.0,
            carbohydrate_max_g=80.0,
            fat_min_g=8.0,
            fat_max_g=22.0,
        )

        selected_ids = ["PK_PORTION_001", "PK_COMP_001"]
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0),
        ]

        # Use common BREAKFAST candidate results for each condition profile
        ctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        cand_gen = rank_meal_candidates(neutral_profile, general_condition_profile, ctx)
        cand_pcos = rank_meal_candidates(neutral_profile, pcos_condition_profile, ctx)
        cand_hypo = rank_meal_candidates(neutral_profile, hypogonadism_condition_profile, ctx)

        res_gen = optimize_portions(neutral_profile, general_condition_profile, cand_gen, selected_ids, target, constraints)
        res_pcos = optimize_portions(neutral_profile, pcos_condition_profile, cand_pcos, selected_ids, target, constraints)
        res_hypo = optimize_portions(neutral_profile, hypogonadism_condition_profile, cand_hypo, selected_ids, target, constraints)

        results = [res_gen, res_pcos, res_hypo]

        # 1. Exact equality of optimized portions (grams)
        for i in range(len(selected_ids)):
            assert res_gen.optimized_portions[i].grams == res_pcos.optimized_portions[i].grams
            assert res_gen.optimized_portions[i].grams == res_hypo.optimized_portions[i].grams

        # 2. Exact equality of macro totals
        for nutrient in ["energy", "protein", "carbohydrate", "fat"]:
            val_gen = res_gen.meal_nutrients[nutrient].value
            val_pcos = res_pcos.meal_nutrients[nutrient].value
            val_hypo = res_hypo.meal_nutrients[nutrient].value
            assert pytest.approx(val_gen, abs=1e-6) == val_pcos
            assert pytest.approx(val_gen, abs=1e-6) == val_hypo

        # 3. Exact equality of objective values
        assert pytest.approx(res_gen.primary_objective_value, abs=1e-6) == res_pcos.primary_objective_value
        assert pytest.approx(res_gen.primary_objective_value, abs=1e-6) == res_hypo.primary_objective_value
        assert pytest.approx(res_gen.secondary_objective_value, abs=1e-6) == res_pcos.secondary_objective_value
        assert pytest.approx(res_gen.secondary_objective_value, abs=1e-6) == res_hypo.secondary_objective_value

        # 4. Exact equality of target statuses
        for nutrient in ["energy", "protein", "carbohydrate", "fat"]:
            assert res_gen.nutrient_deviations[nutrient].target_status == res_pcos.nutrient_deviations[nutrient].target_status
            assert res_gen.nutrient_deviations[nutrient].target_status == res_hypo.nutrient_deviations[nutrient].target_status
            assert pytest.approx(res_gen.nutrient_deviations[nutrient].absolute_deviation, abs=1e-6) == res_pcos.nutrient_deviations[nutrient].absolute_deviation
            assert pytest.approx(res_gen.nutrient_deviations[nutrient].absolute_deviation, abs=1e-6) == res_hypo.nutrient_deviations[nutrient].absolute_deviation
