"""Meal/optimizer/schemas.py - Data schemas and contracts for Phase 6B Portion Optimization.

Defines optimization targets, portion constraints, nutrient deviations, fiber summaries,
and top-level results for deterministic linear programming portion optimization.

Strict Invariants:
- Portion optimization requires an explicit caller-supplied PortionOptimizationTarget.
- Phase 6B does NOT invent meal-level calorie splits or standard portions.
- Every selected entity must have an explicit PortionConstraint with minimum_grams and maximum_grams.
- Phase 6B v1 supports continuous gram bounds only; discrete increments return
  DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED before solving.
- Objective normalization scales and weights are documented engineering choices,
  NEVER clinical recommendation strengths.
- Fiber is diagnostic/reporting metadata only in Phase 6B, completely excluded from
  the primary 4-dimensional (Energy, Protein, Carb, Fat) linear program.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from Meal.planner.schemas import MealRole


class SecondaryObjectiveMode(str, Enum):
    """Deterministic mode of the secondary lexicographic optimization pass."""
    PREFERENCE_DEVIATION = "PREFERENCE_DEVIATION"
    TOTAL_GRAMS_TIE_BREAKER = "TOTAL_GRAMS_TIE_BREAKER"


class PortionOptimizationStatus(str, Enum):
    """Deterministic outcome of the portion optimization pass."""
    OPTIMAL_WITHIN_ALL_TARGET_RANGES = "OPTIMAL_WITHIN_ALL_TARGET_RANGES"
    OPTIMAL_WITH_TARGET_DEVIATIONS = "OPTIMAL_WITH_TARGET_DEVIATIONS"
    INVALID_PORTION_CONSTRAINTS = "INVALID_PORTION_CONSTRAINTS"
    MISSING_PORTION_CONSTRAINT = "MISSING_PORTION_CONSTRAINT"
    DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED = "DISCRETE_PORTION_INCREMENT_NOT_SUPPORTED"
    AUTOMATED_PLANNING_NOT_ALLOWED = "AUTOMATED_PLANNING_NOT_ALLOWED"
    UNRESOLVED_NUTRITION_TARGETS = "UNRESOLVED_NUTRITION_TARGETS"
    INVALID_CANDIDATE = "INVALID_CANDIDATE"
    INVALID_TARGET_PROVENANCE = "INVALID_TARGET_PROVENANCE"
    SOLVER_FAILURE = "SOLVER_FAILURE"
    SECONDARY_SOLVER_FAILURE = "SECONDARY_SOLVER_FAILURE"


class NutrientTargetStatus(str, Enum):
    """Evaluation of an achieved nutrient total against its allowed target range."""
    WITHIN_RANGE = "WITHIN_RANGE"
    BELOW_RANGE = "BELOW_RANGE"
    ABOVE_RANGE = "ABOVE_RANGE"


class FiberCoverageStatus(str, Enum):
    """Data completeness of dietary fiber across the selected portion candidates."""
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"


class TargetScope(str, Enum):
    """Intended scope of the explicit portion optimization target."""
    CUSTOM_MEAL_TARGET = "CUSTOM_MEAL_TARGET"
    DAILY_TARGET = "DAILY_TARGET"
    FUTURE_PHASE6C_ALLOCATED_TARGET = "FUTURE_PHASE6C_ALLOCATED_TARGET"


@dataclass(frozen=True)
class PortionOptimizationTarget:
    """Explicit nutrition target ranges against which portion quantities are optimized.
    
    In Phase 6B, targets must be explicitly provided by the caller; Phase 6B does
    not invent meal-level percentages from daily targets.
    """
    target_energy_kcal: float
    energy_tolerance_kcal: float = 0.0

    protein_min_g: float = 0.0
    protein_max_g: float = 0.0

    carbohydrate_min_g: float = 0.0
    carbohydrate_max_g: float = 0.0

    fat_min_g: float = 0.0
    fat_max_g: float = 0.0

    fiber_reference_g: Optional[float] = None
    target_scope: TargetScope = TargetScope.CUSTOM_MEAL_TARGET
    target_source: str = "caller_supplied"

    @property
    def energy_min_kcal(self) -> float:
        return max(0.0, self.target_energy_kcal - self.energy_tolerance_kcal)

    @property
    def energy_max_kcal(self) -> float:
        return self.target_energy_kcal + self.energy_tolerance_kcal


@dataclass(frozen=True)
class PortionConstraint:
    """Explicit bounds and optimization guidance for an individual food candidate.
    
    Standard portion metadata is loaded directly from the locked catalog/source
    and cannot be caller-overridden.
    """
    entity_id: str
    minimum_grams: float
    maximum_grams: float
    constraint_source: str = "caller_supplied"
    preferred_grams: Optional[float] = None
    increment_grams: Optional[float] = None


@dataclass(frozen=True)
class NutrientDeviation:
    """Detailed comparison of an achieved nutrient total against its target range."""
    nutrient: str
    achieved: float
    target_min: float
    target_max: float
    status: NutrientTargetStatus
    absolute_deviation: float  # 0.0 if within range, negative if below min, positive if above max
    normalized_deviation: float  # |absolute_deviation| / scale (0.0 if within range)
    normalization_scale: float

    @property
    def target_status(self) -> NutrientTargetStatus:
        return self.status


@dataclass(frozen=True)
class MealFiberResult:
    """Transparent aggregation of dietary fiber preserving unknown upstream values."""
    coverage_status: FiberCoverageStatus
    known_fiber_total_g: Optional[float]
    total_entity_count: int
    fiber_coverage_entity_count: int
    fiber_missing_entity_ids: List[str]
    target_reference_g: Optional[float] = None

    @property
    def known_fiber_contribution_g(self) -> Optional[float]:
        return self.known_fiber_total_g

    @property
    def missing_fiber_entity_ids(self) -> List[str]:
        return self.fiber_missing_entity_ids


@dataclass(frozen=True)
class OptimizedPortion:
    """Portion quantities and scaled nutrient contributions for an individual food."""
    entity_id: str
    display_name: str
    optimized_grams: float

    # Standard portion representations
    standard_portion_grams: Optional[float]
    equivalent_standard_portions_exact: Optional[float]
    equivalent_standard_portions_display: Optional[float]
    standard_portion_label: Optional[str]

    # Constraints applied
    minimum_grams: float
    maximum_grams: float
    preferred_grams: Optional[float]

    # Scaled nutrients (full floating-point precision)
    energy_kcal: float
    protein_g: float
    fat_g: float
    carbohydrate_g: float
    fiber_g: Optional[float]
    fiber_status: str

    # Provenance
    constraint_source: str
    nutrition_source: str
    traceability: str

    @property
    def food_item_name(self) -> str:
        return self.display_name

    @property
    def grams(self) -> float:
        return self.optimized_grams


@dataclass(frozen=True)
class PortionOptimizationResult:
    """Top-level immutable result of the portion optimization pass."""
    status: PortionOptimizationStatus
    selected_entity_ids: List[str]
    optimized_portions: List[OptimizedPortion]

    target: Optional[PortionOptimizationTarget]
    achieved_energy_kcal: Optional[float]
    achieved_protein_g: Optional[float]
    achieved_carbohydrate_g: Optional[float]
    achieved_fat_g: Optional[float]
    fiber_result: Optional[MealFiberResult]

    energy_target_deviation: Optional[NutrientDeviation]
    protein_target_deviation: Optional[NutrientDeviation]
    carbohydrate_target_deviation: Optional[NutrientDeviation]
    fat_target_deviation: Optional[NutrientDeviation]

    all_core_targets_within_range: bool

    # Objective and engineering weights
    objective_value: Optional[float]
    objective_components: Dict[str, float]
    objective_weights_used: Dict[str, float]
    objective_normalization_scales: Dict[str, float]

    # Phase 6A provenance context
    source_meal_role: Optional[MealRole]
    source_candidate_scoring_version: Optional[str]
    source_catalog_version: Optional[str]

    # Solver diagnostics
    solver_name: str
    solver_version: str
    solver_status: str
    solver_message: str

    secondary_objective_mode: Optional[SecondaryObjectiveMode] = None
    warnings: List[str] = field(default_factory=list)
    trace: List[str] = field(default_factory=list)

    @property
    def optimization_status(self) -> PortionOptimizationStatus:
        return self.status

    @property
    def explanation_notes(self) -> str:
        return " | ".join(self.warnings)

    @property
    def primary_objective_value(self) -> Optional[float]:
        return self.objective_value

    @property
    def secondary_objective_value(self) -> Optional[float]:
        if "secondary_preference_deviation" in self.objective_components:
            return self.objective_components["secondary_preference_deviation"]
        return self.objective_components.get("secondary_tie_breaker_total_grams", 0.0)

    @property
    def secondary_objective_recomputed(self) -> Optional[float]:
        return self.objective_components.get("secondary_objective_recomputed")

    @property
    def secondary_objective_solver(self) -> Optional[float]:
        return self.objective_components.get("secondary_objective_solver")

    @property
    def nutrient_deviations(self) -> Dict[str, Optional[NutrientDeviation]]:
        return {
            "energy": self.energy_target_deviation,
            "protein": self.protein_target_deviation,
            "carbohydrate": self.carbohydrate_target_deviation,
            "fat": self.fat_target_deviation,
        }

    @property
    def meal_nutrients(self) -> Dict[str, Any]:
        class _NutrientVal:
            def __init__(self, value, unit):
                self.value = value
                self.unit = unit
        return {
            "energy": _NutrientVal(self.achieved_energy_kcal or 0.0, "kcal"),
            "protein": _NutrientVal(self.achieved_protein_g or 0.0, "g"),
            "carbohydrate": _NutrientVal(self.achieved_carbohydrate_g or 0.0, "g"),
            "fat": _NutrientVal(self.achieved_fat_g or 0.0, "g"),
        }

    @property
    def solver_diagnostics(self) -> Dict[str, Any]:
        return {
            "iterations": int(self.solver_status.split(":")[1]) if ":" in self.solver_status else 0,
            "status": self.solver_status,
            "message": self.solver_message,
        }
