"""Meal/tests/test_meal_combination_generation.py - Tests for combinatorial generation and search space math.

Verifies:
- Requirement 6 & 7: Accurate total possible combinations formula.
- Required entities are strictly fixed in every generated combination.
- Combinations with more preferred entities are evaluated first.
- Truncation produces TRUNCATED_SEARCH and emits BETTER_UNEVALUATED_COMBINATION_MAY_EXIST.
"""

import pytest

from Meal.composition.combinations import (
    calculate_total_possible_combinations,
    generate_and_order_combinations,
)
from Meal.composition.schemas import (
    MealCombinationPolicy,
    SelectionScope,
)


class TestMealCombinationGeneration:
    """Mathematical verification of Phase 6C combinatorial search space generation."""

    def test_total_possible_combinations_analytical(self):
        """Validates exact analytical combinatorial formula with and without required items."""
        # Case A: 0 required, 5 optional, items in [1, 3] -> comb(5,1) + comb(5,2) + comb(5,3) = 5 + 10 + 10 = 25
        total_a = calculate_total_possible_combinations(
            required_count=0,
            optional_count=5,
            min_items=1,
            max_items=3,
        )
        assert total_a == 25

        # Case B: 2 required, 5 optional, items in [1, 3]
        # k=2: comb(5, 0) = 1
        # k=3: comb(5, 1) = 5
        # Total = 6
        total_b = calculate_total_possible_combinations(
            required_count=2,
            optional_count=5,
            min_items=1,
            max_items=3,
        )
        assert total_b == 6

        # Case C: Required exceeds max_items -> 0
        total_c = calculate_total_possible_combinations(
            required_count=4,
            optional_count=5,
            min_items=1,
            max_items=3,
        )
        assert total_c == 0

        # Case D: Total items available less than min_items -> 0
        total_d = calculate_total_possible_combinations(
            required_count=1,
            optional_count=1,
            min_items=3,
            max_items=4,
        )
        assert total_d == 0

    def test_required_items_in_every_combination(self):
        """Verifies that all required entity IDs are present in 100% of generated combinations."""
        req_ids = ["REQ_1", "REQ_2"]
        opt_ids = ["OPT_1", "OPT_2", "OPT_3"]
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=4,
            maximum_combinations_evaluated=100,
        )

        combs, total_possible, truncated, scope, warnings = generate_and_order_combinations(
            required_ids=req_ids,
            optional_candidate_ids=opt_ids,
            valid_preferred_ids=set(),
            policy=policy,
        )

        assert total_possible == 7  # k=2: 1, k=3: 3, k=4: 3 -> total 7
        assert len(combs) == 7
        assert truncated is False
        assert scope == SelectionScope.EXHAUSTIVE_SEARCH

        for comb in combs:
            assert "REQ_1" in comb
            assert "REQ_2" in comb

    def test_preferred_entities_prioritized_in_search_order(self):
        """Verifies combinations with higher preferred matches are ordered first."""
        req_ids = []
        opt_ids = ["FOOD_A", "FOOD_B", "FOOD_C", "FOOD_D"]
        pref_ids = {"FOOD_A", "FOOD_B"}

        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=100,
        )

        combs, _, _, _, _ = generate_and_order_combinations(
            required_ids=req_ids,
            optional_candidate_ids=opt_ids,
            valid_preferred_ids=pref_ids,
            policy=policy,
        )

        # First combination must have 2 preferred matches: (FOOD_A, FOOD_B)
        assert combs[0] == ("FOOD_A", "FOOD_B")

        # Next combinations must have 1 preferred match
        single_matches = combs[1:5]
        for c in single_matches:
            match_count = len(set(c) & pref_ids)
            assert match_count == 1

        # Last combination must have 0 preferred matches: (FOOD_C, FOOD_D)
        assert combs[-1] == ("FOOD_C", "FOOD_D")

    def test_search_truncation_contract(self):
        """Verifies that when space exceeds limit, truncation is flagged and warning issued."""
        req_ids = []
        opt_ids = [f"F_{i:02d}" for i in range(15)]
        policy = MealCombinationPolicy(
            minimum_items=2,
            maximum_items=2,
            maximum_combinations_evaluated=10,
        )

        # Total comb(15, 2) = 105
        combs, total_possible, truncated, scope, warnings = generate_and_order_combinations(
            required_ids=req_ids,
            optional_candidate_ids=opt_ids,
            valid_preferred_ids=set(),
            policy=policy,
        )

        assert total_possible == 105
        assert len(combs) == 10
        assert truncated is True
        assert scope == SelectionScope.TRUNCATED_SEARCH
        assert any("BETTER_UNEVALUATED_COMBINATION_MAY_EXIST" in w for w in warnings)
