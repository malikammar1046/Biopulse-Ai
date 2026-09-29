"""Meal/composition - Deterministic Single-Meal Composition & Generation (Phase 6C).

Coordinates vetted Phase 6A candidate pools, explicit caller nutrition targets,
allowable portion constraints, and user preferences into mathematically feasible,
fully portion-optimized single meals with deterministic ranking.
"""

from Meal.composition.combinations import (
    calculate_total_possible_combinations,
    classify_preferred_entities,
    generate_and_order_combinations,
    validate_required_entities,
    validate_search_policy,
)
from Meal.composition.equivalence import (
    DEFAULT_ENTITY_EQUIVALENCE_GROUPS,
    find_conflicting_equivalence_entities,
    get_entity_equivalence_group,
    map_to_preference_concepts,
    validate_combination_equivalence,
)
from Meal.composition.orchestrator import generate_single_meal
from Meal.composition.ranking import (
    assemble_single_meal_plan,
    classify_item_recipe_status,
    compute_meal_ranking_key,
    compute_meal_recipe_coverage,
)
from Meal.composition.schemas import (
    ItemRecipeStatus,
    MealCombinationPolicy,
    MealFeasibilityClass,
    MealItem,
    PreferredEntityClassification,
    PreferredEntityStatus,
    PreferredEntityValidationRecord,
    RecipeCoverageStatus,
    RequiredEntityFailureReason,
    SelectionScope,
    SingleMealGenerationContext,
    SingleMealGenerationResult,
    SingleMealGenerationStatus,
    SingleMealPlan,
)

__all__ = [
    "generate_single_meal",
    "MealCombinationPolicy",
    "SingleMealGenerationContext",
    "SingleMealPlan",
    "MealItem",
    "SingleMealGenerationResult",
    "MealFeasibilityClass",
    "SingleMealGenerationStatus",
    "PreferredEntityStatus",
    "PreferredEntityClassification",
    "PreferredEntityValidationRecord",
    "RequiredEntityFailureReason",
    "RecipeCoverageStatus",
    "ItemRecipeStatus",
    "SelectionScope",
    "validate_search_policy",
    "validate_required_entities",
    "classify_preferred_entities",
    "calculate_total_possible_combinations",
    "generate_and_order_combinations",
    "assemble_single_meal_plan",
    "compute_meal_ranking_key",
    "classify_item_recipe_status",
    "compute_meal_recipe_coverage",
    "DEFAULT_ENTITY_EQUIVALENCE_GROUPS",
    "get_entity_equivalence_group",
    "find_conflicting_equivalence_entities",
    "validate_combination_equivalence",
    "map_to_preference_concepts",
]
