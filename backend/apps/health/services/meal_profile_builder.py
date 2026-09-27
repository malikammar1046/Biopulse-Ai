"""
backend/apps/health/services/meal_profile_builder.py

Translates BioPulse user profile and auth metadata into Meal engine inputs:
- Validates readiness with graded issues (BLOCKING, WARNING, OPTIONAL).
- Normalizes food allergies, intolerances, and dietary patterns via nutrition_vocabularies.
- Separates food allergies from non-food medical/environmental allergies (Penicillin, Latex, etc.).
- Builds CanonicalNutritionProfile as the single authoritative backend profile.
- Bridges to Meal.engine.schemas.UserNutritionProfile for NASEM calculation.
- Builds ConditionEvidenceContext for Phase 5B condition evidence.

Strict Invariants:
1. Minimum age is 12 (NASEM adolescent band starts at 12).
2. Reference-equation sex is isolated to 2023 NASEM EER.
3. Gender alone never activates condition evidence.
4. Missing or unconfirmed food allergy status is BLOCKING.
5. Non-food allergies (Penicillin, Latex, Pollen) are safely ignored and do NOT block food planning.
6. Unsupported food allergens lacking verified catalog metadata (e.g. shellfish, soy) remain fail-closed.
7. Dietary restrictions (Vegetarian, Vegan, Pescatarian, Halal Omnivore) are hard constraints.
8. Missing preference fields (favorites, dislikes, budget) produce WARNINGS, never BLOCKING errors.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Set, Tuple

from apps.health.nutrition_vocabularies import (
    ALLERGEN_DISPLAY_LABELS,
    CanonicalAllergen,
    CanonicalIntolerance,
    DietaryPattern,
    is_known_non_food_allergen,
    normalize_dietary_pattern,
    normalize_food_allergens,
    normalize_food_intolerances,
    validate_budget_tier,
    validate_cooking_time_preference,
    validate_meals_per_day,
)
try:
    from Meal.engine.schemas import (
        Allergen,
        DietaryClass,
        Goal,
        PALCategory,
        UserNutritionProfile,
    )
    from Meal.evidence.schemas import (
        ConditionEvidenceContext,
        ConditionPathway,
        EvidenceContextStatus,
    )
    HAS_MEAL_MODULE = True
except (ImportError, ModuleNotFoundError):
    HAS_MEAL_MODULE = False
    Allergen = None
    DietaryClass = None
    Goal = None
    PALCategory = None
    UserNutritionProfile = None
    ConditionEvidenceContext = None
    ConditionPathway = None
    EvidenceContextStatus = None

logger = logging.getLogger(__name__)

if HAS_MEAL_MODULE:
    # Catalog-supported allergen mapping to Meal.engine Allergen enum
    # Production catalog currently provides complete structured metadata for:
    # dairy, egg, fish, wheat, nuts (peanuts & tree nuts).
    ENGINE_ALLERGEN_MAP: Dict[str, Any] = {
        CanonicalAllergen.MILK.value: Allergen.DAIRY,
        CanonicalAllergen.EGG.value: Allergen.EGG,
        CanonicalAllergen.FISH.value: Allergen.FISH,
        CanonicalAllergen.WHEAT.value: Allergen.WHEAT,
        CanonicalAllergen.PEANUT.value: Allergen.NUTS,
        CanonicalAllergen.TREE_NUT.value: Allergen.NUTS,
        "dairy": Allergen.DAIRY,
        "milk": Allergen.DAIRY,
        "egg": Allergen.EGG,
        "eggs": Allergen.EGG,
        "fish": Allergen.FISH,
        "wheat": Allergen.WHEAT,
        "nuts": Allergen.NUTS,
        "peanut": Allergen.NUTS,
        "peanuts": Allergen.NUTS,
    }
else:
    ENGINE_ALLERGEN_MAP = {}

# Supported food allergens that the current master catalog has complete column coverage for
CATALOG_COVERED_ALLERGENS: Set[str] = {
    CanonicalAllergen.MILK.value,
    CanonicalAllergen.EGG.value,
    CanonicalAllergen.FISH.value,
    CanonicalAllergen.WHEAT.value,
    CanonicalAllergen.PEANUT.value,
    CanonicalAllergen.TREE_NUT.value,
}

# Known unsupported food allergens that catalog metadata currently cannot guarantee 100% absence for
KNOWN_UNSUPPORTED_FOOD_ALLERGENS: Set[str] = {
    CanonicalAllergen.SHELLFISH.value,
    CanonicalAllergen.SOY.value,
    CanonicalAllergen.SESAME.value,
    "shellfish",
    "shrimp",
    "crab",
    "lobster",
    "prawn",
    "soy",
    "soya",
    "sesame",
    "mustard",
    "celery",
    "lupin",
    "mollusc",
    "molluscs",
    "sulfite",
    "sulfites",
}

if HAS_MEAL_MODULE:
    # Activity level mapping (categorical 2023 NASEM equations)
    ACTIVITY_MAP: Dict[str, Any] = {
        "sedentary": PALCategory.INACTIVE,
        "inactive": PALCategory.INACTIVE,
        "light": PALCategory.LOW_ACTIVE,
        "low_active": PALCategory.LOW_ACTIVE,
        "moderate": PALCategory.ACTIVE,
        "active": PALCategory.ACTIVE,
        "very_active": PALCategory.VERY_ACTIVE,
    }

    # Supported dietary pattern to Meal.engine DietaryClass mapping
    DIETARY_CLASS_MAP: Dict[Any, Any] = {
        DietaryPattern.OMNIVORE: DietaryClass.STANDARD,
        DietaryPattern.HALAL_OMNIVORE: DietaryClass.STANDARD,
        DietaryPattern.VEGETARIAN: DietaryClass.VEGETARIAN,
        DietaryPattern.VEGAN: DietaryClass.VEGAN,
        DietaryPattern.PESCATARIAN: DietaryClass.PESCATARIAN,
    }
else:
    ACTIVITY_MAP = {}
    DIETARY_CLASS_MAP = {}


@dataclass
class CanonicalNutritionProfile:
    """
    Single authoritative backend representation of all user nutrition parameters.
    Combines physiological biometrics, safety constraints, dietary pattern, and preferences.
    """
    user_id: str

    # Core physiology
    sex: str  # "female" | "male"
    pathway: str  # "female" | "male" | "general"
    age: int
    age_years_decimal: float
    height_cm: float
    weight_kg: float
    bmi: float
    activity_level: str

    # Goal
    weight_goal: str

    # Hard safety restrictions
    food_allergies: List[str]      # CanonicalAllergen values
    food_intolerances: List[str]   # CanonicalIntolerance values
    dietary_pattern: DietaryPattern

    # Preferences
    favorite_ingredients: List[str] = field(default_factory=list)
    disliked_ingredients: List[str] = field(default_factory=list)
    preferred_cuisines: List[str] = field(default_factory=lambda: ["pakistani"])
    budget_tier: str = "medium"
    cooking_time_preference: str = "moderate"
    meals_per_day: int = 4

    # Optional / reserved metadata for future personalization
    previous_meal_ids: List[str] = field(default_factory=list)
    favorite_meal_ids: List[str] = field(default_factory=list)
    rejected_meal_ids: List[str] = field(default_factory=list)

    def to_engine_user_nutrition_profile(self) -> UserNutritionProfile:
        """
        Bridges cleanly to Meal.engine.schemas.UserNutritionProfile for NASEM EER calculation.
        """
        pal_cat = ACTIVITY_MAP.get(self.activity_level.strip().lower(), PALCategory.ACTIVE)

        resolved_goal = Goal.MAINTAIN
        clean_goal = self.weight_goal.strip().lower()
        if "loss" in clean_goal or "weight management" in clean_goal or "gradual" in clean_goal:
            resolved_goal = Goal.GRADUAL_WEIGHT_MANAGEMENT
        elif "eating" in clean_goal or "healthy" in clean_goal:
            resolved_goal = Goal.HEALTHY_EATING

        diet_cls = DIETARY_CLASS_MAP.get(self.dietary_pattern, DietaryClass.STANDARD)

        # Map canonical food allergies to engine Allergen enum
        engine_allergies: List[Allergen] = []
        for a in self.food_allergies:
            mapped = ENGINE_ALLERGEN_MAP.get(a)
            if mapped and mapped not in engine_allergies:
                engine_allergies.append(mapped)

        # Gluten intolerance adds wheat exclusion if not already present
        dislikes = list(self.disliked_ingredients)
        if CanonicalIntolerance.GLUTEN.value in self.food_intolerances and "wheat" not in dislikes:
            dislikes.append("wheat")
        if CanonicalIntolerance.LACTOSE.value in self.food_intolerances and "dairy" not in dislikes:
            dislikes.append("dairy")

        return UserNutritionProfile(
            age=self.age,
            sex_for_reference_equation=self.sex,
            height_cm=self.height_cm,
            weight_kg=self.weight_kg,
            pal_category=pal_cat,
            age_years_decimal=self.age_years_decimal,
            goal=resolved_goal,
            meals_per_day=self.meals_per_day,
            dietary_class=diet_cls,
            food_allergies=engine_allergies,
            disliked_foods=dislikes,
            pregnant=False,
            lactating=False,
            pal_assignment_source="USER_SELECTED",
        )


@dataclass
class NutritionReadinessResult:
    """
    Graded readiness response container.
    Distinguishes BLOCKING issues (prevent plan generation) from WARNINGS and OPTIONAL items.
    """
    ready: bool
    blocking_issues: List[str] = field(default_factory=list)
    warning_issues: List[str] = field(default_factory=list)
    optional_issues: List[str] = field(default_factory=list)
    required_biometrics: Dict[str, Any] = field(default_factory=dict)
    safety_confirmations: Dict[str, Any] = field(default_factory=dict)
    planning_inputs: Dict[str, Any] = field(default_factory=dict)
    optional_personalization: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)

    @property
    def overall_status(self) -> str:
        if self.ready:
            return "WARNINGS" if self.warning_issues else "READY"
        return "NOT_READY"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ready": self.ready,
            "overall_status": self.overall_status,
            "blocking_issues": self.blocking_issues,
            "warning_issues": self.warning_issues,
            "optional_issues": self.optional_issues,
            "required_biometrics": self.required_biometrics,
            "safety_confirmations": self.safety_confirmations,
            "planning_inputs": self.planning_inputs,
            "optional_personalization": self.optional_personalization,
            "warnings": self.warnings,
        }


def calculate_age_and_decimal(dob: date | str) -> Tuple[int, float]:
    """Calculates integer age and decimal age from date of birth."""
    if isinstance(dob, str):
        dob = datetime.strptime(dob, "%Y-%m-%d").date()
    today = date.today()
    if dob > today:
        raise ValueError("Date of birth cannot be in the future.")
    days = (today - dob).days
    decimal_age = round(days / 365.2425, 4)
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return years, decimal_age


class MealProfileBuilder:
    """
    Builds validated, normalized CanonicalNutritionProfile and evaluates graded readiness.
    """

    @staticmethod
    def check_nutrition_readiness(
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
    ) -> NutritionReadinessResult:
        """
        Evaluates readiness classifying issues into BLOCKING, WARNING, and OPTIONAL.
        """
        raw_meta = raw_user_meta_data or {}
        profile = profile_data or {}

        blocking_issues: List[str] = []
        warning_issues: List[str] = []
        optional_issues: List[str] = []

        missing_biometrics = []
        missing_safety = []
        missing_planning = []
        warnings = []

        # ----------------------------------------------------------------------
        # 1. REQUIRED BIOMETRICS (BLOCKING)
        # ----------------------------------------------------------------------
        dob_val = profile.get("date_of_birth") or raw_meta.get("date_of_birth")
        decimal_age: Optional[float] = None
        int_age: Optional[int] = None
        if not dob_val:
            missing_biometrics.append("date_of_birth")
            blocking_issues.append("Date of birth is required for metabolic target calculation.")
        else:
            try:
                int_age, decimal_age = calculate_age_and_decimal(dob_val)
                if int_age < 12:
                    missing_biometrics.append("minimum_age_12_required")
                    blocking_issues.append(
                        f"BioPulse nutrition planning requires a minimum age of 12 years (current age: {int_age})."
                    )
            except Exception as e:
                missing_biometrics.append("date_of_birth_invalid")
                blocking_issues.append(f"Invalid date of birth format: {e}")

        # Height cm
        height_cm = profile.get("height_cm") or raw_meta.get("height_cm")
        try:
            if height_cm is None or float(height_cm) <= 0:
                missing_biometrics.append("height_cm")
                blocking_issues.append("Height is required for energy requirement calculations.")
        except (ValueError, TypeError):
            missing_biometrics.append("height_cm")
            blocking_issues.append("Height must be a valid positive number.")

        # Weight kg
        weight_kg = profile.get("weight_kg") or raw_meta.get("weight_kg")
        try:
            if weight_kg is None or float(weight_kg) <= 0:
                missing_biometrics.append("weight_kg")
                blocking_issues.append("Weight is required for energy requirement calculations.")
        except (ValueError, TypeError):
            missing_biometrics.append("weight_kg")
            blocking_issues.append("Weight must be a valid positive number.")

        # Reference-equation sex
        gender_raw = raw_meta.get("gender") or profile.get("gender")
        if not gender_raw or str(gender_raw).strip().lower() not in ("female", "male"):
            missing_biometrics.append("reference_equation_sex")
            blocking_issues.append(
                "Reference-equation biological sex ('female' or 'male') is required for NASEM equations."
            )

        # ----------------------------------------------------------------------
        # 2. FOOD SAFETY & ALLERGY STATUS (BLOCKING)
        # ----------------------------------------------------------------------
        # Check dedicated food_allergies first, then fallback to general allergies
        food_allergies_val = profile.get("food_allergies")
        allergies_val = profile.get("allergies")
        if allergies_val is None and "allergies" in raw_meta:
            allergies_val = raw_meta.get("allergies")

        allergy_input_present = (food_allergies_val is not None) or (allergies_val is not None)

        if not allergy_input_present:
            missing_safety.append("allergy_confirmation")
            blocking_issues.append("Food allergy confirmation is missing (must confirm allergies or select 'None').")
        else:
            raw_to_check = food_allergies_val if (food_allergies_val is not None and len(food_allergies_val) > 0) else allergies_val
            if raw_to_check is None and food_allergies_val is not None:
                raw_to_check = food_allergies_val

            # Empty list is treated as unconfirmed/unanswered -> FAIL
            if isinstance(raw_to_check, list) and len(raw_to_check) == 0:
                missing_safety.append("allergy_confirmation")
                blocking_issues.append("Food allergy status cannot be empty. Please confirm allergies or select 'None'.")
            else:
                canonical, non_food, unmapped = normalize_food_allergens(raw_to_check)

                # Check if user entered explicit 'none'
                str_repr = str(raw_to_check).strip().lower()
                is_explicit_none = str_repr in ("none", "no allergies", "no known allergies", "['none']", "[\"none\"]")

                if not is_explicit_none and not canonical and not non_food and unmapped:
                    # Unrecognized allergy string that is neither food nor non-food
                    missing_safety.append("unsupported_allergen_requires_manual_review")
                    blocking_issues.append(
                        f"Unrecognized allergy '{', '.join(unmapped)}' requires clinical review before meal planning."
                    )
                else:
                    # Check for unsupported food allergens lacking catalog coverage
                    unsupported_food = [a for a in canonical if a not in CATALOG_COVERED_ALLERGENS]
                    if unsupported_food:
                        missing_safety.append("unsupported_allergen_requires_manual_review")
                        blocking_issues.append(
                            f"Automated planning is blocked because your specified food allergy '{', '.join(unsupported_food)}' "
                            "cannot be guaranteed excluded by the verified production catalog."
                        )

        # ----------------------------------------------------------------------
        # 3. DIETARY PATTERN (BLOCKING)
        # ----------------------------------------------------------------------
        dietary_raw = (
            profile.get("dietary_pattern")
            or profile.get("dietary_preference")
            or raw_meta.get("dietary_preference")
        )
        if not dietary_raw or not str(dietary_raw).strip():
            missing_safety.append("dietary_preference_confirmation")
            blocking_issues.append("Dietary pattern is required (cannot default to unrestricted).")
        else:
            norm_diet = normalize_dietary_pattern(dietary_raw)
            if norm_diet is None:
                missing_safety.append("dietary_preference_confirmation")
                blocking_issues.append(
                    f"Unsupported or unknown dietary pattern '{dietary_raw}'. Please select a valid dietary pattern."
                )

        # ----------------------------------------------------------------------
        # 4. ACTIVITY LEVEL (BLOCKING)
        # ----------------------------------------------------------------------
        activity_raw = profile.get("activity_level") or raw_meta.get("activity_level")
        activity_status = "FAIL"
        if not activity_raw or not str(activity_raw).strip():
            missing_planning.append("activity_level")
            blocking_issues.append("Activity level is required to determine physical activity level multiplier.")
        else:
            clean_act = str(activity_raw).strip().lower().replace(" ", "_").replace("-", "_")
            if clean_act in ACTIVITY_MAP:
                activity_status = "CONFIRMED"
            else:
                missing_planning.append("activity_level")
                blocking_issues.append(f"Unsupported activity level '{activity_raw}'.")

        # ----------------------------------------------------------------------
        # 5. PREFERENCES: WARNINGS (Non-blocking)
        # ----------------------------------------------------------------------
        favorite_ingredients = profile.get("favorite_ingredients") or []
        if not favorite_ingredients:
            warning_issues.append("No favorite ingredients selected; meal recommendations will use standard variety.")

        disliked_ingredients = profile.get("disliked_ingredients") or []
        if not disliked_ingredients:
            warning_issues.append("No disliked ingredients specified.")

        budget_tier = profile.get("budget_tier")
        if not budget_tier:
            warning_issues.append("Budget tier not specified; defaulting to medium.")

        # ----------------------------------------------------------------------
        # 6. OPTIONAL PERSONALIZATION (Non-blocking)
        # ----------------------------------------------------------------------
        preferred_cuisines = profile.get("preferred_cuisines") or []
        if not preferred_cuisines:
            optional_issues.append("Preferred cuisine not set; defaulting to Pakistani dishes.")

        cooking_time = profile.get("cooking_time_preference")
        if not cooking_time:
            optional_issues.append("Cooking time preference not set; defaulting to moderate.")

        # Aggregate statuses for backward compatibility
        biometrics_status = "PASS" if len(missing_biometrics) == 0 else "FAIL"
        safety_status = "PASS" if len(missing_safety) == 0 else "FAIL"
        planning_status = "PASS" if len(missing_planning) == 0 else "FAIL"

        ready = (len(blocking_issues) == 0)

        # Legacy warnings list includes non-blocking warnings plus any blocking notices
        all_warnings = list(warnings)
        if len(blocking_issues) > 0:
            all_warnings.extend(blocking_issues)

        return NutritionReadinessResult(
            ready=ready,
            blocking_issues=blocking_issues,
            warning_issues=warning_issues,
            optional_issues=optional_issues,
            required_biometrics={
                "status": biometrics_status,
                "missing": missing_biometrics,
            },
            safety_confirmations={
                "status": safety_status,
                "missing": missing_safety,
            },
            planning_inputs={
                "status": planning_status,
                "activity_status": activity_status,
                "missing": missing_planning,
            },
            optional_personalization={
                "cycle_phase": profile.get("period_regularity"),
                "water_target_glasses": profile.get("daily_water_glasses", 8),
                "budget_tier": budget_tier or "medium",
                "meals_per_day": profile.get("meals_per_day", 4),
            },
            warnings=all_warnings,
        )

    @staticmethod
    def build_canonical_nutrition_profile(
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
    ) -> CanonicalNutritionProfile:
        """
        Builds the single authoritative CanonicalNutritionProfile from profile & auth metadata.
        Raises ValueError if any BLOCKING requirement is missing.
        """
        raw_meta = raw_user_meta_data or {}
        profile = profile_data or {}

        # 1. Date of birth and age
        dob_val = profile.get("date_of_birth") or raw_meta.get("date_of_birth")
        if not dob_val:
            raise ValueError("date_of_birth is required for nutrition planning.")
        int_age, decimal_age = calculate_age_and_decimal(dob_val)
        if int_age < 12:
            raise ValueError(f"Minimum supported age is 12 years (current age: {int_age}).")

        # 2. Reference equation sex
        gender_raw = raw_meta.get("gender") or profile.get("gender")
        if not gender_raw or str(gender_raw).strip().lower() not in ("female", "male"):
            raise ValueError("reference_equation_sex must be 'female' or 'male'.")
        sex = str(gender_raw).strip().lower()

        # 3. Pathway
        pathway_raw = raw_meta.get("pathway") or profile.get("pathway", "female")
        clean_pathway = str(pathway_raw).strip().lower()
        if clean_pathway in ("female", "female_pcos"):
            pathway = clean_pathway
        elif clean_pathway in ("male", "male_hypogonadism"):
            pathway = clean_pathway
        else:
            pathway = clean_pathway or "general"

        # 4. Biometrics & BMI
        height_val = profile.get("height_cm") or raw_meta.get("height_cm")
        if height_val is None or float(height_val) <= 0:
            raise ValueError("height_cm must be greater than zero.")
        height_cm = float(height_val)

        weight_val = profile.get("weight_kg") or raw_meta.get("weight_kg")
        if weight_val is None or float(weight_val) <= 0:
            raise ValueError("weight_kg must be greater than zero.")
        weight_kg = float(weight_val)

        bmi = round(weight_kg / ((height_cm / 100.0) ** 2), 2)

        # 5. Activity level
        act_val = profile.get("activity_level") or raw_meta.get("activity_level")
        if not act_val:
            raise ValueError("activity_level is required for nutrition planning.")
        clean_act = str(act_val).strip().lower().replace(" ", "_").replace("-", "_")
        if clean_act not in ACTIVITY_MAP:
            raise ValueError(f"Unsupported activity_level: {act_val}")

        # 6. Weight goal
        goal_val = profile.get("primary_goal") or raw_meta.get("goal") or profile.get("goal") or "Maintain"
        weight_goal = str(goal_val).strip()

        # 7. Food allergies (dedicated column first, then normalized legacy allergies)
        food_allergies_val = profile.get("food_allergies")
        allergies_val = profile.get("allergies")
        if allergies_val is None and "allergies" in raw_meta:
            allergies_val = raw_meta.get("allergies")

        if food_allergies_val is None and allergies_val is None:
            raise ValueError("Allergy status must be confirmed (cannot be null/unanswered).")

        raw_allergies = food_allergies_val if food_allergies_val is not None else allergies_val
        if isinstance(raw_allergies, list) and len(raw_allergies) == 0:
            raise ValueError("Allergy status must be confirmed (cannot be empty list).")

        canonical_allergens, non_food, unmapped = normalize_food_allergens(raw_allergies)

        # Verify no unsupported food allergens block planning
        unsupported = [a for a in canonical_allergens if a not in CATALOG_COVERED_ALLERGENS]
        if unsupported:
            raise ValueError(f"Unsupported food allergy '{', '.join(unsupported)}' cannot be verified for exclusion.")
        if unmapped and not canonical_allergens and not non_food:
            str_repr = str(raw_allergies).strip().lower()
            if str_repr not in ("none", "no allergies", "no known allergies", "['none']", "[\"none\"]"):
                raise ValueError(f"Unmapped allergy '{', '.join(unmapped)}' requires clinical review.")

        # 8. Food Intolerances
        intolerances_val = profile.get("food_intolerances") or raw_meta.get("food_intolerances") or []
        canonical_intolerances, _ = normalize_food_intolerances(intolerances_val)

        # 9. Dietary pattern
        diet_val = (
            profile.get("dietary_pattern")
            or profile.get("dietary_preference")
            or raw_meta.get("dietary_preference")
        )
        if not diet_val or not str(diet_val).strip():
            raise ValueError("dietary_pattern is required.")
        norm_diet = normalize_dietary_pattern(diet_val)
        if norm_diet is None:
            raise ValueError(f"Unsupported dietary pattern '{diet_val}'.")

        # Automatically record gluten/lactose intolerance if specified in diet string
        clean_diet_str = str(diet_val).strip().lower()
        if "gluten" in clean_diet_str and CanonicalIntolerance.GLUTEN.value not in canonical_intolerances:
            canonical_intolerances.append(CanonicalIntolerance.GLUTEN.value)
        if "dairy" in clean_diet_str and CanonicalIntolerance.LACTOSE.value not in canonical_intolerances:
            canonical_intolerances.append(CanonicalIntolerance.LACTOSE.value)

        # 10. Preferences & planning settings
        fav_ingredients = profile.get("favorite_ingredients") or []
        disliked_ingredients = profile.get("disliked_ingredients") or []
        preferred_cuisines = profile.get("preferred_cuisines") or ["pakistani"]
        budget_tier = validate_budget_tier(profile.get("budget_tier"))
        cooking_time = validate_cooking_time_preference(profile.get("cooking_time_preference"))
        meals_per_day = validate_meals_per_day(profile.get("meals_per_day"))

        return CanonicalNutritionProfile(
            user_id=user_id,
            sex=sex,
            pathway=pathway,
            age=int_age,
            age_years_decimal=decimal_age,
            height_cm=height_cm,
            weight_kg=weight_kg,
            bmi=bmi,
            activity_level=clean_act,
            weight_goal=weight_goal,
            food_allergies=canonical_allergens,
            food_intolerances=canonical_intolerances,
            dietary_pattern=norm_diet,
            favorite_ingredients=fav_ingredients,
            disliked_ingredients=disliked_ingredients,
            preferred_cuisines=preferred_cuisines,
            budget_tier=budget_tier,
            cooking_time_preference=cooking_time,
            meals_per_day=meals_per_day,
        )

    @staticmethod
    def build_user_nutrition_profile(
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
    ) -> UserNutritionProfile:
        """
        Builds the framework-independent UserNutritionProfile for Phase 5A by first
        building the authoritative CanonicalNutritionProfile.
        """
        canonical = MealProfileBuilder.build_canonical_nutrition_profile(
            user_id=user_id,
            raw_user_meta_data=raw_user_meta_data,
            profile_data=profile_data,
        )
        return canonical.to_engine_user_nutrition_profile()

    @staticmethod
    def build_condition_evidence_context(
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
        active_assessment_module: Optional[str] = None,
    ) -> ConditionEvidenceContext:
        """
        Builds the ConditionEvidenceContext for Phase 5B condition evidence.
        """
        raw_meta = raw_user_meta_data or {}
        profile = profile_data or {}

        pathway_raw = raw_meta.get("pathway") or profile.get("pathway", "general")
        clean_pathway = str(pathway_raw).strip().lower()

        if clean_pathway in ("female", "female_pcos"):
            pathway = ConditionPathway.PCOS
        elif clean_pathway in ("male", "male_hypogonadism"):
            pathway = ConditionPathway.MALE_HYPOGONADISM
        else:
            pathway = ConditionPathway.GENERAL

        clean_assessment = str(active_assessment_module).strip().lower() if active_assessment_module else ""
        if pathway == ConditionPathway.PCOS and clean_assessment == "female_pcos":
            evidence_status = EvidenceContextStatus.SCREENING_PATHWAY
        elif pathway == ConditionPathway.MALE_HYPOGONADISM and clean_assessment == "male_hypogonadism":
            evidence_status = EvidenceContextStatus.SCREENING_PATHWAY
        else:
            evidence_status = EvidenceContextStatus.UNKNOWN

        return ConditionEvidenceContext(
            condition_pathway=pathway,
            evidence_context_status=evidence_status,
        )
