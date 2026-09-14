"""
backend/apps/health/services/meal_profile_builder.py

Translates BioPulse user profile and auth metadata into Meal engine inputs:
- Validates readiness (fail-closed safety, minimum age 12, biometrics, allergy & dietary confirmations).
- Builds UserNutritionProfile for Phase 5A neutral target calculation.
- Builds ConditionEvidenceContext for Phase 5B condition evidence context.

Strict Invariants:
1. Minimum age is 12 (NASEM adolescent band starts at 12).
2. Reference-equation sex (from gender metadata) is isolated to 2023 NASEM EER.
3. Gender alone never activates condition evidence. Pathway mapping:
   - "female" / "female_pcos" -> ConditionPathway.PCOS
   - "male" / "male_hypogonadism" -> ConditionPathway.MALE_HYPOGONADISM
   - otherwise -> ConditionPathway.GENERAL
4. EvidenceContextStatus is SCREENING_PATHWAY ONLY IF active assessment module matches
   the resolved pathway ("female_pcos" or "male_hypogonadism"); otherwise UNKNOWN.
5. Missing allergies = UNKNOWN (blocked, never defaulted to None).
6. Missing dietary preference = UNKNOWN (blocked, never defaulted to STANDARD).
7. Unsupported allergens (shellfish, soy, sesame, etc.) block automated planning.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Set, Tuple

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

logger = logging.getLogger(__name__)

# Catalog-supported allergens (Meal/engine/schemas.py: Allergen)
SUPPORTED_ALLERGEN_MAP: Dict[str, Allergen] = {
    "dairy": Allergen.DAIRY,
    "milk": Allergen.DAIRY,
    "cow milk": Allergen.DAIRY,
    "lactose": Allergen.DAIRY,
    "egg": Allergen.EGG,
    "eggs": Allergen.EGG,
    "fish": Allergen.FISH,
    "seafood": Allergen.FISH,
    "wheat": Allergen.WHEAT,
    "gluten": Allergen.WHEAT,
    "nuts": Allergen.NUTS,
    "tree nuts": Allergen.NUTS,
    "peanut": Allergen.NUTS,
    "peanuts": Allergen.NUTS,
    "almond": Allergen.NUTS,
    "walnut": Allergen.NUTS,
}

# Known unsupported allergens that catalog metadata cannot guarantee exclusion for
KNOWN_UNSUPPORTED_ALLERGENS: Set[str] = {
    "shellfish",
    "shrimp",
    "crab",
    "lobster",
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

# Activity level mapping (categorical 2023 NASEM equations)
ACTIVITY_MAP: Dict[str, PALCategory] = {
    "sedentary": PALCategory.INACTIVE,
    "inactive": PALCategory.INACTIVE,
    "light": PALCategory.LOW_ACTIVE,
    "low_active": PALCategory.LOW_ACTIVE,
    "moderate": PALCategory.ACTIVE,
    "active": PALCategory.ACTIVE,
    "very_active": PALCategory.VERY_ACTIVE,
}

# Supported dietary preference mapping
DIETARY_MAP: Dict[str, DietaryClass] = {
    "standard": DietaryClass.STANDARD,
    "balanced": DietaryClass.STANDARD,
    "non_vegetarian": DietaryClass.STANDARD,
    "omnivore": DietaryClass.STANDARD,
    "traditional": DietaryClass.STANDARD,
    "vegetarian": DietaryClass.VEGETARIAN,
    "lacto_vegetarian": DietaryClass.LACTO_VEGETARIAN,
    "lacto-vegetarian": DietaryClass.LACTO_VEGETARIAN,
    "ovo_lacto_vegetarian": DietaryClass.OVO_LACTO_VEGETARIAN,
    "ovo-lacto-vegetarian": DietaryClass.OVO_LACTO_VEGETARIAN,
    "vegan": DietaryClass.VEGAN,
    "pescatarian": DietaryClass.PESCATARIAN,
    "pescetarian": DietaryClass.PESCATARIAN,
}


@dataclass
class NutritionReadinessResult:
    """Readiness response container."""
    ready: bool
    required_biometrics: Dict[str, Any]
    safety_confirmations: Dict[str, Any]
    planning_inputs: Dict[str, Any]
    optional_personalization: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ready": self.ready,
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
    # Accurate decimal age
    days = (today - dob).days
    decimal_age = round(days / 365.2425, 4)
    # Completed full years
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return years, decimal_age


class MealProfileBuilder:
    """
    Builds validated Meal engine inputs from BioPulse user and auth data.
    """

    @staticmethod
    def check_nutrition_readiness(
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
    ) -> NutritionReadinessResult:
        """
        Evaluates whether a user's profile is complete and safe for automated meal planning.
        """
        raw_meta = raw_user_meta_data or {}
        profile = profile_data or {}

        missing_biometrics = []
        missing_safety = []
        missing_planning = []
        warnings = []

        # 1. Required Biometrics
        # Date of birth
        dob_val = profile.get("date_of_birth") or raw_meta.get("date_of_birth")
        decimal_age: Optional[float] = None
        int_age: Optional[int] = None
        if not dob_val:
            missing_biometrics.append("date_of_birth")
        else:
            try:
                int_age, decimal_age = calculate_age_and_decimal(dob_val)
                if int_age < 12:
                    missing_biometrics.append("minimum_age_12_required")
                    warnings.append(
                        f"BioPulse nutrition planning requires a minimum age of 12 years (current age: {int_age})."
                    )
            except Exception as e:
                missing_biometrics.append("date_of_birth_invalid")
                warnings.append(f"Invalid date of birth format: {e}")

        # Height cm
        height_cm = profile.get("height_cm") or raw_meta.get("height_cm")
        try:
            if height_cm is None or float(height_cm) <= 0:
                missing_biometrics.append("height_cm")
        except (ValueError, TypeError):
            missing_biometrics.append("height_cm")

        # Weight kg
        weight_kg = profile.get("weight_kg") or raw_meta.get("weight_kg")
        try:
            if weight_kg is None or float(weight_kg) <= 0:
                missing_biometrics.append("weight_kg")
        except (ValueError, TypeError):
            missing_biometrics.append("weight_kg")

        # Reference-equation sex (from gender metadata)
        gender_raw = raw_meta.get("gender") or profile.get("gender")
        if not gender_raw or str(gender_raw).strip().lower() not in ("female", "male"):
            missing_biometrics.append("reference_equation_sex")
            warnings.append(
                "Reference-equation sex ('female' or 'male') is required for 2023 NASEM energy calculations."
            )

        # 2. Safety Confirmations
        # Allergies: empty, null, or unanswered is UNKNOWN -> FAIL
        allergies_raw = profile.get("allergies")
        if allergies_raw is None and "allergies" in raw_meta:
            allergies_raw = raw_meta.get("allergies")

        allergy_status_pass = False
        if allergies_raw is None:
            missing_safety.append("allergy_confirmation")
        elif isinstance(allergies_raw, list):
            if len(allergies_raw) == 0:
                missing_safety.append("allergy_confirmation")
            else:
                # Check for explicit "None"
                str_items = [str(item).strip().lower() for item in allergies_raw if str(item).strip()]
                if len(str_items) == 1 and str_items[0] in ("none", "no allergies", "no known allergies"):
                    allergy_status_pass = True
                else:
                    # Check for unsupported allergens
                    unsupported_found = []
                    for item in str_items:
                        if item in ("none", "no allergies", "no known allergies"):
                            continue
                        if item in KNOWN_UNSUPPORTED_ALLERGENS:
                            unsupported_found.append(item)
                        elif item not in SUPPORTED_ALLERGEN_MAP:
                            # Not in supported map and not none
                            unsupported_found.append(item)
                    if unsupported_found:
                        missing_safety.append("unsupported_allergen_requires_manual_review")
                        warnings.append(
                            f"Automated planning is blocked because your specified allergy '{', '.join(unsupported_found)}' "
                            "cannot be guaranteed excluded by the verified catalog."
                        )
                    else:
                        allergy_status_pass = True
        elif isinstance(allergies_raw, str):
            clean_str = allergies_raw.strip().lower()
            if clean_str in ("none", "no allergies", "no known allergies", "[]"):
                allergy_status_pass = True
            elif clean_str:
                items = [s.strip().lower() for s in clean_str.split(",")]
                unsupported_found = [i for i in items if i in KNOWN_UNSUPPORTED_ALLERGENS or i not in SUPPORTED_ALLERGEN_MAP]
                if unsupported_found:
                    missing_safety.append("unsupported_allergen_requires_manual_review")
                    warnings.append(
                        f"Unsupported allergy '{', '.join(unsupported_found)}' requires clinical/manual review."
                    )
                else:
                    allergy_status_pass = True
            else:
                missing_safety.append("allergy_confirmation")
        else:
            missing_safety.append("allergy_confirmation")

        # Dietary preference: missing/empty -> UNKNOWN -> FAIL
        dietary_raw = profile.get("dietary_preference") or raw_meta.get("dietary_preference")
        if not dietary_raw or not str(dietary_raw).strip():
            missing_safety.append("dietary_preference_confirmation")
        else:
            clean_diet = str(dietary_raw).strip().lower().replace(" ", "_").replace("-", "_")
            # Also handle gluten_free / dairy_free special selections
            if clean_diet not in DIETARY_MAP and clean_diet not in ("gluten_free", "dairy_free", "halal"):
                warnings.append(f"Dietary preference '{dietary_raw}' will be evaluated with standard safety boundaries.")

        # 3. Planning Inputs
        # Activity level: missing -> FAIL
        activity_raw = profile.get("activity_level") or raw_meta.get("activity_level")
        activity_status = "FAIL"
        if not activity_raw or not str(activity_raw).strip():
            missing_planning.append("activity_level")
        else:
            clean_act = str(activity_raw).strip().lower().replace(" ", "_").replace("-", "_")
            if clean_act in ACTIVITY_MAP:
                activity_status = "CONFIRMED"
            else:
                missing_planning.append("activity_level")

        # Aggregate statuses
        biometrics_status = "PASS" if len(missing_biometrics) == 0 else "FAIL"
        safety_status = "PASS" if len(missing_safety) == 0 else "FAIL"
        planning_status = "PASS" if len(missing_planning) == 0 else "FAIL"

        ready = (biometrics_status == "PASS" and safety_status == "PASS" and planning_status == "PASS")

        return NutritionReadinessResult(
            ready=ready,
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
            },
            warnings=warnings,
        )

    @staticmethod
    def build_user_nutrition_profile(
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
    ) -> UserNutritionProfile:
        """
        Builds the framework-independent UserNutritionProfile for Phase 5A.
        Raises ValueError if required fields are missing or invalid.
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

        # 2. Reference equation sex (NASEM 2023)
        gender_raw = raw_meta.get("gender") or profile.get("gender")
        if not gender_raw or str(gender_raw).strip().lower() not in ("female", "male"):
            raise ValueError("reference_equation_sex must be 'female' or 'male'.")
        sex = str(gender_raw).strip().lower()

        # 3. Biometrics
        height_val = profile.get("height_cm") or raw_meta.get("height_cm")
        if height_val is None or float(height_val) <= 0:
            raise ValueError("height_cm must be greater than zero.")
        height_cm = float(height_val)

        weight_val = profile.get("weight_kg") or raw_meta.get("weight_kg")
        if weight_val is None or float(weight_val) <= 0:
            raise ValueError("weight_kg must be greater than zero.")
        weight_kg = float(weight_val)

        # 4. Activity level
        act_val = profile.get("activity_level") or raw_meta.get("activity_level")
        if not act_val:
            raise ValueError("activity_level is required for nutrition planning.")
        clean_act = str(act_val).strip().lower().replace(" ", "_").replace("-", "_")
        pal_cat = ACTIVITY_MAP.get(clean_act)
        if pal_cat is None:
            raise ValueError(f"Unsupported activity_level: {act_val}")

        # 5. Goal mapping
        # Exact stored BioPulse goal labels
        goal_val = profile.get("primary_goal") or raw_meta.get("goal") or profile.get("goal")
        resolved_goal = Goal.MAINTAIN
        if goal_val:
            clean_goal = str(goal_val).strip()
            if clean_goal == "Enjoy Hormone-Friendly Meals":
                resolved_goal = Goal.HEALTHY_EATING
            elif clean_goal in ("Weight Management", "Gradual Weight Management", "Weight Loss"):
                resolved_goal = Goal.GRADUAL_WEIGHT_MANAGEMENT
            elif clean_goal == "Maintain Weight" or clean_goal == "Maintain":
                resolved_goal = Goal.MAINTAIN
            else:
                # Other non-nutrition goals resolve to MAINTAIN
                resolved_goal = Goal.MAINTAIN

        # 6. Dietary class
        diet_val = profile.get("dietary_preference") or raw_meta.get("dietary_preference")
        if not diet_val or not str(diet_val).strip():
            raise ValueError("dietary_preference is required (cannot default to STANDARD).")
        clean_diet = str(diet_val).strip().lower().replace(" ", "_").replace("-", "_")
        dietary_class = DIETARY_MAP.get(clean_diet, DietaryClass.STANDARD)

        # Conservative ingredient exclusions for Gluten-Free or Dairy-Free preferences
        disliked = []
        if clean_diet == "gluten_free" or clean_diet == "gluten-free":
            disliked.append("wheat")
        if clean_diet == "dairy_free" or clean_diet == "dairy-free":
            disliked.append("dairy")

        # 7. Allergies mapping
        allergies_raw = profile.get("allergies")
        if allergies_raw is None and "allergies" in raw_meta:
            allergies_raw = raw_meta.get("allergies")

        food_allergies: List[Allergen] = []
        if allergies_raw is None:
            raise ValueError("Allergy status must be confirmed (cannot be null/unanswered).")

        if isinstance(allergies_raw, list):
            if len(allergies_raw) == 0:
                raise ValueError("Allergy status must be confirmed (cannot be empty list).")
            for a in allergies_raw:
                s = str(a).strip().lower()
                if s in ("none", "no allergies", "no known allergies"):
                    continue
                if s in KNOWN_UNSUPPORTED_ALLERGENS:
                    raise ValueError(f"Unsupported allergy '{s}' cannot be verified for exclusion.")
                mapped = SUPPORTED_ALLERGEN_MAP.get(s)
                if mapped:
                    if mapped not in food_allergies:
                        food_allergies.append(mapped)
                else:
                    raise ValueError(f"Unsupported allergy '{s}' requires clinical review.")
        elif isinstance(allergies_raw, str):
            s = allergies_raw.strip().lower()
            if s not in ("none", "no allergies", "no known allergies", "[]"):
                items = [x.strip().lower() for x in s.split(",") if x.strip()]
                for item in items:
                    if item in KNOWN_UNSUPPORTED_ALLERGENS:
                        raise ValueError(f"Unsupported allergy '{item}' cannot be verified for exclusion.")
                    mapped = SUPPORTED_ALLERGEN_MAP.get(item)
                    if mapped:
                        if mapped not in food_allergies:
                            food_allergies.append(mapped)
                    else:
                        raise ValueError(f"Unsupported allergy '{item}' requires clinical review.")

        # 8. Pregnancy / lactation
        pregnant = bool(profile.get("is_pregnant", False))
        lactating = bool(profile.get("is_lactating", False))

        return UserNutritionProfile(
            age=int_age,
            sex_for_reference_equation=sex,
            height_cm=height_cm,
            weight_kg=weight_kg,
            pal_category=pal_cat,
            age_years_decimal=decimal_age,
            goal=resolved_goal,
            meals_per_day=4,  # standard 4-meal Pakistani schedule
            dietary_class=dietary_class,
            food_allergies=food_allergies,
            disliked_foods=disliked,
            pregnant=pregnant,
            lactating=lactating,
            pal_assignment_source="USER_SELECTED",
        )

    @staticmethod
    def build_condition_evidence_context(
        user_id: str,
        raw_user_meta_data: Optional[Dict[str, Any]],
        profile_data: Optional[Dict[str, Any]],
        active_assessment_module: Optional[str] = None,
    ) -> ConditionEvidenceContext:
        """
        Builds the ConditionEvidenceContext for Phase 5B condition evidence.
        
        Strict Invariants:
        1. Condition pathway is determined by explicit metadata:
           - pathway == "female" or "female_pcos" -> ConditionPathway.PCOS
           - pathway == "male" or "male_hypogonadism" -> ConditionPathway.MALE_HYPOGONADISM
           - otherwise -> ConditionPathway.GENERAL
        2. Gender alone NEVER activates condition evidence.
        3. EvidenceContextStatus is SCREENING_PATHWAY ONLY IF active assessment module
           corresponds to the resolved pathway:
           - pathway PCOS and active_assessment_module == "female_pcos"
           - pathway MALE_HYPOGONADISM and active_assessment_module == "male_hypogonadism"
           otherwise UNKNOWN.
        4. Never infer diagnosis.
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

        # EvidenceContextStatus rule:
        # Screening pathway only if active assessment matches resolved pathway
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
