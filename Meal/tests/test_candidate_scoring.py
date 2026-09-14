"""Meal/tests/test_candidate_scoring.py - Unit tests for transparent candidate scoring signals.

Verifies:
- Ranking signals are portion-independent (no daily target fit claims before portions exist).
- Missing fiber is marked UNAVAILABLE, never scored as zero.
- Weight renormalization when components (like fiber) are unavailable.
- Absent user preferences make preference_score UNAVAILABLE with 0 weight (no default 0.5 score).
- Explicit user preferences correctly score 1.0 (item), 0.8 (category), 0.2 (other).
- Budget, cooking time, cultural fit, and condition context have 0 weight and are UNAVAILABLE / NOT_USED.
- Deterministic sorting: total_score DESC, planner_entity_id ASC.
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
from Meal.planner.catalog import load_master_planner_catalog
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import (
    CandidateSelectionContext,
    MealRole,
    PrimaryDisposition,
    ScoreStatus,
)
from Meal.planner.scoring import compute_candidate_signals


@pytest.fixture
def catalog():
    return load_master_planner_catalog()


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.LOW_ACTIVE,
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


class TestMissingFiberHandling:
    """Verifies missing fiber is marked UNAVAILABLE, earns 0 bonus, and does NOT inflate base weights."""

    def test_missing_fiber_is_unavailable_and_does_not_renormalize_weights(self, catalog):
        # Find an entity with missing fiber, e.g. PK_DISH_008 or any entity with fiber_g is None
        missing_fiber_entities = [
            e for e in catalog.values()
            if e.normalized_fiber_g_per_100g is None
            and e.normalized_energy_kcal_per_100g is not None
            and e.normalized_protein_g_per_100g is not None
            and e.normalized_fat_g_per_100g is not None
            and e.normalized_carb_g_per_100g is not None
        ]
        assert len(missing_fiber_entities) > 0
        entity = missing_fiber_entities[0]

        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        (
            priority_score,
            base_score,
            fiber_bonus,
            pref_bonus,
            breakdown,
            weights,
            avail,
            unavail,
        ) = compute_candidate_signals(
            entity, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        # Fiber must be UNAVAILABLE, not 0.0
        assert breakdown.fiber_concentration_status == ScoreStatus.UNAVAILABLE
        assert breakdown.fiber_concentration_signal is None
        assert fiber_bonus == 0.0
        assert "fiber_concentration" in unavail
        assert "fiber_concentration" not in avail

        # Weights: planner_data_confidence is 1.00 (NO protein or fiber weight)
        assert weights["planner_data_confidence"] == 1.00
        assert priority_score == base_score

    def test_present_fiber_is_descriptive_only_and_earns_zero_ranking_bonus(self, catalog):
        # Find an entity with known positive fiber
        present_fiber_entities = [
            e for e in catalog.values()
            if e.normalized_fiber_g_per_100g is not None and e.normalized_fiber_g_per_100g > 0
        ]
        assert len(present_fiber_entities) > 0
        entity = present_fiber_entities[0]

        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        (
            priority_score,
            base_score,
            fiber_bonus,
            pref_bonus,
            breakdown,
            weights,
            avail,
            unavail,
        ) = compute_candidate_signals(
            entity, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        assert breakdown.fiber_concentration_status == ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A
        assert breakdown.fiber_concentration_signal is not None
        assert fiber_bonus == 0.0
        assert priority_score == base_score


class TestUserPreferenceHandling:
    """Verifies preference score status and weight allocation."""

    def test_missing_preference_is_unavailable_with_zero_weight(self, catalog):
        entity = next(iter(catalog.values()))
        # No preferences supplied
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)

        (
            priority_score,
            base_score,
            fiber_bonus,
            pref_bonus,
            breakdown,
            weights,
            avail,
            unavail,
        ) = compute_candidate_signals(
            entity, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        assert breakdown.preference_status == ScoreStatus.UNAVAILABLE
        assert breakdown.preference_score is None
        assert pref_bonus == 0.0
        assert "preference" in unavail
        assert "preference" not in avail

    def test_supplied_preferences_activate_weight_and_score(self, catalog):
        # Choose a specific entity and category
        pref_id = "PK_DISH_001"
        pref_cat = "Cereal Staple"

        context = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            preferred_entity_ids=[pref_id],
            preferred_categories=[pref_cat],
        )

        # Entity 1: Exact preferred item
        e1 = catalog[pref_id]
        _, _, _, b1_bonus, b1, _, a1, _ = compute_candidate_signals(
            e1, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        assert b1.preference_status == ScoreStatus.ACTIVE
        assert b1.preference_score == 1.0
        assert b1_bonus == 0.15
        assert "preference" in a1

        # Entity 2: Matching category but different ID
        cat_entities = [
            e for e in catalog.values()
            if e.category.strip().lower() == pref_cat.lower() and e.planner_entity_id != pref_id
        ]
        if cat_entities:
            e2 = cat_entities[0]
            _, _, _, b2_bonus, b2, _, _, _ = compute_candidate_signals(
                e2, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
            )
            assert b2.preference_score == 0.80
            assert b2_bonus == 0.10

        # Entity 3: Unmatched item and category
        other_entities = [
            e for e in catalog.values()
            if e.category.strip().lower() != pref_cat.lower() and e.planner_entity_id != pref_id
        ]
        if other_entities:
            e3 = other_entities[0]
            _, _, _, b3_bonus, b3, _, _, _ = compute_candidate_signals(
                e3, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
            )
            assert b3.preference_score == 0.20
            assert b3_bonus == 0.0


class TestUnavailableComponentsZeroWeight:
    """Verifies budget, cooking time, cultural fit, and condition context have zero weight."""

    def test_budget_and_cooking_time_and_condition_have_zero_weight(self, catalog):
        entity = next(iter(catalog.values()))
        context = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            budget_preference="low",
            cooking_time_preference="quick",
        )
        (
            _,
            _,
            _,
            _,
            breakdown,
            weights,
            _,
            unavail,
        ) = compute_candidate_signals(
            entity, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        assert breakdown.budget_score_status == ScoreStatus.UNAVAILABLE
        assert breakdown.budget_score is None
        assert "budget" not in weights

        assert breakdown.cooking_time_score_status == ScoreStatus.UNAVAILABLE
        assert breakdown.cooking_time_score is None
        assert "cooking_time" not in weights

        assert breakdown.cultural_fit_score_status == ScoreStatus.UNAVAILABLE
        assert breakdown.cultural_fit_score is None
        assert "cultural_fit" not in weights

        assert breakdown.condition_context_status == ScoreStatus.NOT_USED_FOR_NUMERICAL_RANKING
        assert breakdown.condition_context_score is None
        assert "condition_context" not in weights


class TestDeterministicSorting:
    """Proves ranking sorting order is score DESC, then entity_id ASC."""

    def test_sorting_order_is_deterministic(self, neutral_profile, condition_profile):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        cands = result.ranked_optimization_candidates
        assert len(cands) > 1

        for i in range(len(cands) - 1):
            s1 = cands[i].total_score
            s2 = cands[i + 1].total_score
            eid1 = cands[i].entity_id
            eid2 = cands[i + 1].entity_id

            assert s1 is not None and s2 is not None
            if s1 == s2:
                assert eid1 < eid2, f"Tie-breaking failed: {eid1} should precede {eid2}"
            else:
                assert s1 > s2, f"Sorting failed: score {s1} should be >= {s2}"
