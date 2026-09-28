"""
BioPulse Personalized Nutrition Engine — Neutral Target & Safety Orchestrator
Framework-independent orchestrator constructing complete NutritionTargetProfile instances.

Execution order:
1. validate_user_profile
2. determine age/EER band & BMI
3. evaluate profile-level safety
4. calculate_energy_requirement (2023 NASEM equations)
5. apply goal & weight management policy
6. calculate_nutrient_targets (DRI RDA/AMDR/AI)
7. construct NutritionTargetProfile
"""

from typing import Dict, List
from .schemas import (
    UserNutritionProfile,
    NutritionTargetProfile,
    Goal,
    SafetyStatus,
)
from .profile import validate_and_route_profile
from .energy import calculate_energy_requirement
from .nutrient_targets import calculate_nutrient_targets

PROFILE_VERSION = "5A.1.1"


def build_nutrition_target_profile(
    profile: UserNutritionProfile,
) -> NutritionTargetProfile:
    """
    Build a complete, framework-independent NutritionTargetProfile from a UserNutritionProfile.

    Follows deterministic execution order:
    validate_user_profile -> determine age/EER band -> evaluate profile-level safety ->
    calculate_energy_requirement -> calculate_nutrient_targets -> construct NutritionTargetProfile.

    Enforces:
    - Zero PCOS/hypogonadism fields.
    - Gradual weight management retains maintenance EER with status DEFERRED_TO_EVIDENCE_BASED_GOAL_LAYER.
    - Complete equation and nutrient target provenance.
    - Full calculation trace and warning aggregation.
    """
    calc_trace: List[str] = []

    # Step 1, 2, 3: Validate, route age/EER band, evaluate profile-level safety
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

    calc_trace.append(
        f"validate_user_profile: inputs validated (age={effective_age}, "
        f"sex={profile.sex_for_reference_equation}, height={profile.height_cm}cm, weight={profile.weight_kg}kg)"
    )
    calc_trace.append(
        f"determine age/EER band: age_group={age_group.value}, eer_age_band={eer_age_band.value}, "
        f"BMI={bmi_value:.2f} ({bmi_interpretation})"
    )
    calc_trace.append(
        f"evaluate profile-level safety: status={safety_status.value}, "
        f"automated_planning_allowed={automated_planning_allowed}, flags={safety_flags}"
    )

    # Step 4: Calculate energy requirement (2023 NASEM)
    eer_result = calculate_energy_requirement(profile)
    calc_trace.append(
        f"calculate_energy_requirement: {eer_result.equation_id} -> {eer_result.eer_kcal:.2f} kcal/d "
        f"(growth allowance: {eer_result.growth_allowance_kcal} kcal/d)"
    )

    # Step 5: Evaluate goal & weight management policy
    if profile.goal == Goal.GRADUAL_WEIGHT_MANAGEMENT:
        energy_target_kcal = eer_result.eer_kcal
        weight_management_policy_status = "DEFERRED_TO_EVIDENCE_BASED_GOAL_LAYER"
        automatic_weight_loss_deficit = False
        weight_management_adjustment_applied = False
        calc_trace.append(
            f"apply_goal_policy: goal={profile.goal.value} -> maintenance EER retained ({energy_target_kcal:.2f} kcal/d), "
            f"status={weight_management_policy_status}"
        )
    else:
        energy_target_kcal = eer_result.eer_kcal
        weight_management_policy_status = "MAINTENANCE_NEUTRAL"
        automatic_weight_loss_deficit = False
        weight_management_adjustment_applied = False
        calc_trace.append(
            f"apply_goal_policy: goal={profile.goal.value} -> maintenance energy target {energy_target_kcal:.2f} kcal/d"
        )

    # Step 6: Calculate nutrient targets
    targets = calculate_nutrient_targets(profile, eer_result)
    calc_trace.append(
        f"resolve nutrient references: status={targets['target_resolution_status'].value}, "
        f"nutrition_targets_optimization_ready={targets['nutrition_targets_optimization_ready']}"
    )
    calc_trace.append(
        f"calculate_nutrient_targets: carbohydrate=[{targets['carbohydrate_target_min_g']}-{targets['carbohydrate_target_max_g']}] g, "
        f"protein=[{targets['protein_target_min_g']}-{targets['protein_target_max_g']}] g, "
        f"fat=[{targets['fat_amdr_min_g']}-{targets['fat_amdr_max_g']}] g, "
        f"fiber_ai={targets['fiber_ai_g']} g"
    )

    # Warnings collection
    warnings = list(targets.get("warnings", []))
    if not targets["nutrition_targets_optimization_ready"]:
        warnings.append("TARGET_REFERENCE_CONFLICT: Required nutrient targets are unresolved; automatic optimization is blocked.")
    if not automated_planning_allowed:
        warnings.append(
            f"Safety warning: Automated personalized planning is restricted (safety_status={safety_status.value}). "
            f"Active flags: {safety_flags}"
        )

    # Target provenance sources
    target_sources: Dict[str, str] = {
        "eer": f"{eer_result.equation_source} ({eer_result.equation_id})",
        "carbohydrate_rda": "IOM DRI 2002/2005 (130 g/d minimum brain glucose requirement)",
        "carbohydrate_amdr": "IOM AMDR 45–65% energy (2002/2005)",
        "protein_rda": f"IOM DRI 2002/2005 ({targets['protein_rda_factor']} g/kg/d)",
        "protein_amdr": targets.get("protein_amdr_source", "IOM AMDR (2002/2005)"),
        "fat_amdr": "IOM AMDR 2002/2005",
        "fiber_ai": targets.get("fiber_ai_source", "IOM DRI Adequate Intake"),
        "fiber_energy_density_reference": "IOM DRI derived reference (14 g / 1000 kcal)",
    }

    # Step 7: Construct NutritionTargetProfile
    profile_result = NutritionTargetProfile(
        profile_version=PROFILE_VERSION,
        age_years_decimal=effective_age,
        age_group=age_group,
        eer_age_band=eer_age_band,
        sex_for_reference_equation=profile.sex_for_reference_equation,
        bmi_value=bmi_value,
        bmi_interpretation=bmi_interpretation,
        eer_kcal=eer_result.eer_kcal,
        energy_target_kcal=energy_target_kcal,
        pal_category=profile.pal_category,
        pal_assignment_source=profile.pal_assignment_source,
        eer_equation_source=eer_result.equation_source,
        eer_equation_id=eer_result.equation_id,
        carbohydrate_rda_g=targets["carbohydrate_rda_g"],
        carbohydrate_amdr_min_g=targets["carbohydrate_amdr_min_g"],
        carbohydrate_amdr_max_g=targets["carbohydrate_amdr_max_g"],
        carbohydrate_target_min_g=targets["carbohydrate_target_min_g"],
        carbohydrate_target_max_g=targets["carbohydrate_target_max_g"],
        protein_rda_floor_g=targets["protein_rda_floor_g"],
        protein_amdr_min_g=targets["protein_amdr_min_g"],
        protein_amdr_max_g=targets["protein_amdr_max_g"],
        protein_target_min_g=targets["protein_target_min_g"],
        protein_target_max_g=targets["protein_target_max_g"],
        fat_amdr_min_g=targets["fat_amdr_min_g"],
        fat_amdr_max_g=targets["fat_amdr_max_g"],
        fiber_ai_g=targets["fiber_ai_g"],
        fiber_ai_reference_type=targets["fiber_ai_reference_type"],
        fiber_ai_source=targets["fiber_ai_source"],
        fiber_energy_density_reference_g=targets["fiber_energy_density_reference_g"],
        fiber_energy_density_reference_type=targets["fiber_energy_density_reference_type"],
        goal=profile.goal,
        weight_management_policy_status=weight_management_policy_status,
        automatic_weight_loss_deficit=automatic_weight_loss_deficit,
        weight_management_adjustment_applied=weight_management_adjustment_applied,
        safety_status=safety_status,
        automated_personalized_planning_allowed=(
            automated_planning_allowed and targets["nutrition_targets_optimization_ready"]
        ),
        target_resolution_status=targets["target_resolution_status"],
        nutrition_targets_optimization_ready=targets["nutrition_targets_optimization_ready"],
        carbohydrate_conflict=targets["carbohydrate_conflict"],
        protein_conflict=targets["protein_conflict"],
        safety_flags=safety_flags,
        target_sources=target_sources,
        calculation_trace=calc_trace,
        warnings=warnings,
    )

    calc_trace.append("construct NutritionTargetProfile: complete")
    return profile_result
