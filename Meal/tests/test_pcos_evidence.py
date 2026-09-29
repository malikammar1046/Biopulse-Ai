"""Meal/tests/test_pcos_evidence.py - Unit tests for PCOS Condition Evidence Profiles.

Verifies evidence activation, adolescent scoping, screening vs diagnosis separation,
and absence of low-carb / keto / hormone-balancing mandates.
"""

import pytest

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.claims import validate_claim_text
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ApplicabilityStatus,
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
    ImplementationEffect,
)


@pytest.fixture
def adult_female_normal_weight():
    user = UserNutritionProfile(
        age=26,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=58.0,  # BMI ~ 21.3 (Normal)
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def adult_female_higher_weight():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=160.0,
        weight_kg=78.0,  # BMI ~ 30.5 (Obese)
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def adolescent_female():
    user = UserNutritionProfile(
        age=16,
        sex_for_reference_equation="female",
        height_cm=162.0,
        weight_kg=55.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def adult_male():
    user = UserNutritionProfile(
        age=30,
        sex_for_reference_equation="male",
        height_cm=175.0,
        weight_kg=75.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


class TestPCOSScreeningPathway:
    """Verifies PCOS screening pathway contract."""

    def test_screening_pathway_does_not_apply_treatment_style_recommendations_directly(
        self, adult_female_higher_weight
    ):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adult_female_higher_weight, ctx)

        # Adult weight management (PCOS_PP_006) must be conditional only!
        eval_006 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "PCOS_PP_006")
        assert eval_006.applicability_status == ApplicabilityStatus.CONDITIONAL_CONTEXT_ONLY
        assert "PCOS_PP_006" in res.conditional_evidence_ids
        assert "PCOS_PP_006" not in res.applicable_evidence_ids

        # General guideline evidence applies contextually
        assert "PCOS_EBR_001" in res.applicable_evidence_ids  # No superior diet
        assert "PCOS_CR_002" in res.applicable_evidence_ids   # Healthy eating
        assert "PCOS_EBR_004" in res.applicable_evidence_ids  # Metabolic health
        assert "PCOS_PP_003" in res.applicable_evidence_ids   # Flexible / preference-tailored
        assert "PCOS_PP_005" in res.applicable_evidence_ids   # Benefits independent of weight loss

        # Safeguards apply directly
        assert "PCOS_SAFEGUARD_001" in res.applicable_evidence_ids
        assert "PCOS_SAFEGUARD_002" in res.applicable_evidence_ids

        # Token indicates screening context
        assert "PCOS_SCREENING_PATHWAY_CONTEXT" in res.explanation_tokens

    def test_no_superior_diet_preserves_neutral_targets(self, adult_female_normal_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adult_female_normal_weight, ctx)

        assert ImplementationEffect.NO_SPECIFIC_DIET_SUPPORTED in res.implementation_effects
        assert ImplementationEffect.PRESERVE_NEUTRAL_TARGETS in res.implementation_effects
        assert res.healthy_eating_priority is True
        assert res.metabolic_health_priority is True


class TestPCOSDiagnosisContexts:
    """Verifies self-reported vs clinician-confirmed PCOS behavior."""

    def test_self_reported_retains_status_and_conditional_weight_rule(self, adult_female_higher_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SELF_REPORTED_DIAGNOSIS,
        )
        res = build_condition_nutrition_profile(adult_female_higher_weight, ctx)
        assert res.evidence_context_status == EvidenceContextStatus.SELF_REPORTED_DIAGNOSIS
        assert "PCOS_SELF_REPORTED_CONTEXT" in res.explanation_tokens

        # Clinical weight rule remains conditional
        eval_006 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "PCOS_PP_006")
        assert eval_006.applicability_status == ApplicabilityStatus.CONDITIONAL_CONTEXT_ONLY

    def test_clinician_confirmed_with_higher_weight_activates_weight_management(self, adult_female_higher_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
        )
        res = build_condition_nutrition_profile(adult_female_higher_weight, ctx)

        eval_006 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "PCOS_PP_006")
        assert eval_006.applicability_status == ApplicabilityStatus.DIRECTLY_APPLICABLE
        assert "PCOS_PP_006" in res.applicable_evidence_ids
        assert res.weight_management_relevance is True

    def test_clinician_confirmed_with_normal_weight_does_not_activate_weight_management(self, adult_female_normal_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
        )
        res = build_condition_nutrition_profile(adult_female_normal_weight, ctx)

        eval_006 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "PCOS_PP_006")
        assert eval_006.applicability_status == ApplicabilityStatus.NOT_APPLICABLE
        assert "PCOS_PP_006" not in res.applicable_evidence_ids
        assert res.weight_management_relevance is False


class TestPCOSAdolescentScoping:
    """Verifies adolescent-specific PCOS evidence routing."""

    def test_adolescent_activates_excess_weight_gain_prevention_rule(self, adolescent_female):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adolescent_female, ctx)

        # Adolescent rule PCOS_PP_009 is directly applicable
        eval_009 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "PCOS_PP_009")
        assert eval_009.applicability_status == ApplicabilityStatus.DIRECTLY_APPLICABLE
        assert "PCOS_PP_009" in res.applicable_evidence_ids
        assert ImplementationEffect.PREVENT_EXCESS_WEIGHT_GAIN_ADOLESCENT in res.implementation_effects

        # Adult weight management rule is unsupported scope
        eval_006 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "PCOS_PP_006")
        assert eval_006.applicability_status == ApplicabilityStatus.UNSUPPORTED_SCOPE

        assert "ADOLESCENT_PCOS_HEALTHY_LIFESTYLE_FOCUS" in res.explanation_tokens


class TestPCOSDemographicMismatchAndClaims:
    """Verifies demographic checks and claims validation for PCOS."""

    def test_male_profile_in_pcos_triggers_mismatch(self, adult_male):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.PCOS,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adult_male, ctx)
        assert any("POPULATION_SCOPE_MISMATCH" in lim for lim in res.condition_limitations)

    def test_claims_validation_allows_negations_and_rejects_positive_claims(self):
        # Prohibited positive claims
        assert validate_claim_text("Food X cures PCOS.").is_valid is False
        assert validate_claim_text("We recommend a hormone-balancing diet.").is_valid is False
        assert validate_claim_text("This insulin-sensitizing meal plan reverses PCOS.").is_valid is False

        # Allowed negative statements & safeguards
        assert validate_claim_text("BioPulse does not claim that any food cures PCOS.").is_valid is True
        assert validate_claim_text("No food is represented as curing PCOS.").is_valid is True
        assert validate_claim_text("No single dietary composition is proven superior for PCOS outcomes.").is_valid is True
