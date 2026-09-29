"""Meal/evidence - BioPulse Condition Evidence Layer (Phase 5B).

Provides evidence-backed condition context, recommendations, and guardrails
for PCOS and Male Hypogonadism pathways while guaranteeing 100% numerical
immutability of neutral nutrition calculations.
"""

from Meal.evidence.claims import ClaimValidationResult, validate_claim_text
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.registry import (
    EvidenceRegistry,
    RegistryValidationError,
    get_evidence_registry,
    load_evidence_registry,
)
from Meal.evidence.schemas import (
    ApplicabilityStatus,
    ConditionEvidenceContext,
    ConditionEvidenceRule,
    ConditionNutritionProfile,
    ConditionPathway,
    EvidenceContextStatus,
    EvidenceKind,
    EvidenceStrength,
    ImplementationEffect,
    RecommendationStrength,
    RuleEvaluationResult,
)

__all__ = [
    "build_condition_nutrition_profile",
    "ConditionPathway",
    "EvidenceContextStatus",
    "ApplicabilityStatus",
    "ImplementationEffect",
    "EvidenceKind",
    "EvidenceStrength",
    "RecommendationStrength",
    "ConditionEvidenceRule",
    "RuleEvaluationResult",
    "ConditionEvidenceContext",
    "ConditionNutritionProfile",
    "EvidenceRegistry",
    "RegistryValidationError",
    "load_evidence_registry",
    "get_evidence_registry",
    "validate_claim_text",
    "ClaimValidationResult",
]
