"""Meal/tests/test_hypogonadism_evidence.py - Unit tests for Male Hypogonadism Condition Evidence Profiles.

Verifies adult scoping, adolescent exclusion, screening vs diagnosis separation,
overweight-specific weight management applicability, and hard prohibition of testosterone claims.
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
def adult_male_normal_weight():
    user = UserNutritionProfile(
        age=32,
        sex_for_reference_equation="male",
        height_cm=178.0,
        weight_kg=72.0,  # BMI ~ 22.7 (Normal)
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def adult_male_higher_weight():
    user = UserNutritionProfile(
        age=35,
        sex_for_reference_equation="male",
        height_cm=175.0,
        weight_kg=92.0,  # BMI ~ 30.0 (Obese)
        pal_category=PALCategory.LOW_ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def adolescent_male():
    user = UserNutritionProfile(
        age=16,
        sex_for_reference_equation="male",
        height_cm=170.0,
        weight_kg=60.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


@pytest.fixture
def adult_female():
    user = UserNutritionProfile(
        age=28,
        sex_for_reference_equation="female",
        height_cm=165.0,
        weight_kg=60.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    return build_nutrition_target_profile(user)


class TestHypogonadismScreeningPathway:
    """Verifies screening pathway non-diagnostic boundary."""

    def test_screening_pathway_keeps_weight_rule_conditional(self, adult_male_higher_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adult_male_higher_weight, ctx)

        # Weight rule HYPOGONADISM_EBR_002 must be conditional only!
        eval_002 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "HYPOGONADISM_EBR_002")
        assert eval_002.applicability_status == ApplicabilityStatus.CONDITIONAL_CONTEXT_ONLY
        assert "HYPOGONADISM_EBR_002" in res.conditional_evidence_ids
        assert "HYPOGONADISM_EBR_002" not in res.applicable_evidence_ids

        # Diagnostic boundary rule HYPOGONADISM_CONTEXT_001 applies directly
        assert "HYPOGONADISM_CONTEXT_001" in res.applicable_evidence_ids

        # Safeguards apply directly
        assert "HYPOGONADISM_SAFEGUARD_001" in res.applicable_evidence_ids
        assert "HYPOGONADISM_SAFEGUARD_002" in res.applicable_evidence_ids

        assert "HYPOGONADISM_SCREENING_PATHWAY_CONTEXT" in res.explanation_tokens


class TestHypogonadismClinicianConfirmed:
    """Verifies adult clinician-confirmed hypogonadism activation matrix."""

    def test_confirmed_with_higher_weight_activates_weight_management(self, adult_male_higher_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
            evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
        )
        res = build_condition_nutrition_profile(adult_male_higher_weight, ctx)

        eval_002 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "HYPOGONADISM_EBR_002")
        assert eval_002.applicability_status == ApplicabilityStatus.DIRECTLY_APPLICABLE
        assert "HYPOGONADISM_EBR_002" in res.applicable_evidence_ids
        assert res.weight_management_relevance is True

    def test_confirmed_with_normal_weight_does_not_activate_weight_management(self, adult_male_normal_weight):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
            evidence_context_status=EvidenceContextStatus.CLINICIAN_CONFIRMED,
        )
        res = build_condition_nutrition_profile(adult_male_normal_weight, ctx)

        eval_002 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "HYPOGONADISM_EBR_002")
        assert eval_002.applicability_status == ApplicabilityStatus.NOT_APPLICABLE
        assert "HYPOGONADISM_EBR_002" not in res.applicable_evidence_ids
        assert res.weight_management_relevance is False


class TestHypogonadismAdolescentExclusion:
    """Verifies strict exclusion of adult hypogonadism guidance for adolescents."""

    def test_adolescent_hypogonadism_scope_unsupported(self, adolescent_male):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adolescent_male, ctx)

        assert res.condition_scope_supported is False
        assert any("UNSUPPORTED_CONDITION_EVIDENCE_AGE_SCOPE" in lim for lim in res.condition_limitations)
        assert "ADOLESCENT_MALE_HYPOGONADISM_SCOPE_UNSUPPORTED" in res.explanation_tokens

        # Adult clinical rules must be unsupported scope
        eval_001 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "HYPOGONADISM_CONTEXT_001")
        assert eval_001.applicability_status == ApplicabilityStatus.UNSUPPORTED_SCOPE

        eval_002 = next(e for e in res.rule_evaluations if e.rule.evidence_id == "HYPOGONADISM_EBR_002")
        assert eval_002.applicability_status == ApplicabilityStatus.UNSUPPORTED_SCOPE

        # Safeguard HYPOGONADISM_SAFEGUARD_003 applies directly to protect adolescent
        assert "HYPOGONADISM_SAFEGUARD_003" in res.applicable_evidence_ids


class TestHypogonadismDemographicsAndClaims:
    """Verifies sex demographic mismatch and claim validation."""

    def test_female_profile_in_hypogonadism_triggers_mismatch(self, adult_female):
        ctx = ConditionEvidenceContext(
            condition_pathway=ConditionPathway.MALE_HYPOGONADISM,
            evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
        )
        res = build_condition_nutrition_profile(adult_female, ctx)
        assert any("POPULATION_SCOPE_MISMATCH" in lim for lim in res.condition_limitations)

    def test_testosterone_claims_prohibited_and_safe_disclaimers_allowed(self):
        # Prohibited claims
        assert validate_claim_text("This recipe boosts testosterone naturally.").is_valid is False
        assert validate_claim_text("Our diet cures male hypogonadism.").is_valid is False
        assert validate_claim_text("Increase testosterone with this meal plan.").is_valid is False
        assert validate_claim_text("Because your screening was positive, lose weight to increase testosterone.").is_valid is False

        # Allowed disclaimers & negative assertions
        assert validate_claim_text("Dietary strategies cannot boost testosterone or cure hypogonadism.").is_valid is True
        assert validate_claim_text("BioPulse does not claim that any food boosts testosterone.").is_valid is True
        assert validate_claim_text("Weight management may be relevant if hypogonadism is clinically confirmed and higher weight is present.").is_valid is True
