"""Meal/tests/test_meal_determinism.py - Determinism under input shuffling and recipe coverage tests.

Verifies:
- Requirement 9: Shuffled candidate inputs produce 100% identical combination generation,
  search ordering under truncation, and best/alternative meal selections.
- Requirement 11: Recipe availability coverage (FULL, PARTIAL, NONE) distinguishing
  source-backed recipes, direct components, and missing formulations without fabrication.
"""

import random
import pytest

from Meal.composition.combinations import generate_and_order_combinations
from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.ranking import (
    classify_item_recipe_status,
    compute_meal_recipe_coverage,
)
from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealCombinationPolicy,
    MealItem,
    RecipeCoverageStatus,
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
from Meal.planner.catalog import PlannerCatalogEntity, load_master_planner_catalog
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateEvaluation, CandidateSelectionContext, MealRole


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
    planner_ctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
    cand_result = rank_meal_candidates(neutral, condition, planner_ctx)
    return neutral, condition, cand_result


class TestMealDeterminismAndRecipes:
    """Tests input shuffling invariance and granular recipe coverage accounting."""

    def test_shuffled_input_determinism_under_truncation(self):
        """Requirement 9: Shuffling candidate input order does not alter truncated search result."""
        candidates = [f"FOOD_{i:02d}" for i in range(20)]
        preferred = {"FOOD_05", "FOOD_12"}
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=15,
        )

        base_combs, base_total, base_trunc, base_scope, _ = generate_and_order_combinations(
            required_ids=[],
            optional_candidate_ids=candidates,
            valid_preferred_ids=preferred,
            policy=policy,
        )

        # Run with 10 different random seeds/permutations
        rng = random.Random(42)
        for _ in range(10):
            shuffled_cand = list(candidates)
            rng.shuffle(shuffled_cand)

            combs, total, trunc, scope, _ = generate_and_order_combinations(
                required_ids=[],
                optional_candidate_ids=shuffled_cand,
                valid_preferred_ids=preferred,
                policy=policy,
            )

            assert total == base_total
            assert trunc == base_trunc
            assert scope == base_scope
            assert combs == base_combs

    def test_end_to_end_determinism_under_constraint_shuffling(self, base_context):
        """Full orchestrator produces identical best/alternative meals when constraints list is shuffled."""
        neutral, condition, cand_result = base_context

        target = PortionOptimizationTarget(
            target_energy_kcal=500.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=18.0,
            protein_max_g=40.0,
            carbohydrate_min_g=40.0,
            carbohydrate_max_g=85.0,
            fat_min_g=8.0,
            fat_max_g=25.0,
        )
        base_constraints = [
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
            maximum_combinations_evaluated=20,
        )

        base_result = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand_result,
            target=target,
            constraints=base_constraints,
            context=meal_ctx,
            policy=policy,
        )

        rng = random.Random(1337)
        for _ in range(5):
            shuffled_c = list(base_constraints)
            rng.shuffle(shuffled_c)

            res = generate_single_meal(
                neutral_profile=neutral,
                condition_profile=condition,
                candidate_result=cand_result,
                target=target,
                constraints=shuffled_c,
                context=meal_ctx,
                policy=policy,
            )

            assert res.best_meal.canonical_combination_id == base_result.best_meal.canonical_combination_id
            assert [a.canonical_combination_id for a in res.alternative_meals] == [
                a.canonical_combination_id for a in base_result.alternative_meals
            ]

    def test_recipe_coverage_semantics(self):
        """Requirement 11: Granular recipe availability and coverage classification."""
        def make_item(rec_status: ItemRecipeStatus) -> MealItem:
            return MealItem(
                entity_id="MOCK_ID",
                display_name="Mock Food",
                optimized_grams=100.0,
                standard_portion_grams=None,
                equivalent_standard_portions_display=None,
                standard_portion_label=None,
                energy_kcal=100.0,
                protein_g=10.0,
                fat_g=2.0,
                carbohydrate_g=10.0,
                fiber_g=2.0,
                fiber_status="REPORTED",
                recipe_availability=rec_status,
                recipe_instruction_available=(rec_status == ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE),
            )

        # 1. 1 source recipe + 1 direct component -> FULL
        items_full_mixed = [
            make_item(ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE),
            make_item(ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT),
        ]
        assert compute_meal_recipe_coverage(items_full_mixed) == RecipeCoverageStatus.FULL

        # 2. Only direct components -> FULL
        items_direct_only = [
            make_item(ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT),
            make_item(ItemRecipeStatus.NO_RECIPE_REQUIRED_DIRECT_COMPONENT),
        ]
        assert compute_meal_recipe_coverage(items_direct_only) == RecipeCoverageStatus.FULL

        # 3. 1 source recipe + 1 missing recipe dish -> PARTIAL
        items_partial = [
            make_item(ItemRecipeStatus.SOURCE_RECIPE_AVAILABLE),
            make_item(ItemRecipeStatus.NO_SOURCE_RECIPE_AVAILABLE),
        ]
        assert compute_meal_recipe_coverage(items_partial) == RecipeCoverageStatus.PARTIAL

        # 4. Only missing recipe dishes -> NONE
        items_none = [
            make_item(ItemRecipeStatus.NO_SOURCE_RECIPE_AVAILABLE),
            make_item(ItemRecipeStatus.NO_SOURCE_RECIPE_AVAILABLE),
        ]
        assert compute_meal_recipe_coverage(items_none) == RecipeCoverageStatus.NONE
