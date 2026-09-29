"""Meal/composition/schemas.py - Data schemas and contracts for Phase 6C Single-Meal Generation.

Defines schemas, policies, execution contexts, meal item representations,
and generation outcomes for deterministic single-meal composition.

Strict Architectural Invariants:
1. Phase 6B Secondary Objective is strictly local diagnostic metadata and is
   NEVER used in the Phase 6C cross-combination ranking key.
2. The revised meal ranking key is:
   (feasibility_rank, primary_objective, -preference_coverage, canonical_combination_id).
3. Search defaults (min_items=1, max_items=4, max_combinations_evaluated=250)
   are engineering complexity limits, NOT dietary or clinical recommendations.
4. Recipe instruction availability distinguishes source-backed recipes from direct
   components needing no recipe, and never fabricates instructions.
5. Safety always wins over preference: invalid preferred entities are excluded,
   and Phase 6A safety exclusions are strictly inherited.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from Meal.composition.equivalence import DEFAULT_ENTITY_EQUIVALENCE_GROUPS
from Meal.optimizer.schemas import (
    NutrientDeviation,
    PortionConstraint,
    PortionOptimizationResult,
    PortionOptimizationStatus,
    PortionOptimizationTarget,
)
from Meal.planner.schemas import CandidateEvaluation, MealRole


class MealFeasibilityClass(str, Enum):
    """Categorization of a meal's mathematical feasibility against targets."""
    FEASIBLE = "FEASIBLE"
    OPTIMAL_WITH_TARGET_DEVIATIONS = "OPTIMAL_WITH_TARGET_DEVIATIONS"
    INFEASIBLE_UPSTREAM = "INFEASIBLE_UPSTREAM"


class SingleMealGenerationStatus(str, Enum):
    """Top-level status of the Phase 6C single-meal generation process."""
    FEASIBLE = "FEASIBLE"
    OPTIMAL_WITH_TARGET_DEVIATIONS = "OPTIMAL_WITH_TARGET_DEVIATIONS"
    NO_VALID_COMBINATION = "NO_VALID_COMBINATION"
    INVALID_REQUIRED_ENTITY = "INVALID_REQUIRED_ENTITY"
    INVALID_SEARCH_POLICY = "INVALID_SEARCH_POLICY"
    OPTIMIZER_FAILED = "OPTIMIZER_FAILED"


class PreferredEntityStatus(str, Enum):
    """Availability of caller-requested preferred entities within the Phase 6A pool."""
    AVAILABLE = "AVAILABLE"
    PARTIALLY_AVAILABLE = "PARTIALLY_AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"


class PreferredEntityClassification(str, Enum):
    """Classification of an individual requested preferred entity ID."""
    VALID_PREFERRED_ENTITY = "VALID_PREFERRED_ENTITY"
    NOT_IN_PHASE6A_POOL = "NOT_IN_PHASE6A_POOL"
    DUPLICATE = "DUPLICATE"
    UNKNOWN_ENTITY = "UNKNOWN_ENTITY"
    EXPLICITLY_EXCLUDED = "EXPLICITLY_EXCLUDED"


class RequiredEntityFailureReason(str, Enum):
    """Exact machine-readable reason for required entity validation failure."""
    REQUIRED_ENTITY_NOT_PHASE6A_ELIGIBLE = "REQUIRED_ENTITY_NOT_PHASE6A_ELIGIBLE"
    REQUIRED_ENTITY_EXPLICITLY_EXCLUDED = "REQUIRED_ENTITY_EXPLICITLY_EXCLUDED"
    REQUIRED_ENTITY_MISSING_PORTION_CONSTRAINT = "REQUIRED_ENTITY_MISSING_PORTION_CONSTRAINT"
    REQUIRED_ENTITY_COUNT_EXCEEDS_MAX_ITEMS = "REQUIRED_ENTITY_COUNT_EXCEEDS_MAX_ITEMS"
    CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE = "CONFLICTING_REQUIRED_ENTITY_EQUIVALENCE"


class RecipeCoverageStatus(str, Enum):
    """Overall meal-level recipe preparation coverage."""
    FULL = "FULL"
    PARTIAL = "PARTIAL"
    NONE = "NONE"


class ItemRecipeStatus(str, Enum):
    """Preparation instruction availability for an individual meal component."""
    SOURCE_RECIPE_AVAILABLE = "SOURCE_RECIPE_AVAILABLE"
    NO_RECIPE_REQUIRED_DIRECT_COMPONENT = "NO_RECIPE_REQUIRED_DIRECT_COMPONENT"
    NO_SOURCE_RECIPE_AVAILABLE = "NO_SOURCE_RECIPE_AVAILABLE"


class SelectionScope(str, Enum):
    """Scope of the search space covered during meal generation."""
    EXHAUSTIVE_SEARCH = "EXHAUSTIVE_SEARCH"
    TRUNCATED_SEARCH = "TRUNCATED_SEARCH"


@dataclass(frozen=True)
class PreferredEntityValidationRecord:
    """Record detailing the validation outcome of a requested preferred entity ID."""
    entity_id: str
    classification: PreferredEntityClassification
    reason: str


@dataclass(frozen=True)
class MealCombinationPolicy:
    """Policy governing combinatorial meal generation and search bounds.

    ENGINEERING NOTICE:
    These values control search complexity and computational limits.
    They are engineering parameters, NOT dietary or clinical recommendations.
    A meal with 4 items is not inherently healthier or more complete than a meal with 2 items.
    """
    minimum_items: int = 1
    maximum_items: int = 4
    maximum_combinations_evaluated: int = 250
    maximum_alternatives: int = 2
    equivalence_groups: Dict[str, Set[str]] = field(
        default_factory=lambda: {
            grp: set(members)
            for grp, members in DEFAULT_ENTITY_EQUIVALENCE_GROUPS.items()
        }
    )

    def __post_init__(self) -> None:
        if self.minimum_items < 1:
            raise ValueError(f"minimum_items must be >= 1, got {self.minimum_items}")
        if self.maximum_items < self.minimum_items:
            raise ValueError(
                f"maximum_items ({self.maximum_items}) must be >= minimum_items ({self.minimum_items})"
            )
        if self.maximum_combinations_evaluated < 1:
            raise ValueError(
                f"maximum_combinations_evaluated must be >= 1, got {self.maximum_combinations_evaluated}"
            )
        if self.maximum_alternatives < 0:
            raise ValueError(
                f"maximum_alternatives must be >= 0, got {self.maximum_alternatives}"
            )


@dataclass(frozen=True)
class SingleMealGenerationContext:
    """Caller-supplied context specifying requirements and preferences for a single meal."""
    meal_role: MealRole
    required_entity_ids: List[str] = field(default_factory=list)
    preferred_entity_ids: List[str] = field(default_factory=list)
    explicitly_excluded_ids: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class MealItem:
    """Representation of an individual food item within an optimized meal."""
    entity_id: str
    display_name: str
    optimized_grams: float
    standard_portion_grams: Optional[float]
    equivalent_standard_portions_display: Optional[float]
    standard_portion_label: Optional[str]
    energy_kcal: float
    protein_g: float
    fat_g: float
    carbohydrate_g: float
    fiber_g: Optional[float]
    fiber_status: str
    recipe_availability: ItemRecipeStatus
    recipe_instruction_available: bool  # Preserved for backward compatibility


@dataclass(frozen=True)
class SingleMealPlan:
    """Optimized meal plan for a single combination of compatible foods.

    IMPORTANT: The `secondary_objective` preserved here is Phase 6B diagnostic
    metadata only (reflecting within-combination portion deviation or gram tie-breaking).
    It MUST NOT be used for cross-combination meal ranking.
    """
    canonical_combination_id: str
    items: List[MealItem]
    total_energy_kcal: float
    total_protein_g: float
    total_fat_g: float
    total_carbohydrate_g: float
    total_fiber_g: Optional[float]
    fiber_coverage_status: str
    feasibility_class: MealFeasibilityClass
    primary_objective: float
    secondary_objective: float  # DIAGNOSTIC METADATA ONLY - NEVER USED IN RANKING
    secondary_objective_mode: Optional[str]
    target_deviations: Dict[str, NutrientDeviation]
    recipe_instruction_coverage_status: RecipeCoverageStatus
    item_recipe_availability: Dict[str, ItemRecipeStatus]
    matched_preferred_entity_count: int
    total_valid_preferred_entity_count: int
    preference_coverage: float
    optimization_status: PortionOptimizationStatus
    condition_annotations: List[str] = field(default_factory=list)

    @property
    def item_count(self) -> int:
        return len(self.items)

    @property
    def entity_ids(self) -> List[str]:
        return [item.entity_id for item in self.items]


@dataclass(frozen=True)
class SingleMealGenerationResult:
    """Top-level immutable result of the Phase 6C single-meal generation engine."""
    status: SingleMealGenerationStatus
    requested_meal_role: MealRole
    best_meal: Optional[SingleMealPlan]
    alternative_meals: List[SingleMealPlan]
    total_possible_combinations: int
    combinations_generated: int
    combinations_evaluated: int
    optimizer_success_count: int
    optimizer_rejected_count: int
    optimizer_rejections: Dict[str, str]
    search_truncated: bool
    search_exhaustive: bool
    selection_scope: SelectionScope
    preferred_entity_matches: int
    preferred_entity_ids_requested: List[str]
    valid_preferred_entity_ids: List[str]
    preferred_validation_records: List[PreferredEntityValidationRecord]
    preference_status: PreferredEntityStatus
    preference_coverage: float
    required_entity_failure_reason: Optional[RequiredEntityFailureReason] = None
    failure_details: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)

    @property
    def is_successful(self) -> bool:
        return self.status in (
            SingleMealGenerationStatus.FEASIBLE,
            SingleMealGenerationStatus.OPTIMAL_WITH_TARGET_DEVIATIONS,
        )
