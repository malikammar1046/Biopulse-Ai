"""
BioPulse Personalized Nutrition Engine — Deterministic Energy Requirement Service
Implements the 2023 National Academies of Sciences, Engineering, and Medicine (NASEM)
Dietary Reference Intakes for Energy equations (Tables S-2 and S-3).

Architecture:
- Adults 19+: Exactly 8 adult PAL-specific linear equations from Table S-3 (4 male + 4 female).
- Adolescents (12.00–18.99y):
  8 adolescent PAL coefficient equations (4 male + 4 female)
  +
  age-specific energy-cost-of-growth rules (NASEM Table S-2 footnotes b & c):
    * Boys 12.00–13.99y: base + 25 kcal/d
    * Boys 14.00–18.99y: base + 20 kcal/d
    * Girls 12.00–13.99y: base + 30 kcal/d
    * Girls 14.00–18.99y: base + 20 kcal/d
  Supported routing includes 12.00–13.99 and 14.00–18.99 with exact growth additions,
  yielding 16 distinct adolescent equation-growth combinations (2 age sub-bands × 2 sexes × 4 PALs).
"""

from typing import Tuple, Dict, Any
from .schemas import (
    UserNutritionProfile,
    EnergyRequirementResult,
    AgeGroup,
    EERAgeBand,
    PALCategory,
    Goal,
)
from .profile import validate_and_route_profile


def calculate_energy_requirement(
    profile: UserNutritionProfile
) -> EnergyRequirementResult:
    """
    Deterministically computes Estimated Energy Requirement (EER) in kcal/day
    according to the official 2023 NASEM Dietary Reference Intakes for Energy.

    Uses height in centimeters, weight in kilograms, and age in completed or decimal years.
    Returns complete equation provenance, table, ID, formula text, and input trace.
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

    sex_is_male = str(profile.sex_for_reference_equation).strip().lower() in ("male", "m")
    pal = profile.pal_category
    h = profile.height_cm
    w = profile.weight_kg
    a = effective_age

    inputs_dict = {
        "age": a,
        "sex": "male" if sex_is_male else "female",
        "height_cm": h,
        "weight_kg": w,
        "pal_category": pal.value,
        "pal_assignment_source": profile.pal_assignment_source,
    }

    equation_source = "NASEM Dietary Reference Intakes for Energy 2023"

    # Branch 1: Adults 19+ (Table S-3)
    if age_group == AgeGroup.ADULT:
        equation_table = "Table S-3 (Adults 19+ years)"
        growth_allowance = 0.0

        if sex_is_male:
            if pal == PALCategory.INACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_M_INACTIVE"
                equation_text = "EER = 753.07 - (10.83 × age) + (6.50 × height_cm) + (14.10 × weight_kg)"
                eer = 753.07 - (10.83 * a) + (6.50 * h) + (14.10 * w)
            elif pal == PALCategory.LOW_ACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_M_LOW_ACTIVE"
                equation_text = "EER = 581.47 - (10.83 × age) + (8.30 × height_cm) + (14.94 × weight_kg)"
                eer = 581.47 - (10.83 * a) + (8.30 * h) + (14.94 * w)
            elif pal == PALCategory.ACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_M_ACTIVE"
                equation_text = "EER = 1004.82 - (10.83 × age) + (6.52 × height_cm) + (15.91 × weight_kg)"
                eer = 1004.82 - (10.83 * a) + (6.52 * h) + (15.91 * w)
            elif pal == PALCategory.VERY_ACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_M_VERY_ACTIVE"
                equation_text = "EER = -517.88 - (10.83 × age) + (15.61 × height_cm) + (19.11 × weight_kg)"
                eer = -517.88 - (10.83 * a) + (15.61 * h) + (19.11 * w)
            else:
                raise ValueError(f"Unsupported PAL category: {pal}")
        else:
            if pal == PALCategory.INACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_F_INACTIVE"
                equation_text = "EER = 584.90 - (7.01 × age) + (5.72 × height_cm) + (11.71 × weight_kg)"
                eer = 584.90 - (7.01 * a) + (5.72 * h) + (11.71 * w)
            elif pal == PALCategory.LOW_ACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_F_LOW_ACTIVE"
                equation_text = "EER = 575.77 - (7.01 × age) + (6.60 × height_cm) + (12.14 × weight_kg)"
                eer = 575.77 - (7.01 * a) + (6.60 * h) + (12.14 * w)
            elif pal == PALCategory.ACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_F_ACTIVE"
                equation_text = "EER = 710.25 - (7.01 × age) + (6.54 × height_cm) + (12.34 × weight_kg)"
                eer = 710.25 - (7.01 * a) + (6.54 * h) + (12.34 * w)
            elif pal == PALCategory.VERY_ACTIVE:
                equation_id = "NASEM_2023_TABLE_S3_ADULT_F_VERY_ACTIVE"
                equation_text = "EER = 511.83 - (7.01 × age) + (9.07 × height_cm) + (12.56 × weight_kg)"
                eer = 511.83 - (7.01 * a) + (9.07 * h) + (12.56 * w)
            else:
                raise ValueError(f"Unsupported PAL category: {pal}")

    # Branch 2: Adolescents 12 to 18.99 (Table S-2)
    else:
        equation_table = "Table S-2 (Children and Adolescents)"

        if sex_is_male:
            # Male base equations from Table S-2
            if pal == PALCategory.INACTIVE:
                base_formula = "-447.51 + (3.68 × age) + (13.01 × height_cm) + (13.15 × weight_kg)"
                base_val = -447.51 + (3.68 * a) + (13.01 * h) + (13.15 * w)
            elif pal == PALCategory.LOW_ACTIVE:
                base_formula = "19.12 + (3.68 × age) + (8.62 × height_cm) + (20.28 × weight_kg)"
                base_val = 19.12 + (3.68 * a) + (8.62 * h) + (20.28 * w)
            elif pal == PALCategory.ACTIVE:
                base_formula = "-388.19 + (3.68 × age) + (12.66 × height_cm) + (20.46 × weight_kg)"
                base_val = -388.19 + (3.68 * a) + (12.66 * h) + (20.46 * w)
            elif pal == PALCategory.VERY_ACTIVE:
                base_formula = "-671.75 + (3.68 × age) + (15.38 × height_cm) + (23.25 × weight_kg)"
                base_val = -671.75 + (3.68 * a) + (15.38 * h) + (23.25 * w)
            else:
                raise ValueError(f"Unsupported PAL category: {pal}")

            # Growth allowance for boys (Footnote b: 9–13y = 25 kcal/d; 14–18.99y = 20 kcal/d)
            if eer_age_band == EERAgeBand.EER_12_TO_13_99:
                growth_allowance = 25.0
                equation_id = f"NASEM_2023_TABLE_S2_ADOLESCENT_M_12_13_{pal.value}"
            else:
                growth_allowance = 20.0
                equation_id = f"NASEM_2023_TABLE_S2_ADOLESCENT_M_14_18_{pal.value}"

            equation_text = f"EER = {base_formula} + {int(growth_allowance)} [growth]"
            eer = base_val + growth_allowance

        else:
            # Female base equations from Table S-2
            if pal == PALCategory.INACTIVE:
                base_formula = "55.59 - (22.25 × age) + (8.43 × height_cm) + (17.07 × weight_kg)"
                base_val = 55.59 - (22.25 * a) + (8.43 * h) + (17.07 * w)
            elif pal == PALCategory.LOW_ACTIVE:
                base_formula = "-297.54 - (22.25 × age) + (12.77 × height_cm) + (14.73 × weight_kg)"
                base_val = -297.54 - (22.25 * a) + (12.77 * h) + (14.73 * w)
            elif pal == PALCategory.ACTIVE:
                base_formula = "-189.55 - (22.25 × age) + (11.74 × height_cm) + (18.34 × weight_kg)"
                base_val = -189.55 - (22.25 * a) + (11.74 * h) + (18.34 * w)
            elif pal == PALCategory.VERY_ACTIVE:
                base_formula = "-709.59 - (22.25 × age) + (18.22 × height_cm) + (14.25 × weight_kg)"
                base_val = -709.59 - (22.25 * a) + (18.22 * h) + (14.25 * w)
            else:
                raise ValueError(f"Unsupported PAL category: {pal}")

            # Growth allowance for girls (Footnote c: 9–13y = 30 kcal/d; 14–18.99y = 20 kcal/d)
            if eer_age_band == EERAgeBand.EER_12_TO_13_99:
                growth_allowance = 30.0
                equation_id = f"NASEM_2023_TABLE_S2_ADOLESCENT_F_12_13_{pal.value}"
            else:
                growth_allowance = 20.0
                equation_id = f"NASEM_2023_TABLE_S2_ADOLESCENT_F_14_18_{pal.value}"

            equation_text = f"EER = {base_formula} + {int(growth_allowance)} [growth]"
            eer = base_val + growth_allowance

    return EnergyRequirementResult(
        eer_kcal=round(eer, 2),
        equation_source=equation_source,
        equation_table=equation_table,
        equation_id=equation_id,
        eer_age_band=eer_age_band,
        pal_category=pal,
        pal_assignment_source=profile.pal_assignment_source,
        equation_text=equation_text,
        growth_allowance_kcal=growth_allowance,
        inputs=inputs_dict,
    )
