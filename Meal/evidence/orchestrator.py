"""Meal/evidence/orchestrator.py - Public orchestrator for Phase 5B Condition Evidence Profiles.

Coordinates context validation, screening-model isolation, deep-copy snapshotting,
condition rule evaluation, claims validation, and output profile construction.
"""

from __future__ import annotations

import copy
from typing import Any, Dict, List

from Meal.engine.schemas import NutritionTargetProfile
from Meal.evidence.claims import validate_claim_text
from Meal.evidence.hypogonadism import evaluate_hypogonadism_rules
from Meal.evidence.pcos import evaluate_pcos_rules
from Meal.evidence.registry import get_evidence_registry
from Meal.evidence.schemas import (
    ApplicabilityStatus,
    ConditionEvidenceContext,
    ConditionEvidenceRule,
    ConditionNutritionProfile,
    ConditionPathway,
    EvidenceKind,
    ImplementationEffect,
    RuleEvaluationResult,
)

PROFILE_VERSION = "1.0.0"

# Explicit prohibited input attributes representing ML / SHAP / survey screening models
PROHIBITED_CONTEXT_ATTRIBUTES = [
    "screening_probability",
    "probability",
    "shap_values",
    "shap_importance",
    "tree_explainer",
    "adam_score",
    "adam_answers",
    "symptom_scores",
    "ml_model",
    "model",
]


def evaluate_general_rules(
    profile: NutritionTargetProfile,
    context: ConditionEvidenceContext,
    rules: List[ConditionEvidenceRule],
) -> tuple[List[RuleEvaluationResult], Dict[str, Any]]:
    """Evaluates general pathway rules."""
    evaluations: List[RuleEvaluationResult] = []
    applicable_ids: List[str] = []
    active_effects: List[ImplementationEffect] = []

    for rule in rules:
        if rule.condition == ConditionPathway.GENERAL:
            evaluations.append(
                RuleEvaluationResult(
                    rule=rule,
                    applicability_status=ApplicabilityStatus.DIRECTLY_APPLICABLE,
                    applicability_reason="General population nutrition evidence applies to all profiles.",
                )
            )
            applicable_ids.append(rule.evidence_id)
            active_effects.append(rule.implementation_effect)

    metadata = {
        "applicable_ids": applicable_ids,
        "conditional_ids": [],
        "active_effects": active_effects,
        "healthy_eating_pri": True,
        "metabolic_health_pri": False,
        "sustainability_pri": True,
        "preference_alignment_pri": True,
        "weight_mgmt_rel": False,
        "limitations": [],
        "warnings": [],
        "allowed_claims": [
            "Nutritional planning follows evidence-based population healthy diet guidance.",
            "Energy and macronutrient reference ranges are preserved from neutral assessment.",
        ],
        "prohibited_claims": [
            "Specific food or nutrient therapeutic claims.",
        ],
        "explanation_tokens": ["GENERAL_PATHWAY_CONTEXT"],
    }
    return evaluations, metadata


def build_condition_nutrition_profile(
    neutral_profile: NutritionTargetProfile,
    context: ConditionEvidenceContext,
) -> ConditionNutritionProfile:
    """Constructs a condition nutrition profile from a neutral profile and explicit context.
    
    Guarantees:
    - Zero calorie or macronutrient arithmetic
    - Strict screening-model isolation (rejects ML models, SHAP, ADAM scores)
    - Deep structural equality and numerical preservation via deep-copy snapshot
    - Defense-in-depth textual claim validation
    """
    if not isinstance(neutral_profile, NutritionTargetProfile):
        raise TypeError(f"neutral_profile must be a NutritionTargetProfile, got {type(neutral_profile)}")
    if not isinstance(context, ConditionEvidenceContext):
        raise TypeError(f"context must be a ConditionEvidenceContext, got {type(context)}")

    # Screening-model isolation check
    for attr in PROHIBITED_CONTEXT_ATTRIBUTES:
        if hasattr(context, attr) or (hasattr(context, "__dict__") and attr in context.__dict__):
            raise ValueError(f"Prohibited screening-model attribute '{attr}' detected in context. Condition layer must not inspect ML/SHAP data.")

    # Deep-copy neutral profile to ensure alias isolation
    isolated_neutral_profile = copy.deepcopy(neutral_profile)

    registry = get_evidence_registry()
    pathway = context.condition_pathway

    if pathway == ConditionPathway.PCOS:
        evaluations, meta = evaluate_pcos_rules(isolated_neutral_profile, context, registry.rules)
    elif pathway == ConditionPathway.MALE_HYPOGONADISM:
        evaluations, meta = evaluate_hypogonadism_rules(isolated_neutral_profile, context, registry.rules)
    elif pathway == ConditionPathway.GENERAL:
        evaluations, meta = evaluate_general_rules(isolated_neutral_profile, context, registry.rules)
    else:
        raise ValueError(f"Unsupported condition pathway: {pathway}")

    # Gather evidence sources for active/conditional rules
    sources: List[Dict[str, Any]] = []
    seen_sources = set()
    for ev in evaluations:
        if ev.applicability_status in {ApplicabilityStatus.DIRECTLY_APPLICABLE, ApplicabilityStatus.CONDITIONAL_CONTEXT_ONLY}:
            src_key = (ev.rule.source_title, ev.rule.source_section, ev.rule.source_year)
            if src_key not in seen_sources:
                seen_sources.add(src_key)
                sources.append({
                    "source_title": ev.rule.source_title,
                    "source_organization": ev.rule.source_organization,
                    "source_year": ev.rule.source_year,
                    "source_url": ev.rule.source_url,
                    "source_section": ev.rule.source_section,
                    "recommendation_number": ev.rule.source_recommendation_number,
                    "evidence_grade_raw": ev.rule.source_evidence_grade_raw,
                    "recommendation_strength_raw": ev.rule.source_recommendation_strength_raw,
                })

    # Validate all generated allowed claims
    validated_allowed_claims: List[str] = []
    for claim in meta.get("allowed_claims", []):
        res = validate_claim_text(claim)
        if not res.is_valid:
            raise ValueError(f"Internal error: Generated claim violates safety validation: {claim} ({res.violation_reason})")
        validated_allowed_claims.append(claim)

    warnings: List[str] = list(isolated_neutral_profile.warnings) + meta.get("warnings", [])

    # If Phase 5A marked planning not allowed, condition layer must preserve that limitation
    if not isolated_neutral_profile.automated_personalized_planning_allowed:
        warnings.append("Condition annotations cannot override clinician-guided nutrition requirement.")

    return ConditionNutritionProfile(
        profile_version=PROFILE_VERSION,
        registry_version=registry.registry_version,
        condition_pathway=pathway,
        evidence_context_status=context.evidence_context_status,
        neutral_profile=isolated_neutral_profile,
        preserve_phase5a_energy_target=True,
        preserve_phase5a_macro_targets=True,
        applicable_evidence_ids=meta.get("applicable_ids", []),
        conditional_evidence_ids=meta.get("conditional_ids", []),
        rule_evaluations=evaluations,
        implementation_effects=meta.get("active_effects", []),
        healthy_eating_priority=meta.get("healthy_eating_pri", False),
        metabolic_health_priority=meta.get("metabolic_health_pri", False),
        sustainability_priority=meta.get("sustainability_pri", False),
        preference_alignment_priority=meta.get("preference_alignment_pri", False),
        weight_management_relevance=meta.get("weight_mgmt_rel", False),
        condition_scope_supported=meta.get("scope_supported", True),
        condition_limitations=meta.get("limitations", []),
        allowed_claims=validated_allowed_claims,
        prohibited_claims=meta.get("prohibited_claims", []),
        evidence_sources=sources,
        warnings=warnings,
        explanation_tokens=meta.get("explanation_tokens", []),
    )
