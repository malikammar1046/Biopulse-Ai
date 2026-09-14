"""
BioPulse Personalized Nutrition Engine — Profile Validation & Routing
Validates user inputs, assigns age routing, and computes metric BMI without adult misclassification.
"""

from typing import Tuple, List
from .schemas import (
    UserNutritionProfile,
    AgeGroup,
    EERAgeBand,
    SafetyStatus,
    PALCategory,
    Goal,
    DietaryClass,
)


class ProfileValidationError(ValueError):
    """Raised when user profile inputs are invalid or out of supported bounds."""
    pass


def validate_and_route_profile(
    profile: UserNutritionProfile
) -> Tuple[float, AgeGroup, EERAgeBand, float, str, SafetyStatus, bool, List[str]]:
    """
    Validates a UserNutritionProfile and performs deterministic age and physiological safety routing.

    Returns:
        effective_age (float): Exact decimal age or integer age in completed years.
        age_group (AgeGroup): ADOLESCENT (12–18.99) or ADULT (19+).
        eer_age_band (EERAgeBand): Specific NASEM 2023 equation age band.
        bmi_value (float): Metric BMI rounded to 2 decimal places.
        bmi_interpretation (str): Adult category or "NOT_INTERPRETED_FOR_ADOLESCENT".
        safety_status (SafetyStatus): Gating status.
        automated_personalized_planning_allowed (bool): False if clinician guidance required.
        safety_flags (List[str]): List of reasons if clinical guidance is required.
    """
    # 1. Age validation
    effective_age = profile.age_years_decimal if profile.age_years_decimal is not None else float(profile.age)

    if effective_age < 12.0:
        raise ProfileValidationError(
            f"BioPulse MVP supports users aged 12 and older. Supplied age: {effective_age}"
        )
    if effective_age > 120.0:
        raise ProfileValidationError(
            f"Supplied age {effective_age} exceeds maximum supported physiological age (120 years)."
        )

    # 2. Measurements validation
    if profile.height_cm is None or profile.height_cm <= 0:
        raise ProfileValidationError(
            f"Height must be a positive number in centimeters. Supplied: {profile.height_cm}"
        )
    if profile.height_cm < 50.0 or profile.height_cm > 275.0:
        raise ProfileValidationError(
            f"Height {profile.height_cm} cm is outside plausible physiological range (50–275 cm)."
        )

    if profile.weight_kg is None or profile.weight_kg <= 0:
        raise ProfileValidationError(
            f"Weight must be a positive number in kilograms. Supplied: {profile.weight_kg}"
        )
    if profile.weight_kg < 20.0 or profile.weight_kg > 400.0:
        raise ProfileValidationError(
            f"Weight {profile.weight_kg} kg is outside plausible physiological range (20–400 kg)."
        )

    # 3. Reference sex validation
    sex_norm = str(profile.sex_for_reference_equation).strip().lower()
    if sex_norm not in ("male", "female", "m", "f"):
        raise ProfileValidationError(
            f"sex_for_reference_equation must be 'male' or 'female'. Supplied: {profile.sex_for_reference_equation}"
        )

    # 4. Age routing
    if effective_age < 19.0:
        age_group = AgeGroup.ADOLESCENT
        if effective_age < 14.0:
            eer_age_band = EERAgeBand.EER_12_TO_13_99
        else:
            eer_age_band = EERAgeBand.EER_14_TO_18_99
    else:
        age_group = AgeGroup.ADULT
        eer_age_band = EERAgeBand.EER_19_PLUS

    # 5. BMI calculation & adolescent protection
    height_m = profile.height_cm / 100.0
    bmi_value = round(profile.weight_kg / (height_m ** 2), 2)

    if age_group == AgeGroup.ADOLESCENT:
        # Crucial: Never interpret adolescent BMI using adult cutoffs
        bmi_interpretation = "NOT_INTERPRETED_FOR_ADOLESCENT"
    else:
        if bmi_value < 18.5:
            bmi_interpretation = "UNDERWEIGHT"
        elif bmi_value < 25.0:
            bmi_interpretation = "NORMAL_WEIGHT"
        elif bmi_value < 30.0:
            bmi_interpretation = "OVERWEIGHT"
        else:
            bmi_interpretation = "OBESITY"

    # 6. Special medical state routing
    safety_flags = []
    if profile.pregnant:
        safety_flags.append("PREGNANCY")
    if profile.lactating:
        safety_flags.append("LACTATION")

    med_flags_lower = [f.strip().lower() for f in profile.relevant_medical_nutrition_flags]
    for mf in med_flags_lower:
        if any(term in mf for term in ("kidney", "renal")):
            safety_flags.append("SIGNIFICANT_KIDNEY_DISEASE")
        elif any(term in mf for term in ("liver", "hepatic")):
            safety_flags.append("SIGNIFICANT_LIVER_DISEASE")
        elif "diabetes" in mf:
            safety_flags.append("MEDICALLY_MANAGED_DIABETES")
        elif "eating_disorder" in mf or "anorexia" in mf or "bulimia" in mf:
            safety_flags.append("EATING_DISORDER_HISTORY_OR_ACTIVE")
        elif mf in ("pregnancy", "pregnant") and "PREGNANCY" not in safety_flags:
            safety_flags.append("PREGNANCY")
        elif mf in ("lactation", "lactating", "breastfeeding") and "LACTATION" not in safety_flags:
            safety_flags.append("LACTATION")

    if safety_flags:
        safety_status = SafetyStatus.REQUIRES_CLINICIAN_GUIDED_NUTRITION
        automated_planning_allowed = False
    else:
        safety_status = SafetyStatus.SAFE_FOR_AUTOMATED_PLANNING
        automated_planning_allowed = True

    return (
        effective_age,
        age_group,
        eer_age_band,
        bmi_value,
        bmi_interpretation,
        safety_status,
        automated_planning_allowed,
        safety_flags,
    )
