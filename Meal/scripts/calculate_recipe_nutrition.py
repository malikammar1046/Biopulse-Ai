import os
import json
import pandas as pd
import numpy as np

def build_all_phase3_datasets():
    print("="*60)
    print("PHASE 3: RECIPE NUTRITION GROUND TRUTH & SERVING AUDIT PIPELINE")
    print("="*60)

    # 1. Load Golden Benchmark
    golden_path = 'Meal/data/raw/fct_traditional_dishes_golden.json'
    with open(golden_path, 'r', encoding='utf-8') as f:
        golden_dishes = json.load(f)
    print(f"Loaded {len(golden_dishes)} golden laboratory-tested dishes.")

    # 2. Load FCT Food Composition
    fct_path = 'Meal/data/processed/pakistan_food_composition.csv'
    df_fct = pd.read_csv(fct_path)
    fct_lookup = df_fct.set_index('food_id').to_dict('index')
    print(f"Loaded {len(df_fct)} primary FCT foods for ingredient lookup.")

    # 3. Define Standardized 17 Recipes (LEVEL_A)
    # Note: Source audit confirms FCT provides laboratory proximate analysis per 100g cooked edible portion.
    # Serving counts and serving sizes are NOT explicit in FCT 2001; they are set to None.
    # Cooked weights are retained strictly as batch yield metadata for QA calculation.
    recipes_metadata = [
        {
            'recipe_id': 'PK_RCP_001',
            'dish_number': 1,
            'recipe_name_en': 'Chapati',
            'recipe_name_ur': 'Gandum ki Roti',
            'category': 'Flatbread / Cereal Staple',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 80.0,
            'current_servings': 1.0,
            'current_serving_size_g': 80.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Dry griddle / Tawa baking',
            'consumption_frequency_pct': 98.4,
            'hedonic_score': 8.5,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 60,
            'printed_page': 54,
            'source_table_or_appendix': 'Appendix-1 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_002',
            'dish_number': 2,
            'recipe_name_en': 'Daal Masur Curry',
            'recipe_name_ur': 'Masoor Daal Salan',
            'category': 'Pulse/Legume Curry',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 380.0,
            'current_servings': 3.0,
            'current_serving_size_g': 126.7,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Boiling followed by Tarka (spiced oil tempering)',
            'consumption_frequency_pct': 84.6,
            'hedonic_score': 7.8,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 60,
            'printed_page': 54,
            'source_table_or_appendix': 'Appendix-2 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_003',
            'dish_number': 3,
            'recipe_name_en': 'Alu Gosht',
            'recipe_name_ur': 'Potato with Meat Curry',
            'category': 'Meat & Vegetable Curry',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 550.0,
            'current_servings': 4.0,
            'current_serving_size_g': 137.5,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Braising/Bhunai with gravy',
            'consumption_frequency_pct': 72.1,
            'hedonic_score': 8.2,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 60,
            'printed_page': 54,
            'source_table_or_appendix': 'Appendix-3 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_004',
            'dish_number': 4,
            'recipe_name_en': 'Kalool',
            'recipe_name_ur': 'Kidney Beans Curry',
            'category': 'Pulse/Legume Curry',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 400.0,
            'current_servings': 3.0,
            'current_serving_size_g': 133.3,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Boiling and spiced gravy simmering',
            'consumption_frequency_pct': 54.2,
            'hedonic_score': 7.5,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 61,
            'printed_page': 55,
            'source_table_or_appendix': 'Appendix-4 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_005',
            'dish_number': 5,
            'recipe_name_en': 'Kofta Curry',
            'recipe_name_ur': 'Meat Balls Curry',
            'category': 'Meat Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 480.0,
            'current_servings': 4.0,
            'current_serving_size_g': 120.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Shaping meatballs, sautéing, simmering in onion-yogurt gravy',
            'consumption_frequency_pct': 68.3,
            'hedonic_score': 8.4,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 61,
            'printed_page': 55,
            'source_table_or_appendix': 'Appendix-5 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_006',
            'dish_number': 6,
            'recipe_name_en': 'Pulao Gosht',
            'recipe_name_ur': 'Rice with Beef / Yakhni Pulao',
            'category': 'Rice & Meat Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 620.0,
            'current_servings': 4.0,
            'current_serving_size_g': 155.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Yakhni meat broth preparation followed by rice absorption / dum',
            'consumption_frequency_pct': 78.9,
            'hedonic_score': 8.6,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 62,
            'printed_page': 56,
            'source_table_or_appendix': 'Appendix-6 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_007',
            'dish_number': 7,
            'recipe_name_en': 'Shami Kabab',
            'recipe_name_ur': 'Minced Meat and Lentil Patties',
            'category': 'Meat & Pulse Snack',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 360.0,
            'current_servings': 6.0,
            'current_serving_size_g': 60.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Boiling meat and dal, grinding, shallow egg frying',
            'consumption_frequency_pct': 81.0,
            'hedonic_score': 8.3,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 62,
            'printed_page': 56,
            'source_table_or_appendix': 'Appendix-7 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_008',
            'dish_number': 8,
            'recipe_name_en': 'Chapal Kabab',
            'recipe_name_ur': 'Peshawari Spiced Minced Beef Patties',
            'category': 'Meat Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 400.0,
            'current_servings': 4.0,
            'current_serving_size_g': 100.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Shallow frying on large tawa',
            'consumption_frequency_pct': 69.4,
            'hedonic_score': 8.1,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 63,
            'printed_page': 57,
            'source_table_or_appendix': 'Appendix-8 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_009',
            'dish_number': 9,
            'recipe_name_en': 'Chicken Curry',
            'recipe_name_ur': 'Murgh Salan',
            'category': 'Poultry Curry',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 520.0,
            'current_servings': 4.0,
            'current_serving_size_g': 130.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Sautéing, bhunai with tomato-onion gravy',
            'consumption_frequency_pct': 76.5,
            'hedonic_score': 8.0,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 63,
            'printed_page': 57,
            'source_table_or_appendix': 'Appendix-9 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_010',
            'dish_number': 10,
            'recipe_name_en': 'Haleem',
            'recipe_name_ur': 'Mixed Grains, Lentils and Meat Porridge',
            'category': 'Composite Cereal, Pulse & Meat Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 800.0,
            'current_servings': 5.0,
            'current_serving_size_g': 160.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Slow cooking, shredding, hand-mashing grains with meat',
            'consumption_frequency_pct': 64.8,
            'hedonic_score': 8.5,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 64,
            'printed_page': 58,
            'source_table_or_appendix': 'Appendix-10 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_011',
            'dish_number': 11,
            'recipe_name_en': 'Machli',
            'recipe_name_ur': 'Tala Huwa Muchli (Fried Fish)',
            'category': 'Fish / Seafood Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 400.0,
            'current_servings': 4.0,
            'current_serving_size_g': 100.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Marinating in spices and frying in hot oil until brown',
            'consumption_frequency_pct': 62.5,
            'hedonic_score': 8.1,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 64,
            'printed_page': 58,
            'source_table_or_appendix': 'Appendix-11 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_012',
            'dish_number': 12,
            'recipe_name_en': 'Sajji',
            'recipe_name_ur': 'Balochi Sajji (Skewered Roasted Meat)',
            'category': 'Meat Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 360.0,
            'current_servings': 3.0,
            'current_serving_size_g': 120.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Salted whole lamb leg skewered and roasted around open coals',
            'consumption_frequency_pct': 48.0,
            'hedonic_score': 8.7,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 65,
            'printed_page': 59,
            'source_table_or_appendix': 'Appendix-12 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_013',
            'dish_number': 13,
            'recipe_name_en': 'Biryani',
            'recipe_name_ur': 'Murgh Biryani (Layered Spiced Rice with Meat)',
            'category': 'Rice & Poultry Dish',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 700.0,
            'current_servings': 4.0,
            'current_serving_size_g': 175.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Parboiling rice, preparing meat korma, layering and steam cooking (dum)',
            'consumption_frequency_pct': 88.2,
            'hedonic_score': 9.1,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 65,
            'printed_page': 59,
            'source_table_or_appendix': 'Appendix-13 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_014',
            'dish_number': 14,
            'recipe_name_en': 'Halwa Suji',
            'recipe_name_ur': 'Suji ka Halwa (Semolina Pudding)',
            'category': 'Traditional Dessert',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 350.0,
            'current_servings': 4.0,
            'current_serving_size_g': 87.5,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Roasting semolina in desi ghee, adding sugar syrup with cardamom',
            'consumption_frequency_pct': 65.0,
            'hedonic_score': 8.4,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 65,
            'printed_page': 59,
            'source_table_or_appendix': 'Appendix-14 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_015',
            'dish_number': 15,
            'recipe_name_en': 'Zarda',
            'recipe_name_ur': 'Meethe Chawal (Sweet Saffron / Orange Rice)',
            'category': 'Traditional Dessert',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 420.0,
            'current_servings': 4.0,
            'current_serving_size_g': 105.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Boiling rice with color, cooking in sugar syrup with ghee and nuts',
            'consumption_frequency_pct': 58.7,
            'hedonic_score': 8.0,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 65,
            'printed_page': 59,
            'source_table_or_appendix': 'Appendix-15 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_016',
            'dish_number': 16,
            'recipe_name_en': 'Kheer',
            'recipe_name_ur': 'Rice Pudding',
            'category': 'Traditional Dessert',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 500.0,
            'current_servings': 4.0,
            'current_serving_size_g': 125.0,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Slow-boiling rice in whole buffalo milk and cream until thickened',
            'consumption_frequency_pct': 74.3,
            'hedonic_score': 8.9,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 66,
            'printed_page': 60,
            'source_table_or_appendix': 'Appendix-16 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        },
        {
            'recipe_id': 'PK_RCP_017',
            'dish_number': 17,
            'recipe_name_en': 'Halwa Gajar',
            'recipe_name_ur': 'Gajar ka Halwa (Carrot Pudding)',
            'category': 'Traditional Dessert',
            'entity_type': 'standardized_recipe',
            'formulation_completeness': 'complete_formulation',
            'cooked_weight_g': 450.0,
            'current_servings': 4.0,
            'current_serving_size_g': 112.5,
            'servings': None,
            'serving_size_g': None,
            'cooking_method': 'Simmering shredded carrots in whole milk, roasting with ghee and sugar',
            'consumption_frequency_pct': 69.1,
            'hedonic_score': 9.0,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': 66,
            'printed_page': 60,
            'source_table_or_appendix': 'Appendix-17 Traditional Foods Ingredients and Methods of Preparation',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True
        }
    ]

    # Export pakistan_recipes.csv
    df_recipes = pd.DataFrame(recipes_metadata)
    recipes_out_cols = [
        'recipe_id', 'recipe_name_en', 'recipe_name_ur', 'category', 'entity_type',
        'formulation_completeness', 'cooked_weight_g', 'servings', 'serving_size_g',
        'cooking_method', 'consumption_frequency_pct', 'hedonic_score',
        'source_document', 'pdf_page', 'printed_page', 'source_table_or_appendix',
        'nutrition_authority_level', 'meal_planning_eligible'
    ]
    df_recipes[recipes_out_cols].to_csv('Meal/data/processed/pakistan_recipes.csv', index=False)
    print(f"Saved reconciled pakistan_recipes.csv ({len(df_recipes)} LEVEL_A recipes).")

    # 4. Create Source Serving Audit Table
    audit_rows = []
    for r in recipes_metadata:
        dnum = r['dish_number']
        g_item = [d for d in golden_dishes if d['dish_number'] == dnum][0]
        audit_rows.append({
            'recipe_id': r['recipe_id'],
            'recipe_name': r['recipe_name_en'],
            'cooked_weight_g': r['cooked_weight_g'],
            'current_servings': r['current_servings'],
            'current_serving_size_g': r['current_serving_size_g'],
            'serving_explicit_in_source': False,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'source_page': f"PDF p{g_item['pdf_page']} (Table {dnum}) & PDF p{r['pdf_page']} ({r['source_table_or_appendix'].split()[0]})",
            'source_text_or_table': f"Table {dnum} reports proximate chemical analysis strictly per 100g edible portion. {r['source_table_or_appendix'].split()[0]} lists raw ingredients and cooking instructions without specifying serving counts or portion weights.",
            'final_servings': None,
            'final_serving_size_g': None,
            'audit_status': 'per_100g_authoritative_only'
        })
    df_audit = pd.DataFrame(audit_rows)
    df_audit.to_csv('Meal/data/processed/pakistan_recipe_serving_audit.csv', index=False)
    print(f"Saved source serving audit table ({len(df_audit)} recipes audited).")

    # 5. Define All Ingredients for the 17 Standardized Recipes
    ingredients_raw = [
        # PK_RCP_001 (Chapati)
        ('PK_ING_001', 'PK_RCP_001', 'Wheat flour / Atta', 'wheat whole grain flour atta', '60', 'g', 60.0, 'PK_FCT_015', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_002', 'PK_RCP_001', 'Water', 'water', '35', 'ml', 35.0, None, 'unmapped_solvent', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        
        # PK_RCP_002 (Daal Masur Curry)
        ('PK_ING_003', 'PK_RCP_002', 'Lentil (daal masur)', 'lentil raw red', '125', 'g', 125.0, 'PK_FCT_032', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_004', 'PK_RCP_002', 'Ghee / Cooking oil', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_005', 'PK_RCP_002', 'Onion', 'onion raw', '1/2 medium', 'household_piece', None, 'PK_FCT_070', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_006', 'PK_RCP_002', 'Garlic', 'garlic raw', '3 cloves', 'household_clove', None, 'PK_FCT_068', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_007', 'PK_RCP_002', 'Spices and salt', 'spices blend and iodized salt', 'to taste', 'ad_libitum', None, None, 'unresolved_blend', 0.50, 'partial_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        
        # PK_RCP_003 (Alu Gosht)
        ('PK_ING_008', 'PK_RCP_003', 'Beef / Meat', 'beef meat raw', '250', 'g', 250.0, 'PK_FCT_141', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_009', 'PK_RCP_003', 'Potatoes', 'potato raw', '250', 'g', 250.0, 'PK_FCT_071', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_010', 'PK_RCP_003', 'Ghee / Oil', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_011', 'PK_RCP_003', 'Onion', 'onion raw', '1 medium', 'household_piece', None, 'PK_FCT_070', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_012', 'PK_RCP_003', 'Tomatoes', 'tomato raw', '2 medium', 'household_piece', None, 'PK_FCT_063', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        ('PK_ING_013', 'PK_RCP_003', 'Spices and salt', 'spices blend and iodized salt', 'to taste', 'ad_libitum', None, None, 'unresolved_blend', 0.50, 'partial_verified', 'Food Composition Table for Pakistan (Revised 2001)', 60, 54),
        
        # PK_RCP_004 (Kalool)
        ('PK_ING_014', 'PK_RCP_004', 'Red kidney beans (Kalool)', 'kidney bean raw rajma kalool', '200', 'g', 200.0, 'PK_FCT_031', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 61, 55),
        ('PK_ING_015', 'PK_RCP_004', 'Ghee / Cooking oil', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 61, 55),
        ('PK_ING_016', 'PK_RCP_004', 'Spices (Turmeric, Red chilli, Salt)', 'spices blend', 'to taste', 'ad_libitum', None, None, 'unresolved_compound', 0.50, 'partial_verified', 'Food Composition Table for Pakistan (Revised 2001)', 61, 55),
        
        # PK_RCP_005 (Kofta Curry)
        ('PK_ING_017', 'PK_RCP_005', 'Beef minced (Keema)', 'beef minced raw', '300', 'g', 300.0, 'PK_FCT_141', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 61, 55),
        ('PK_ING_018', 'PK_RCP_005', 'Gram flour (Besan / Channa)', 'chickpea raw channa', '30', 'g', 30.0, 'PK_FCT_026', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 61, 55),
        ('PK_ING_019', 'PK_RCP_005', 'Ghee / Cooking oil', 'desi ghee butter fat', '50', 'g', 50.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 61, 55),
        
        # PK_RCP_006 (Pulao Gosht)
        ('PK_ING_020', 'PK_RCP_006', 'Rice basmati', 'rice polished basmati', '250', 'g', 250.0, 'PK_FCT_008', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        ('PK_ING_021', 'PK_RCP_006', 'Beef meat', 'beef meat raw', '250', 'g', 250.0, 'PK_FCT_141', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        ('PK_ING_022', 'PK_RCP_006', 'Ghee / Cooking oil', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        
        # PK_RCP_007 (Shami Kabab)
        ('PK_ING_023', 'PK_RCP_007', 'Beef minced', 'beef minced raw', '250', 'g', 250.0, 'PK_FCT_141', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        ('PK_ING_024', 'PK_RCP_007', 'Channa daal (Split chickpea)', 'chickpea raw channa', '100', 'g', 100.0, 'PK_FCT_026', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        ('PK_ING_025', 'PK_RCP_007', 'Cooking oil for frying', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        ('PK_ING_026', 'PK_RCP_007', 'Egg for dipping', 'egg whole chicken raw', '1', 'household_piece', None, 'PK_FCT_136', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 62, 56),
        
        # PK_RCP_008 (Chapal Kabab)
        ('PK_ING_027', 'PK_RCP_008', 'Beef minced with fat', 'beef minced raw', '300', 'g', 300.0, 'PK_FCT_141', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        ('PK_ING_028', 'PK_RCP_008', 'Maize flour (Makai atta)', 'corn whole grain flour makai', '30', 'g', 30.0, 'PK_FCT_002', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        ('PK_ING_029', 'PK_RCP_008', 'Cooking oil / Animal fat', 'desi ghee butter fat', '50', 'g', 50.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        ('PK_ING_030', 'PK_RCP_008', 'Onion and pomegranate seeds', 'vegetable and spice blend', 'to taste', 'ad_libitum', None, None, 'unresolved_blend', 0.50, 'partial_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        
        # PK_RCP_009 (Chicken Curry)
        ('PK_ING_031', 'PK_RCP_009', 'Chicken meat', 'chicken meat broiler raw', '300', 'g', 300.0, 'PK_FCT_146', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        ('PK_ING_032', 'PK_RCP_009', 'Cooking oil / Ghee', 'desi ghee butter fat', '50', 'g', 50.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        ('PK_ING_033', 'PK_RCP_009', 'Onions and tomatoes', 'vegetables blend curry base', '2 medium', 'household_piece', None, None, 'unresolved_blend', 0.50, 'partial_verified', 'Food Composition Table for Pakistan (Revised 2001)', 63, 57),
        
        # PK_RCP_010 (Haleem)
        ('PK_ING_034', 'PK_RCP_010', 'Beef boneless', 'beef meat raw', '200', 'g', 200.0, 'PK_FCT_141', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_035', 'PK_RCP_010', 'Wheat grain crushed (Dalia)', 'wheat whole grain flour atta', '80', 'g', 80.0, 'PK_FCT_015', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_036', 'PK_RCP_010', 'Barley (Jou)', 'barley whole jou', '40', 'g', 40.0, 'PK_FCT_001', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_037', 'PK_RCP_010', 'Channa daal', 'chickpea raw channa', '30', 'g', 30.0, 'PK_FCT_026', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_038', 'PK_RCP_010', 'Masoor daal', 'lentil raw red', '30', 'g', 30.0, 'PK_FCT_032', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_039', 'PK_RCP_010', 'Moong daal', 'mung bean raw green gram', '30', 'g', 30.0, 'PK_FCT_033', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_040', 'PK_RCP_010', 'Ghee / Cooking oil', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        
        # PK_RCP_011 (Machli - Appendix-11)
        ('PK_ING_041', 'PK_RCP_011', 'Fish cleaned (cut into pieces)', 'fish rohu raw freshwater', '500', 'g', 500.0, 'PK_FCT_150', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_042', 'PK_RCP_011', 'Ghee / Oil for frying', 'desi ghee butter fat', '80', 'g', 80.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_043', 'PK_RCP_011', 'Garlic crushed', 'garlic raw', '15', 'g', 15.0, 'PK_FCT_068', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_044', 'PK_RCP_011', 'Iodized salt', 'salt iodized table', '4', 'g', 4.0, None, 'unmapped_condiment', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_045', 'PK_RCP_011', 'Red chilli powder', 'red chilli powder dry', '2', 'g', 2.0, 'PK_FCT_182', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_046', 'PK_RCP_011', 'Coriander powder', 'coriander seed dry whole powder', '4', 'g', 4.0, 'PK_FCT_179', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_047', 'PK_RCP_011', 'Garam masala', 'spices blend garam masala', '2', 'g', 2.0, None, 'unmapped_compound', 0.80, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_048', 'PK_RCP_011', 'Ajwain (Carom seed)', 'ajwain carom seeds', '1', 'g', 1.0, None, 'unmapped_spice', 0.80, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        ('PK_ING_049', 'PK_RCP_011', 'Vinegar', 'vinegar commercial synthetic', '40', 'ml', 40.0, None, 'unmapped_solvent', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 64, 58),
        
        # PK_RCP_012 (Sajji - Appendix-12)
        ('PK_ING_050', 'PK_RCP_012', "Lamb's leg meat", 'mutton lamb meat raw', '500', 'g', 500.0, 'PK_FCT_142', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_051', 'PK_RCP_012', 'Iodized salt', 'salt iodized table', '12', 'g', 12.0, None, 'unmapped_condiment', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_052', 'PK_RCP_012', 'Ghee / Oil basting', 'desi ghee butter fat', '40', 'g', 40.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        
        # PK_RCP_013 (Biryani - Appendix-13)
        ('PK_ING_053', 'PK_RCP_013', 'Chicken meat', 'chicken meat broiler raw', '250', 'g', 250.0, 'PK_FCT_146', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_054', 'PK_RCP_013', 'Rice basmati', 'rice polished basmati', '200', 'g', 200.0, 'PK_FCT_008', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_055', 'PK_RCP_013', 'Onion (chopped)', 'onion raw', '100', 'g', 100.0, 'PK_FCT_070', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_056', 'PK_RCP_013', 'Tomatoes (chopped)', 'tomato raw', '100', 'g', 100.0, 'PK_FCT_063', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_057', 'PK_RCP_013', 'Garlic (crushed)', 'garlic raw', '10', 'g', 10.0, 'PK_FCT_068', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_058', 'PK_RCP_013', 'Ginger (crushed)', 'ginger raw fresh', '10', 'g', 10.0, 'PK_FCT_069', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_059', 'PK_RCP_013', 'Ghee / Oil', 'desi ghee butter fat', '50', 'g', 50.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_060', 'PK_RCP_013', 'Iodized salt', 'salt iodized table', '8', 'g', 8.0, None, 'unmapped_condiment', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_061', 'PK_RCP_013', 'Red chilli powder', 'red chilli powder dry', '4', 'g', 4.0, 'PK_FCT_182', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_062', 'PK_RCP_013', 'Coriander powder', 'coriander seed dry whole powder', '8', 'g', 8.0, 'PK_FCT_179', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_063', 'PK_RCP_013', 'Garam masala', 'spices blend garam masala', '4', 'g', 4.0, None, 'unmapped_compound', 0.80, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_064', 'PK_RCP_013', 'Yogurt', 'yogurt curd dahi whole milk', '100', 'g', 100.0, 'PK_FCT_135', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_065', 'PK_RCP_013', 'Water', 'water', '500', 'ml', 500.0, None, 'unmapped_solvent', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        
        # PK_RCP_014 (Halwa Suji - Appendix-14)
        ('PK_ING_066', 'PK_RCP_014', 'Semolina (Suji)', 'wheat semolina suji', '150', 'g', 150.0, 'PK_FCT_017', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_067', 'PK_RCP_014', 'Desi Ghee', 'desi ghee butter fat', '100', 'g', 100.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_068', 'PK_RCP_014', 'Sugar', 'sugar cane white refined', '100', 'g', 100.0, 'PK_FCT_185', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_069', 'PK_RCP_014', 'Cardamom (green)', 'cardamom small green', '2', 'g', 2.0, None, 'unmapped_spice', 0.80, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_070', 'PK_RCP_014', 'Water', 'water', '300', 'ml', 300.0, None, 'unmapped_solvent', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        
        # PK_RCP_015 (Zarda - Appendix-15)
        ('PK_ING_071', 'PK_RCP_015', 'Rice basmati', 'rice polished basmati', '250', 'g', 250.0, 'PK_FCT_008', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_072', 'PK_RCP_015', 'Sugar', 'sugar cane white refined', '200', 'g', 200.0, 'PK_FCT_185', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_073', 'PK_RCP_015', 'Desi Ghee', 'desi ghee butter fat', '50', 'g', 50.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_074', 'PK_RCP_015', 'Cardamom (green)', 'cardamom small green', '2', 'g', 2.0, None, 'unmapped_spice', 0.80, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_075', 'PK_RCP_015', 'Almonds and Pistachio', 'nuts blend almond pistachio', '50', 'g', 50.0, 'PK_FCT_117', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_076', 'PK_RCP_015', 'Orange food Colour', 'food coloring non-nutritive', '1', 'g', 1.0, None, 'unmapped_condiment', 0.80, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        ('PK_ING_077', 'PK_RCP_015', 'Water', 'water', '1000', 'ml', 1000.0, None, 'unmapped_solvent', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 65, 59),
        
        # PK_RCP_016 (Kheer - Appendix-16)
        ('PK_ING_078', 'PK_RCP_016', 'Whole milk', 'milk buffalo fluid whole', '500', 'ml', 500.0, 'PK_FCT_133', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
        ('PK_ING_079', 'PK_RCP_016', 'Rice (broken)', 'rice polished chaval', '50', 'g', 50.0, 'PK_FCT_008', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
        ('PK_ING_080', 'PK_RCP_016', 'Sugar', 'sugar cane white refined', '60', 'g', 60.0, 'PK_FCT_185', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
        
        # PK_RCP_017 (Halwa Gajar - Appendix-17)
        ('PK_ING_081', 'PK_RCP_017', 'Red carrots (shredded)', 'carrot raw gajar', '500', 'g', 500.0, 'PK_FCT_066', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
        ('PK_ING_082', 'PK_RCP_017', 'Sugar', 'sugar cane white refined', '250', 'g', 250.0, 'PK_FCT_185', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
        ('PK_ING_083', 'PK_RCP_017', 'Whole milk', 'milk buffalo fluid whole', '250', 'ml', 250.0, 'PK_FCT_133', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
        ('PK_ING_084', 'PK_RCP_017', 'Desi Ghee', 'desi ghee butter fat', '100', 'g', 100.0, 'PK_FCT_173', 'exact_slug', 1.00, 'auto_verified', 'Food Composition Table for Pakistan (Revised 2001)', 66, 60),
    ]

    df_ingredients = pd.DataFrame(ingredients_raw, columns=[
        'recipe_ingredient_id', 'recipe_id', 'ingredient_name_original', 'ingredient_name_normalized',
        'quantity_original', 'unit_original', 'quantity_g', 'food_id', 'match_method', 'match_confidence',
        'review_status', 'source_document', 'pdf_page', 'printed_page'
    ])
    df_ingredients.to_csv('Meal/data/processed/pakistan_recipe_ingredients.csv', index=False)
    print(f"Saved reconciled pakistan_recipe_ingredients.csv ({len(df_ingredients)} ingredient rows across 17 recipes).")

    # 6. Build Primary Authoritative Recipe Nutrition (LEVEL_A)
    # Mapping golden tested dishes to recipes
    golden_map = {d['dish_number']: d for d in golden_dishes}
    nutrition_records = []

    for r in recipes_metadata:
        rid = r['recipe_id']
        dnum = r['dish_number']
        g = golden_map[dnum]

        # Per 100g cooked tested values
        e_100g = g['energy_kcal']
        m_100g = g['moisture_g']
        p_100g = g['protein_g']
        f_100g = g['fat_g']
        c_100g = g['carb_g']
        fib_100g = g['fiber_g']
        ash_100g = g['ash_g']
        ca_100g = g['calcium_mg']
        fe_100g = g['iron_mg']
        vitc_100g = g['vit_c_mg']

        rec = {
            'recipe_id': rid,
            'recipe_name': r['recipe_name_en'],
            'nutrition_basis': 'per_100g_cooked',
            'nutrition_method': 'laboratory_tested_fct',
            'nutrition_authority_level': 'LEVEL_A',
            'meal_planning_eligible': True,
            'energy_kcal_per_100g': e_100g,
            'moisture_g_per_100g': m_100g,
            'protein_g_per_100g': p_100g,
            'fat_g_per_100g': f_100g,
            'carb_g_per_100g': c_100g,
            'fiber_g_per_100g': fib_100g,
            'ash_g_per_100g': ash_100g,
            'calcium_mg_per_100g': ca_100g,
            'phosphorus_mg_per_100g': None,
            'iron_mg_per_100g': fe_100g,
            'zinc_mg_per_100g': None,
            'iodine_ppm': None,
            'thiamin_mg_per_100g': None,
            'riboflavin_mg_per_100g': None,
            'niacin_mg_per_100g': None,
            'vit_c_mg_per_100g': vitc_100g,
            'beta_carotene_mcg_per_100g': None,
            'vitamin_a_re_per_100g': None,
            'cholesterol_mg_per_100g': None,
            'serving_size_g': None,
            'servings_per_recipe': None,
            'energy_kcal_per_serving': None,
            'protein_g_per_serving': None,
            'fat_g_per_serving': None,
            'carb_g_per_serving': None,
            'fiber_g_per_serving': None,
            'calcium_mg_per_serving': None,
            'iron_mg_per_serving': None,
            'vit_c_mg_per_serving': None,
            'source_document': 'Food Composition Table for Pakistan (Revised 2001)',
            'pdf_page': g['pdf_page'],
            'printed_page': g['printed_page'],
            'source_table': f"FCT Traditional Foods Table (Dish {dnum})",
            'review_status': 'auto_verified'
        }
        nutrition_records.append(rec)

    df_recipe_nutrition = pd.DataFrame(nutrition_records)
    df_recipe_nutrition.to_csv('Meal/data/processed/pakistan_recipe_nutrition.csv', index=False)
    print(f"Saved authoritative pakistan_recipe_nutrition.csv ({len(df_recipe_nutrition)} LEVEL_A recipes, per-100g basis).")

    # 7. Build Standard Portion References (LEVEL_B) with Discrepancy Tracking
    portion_records = [
        {
            'portion_id': 'PK_PORTION_001',
            'portion_name_en': 'Standard Whole Wheat Chapati',
            'portion_name_ur': 'Gandum ki Chapatti (Standard Exchange)',
            'category': 'Flatbread / Cereal Staple',
            'entity_type': 'standard_portion_reference',
            'nutrition_authority_level': 'LEVEL_B',
            'meal_planning_eligible': True,
            'source_serving_description': '1 chapatti* (measures 8 inches diameter)',
            'source_raw_weight_g': 60.0,
            'source_cooked_weight_g': 80.0,
            'guideline_reported_energy_kcal': 160.0,
            'guideline_reported_carb_g': 30.0,
            'guideline_reported_protein_g': 6.0,
            'guideline_reported_fat_g': 1.0,
            'fct_raw_food_id': 'PK_FCT_015',
            'fct_raw_food_name': 'Wheat Whole (Atta)',
            'fct_calculated_energy_kcal': 214.2,
            'fct_calculated_carb_g': 45.12,
            'fct_calculated_protein_g': 6.00,
            'fct_calculated_fat_g': 0.72,
            'energy_discrepancy_pct': 33.9,
            'carb_discrepancy_pct': 50.4,
            'protein_discrepancy_pct': 0.0,
            'fat_discrepancy_status': 'within_stated_range_0_to_2g',
            'discrepancy_status': 'exchange_definition_mismatch',
            'authority_distinction': 'source_reported_value = Dietary Guidelines clinical exchange; derived_fct_value = Analytical chemical calculation from 60g raw atta',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'source_section': 'Table on Serving Sizes (p56-57) & Annexure-XV (p93)',
            'notes': 'Dietary Guidelines equates 1 chapatti to 2 bread slices (160 kcal, 30g carb), whereas Annexure-XV formulation specifies 60g dry atta dough yielding 80g cooked chapatti (214.2 kcal, 45.12g carb by FCT analytical data).'
        },
        {
            'portion_id': 'PK_PORTION_002',
            'portion_name_en': 'Plain Boiled Rice',
            'portion_name_ur': 'Ublay Huay Chawal (Standard Exchange)',
            'category': 'Cereal Staple',
            'entity_type': 'standard_portion_reference',
            'nutrition_authority_level': 'LEVEL_B',
            'meal_planning_eligible': True,
            'source_serving_description': '2/3 cup of cooked rice',
            'source_raw_weight_g': None,
            'source_cooked_weight_g': 75.0,
            'guideline_reported_energy_kcal': 160.0,
            'guideline_reported_carb_g': 30.0,
            'guideline_reported_protein_g': 6.0,
            'guideline_reported_fat_g': 1.0,
            'fct_raw_food_id': 'PK_FCT_008',
            'fct_raw_food_name': 'Rice Polished (Chaval)',
            'fct_calculated_energy_kcal': 108.0,
            'fct_calculated_carb_g': 23.85,
            'fct_calculated_protein_g': 2.01,
            'fct_calculated_fat_g': 0.27,
            'energy_discrepancy_pct': -32.5,
            'carb_discrepancy_pct': -20.5,
            'protein_discrepancy_pct': -66.5,
            'fat_discrepancy_status': 'within_stated_range_0_to_2g',
            'discrepancy_status': 'volume_vs_exchange_mismatch',
            'authority_distinction': 'source_reported_value = Dietary Guidelines clinical exchange; derived_fct_value = Analytical chemical calculation from 30g raw basmati rice yielding 75g cooked',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'source_section': 'Table on Serving Sizes (p56-57)',
            'notes': 'Dietary Guidelines assigns 2/3 cup cooked rice to the generic 160 kcal exchange, but 75g cooked rice derived from 30g raw basmati yields 108.0 kcal and 23.85g carb by FCT analytical data. Reaching 160 kcal would require ~111g cooked rice (44.4g dry rice).'
        }
    ]
    df_portions = pd.DataFrame(portion_records)
    df_portions.to_csv('Meal/data/processed/pakistan_portion_references.csv', index=False)
    print(f"Saved reconciled pakistan_portion_references.csv ({len(df_portions)} entries with discrepancy tracking).")

    # 8. Build Cultural Dishes (LEVEL_D)
    cultural_records = [
        {
            'recipe_id': 'PK_RCP_CUL_001',
            'recipe_name_en': 'Nihari',
            'recipe_name_ur': 'Nihari (Slow-cooked Beef Shank Stew)',
            'category': 'Meat Stew',
            'entity_type': 'cultural_reference_dish',
            'nutrition_authority_level': 'LEVEL_D',
            'meal_planning_eligible': False,
            'source_document': 'None - Cultural reference placeholder',
            'notes': 'Traditional slow-cooked shank stew with wheat flour slurry (atta) and aromatic spiced oil (tarka). Excluded from meal planning until quantified laboratory proximate data is available.'
        },
        {
            'recipe_id': 'PK_RCP_CUL_002',
            'recipe_name_en': 'Sarson Ka Saag',
            'recipe_name_ur': 'Sarson ka Saag (Slow-cooked Mustard Greens)',
            'category': 'Vegetable Dish',
            'entity_type': 'cultural_reference_dish',
            'nutrition_authority_level': 'LEVEL_D',
            'meal_planning_eligible': False,
            'source_document': 'None - Cultural reference placeholder',
            'notes': 'Traditional slow-cooked mustard and spinach greens with makai atta thickening and butter tempering. Excluded from meal planning until quantified laboratory proximate data is available.'
        },
        {
            'recipe_id': 'PK_RCP_CUL_003',
            'recipe_name_en': 'Karahi Meat',
            'recipe_name_ur': 'Karahi Gosht (Wok-cooked Spiced Meat)',
            'category': 'Meat Dish',
            'entity_type': 'cultural_reference_dish',
            'nutrition_authority_level': 'LEVEL_D',
            'meal_planning_eligible': False,
            'source_document': 'None - Cultural reference placeholder',
            'notes': 'Wok-cooked goat/beef dish with tomatoes, ginger, green chillies and high cooking fat. Excluded from meal planning until quantified laboratory proximate data is available.'
        }
    ]
    df_cultural = pd.DataFrame(cultural_records)
    df_cultural.to_csv('Meal/data/processed/pakistan_cultural_dishes.csv', index=False)
    print(f"Saved reconciled pakistan_cultural_dishes.csv ({len(df_cultural)} LEVEL_D entries).")

    # 9. Ingredient-Derived Recipe Nutrition Calculation (QA Dataset)
    calc_records = []
    val_records = []

    for r in recipes_metadata:
        rid = r['recipe_id']
        rname = r['recipe_name_en']
        dnum = r['dish_number']
        g_tested = golden_map[dnum]
        cooked_w = r['cooked_weight_g']

        # Get ingredients for this recipe
        ings = df_ingredients[df_ingredients['recipe_id'] == rid]
        count_total = len(ings)
        count_quantified = len(ings[ings['quantity_g'].notna()])
        count_unquantified = count_total - count_quantified
        
        # Check compound ingredients
        has_compound = any(ings['match_method'].str.contains('compound|blend', case=False, na=False))
        
        # Check if material ingredients complete
        is_material_complete = (count_unquantified == 0)

        # Sum raw weights
        raw_quantified_weight = ings['quantity_g'].sum()
        # Water weight
        water_rows = ings[ings['match_method'] == 'unmapped_solvent']
        water_weight = water_rows['quantity_g'].sum() if len(water_rows) > 0 else 0.0

        # Yield factor (metadata only)
        yield_factor = round(cooked_w / raw_quantified_weight, 3) if is_material_complete and raw_quantified_weight > 0 else None

        # Nutrients accumulation across quantified, mapped ingredients
        raw_energy = 0.0
        raw_protein = 0.0
        raw_fat = 0.0
        raw_carb = 0.0
        raw_fiber = 0.0
        raw_calcium = 0.0
        raw_iron = 0.0
        raw_vitc = 0.0

        quantified_with_fct = 0
        for _, ing in ings.iterrows():
            q_g = ing['quantity_g']
            fid = ing['food_id']
            if pd.isna(q_g) or q_g <= 0:
                continue # Never treat NULL as 0
            if pd.isna(fid) or fid not in fct_lookup:
                continue # Solvent or unmapped mineral
            
            f_nut = fct_lookup[fid]
            quantified_with_fct += 1
            
            # nutrient contribution = nutrient_per_100g * quantity_g / 100
            if pd.notna(f_nut.get('energy_kcal')):
                raw_energy += f_nut['energy_kcal'] * q_g / 100.0
            if pd.notna(f_nut.get('protein_g')):
                raw_protein += f_nut['protein_g'] * q_g / 100.0
            if pd.notna(f_nut.get('fat_g')):
                raw_fat += f_nut['fat_g'] * q_g / 100.0
            if pd.notna(f_nut.get('carb_g')):
                raw_carb += f_nut['carb_g'] * q_g / 100.0
            if pd.notna(f_nut.get('fiber_g')):
                raw_fiber += f_nut['fiber_g'] * q_g / 100.0
            if pd.notna(f_nut.get('calcium_mg')):
                raw_calcium += f_nut['calcium_mg'] * q_g / 100.0
            if pd.notna(f_nut.get('iron_mg')):
                raw_iron += f_nut['iron_mg'] * q_g / 100.0
            if pd.notna(f_nut.get('vit_c_mg')):
                raw_vitc += f_nut['vit_c_mg'] * q_g / 100.0

        # When final cooked weight is reliably known:
        # nutrient_per_100g_cooked = total_recipe_nutrient / cooked_weight_g * 100
        if cooked_w and cooked_w > 0:
            calc_e_100g = round(raw_energy / cooked_w * 100.0, 1)
            calc_p_100g = round(raw_protein / cooked_w * 100.0, 2)
            calc_f_100g = round(raw_fat / cooked_w * 100.0, 2)
            calc_c_100g = round(raw_carb / cooked_w * 100.0, 2)
            calc_fib_100g = round(raw_fiber / cooked_w * 100.0, 2)
            calc_ca_100g = round(raw_calcium / cooked_w * 100.0, 2)
            calc_fe_100g = round(raw_iron / cooked_w * 100.0, 2)
            calc_vitc_100g = round(raw_vitc / cooked_w * 100.0, 2)
        else:
            calc_e_100g = calc_p_100g = calc_f_100g = calc_c_100g = calc_fib_100g = None
            calc_ca_100g = calc_fe_100g = calc_vitc_100g = None

        calc_status = 'complete_quantified_calculation' if is_material_complete else 'partial_quantified_estimate'

        calc_rec = {
            'recipe_id': rid,
            'recipe_name': rname,
            'ingredient_count_total': count_total,
            'ingredient_count_quantified': count_quantified,
            'ingredient_count_unquantified': count_unquantified,
            'material_ingredients_complete': is_material_complete,
            'compound_ingredients_present': has_compound,
            'cooked_weight_available': cooked_w is not None,
            'quantified_raw_weight_g': round(raw_quantified_weight, 1),
            'water_weight_g': round(water_weight, 1),
            'cooked_weight_g': cooked_w,
            'yield_factor': yield_factor,
            'calculated_energy_kcal_raw_total': round(raw_energy, 1),
            'calculated_protein_g_raw_total': round(raw_protein, 2),
            'calculated_fat_g_raw_total': round(raw_fat, 2),
            'calculated_carb_g_raw_total': round(raw_carb, 2),
            'calculated_fiber_g_raw_total': round(raw_fiber, 2),
            'calculated_calcium_mg_raw_total': round(raw_calcium, 2),
            'calculated_iron_mg_raw_total': round(raw_iron, 2),
            'calculated_vit_c_mg_raw_total': round(raw_vitc, 2),
            'calculated_energy_kcal_per_100g': calc_e_100g,
            'calculated_protein_g_per_100g': calc_p_100g,
            'calculated_fat_g_per_100g': calc_f_100g,
            'calculated_carb_g_per_100g': calc_c_100g,
            'calculated_fiber_g_per_100g': calc_fib_100g,
            'calculated_calcium_mg_per_100g': calc_ca_100g,
            'calculated_iron_mg_per_100g': calc_fe_100g,
            'calculated_vit_c_mg_per_100g': calc_vitc_100g,
            'qa_calculation_status': calc_status,
            'notes': 'QA ingredient-derived estimate only; primary user-facing nutrition remains Level-A laboratory FCT value.'
        }
        calc_records.append(calc_rec)

        # Validation comparison (Tested vs Calculated per 100g)
        test_e = g_tested['energy_kcal']
        test_p = g_tested['protein_g']
        test_f = g_tested['fat_g']
        test_c = g_tested['carb_g']

        diff_e = round(((calc_e_100g - test_e) / test_e) * 100.0, 1) if test_e and calc_e_100g else None
        diff_p = round(((calc_p_100g - test_p) / test_p) * 100.0, 1) if test_p and calc_p_100g else None
        diff_f = round(((calc_f_100g - test_f) / test_f) * 100.0, 1) if test_f and calc_f_100g else None
        diff_c = round(((calc_c_100g - test_c) / test_c) * 100.0, 1) if test_c and calc_c_100g else None

        val_rec = {
            'recipe_id': rid,
            'recipe_name': rname,
            'ingredient_count_quantified': count_quantified,
            'ingredient_count_total': count_total,
            'material_ingredients_complete': is_material_complete,
            'tested_energy_kcal_per_100g': test_e,
            'calculated_energy_kcal_per_100g': calc_e_100g,
            'energy_difference_pct': diff_e,
            'tested_protein_g_per_100g': test_p,
            'calculated_protein_g_per_100g': calc_p_100g,
            'protein_difference_pct': diff_p,
            'tested_fat_g_per_100g': test_f,
            'calculated_fat_g_per_100g': calc_f_100g,
            'fat_difference_pct': diff_f,
            'tested_carb_g_per_100g': test_c,
            'calculated_carb_g_per_100g': calc_c_100g,
            'carb_difference_pct': diff_c,
            'validation_status': 'verified_consistent' if (diff_e is not None and abs(diff_e) <= 30.0) else 'qa_discrepancy_audited',
            'notes': f"Tested Level A is authoritative. Material complete: {is_material_complete}."
        }
        val_records.append(val_rec)

    df_calc = pd.DataFrame(calc_records)
    df_calc.to_csv('Meal/data/processed/pakistan_recipe_nutrition_calculated.csv', index=False)
    print(f"Saved calculated QA dataset pakistan_recipe_nutrition_calculated.csv ({len(df_calc)} recipes).")

    df_val = pd.DataFrame(val_records)
    df_val.to_csv('Meal/data/processed/pakistan_recipe_nutrition_validation.csv', index=False)
    print(f"Saved validation comparison pakistan_recipe_nutrition_validation.csv ({len(df_val)} recipes).")

    print("="*60)
    print("PHASE 3 DATASET GENERATION COMPLETE!")
    print("="*60)

if __name__ == '__main__':
    build_all_phase3_datasets()
