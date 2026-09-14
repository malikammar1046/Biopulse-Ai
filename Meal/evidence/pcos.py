"""Meal/evidence/pcos.py - PCOS condition evidence evaluation module.

Evaluates PCOS evidence rules against user demographic, context status, and
weight context in accordance with the 2023 International PCOS Guidelines.
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


def evaluate_pcos_rules(
    profile: NutritionTargetProfile,
    context: ConditionEvidenceContext,
    rules: List[ConditionEvidenceRule],
) -> Tuple[List[RuleEvaluationResult], Dict[str, Any]]:
    """Evaluates registry rules for a PCOS user context."""
    user_sex = profile.sex_for_reference_equation.strip().lower()
    is_female = user_sex in ("female", "f")
    is_adolescent = profile.age_years_decimal < 19.0
    effective_age = profile.age_years_decimal

    is_confirmed = (context.evidence_context_status == EvidenceContextStatus.CLINICIAN_CONFIRMED)
    is_screening = (context.evidence_context_status == EvidenceContextStatus.SCREENING_PATHWAY)
    is_self_reported = (context.evidence_context_status == EvidenceContextStatus.SELF_REPORTED_DIAGNOSIS)
    is_unknown = (context.evidence_context_status == EvidenceContextStatus.UNKNOWN)

    # Check higher-weight context (adult only; adolescents must never have adult BMI categories applied)
    has_higher_weight = False
    if not is_adolescent and profile.bmi_interpretation in ("OVERWEIGHT", "OBESITY"):
        has_higher_weight = True

    evaluations: List[RuleEvaluationResult] = []
    applicable_ids: List[str] = []
    conditional_ids: List[str] = []
    active_effects: List[ImplementationEffect] = []

    healthy_eating_pri = False
    metabolic_health_pri = False
    sustainability_pri = False
    preference_alignment_pri = False
    weight_mgmt_rel = False

    limitations: List[str] = []
    warnings: List[str] = []
    explanation_tokens: List[str] = []

    # Demographics mismatch check
    if not is_female:
        limitations.append("CONDITION_EVIDENCE_POPULATION_SCOPE_MISMATCH: PCOS guidelines apply to female populations.")

    for rule in rules:
        if rule.condition.value != "PCOS":
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

        # If sex mismatch
        if not is_female:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.CONDITION_EVIDENCE_POPULATION_SCOPE_MISMATCH,
                    applicability_reason="User demographic does not match PCOS source target population.",
                )
            )
            continue

        # Age restrictions
        if rule.minimum_age is not None and effective_age < rule.minimum_age:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.UNSUPPORTED_SCOPE,
                    applicability_reason=f"User age {effective_age} is below rule minimum age {rule.minimum_age}.",
                )
            )
            continue

        if rule.maximum_age is not None and effective_age > rule.maximum_age:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.NOT_APPLICABLE,
                    applicability_reason=f"User age {effective_age} exceeds rule maximum age {rule.maximum_age}.",
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

        # Adult weight management rule requires confirmed condition AND higher weight
        if rule.requires_higher_weight_context:
            if is_adolescent:
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.UNSUPPORTED_SCOPE,
                        applicability_reason="Adult weight management evidence is not applied to adolescents.",
                    )
                )
                continue

            if not has_higher_weight:
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.NOT_APPLICABLE,
                        applicability_reason="Rule requires documented higher weight / overweight context.",
                    )
                )
                continue

            if is_confirmed:
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                        applicability_reason="Clinician-confirmed PCOS in adult with higher weight.",
                    )
                )
                applicable_ids.append(rule.evidence_id)
                active_effects.append(rule.implementation_effect)
                weight_mgmt_rel = True
            else:
                # Screening or self-reported: conditional only!
                evaluations.append(
                    RuleEvaluationResult(
                        rule=rule,
                        applicability_status=ApplicabilityStatus.CONDITIONAL_CONTEXT_ONLY,
                        applicability_reason="Conditional context: If PCOS is clinically confirmed and higher weight is present, modest weight management may be considered.",
                    )
                )
                conditional_ids.append(rule.evidence_id)
            continue

        # General guideline principles
        if is_screening:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                    applicability_reason="Directly applicable as non-diagnostic general healthy eating evidence context for PCOS screening pathway.",
                )
            )
            applicable_ids.append(rule.evidence_id)
            active_effects.append(rule.implementation_effect)
        elif is_self_reported:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                    applicability_reason="Applicable to self-reported PCOS context (retained as self-reported).",
                )
            )
            applicable_ids.append(rule.evidence_id)
            active_effects.append(rule.implementation_effect)
        elif is_confirmed:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                    applicability_reason="Directly applicable to clinician-confirmed PCOS profile.",
                )
            )
            applicable_ids.append(rule.evidence_id)
            active_effects.append(rule.implementation_effect)

        # Set priorities based on effect
        if rule.implementation_effect == ImplementationEffect.PRIORITIZE_HEALTHY_EATING:
            healthy_eating_pri = True
        elif rule.implementation_effect == ImplementationEffect.PRIORITIZE_METABOLIC_HEALTH:
            metabolic_health_pri = True
        elif rule.implementation_effect == ImplementationEffect.PRIORITIZE_SUSTAINABILITY:
            sustainability_pri = True
        elif rule.implementation_effect == ImplementationEffect.PRIORITIZE_PREFERENCE_ALIGNMENT:
            preference_alignment_pri = True

    # Explanation tokens and claims
    allowed_claims = [
        "No single dietary composition is proven superior for PCOS outcomes.",
        "Healthy eating consistent with general population guidelines is recommended.",
        "Metabolic health benefits occur from healthy dietary habits independently of weight loss.",
        "Dietary patterns should align with personal, cultural, and sustainability preferences.",
    ]
    if is_adolescent:
        allowed_claims.append("For adolescents, emphasis is on general health and prevention of excess weight gain rather than restrictive deficits.")
        explanation_tokens.append("ADOLESCENT_PCOS_HEALTHY_LIFESTYLE_FOCUS")

    prohibited_claims = [
        "Food X cures or reverses PCOS.",
        "Mandatory low-carbohydrate or ketogenic diet for PCOS.",
        "Hormone-balancing or insulin-sensitizing food therapy claims.",
        "Clinical diagnosis established solely by screening questionnaire or risk assessment.",
    ]

    if is_screening:
        explanation_tokens.append("PCOS_SCREENING_PATHWAY_CONTEXT")
    elif is_self_reported:
        explanation_tokens.append("PCOS_SELF_REPORTED_CONTEXT")
    elif is_confirmed:
        explanation_tokens.append("PCOS_CLINICIAN_CONFIRMED_CONTEXT")

    metadata = {
        "applicable_ids": applicable_ids,
        "conditional_ids": conditional_ids,
        "active_effects": list(dict.fromkeys(active_effects)),
        "healthy_eating_pri": healthy_eating_pri,
        "metabolic_health_pri": metabolic_health_pri,
        "sustainability_pri": sustainability_pri,
        "preference_alignment_pri": preference_alignment_pri,
        "weight_mgmt_rel": weight_mgmt_rel,
        "limitations": limitations,
        "warnings": warnings,
        "allowed_claims": allowed_claims,
        "prohibited_claims": prohibited_claims,
        "explanation_tokens": explanation_tokens,
    }
    return evaluations, metadata
