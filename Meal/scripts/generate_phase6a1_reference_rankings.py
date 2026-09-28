"""Meal/scripts/generate_phase6a1_reference_rankings.py - Generates reference rankings and closure verification for Phase 6A."""

from Meal.engine.orchestrator import build_nutrition_target_profile
from Meal.engine.schemas import Goal, PALCategory, UserNutritionProfile
from Meal.evidence.orchestrator import build_condition_nutrition_profile
from Meal.evidence.schemas import (
    ConditionEvidenceContext,
    ConditionPathway,
    EvidenceContextStatus,
)
from Meal.planner.orchestrator import rank_meal_candidates
from Meal.planner.schemas import CandidateSelectionContext, MealRole


def main():
    user = UserNutritionProfile(
        age=27,
        sex_for_reference_equation="female",
        height_cm=162.0,
        weight_kg=58.0,
        pal_category=PALCategory.ACTIVE,
        goal=Goal.MAINTAIN,
    )
    neutral_profile = build_nutrition_target_profile(user)
    ctx = ConditionEvidenceContext(
        condition_pathway=ConditionPathway.PCOS,
        evidence_context_status=EvidenceContextStatus.SCREENING_PATHWAY,
    )
    condition_profile = build_condition_nutrition_profile(neutral_profile, ctx)

    all_roles = [
        MealRole.BREAKFAST,
        MealRole.LUNCH,
        MealRole.DINNER,
        MealRole.SNACK,
        MealRole.SIDE,
        MealRole.STAPLE,
        MealRole.DESSERT,
        MealRole.BEVERAGE,
    ]

    print("==========================================================================")
    print("PHASE 6A.2 MEAL ROLE CLOSURE AUDIT (ALL 8 ROLES)")
    print("==========================================================================")
    print(f"{'ROLE':<12} | {'RAW':<5} | {'OPT':<5} | {'DISP_INC':<9} | {'DISP_REV':<9} | {'DOWNSTREAM':<11} | {'CLOSURE':<8}")
    print("-" * 74)

    for role in all_roles:
        selection_ctx = CandidateSelectionContext(meal_role=role)
        result = rank_meal_candidates(neutral_profile, condition_profile, selection_ctx)

        assert result.verify_counts() is True, f"Global closure failed for {role.value}"
        assert result.verify_role_closure() is True, f"Role closure failed for {role.value}"

        raw_c = result.raw_role_entity_count
        opt_c = result.optimization_eligible_count
        inc_c = result.display_only_incomplete_count
        rev_c = result.display_only_nutrition_review_count
        down_c = result.downstream_role_valid_count
        closure_str = "PASS" if (opt_c + inc_c + rev_c == raw_c) else "FAIL"

        print(f"{role.value.upper():<12} | {raw_c:<5} | {opt_c:<5} | {inc_c:<9} | {rev_c:<9} | {down_c:<11} | {closure_str:<8}")

    print("\n==========================================================================")
    print("TOP 5 OPTIMIZATION CANDIDATES FOR PRIMARY MEAL ROLES")
    print("==========================================================================")

    primary_roles = [MealRole.BREAKFAST, MealRole.LUNCH, MealRole.DINNER, MealRole.SNACK]
    for role in primary_roles:
        selection_ctx = CandidateSelectionContext(meal_role=role)
        result = rank_meal_candidates(neutral_profile, condition_profile, selection_ctx)

        print(f"\n=======================================================")
        print(f"MEAL ROLE: {role.value.upper()}")
        print(f"Raw Role Supporting Count: {result.raw_role_entity_count}")
        print(f"Total Eligible Optimization Candidates: {len(result.ranked_optimization_candidates)}")
        print(f"Total Display-Only Incomplete: {result.display_only_incomplete_count}")
        print(f"Total Display-Only Review Required: {result.display_only_nutrition_review_count}")
        print(f"Total Downstream Role-Valid Population: {result.downstream_role_valid_count}")
        print(f"=======================================================")

        top5 = result.ranked_optimization_candidates[:5]
        for idx, cand in enumerate(top5, 1):
            nutrients = f"E:{cand.energy_kcal}kcal, P:{cand.protein_g}g, F:{cand.fat_g}g, C:{cand.carb_g}g, Fib:{cand.fiber_g}g"
            bonuses = f"fiber_bonus:+{cand.fiber_bonus:.4f}, pref_bonus:+{cand.preference_bonus:.4f}"
            statuses = (
                f"data_conf:{cand.score_breakdown.data_confidence_status.value}, "
                f"prot:{cand.score_breakdown.protein_concentration_status.value}, "
                f"fiber:{cand.score_breakdown.fiber_concentration_status.value}, "
                f"pref:{cand.score_breakdown.preference_status.value}"
            )
            print(f"\n--- #{idx}: {cand.entity_id} — {cand.display_name} ({cand.canonical_name}) ---")
            print(f"  candidate_priority_score: {cand.candidate_priority_score:.4f}")
            print(f"  base_score: {cand.base_candidate_score:.4f}")
            print(f"  optional_bonuses: {bonuses}")
            print(f"  score_statuses: {statuses}")
            print(f"  nutrition_consistency_status: {cand.nutrition_consistency_status.value}")
            print(f"  nutrients_used: {nutrients}")
            print(f"  planner_readiness: {cand.planner_readiness}")
            print(f"  recipe_availability: {cand.recipe_instruction_available}")
            print(f"  explanation_tokens: {cand.explanation_tokens}")


if __name__ == "__main__":
    main()
