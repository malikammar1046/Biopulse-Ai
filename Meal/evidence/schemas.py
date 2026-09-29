"""Meal/evidence/schemas.py - Data schemas for Phase 5B Condition Evidence Profiles.

Defines enums, rule structures, context specifications, and output profiles
for PCOS and Male Hypogonadism condition evidence layers.

Strict invariant:
Phase 5B is strictly a semantic and evidence annotation layer.
It performs ZERO calorie or macronutrient arithmetic.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from Meal.engine.schemas import NutritionTargetProfile


class ConditionPathway(str, Enum):
    """Supported condition evidence pathways."""
    GENERAL = "GENERAL"
    PCOS = "PCOS"
    MALE_HYPOGONADISM = "MALE_HYPOGONADISM"


class EvidenceContextStatus(str, Enum):
    """Clinical / screening context status of the user."""
    SCREENING_PATHWAY = "SCREENING_PATHWAY"
    SELF_REPORTED_DIAGNOSIS = "SELF_REPORTED_DIAGNOSIS"
    CLINICIAN_CONFIRMED = "CLINICIAN_CONFIRMED"
    UNKNOWN = "UNKNOWN"


class ApplicabilityStatus(str, Enum):
    """Activation / applicability status of an individual evidence rule."""
    DIRECTLY_APPLICABLE = "DIRECTLY_APPLICABLE"
    CONDITIONAL_CONTEXT_ONLY = "CONDITIONAL_CONTEXT_ONLY"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNSUPPORTED_SCOPE = "UNSUPPORTED_SCOPE"
    CONDITION_EVIDENCE_POPULATION_SCOPE_MISMATCH = "CONDITION_EVIDENCE_POPULATION_SCOPE_MISMATCH"


class ImplementationEffect(str, Enum):
    """Controlled semantic effects of condition evidence rules."""
    PRESERVE_NEUTRAL_TARGETS = "PRESERVE_NEUTRAL_TARGETS"
    PRIORITIZE_HEALTHY_EATING = "PRIORITIZE_HEALTHY_EATING"
    PRIORITIZE_METABOLIC_HEALTH = "PRIORITIZE_METABOLIC_HEALTH"
    PRIORITIZE_SUSTAINABILITY = "PRIORITIZE_SUSTAINABILITY"
    PRIORITIZE_PREFERENCE_ALIGNMENT = "PRIORITIZE_PREFERENCE_ALIGNMENT"
    CONSIDER_WEIGHT_MANAGEMENT_CONTEXT = "CONSIDER_WEIGHT_MANAGEMENT_CONTEXT"
    PREVENT_EXCESS_WEIGHT_GAIN_ADOLESCENT = "PREVENT_EXCESS_WEIGHT_GAIN_ADOLESCENT"
    NO_SPECIFIC_DIET_SUPPORTED = "NO_SPECIFIC_DIET_SUPPORTED"
    NO_THERAPEUTIC_FOOD_CLAIMS = "NO_THERAPEUTIC_FOOD_CLAIMS"


class EvidenceKind(str, Enum):
    """Controlled classification of the rule kind.
    
    Distinguishes external clinical guideline recommendations and practice points
    from internal BioPulse safeguards.
    """
    CLINICAL_RECOMMENDATION = "CLINICAL_RECOMMENDATION"
    PRACTICE_POINT = "PRACTICE_POINT"
    GENERAL_EVIDENCE_CONTEXT = "GENERAL_EVIDENCE_CONTEXT"
    BIOPULSE_IMPLEMENTATION_SAFEGUARD = "BIOPULSE_IMPLEMENTATION_SAFEGUARD"


class EvidenceStrength(str, Enum):
    """Normalized evidence certainty / strength."""
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    VERY_LOW = "VERY_LOW"
    UNREPORTED = "UNREPORTED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class RecommendationStrength(str, Enum):
    """Normalized recommendation strength."""
    STRONG = "STRONG"
    CONDITIONAL = "CONDITIONAL"
    PRACTICE_POINT = "PRACTICE_POINT"
    UNREPORTED = "UNREPORTED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


@dataclass(frozen=True)
class ConditionEvidenceRule:
    """Represents an evidence-backed condition rule with full provenance."""
    evidence_id: str
    registry_version: str
    condition: ConditionPathway
    topic: str
    statement: str
    implementation_effect: ImplementationEffect
    evidence_kind: EvidenceKind
    evidence_strength: EvidenceStrength
    recommendation_strength: RecommendationStrength

    # Source-native grading preservation
    source_recommendation_type: str  # e.g., "EBR", "CR", "PP", "SAFEGUARD", "UNREPORTED"
    source_evidence_grade_raw: str   # e.g., "GRADE Moderate", "Level 2a", "UNREPORTED"
    source_recommendation_strength_raw: str  # e.g., "Strong recommendation", "Conditional", "UNREPORTED"
    source_recommendation_number: str  # e.g., "Rec 3.3.2", "Section 3.1", "UNREPORTED"

    # Source population applicability
    minimum_age: Optional[float]
    maximum_age: Optional[float]
    target_sex: Optional[str]  # "FEMALE", "MALE", "ANY"
    required_context_status: Optional[str]  # e.g. "CLINICIAN_CONFIRMED" or None for any
    requires_higher_weight_context: bool
    requires_confirmed_condition: bool
    population_description: str

    # Source citation metadata
    source_title: str
    source_organization: str
    source_year: int
    source_url: str
    source_section: str
    review_status: str  # e.g., "REVIEWED_ACTIVE"
    source_recommendation_section: Optional[str] = None
    notes: Optional[str] = None


@dataclass(frozen=True)
class RuleEvaluationResult:
    """Result of evaluating a single registry rule against a specific user context."""
    rule: ConditionEvidenceRule
    applicability_status: ApplicabilityStatus
    applicability_reason: str


@dataclass(frozen=True)
class ConditionEvidenceContext:
    """User context provided to the condition evidence layer.
    
    Must be explicitly specified; never inferred from screening scores,
    ADAM scores, SHAP values, or ML probabilities.
    """
    condition_pathway: ConditionPathway
    evidence_context_status: EvidenceContextStatus
    user_notes: Optional[str] = None

    def __post_init__(self) -> None:
        if not isinstance(self.condition_pathway, ConditionPathway):
            raise TypeError(f"condition_pathway must be a ConditionPathway enum, got {type(self.condition_pathway)}")
        if not isinstance(self.evidence_context_status, EvidenceContextStatus):
            raise TypeError(f"evidence_context_status must be an EvidenceContextStatus enum, got {type(self.evidence_context_status)}")


@dataclass
class ConditionNutritionProfile:
    """Output profile from the condition evidence layer.
    
    Wraps the neutral profile with condition-specific evidence annotations,
    semantic priorities, and guardrails without altering numerical targets.
    """
    profile_version: str
    registry_version: str
    condition_pathway: ConditionPathway
    evidence_context_status: EvidenceContextStatus

    # Immutable snapshot of the Phase 5A / 5A.1 profile
    neutral_profile: NutritionTargetProfile

    # Immutability flags
    preserve_phase5a_energy_target: bool = True
    preserve_phase5a_macro_targets: bool = True

    # Rule evaluation lists
    applicable_evidence_ids: List[str] = field(default_factory=list)
    conditional_evidence_ids: List[str] = field(default_factory=list)
    rule_evaluations: List[RuleEvaluationResult] = field(default_factory=list)
    implementation_effects: List[ImplementationEffect] = field(default_factory=list)

    # Semantic priorities
    healthy_eating_priority: bool = False
    metabolic_health_priority: bool = False
    sustainability_priority: bool = False
    preference_alignment_priority: bool = False
    weight_management_relevance: bool = False

    # Scope & limitation reporting
    condition_scope_supported: bool = True
    condition_limitations: List[str] = field(default_factory=list)

    # Claim governance
    allowed_claims: List[str] = field(default_factory=list)
    prohibited_claims: List[str] = field(default_factory=list)

    # Evidence sources and explanations
    evidence_sources: List[Dict[str, Any]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    explanation_tokens: List[str] = field(default_factory=list)
