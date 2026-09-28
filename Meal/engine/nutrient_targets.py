"""
BioPulse Personalized Nutrition Engine — Nutrient Target Ranges
Implements DRI/AMDR macronutrient ranges and official fiber AI values.

Key policies:
- Protein RDA floors: 0.95 g/kg (ages 12-13), 0.85 g/kg (ages 14-18), 0.80 g/kg (adults)
- Carbohydrate: RDA=130 g/day, AMDR=45-65%. TARGET_REFERENCE_CONFLICT only when RDA > AMDR_max.
- Fiber: Official DRI AI values by age/sex (not 14g/1000kcal formula).
- Fat: AMDR 25-35% adolescent, 20-35% adult.
"""

from typing import List, Optional, Tuple
import math
from .schemas import (
    AgeGroup,
    EERAgeBand,
    NutritionTargetProfile,
    Goal,
    PALCategory,
    SafetyStatus,
    TargetResolutionStatus,
)
from .profile import validate_and_route_profile
from .energy import calculate_energy_requirement
from .schemas import UserNutritionProfile, EnergyRequirementResult


# ---------------------------------------------------------------------------
# Official DRI Fiber Adequate Intake (AI) values by age and sex
# Source: Institute of Medicine / National Academies DRI 2002/2005, confirmed 2023
# ---------------------------------------------------------------------------
_FIBER_AI_TABLE = {
    # (sex, age_lower, age_upper): fiber_ai_g
    ("male",   12, 13): 31,
    ("male",   14, 18): 38,
    ("male",   19, 50): 38,
    ("male",   51, 200): 30,
    ("female", 12, 13): 26,
    ("female", 14, 18): 26,
    ("female", 19, 50): 25,
    ("female", 51, 200): 21,
}
_FIBER_AI_SOURCE = "IOM Dietary Reference Intakes: Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids (2002/2005)"


def _get_fiber_ai(sex: str, age: float) -> Tuple[float, str]:
    """Return the official DRI Adequate Intake for fiber (g/day) and source string."""
    sex_key = "male" if sex.strip().lower() in ("male", "m") else "female"
    age_int = int(age)
    for (s, lo, hi), val in _FIBER_AI_TABLE.items():
        if s == sex_key and lo <= age_int <= hi:
            return float(val), _FIBER_AI_SOURCE
    # Fallback: should not occur for ages 12-120
    return 25.0, _FIBER_AI_SOURCE + " [fallback]"


# ---------------------------------------------------------------------------
# Protein RDA floors by age (g/kg body weight/day) — DRI RDA (not EAR)
# Source: IOM Dietary Reference Intakes for Macronutrients 2002/2005
# ---------------------------------------------------------------------------
def _get_protein_rda_floor(age: float, weight_kg: float) -> Tuple[float, float]:
    """
    Return (rda_factor_g_per_kg, rda_floor_g) for protein.
    Ages 12-13: 0.95 g/kg/day
    Ages 14-18: 0.85 g/kg/day
    Ages 19+:   0.80 g/kg/day
    """
    if age < 14.0:
        factor = 0.95
    elif age < 19.0:
        factor = 0.85
    else:
        factor = 0.80
    return factor, round(factor * weight_kg, 1)


def calculate_nutrient_targets(
    profile: UserNutritionProfile,
    eer_result: EnergyRequirementResult,
) -> dict:
    """
    Calculate macronutrient target ranges from DRI/AMDR and the user's EER.

    Returns a dict suitable for embedding into NutritionTargetProfile.

    Key outputs:
    - carbohydrate_rda_g, carbohydrate_amdr_min_g, carbohydrate_amdr_max_g
    - carbohydrate_target_min_g, carbohydrate_target_max_g
    - protein_rda_floor_g, protein_amdr_min_g, protein_amdr_max_g
    - protein_target_min_g, protein_target_max_g
    - fat_amdr_min_g, fat_amdr_max_g
    - fiber_ai_g, fiber_ai_reference_type, fiber_ai_source
    - fiber_energy_density_reference_g, fiber_energy_density_reference_type
    - warnings: list of conflict strings
    """
    (
        effective_age,
        age_group,
        eer_age_band,
        bmi_value,
        bmi_interpretation,
        safety_status,
        automated_planning_allowed,
        safety_flags,
    ) = validate_and_route_profile(profile)

    energy_kcal = eer_result.eer_kcal
    weight_kg = profile.weight_kg
    # Reject invalid numerical inputs rather than emitting invalid AMDR ranges.
    # This does not impose new anthropometric bounds or alter any EER equation.
    if not math.isfinite(energy_kcal) or energy_kcal <= 0:
        raise ValueError("Energy requirement must be finite and positive to resolve nutrient targets.")
    if not math.isfinite(weight_kg):
        raise ValueError("Weight must be finite to resolve nutrient targets.")
    sex_norm = str(profile.sex_for_reference_equation).strip().lower()
    if sex_norm in ("m", "male"):
        sex_norm = "male"
    else:
        sex_norm = "female"

    warnings = []

    # ------------------------------------------------------------------
    # CARBOHYDRATE
    # RDA = 130 g/day (IOM 2002/2005 — minimum for brain glucose supply)
    # AMDR = 45–65% of energy
    # Conflict: ONLY when RDA > AMDR_max (no intake can satisfy both)
    # Target min = max(RDA, AMDR_min)
    # Target max = AMDR_max; both targets are None if references conflict.
    # ------------------------------------------------------------------
    CARB_RDA_G = 130.0
    carb_amdr_min_g = round((0.45 * energy_kcal) / 4.0, 1)
    carb_amdr_max_g = round((0.65 * energy_kcal) / 4.0, 1)
    carb_target_min_g = round(max(CARB_RDA_G, carb_amdr_min_g), 1)
    carb_target_max_g = carb_amdr_max_g
    carb_conflict = None
    if CARB_RDA_G > carb_amdr_max_g:
        carb_conflict = "TARGET_REFERENCE_CONFLICT"
        carb_target_min_g = carb_target_max_g = None
        warnings.append(
            f"Carbohydrate: RDA ({CARB_RDA_G} g) > AMDR max ({carb_amdr_max_g} g). "
            f"No single intake can satisfy both references at energy target {energy_kcal:.0f} kcal."
        )

    # ------------------------------------------------------------------
    # PROTEIN
    # RDA floor by age, AMDR by age group
    # Conflict: ONLY when protein_rda_floor_g > protein_amdr_max_g
    # Target min = max(RDA floor, AMDR min)
    # Target max = AMDR max; both targets are None if references conflict.
    # ------------------------------------------------------------------
    protein_rda_factor, protein_rda_floor_g = _get_protein_rda_floor(effective_age, weight_kg)
    if age_group == AgeGroup.ADOLESCENT:
        prot_amdr_min_pct, prot_amdr_max_pct = 0.10, 0.30
        prot_amdr_source = "IOM AMDR adolescents 10–30% energy (2002/2005)"
    else:
        prot_amdr_min_pct, prot_amdr_max_pct = 0.10, 0.35
        prot_amdr_source = "IOM AMDR adults 10–35% energy (2002/2005)"

    protein_amdr_min_g = round((prot_amdr_min_pct * energy_kcal) / 4.0, 1)
    protein_amdr_max_g = round((prot_amdr_max_pct * energy_kcal) / 4.0, 1)
    protein_target_min_g = round(max(protein_rda_floor_g, protein_amdr_min_g), 1)
    protein_target_max_g = protein_amdr_max_g
    prot_conflict = None
    if protein_rda_floor_g > protein_amdr_max_g:
        prot_conflict = "TARGET_REFERENCE_CONFLICT"
        protein_target_min_g = protein_target_max_g = None
        warnings.append(
            f"Protein: RDA floor ({protein_rda_floor_g} g) > AMDR max ({protein_amdr_max_g} g). "
            f"No single intake can satisfy both references at energy target {energy_kcal:.0f} kcal."
        )

    # ------------------------------------------------------------------
    # FAT
    # AMDR adults: 20–35%; adolescents: 25–35%
    # ------------------------------------------------------------------
    if age_group == AgeGroup.ADOLESCENT:
        fat_amdr_min_pct, fat_amdr_max_pct = 0.25, 0.35
    else:
        fat_amdr_min_pct, fat_amdr_max_pct = 0.20, 0.35

    fat_amdr_min_g = round((fat_amdr_min_pct * energy_kcal) / 9.0, 1)
    fat_amdr_max_g = round((fat_amdr_max_pct * energy_kcal) / 9.0, 1)

    # ------------------------------------------------------------------
    # FIBER
    # Official DRI Adequate Intake by age/sex (NOT 14g/1000kcal formula)
    # ------------------------------------------------------------------
    fiber_ai_g, fiber_ai_source = _get_fiber_ai(sex_norm, effective_age)

    # Separately: energy-density derived reference (informational only)
    fiber_energy_density_ref_g = round(14.0 * energy_kcal / 1000.0, 1)

    return {
        "target_resolution_status": (
            TargetResolutionStatus.REFERENCE_CONFLICT
            if carb_conflict or prot_conflict else TargetResolutionStatus.RESOLVED
        ),
        "nutrition_targets_optimization_ready": not (carb_conflict or prot_conflict),
        # Carbohydrate
        "carbohydrate_rda_g": CARB_RDA_G,
        "carbohydrate_amdr_min_g": carb_amdr_min_g,
        "carbohydrate_amdr_max_g": carb_amdr_max_g,
        "carbohydrate_target_min_g": carb_target_min_g,
        "carbohydrate_target_max_g": carb_target_max_g,
        "carbohydrate_conflict": carb_conflict,

        # Protein
        "protein_rda_factor": protein_rda_factor,
        "protein_rda_floor_g": protein_rda_floor_g,
        "protein_amdr_min_g": protein_amdr_min_g,
        "protein_amdr_max_g": protein_amdr_max_g,
        "protein_target_min_g": protein_target_min_g,
        "protein_target_max_g": protein_target_max_g,
        "protein_amdr_source": prot_amdr_source,
        "protein_conflict": prot_conflict,

        # Fat
        "fat_amdr_min_g": fat_amdr_min_g,
        "fat_amdr_max_g": fat_amdr_max_g,

        # Fiber — official AI
        "fiber_ai_g": float(fiber_ai_g),
        "fiber_ai_reference_type": "AI",
        "fiber_ai_source": fiber_ai_source,

        # Fiber — energy-density derivation (informational)
        "fiber_energy_density_reference_g": fiber_energy_density_ref_g,
        "fiber_energy_density_reference_type": "DERIVED_14G_PER_1000KCAL",

        # Aggregate warnings
        "warnings": warnings,
    }
