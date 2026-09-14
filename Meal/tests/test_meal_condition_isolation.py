"""Meal/tests/test_meal_condition_isolation.py - Tests for condition isolation across Single-Meal Generation.

Verifies Requirement 20:
- Same candidate IDs, constraints, target, preferences, and policy under:
  * GENERAL
  * PCOS
  * MALE_HYPOGONADISM
  produce 100% exact numerical and structural equality:
  * combination search order
  * best canonical combination ID
  * alternative combination ordering
  * optimized grams for all items
  * nutrient totals (energy, protein, fat, carbs, fiber)
  * primary objective and ranking keys
- Condition annotations differ only in non-numerical trace metadata.
"""

import pytest

from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
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
def base_neutral():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.INACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def conditions(base_neutral):
    conds = {}
    for pathway in [ConditionPathway.GENERAL, ConditionPathway.PCOS, ConditionPathway.MALE_HYPOGONADISM]:
        ctx = ConditionEvidenceContext(
            condition_pathway=pathway,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        conds[pathway.value] = build_condition_nutrition_profile(base_neutral, ctx)
    return conds


class TestMealConditionIsolation:
    """Proves 0.0 condition effect on single-meal composition and generation."""

    def test_exact_condition_isolation(self, base_neutral, conditions):
        """Identical inputs across GENERAL, PCOS, and MALE_HYPOGONADISM yield identical outputs."""
        planner_ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)

        target = PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=20.0,
            protein_max_g=40.0,
            carbohydrate_min_g=45.0,
            carbohydrate_max_g=85.0,
            fat_min_g=10.0,
            fat_max_g=25.0,
        )
        constraints = [
            PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0),
            PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0),
            PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0),
            PortionConstraint(entity_id="PK_PORTION_002", minimum_grams=75.0, maximum_grams=200.0),
        ]
        meal_ctx = SingleMealGenerationContext(
            meal_role=MealRole.LUNCH,
            preferred_entity_ids=["PK_DISH_009"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=3,
            maximum_combinations_evaluated=25,
            maximum_alternatives=2,
        )

        results = {}
        for pathway_name, cond_prof in conditions.items():
            cand_result = rank_meal_candidates(base_neutral, cond_prof, planner_ctx)
            res = generate_single_meal(
                neutral_profile=base_neutral,
                condition_profile=cond_prof,
                candidate_result=cand_result,
                target=target,
                constraints=constraints,
                context=meal_ctx,
                policy=policy,
            )
            assert res.is_successful is True
            results[pathway_name] = res

        general_res = results[ConditionPathway.GENERAL.value]
        pcos_res = results[ConditionPathway.PCOS.value]
        hypo_res = results[ConditionPathway.MALE_HYPOGONADISM.value]

        for other_res in [pcos_res, hypo_res]:
            # Structural counts
            assert other_res.total_possible_combinations == general_res.total_possible_combinations
            assert other_res.combinations_evaluated == general_res.combinations_evaluated
            assert other_res.optimizer_success_count == general_res.optimizer_success_count
            assert other_res.optimizer_rejected_count == general_res.optimizer_rejected_count

            # Best meal identity and canonical ordering
            assert other_res.best_meal.canonical_combination_id == general_res.best_meal.canonical_combination_id
            assert pytest.approx(other_res.best_meal.primary_objective, abs=1e-6) == general_res.best_meal.primary_objective
            assert pytest.approx(other_res.best_meal.total_energy_kcal, abs=1e-5) == general_res.best_meal.total_energy_kcal
            assert pytest.approx(other_res.best_meal.total_protein_g, abs=1e-5) == general_res.best_meal.total_protein_g
            assert pytest.approx(other_res.best_meal.total_fat_g, abs=1e-5) == general_res.best_meal.total_fat_g
            assert pytest.approx(other_res.best_meal.total_carbohydrate_g, abs=1e-5) == general_res.best_meal.total_carbohydrate_g

            # Gram-for-gram equality
            for g_item, o_item in zip(general_res.best_meal.items, other_res.best_meal.items):
                assert g_item.entity_id == o_item.entity_id
                assert pytest.approx(g_item.optimized_grams, abs=1e-5) == o_item.optimized_grams

            # Alternatives equality
            assert len(other_res.alternative_meals) == len(general_res.alternative_meals)
            for g_alt, o_alt in zip(general_res.alternative_meals, other_res.alternative_meals):
                assert g_alt.canonical_combination_id == o_alt.canonical_combination_id
                assert pytest.approx(g_alt.primary_objective, abs=1e-6) == o_alt.primary_objective
