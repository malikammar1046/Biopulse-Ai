"""
BioPulse Meal Engine — Phase 5A public API.
Exposes the neutral nutrition target pipeline.
"""

from .schemas import (
    UserNutritionProfile,
    NutritionTargetProfile,
    AgeGroup,
    EERAgeBand,
    Goal,
    PALCategory,
    SafetyStatus,
    SafetyOutcome,
    TargetResolutionStatus,
    NutrientClassification,
)
from .profile import validate_and_route_profile
from .energy import calculate_energy_requirement
from .nutrient_targets import calculate_nutrient_targets
from .orchestrator import build_nutrition_target_profile
from .safety import (
    apply_safety_filter,
    check_entity_allergen_safety,
    check_entity_dietary_safety,
    summarize_safety_filter_results,
    EntitySafetyResult,
)
from .nutrient_coverage import (
    nutrient_classifications,
    audit_entity_coverage,
    audit_coverage_set,
    audit_master_catalog,
    compute_joint_macro_eligibility,
    coverage_summary,
    EntityCoverageResult,
)

__all__ = [
    "SafetyOutcome",
    "TargetResolutionStatus",
    "NutrientClassification",
    "nutrient_classifications",
    # Schemas
    "UserNutritionProfile",
    "NutritionTargetProfile",
    "AgeGroup",
    "EERAgeBand",
    "Goal",
    "PALCategory",
    "SafetyStatus",
    # Orchestrator
    "build_nutrition_target_profile",
    # Profile
    "validate_and_route_profile",
    # Energy
    "calculate_energy_requirement",
    # Nutrient targets
    "calculate_nutrient_targets",
    # Safety
    "apply_safety_filter",
    "check_entity_allergen_safety",
    "check_entity_dietary_safety",
    "summarize_safety_filter_results",
    "EntitySafetyResult",
    # Coverage
    "audit_entity_coverage",
    "audit_coverage_set",
    "audit_master_catalog",
    "compute_joint_macro_eligibility",
    "coverage_summary",
    "EntityCoverageResult",
]
