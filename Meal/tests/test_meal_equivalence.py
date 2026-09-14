"""Meal/tests/test_meal_equivalence.py - Food entity semantic duplicate & equivalence testing.

Verifies:
1. PK_DISH_001 and PK_PORTION_001 never coexist in any single meal.
2. Semantic duplicate combinations reaching Phase 6B = 0.
3. Semantic duplicate combinations counted as possible = 0.
4. Conflicting required equivalents fail explicitly with CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE.
5. Equivalent preferred IDs do not inflate preference coverage.
6. Normal different foods remain completely unaffected.
7. Candidate input shuffling produces 100% identical outputs and search ordering.
8. Synthetic equivalence group test independent of the Pakistani catalog.
"""

from dataclasses import replace
import random
from typing import Dict, List, Set

import pytest

from Meal.composition.combinations import (
    generate_and_order_combinations,
    validate_required_entities,
)
from Meal.composition.equivalence import (
    DEFAULT_ENTITY_EQUIVALENCE_GROUPS,
    find_conflicting_equivalence_entities,
    map_to_preference_concepts,
    validate_combination_equivalence,
)
from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.schemas import (
    MealCombinationPolicy,
    MealFeasibilityClass,
    PreferredEntityStatus,
    RequiredEntityFailureReason,
    SingleMealGenerationContext,
    SingleMealGenerationResult,
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
    PortionOptimizationTarget,
    TargetScope,
)
from Meal.planner.catalog import load_master_planner_catalog
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
    catalog = load_master_planner_catalog()
    return neutral, condition, catalog


@pytest.fixture
def breakfast_setup(base_context):
    neutral, condition, catalog = base_context
    pctx = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
    cand = rank_meal_candidates(neutral, condition, pctx)

    target = PortionOptimizationTarget(
        target_scope=TargetScope.CUSTOM_MEAL_TARGET,
        target_source="TEST_BREAKFAST",
        target_energy_kcal=350.0,
        energy_tolerance_kcal=50.0,
        protein_min_g=10.0,
        protein_max_g=25.0,
        carbohydrate_min_g=30.0,
        carbohydrate_max_g=65.0,
        fat_min_g=5.0,
        fat_max_g=20.0,
    )
    constraints = [
        PortionConstraint(entity_id="PK_DISH_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
        PortionConstraint(entity_id="PK_PORTION_001", minimum_grams=40.0, maximum_grams=120.0, preferred_grams=80.0),
        PortionConstraint(entity_id="PK_COMP_001", minimum_grams=50.0, maximum_grams=150.0, preferred_grams=100.0),
    ]
    return neutral, condition, cand, target, constraints


class TestMealEquivalence:
    """Rigorous tests for representation overlap and semantic equivalence handling."""

    def test_pk_dish_001_and_pk_portion_001_never_coexist(self, breakfast_setup):
        """Test 1: Proves PK_DISH_001 and PK_PORTION_001 never coexist in best or alternative meals."""
        neutral, condition, cand, target, constraints = breakfast_setup

        mctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=["PK_COMP_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=3,
            maximum_combinations_evaluated=100,
            maximum_alternatives=5,
        )

        res = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx,
            policy=policy,
        )

        assert res.status in (SingleMealGenerationStatus.FEASIBLE, SingleMealGenerationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS)
        assert res.best_meal is not None

        # Check best meal
        best_eids = {item.entity_id for item in res.best_meal.items}
        assert not ({"PK_DISH_001", "PK_PORTION_001"}.issubset(best_eids)), (
            f"Best meal contained both chapati representations: {best_eids}"
        )

        # Check all alternative meals
        for alt in res.alternative_meals:
            alt_eids = {item.entity_id for item in alt.items}
            assert not ({"PK_DISH_001", "PK_PORTION_001"}.issubset(alt_eids)), (
                f"Alternative meal contained both chapati representations: {alt_eids}"
            )

    def test_semantic_duplicate_combinations_reaching_phase6b_is_zero(self, breakfast_setup):
        """Test 2: Semantic duplicate combinations reaching Phase 6B optimizer must be strictly 0."""
        neutral, condition, cand, target, constraints = breakfast_setup

        mctx = SingleMealGenerationContext(meal_role=MealRole.BREAKFAST)
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=3,
            maximum_combinations_evaluated=100,
        )

        # Generate combinations using combinations.py
        evaluated_combs, total_pos, _, _, _ = generate_and_order_combinations(
            required_ids=[],
            optional_candidate_ids=["PK_DISH_001", "PK_PORTION_001", "PK_COMP_001"],
            valid_preferred_ids=set(),
            policy=policy,
        )

        # Count any combination with semantic duplicates reaching this evaluation list
        duplicates_in_eval = [
            comb for comb in evaluated_combs
            if {"PK_DISH_001", "PK_PORTION_001"}.issubset(set(comb))
        ]
        assert len(duplicates_in_eval) == 0, (
            f"Semantic duplicate combinations present in evaluated list: {duplicates_in_eval}"
        )

        # Run end-to-end and check optimizer_rejections
        res = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx,
            policy=policy,
        )
        # Any rejections should not be due to optimizer failures on duplicate foods
        for cid, msg in res.optimizer_rejections.items():
            assert "PK_DISH_001+PK_PORTION_001" not in cid

    def test_semantic_duplicate_combinations_counted_as_possible_is_zero(self, breakfast_setup):
        """Test 3: Semantic duplicate combinations are excluded BEFORE total_possible_combinations."""
        neutral, condition, cand, target, constraints = breakfast_setup

        # Candidates: PK_DISH_001, PK_PORTION_001, PK_COMP_001
        # Without equivalence, sizes 2 and 3 would be:
        # comb(3, 2) = 3: {D001, P001}, {D001, C001}, {P001, C001}
        # comb(3, 3) = 1: {D001, P001, C001}
        # Total = 4.
        # But {D001, P001} and {D001, P001, C001} are semantic duplicates.
        # With equivalence filtering, ONLY valid combinations are:
        # {D001, C001} and {P001, C001} -> Total = 2.

        evaluated_combs, total_pos, _, _, _ = generate_and_order_combinations(
            required_ids=[],
            optional_candidate_ids=["PK_DISH_001", "PK_PORTION_001", "PK_COMP_001"],
            valid_preferred_ids=set(),
            policy=MealCombinationPolicy(minimum_items=2, maximum_items=3),
        )

        assert total_pos == 2, f"Expected exactly 2 valid combinations, got {total_pos}"
        assert len(evaluated_combs) == 2
        assert set(evaluated_combs) == {
            ("PK_COMP_001", "PK_DISH_001"),
            ("PK_COMP_001", "PK_PORTION_001"),
        }

    def test_conflicting_required_equivalents_fail_explicitly(self, breakfast_setup):
        """Test 4: Requiring both equivalent entities returns CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE."""
        neutral, condition, cand, target, constraints = breakfast_setup

        mctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            required_entity_ids=["PK_DISH_001", "PK_PORTION_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=4,
        )

        res = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx,
            policy=policy,
        )

        assert res.status == SingleMealGenerationStatus.INVALID_REQUIRED_ENTITY
        assert res.required_entity_failure_reason == (
            RequiredEntityFailureReason.CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE
        )
        assert res.best_meal is None
        assert any("EQ_CHAPATI" in msg for msg in res.failure_details)
        assert res.total_possible_combinations == 0

    def test_equivalent_preferred_ids_do_not_inflate_preference_coverage(self, breakfast_setup):
        """Test 5: Equivalent preferred IDs satisfy single concept and do not inflate coverage."""
        neutral, condition, cand, target, constraints = breakfast_setup

        # Case A: Requesting BOTH PK_DISH_001 and PK_PORTION_001
        mctx_both = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=["PK_DISH_001", "PK_PORTION_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=3,
        )

        res_both = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx_both,
            policy=policy,
        )

        assert res_both.status == SingleMealGenerationStatus.FEASIBLE
        assert res_both.best_meal is not None
        # Must have exactly 1 concept requested (EQ_CHAPATI), matched 1 concept -> 100.0% coverage
        assert res_both.best_meal.matched_preferred_entity_count == 1
        assert res_both.best_meal.total_valid_preferred_entity_count == 1
        assert res_both.best_meal.preference_coverage == 1.0

        # Case B: Requesting PK_DISH_001 and PK_COMP_001 (2 concepts)
        mctx_two = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=["PK_DISH_001", "PK_COMP_001"],
        )
        res_two = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx_two,
            policy=policy,
        )
        # Best meal has [PK_COMP_001, PK_DISH_001] -> matches both concepts -> 100.0%
        assert res_two.best_meal.matched_preferred_entity_count == 2
        assert res_two.best_meal.total_valid_preferred_entity_count == 2
        assert res_two.best_meal.preference_coverage == 1.0

    def test_normal_different_foods_remain_unaffected(self, base_context):
        """Test 6: Normal foods belonging to no equivalence group combine freely."""
        neutral, condition, catalog = base_context
        pctx = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand = rank_meal_candidates(neutral, condition, pctx)

        target = PortionOptimizationTarget(
            target_scope=TargetScope.CUSTOM_MEAL_TARGET,
            target_source="TEST_LUNCH",
            target_energy_kcal=550.0,
            energy_tolerance_kcal=60.0,
            protein_min_g=20.0,
            protein_max_g=40.0,
            carbohydrate_min_g=45.0,
            carbohydrate_max_g=90.0,
            fat_min_g=10.0,
            fat_max_g=25.0,
        )
        # 3 distinct foods: Chicken Curry, Channa Daal, Plain Boiled Rice
        constraints = [
            PortionConstraint(entity_id="PK_DISH_009", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
            PortionConstraint(entity_id="PK_DISH_025", minimum_grams=80.0, maximum_grams=200.0, preferred_grams=150.0),
            PortionConstraint(entity_id="PK_PORTION_002", minimum_grams=75.0, maximum_grams=200.0, preferred_grams=150.0),
        ]
        mctx = SingleMealGenerationContext(
            meal_role=MealRole.LUNCH,
            required_entity_ids=["PK_PORTION_002"],
            preferred_entity_ids=["PK_DISH_009"],
        )
        policy = MealCombinationPolicy(
            minimum_items=3,
            maximum_items=3,
        )

        res = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx,
            policy=policy,
        )

        assert res.status in (
            SingleMealGenerationStatus.FEASIBLE,
            SingleMealGenerationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
        )
        assert res.best_meal is not None
        assert res.total_possible_combinations == 1
        assert res.best_meal.canonical_combination_id == "PK_DISH_009+PK_DISH_025+PK_PORTION_002"

    def test_candidate_input_shuffling_produces_identical_results(self, breakfast_setup):
        """Test 7: Shuffling candidate food ordering produces 100% identical outputs and search orders."""
        neutral, condition, cand, target, constraints = breakfast_setup

        mctx = SingleMealGenerationContext(
            meal_role=MealRole.BREAKFAST,
            preferred_entity_ids=["PK_COMP_001"],
        )
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=3,
            maximum_alternatives=2,
        )

        # Baseline run
        res_baseline = generate_single_meal(
            neutral_profile=neutral,
            condition_profile=condition,
            candidate_result=cand,
            target=target,
            constraints=constraints,
            context=mctx,
            policy=policy,
        )

        candidates_base = list(cand.ranked_optimization_candidates)

        for seed in [42, 123, 999, 2026]:
            shuffled = list(candidates_base)
            random.Random(seed).shuffle(shuffled)

            cand_shuffled = replace(cand, ranked_optimization_candidates=shuffled)

            res_shuffled = generate_single_meal(
                neutral_profile=neutral,
                condition_profile=condition,
                candidate_result=cand_shuffled,
                target=target,
                constraints=constraints,
                context=mctx,
                policy=policy,
            )

            assert res_shuffled.total_possible_combinations == res_baseline.total_possible_combinations
            assert res_shuffled.best_meal.canonical_combination_id == res_baseline.best_meal.canonical_combination_id
            assert [m.canonical_combination_id for m in res_shuffled.alternative_meals] == [
                m.canonical_combination_id for m in res_baseline.alternative_meals
            ]
            for item_b, item_s in zip(res_baseline.best_meal.items, res_shuffled.best_meal.items):
                assert item_b.entity_id == item_s.entity_id
                assert pytest.approx(item_b.optimized_grams, rel=1e-5) == item_s.optimized_grams

    def test_synthetic_equivalence_group_independent_of_catalog(self):
        """Test 8: Synthetic equivalence group validation completely independent of Pakistani catalog."""
        custom_groups = {
            "SYN_FRUIT": {"SYN_APPLE", "SYN_PEAR"},
            "SYN_GRAIN": {"SYN_OAT", "SYN_BARLEY"},
        }

        # 1. Validation function tests
        assert validate_combination_equivalence(["SYN_APPLE", "SYN_OAT"], custom_groups) == (True, None)
        assert validate_combination_equivalence(["SYN_APPLE", "SYN_PEAR"], custom_groups) == (
            False,
            "SEMANTIC_DUPLICATE_REPRESENTATION",
        )
        assert validate_combination_equivalence(["SYN_OAT", "SYN_BARLEY", "SYN_APPLE"], custom_groups) == (
            False,
            "SEMANTIC_DUPLICATE_REPRESENTATION",
        )

        # 2. Conflicting required entities
        conflicts = find_conflicting_equivalence_entities(["SYN_APPLE", "SYN_PEAR", "SYN_OAT"], custom_groups)
        assert "SYN_FRUIT" in conflicts
        assert set(conflicts["SYN_FRUIT"]) == {"SYN_APPLE", "SYN_PEAR"}

        # 3. Preference concept mapping
        concepts = map_to_preference_concepts(["SYN_APPLE", "SYN_PEAR", "SYN_YOGURT"], custom_groups)
        assert concepts == {"SYN_FRUIT", "SYN_YOGURT"}
        assert len(concepts) == 2

        # 4. Search space generation with synthetic policy
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            equivalence_groups=custom_groups,
        )
        # Optional: SYN_APPLE, SYN_PEAR, SYN_OAT -> 3 items
        # Raw pairs: (APPLE, PEAR), (APPLE, OAT), (PEAR, OAT) = 3
        # (APPLE, PEAR) is rejected as duplicate representation!
        # Valid pairs: (APPLE, OAT), (PEAR, OAT) = 2
        combs, total_pos, _, _, _ = generate_and_order_combinations(
            required_ids=[],
            optional_candidate_ids=["SYN_APPLE", "SYN_PEAR", "SYN_OAT"],
            valid_preferred_ids={"SYN_APPLE"},
            policy=policy,
        )
        assert total_pos == 2
        assert len(combs) == 2
        assert ("SYN_APPLE", "SYN_PEAR") not in combs
        assert combs[0] == ("SYN_APPLE", "SYN_OAT")  # Has preferred apple concept
        assert combs[1] == ("SYN_OAT", "SYN_PEAR")
