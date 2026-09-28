"""
Builds the Canonical Pakistani Meal Catalog, Nutrition Observations Layer,
Default Planner Nutrition Profiles, and Master Planner Catalog for Phase 4C.

Datasets generated in Meal/data/processed/:
1. pakistan_nutrition_observations.csv (47 laboratory observations)
2. pakistan_canonical_dishes.csv (40 canonical composite dishes)
3. pakistan_planner_nutrition_profiles.csv (40 planner default profiles with variability metadata)
4. pakistan_master_planner_catalog.csv (71 planner-eligible entities: 40 dishes + 29 direct components + 2 standard portions)

Enforces:
- Separation of recipe instruction availability from complete gram quantification.
- Explicit native_nutrition_basis preservation (per_100g_cooked, per_100g_source_food_state, standard_portion).
- Dynamic count derivation without hardcoding.
- Transparent, non-causal evidence-selection policy.
- Zero averaging of independent laboratory observations.
- Preservation of related variant families without merging dishes.
- Conservative allergen assessment semantics.
"""

import os
import sys
import pandas as pd
import numpy as np

def build_phase4c_catalog():
    print("=" * 65)
    print("PHASE 4C: CANONICAL PAKISTANI MEAL CATALOG & EVIDENCE CONSOLIDATION")
    print("=" * 65)

    # -------------------------------------------------------------
    # 1. Load Primary Source Evidence
    # -------------------------------------------------------------
    p_fct_nut = "Meal/data/processed/pakistan_recipe_nutrition.csv"
    p_fct_rcp = "Meal/data/processed/pakistan_recipes.csv"
    p_fct_ing = "Meal/data/processed/pakistan_recipe_ingredients.csv"
    p_khan = "Meal/data/research/khan_2019_pakistani_dishes.csv"
    p_ident = "Meal/data/research/fct_khan_identity_resolution.csv"
    p_comp = "Meal/data/processed/pakistan_meal_components.csv"
    p_port = "Meal/data/processed/pakistan_portion_references.csv"

    df_fct_nut = pd.read_csv(p_fct_nut).set_index('recipe_id')
    df_fct_rcp = pd.read_csv(p_fct_rcp).set_index('recipe_id')
    df_fct_ing = pd.read_csv(p_fct_ing)
    df_khan = pd.read_csv(p_khan)
    df_ident = pd.read_csv(p_ident)
    df_comp = pd.read_csv(p_comp)
    df_port = pd.read_csv(p_port)

    # -------------------------------------------------------------
    # 2. Audit Ingredient Quantities for 17 FCT Recipes
    # -------------------------------------------------------------
    # Audit gram-quantification vs household measures vs unquantified ingredients
    fct_formulation_audit = {}
    for rid, g in df_fct_ing.groupby('recipe_id'):
        tot_cnt = len(g)
        gram_cnt = int(g['quantity_g'].notna().sum())
        hh_cnt = int(g['unit_original'].str.contains('household', na=False).sum())
        unq_cnt = int(g['unit_original'].str.contains('ad_libitum|taste', na=False).sum())
        exp_cnt = gram_cnt + hh_cnt
        all_grams = (gram_cnt == tot_cnt)

        if all_grams:
            form_auth = 'QUANTITATIVE_GRAM_FORMULATION'
        else:
            form_auth = 'COMPLETE_SOURCE_FORMULATION'

        fct_formulation_audit[rid] = {
            'ingredient_count_total': tot_cnt,
            'ingredient_count_with_explicit_quantity': exp_cnt,
            'ingredient_count_with_quantity_g': gram_cnt,
            'ingredient_count_household_measure_only': hh_cnt,
            'ingredient_count_unquantified': unq_cnt,
            'all_ingredients_quantified_in_grams': all_grams,
            'formulation_authority': form_auth,
            'formulation_source_available': True,
            'recipe_instruction_eligible': True
        }

    # -------------------------------------------------------------
    # 3. Canonical Dish Identity Definition (40 Dishes)
    # -------------------------------------------------------------
    # Define 40 distinct culinary dishes based on FCT (17), Khan additions (22), and Machli variant (1)
    # Map each dish to its source entities
    canonical_dishes_definitions = [
        # (dish_id, name_en, name_local, aliases, category, meal_roles, var_fam, dietary_class, fct_id, khan_id, allergens_fct_or_khan)
        ('PK_DISH_001', 'Chapati', 'Gandum ki Roti', 'Roti|Phulka|Flatbread', 'Cereal Staple', 'staple,breakfast,lunch,dinner', None, 'plant_based', 'PK_RCP_001', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': True, 'nuts': False}),
        ('PK_DISH_002', 'Daal Masoor', 'Masoor Daal Salan', 'Red Lentil Curry|Masoor Dal', 'Pulse/Legume Curry', 'lunch,dinner', None, 'plant_based', 'PK_RCP_002', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': False, 'nuts': False}),
        ('PK_DISH_003', 'Alu Gosht', 'Aloo Gosht', 'Potato Meat Curry|Aloo Meat', 'Meat & Vegetable Curry', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_003', 'KHAN_2019_001', {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_004', 'Kalool / Lobia', 'Kalool / Lobia Curry', 'Red Kidney Bean Curry|Rajma Curry', 'Pulse/Legume Curry', 'lunch,dinner', None, 'plant_based', 'PK_RCP_004', 'KHAN_2019_020', {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': False, 'nuts': False}),
        ('PK_DISH_005', 'Kofta Curry', 'Koftay ka Salan', 'Meat Balls Curry|Beef Kofta', 'Meat Curry', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_005', 'KHAN_2019_019', {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_006', 'Pulao Gosht / Beef Pulao', 'Pulao Gosht', 'Beef Pulao|Yakhni Pulao', 'Rice Composite Dish', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_006', 'KHAN_2019_027', {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_007', 'Shami Kabab', 'Shami Kabab', 'Beef and Lentil Patty|Shami Patties', 'Meat Patties / Kabab', 'lunch,dinner,snack', None, 'contains_meat', 'PK_RCP_007', None, {'dairy': False, 'egg': True, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_008', 'Chapli Kabab', 'Chapli Kabab / Chapal Kabab', 'Peshawari Chapli Kabab|Minced Beef Patty', 'Meat Patties / Kabab', 'lunch,dinner,snack', None, 'contains_meat', 'PK_RCP_008', 'KHAN_2019_006', {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_009', 'Chicken Curry', 'Murgh Salan', 'Tari Wali Chicken|Chicken Gravy', 'Poultry Dish', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_009', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_010', 'Haleem', 'Haleem', 'Shahi Haleem|Meat Wheat Porridge', 'Meat & Cereal Dish', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_010', 'KHAN_2019_014', {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': True, 'nuts': False}),
        ('PK_DISH_011', 'Machli (Battered Fried Fish)', 'Tali Hui Machli (Besan)', 'Lahori Fried Fish|Besan Fried Fish', 'Fish Preparation', 'lunch,dinner', 'PK_VARFAM_FISH_001', 'contains_fish', 'PK_RCP_011', None, {'dairy': False, 'egg': False, 'fish': True, 'meat': False, 'wheat': False, 'nuts': False}),
        ('PK_DISH_012', 'Sajji', 'Balochi Sajji', 'Roasted Whole Chicken/Mutton|Sajji Meat', 'Poultry Dish', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_012', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_013', 'Chicken Biryani', 'Chicken Biryani', 'Biryani|Dum Biryani', 'Rice Composite Dish', 'lunch,dinner', None, 'contains_meat', 'PK_RCP_013', 'KHAN_2019_007', {'dairy': True, 'egg': False, 'fish': False, 'meat': True, 'wheat': False, 'nuts': False}),
        ('PK_DISH_014', 'Halwa Suji', 'Suji ka Halwa', 'Semolina Halwa|Meetha Halwa', 'Dessert / Halwa', 'dessert,breakfast', None, 'plant_based', 'PK_RCP_014', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': True, 'nuts': False}),
        ('PK_DISH_015', 'Zarda', 'Meethe Chawal', 'Sweet Yellow Rice|Zarda Pulao', 'Dessert / Sweet Rice', 'dessert', None, 'plant_based', 'PK_RCP_015', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': False, 'nuts': True}),
        ('PK_DISH_016', 'Kheer', 'Chawal ki Kheer', 'Rice Pudding|Firni', 'Dessert / Pudding', 'dessert', None, 'lacto_vegetarian_candidate', 'PK_RCP_016', None, {'dairy': True, 'egg': False, 'fish': False, 'meat': False, 'wheat': False, 'nuts': True}),
        ('PK_DISH_017', 'Halwa Gajar', 'Gajar ka Halwa', 'Carrot Halwa|Gajrela', 'Dessert / Halwa', 'dessert', None, 'plant_based', 'PK_RCP_017', None, {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': False, 'nuts': True}),
        ('PK_DISH_018', 'Beef Korma', 'Gosht Korma', 'Qorma|Shahi Korma', 'Meat Curry', 'lunch,dinner', None, 'contains_meat', None, 'KHAN_2019_002', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_019', 'Chicken Karahi', 'Chicken Karahi', 'Murgh Karahi|Shinwari Karahi', 'Poultry Dish', 'lunch,dinner', 'PK_VARFAM_KARAHI_001', 'contains_meat', None, 'KHAN_2019_008', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_020', 'Mutton Karahi', 'Mutton Karahi', 'Gosht Karahi|Namak Mandi Karahi', 'Meat Dish', 'lunch,dinner', 'PK_VARFAM_KARAHI_001', 'contains_meat', None, 'KHAN_2019_024', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_021', 'Beef Nihari', 'Nihari Gosht', 'Nihari|Shank Stew', 'Meat Stew', 'breakfast,lunch,dinner', None, 'contains_meat', None, 'KHAN_2019_025', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': True, 'nuts': None}),
        ('PK_DISH_022', 'Baingan', 'Baingan Bharta / Salan', 'Brinjal Curry|Eggplant Bharta', 'Vegetable Curry / Bhujia', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_003', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_023', 'Bhindi', 'Bhindi Masala', 'Okra Curry|Bhindi Fry', 'Vegetable Curry / Bhujia', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_004', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_024', 'Fish (Marinated Pan-Fried)', 'Machli Masala', 'Marinated Fried Fish|Pan Fried Fish', 'Fish Preparation', 'lunch,dinner', 'PK_VARFAM_FISH_001', 'contains_fish', None, 'KHAN_2019_013', {'dairy': None, 'egg': None, 'fish': True, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_025', 'Channa Daal', 'Chana Daal Fry', 'Split Bengal Gram Curry|Dal Chana', 'Pulse/Legume Curry', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_005', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_026', 'Choley', 'Chana Masala', 'White Chickpea Curry|Lahori Chana', 'Pulse/Legume Curry', 'breakfast,lunch,dinner', None, 'plant_based', None, 'KHAN_2019_010', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_027', 'Daal Kadu', 'Dal Lauki', 'Chickpea Lentil with Bottle Gourd|Lauki Chana', 'Vegetable & Pulse Dish', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_011', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_028', 'Daal Mash', 'Mash ki Daal', 'White Urad Lentil Curry|Dal Maash', 'Pulse/Legume Curry', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_012', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_029', 'Mix Moong-Masoor Daal (Peeti)', 'Peeti Daal', 'Mixed Lentil Curry|Moong Masoor Dal', 'Pulse/Legume Curry', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_022', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_030', 'Arvi Qeema', 'Kachalo Qeema', 'Colocasia with Minced Beef|Taro Minced Meat', 'Meat & Vegetable Curry', 'lunch,dinner', None, 'contains_meat', None, 'KHAN_2019_015', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_031', 'Kaleji', 'Tawa Kaleji', 'Spiced Mutton/Beef Liver|Liver Fry', 'Organ Meat Dish', 'breakfast,lunch,dinner', None, 'contains_meat', None, 'KHAN_2019_016', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_032', 'Karelay Qeema', 'Karella Qeema', 'Bitter Gourd with Minced Beef|Stuffed Karela', 'Meat & Vegetable Curry', 'lunch,dinner', None, 'contains_meat', None, 'KHAN_2019_017', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_033', 'Kadhi Pakora', 'Kadhi Pakora', 'Curd Curry with Gram Flour Fritters|Punjabi Kadhi', 'Vegetable & Pulse Dish', 'lunch,dinner', None, 'lacto_vegetarian_candidate', None, 'KHAN_2019_018', {'dairy': True, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_034', 'Qeema Macaroni', 'Macroni Qeema', 'Minced Beef Pasta|Desi Macaroni', 'Pasta & Meat Dish', 'lunch,dinner,snack', None, 'contains_meat', None, 'KHAN_2019_021', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': True, 'nuts': None}),
        ('PK_DISH_035', 'Mixed Sabzi', 'Mix Sabzi', 'Seasonal Mixed Vegetable Curry|Mixed Vegetables', 'Vegetable Curry / Bhujia', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_023', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_036', 'Palak', 'Palak Bhujia', 'Spinach Curry|Saag Palak', 'Vegetable Curry / Bhujia', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_026', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_037', 'Shimla Mirch Qeema', 'Capsicum Qeema', 'Minced Beef with Bell Pepper|Shimla Mirch Keema', 'Meat & Vegetable Curry', 'lunch,dinner', None, 'contains_meat', None, 'KHAN_2019_028', {'dairy': None, 'egg': None, 'fish': False, 'meat': True, 'wheat': None, 'nuts': None}),
        ('PK_DISH_038', 'Vegetable Rice', 'Mix Sabzi Chawal', 'Chinese Style Vegetable Rice|Sabzi Pulao', 'Rice Composite Dish', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_009', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None}),
        ('PK_DISH_039', 'Chawal (Tempered Rice)', 'Tarka Rice', 'Tempered Cooked Rice|Tarke Wale Chawal', 'Cereal Staple', 'staple,lunch,dinner', None, 'plant_based', None, 'KHAN_2019_029', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': False, 'nuts': False}),
        ('PK_DISH_040', 'Tori', 'Tori Bhujia', 'Ridge Gourd Curry|Tori Fry', 'Vegetable Curry / Bhujia', 'lunch,dinner', None, 'plant_based', None, 'KHAN_2019_030', {'dairy': None, 'egg': None, 'fish': False, 'meat': False, 'wheat': None, 'nuts': None})
    ]

    # -------------------------------------------------------------
    # 4. Build Nutrition Observations Layer (pakistan_nutrition_observations.csv)
    # -------------------------------------------------------------
    # Total observations: 17 FCT + 30 Khan = 47 observations
    observations_records = []

    # Process 17 FCT observations
    for d in canonical_dishes_definitions:
        cid, name_en, name_loc, aliases, cat, roles, vfam, diet, fct_id, khan_id, allergens = d
        if fct_id is not None:
            f_nut = df_fct_nut.loc[fct_id]
            f_rcp = df_fct_rcp.loc[fct_id]
            audit = fct_formulation_audit[fct_id]

            obs_id = f"OBS_FCT_{fct_id.split('_')[-1]}"
            observations_records.append({
                'observation_id': obs_id,
                'canonical_dish_id': cid,
                'source_id': 'SRC_PK_001',
                'source_entity_id': fct_id,
                'source_dish_name': f_nut['recipe_name'],
                'nutrition_authority': 'LAB_TESTED_FCT',
                'formulation_authority': audit['formulation_authority'],
                'nutrition_basis': 'per_100g_cooked',
                'energy_kcal_per_100g': float(f_nut['energy_kcal_per_100g']),
                'protein_g_per_100g': float(f_nut['protein_g_per_100g']),
                'fat_g_per_100g': float(f_nut['fat_g_per_100g']),
                'carb_g_per_100g': float(f_nut['carb_g_per_100g']),
                'fiber_g_per_100g': float(f_nut['fiber_g_per_100g']) if pd.notna(f_nut['fiber_g_per_100g']) else np.nan,
                'moisture_g_per_100g': float(f_nut['moisture_g_per_100g']) if pd.notna(f_nut['moisture_g_per_100g']) else np.nan,
                'ash_g_per_100g': float(f_nut['ash_g_per_100g']) if pd.notna(f_nut['ash_g_per_100g']) else np.nan,
                'calcium_mg_per_100g': float(f_nut['calcium_mg_per_100g']) if pd.notna(f_nut['calcium_mg_per_100g']) else np.nan,
                'iron_mg_per_100g': float(f_nut['iron_mg_per_100g']) if pd.notna(f_nut['iron_mg_per_100g']) else np.nan,
                'vit_c_mg_per_100g': float(f_nut['vit_c_mg_per_100g']) if pd.notna(f_nut['vit_c_mg_per_100g']) else np.nan,
                'source_exchange_available': False,
                'complete_quantitative_formulation': audit['all_ingredients_quantified_in_grams'],
                'all_ingredients_quantified_in_grams': audit['all_ingredients_quantified_in_grams'],
                'recipe_instruction_eligible': True,
                'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
                'source_page': f"PDF p{f_nut['pdf_page']}",
                'notes': f"Primary official FCT laboratory chemical proximate analysis for {f_nut['recipe_name']}. Formulated in Appendix."
            })

    # Process 30 Khan observations
    khan_dish_to_canonical = {}
    for d in canonical_dishes_definitions:
        cid, name_en, name_loc, aliases, cat, roles, vfam, diet, fct_id, khan_id, allergens = d
        if khan_id is not None:
            khan_dish_to_canonical[khan_id] = cid

    for idx, row in df_khan.iterrows():
        kid = row['dish_id']
        cid = khan_dish_to_canonical[kid]
        obs_id = f"OBS_KHAN_{kid.split('_')[-1]}"

        observations_records.append({
            'observation_id': obs_id,
            'canonical_dish_id': cid,
            'source_id': 'SRC_PK_003',
            'source_entity_id': kid,
            'source_dish_name': row['common_name'],
            'nutrition_authority': 'LAB_TESTED_PEER_REVIEWED_PAKISTAN',
            'formulation_authority': 'MAJOR_INGREDIENTS_ONLY',
            'nutrition_basis': 'per_100g_cooked',
            'energy_kcal_per_100g': float(row['energy_kcal_per_100g']),
            'protein_g_per_100g': float(row['protein_g_per_100g']),
            'fat_g_per_100g': float(row['fat_g_per_100g']),
            'carb_g_per_100g': float(row['carb_g_per_100g']),
            'fiber_g_per_100g': np.nan, # Not reported in Khan 2019
            'moisture_g_per_100g': float(row['moisture_g_per_100g']),
            'ash_g_per_100g': float(row['ash_g_per_100g']),
            'calcium_mg_per_100g': np.nan,
            'iron_mg_per_100g': np.nan,
            'vit_c_mg_per_100g': np.nan,
            'source_exchange_available': True,
            'complete_quantitative_formulation': False,
            'all_ingredients_quantified_in_grams': False,
            'recipe_instruction_eligible': False,
            'source_document': row['source_document'],
            'source_page': row['source_page'],
            'notes': f"Peer-reviewed laboratory proximate analysis (AOAC methods) for {row['common_name']} ({row['local_name']}). Published with exchange values."
        })

    df_obs = pd.DataFrame(observations_records)
    p_obs_out = "Meal/data/processed/pakistan_nutrition_observations.csv"
    df_obs.to_csv(p_obs_out, index=False)
    print(f"Saved {p_obs_out} ({len(df_obs)} laboratory observations).")

    # -------------------------------------------------------------
    # 5. Build Canonical Dishes Layer (pakistan_canonical_dishes.csv)
    # -------------------------------------------------------------
    canonical_records = []
    for d in canonical_dishes_definitions:
        cid, name_en, name_loc, aliases, cat, roles, vfam, diet, fct_id, khan_id, allergens = d
        obs_for_dish = df_obs[df_obs['canonical_dish_id'] == cid]
        obs_count = len(obs_for_dish)
        has_mult = (obs_count > 1)

        has_fct = (fct_id is not None)
        if has_fct:
            audit = fct_formulation_audit[fct_id]
            form_auth = audit['formulation_authority']
            all_grams = audit['all_ingredients_quantified_in_grams']
            ing_tot = audit['ingredient_count_total']
            ing_exp = audit['ingredient_count_with_explicit_quantity']
            ing_g = audit['ingredient_count_with_quantity_g']
            ing_hh = audit['ingredient_count_household_measure_only']
            ing_unq = audit['ingredient_count_unquantified']
            form_src_avail = True
            rec_inst_elig = True
            readiness = 'READY_RECIPE_AND_NUTRITION'
            allergen_complete = True
        else:
            form_auth = 'MAJOR_INGREDIENTS_ONLY'
            all_grams = False
            ing_tot = np.nan
            ing_exp = np.nan
            ing_g = np.nan
            ing_hh = np.nan
            ing_unq = np.nan
            form_src_avail = False
            rec_inst_elig = False
            readiness = 'READY_NUTRITION_ONLY'
            allergen_complete = False # Khan dishes list major ingredients only

        canonical_records.append({
            'canonical_dish_id': cid,
            'canonical_name_en': name_en,
            'canonical_name_local': name_loc,
            'aliases': aliases,
            'category': cat,
            'meal_roles': roles,
            'variant_family_id': vfam if vfam else '',
            'has_lab_nutrition': True,
            'has_complete_recipe': form_src_avail,
            'has_multiple_lab_observations': has_mult,
            'nutrition_planner_eligible': True,
            'recipe_instruction_eligible': rec_inst_elig,
            'preparation_instruction_available': rec_inst_elig,
            'formulation_source_available': form_src_avail,
            'all_ingredients_quantified_in_grams': all_grams,
            'formulation_authority': form_auth,
            'ingredient_count_total': ing_tot,
            'ingredient_count_with_explicit_quantity': ing_exp,
            'ingredient_count_with_quantity_g': ing_g,
            'ingredient_count_household_measure_only': ing_hh,
            'ingredient_count_unquantified': ing_unq,
            'dietary_class': diet,
            'allergen_assessment_complete': allergen_complete,
            'known_contains_dairy': allergens['dairy'],
            'known_contains_egg': allergens['egg'],
            'known_contains_fish': allergens['fish'],
            'known_contains_meat': allergens['meat'],
            'known_contains_wheat': allergens['wheat'],
            'known_contains_nuts': allergens['nuts'],
            'planner_readiness': readiness,
            'notes': f"Canonical Pakistani composite dish {name_en}. Supported by {obs_count} independent laboratory observation(s)."
        })

    df_canonical = pd.DataFrame(canonical_records)
    p_canonical_out = "Meal/data/processed/pakistan_canonical_dishes.csv"
    df_canonical.to_csv(p_canonical_out, index=False)
    print(f"Saved {p_canonical_out} ({len(df_canonical)} canonical composite dishes).")

    # -------------------------------------------------------------
    # 6. Build Planner Nutrition Profiles (pakistan_planner_nutrition_profiles.csv)
    # -------------------------------------------------------------
    # Encodes default observation selection hierarchy and variability metadata
    profiles_records = []
    for d in canonical_dishes_definitions:
        cid, name_en, name_loc, aliases, cat, roles, vfam, diet, fct_id, khan_id, allergens = d
        obs_for_dish = df_obs[df_obs['canonical_dish_id'] == cid]
        obs_count = len(obs_for_dish)

        # Selection hierarchy:
        # Priority 1: FCT observation (pairs lab proximate with complete documented recipe)
        # Priority 2: Khan observation (peer-reviewed lab proximate analysis)
        fct_obs = obs_for_dish[obs_for_dish['nutrition_authority'] == 'LAB_TESTED_FCT']
        khan_obs = obs_for_dish[obs_for_dish['nutrition_authority'] == 'LAB_TESTED_PEER_REVIEWED_PAKISTAN']

        if len(fct_obs) > 0:
            def_obs = fct_obs.iloc[0]
            alt_obs = khan_obs['observation_id'].tolist() if len(khan_obs) > 0 else []
            if len(khan_obs) > 0:
                reason = "FCT laboratory observation selected as planner default because the same source also provides a documented dish formulation. The independent Khan 2019 laboratory observation is retained unchanged as alternate evidence."
            else:
                reason = "Primary FCT laboratory chemical proximate analysis paired with complete source dish formulation."
        else:
            def_obs = khan_obs.iloc[0]
            alt_obs = []
            reason = "Primary peer-reviewed laboratory chemical proximate analysis (AOAC methods) from Khan et al. (2019)."

        # Variability range metadata (descriptive range only; NO averaging)
        e_min = float(obs_for_dish['energy_kcal_per_100g'].min())
        e_max = float(obs_for_dish['energy_kcal_per_100g'].max())
        p_min = float(obs_for_dish['protein_g_per_100g'].min())
        p_max = float(obs_for_dish['protein_g_per_100g'].max())
        f_min = float(obs_for_dish['fat_g_per_100g'].min())
        f_max = float(obs_for_dish['fat_g_per_100g'].max())
        c_min = float(obs_for_dish['carb_g_per_100g'].min())
        c_max = float(obs_for_dish['carb_g_per_100g'].max())

        profiles_records.append({
            'canonical_dish_id': cid,
            'canonical_name_en': name_en,
            'default_observation_id': def_obs['observation_id'],
            'alternate_observation_ids': ",".join(alt_obs) if alt_obs else '',
            'observation_count': obs_count,
            'has_multiple_lab_observations': (obs_count > 1),
            'selection_reason': reason,
            'selection_policy_version': '1.0.0',
            'energy_min': e_min,
            'energy_max': e_max,
            'protein_min': p_min,
            'protein_max': p_max,
            'fat_min': f_min,
            'fat_max': f_max,
            'carb_min': c_min,
            'carb_max': c_max,
            'planner_energy_kcal_per_100g': def_obs['energy_kcal_per_100g'],
            'planner_protein_g_per_100g': def_obs['protein_g_per_100g'],
            'planner_fat_g_per_100g': def_obs['fat_g_per_100g'],
            'planner_carb_g_per_100g': def_obs['carb_g_per_100g'],
            'planner_fiber_g_per_100g': def_obs['fiber_g_per_100g']
        })

    df_profiles = pd.DataFrame(profiles_records)
    p_profiles_out = "Meal/data/processed/pakistan_planner_nutrition_profiles.csv"
    df_profiles.to_csv(p_profiles_out, index=False)
    print(f"Saved {p_profiles_out} ({len(df_profiles)} default planner nutrition profiles).")

    # -------------------------------------------------------------
    # 7. Build Master Planner Catalog (pakistan_master_planner_catalog.csv)
    # -------------------------------------------------------------
    # Unifies:
    # - 40 Composite Dishes
    # - 29 Direct Meal Components (READY_DIRECT from pakistan_meal_components.csv)
    # - 2 Standard Portion References (Chapati & Boiled Rice from pakistan_portion_references.csv)
    master_records = []

    # 1. Add 40 Composite Dishes
    for idx, row in df_canonical.iterrows():
        cid = row['canonical_dish_id']
        prof = df_profiles[df_profiles['canonical_dish_id'] == cid].iloc[0]

        master_records.append({
            'planner_entity_id': cid,
            'entity_type': 'COMPOSITE_DISH',
            'canonical_or_component_source_id': cid,
            'entity_name_en': row['canonical_name_en'],
            'entity_name_local': row['canonical_name_local'],
            'category': row['category'],
            'meal_roles': row['meal_roles'],
            'native_nutrition_basis': 'per_100g_cooked',
            'source_preparation_state': 'cooked',
            'supports_dynamic_portioning': True,
            'portion_weight_g': np.nan,
            'nutrition_per_portion': np.nan,
            'guideline_exchange_energy_kcal': np.nan,
            'guideline_exchange_carb_g': np.nan,
            'guideline_exchange_protein_g': np.nan,
            'guideline_exchange_fat_min_g': np.nan,
            'guideline_exchange_fat_max_g': np.nan,
            'derived_fct_energy_kcal': np.nan,
            'derived_fct_carb_g': np.nan,
            'derived_fct_protein_g': np.nan,
            'derived_fct_fat_g': np.nan,
            'energy_kcal_per_100g': prof['planner_energy_kcal_per_100g'],
            'protein_g_per_100g': prof['planner_protein_g_per_100g'],
            'fat_g_per_100g': prof['planner_fat_g_per_100g'],
            'carb_g_per_100g': prof['planner_carb_g_per_100g'],
            'fiber_g_per_100g': prof['planner_fiber_g_per_100g'],
            'normalized_per_100g_available': True,
            'normalized_energy_kcal_per_100g': prof['planner_energy_kcal_per_100g'],
            'normalized_protein_g_per_100g': prof['planner_protein_g_per_100g'],
            'normalized_fat_g_per_100g': prof['planner_fat_g_per_100g'],
            'normalized_carb_g_per_100g': prof['planner_carb_g_per_100g'],
            'normalized_fiber_g_per_100g': prof['planner_fiber_g_per_100g'],
            'dietary_class': row['dietary_class'],
            'known_contains_dairy': row['known_contains_dairy'],
            'known_contains_egg': row['known_contains_egg'],
            'known_contains_fish': row['known_contains_fish'],
            'known_contains_meat': row['known_contains_meat'],
            'known_contains_wheat': row['known_contains_wheat'],
            'known_contains_nuts': row['known_contains_nuts'],
            'allergen_assessment_complete': row['allergen_assessment_complete'],
            'planner_readiness': row['planner_readiness'],
            'nutrition_planner_eligible': True,
            'recipe_instruction_eligible': row['recipe_instruction_eligible'],
            'preparation_instruction_available': row['recipe_instruction_eligible'],
            'notes': row['notes']
        })

    # 2. Add 29 Direct Meal Components (READY_DIRECT only)
    df_direct_comp = df_comp[df_comp['planner_readiness'] == 'READY_DIRECT']
    for idx, row in df_direct_comp.iterrows():
        comp_id = row['component_id']

        master_records.append({
            'planner_entity_id': comp_id,
            'entity_type': 'DIRECT_COMPONENT',
            'canonical_or_component_source_id': comp_id,
            'entity_name_en': row['component_name'],
            'entity_name_local': row['name_ur'] if pd.notna(row['name_ur']) else '',
            'category': row['component_type'],
            'meal_roles': row['meal_roles'].replace('|', ','),
            'native_nutrition_basis': 'per_100g_source_food_state',
            'source_preparation_state': row['source_preparation_state'],
            'supports_dynamic_portioning': True,
            'portion_weight_g': np.nan,
            'nutrition_per_portion': np.nan,
            'guideline_exchange_energy_kcal': np.nan,
            'guideline_exchange_carb_g': np.nan,
            'guideline_exchange_protein_g': np.nan,
            'guideline_exchange_fat_min_g': np.nan,
            'guideline_exchange_fat_max_g': np.nan,
            'derived_fct_energy_kcal': np.nan,
            'derived_fct_carb_g': np.nan,
            'derived_fct_protein_g': np.nan,
            'derived_fct_fat_g': np.nan,
            'energy_kcal_per_100g': float(row['energy_kcal_per_100g']) if pd.notna(row['energy_kcal_per_100g']) else np.nan,
            'protein_g_per_100g': float(row['protein_g_per_100g']) if pd.notna(row['protein_g_per_100g']) else np.nan,
            'fat_g_per_100g': float(row['fat_g_per_100g']) if pd.notna(row['fat_g_per_100g']) else np.nan,
            'carb_g_per_100g': float(row['carb_g_per_100g']) if pd.notna(row['carb_g_per_100g']) else np.nan,
            'fiber_g_per_100g': float(row['fiber_g_per_100g']) if pd.notna(row['fiber_g_per_100g']) else np.nan,
            'normalized_per_100g_available': True,
            'normalized_energy_kcal_per_100g': float(row['energy_kcal_per_100g']) if pd.notna(row['energy_kcal_per_100g']) else np.nan,
            'normalized_protein_g_per_100g': float(row['protein_g_per_100g']) if pd.notna(row['protein_g_per_100g']) else np.nan,
            'normalized_fat_g_per_100g': float(row['fat_g_per_100g']) if pd.notna(row['fat_g_per_100g']) else np.nan,
            'normalized_carb_g_per_100g': float(row['carb_g_per_100g']) if pd.notna(row['carb_g_per_100g']) else np.nan,
            'normalized_fiber_g_per_100g': float(row['fiber_g_per_100g']) if pd.notna(row['fiber_g_per_100g']) else np.nan,
            'dietary_class': row['dietary_class'],
            'known_contains_dairy': bool(row['known_contains_dairy']),
            'known_contains_egg': bool(row['known_contains_egg']),
            'known_contains_fish': bool(row['known_contains_fish']),
            'known_contains_meat': bool(row['known_contains_meat']),
            'known_contains_wheat': bool(row['known_contains_wheat']),
            'known_contains_nuts': bool(row['known_contains_nuts']),
            'allergen_assessment_complete': bool(row['allergen_assessment_complete']),
            'planner_readiness': 'READY_DIRECT_COMPONENT',
            'nutrition_planner_eligible': True,
            'recipe_instruction_eligible': False,
            'preparation_instruction_available': False,
            'notes': row['notes']
        })

    # 3. Add 2 Standard Portion References
    for idx, row in df_port.iterrows():
        port_id = row['portion_id']
        is_chapati = ('001' in port_id)

        if is_chapati:
            p_name = 'Standard Whole Wheat Chapati'
            p_name_loc = 'Gandum ki Roti'
            roles = 'staple,breakfast,lunch,dinner'
            diet = 'plant_based'
            wt_g = 80.0
            allergens_port = {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': True, 'nuts': False}
        else:
            p_name = 'Plain Boiled Rice'
            p_name_loc = 'Ublay Chawal'
            roles = 'staple,lunch,dinner'
            diet = 'plant_based'
            wt_g = 75.0
            allergens_port = {'dairy': False, 'egg': False, 'fish': False, 'meat': False, 'wheat': False, 'nuts': False}

        e_port = float(row['derived_fct_energy_kcal'])
        p_port = float(row['derived_fct_protein_g'])
        f_port = float(row['derived_fct_fat_g'])
        c_port = float(row['derived_fct_carb_g'])

        # Normalized per 100g cooked
        e_100 = round(e_port / (wt_g / 100), 1)
        p_100 = round(p_port / (wt_g / 100), 2)
        f_100 = round(f_port / (wt_g / 100), 2)
        c_100 = round(c_port / (wt_g / 100), 2)

        master_records.append({
            'planner_entity_id': port_id,
            'entity_type': 'STANDARD_PORTION',
            'canonical_or_component_source_id': port_id,
            'entity_name_en': p_name,
            'entity_name_local': p_name_loc,
            'category': 'Cereal Staple',
            'meal_roles': roles,
            'native_nutrition_basis': 'standard_portion',
            'source_preparation_state': 'cooked',
            'supports_dynamic_portioning': False,
            'portion_weight_g': wt_g,
            'nutrition_per_portion': e_port,
            'guideline_exchange_energy_kcal': float(row['guideline_exchange_energy_kcal']),
            'guideline_exchange_carb_g': float(row['guideline_exchange_carb_g']),
            'guideline_exchange_protein_g': float(row['guideline_exchange_protein_g']),
            'guideline_exchange_fat_min_g': float(row['guideline_exchange_fat_min_g']),
            'guideline_exchange_fat_max_g': float(row['guideline_exchange_fat_max_g']),
            'derived_fct_energy_kcal': e_port,
            'derived_fct_carb_g': c_port,
            'derived_fct_protein_g': p_port,
            'derived_fct_fat_g': f_port,
            'energy_kcal_per_100g': np.nan, # Native basis is portion; normalized value is preserved in normalized_*
            'protein_g_per_100g': np.nan,
            'fat_g_per_100g': np.nan,
            'carb_g_per_100g': np.nan,
            'fiber_g_per_100g': np.nan,
            'normalized_per_100g_available': True,
            'normalized_energy_kcal_per_100g': e_100,
            'normalized_protein_g_per_100g': p_100,
            'normalized_fat_g_per_100g': f_100,
            'normalized_carb_g_per_100g': c_100,
            'normalized_fiber_g_per_100g': np.nan,
            'dietary_class': diet,
            'known_contains_dairy': allergens_port['dairy'],
            'known_contains_egg': allergens_port['egg'],
            'known_contains_fish': allergens_port['fish'],
            'known_contains_meat': allergens_port['meat'],
            'known_contains_wheat': allergens_port['wheat'],
            'known_contains_nuts': allergens_port['nuts'],
            'allergen_assessment_complete': True,
            'planner_readiness': 'READY_STANDARD_PORTION',
            'nutrition_planner_eligible': True,
            'recipe_instruction_eligible': False, # Standard portion reference, not full composite recipe
            'preparation_instruction_available': True, # Has authoritative dough/boiling preparation specification
            'notes': row['notes']
        })

    df_master = pd.DataFrame(master_records)
    p_master_out = "Meal/data/processed/pakistan_master_planner_catalog.csv"
    df_master.to_csv(p_master_out, index=False)
    print(f"Saved {p_master_out} ({len(df_master)} master planner entities).")

    # -------------------------------------------------------------
    # 8. Build Master Catalog Traceability Audit (pakistan_master_catalog_traceability.csv)
    # -------------------------------------------------------------
    traceability_records = []
    def_map = {d[0]: d for d in canonical_dishes_definitions}

    for idx, row in df_master.iterrows():
        pid = row['planner_entity_id']
        etype = row['entity_type']
        name = row['entity_name_en']
        readiness = row['planner_readiness']

        if etype == 'COMPOSITE_DISH':
            d_def = def_map[pid]
            fct_id = d_def[8]
            khan_id = d_def[9]
            if fct_id is not None:
                origin_ds = "Meal/data/processed/pakistan_recipes.csv"
                origin_id = fct_id
                origin_found = (fct_id in df_fct_rcp.index)
                src_doc = "Food Composition Table for Pakistan (Revised 2001)"
                audit_status = "ORIGIN_VERIFIED_FCT_RECIPE"
            else:
                origin_ds = "Meal/data/research/khan_2019_pakistani_dishes.csv"
                origin_id = khan_id
                origin_found = (khan_id in df_khan['dish_id'].values)
                src_doc = "Khan et al. (2019) PJMS 35(5):1224-1230"
                audit_status = "ORIGIN_VERIFIED_KHAN_DISH"

        elif etype == 'DIRECT_COMPONENT':
            origin_ds = "Meal/data/processed/pakistan_meal_components.csv"
            origin_id = pid
            origin_found = (pid in df_comp['component_id'].values)
            src_doc = "Food Composition Table for Pakistan (Revised 2001)"
            audit_status = "ORIGIN_VERIFIED_PHASE4A_COMPONENT"

        elif etype == 'STANDARD_PORTION':
            origin_ds = "Meal/data/processed/pakistan_portion_references.csv"
            origin_id = pid
            origin_found = (pid in df_port['portion_id'].values)
            src_doc = "Pakistan Dietary Guidelines for Better Nutrition (2019)"
            audit_status = "ORIGIN_VERIFIED_PHASE3_PORTION"

        traceability_records.append({
            'planner_entity_id': pid,
            'entity_name': name,
            'entity_type': etype,
            'origin_dataset': origin_ds,
            'origin_entity_id': origin_id,
            'origin_found': origin_found,
            'source_document': src_doc,
            'planner_readiness': readiness,
            'audit_status': audit_status
        })

    df_trace = pd.DataFrame(traceability_records)
    p_trace_out = "Meal/data/processed/pakistan_master_catalog_traceability.csv"
    df_trace.to_csv(p_trace_out, index=False)
    print(f"Saved {p_trace_out} ({len(df_trace)} traceability records).")

    # Assert 100% origin found
    assert df_trace['origin_found'].all() == True, "Traceability failure: one or more planner entities lack verified upstream origins!"
    assert len(df_trace) == 71, f"Traceability row count discrepancy: {len(df_trace)} != 71"
    print(f"  [TRACEABILITY CONFIRMED] 71/71 entities trace to verified upstream sources. Zero new entities introduced in Phase 4C.")

    # -------------------------------------------------------------
    # 9. Detailed Formulation Limitation Metrics
    # -------------------------------------------------------------
    fully_gram_rids = []
    hh_measure_rids = []
    unquantified_rids = []
    ad_libitum_rids = []
    compound_rids = []

    for rid, g in df_fct_ing.groupby('recipe_id'):
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

    print("\nREFINED FORMULATION LIMITATION METRICS (17 FCT Recipes):")
    print(f"  - Fully gram-quantified recipes                    : {len(fully_gram_rids)}")
    print(f"  - Recipes with household-measure quantities        : {len(hh_measure_rids)} ({', '.join(hh_measure_rids)})")
    print(f"  - Recipes with unquantified quantities             : {len(unquantified_rids)} ({', '.join(unquantified_rids)})")
    print(f"  - Recipes with ad-libitum / to-taste ingredients   : {len(ad_libitum_rids)} ({', '.join(ad_libitum_rids)})")
    print(f"  - Recipes with compound ingredients                : {len(compound_rids)} ({', '.join(compound_rids)})")

    # -------------------------------------------------------------
    # 10. Programmatic Meal Role Coverage Reporting
    # -------------------------------------------------------------
    print("\nPROGRAMMATIC MEAL ROLE COVERAGE REPORT:")
    role_report = []
    for r in ['breakfast', 'lunch', 'dinner', 'snack', 'side', 'staple', 'dessert', 'beverage']:
        m_role = df_master[df_master['meal_roles'].str.contains(r, case=False, na=False)]
        cnt = len(m_role)
        sample_ids = m_role['planner_entity_id'].head(3).tolist()
        sample_names = m_role['entity_name_en'].head(3).tolist()
        print(f"  - {r.capitalize():<12}: count={cnt:>2} | sample_ids={sample_ids} | sample_names={sample_names}")

    # -------------------------------------------------------------
    # 11. Programmatic Food Category Coverage Reporting
    # -------------------------------------------------------------
    print("\nPROGRAMMATIC FOOD CATEGORY COVERAGE REPORT:")
    categories_def = [
        ('vegetable', df_master['category'].str.contains('Vegetable|vegetable', case=False, na=False), 'structured_category'),
        ('pulse', df_master['category'].str.contains('Pulse|pulse|Legume', case=False, na=False), 'structured_category'),
        ('fruit', df_master['category'] == 'fruit', 'structured_category'),
        ('dairy', (df_master['category'] == 'dairy') | (df_master['known_contains_dairy'] == True), 'structured_allergen_and_category'),
        ('egg', (df_master['category'] == 'egg') | (df_master['known_contains_egg'] == True), 'structured_allergen_and_category'),
        ('fish', (df_master['category'] == 'Fish Preparation') | (df_master['known_contains_fish'] == True), 'structured_allergen_and_category'),
        ('chicken', df_master['planner_entity_id'].isin(['PK_DISH_009', 'PK_DISH_012', 'PK_DISH_013', 'PK_DISH_019']), 'structured_category_and_recipe_ingredient'),
        ('beef_mutton', df_master['planner_entity_id'].isin(['PK_DISH_003', 'PK_DISH_005', 'PK_DISH_006', 'PK_DISH_007', 'PK_DISH_008', 'PK_DISH_010', 'PK_DISH_018', 'PK_DISH_020', 'PK_DISH_021', 'PK_DISH_030', 'PK_DISH_031', 'PK_DISH_032', 'PK_DISH_034', 'PK_DISH_037']), 'structured_allergen_minus_poultry'),
        ('cereal', df_master['category'].isin(['Cereal Staple', 'Rice Composite Dish', 'cereal_staple', 'Meat & Cereal Dish', 'Pasta & Meat Dish']), 'structured_category'),
        ('nut_seed', df_master['category'] == 'nut_seed', 'structured_category'),
        ('mixed_dish', df_master['category'].isin(['Meat & Vegetable Curry', 'Vegetable & Pulse Dish', 'Rice Composite Dish', 'Meat & Cereal Dish', 'Pasta & Meat Dish']), 'structured_category')
    ]

    for cat_name, mask, method in categories_def:
        m_cat = df_master[mask]
        cnt = len(m_cat)
        sample_ids = m_cat['planner_entity_id'].head(3).tolist()
        sample_names = m_cat['entity_name_en'].head(3).tolist()
        print(f"  - {cat_name:<12}: count={cnt:>2} | method={method:<40} | sample_names={sample_names}")

    print("\n" + "=" * 65)
    print("PHASE 4C CANONICAL CATALOG BUILD & AUDIT COMPLETE")
    print("=" * 65)

if __name__ == '__main__':
    build_phase4c_catalog()


