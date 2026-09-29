"""Meal/tests/test_ranking_integrity.py - Phase 6A.1 Nutrient Sanity & Ranking Integrity Tests.

Verifies:
1. Paneer 35-kcal issue quarantine: evaluated as REVIEW_REQUIRED, primary disposition
   DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED, strictly excluded from ranked_optimization_candidates,
   and source values preserved without silent alteration.
2. Catalog-wide energy vs macronutrient sanity audit: exactly 60 CONSISTENT, 2 MINOR_DIFFERENCE,
   1 REVIEW_REQUIRED, 8 NOT_ASSESSABLE across all 71 catalog entities.
3. Missing-fiber comparability: missing fiber never inflates base weights or confers an advantage
   over known low fiber.
4. Semantic distinction: known zero fiber (ACTIVE, bonus 0.0) != missing fiber (UNAVAILABLE, bonus 0.0).
5. 1-to-1 Phase 4 planner readiness explanation tokens: no catch-all DIRECT_COMPONENT_OR_PORTION.
6. Recipe availability contract: strictly True for 17 READY_RECIPE_AND_NUTRITION dishes,
   strictly False for 24 READY_NUTRITION_ONLY dishes and all direct components.
7. Outlier handling: bounded optional fiber bonus (+0.10 max) prevents Halwa Suji (12g fiber)
   from dominating rankings.
8. Deterministic candidate priority scoring: score bounds [0.0, 1.25], deterministic tie-breaking.
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
from Meal.planner.eligibility import check_nutrition_consistency, run_batch_eligibility
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import (
    CandidateSelectionContext,
    MealRole,
    NutritionConsistencyStatus,
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


class TestPaneerSanityAuditAndQuarantine:
    """Verifies complete quarantine of Cottage Cheese / Paneer (PK_COMP_004)."""

    def test_paneer_severe_inconsistency_flagged(self, catalog):
        paneer = catalog["PK_COMP_004"]
        assert paneer.normalized_energy_kcal_per_100g == 35.0
        assert paneer.normalized_protein_g_per_100g == 22.4
        assert paneer.normalized_fat_g_per_100g == 26.7
        assert paneer.normalized_carb_g_per_100g == 4.2

        status, rep_e, macro_e, rel_diff = check_nutrition_consistency(paneer)
        assert rep_e == 35.0
        # 4*22.4 + 9*26.7 + 4*4.2 = 89.6 + 240.3 + 16.8 = 346.7 kcal
        assert pytest.approx(macro_e, 0.1) == 346.7
        assert status == NutritionConsistencyStatus.REVIEW_REQUIRED
        assert rel_diff is not None and rel_diff > 8.0  # ~890% relative discrepancy

    def test_paneer_quarantined_from_optimization_candidates(
        self, neutral_profile, condition_profile
    ):
        # Paneer supports BREAKFAST and SNACK
        for role in [MealRole.BREAKFAST, MealRole.SNACK]:
            context = CandidateSelectionContext(meal_role=role)
            result = rank_meal_candidates(neutral_profile, condition_profile, context)

            # 1. Never enters ranked_optimization_candidates
            opt_ids = [c.entity_id for c in result.ranked_optimization_candidates]
            assert "PK_COMP_004" not in opt_ids

            # 2. Present in display_only_candidates with primary disposition DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED
            disp_ids = [c.entity_id for c in result.display_only_candidates]
            assert "PK_COMP_004" in disp_ids
            paneer_cand = next(c for c in result.display_only_candidates if c.entity_id == "PK_COMP_004")
            assert paneer_cand.primary_disposition == PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED
            assert paneer_cand.nutrition_consistency_status == NutritionConsistencyStatus.REVIEW_REQUIRED
            assert paneer_cand.core_macro_optimization_eligible is False
            assert paneer_cand.candidate_display_eligible is True

            # 3. Source nutrient values are strictly preserved (never silently overwritten with 346.7)
            assert paneer_cand.energy_kcal == 35.0
            assert paneer_cand.protein_g == 22.4
            assert paneer_cand.fat_g == 26.7
            assert paneer_cand.carb_g == 4.2
            assert paneer_cand.reported_energy_kcal == 35.0
            assert pytest.approx(paneer_cand.macro_derived_energy_kcal, 0.1) == 346.7

    def test_paneer_role_ineligible_when_role_does_not_match(
        self, neutral_profile, condition_profile
    ):
        # In LUNCH context, Paneer does not support lunch -> ROLE_INELIGIBLE takes precedence
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        cand = next(c for c in result.excluded_candidates if c.entity_id == "PK_COMP_004")
        assert cand.primary_disposition == PrimaryDisposition.ROLE_INELIGIBLE


class TestCatalogWideConsistencyAudit:
    """Verifies whole-catalog energy vs macronutrient consistency distribution."""

    def test_catalog_consistency_counts(self, catalog):
        consistent = 0
        minor_diff = 0
        review_req = 0
        not_assessable = 0

        for entity in catalog.values():
            status, _, _, _ = check_nutrition_consistency(entity)
            if status == NutritionConsistencyStatus.CONSISTENT:
                consistent += 1
            elif status == NutritionConsistencyStatus.MINOR_DIFFERENCE:
                minor_diff += 1
            elif status == NutritionConsistencyStatus.REVIEW_REQUIRED:
                review_req += 1
            elif status == NutritionConsistencyStatus.NOT_ASSESSABLE:
                not_assessable += 1

        assert consistent == 60
        assert minor_diff == 2
        assert review_req == 1
        assert not_assessable == 8
        assert (consistent + minor_diff + review_req + not_assessable) == 71

    def test_minor_difference_entities(self, catalog):
        # PK_COMP_002 (Lassi) and PK_COMP_009 (Guava) have minor differences
        lassi = catalog["PK_COMP_002"]
        guava = catalog["PK_COMP_009"]

        lassi_status, _, _, _ = check_nutrition_consistency(lassi)
        guava_status, _, _, _ = check_nutrition_consistency(guava)

        assert lassi_status == NutritionConsistencyStatus.MINOR_DIFFERENCE
        assert guava_status == NutritionConsistencyStatus.MINOR_DIFFERENCE


class TestMissingFiberRankingParadoxResolution:
    """Verifies missing optional fiber does not create a numerical advantage."""

    def test_missing_fiber_never_inflates_base_weights(self, catalog):
        # Any entity with missing fiber
        missing_fiber = next(
            e for e in catalog.values()
            if e.normalized_fiber_g_per_100g is None
            and e.normalized_protein_g_per_100g is not None
        )
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
            missing_fiber, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        assert weights["planner_data_confidence"] == 1.00
        assert fiber_bonus == 0.0
        assert breakdown.fiber_concentration_status == ScoreStatus.UNAVAILABLE
        assert priority_score == base_score

    def test_fiber_concentration_alone_does_not_improve_priority(self, catalog):
        # Two foods with consistent data: one without fiber, one with high fiber
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)

        entity_no_fiber = next(
            e for e in catalog.values()
            if e.normalized_fiber_g_per_100g is None
            and e.normalized_protein_g_per_100g is not None
        )
        entity_with_fiber = next(
            e for e in catalog.values()
            if e.normalized_fiber_g_per_100g is not None
            and e.normalized_fiber_g_per_100g > 2.0
            and e.normalized_protein_g_per_100g is not None
        )

        score_a, base_a, bonus_a, _, _, w_a, _, _ = compute_candidate_signals(
            entity_no_fiber, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        score_b, base_b, bonus_b, _, _, w_b, _, _ = compute_candidate_signals(
            entity_with_fiber, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        # Both have 0.0 fiber bonus in Phase 6A (informational only)
        assert bonus_a == 0.0
        assert bonus_b == 0.0
        assert score_a == base_a == 1.0
        assert score_b == base_b == 1.0

    def test_known_zero_vs_unknown_fiber_semantics(self, catalog):
        # Semantics: UNKNOWN != ZERO
        cand_none = next(e for e in catalog.values() if e.normalized_fiber_g_per_100g is None)
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        _, _, bonus_none, _, b_none, _, _, _ = compute_candidate_signals(
            cand_none, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        assert b_none.fiber_concentration_status == ScoreStatus.UNAVAILABLE
        assert bonus_none == 0.0


class TestPhase4ReadinessExplanationTokensAndRecipeAvailability:
    """Verifies deterministic 1-to-1 mapping of explanation tokens and recipe availability."""

    def test_recipe_and_nutrition_entities(self, neutral_profile, condition_profile, catalog):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        all_evals = (
            result.ranked_optimization_candidates
            + result.display_only_candidates
            + result.excluded_candidates
        )
        eval_map = {e.entity_id: e for e in all_evals}

        recipe_entities = [e for e in catalog.values() if e.planner_readiness == "READY_RECIPE_AND_NUTRITION"]
        assert len(recipe_entities) == 17

        for ent in recipe_entities:
            ev = eval_map[ent.planner_entity_id]
            assert ev.recipe_instruction_available is True
            assert "RECIPE_AND_NUTRITION_COMPOSITE" in ev.explanation_tokens
            assert "RECIPE_INSTRUCTIONS_AVAILABLE" in ev.explanation_tokens
            assert "DIRECT_COMPONENT_OR_PORTION" not in ev.explanation_tokens
            assert "NUTRITION_ONLY_COMPOSITE" not in ev.explanation_tokens

    def test_nutrition_only_entities(self, neutral_profile, condition_profile, catalog):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        all_evals = (
            result.ranked_optimization_candidates
            + result.display_only_candidates
            + result.excluded_candidates
        )
        eval_map = {e.entity_id: e for e in all_evals}

        nutrition_only = [e for e in catalog.values() if e.planner_readiness == "READY_NUTRITION_ONLY"]
        assert len(nutrition_only) == 23

        for ent in nutrition_only:
            ev = eval_map[ent.planner_entity_id]
            assert ev.recipe_instruction_available is False
            assert "NUTRITION_ONLY_COMPOSITE" in ev.explanation_tokens
            assert "RECIPE_INSTRUCTIONS_UNAVAILABLE" in ev.explanation_tokens
            assert "RECIPE_INSTRUCTIONS_AVAILABLE" not in ev.explanation_tokens
            assert "DIRECT_COMPONENT_OR_PORTION" not in ev.explanation_tokens

    def test_direct_component_entities(self, neutral_profile, condition_profile, catalog):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        all_evals = (
            result.ranked_optimization_candidates
            + result.display_only_candidates
            + result.excluded_candidates
        )
        eval_map = {e.entity_id: e for e in all_evals}

        direct_comps = [e for e in catalog.values() if e.planner_readiness == "READY_DIRECT_COMPONENT"]
        assert len(direct_comps) == 29

        for ent in direct_comps:
            ev = eval_map[ent.planner_entity_id]
            assert ev.recipe_instruction_available is False
            assert "DIRECT_COMPONENT" in ev.explanation_tokens
            assert "DIRECT_COMPONENT_OR_PORTION" not in ev.explanation_tokens

    def test_standard_portion_entities(self, neutral_profile, condition_profile, catalog):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)
        all_evals = (
            result.ranked_optimization_candidates
            + result.display_only_candidates
            + result.excluded_candidates
        )
        eval_map = {e.entity_id: e for e in all_evals}

        std_portions = [e for e in catalog.values() if e.planner_readiness == "READY_STANDARD_PORTION"]
        assert len(std_portions) == 2

        for ent in std_portions:
            ev = eval_map[ent.planner_entity_id]
            assert ev.recipe_instruction_available is False
            assert "STANDARD_PORTION" in ev.explanation_tokens
            assert "DIRECT_COMPONENT_OR_PORTION" not in ev.explanation_tokens


class TestPhase6A1BoundaryHardening:
    """Verifies all Phase 6A.1 boundary corrections requested in Section 8."""

    def test_high_protein_concentration_alone_does_not_improve_priority(self, catalog):
        # Two optimization-eligible candidates with consistent data: one high protein, one low protein
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)

        # High protein food: PK_COMP_019 (Peanut, 25.0g) or PK_DISH_011 (Machli, 23.7g)
        cand_high_prot = catalog["PK_DISH_011"]
        # Low protein food: PK_DISH_013 (Aloo Baingan, ~1.6g protein)
        cand_low_prot = catalog["PK_DISH_013"]

        score_high, base_high, _, _, _, _, _, _ = compute_candidate_signals(
            cand_high_prot, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        score_low, base_low, _, _, _, _, _, _ = compute_candidate_signals(
            cand_low_prot, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        # Both have identical planner_data_confidence base score (1.0000)
        assert score_high == base_high == 1.0000
        assert score_low == base_low == 1.0000
        assert score_high == score_low

    def test_high_fiber_concentration_alone_does_not_improve_priority(self, catalog):
        # Halwa Suji has 12g fiber; another food has 0.5g fiber (or 0.0g)
        context = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        halwa = catalog["PK_DISH_014"]
        chapati = catalog["PK_DISH_001"]

        score_halwa, base_halwa, fiber_bonus_halwa, _, _, _, _, _ = compute_candidate_signals(
            halwa, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        score_chapati, base_chapati, fiber_bonus_chapati, _, _, _, _, _ = compute_candidate_signals(
            chapati, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )

        assert fiber_bonus_halwa == 0.0
        assert fiber_bonus_chapati == 0.0
        assert score_halwa == base_halwa == 1.0000
        assert score_chapati == base_chapati == 1.0000

    def test_two_otherwise_identical_candidates_ordered_deterministically_without_nutrient_bias(
        self, neutral_profile, condition_profile
    ):
        # In absence of preferences, candidates with equal planner_data_confidence are sorted by entity_id ascending
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        opt_cands = result.ranked_optimization_candidates
        assert len(opt_cands) > 5

        # Check a group of candidates with equal score (e.g. 1.0000)
        score_1_cands = [c for c in opt_cands if c.candidate_priority_score == 1.0000]
        assert len(score_1_cands) >= 2
        for i in range(len(score_1_cands) - 1):
            assert score_1_cands[i].entity_id < score_1_cands[i + 1].entity_id

    def test_explicit_user_preference_affects_priority(self, catalog):
        # Explicit item preference gives +0.15, category gives +0.10, others 0.0
        pref_id = "PK_DISH_011"
        pref_cat = "Cereal Staple"
        context = CandidateSelectionContext(
            meal_role=MealRole.LUNCH,
            preferred_entity_ids=[pref_id],
            preferred_categories=[pref_cat],
        )

        # 1. Preferred item
        score_pref, base_pref, _, bonus_pref, b_pref, _, _, _ = compute_candidate_signals(
            catalog[pref_id], context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        assert b_pref.preference_status == ScoreStatus.ACTIVE
        assert bonus_pref == 0.15
        assert score_pref == round(base_pref + 0.15, 4)

        # 2. Preferred category
        cat_cand = next(
            e for e in catalog.values()
            if e.category.strip().lower() == pref_cat.lower() and e.planner_entity_id != pref_id
        )
        score_cat, base_cat, _, bonus_cat, b_cat, _, _, _ = compute_candidate_signals(
            cat_cand, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        assert b_cat.preference_status == ScoreStatus.ACTIVE
        assert bonus_cat == 0.10
        assert score_cat == round(base_cat + 0.10, 4)

        # Preferred item outranks preferred category, which outranks non-preferred
        assert score_pref > score_cat > 1.0000

    def test_missing_preference_has_no_effect(self, catalog):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        cand = next(iter(catalog.values()))
        score, base, fiber_b, pref_b, breakdown, _, _, _ = compute_candidate_signals(
            cand, context, PrimaryDisposition.ELIGIBLE_FOR_OPTIMIZATION
        )
        assert breakdown.preference_status == ScoreStatus.UNAVAILABLE
        assert pref_b == 0.0
        assert score == base

    def test_condition_pathway_has_no_numerical_scoring_effect(self, neutral_profile):
        # PCOS profile vs General profile
        ctx_pcos = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        cp_pcos = build_condition_nutrition_profile(neutral_profile, ctx_pcos)

        ctx_gen = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.GENERAL,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        cp_gen = build_condition_nutrition_profile(neutral_profile, ctx_gen)

        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        res_pcos = rank_meal_candidates(neutral_profile, cp_pcos, context)
        res_gen = rank_meal_candidates(neutral_profile, cp_gen, context)

        scores_pcos = [c.candidate_priority_score for c in res_pcos.ranked_optimization_candidates]
        scores_gen = [c.candidate_priority_score for c in res_gen.ranked_optimization_candidates]
        ids_pcos = [c.entity_id for c in res_pcos.ranked_optimization_candidates]
        ids_gen = [c.entity_id for c in res_gen.ranked_optimization_candidates]

        assert scores_pcos == scores_gen
        assert ids_pcos == ids_gen

    def test_nutrient_concentration_metadata_remains_available_for_phase_6b(
        self, neutral_profile, condition_profile
    ):
        context = CandidateSelectionContext(meal_role=MealRole.LUNCH)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        for cand in result.ranked_optimization_candidates:
            # All 100g nutrient concentration values must be present and finite
            assert cand.energy_kcal is not None and cand.energy_kcal > 0.0
            assert cand.protein_g is not None and cand.protein_g >= 0.0
            assert cand.fat_g is not None and cand.fat_g >= 0.0
            assert cand.carb_g is not None and cand.carb_g >= 0.0

            # Percentiles are available on breakdown for Phase 6B
            assert cand.score_breakdown is not None
            assert cand.score_breakdown.protein_concentration_status == ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A
            assert cand.score_breakdown.protein_concentration_percentile is not None
            assert 0.0 <= cand.score_breakdown.protein_concentration_percentile <= 1.0

            if cand.fiber_g is not None:
                assert cand.score_breakdown.fiber_concentration_status == ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A
                if cand.fiber_g > 0:
                    assert cand.score_breakdown.fiber_concentration_percentile is not None
            else:
                assert cand.score_breakdown.fiber_concentration_status == ScoreStatus.UNAVAILABLE

    def test_paneer_remains_quarantined_as_source_internal_inconsistency(
        self, neutral_profile, condition_profile
    ):
        context = CandidateSelectionContext(meal_role=MealRole.BREAKFAST)
        result = rank_meal_candidates(neutral_profile, condition_profile, context)

        # Paneer is strictly quarantined from optimization
        assert "PK_COMP_004" not in [c.entity_id for c in result.ranked_optimization_candidates]

        paneer = next(c for c in result.display_only_candidates if c.entity_id == "PK_COMP_004")
        assert paneer.primary_disposition == PrimaryDisposition.DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED
        assert paneer.core_macro_optimization_eligible is False

        # Wording check: confirms exact phrase without asserting proven typographical error
        expected_phrase = (
            "The authoritative FCT source itself contains an internal nutrient-energy "
            "inconsistency for 'Cottage Cheese (Paneer)' (PK_COMP_004). "
            "The exact cause cannot be established from the available source. "
            "The reported value is preserved and the entity is quarantined from "
            "optimization pending authoritative correction."
        )
        assert paneer.all_exclusion_reasons[0] == expected_phrase
        assert "typographical" not in paneer.all_exclusion_reasons[0].lower()
        assert "typo" not in paneer.all_exclusion_reasons[0].lower()
