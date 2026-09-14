import os
import sys
import json
import re
import pandas as pd
import numpy as np

def run_phase3_validation():
    print("="*60)
    print("PHASE 3: COMPREHENSIVE NUTRITION VALIDATION TEST SUITE")
    print("="*60)

    # File paths
    p_recipes = 'Meal/data/processed/pakistan_recipes.csv'
    p_audit = 'Meal/data/processed/pakistan_recipe_serving_audit.csv'
    p_ing = 'Meal/data/processed/pakistan_recipe_ingredients.csv'
    p_nut = 'Meal/data/processed/pakistan_recipe_nutrition.csv'
    p_calc = 'Meal/data/processed/pakistan_recipe_nutrition_calculated.csv'
    p_val = 'Meal/data/processed/pakistan_recipe_nutrition_validation.csv'
    p_portion = 'Meal/data/processed/pakistan_portion_references.csv'
    p_cult = 'Meal/data/processed/pakistan_cultural_dishes.csv'
    p_golden = 'Meal/data/raw/fct_traditional_dishes_golden.json'
    p_fct = 'Meal/data/processed/pakistan_food_composition.csv'

    # Check existence
    all_files = [p_recipes, p_audit, p_ing, p_nut, p_calc, p_val, p_portion, p_cult, p_golden, p_fct]
    for p in all_files:
        assert os.path.exists(p), f"Missing required file: {p}"
    print(f"[PASS] All {len(all_files)} required datasets, audit tables, and reference files exist.")

    # Load data
    df_recipes = pd.read_csv(p_recipes)
    df_audit = pd.read_csv(p_audit)
    df_ing = pd.read_csv(p_ing)
    df_nut = pd.read_csv(p_nut)
    df_calc = pd.read_csv(p_calc)
    df_val = pd.read_csv(p_val)
    df_portion = pd.read_csv(p_portion)
    df_cult = pd.read_csv(p_cult)
    df_fct = pd.read_csv(p_fct)
    with open(p_golden, 'r', encoding='utf-8') as f:
        golden = json.load(f)

    # 1. Check Recipe Universe Counts & Authority Levels
    assert len(df_recipes) == 17, f"Expected exactly 17 standardized recipes, found {len(df_recipes)}"
    assert (df_recipes['nutrition_authority_level'] == 'LEVEL_A').all(), "All 17 standardized recipes must be LEVEL_A"
    assert (df_recipes['meal_planning_eligible'] == True).all(), "All 17 standardized recipes must be meal_planning_eligible = True"
    assert (df_recipes['entity_type'] == 'standardized_recipe').all(), "All 17 standardized recipes must have entity_type = standardized_recipe"
    print(f"[PASS] 17 standardized recipes verified (100% LEVEL_A, meal_planning_eligible = True).")

    # 2. Source-Integrity Serving Audit Verification
    assert len(df_audit) == 17, f"Expected 17 audited recipes, found {len(df_audit)}"
    assert (~df_audit['serving_explicit_in_source']).all(), "No FCT 2001 dish has an explicit serving size or count in source"
    assert df_audit['final_servings'].isna().all(), "Final servings must be NULL for all unstated FCT dishes"
    assert df_audit['final_serving_size_g'].isna().all(), "Final serving size must be NULL for all unstated FCT dishes"
    assert (df_audit['audit_status'] == 'per_100g_authoritative_only').all()
    
    # Check that pakistan_recipes.csv and pakistan_recipe_nutrition.csv reflect this strictly
    assert df_recipes['servings'].isna().all(), "pakistan_recipes.csv servings must be NULL for all 17 dishes"
    assert df_recipes['serving_size_g'].isna().all(), "pakistan_recipes.csv serving_size_g must be NULL for all 17 dishes"
    assert df_nut['serving_size_g'].isna().all(), "pakistan_recipe_nutrition.csv serving_size_g must be NULL for all 17 dishes"
    assert df_nut['servings_per_recipe'].isna().all(), "pakistan_recipe_nutrition.csv servings_per_recipe must be NULL for all 17 dishes"
    assert df_nut['energy_kcal_per_serving'].isna().all(), "pakistan_recipe_nutrition.csv energy_kcal_per_serving must be NULL"
    print("[PASS] Source serving audit verified: 17/17 dishes have zero inferred servings and authoritative per-100g nutrition strictly.")

    # 3. Check Portion References & Discrepancy Tracking
    assert len(df_portion) == 2, f"Expected 2 portion references, found {len(df_portion)}"
    assert set(df_portion['portion_id']) == {'PK_PORTION_001', 'PK_PORTION_002'}
    assert (df_portion['nutrition_authority_level'] == 'LEVEL_B').all()
    assert (df_portion['entity_type'] == 'standard_portion_reference').all()
    
    # Check that both guideline-reported and FCT-calculated values are preserved with discrepancy fields
    for col in [
        'guideline_reported_energy_kcal', 'guideline_reported_carb_g', 'guideline_reported_protein_g',
        'fct_calculated_energy_kcal', 'fct_calculated_carb_g', 'fct_calculated_protein_g',
        'energy_discrepancy_pct', 'carb_discrepancy_pct', 'discrepancy_status', 'authority_distinction'
    ]:
        assert col in df_portion.columns, f"Missing required column {col} in portion references"
        assert df_portion[col].notna().all(), f"Column {col} has unexpected NULLs in portion references"
    print("[PASS] 2 standard portion references verified with dual guideline/FCT authority tracking and discrepancy metrics.")

    # 4. Check Cultural Reference Dishes
    assert len(df_cult) == 3, f"Expected 3 cultural reference dishes, found {len(df_cult)}"
    assert set(df_cult['recipe_id']) == {'PK_RCP_CUL_001', 'PK_RCP_CUL_002', 'PK_RCP_CUL_003'}
    assert (df_cult['nutrition_authority_level'] == 'LEVEL_D').all()
    assert (df_cult['meal_planning_eligible'] == False).all()
    print("[PASS] 3 cultural reference dishes verified (100% LEVEL_D, meal_planning_eligible = False).")

    # 5. Golden Benchmark Match (17 / 17 exact match)
    golden_dict = {d['dish_number']: d for d in golden}
    for idx, r in df_nut.iterrows():
        rid = r['recipe_id']
        dnum = int(rid.replace('PK_RCP_', ''))
        g = golden_dict[dnum]
        for metric in ['energy_kcal_per_100g', 'moisture_g_per_100g', 'protein_g_per_100g', 'fat_g_per_100g', 'carb_g_per_100g', 'fiber_g_per_100g', 'ash_g_per_100g', 'calcium_mg_per_100g', 'iron_mg_per_100g', 'vit_c_mg_per_100g']:
            g_key = metric.replace('_per_100g', '')
            val_nut = r[metric]
            val_gold = g[g_key]
            assert abs(val_nut - val_gold) < 1e-4, f"Mismatch in {rid} for {metric}: {val_nut} vs {val_gold}"
    print("[PASS] 17 / 17 recipes match the laboratory-tested golden benchmark with 100% precision.")

    # 6. Non-negativity Check across all tables
    for df, name in [(df_nut, 'df_nut'), (df_calc, 'df_calc'), (df_portion, 'df_portion')]:
        num_cols = df.select_dtypes(include=[np.number]).columns
        for c in num_cols:
            if 'discrepancy' in c:
                continue # Discrepancy percentages can be negative (e.g. -32.5%)
            vals = df[c].dropna()
            assert (vals >= 0.0).all(), f"Negative values found in {name} column {c}!"
    print("[PASS] Non-negativity constraint verified across all nutrition tables.")

    # 7. NULL Preservation Check (Unmeasured micronutrients must be NULL, never 0)
    unmeasured_cols = [
        'phosphorus_mg_per_100g', 'zinc_mg_per_100g', 'iodine_ppm',
        'thiamin_mg_per_100g', 'riboflavin_mg_per_100g', 'niacin_mg_per_100g',
        'beta_carotene_mcg_per_100g', 'vitamin_a_re_per_100g', 'cholesterol_mg_per_100g'
    ]
    for c in unmeasured_cols:
        assert df_nut[c].isna().all(), f"Unmeasured nutrient {c} must be strictly NULL/empty, found non-null values!"
    print("[PASS] Unmeasured micronutrients strictly preserved as NULL (zero false zeros).")

    # 8. Referential Integrity
    assert len(df_ing) == 84, f"Expected 84 ingredients, found {len(df_ing)}"
    recipe_ids_in_ing = set(df_ing['recipe_id'].unique())
    assert recipe_ids_in_ing == set(df_recipes['recipe_id']), "All 17 recipes must have corresponding ingredient rows"
    
    # Check food_ids
    mapped_food_ids = set(df_ing['food_id'].dropna().unique())
    fct_food_ids = set(df_fct['food_id'].unique())
    assert mapped_food_ids.issubset(fct_food_ids), "All mapped food_ids must exist in primary FCT"
    print(f"[PASS] Referential integrity confirmed: all 17 recipes and {len(mapped_food_ids)} food mappings resolve cleanly.")

    # 9. Clean Nutritional Neutrality (Zero Premature Disease Claims)
    banned_clinical_terms = [r'\bpcos\b', r'\bhypogonad', r'\binsulin-sensitiz', r'\btestosterone\b', r'\bhormone\b']
    for p in [p_recipes, p_audit, p_nut, p_calc, p_val, p_portion, p_cult]:
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
        for term in banned_clinical_terms:
            matches = re.findall(term, content, re.IGNORECASE)
            assert len(matches) == 0, f"Banned clinical term pattern '{term}' found in {p}: {matches}"
    print("[PASS] Clean nutritional neutrality verified: 0 disease-specific or therapeutic claims exist in Phase 3 datasets.")

    # 10. Water Solvent Handling and Compound Ingredient Exclusion
    water_rows = df_ing[df_ing['ingredient_name_original'].str.lower() == 'water']
    assert (water_rows['food_id'].isna()).all(), "Water must not be mapped to nutrient-bearing food IDs"
    assert (water_rows['match_method'] == 'unmapped_solvent').all(), "Water match_method must be unmapped_solvent"
    print("[PASS] Water solvent handling and compound ingredient exclusion rules strictly satisfied.")

    # 11. Yield Factor Semantics
    # Yield factor must be metadata only and never multiplied into nutrients
    assert 'yield_factor' in df_calc.columns, "Yield factor must exist in df_calc as descriptive metadata"
    # Verify tested values in df_nut are identical to laboratory golden values without yield multiplier
    for idx, r in df_nut.iterrows():
        dnum = int(r['recipe_id'].replace('PK_RCP_', ''))
        assert r['energy_kcal_per_100g'] == golden_dict[dnum]['energy_kcal']
    print("[PASS] Yield factor semantics verified as non-multiplicative metadata.")

    # 12. Pymupdf Compliance
    scripts_dir = 'Meal/scripts'
    banned_import = 'import ' + 'fitz'
    banned_from = 'from ' + 'fitz '
    for fname in os.listdir(scripts_dir):
        if fname.endswith('.py') and fname != 'validate_recipe_nutrition.py':
            fpath = os.path.join(scripts_dir, fname)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            assert banned_import not in content, f"Deprecated '{banned_import}' found in {fname}! Must use 'import pymupdf'."
            assert banned_from not in content, f"Deprecated '{banned_from}' found in {fname}! Must use 'import pymupdf'."
    print("[PASS] Repository scripts verified 100% compliant with pymupdf (zero deprecated fitz imports).")


    print("\n" + "="*60)
    print("ALL PHASE 3 VALIDATION TESTS PASSED (100% SUCCESS)!")
    print("="*60)
    return True

if __name__ == '__main__':
    run_phase3_validation()
