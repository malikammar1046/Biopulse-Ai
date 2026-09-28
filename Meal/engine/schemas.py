"""
BioPulse Personalized Nutrition Engine — Phase 5A Schemas
Framework-independent dataclasses and enums for neutral nutrition target calculation and safety.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any


class AgeGroup(str, Enum):
    ADOLESCENT = "ADOLESCENT"  # 12 to 18.99 years
    ADULT = "ADULT"            # 19+ years


class EERAgeBand(str, Enum):
    EER_12_TO_13_99 = "EER_12_TO_13_99"  # NASEM 2023 Table S-2: 3 to 13.99 y (sub-band 12–13.99)
    EER_14_TO_18_99 = "EER_14_TO_18_99"  # NASEM 2023 Table S-2: 14 to 18.99 y
    EER_19_PLUS = "EER_19_PLUS"          # NASEM 2023 Table S-3: 19+ y


class PALCategory(str, Enum):
    INACTIVE = "INACTIVE"
    LOW_ACTIVE = "LOW_ACTIVE"
    ACTIVE = "ACTIVE"
    VERY_ACTIVE = "VERY_ACTIVE"


class Goal(str, Enum):
    MAINTAIN = "MAINTAIN"
    HEALTHY_EATING = "HEALTHY_EATING"
    GRADUAL_WEIGHT_MANAGEMENT = "GRADUAL_WEIGHT_MANAGEMENT"


class DietaryClass(str, Enum):
    STANDARD = "STANDARD"
    VEGETARIAN = "VEGETARIAN"
    LACTO_VEGETARIAN = "LACTO_VEGETARIAN"
    OVO_LACTO_VEGETARIAN = "OVO_LACTO_VEGETARIAN"
    VEGAN = "VEGAN"
    PESCATARIAN = "PESCATARIAN"


class Allergen(str, Enum):
    """
    Allergens explicitly supported by master catalog metadata:
    known_contains_dairy, known_contains_egg, known_contains_fish,
    known_contains_wheat, known_contains_nuts.
    (Meat is NOT an allergen; animal products are handled under DietaryRestriction).
    """
    DAIRY = "DAIRY"
    EGG = "EGG"
    FISH = "FISH"
    WHEAT = "WHEAT"
    NUTS = "NUTS"


class DietaryRestriction(str, Enum):
    """
    Dietary restrictions for lifestyle and religious filtering.
    """
    MEAT = "MEAT"
    FISH = "FISH"
    DAIRY = "DAIRY"
    EGG = "EGG"
    ANIMAL_PRODUCTS = "ANIMAL_PRODUCTS"


class SafetyStatus(str, Enum):
    SAFE_FOR_AUTOMATED_PLANNING = "SAFE_FOR_AUTOMATED_PLANNING"
    REQUIRES_CLINICIAN_GUIDED_NUTRITION = "REQUIRES_CLINICIAN_GUIDED_NUTRITION"
    RESTRICTED_GUIDANCE_MODE = "RESTRICTED_GUIDANCE_MODE"


class SafetyOutcome(str, Enum):
    SAFE_FOR_AUTOMATED_PLANNING = "SAFE_FOR_AUTOMATED_PLANNING"
    EXCLUDED_KNOWN_ALLERGEN = "EXCLUDED_KNOWN_ALLERGEN"
    EXCLUDED_UNKNOWN_ALLERGEN_STATUS = "EXCLUDED_UNKNOWN_ALLERGEN_STATUS"
    EXCLUDED_DIETARY_CLASS = "EXCLUDED_DIETARY_CLASS"
    EXCLUDED_UNKNOWN_DIETARY_STATUS = "EXCLUDED_UNKNOWN_DIETARY_STATUS"
    EXCLUDED_USER_DISLIKE = "EXCLUDED_USER_DISLIKE"


class NutrientClassification(str, Enum):
    CORE_OPTIMIZATION_READY = "CORE_OPTIMIZATION_READY"
    SOFT_TARGET_ONLY = "SOFT_TARGET_ONLY"
    INSUFFICIENT_COVERAGE = "INSUFFICIENT_COVERAGE"


class TargetResolutionStatus(str, Enum):
    RESOLVED = "RESOLVED"
    REFERENCE_CONFLICT = "REFERENCE_CONFLICT"


@dataclass
class UserNutritionProfile:
    """
    User physiological, lifestyle, and preference input parameters.
    No PCOS or hypogonadism disease labels or SHAP screening features are permitted.
    """
    age: int
    sex_for_reference_equation: str  # "male" | "female"
    height_cm: float
    weight_kg: float
    pal_category: PALCategory
    age_years_decimal: Optional[float] = None
    goal: Goal = Goal.MAINTAIN
    meals_per_day: int = 3
    dietary_class: DietaryClass = DietaryClass.STANDARD
    food_allergies: List[Allergen] = field(default_factory=list)
    disliked_foods: List[str] = field(default_factory=list)
    pregnant: bool = False
    lactating: bool = False
    relevant_medical_nutrition_flags: List[str] = field(default_factory=list)
    pal_assignment_source: str = "USER_SELECTED"


@dataclass
class EnergyRequirementResult:
    """
    Deterministic EER output with complete equation provenance and input trace.
    """
    eer_kcal: float
    equation_source: str
    equation_table: str
    equation_id: str
    eer_age_band: EERAgeBand
    pal_category: PALCategory
    pal_assignment_source: str
    equation_text: str
    growth_allowance_kcal: float
    inputs: Dict[str, Any]


@dataclass
class NutrientTargetRange:
    """
    Macronutrient target range or micronutrient target specification.
    """
    nutrient: str
    target_min: Optional[float] = None
    target_max: Optional[float] = None
    unit: str = "g"
    reference_type: str = "AMDR"  # AMDR, RDA, AI
    source: str = "IOM/NASEM DRI"
    source_version: str = "2002/2005/2023"
    calculation_method: str = ""
    conflict_status: Optional[str] = None  # None or "TARGET_REFERENCE_CONFLICT"


@dataclass
class NutritionTargetProfile:
    """
    Consolidated, neutral nutrition target and safety profile.
    Framework-independent output of build_nutrition_target_profile().
    """
    profile_version: str
    age_years_decimal: float
    age_group: AgeGroup
    eer_age_band: EERAgeBand
    sex_for_reference_equation: str
    bmi_value: float
    bmi_interpretation: str  # "NOT_INTERPRETED_FOR_ADOLESCENT" or adult category

    # Energy targets & PAL
    eer_kcal: float
    energy_target_kcal: float
    pal_category: PALCategory
    pal_assignment_source: str
    eer_equation_source: str
    eer_equation_id: str

    # Carbohydrate references & targets
    carbohydrate_rda_g: float
    carbohydrate_amdr_min_g: float
    carbohydrate_amdr_max_g: float
    carbohydrate_target_min_g: Optional[float]
    carbohydrate_target_max_g: Optional[float]

    # Protein references & targets
    protein_rda_floor_g: float
    protein_amdr_min_g: float
    protein_amdr_max_g: float
    protein_target_min_g: Optional[float]
    protein_target_max_g: Optional[float]

    # Fat references & targets
    fat_amdr_min_g: float
    fat_amdr_max_g: float

    # Fiber references (official AI & energy density reference)
    fiber_ai_g: float
    fiber_ai_reference_type: str
    fiber_ai_source: str
    fiber_energy_density_reference_g: float
    fiber_energy_density_reference_type: str

    # Goal & weight management policy
    goal: Goal
    weight_management_policy_status: str
    target_resolution_status: TargetResolutionStatus = TargetResolutionStatus.RESOLVED
    nutrition_targets_optimization_ready: bool = False
    carbohydrate_conflict: Optional[str] = None
    protein_conflict: Optional[str] = None
    automatic_weight_loss_deficit: bool = False
    weight_management_adjustment_applied: bool = False

    # Safety status & flags
    safety_status: SafetyStatus = SafetyStatus.SAFE_FOR_AUTOMATED_PLANNING
    automated_personalized_planning_allowed: bool = True
    safety_flags: List[str] = field(default_factory=list)

    # Provenance, trace & warnings
    target_sources: Dict[str, str] = field(default_factory=dict)
    calculation_trace: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def age(self) -> float:
        return self.age_years_decimal

    @property
    def activity_category(self) -> str:
        return self.pal_category.value
