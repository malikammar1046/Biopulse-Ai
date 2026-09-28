"""Meal/tests/test_candidate_ranking.py - End-to-end integration tests for Phase 6A candidate filtering and ranking.

Verifies:
- End-to-end ranking execution for BREAKFAST, LUNCH, DINNER, SNACK.
- ranked_optimization_candidates contains only core-macro complete entities.
- display_only_candidates isolates incomplete core-macro entities.
- Structural immutability of upstream profiles and catalog.
- Rejection of free-text / fuzzy name matching in core planner.
- Completeness and validity of CandidateRankingResult metadata.
"""

import copy
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
    NutritionConsistencyStatus,
    PrimaryDisposition,
)


@pytest.fixture
def catalog():
    return load_master_planner_catalog()


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=27,
        sex_for_reference_equation="female",
        height_cm=162.0,
        weight_kg=58.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def condition_profile(neutral_profile):
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.PCOS,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    return build_condition_nutrition_profile(neutral_profile, ctx)


class TestEndToEndMealRanking:
    """Verifies complete end-to-end candidate ranking across standard meal roles."""

    @pytest.mark.parametrize("role", [MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER, MealRole.SNACK])
    def test_ranking_for_standard_roles(self, neutral_profile, condition_profile, role):
        context = CandidateSelectionContext(meal_role=role)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        # 1. Total count closure
        assert result.total_catalog_entities == 71
        assert result.verify_counts() is True

        # 2. Optimization candidates must be non-empty and all core-macro complete
        assert len(result.ranked_optimization_candidates) >= 5
        for cand in result.ranked_optimization_candidates:
            assert cand.core_macro_optimization_eligible is True
            assert cand.candidate_display_eligible is True
            assert cand.primary_disposition == PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
            assert cand.total_score is not None
            assert cand.total_score >= 0.0
            assert cand.missing_macros == []
            assert role.value in cand.supported_meal_roles

        # 3. Display-only candidates must be incomplete macros or severe nutrition review required
        for cand in result.display_only_candidates:
            assert cand.primary_disposition in (
                PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS,
                PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED,
            )
            assert cand.core_macro_optimization_eligible is False
            assert cand.candidate_display_eligible is True
            if cand.primary_disposition == PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS:
                assert len(cand.missing_macros) > 0
            else:
                assert cand.nutrition_consistency_status == NutritionConsistencyStatus.REVIEW_REQUIRED

    def test_breakfast_specific_composition(self, neutral_profile, condition_profile):
        context = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        # Catalog has 19 breakfast entities:
        # Among them:
        # - 3 are incomplete (PK_COMP_005 Boiled Egg, PK_COMP_017 Almond, PK_COMP_018 Walnut)
        # - 1 has severe nutrient inconsistency requiring review (PK_COMP_004 Paneer)
        # - 15 are complete and optimization eligible
        assert result.display_only_incomplete_count == 3
        assert result.display_only_nutrition_review_count == 1
        assert result.optimization_eligible_count == 15
        assert result.role_ineligible_count == (71 - 19)
        assert len(result.ranked_optimization_candidates) == 15
        assert len(result.display_only_candidates) == 4
        display_ids = {e.entity_id for e in result.display_only_candidates}
        assert display_ids == {"PK_COMP_005", "PK_COMP_017", "PK_COMP_018", "PK_COMP_004"}


class TestUpstreamImmutability:
    """Proves neutral profile, condition profile, and catalog remain strictly unmodified."""

    def test_profiles_and_catalog_remain_immutable(self, neutral_profile, condition_profile, catalog):
        neutral_snapshot = copy.deepcopy(neutral_profile)
        condition_snapshot = copy.deepcopy(condition_profile)
        catalog_keys_snapshot = list(catalog.keys())

        context = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            allergies=["dairy"],
            dislikes=["PK_DISH_001"],
            preferred_entity_ids=["PK_DISH_002"],
        )
        _ = rank_meal_candidates(neutral_profile, condition_profile, context)

        # Neutral profile unchanged
        assert neutral_profile == neutral_snapshot

        # Condition profile unchanged
        assert condition_profile.condition_pathway == condition_snapshot.condition_pathway
        assert condition_profile.evidence_context_status == condition_snapshot.evidence_context_status
        assert condition_profile.applicable_evidence_ids == condition_snapshot.applicable_evidence_ids

        # Catalog keys and structure unchanged
        after_catalog = load_master_planner_catalog()
        assert list(after_catalog.keys()) == catalog_keys_snapshot


class TestNoFuzzyNameMatching:
    """Verifies that free text names or non-existent entity IDs are strictly rejected."""

    def test_free_text_names_in_dislikes_raise_value_error(self, catalog):
        for invalid_term in ["chicken", "rice", "daal", "roti", "Chicken Karahi"]:
            ctx = CandidateSelectionContext(
                meal_role=MealRole.DINNER,
                dislikes=[invalid_term],
            )
            with pytest.raises(ValueError, match="Unknown planner entity ID"):
                from Meal.planner.eligibility import run_batch_eligibility
                run_batch_eligibility(catalog, ctx)

    def test_free_text_names_in_preferred_ids_raise_value_error(self, catalog):
        ctx = CandidateSelectionContext(
            meal_role=MealRole.DINNER,
            preferred_entity_ids=["Biryani"],
        )
        with pytest.raises(ValueError, match="Unknown planner entity ID 'Biryani'"):
            from Meal.planner.eligibility import run_batch_eligibility
            run_batch_eligibility(catalog, ctx)
