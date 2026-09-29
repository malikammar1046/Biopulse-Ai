"""Meal/tests/test_candidate_eligibility.py - Unit tests for candidate eligibility, role gating, and disposition precedence.

Verifies:
- Meal role is a hard eligibility gate, NOT a weighted ranking score.
- Absence of meal_role_score in candidate score breakdown.
- Strict precedence of the 5 primary dispositions:
    1. HARD_SAFETY_EXCLUDED
    2. USER_EXCLUDED
    3. ROLE_INELIGIBLE
    4. DISPLAY_ONLY_INCOMPLETE_CORE_MACROS
    5. ELIGIBLE_FOR_OPTIMIZATION
- 8 macro-incomplete entities never enter ranked_optimization_candidates.
- Missing core macros remain None and are never converted to zero.
- Primary disposition counts sum to exactly 71 for every run.
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
)

INCOMPLETE_CORE_MACRO_IDS = {
    "PK_COMP_005",
    "PK_COMP_016",
    "PK_COMP_017",
    "PK_COMP_018",
    "PK_COMP_019",
    "PK_COMP_020",
    "PK_COMP_026",
    "PK_COMP_029",
}


@pytest.fixture
def catalog():
    return load_master_planner_catalog()


@pytest.fixture
def neutral_profile():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="male",
        height_cm=175.0,
        weight_kg=70.0,
        pal_category=PALCategory.ACTIVE,
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


class TestMealRoleGating:
    """Proves meal-role filtering acts strictly as a gate and not a ranking score."""

    def test_meal_role_is_gate_not_score(self, neutral_profile, condition_profile):
        context = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        # 1. Non-matching entities must be ROLE_INELIGIBLE and in excluded_candidates
        for cand in result.excluded_candidates:
            if cand.primary_disposition == PrimaryDisposition.ROLE_INELIGIBLE:
                assert MealRole.BREAKFAST.value not in cand.supported_meal_roles
                assert cand.total_score is None

        # 2. Optimization candidates must support BREAKFAST
        for cand in result.ranked_optimization_candidates:
            assert MealRole.BREAKFAST.value in cand.supported_meal_roles
            assert "MATCHES_REQUESTED_MEAL_ROLE" in cand.explanation_tokens

            # Verify NO meal_role_score exists on CandidateScoreBreakdown
            assert not hasattr(cand.score_breakdown, "meal_role_score")
            assert "meal_role" not in cand.score_weights_used

    def test_all_eight_roles_execute_cleanly(self, neutral_profile, condition_profile):
        for role in MealRole:
            context = CandidateSelectionContext(meal_role=role)
            result = rank_meal_candidates(neutral_profile, condition_profile, context)
            assert result.verify_counts() is True
            assert result.total_catalog_entities == 71


class TestPrimaryDispositionPrecedence:
    """Verifies strict deterministic precedence among the 5 primary dispositions."""

    def test_hard_safety_beats_user_exclusion(self, neutral_profile, condition_profile):
        # PK_COMP_005 (Egg) has allergen egg and is also added to dislikes
        context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            allergies=["egg"],
            dislikes=["PK_COMP_005"],
        )
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        cand = next(e for e in result.excluded_candidates if e.entity_id == "PK_COMP_005")
        # Hard safety takes precedence over user dislike
        assert cand.primary_disposition == PrimaryDisposition.HARD_SAFETY_EXCLUDED

    def test_user_exclusion_beats_role_ineligibility(self, neutral_profile, condition_profile):
        # PK_DISH_019 (Chicken Karahi) supports lunch/dinner, NOT breakfast
        # Adding it to dislikes must yield USER_EXCLUDED, not ROLE_INELIGIBLE
        context = CandidateSelectionContext(
            meal_role=MealRole.BREAKFAST,
            dislikes=["PK_DISH_019"],
        )
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        cand = next(e for e in result.excluded_candidates if e.entity_id == "PK_DISH_019")
        assert cand.primary_disposition == PrimaryDisposition.USER_EXCLUDED

    def test_role_ineligibility_beats_incomplete_macros(self, neutral_profile, condition_profile):
        # PK_COMP_029 (Almonds) is incomplete for carbs and supports snack, not breakfast
        # In BREAKFAST context, it must be ROLE_INELIGIBLE, not DISPLAY_ONLY_INCOMPLETE_CORE_MACROS
        context = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        cand = next(e for e in result.excluded_candidates if e.entity_id == "PK_COMP_029")
        assert cand.primary_disposition == PrimaryDisposition.ROLE_INELIGIBLE


class TestIncompleteMacroPartitioning:
    """Verifies 8 macro-incomplete entities never enter ranked_optimization_candidates."""

    def test_incomplete_entities_never_in_optimization_list(
        self, neutral_profile, condition_profile
    ):
        for role in [MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER, MealRole.SNACK]:
            context = CandidateSelectionContext(meal_role=role)
            result = rank_meal_candidates(neutral_profile, condition_profile, context)

            opt_ids = {e.entity_id for e in result.ranked_optimization_candidates}
            # None of the 8 incomplete entities can ever enter the optimization candidate list
            overlap = opt_ids.intersection(INCOMPLETE_CORE_MACRO_IDS)
            assert overlap == set(), f"Incomplete entities found in optimization candidates for {role}: {overlap}"

    def test_incomplete_entities_are_display_only_when_role_matches(
        self, neutral_profile, condition_profile
    ):
        # PK_COMP_005 (Boiled Egg) supports breakfast, snack. Has missing carb_g.
        context = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        disp_ids = {e.entity_id for e in result.display_only_candidates}
        assert "PK_COMP_005" in disp_ids
        egg_eval = next(e for e in result.display_only_candidates if e.entity_id == "PK_COMP_005")
        assert egg_eval.primary_disposition == PrimaryDisposition.DISPLAY_ONLY_INCOMPLETE_CORE_MACROS
        assert egg_eval.core_macro_optimization_eligible is False
        assert egg_eval.candidate_display_eligible is True
        assert "carb_g" in egg_eval.missing_macros
        # Crucial: missing carb_g is None, NEVER converted to 0.0
        assert egg_eval.carb_g is None

    def test_missing_macros_are_never_converted_to_zero(self, catalog):
        for eid in INCOMPLETE_CORE_MACRO_IDS:
            entity = catalog[eid]
            # Verify at least one macro is genuinely None
            none_macros = [
                m for m, val in [
                    ("energy_kcal", entity.normalized_energy_kcal_per_100g),
                    ("protein_g", entity.normalized_protein_g_per_100g),
                    ("fat_g", entity.normalized_fat_g_per_100g),
                    ("carb_g", entity.normalized_carb_g_per_100g),
                ] if val is None
            ]
            assert len(none_macros) > 0, f"Entity {eid} expected to have missing macros"


class TestExactSumClosure:
    """Proves sum of primary dispositions equals exactly 71 for every run."""

    def test_sum_closure_across_various_filter_combinations(
        self, neutral_profile, condition_profile
    ):
        scenarios = [
            CandidateSelectionContext(meal_role=MealRole.BREAKFAST),
            CandidateSelectionContext(meal_role=MealRole.LUNCH),
            CandidateSelectionContext(meal_role=MealRole.DINNER),
            CandidateSelectionContext(meal_role=MealRole.SNACK),
            CandidateSelectionContext(
                meal_role=MealRole.BREAKFAST,
                allergies=["dairy", "egg"],
                dislikes=["PK_DISH_001", "PK_COMP_007"],
            ),
            CandidateSelectionContext(
                meal_role=MealRole.LUNCH,
                dietary_class="vegetarian",
                dislikes=["PK_DISH_002"],
            ),
            CandidateSelectionContext(
                meal_role=MealRole.DINNER,
                requested_exclusions=["PK_DISH_003", "PK_DISH_004"],
            ),
        ]

        for ctx in scenarios:
            result = rank_meal_candidates(neutral_profile, condition_profile, ctx)
            assert result.verify_counts() is True
            assert (
                result.hard_safety_excluded_count
                + result.user_excluded_count
                + result.role_ineligible_count
                + result.display_only_incomplete_count
                + result.display_only_nutrition_review_count
                + result.optimization_eligible_count
            ) == 71

            total_partitioned = (
                len(result.ranked_optimization_candidates)
                + len(result.display_only_candidates)
                + len(result.excluded_candidates)
            )
            assert total_partitioned == 71


class TestPhase6A2MealRoleGateIntegrity:
    """Exhaustive end-to-end set-equality and partition-closure tests across all 8 meal roles."""

    def test_breakfast_downstream_candidates_subset_of_19_raw_breakfast_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_bf_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.BREAKFAST)}
        assert len(raw_bf_ids) == 19

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_bf_ids)
        assert opt_ids.issubset(raw_bf_ids)
        assert disp_ids.issubset(raw_bf_ids)
        assert len(downstream) == 19
        assert len(opt_ids) == 15
        assert len(disp_ids) == 4

    def test_lunch_downstream_candidates_subset_of_47_raw_lunch_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.LUNCH)}
        assert len(raw_ids) == 47

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.LUNCH)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 47
        assert len(opt_ids) == 45
        assert len(disp_ids) == 2

    def test_dinner_downstream_candidates_subset_of_47_raw_dinner_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.DINNER)}
        assert len(raw_ids) == 47

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.DINNER)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 47
        assert len(opt_ids) == 45
        assert len(disp_ids) == 2

    def test_snack_downstream_candidates_subset_of_25_raw_snack_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.SNACK)}
        assert len(raw_ids) == 25

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.SNACK)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 25
        assert len(opt_ids) == 17
        assert len(disp_ids) == 8

    def test_side_downstream_candidates_subset_of_10_raw_side_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.SIDE)}
        assert len(raw_ids) == 10

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.SIDE)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 10
        assert len(opt_ids) == 7
        assert len(disp_ids) == 3

    def test_staple_downstream_candidates_subset_of_6_raw_staple_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.STAPLE)}
        assert len(raw_ids) == 6

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.STAPLE)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 6
        assert len(opt_ids) == 6
        assert len(disp_ids) == 0

    def test_dessert_downstream_candidates_subset_of_5_raw_dessert_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.DESSERT)}
        assert len(raw_ids) == 5

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.DESSERT)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 5
        assert len(opt_ids) == 5
        assert len(disp_ids) == 0

    def test_beverage_downstream_candidates_subset_of_2_raw_beverage_ids(
        self, neutral_profile, condition_profile, catalog
    ):
        raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(MealRole.BEVERAGE)}
        assert len(raw_ids) == 2

        result = rank_meal_candidates(
            neutral_profile, condition_profile, CandidateSelectionContext(meal_role=MealRole.BEVERAGE)
        )
        opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
        disp_ids = {c.entity_id for c in result.display_only_candidates}
        downstream = opt_ids | disp_ids

        assert downstream.issubset(raw_ids)
        assert len(downstream) == 2
        assert len(opt_ids) == 2
        assert len(disp_ids) == 0

    def test_no_role_ineligible_entity_appears_in_ranked_pool(
        self, neutral_profile, condition_profile
    ):
        for role in MealRole:
            result = rank_meal_candidates(
                neutral_profile, condition_profile, CandidateSelectionContext(meal_role=role)
            )
            role_ineligible_ids = {
                c.entity_id
                for c in result.excluded_candidates
                if c.primary_disposition == PrimaryDisposition.ROLE_INELIGIBLE
            }
            opt_ids = {c.entity_id for c in result.ranked_optimization_candidates}
            disp_ids = {c.entity_id for c in result.display_only_candidates}

            assert len(opt_ids & role_ineligible_ids) == 0
            assert len(disp_ids & role_ineligible_ids) == 0

    def test_role_specific_partition_closure(
        self, neutral_profile, condition_profile, catalog
    ):
        for role in MealRole:
            raw_ids = {eid for eid, ent in catalog.items() if ent.supports_meal_role(role)}
            result = rank_meal_candidates(
                neutral_profile, condition_profile, CandidateSelectionContext(meal_role=role)
            )
            assert result.verify_role_closure() is True
            assert result.verify_counts() is True
            assert result.raw_role_entity_count == len(raw_ids)
            assert result.downstream_role_valid_count == len(raw_ids)

            # Test with user exclusions inside the role
            if len(raw_ids) >= 2:
                sample_excl = sorted(list(raw_ids))[:2]
                ctx_excl = CandidateSelectionContext(
                    meal_role=role,
                    dislikes=sample_excl,
                )
                res_excl = rank_meal_candidates(neutral_profile, condition_profile, ctx_excl)
                assert res_excl.verify_role_closure() is True
                assert res_excl.verify_counts() is True
                assert res_excl.role_supporting_user_excluded_count == 2
                assert res_excl.downstream_role_valid_count == len(raw_ids) - 2
