"""Meal/planner/schemas.py - Data schemas and contracts for Phase 6A/6A.1 Candidate Filtering & Scoring.

Defines planner contexts, enums, evaluation outcomes, score breakdowns,
nutrition consistency metadata, and ranking results for the 71-entity Pakistani planner catalog.

Strict Invariants:
- CandidateSelectionContext contains planner-specific inputs ONLY (no upstream profiles).
- Meal role is a hard eligibility gate, NOT a weighted ranking score.
- No claim of daily target fit before portions exist in Phase 6B.
- Condition evidence context provides safe explanation tokens and guardrails,
  NEVER disease-specific numerical food score boosts.
- Stable base score derived from universally complete signals; optional fiber
  and preference provide bounded positive evidence bonuses without weight shifting.
- Missing fiber is UNAVAILABLE, never substituted with zero or weight-renormalized.
- Severe energy/macronutrient inconsistencies receive DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED.
- Primary disposition counts must sum exactly to 71.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from Meal.engine.schemas import SafetyOutcome


class MealRole(str, Enum):
    """Supported meal roles present in the locked 71-entity catalog."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"
    SIDE = "side"
    STAPLE = "staple"
    DESSERT = "dessert"
    BEVERAGE = "beverage"

    @classmethod
    def from_str(cls, value: str) -> MealRole:
        norm = value.strip().lower()
        for role in cls:
            if role.value == norm:
                return role
        raise ValueError(f"Unknown meal role: '{value}'. Supported roles: {[r.value for r in cls]}")


class PrimaryDisposition(str, Enum):
    """Deterministic, mutually exclusive primary disposition for every catalog entity.
    
    Precedence:
    1. HARD_SAFETY_EXCLUDED (allergen or dietary class safety exclusion)
    2. USER_EXCLUDED (explicit user dislike or requested exclusion)
    3. ROLE_INELIGIBLE (requested meal role not supported by entity)
    4. DISPLAY_ONLY_INCOMPLETE_CORE_MACROS (safe and role-valid, but missing core macro data)
    5. DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED (safe and role-valid, complete macros, but severe energy/macro inconsistency)
    6. ELIGIBLE_FOR_OPTIMIZATION (safe, role-valid, core macros complete, and nutrition consistent)
    """
    HARD_SAFETY_EXCLUDED = "HARD_SAFETY_EXCLUDED"
    USER_EXCLUDED = "USER_EXCLUDED"
    ROLE_INELIGIBLE = "ROLE_INELIGIBLE"
    DISPLAY_ONLY_INCOMPLETE_CORE_MACROS = "DISPLAY_ONLY_INCOMPLETE_CORE_MACROS"
    DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED = "DISPLAY_ONLY_NUTRITION_REVIEW_REQUIRED"
    ELIGIBLE_FOR_OPTIMIZATION = "ELIGIBLE_FOR_OPTIMIZATION"


class ScoreStatus(str, Enum):
    """Availability and usage status of an individual score component."""
    ACTIVE = "ACTIVE"
    UNAVAILABLE = "UNAVAILABLE"
    NOT_USED_FOR_NUMERICAL_RANKING = "NOT_USED_FOR_NUMERICAL_RANKING"
    DESCRIPTIVE_ONLY_PHASE_6A = "DESCRIPTIVE_ONLY_PHASE_6A"


class NutritionConsistencyStatus(str, Enum):
    """QA assessment status of reported energy vs macronutrient-derived energy."""
    CONSISTENT = "CONSISTENT"
    MINOR_DIFFERENCE = "MINOR_DIFFERENCE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_ASSESSABLE = "NOT_ASSESSABLE"


@dataclass(frozen=True)
class CandidateScoreBreakdown:
    """Transparent breakdown of portion-independent candidate ranking signals.
    
    In Phase 6A, numerical candidate_priority_score is based strictly on:
    - Planner Data Confidence (analytical/source readiness and consistency, not food quality)
    - Explicit User Preference Bonus (if supplied by user)
    
    Numerical Contract & Range:
    - candidate_priority_score ∈ [0.0, 1.15]
    - base_candidate_score (planner_data_confidence) ∈ [0.20, 1.00]
    - preference_bonus ∈ {0.00, 0.10, 0.15}
    - This is strictly a deterministic priority ranking metric, NEVER a probability or percentage.
    
    Nutrient concentrations (protein, fat, carbs, fiber, energy) are preserved as
    descriptive metadata (DESCRIPTIVE_ONLY_PHASE_6A) for Phase 6B portion optimization
    and do NOT influence candidate priority ranking in Phase 6A.
    """
    # Core ranking signals
    planner_data_confidence: float
    data_confidence_score: float  # alias
    preference_score: Optional[float]
    base_candidate_score: float
    preference_bonus: float
    candidate_priority_score: float

    # Optional bonuses (fiber bonus removed from generic ranking, permanently 0.0)
    fiber_bonus: float = 0.0

    # Descriptive nutrient metadata (DESCRIPTIVE_ONLY_PHASE_6A)
    protein_concentration_percentile: Optional[float] = None
    fiber_concentration_percentile: Optional[float] = None

    # Aliases for backwards compatibility
    @property
    def protein_concentration_signal(self) -> Optional[float]:
        return self.protein_concentration_percentile

    @property
    def fiber_concentration_signal(self) -> Optional[float]:
        return self.fiber_concentration_percentile

    @property
    def protein_density_signal(self) -> Optional[float]:
        return self.protein_concentration_percentile

    @property
    def fiber_density_signal(self) -> Optional[float]:
        return self.fiber_concentration_percentile

    # Component statuses
    planner_data_confidence_status: ScoreStatus = ScoreStatus.ACTIVE
    data_confidence_status: ScoreStatus = ScoreStatus.ACTIVE
    preference_status: ScoreStatus = ScoreStatus.ACTIVE
    protein_concentration_status: ScoreStatus = ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A
    fiber_concentration_status: ScoreStatus = ScoreStatus.DESCRIPTIVE_ONLY_PHASE_6A

    @property
    def protein_density_status(self) -> ScoreStatus:
        return self.protein_concentration_status

    @property
    def fiber_density_status(self) -> ScoreStatus:
        return self.fiber_concentration_status

    # Explicitly unavailable or unused components
    budget_score_status: ScoreStatus = ScoreStatus.UNAVAILABLE
    cooking_time_score_status: ScoreStatus = ScoreStatus.UNAVAILABLE
    cultural_fit_score_status: ScoreStatus = ScoreStatus.UNAVAILABLE
    condition_context_status: ScoreStatus = ScoreStatus.NOT_USED_FOR_NUMERICAL_RANKING

    # Numerical values for unavailable components remain None
    budget_score: Optional[float] = None
    cooking_time_score: Optional[float] = None
    cultural_fit_score: Optional[float] = None
    condition_context_score: Optional[float] = None


@dataclass(frozen=True)
class CandidateSelectionContext:
    """Planner-specific user inputs for candidate filtering and scoring.
    
    Strictly excludes upstream NutritionTargetProfile and ConditionNutritionProfile
    to prevent duplicate sources of truth.
    """
    meal_role: MealRole
    allergies: List[str] = field(default_factory=list)
    dietary_class: Optional[str] = None
    dislikes: List[str] = field(default_factory=list)
    requested_exclusions: List[str] = field(default_factory=list)
    preferred_entity_ids: List[str] = field(default_factory=list)
    preferred_categories: List[str] = field(default_factory=list)
    cultural_preferences: List[str] = field(default_factory=list)
    budget_preference: Optional[str] = None
    cooking_time_preference: Optional[str] = None

    def __post_init__(self):
        if not isinstance(self.meal_role, MealRole):
            raise TypeError(f"meal_role must be a MealRole enum, got {type(self.meal_role)}")

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> CandidateSelectionContext:
        """Strict dictionary deserializer that rejects any unknown fields."""
        allowed_keys = {
            "meal_role",
            "allergies",
            "dietary_class",
            "dislikes",
            "requested_exclusions",
            "preferred_entity_ids",
            "preferred_categories",
            "cultural_preferences",
            "budget_preference",
            "cooking_time_preference",
        }
        unknown_keys = set(data.keys()) - allowed_keys
        if unknown_keys:
            raise ValueError(f"Unknown or prohibited fields in CandidateSelectionContext: {sorted(unknown_keys)}")

        role_val = data.get("meal_role")
        if isinstance(role_val, str):
            role_enum = MealRole.from_str(role_val)
        elif isinstance(role_val, MealRole):
            role_enum = role_val
        else:
            raise TypeError(f"meal_role must be str or MealRole, got {type(role_val)}")

        return cls(
            meal_role=role_enum,
            allergies=list(data.get("allergies") or []),
            dietary_class=data.get("dietary_class"),
            dislikes=list(data.get("dislikes") or []),
            requested_exclusions=list(data.get("requested_exclusions") or []),
            preferred_entity_ids=list(data.get("preferred_entity_ids") or []),
            preferred_categories=list(data.get("preferred_categories") or []),
            cultural_preferences=list(data.get("cultural_preferences") or []),
            budget_preference=data.get("budget_preference"),
            cooking_time_preference=data.get("cooking_time_preference"),
        )


@dataclass(frozen=True)
class CandidateEvaluation:
    """Full evaluation record for an individual catalog entity."""
    entity_id: str
    display_name: str
    canonical_name: str
    category: str
    supported_meal_roles: List[str]
    requested_meal_role: MealRole

    # Deterministic disposition and safety
    primary_disposition: PrimaryDisposition
    hard_excluded: bool
    safety_primary_outcome: SafetyOutcome
    all_safety_outcomes: List[SafetyOutcome]
    all_exclusion_reasons: List[str]

    # Eligibility distinctions
    candidate_display_eligible: bool
    core_macro_optimization_eligible: bool
    recipe_instruction_available: bool

    # Source nutrient data snapshot (per 100g or portion)
    energy_kcal: Optional[float]
    protein_g: Optional[float]
    fat_g: Optional[float]
    carb_g: Optional[float]
    fiber_g: Optional[float]
    missing_macros: List[str]
    protein_concentration_percentile: Optional[float]
    fiber_concentration_percentile: Optional[float]

    # Nutrition consistency QA metadata
    reported_energy_kcal: Optional[float]
    macro_derived_energy_kcal: Optional[float]
    energy_macro_relative_difference: Optional[float]
    nutrition_consistency_status: NutritionConsistencyStatus

    # Scoring details (None for hard-excluded or role-ineligible entities)
    score_breakdown: Optional[CandidateScoreBreakdown]
    score_weights_used: Dict[str, float]
    available_score_components: List[str]
    unavailable_score_components: List[str]
    candidate_priority_score: Optional[float]
    base_candidate_score: Optional[float]
    fiber_bonus: Optional[float]
    preference_bonus: Optional[float]
    total_score: Optional[float]  # alias for candidate_priority_score

    # Context & Explainability
    explanation_tokens: List[str]
    applicable_condition_effects: List[str]
    evidence_ids_used: List[str]

    # Provenance
    planner_readiness: str
    nutrition_basis: str
    traceability_id: str


@dataclass(frozen=True)
class CandidateRankingResult:
    """Top-level immutable result of the candidate filtering and ranking pass."""
    requested_meal_role: MealRole
    total_catalog_entities: int

    # Exact disposition counts (sum must equal total_catalog_entities = 71)
    hard_safety_excluded_count: int
    user_excluded_count: int
    role_ineligible_count: int
    display_only_incomplete_count: int
    display_only_nutrition_review_count: int
    optimization_eligible_count: int

    # Disaggregated candidate lists
    ranked_optimization_candidates: List[CandidateEvaluation]
    display_only_candidates: List[CandidateEvaluation]
    excluded_candidates: List[CandidateEvaluation]

    # Role-specific invariant metadata (closure within role-supporting subset)
    raw_role_entity_count: int = 0
    role_supporting_hard_safety_excluded_count: int = 0
    role_supporting_user_excluded_count: int = 0

    # Active configuration
    scoring_version: str = "1.1.0"
    catalog_version: str = "1.0.0"
    condition_profile_version: str = "1.0.0"
    active_score_components: List[str] = field(default_factory=list)
    unavailable_global_components: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def verify_counts(self) -> bool:
        """Proves exact count closure: dispositions sum to total_catalog_entities."""
        return (
            self.hard_safety_excluded_count
            + self.user_excluded_count
            + self.role_ineligible_count
            + self.display_only_incomplete_count
            + self.display_only_nutrition_review_count
            + self.optimization_eligible_count
        ) == self.total_catalog_entities

    def verify_role_closure(self) -> bool:
        """Proves exact role closure: role-supporting dispositions sum to raw_role_entity_count."""
        return (
            self.role_supporting_hard_safety_excluded_count
            + self.role_supporting_user_excluded_count
            + self.display_only_incomplete_count
            + self.display_only_nutrition_review_count
            + self.optimization_eligible_count
        ) == self.raw_role_entity_count

    @property
    def downstream_role_valid_count(self) -> int:
        """Count of candidates supporting the requested role that survive past ROLE_INELIGIBLE."""
        return (
            self.display_only_incomplete_count
            + self.display_only_nutrition_review_count
            + self.optimization_eligible_count
        )
