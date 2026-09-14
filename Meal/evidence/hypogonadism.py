"""Meal/evidence/hypogonadism.py - Male Hypogonadism condition evidence evaluation module.

Evaluates male hypogonadism evidence rules against user demographic, age scope,
context status, and weight context in accordance with EAU 2026 and Endocrine Society guidelines.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.schemas import (
    ApplicabilityStatus,
    ConditionEvidenceContext,
    ConditionEvidenceRule,
    EvidenceContextStatus,
    EvidenceKind,
    ImplementationEffect,
    RuleEvaluationResult,
)


def evaluate_hypogonadism_rules(
    profile: NutritionTargetProfile,
    context: ConditionEvidenceContext,
    rules: List[ConditionEvidenceRule],
) -> Tuple[List[RuleEvaluationResult], Dict[str, Any]]:
    """Evaluates registry rules for a Male Hypogonadism user context."""
    user_sex = profile.sex_for_reference_equation.strip().lower()
    is_male = user_sex in ("male", "m")
    is_adolescent = profile.age_years_decimal < 19.0
    effective_age = profile.age_years_decimal

    is_confirmed = (context.evidence_context_status == EvidenceContextStatus.CLINICIAN_CONFIRMED)
    is_screening = (context.evidence_context_status == EvidenceContextStatus.SCREENING_PATHWAY)
    is_self_reported = (context.evidence_context_status == EvidenceContextStatus.SELF_REPORTED_DIAGNOSIS)
    is_unknown = (context.evidence_context_status == EvidenceContextStatus.UNKNOWN)

    evaluations: List[RuleEvaluationResult] = []
    applicable_ids: List[str] = []
    conditional_ids: List[str] = []
    active_effects: List[ImplementationEffect] = []

    healthy_eating_pri = False
    metabolic_health_pri = False
    sustainability_pri = False
    preference_alignment_pri = False
    weight_mgmt_rel = False

    scope_supported = True
    limitations: List[str] = []
    warnings: List[str] = []
    explanation_tokens: List[str] = []

    # Sex check
    if not is_male:
        limitations.append("CONDITION_EVIDENCE_POPULATION_SCOPE_MISMATCH: Hypogonadism guidelines apply to male populations.")

    # Critical Adolescent Age-Scope Rule:
    # EAU adult hypogonadism guidelines must NOT be applied to adolescents (age < 19).
    if is_adolescent:
        scope_supported = False
        limitations.append("UNSUPPORTED_CONDITION_EVIDENCE_AGE_SCOPE: Adult male hypogonadism guidelines (EAU/Endocrine Society) do not apply to adolescents (age < 19).")
        warnings.append("Adolescent male hypogonadism / delayed puberty concerns require specialized pediatric endocrinology evaluation.")
        explanation_tokens.append("ADOLESCENT_MALE_HYPOGONADISM_SCOPE_UNSUPPORTED")

    # Higher weight context (adults only)
    has_higher_weight = False
    if not is_adolescent and profile.bmi_interpretation in ("OVERWEIGHT", "OBESITY"):
        has_higher_weight = True

    for rule in rules:
        if rule.condition.value != "MALE_HYPOGONADISM":
            continue

        # Safeguards always apply directly
        if rule.evidence_kind == EvidenceKind.BIOPULSE_IMPLEMENTATION_SAFEGUARD:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                    applicability_reason="BioPulse safety guardrail applied to protect neutral profile.",
                )
            )
            applicable_ids.append(rule.evidence_id)
            active_effects.append(rule.implementation_effect)
            continue

        # Sex mismatch
        if not is_male:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.CONDITION_EVIDENCE_POPULATION_SCOPE_MISMATCH,
                    applicability_reason="User demographic does not match Male Hypogonadism source target population.",
                )
            )
            continue

        # Adolescent exclusion for adult clinical guidance
        if is_adolescent:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.UNSUPPORTED_SCOPE,
                    applicability_reason="Adult male hypogonadism clinical evidence is not applicable to adolescents (age < 19).",
                )
            )
            continue

        # UNKNOWN context status
        if is_unknown:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.NOT_APPLICABLE,
                    applicability_reason="Context status UNKNOWN: condition-specific clinical evidence withheld.",
                )
            )
            continue

        # Overweight lifestyle/weight-management rule (HYPOGONADISM_EBR_002)
        if rule.requires_higher_weight_context:
            if not has_higher_weight:
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.NOT_APPLICABLE,
                        applicability_reason="Rule requires documented higher weight / overweight context in adult males.",
                    )
                )
                continue

            if is_confirmed:
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                        applicability_reason="Clinician-confirmed adult hypogonadism with documented overweight/obesity.",
                    )
                )
                applicable_ids.append(rule.evidence_id)
                active_effects.append(rule.implementation_effect)
                weight_mgmt_rel = True
            else:
                # Screening or self-reported: strictly conditional context!
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.CONDITIONAL_CONTEXT_ONLY,
                        applicability_reason="Conditional context: If hypogonadism is clinically confirmed and higher weight is present, lifestyle and weight management is an initial consideration.",
                    )
                )
                conditional_ids.append(rule.evidence_id)
            continue

        # Diagnostic boundary rule (HYPOGONADISM_CONTEXT_001)
        if rule.evidence_id == "HYPOGONADISM_CONTEXT_001":
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                    applicability_reason="Directly applicable to establish clinical diagnostic boundaries and prevent screening-to-diagnosis promotion.",
                )
            )
            applicable_ids.append(rule.evidence_id)
            active_effects.append(rule.implementation_effect)
            continue

        # General healthy eating context (HYPOGONADISM_CONTEXT_002)
        evaluations.append(
            RuleEvaluationResult(
                rule=rule,
                applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                applicability_reason="Directly applicable general healthy eating evidence context.",
            )
        )
        applicable_ids.append(rule.evidence_id)
        active_effects.append(rule.implementation_effect)
        healthy_eating_pri = True

    # Claims and explanation tokens
    allowed_claims = [
        "BioPulse screening considers potential hypogonadism risk but does not diagnose hypogonadism.",
        "Clinical diagnosis requires consistent symptoms plus unequivocally low morning serum testosterone confirmed on two separate occasions.",
        "A balanced, cardiometabolic-supportive dietary pattern is encouraged for general health.",
    ]
    if not is_adolescent and has_higher_weight and is_confirmed:
        allowed_claims.append("For men with confirmed hypogonadism and overweight/obesity, lifestyle modification aimed at weight loss is an evidence-supported initial management strategy.")

    prohibited_claims = [
        "Specific foods or diets boost testosterone or cure hypogonadism.",
        "Dietary therapy can substitute for clinical testosterone replacement therapy.",
        "Screening questionnaire alone establishes hypogonadism diagnosis.",
        "Lose weight to increase testosterone because screening was positive.",
    ]

    if is_screening:
        explanation_tokens.append("HYPOGONADISM_SCREENING_PATHWAY_CONTEXT")
    elif is_self_reported:
        explanation_tokens.append("HYPOGONADISM_SELF_REPORTED_CONTEXT")
    elif is_confirmed:
        explanation_tokens.append("HYPOGONADISM_CLINICIAN_CONFIRMED_CONTEXT")

    metadata = {
        "applicable_ids": applicable_ids,
        "conditional_ids": conditional_ids,
        "active_effects": list(dict.fromkeys(active_effects)),
        "healthy_eating_pri": healthy_eating_pri,
        "metabolic_health_pri": metabolic_health_pri,
        "sustainability_pri": sustainability_pri,
        "preference_alignment_pri": preference_alignment_pri,
        "weight_mgmt_rel": weight_mgmt_rel,
        "scope_supported": scope_supported,
        "limitations": limitations,
        "warnings": warnings,
        "allowed_claims": allowed_claims,
        "prohibited_claims": prohibited_claims,
        "explanation_tokens": explanation_tokens,
    }
    return evaluations, metadata
