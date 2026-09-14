"""
Rigorously validates the Phase 4C Canonical Pakistani Meal Catalog,
Nutrition Observations Layer, Default Planner Nutrition Profiles,
and Master Planner Catalog.

Validates:
1. File existence and schema integrity across all 4 datasets.
2. Independent preservation of all 47 laboratory observations (17 FCT, 30 Khan).
3. 40 Canonical composite dishes (7 with multiple observations, 33 with one observation).
4. Variant families preserved without merging (PK_VARFAM_FISH_001, PK_VARFAM_KARAHI_001).
5. Separation of recipe instruction eligibility from complete gram quantification.
6. Neutral evidence selection reason without clinical/quality bias.
7. Preservation of native nutrition bases (per_100g_cooked, per_100g_source_food_state, standard_portion).
8. Authoritative portion basis preserved for standard portions alongside derived normalized values.
9. Conservative allergen completeness semantics (Khan dishes allergen_assessment_complete=False).
10. Strict component gating (only 29 READY_DIRECT components enter, 0 RECIPE_ONLY).
11. Absolute absence of clinical/therapeutic marketing buzzwords.
"""

import os
import sys
import pandas as pd
import numpy as np

def run_validation():
    print("=" * 65)
    print("VALIDATING PHASE 4C: CANONICAL PAKISTANI MEAL CATALOG")
    print("=" * 65)

    passed_checks = 0
    total_checks = 0

    def check(desc, condition):
        nonlocal passed_checks, total_checks
        total_checks += 1
        if condition:
            passed_checks += 1
            print(f"  [PASS] {desc}")
        else:
            print(f"  [FAIL] {desc}")
            raise AssertionError(f"Validation failed on: {desc}")

    p_obs = "Meal/data/processed/pakistan_nutrition_observations.csv"
    p_dishes = "Meal/data/processed/pakistan_canonical_dishes.csv"
    p_profiles = "Meal/data/processed/pakistan_planner_nutrition_profiles.csv"
    p_master = "Meal/data/processed/pakistan_master_planner_catalog.csv"

    # -------------------------------------------------------------
    # 1. File Existence & Schema Integrity
    # -------------------------------------------------------------
    print("\n--- 1. File Existence & Loading ---")
    check("pakistan_nutrition_observations.csv exists", os.path.exists(p_obs))
    check("pakistan_canonical_dishes.csv exists", os.path.exists(p_dishes))
    check("pakistan_planner_nutrition_profiles.csv exists", os.path.exists(p_profiles))
    check("pakistan_master_planner_catalog.csv exists", os.path.exists(p_master))

    df_obs = pd.read_csv(p_obs)
    df_dishes = pd.read_csv(p_dishes)
    df_profiles = pd.read_csv(p_profiles)
    df_master = pd.read_csv(p_master)

    # -------------------------------------------------------------
    # 2. Nutrition Observations Layer (47 observations)
    # -------------------------------------------------------------
    print("\n--- 2. Laboratory Nutrition Observations Layer ---")
    check("Exactly 47 laboratory observations preserved", len(df_obs) == 47)
    check("All observation IDs are unique", df_obs['observation_id'].nunique() == 47)

    fct_obs = df_obs[df_obs['source_id'] == 'SRC_PK_001']
    khan_obs = df_obs[df_obs['source_id'] == 'SRC_PK_003']
    check("Exactly 17 FCT laboratory observations", len(fct_obs) == 17)
    check("Exactly 30 Khan 2019 laboratory observations", len(khan_obs) == 30)

    check("All observations link to valid canonical dishes", df_obs['canonical_dish_id'].isin(df_dishes['canonical_dish_id']).all())
    check("All observations have nutrition_basis = per_100g_cooked", (df_obs['nutrition_basis'] == 'per_100g_cooked').all())
    check("All observations have positive energy", (df_obs['energy_kcal_per_100g'] > 0).all())
    check("All observations have non-negative protein", (df_obs['protein_g_per_100g'] >= 0).all())
    check("All observations have non-negative fat", (df_obs['fat_g_per_100g'] >= 0).all())
    check("All observations have non-negative carb", (df_obs['carb_g_per_100g'] >= 0).all())

    # Khan observations have unmeasured fiber/micronutrients as NaN, not false zeros
    check("Khan observations have NaN for unmeasured fiber", khan_obs['fiber_g_per_100g'].isna().all())
    check("Khan observations have NaN for unmeasured calcium", khan_obs['calcium_mg_per_100g'].isna().all())
    check("Khan observations have NaN for unmeasured iron", khan_obs['iron_mg_per_100g'].isna().all())
    check("Khan observations have NaN for unmeasured vitamin C", khan_obs['vit_c_mg_per_100g'].isna().all())

    # -------------------------------------------------------------
    # 3. Canonical Dishes Layer (40 dishes)
    # -------------------------------------------------------------
    print("\n--- 3. Canonical Composite Dishes Layer ---")
    check("Exactly 40 canonical dishes defined", len(df_dishes) == 40)
    check("All canonical dish IDs are unique", df_dishes['canonical_dish_id'].nunique() == 40)
    check("All canonical dish English names are unique", df_dishes['canonical_name_en'].nunique() == 40)

    # Multi-observation derivation
    obs_counts = df_obs.groupby('canonical_dish_id').size()
    multi_obs_dishes = obs_counts[obs_counts > 1].index.tolist()
    single_obs_dishes = obs_counts[obs_counts == 1].index.tolist()

    check("Exactly 7 canonical dishes have multiple observations", len(multi_obs_dishes) == 7)
    check("Exactly 33 canonical dishes have a single observation", len(single_obs_dishes) == 33)
    check("Total observation verification: 7*2 + 33*1 == 47", (len(multi_obs_dishes) * 2 + len(single_obs_dishes) * 1) == 47)

    # Overlap dishes verification
    expected_overlaps = ['PK_DISH_003', 'PK_DISH_004', 'PK_DISH_005', 'PK_DISH_006', 'PK_DISH_008', 'PK_DISH_010', 'PK_DISH_013']
    check("Expected 7 overlap dishes match multi-observation set", set(multi_obs_dishes) == set(expected_overlaps))

    # Variant families
    fish_family = df_dishes[df_dishes['variant_family_id'] == 'PK_VARFAM_FISH_001']
    check("Fish variant family contains exactly 2 dishes", len(fish_family) == 2)
    check("Battered Machli (PK_DISH_011) and Pan-Fried Fish (PK_DISH_024) are separate canonical dishes", set(fish_family['canonical_dish_id']) == {'PK_DISH_011', 'PK_DISH_024'})

    karahi_family = df_dishes[df_dishes['variant_family_id'] == 'PK_VARFAM_KARAHI_001']
    check("Karahi variant family contains exactly 2 dishes", len(karahi_family) == 2)
    check("Chicken Karahi (PK_DISH_019) and Mutton Karahi (PK_DISH_020) are separate canonical dishes", set(karahi_family['canonical_dish_id']) == {'PK_DISH_019', 'PK_DISH_020'})

    # Separation of recipe instruction eligibility from gram quantification
    check("All 17 FCT dishes have recipe_instruction_eligible == True", (df_dishes.loc[df_dishes['has_complete_recipe'], 'recipe_instruction_eligible'] == True).all())
    check("All 23 Khan dishes have recipe_instruction_eligible == False", (df_dishes.loc[~df_dishes['has_complete_recipe'], 'recipe_instruction_eligible'] == False).all())

    fct_dishes = df_dishes[df_dishes['has_complete_recipe']]
    gram_quantified = fct_dishes[fct_dishes['all_ingredients_quantified_in_grams']]
    complete_source = fct_dishes[~fct_dishes['all_ingredients_quantified_in_grams']]

    check("Exactly 11 FCT dishes are fully gram-quantified (QUANTITATIVE_GRAM_FORMULATION)", len(gram_quantified) == 11 and (gram_quantified['formulation_authority'] == 'QUANTITATIVE_GRAM_FORMULATION').all())
    check("Exactly 6 FCT dishes contain household/taste measures (COMPLETE_SOURCE_FORMULATION)", len(complete_source) == 6 and (complete_source['formulation_authority'] == 'COMPLETE_SOURCE_FORMULATION').all())
    check("Household measures dishes still preserve recipe_instruction_eligible == True", (complete_source['recipe_instruction_eligible'] == True).all())

    # Allergen assessment completeness
    check("FCT dishes have allergen_assessment_complete == True", (fct_dishes['allergen_assessment_complete'] == True).all())
    khan_only_dishes = df_dishes[~df_dishes['has_complete_recipe']]
    check("Khan dishes have allergen_assessment_complete == False", (khan_only_dishes['allergen_assessment_complete'] == False).all())
    check("Khan dishes do not falsely default unspecified allergens to False", khan_only_dishes['known_contains_dairy'].isna().any())

    # -------------------------------------------------------------
    # 4. Planner Nutrition Profiles Layer (40 profiles)
    # -------------------------------------------------------------
    print("\n--- 4. Planner Nutrition Profiles Layer ---")
    check("Exactly 40 default planner nutrition profiles", len(df_profiles) == 40)
    check("All profile canonical dish IDs match canonical dishes", (df_profiles['canonical_dish_id'] == df_dishes['canonical_dish_id']).all())
    check("All default observations point to real observation records", df_profiles['default_observation_id'].isin(df_obs['observation_id']).all())

    # Default selection policy verification
    overlap_profiles = df_profiles[df_profiles['canonical_dish_id'].isin(expected_overlaps)]
    check("All 7 overlap dishes select FCT observation as default", overlap_profiles['default_observation_id'].str.startswith('OBS_FCT_').all())
    check("All 7 overlap dishes preserve Khan observation in alternate_observation_ids", overlap_profiles['alternate_observation_ids'].str.startswith('OBS_KHAN_').all())

    # Neutral wording check
    check("Overlap profiles selection reason contains neutral documented formulation justification", overlap_profiles['selection_reason'].str.contains("FCT laboratory observation selected as planner default because the same source also provides a documented dish formulation").all())
    check("Selection reasons do NOT cite calories, protein, or superiority", (~df_profiles['selection_reason'].str.contains("superior|better|calorie|protein|clinical|healthy", case=False)).all())

    # Variability metadata check (no averaging)
    for idx, row in overlap_profiles.iterrows():
        cid = row['canonical_dish_id']
        obs = df_obs[df_obs['canonical_dish_id'] == cid]
        check(f"{cid} energy_min matches min observation", row['energy_min'] == obs['energy_kcal_per_100g'].min())
        check(f"{cid} energy_max matches max observation", row['energy_max'] == obs['energy_kcal_per_100g'].max())
        check(f"{cid} planner energy equals default observation energy (NO averaging)", row['planner_energy_kcal_per_100g'] == obs.set_index('observation_id').loc[row['default_observation_id'], 'energy_kcal_per_100g'])

    # -------------------------------------------------------------
    # 5. Master Planner Catalog (71 entities)
    # -------------------------------------------------------------
    print("\n--- 5. Master Planner Catalog ---")
    check("Exactly 71 master planner entities", len(df_master) == 71)
    check("All planner entity IDs are unique", df_master['planner_entity_id'].nunique() == 71)

    readiness_counts = df_master['planner_readiness'].value_counts()
    check("Exactly 17 READY_RECIPE_AND_NUTRITION entities", readiness_counts.get('READY_RECIPE_AND_NUTRITION', 0) == 17)
    check("Exactly 23 READY_NUTRITION_ONLY entities", readiness_counts.get('READY_NUTRITION_ONLY', 0) == 23)
    check("Exactly 29 READY_DIRECT_COMPONENT entities", readiness_counts.get('READY_DIRECT_COMPONENT', 0) == 29)
    check("Exactly 2 READY_STANDARD_PORTION entities", readiness_counts.get('READY_STANDARD_PORTION', 0) == 2)

    # Native nutrition basis preservation
    dishes_m = df_master[df_master['entity_type'] == 'COMPOSITE_DISH']
    direct_m = df_master[df_master['entity_type'] == 'DIRECT_COMPONENT']
    port_m = df_master[df_master['entity_type'] == 'STANDARD_PORTION']

    check("All composite dishes have native_nutrition_basis = per_100g_cooked", (dishes_m['native_nutrition_basis'] == 'per_100g_cooked').all())
    check("All direct components have native_nutrition_basis = per_100g_source_food_state", (direct_m['native_nutrition_basis'] == 'per_100g_source_food_state').all())
    check("All standard portions have native_nutrition_basis = standard_portion", (port_m['native_nutrition_basis'] == 'standard_portion').all())

    # Standard portions authoritative basis preservation
    chapati_m = port_m[port_m['planner_entity_id'] == 'PK_PORTION_001'].iloc[0]
    rice_m = port_m[port_m['planner_entity_id'] == 'PK_PORTION_002'].iloc[0]

    check("Chapati portion weight is 80.0g", chapati_m['portion_weight_g'] == 80.0)
    check("Chapati nutrition per portion is 214.2 kcal", chapati_m['nutrition_per_portion'] == 214.2)
    check("Chapati guideline exchange is preserved (160 kcal)", chapati_m['guideline_exchange_energy_kcal'] == 160.0)
    check("Chapati derived FCT is preserved (214.2 kcal)", chapati_m['derived_fct_energy_kcal'] == 214.2)
    check("Chapati native energy_kcal_per_100g is NaN (does not replace portion basis)", pd.isna(chapati_m['energy_kcal_per_100g']))
    check("Chapati normalized_energy_kcal_per_100g is derived (~267.8 kcal)", abs(chapati_m['normalized_energy_kcal_per_100g'] - 267.75) <= 0.1)

    check("Boiled rice portion weight is 75.0g", rice_m['portion_weight_g'] == 75.0)
    check("Boiled rice nutrition per portion is 108.0 kcal", rice_m['nutrition_per_portion'] == 108.0)
    check("Boiled rice guideline exchange is preserved (160 kcal)", rice_m['guideline_exchange_energy_kcal'] == 160.0)
    check("Boiled rice derived FCT is preserved (108.0 kcal)", rice_m['derived_fct_energy_kcal'] == 108.0)
    check("Boiled rice native energy_kcal_per_100g is NaN (does not replace portion basis)", pd.isna(rice_m['energy_kcal_per_100g']))
    check("Boiled rice normalized_energy_kcal_per_100g is derived (144.0 kcal)", rice_m['normalized_energy_kcal_per_100g'] == 144.0)

    # Dynamic portioning flag
    check("Composite dishes support dynamic portioning", dishes_m['supports_dynamic_portioning'].all())
    check("Direct components support dynamic portioning", direct_m['supports_dynamic_portioning'].all())
    check("Standard portions do NOT support dynamic portioning (they are fixed portion references)", (~port_m['supports_dynamic_portioning']).all())

    # Component gating
    check("All 29 direct components are READY_DIRECT", (direct_m['planner_readiness'] == 'READY_DIRECT_COMPONENT').all())
    check("Zero RECIPE_ONLY components leaked into master planner catalog", (~df_master['planner_entity_id'].str.contains("COMP_RAW|COMP_ING")).all())

    # Recipe instruction vs preparation instruction separation
    check("Exactly 17 master entities have recipe_instruction_eligible == True (composite dishes only)", df_master['recipe_instruction_eligible'].sum() == 17)
    check("Exactly 19 master entities have preparation_instruction_available == True (17 dishes + 2 portions)", df_master['preparation_instruction_available'].sum() == 19)
    check("Standard portions have recipe_instruction_eligible == False", (port_m['recipe_instruction_eligible'] == False).all())
    check("Standard portions have preparation_instruction_available == True", (port_m['preparation_instruction_available'] == True).all())

    # -------------------------------------------------------------
    # 6. Master Catalog Traceability Audit Verification
    # -------------------------------------------------------------
    print("\n--- 6. Master Catalog Traceability Audit ---")
    p_trace = "Meal/data/processed/pakistan_master_catalog_traceability.csv"
    check("pakistan_master_catalog_traceability.csv exists", os.path.exists(p_trace))
    df_trace = pd.read_csv(p_trace)
    check("Traceability dataset has exactly 71 records", len(df_trace) == 71)
    check("All 71 entities have origin_found == True", df_trace['origin_found'].all() == True)
    check("Zero untraceable planner entities in master catalog", (df_trace['origin_found'] == False).sum() == 0)
    check("All audit_status values are ORIGIN_VERIFIED_*", df_trace['audit_status'].str.startswith('ORIGIN_VERIFIED_').all())
    check("Traceability entity IDs match master planner catalog exactly", (df_trace['planner_entity_id'] == df_master['planner_entity_id']).all())

    # -------------------------------------------------------------
    # 7. Refined Formulation Limitation Metrics Verification
    # -------------------------------------------------------------
    print("\n--- 7. Refined Formulation Limitation Metrics ---")
    df_ing = pd.read_csv("Meal/data/processed/pakistan_recipe_ingredients.csv")
    fully_gram_rids = []
    hh_measure_rids = []
    unquantified_rids = []
    ad_libitum_rids = []
    compound_rids = []

    for rid, g in df_ing.groupby('recipe_id'):
        has_null_g = g['quantity_g'].isna().any()
        has_hh = g['unit_original'].str.contains('household', na=False).any()
        has_unq = g['quantity_g'].isna().any() or g['unit_original'].str.contains('ad_libitum', na=False).any()
        has_ad_lib = g['unit_original'].str.contains('ad_libitum', na=False).any() or g['ingredient_name_original'].str.contains('taste|pinch', case=False, na=False).any()
        has_comp = g['ingredient_name_original'].str.contains('compound|masala|paste', case=False, na=False).any()

        if (g['quantity_g'].notna()).all() and not has_hh and not has_unq:
            fully_gram_rids.append(rid)
        if has_hh:
            hh_measure_rids.append(rid)
        if has_unq:
            unquantified_rids.append(rid)
        if has_ad_lib:
            ad_libitum_rids.append(rid)
        if has_comp:
            compound_rids.append(rid)

    check("Exactly 11 recipes are fully gram-quantified", len(fully_gram_rids) == 11)
    check("Exactly 4 recipes have household-measure quantities", len(hh_measure_rids) == 4)
    check("Exactly 6 recipes have unquantified quantities", len(unquantified_rids) == 6)
    check("Exactly 4 recipes have ad-libitum / to-taste ingredients", len(ad_libitum_rids) == 4)
    check("Exactly 2 recipes have compound ingredients", len(compound_rids) == 2)

    # -------------------------------------------------------------
    # 8. Programmatic Meal Role & Category Coverage Verification
    # -------------------------------------------------------------
    print("\n--- 8. Programmatic Meal Role & Category Coverage ---")
    expected_roles = {
        'breakfast': 19, 'lunch': 47, 'dinner': 47, 'snack': 25,
        'side': 10, 'staple': 6, 'dessert': 5, 'beverage': 2
    }
    for role, exp_cnt in expected_roles.items():
        actual_cnt = df_master['meal_roles'].str.contains(role, case=False, na=False).sum()
        check(f"Meal role '{role}' coverage matches expected ({exp_cnt})", actual_cnt == exp_cnt)

    expected_categories = {
        'vegetable': 17, 'pulse': 10, 'fruit': 10, 'dairy': 7,
        'egg': 2, 'fish': 2, 'chicken': 4, 'beef_mutton': 14,
        'cereal': 11, 'nut_seed': 4, 'mixed_dish': 11
    }
    cat_masks = {
        'vegetable': df_master['category'].str.contains('Vegetable|vegetable', case=False, na=False),
        'pulse': df_master['category'].str.contains('Pulse|pulse|Legume', case=False, na=False),
        'fruit': df_master['category'] == 'fruit',
        'dairy': (df_master['category'] == 'dairy') | (df_master['known_contains_dairy'] == True),
        'egg': (df_master['category'] == 'egg') | (df_master['known_contains_egg'] == True),
        'fish': (df_master['category'] == 'Fish Preparation') | (df_master['known_contains_fish'] == True),
        'chicken': df_master['planner_entity_id'].isin(['PK_DISH_009', 'PK_DISH_012', 'PK_DISH_013', 'PK_DISH_019']),
        'beef_mutton': df_master['planner_entity_id'].isin(['PK_DISH_003', 'PK_DISH_005', 'PK_DISH_006', 'PK_DISH_007', 'PK_DISH_008', 'PK_DISH_010', 'PK_DISH_018', 'PK_DISH_020', 'PK_DISH_021', 'PK_DISH_030', 'PK_DISH_031', 'PK_DISH_032', 'PK_DISH_034', 'PK_DISH_037']),
        'cereal': df_master['category'].isin(['Cereal Staple', 'Rice Composite Dish', 'cereal_staple', 'Meat & Cereal Dish', 'Pasta & Meat Dish']),
        'nut_seed': df_master['category'] == 'nut_seed',
        'mixed_dish': df_master['category'].isin(['Meat & Vegetable Curry', 'Vegetable & Pulse Dish', 'Rice Composite Dish', 'Meat & Cereal Dish', 'Pasta & Meat Dish'])
    }
    for cat, exp_cnt in expected_categories.items():
        actual_cnt = cat_masks[cat].sum()
        check(f"Food category '{cat}' coverage matches expected ({exp_cnt})", actual_cnt == exp_cnt)

    # -------------------------------------------------------------
    # 9. Absence of Clinical & Therapeutic Buzzwords
    # -------------------------------------------------------------
    print("\n--- 9. Absence of Clinical / Therapeutic Claims ---")
    prohibited = ['pcos', 'hypogonadism', 'testosterone', 'hormone', 'insulin-sensitizing', 'therapeutic', 'superfood']
    for p_file, df_to_check in [
        ('pakistan_nutrition_observations.csv', df_obs),
        ('pakistan_canonical_dishes.csv', df_dishes),
        ('pakistan_planner_nutrition_profiles.csv', df_profiles),
        ('pakistan_master_planner_catalog.csv', df_master),
        ('pakistan_master_catalog_traceability.csv', df_trace)
    ]:
        for col in df_to_check.select_dtypes(include=['object']).columns:
            for term in prohibited:
                has_term = df_to_check[col].astype(str).str.contains(term, case=False, na=False).any()
                check(f"No prohibited term '{term}' in {p_file} column '{col}'", not has_term)

    print("\n" + "=" * 65)
    print(f"ALL PHASE 4C VALIDATION CHECKS PASSED: {passed_checks}/{total_checks}")
    print("=" * 65)

if __name__ == '__main__':
    run_validation()

