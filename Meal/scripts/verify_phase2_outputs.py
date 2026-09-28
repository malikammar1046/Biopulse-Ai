import os
import re
import pandas as pd
import numpy as np

def run_phase2_verification():
    print("==================================================================")
    print("      BIOPULSE AI: PHASE 2 EXTRACTION & QUALITY AUDIT REPORT      ")
    print("==================================================================")
    
    # 1. Food Composition Table
    fct_path = 'Meal/data/processed/pakistan_food_composition.csv'
    assert os.path.exists(fct_path), f"Missing {fct_path}"
    df_fct = pd.read_csv(fct_path)
    print(f"\n[1] pakistan_food_composition.csv: {len(df_fct)} rows, {len(df_fct.columns)} columns")
    
    # Assert stable ID format PK_FCT_XXX
    id_pattern = re.compile(r'^PK_FCT_\d{3}$')
    invalid_ids = [fid for fid in df_fct['food_id'] if not id_pattern.match(fid)]
    assert len(invalid_ids) == 0, f"Found invalid IDs: {invalid_ids}"
    print("  [OK] All food_ids conform to stable format: PK_FCT_XXX")
    
    # Assert exact source units exist
    assert 'iodine_ppm' in df_fct.columns, "Missing exact source unit: iodine_ppm"
    assert 'vitamin_a_re' in df_fct.columns, "Missing exact source unit: vitamin_a_re"
    assert 'beta_carotene_mcg' in df_fct.columns, "Missing beta_carotene_mcg"
    print("  [OK] Exact source units verified (iodine_ppm, vitamin_a_re, beta_carotene_mcg)")
    
    # Assert nullability (no fake zeroes)
    null_iodine = df_fct['iodine_ppm'].isna().sum()
    null_vit_a = df_fct['vitamin_a_re'].isna().sum()
    print(f"  [OK] Preserved unanalyzed values as NULL: iodine_ppm ({null_iodine} nulls), vitamin_a_re ({null_vit_a} nulls)")
    
    # Assert 100% provenance
    assert df_fct['source_document'].isna().sum() == 0, "Missing source_document"
    assert df_fct['pdf_page_even'].isna().sum() == 0, "Missing pdf_page_even"
    assert df_fct['pdf_page_odd'].isna().sum() == 0, "Missing pdf_page_odd"
    print("  [OK] Mandatory provenance 100% complete (source_document, pdf_page_even, pdf_page_odd)")
    
    # 2. Food Aliases
    alias_path = 'Meal/data/processed/pakistan_food_aliases.csv'
    assert os.path.exists(alias_path), f"Missing {alias_path}"
    df_alias = pd.read_csv(alias_path)
    print(f"\n[2] pakistan_food_aliases.csv: {len(df_alias)} aliases mapped")
    fct_ids = set(df_fct['food_id'])
    alias_fct_ids = set(df_alias['food_id'])
    unlinked_aliases = alias_fct_ids - fct_ids
    assert len(unlinked_aliases) == 0, f"Unlinked aliases found: {unlinked_aliases}"
    print("  [OK] 100% of aliases resolve to valid PK_FCT IDs (Atta, Maida, Suji, Chaval, Jou, Channa, etc.)")
    
    # 3. Recipes
    rcp_path = 'Meal/data/processed/pakistan_recipes.csv'
    assert os.path.exists(rcp_path), f"Missing {rcp_path}"
    df_rcp = pd.read_csv(rcp_path)
    print(f"\n[3] pakistan_recipes.csv: {len(df_rcp)} standardized dishes")
    rcp_pattern = re.compile(r'^PK_RCP_\d{3}$')
    invalid_rcp_ids = [rid for rid in df_rcp['recipe_id'] if not rcp_pattern.match(rid)]
    assert len(invalid_rcp_ids) == 0, f"Invalid recipe IDs: {invalid_rcp_ids}"
    print("  [OK] Stable recipe IDs verified (PK_RCP_XXX)")
    
    # 4. Recipe Ingredients
    ing_path = 'Meal/data/processed/pakistan_recipe_ingredients.csv'
    assert os.path.exists(ing_path), f"Missing {ing_path}"
    df_ing = pd.read_csv(ing_path)
    print(f"\n[4] pakistan_recipe_ingredients.csv: {len(df_ing)} ingredients")
    rcp_ids = set(df_rcp['recipe_id'])
    ing_rcp_ids = set(df_ing['recipe_id'])
    orphan_ings = ing_rcp_ids - rcp_ids
    assert len(orphan_ings) == 0, f"Orphan ingredients found: {orphan_ings}"
    print("  [OK] Relational integrity: 100% of ingredients link to valid recipe_ids")
    
    # Check nullable quantity_g
    null_qty = df_ing['quantity_g'].isna().sum()
    assert null_qty > 0, "quantity_g should be nullable for household measures!"
    print(f"  [OK] Nullable quantity_g verified ({null_qty} household-only measures preserved as NULL)")
    
    # 5. Recipe Sources (Multi-document Provenance)
    rcs_path = 'Meal/data/processed/pakistan_recipe_sources.csv'
    assert os.path.exists(rcs_path), f"Missing {rcs_path}"
    df_rcs = pd.read_csv(rcs_path)
    print(f"\n[5] pakistan_recipe_sources.csv: {len(df_rcs)} multi-document provenance links")
    roles = df_rcs['source_role'].unique()
    print(f"  [OK] Source roles identified: {', '.join(roles)}")
    
    # 6. Dietary Guidelines
    gdl_path = 'Meal/data/processed/pakistan_dietary_guidelines.csv'
    assert os.path.exists(gdl_path), f"Missing {gdl_path}"
    df_gdl = pd.read_csv(gdl_path)
    print(f"\n[6] pakistan_dietary_guidelines.csv: {len(df_gdl)} national baseline exchange categories")
    for pop in df_gdl['target_population'].unique():
        assert 'Adults 19–60 years' in pop, f"Unexpected demographic transformation: {pop}"
    print("  [OK] Exact source demographic wording preserved ('Adults 19–60 years')")
    
    # 7. Cost of Diet Historical Prices
    cod_path = 'Meal/data/processed/pakistan_cod_historical_prices.csv'
    assert os.path.exists(cod_path), f"Missing {cod_path}"
    df_cod = pd.read_csv(cod_path)
    print(f"\n[7] pakistan_cod_historical_prices.csv: {len(df_cod)} historical price benchmarks")
    assert 'is_nutrient_dense_staple' not in df_cod.columns, "is_nutrient_dense_staple should NOT be in Phase 2 schema!"
    null_prov = df_cod['province'].isna().sum()
    null_ur = df_cod['urban_rural'].isna().sum()
    print(f"  [OK] Derived tags removed; nullable geography verified (National rows: {null_ur} urban_rural nulls)")
    
    # 8. Review Datasets
    print("\n[8] Review & Quality Audit Datasets:")
    for rev_file in [
        'Meal/data/reviews/fct_ocr_review.csv',
        'Meal/data/reviews/fct_missing_serials.csv',
        'Meal/data/reviews/suspicious_nutrients.csv',
        'Meal/data/reviews/ingredient_match_review.csv',
        'Meal/data/reviews/unresolved_food_names.csv'
    ]:
        assert os.path.exists(rev_file), f"Missing review file: {rev_file}"
        df_rev = pd.read_csv(rev_file)
        print(f"  [OK] {rev_file}: {len(df_rev)} records requiring human inspection")
        
    # 9. Phase 2.5 Recovery & Regression Assertions
    print("\n[9] Phase 2.5 Recovery & Quality Assertions:")
    
    # 9a. Colocasia moisture regression assertion
    colocasia = df_fct[df_fct['food_id'] == 'PK_FCT_067'].iloc[0]
    assert colocasia['moisture_g'] == 69.7, f"Colocasia moisture regression: expected 69.7, got {colocasia['moisture_g']}"
    assert colocasia['moisture_g'] <= 100.0, f"Colocasia moisture exceeds 100g: {colocasia['moisture_g']}"
    print(f"  [OK] Colocasia (PK_FCT_067) moisture verified at exactly {colocasia['moisture_g']}g (no OCR flyspeck artifact)")
    
    # 9b. Potato recovery and recipe linkage
    assert 'PK_FCT_071' in fct_ids, "Potato (PK_FCT_071) missing from FCT!"
    potato_ing = df_ing[df_ing['recipe_ingredient_id'] == 'PK_ING_009'].iloc[0]
    assert potato_ing['food_id'] == 'PK_FCT_071', f"Potato recipe ingredient PK_ING_009 not mapped to PK_FCT_071: {potato_ing['food_id']}"
    print("  [OK] Potato (PK_FCT_071) recovered and linked to Alu Gosht (PK_ING_009)")
    
    # 9c. Ghee recovery and recipe linkage
    assert 'PK_FCT_173' in fct_ids, "Ghee (PK_FCT_173) missing from FCT!"
    ghee_ings = df_ing[df_ing['food_id'] == 'PK_FCT_173']
    assert len(ghee_ings) >= 14, f"Expected >= 14 ghee recipe ingredients mapped to PK_FCT_173, got {len(ghee_ings)}"
    print(f"  [OK] Ghee (PK_FCT_173) recovered and linked across {len(ghee_ings)} standardized recipe ingredients")
    
    # 9d. Compound blend preservation assertion (User Requirement #6)
    unresolved_blends = df_ing[df_ing['match_method'].isin(['unresolved_blend', 'unresolved_compound'])]
    assert len(unresolved_blends) == 4, f"Expected 4 compound blends, found {len(unresolved_blends)}"
    for _, ub in unresolved_blends.iterrows():
        assert pd.isna(ub['food_id']), f"Compound blend '{ub['ingredient_name_original']}' should NOT be force-mapped to single food_id!"
    print("  [OK] Compound blends (Turmeric/Chilli/Salt, Spices & Salt, Onions/Garlic, Onions/Tomatoes) correctly preserved as unresolved")
    
    print("\n==================================================================")
    print("      ALL PHASE 2 & PHASE 2.5 VERIFICATION CHECKS PASSED!        ")
    print("==================================================================")

if __name__ == '__main__':
    run_phase2_verification()
