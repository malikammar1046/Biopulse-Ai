import os
import sys
sys.path.insert(0, '.')
import pandas as pd
import numpy as np

from Meal.scripts.extract_all_fct_tables import run_full_fct_extraction
from Meal.scripts.validate_nutrients import run_nutrient_plausibility_validation
from Meal.scripts.extract_all_recipes import build_all_standardized_recipes

def build_expanded_aliases():
    """
    Comprehensive mapping of Pakistani vernacular/Urdu culinary names across all 13 categories
    to authoritative FCT food_ids.
    """
    aliases = [
        # Cereals
        ('PK_ALS_001', 'PK_FCT_015', 'Atta', 'urdu_vernacular', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_002', 'PK_FCT_015', 'Wheat whole flour', 'english_synonym', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_003', 'PK_FCT_015', 'Gandam atta', 'urdu_vernacular', 'Pakistan Dietary Guidelines', 57, 0.95, 'auto_verified'),
        ('PK_ALS_004', 'PK_FCT_016', 'Maida', 'urdu_vernacular', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_005', 'PK_FCT_016', 'Refined wheat flour', 'english_synonym', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_006', 'PK_FCT_017', 'Suji', 'urdu_vernacular', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_007', 'PK_FCT_017', 'Semolina', 'english_synonym', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_008', 'PK_FCT_018', 'Nan', 'culinary_dish', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_009', 'PK_FCT_019', 'Chapati', 'culinary_dish', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_010', 'PK_FCT_019', 'Roti', 'urdu_vernacular', 'Pakistan Dietary Guidelines', 93, 0.95, 'auto_verified'),
        ('PK_ALS_011', 'PK_FCT_020', 'Paratha', 'culinary_dish', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_012', 'PK_FCT_022', 'Double Roti', 'urdu_vernacular', 'Food Composition Table for Pakistan', 15, 1.00, 'auto_verified'),
        ('PK_ALS_013', 'PK_FCT_008', 'Chaval', 'urdu_vernacular', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_014', 'PK_FCT_008', 'Polished rice', 'english_synonym', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_015', 'PK_FCT_008', 'Basmati rice', 'variety_commercial', 'Minimum Cost of the Diet (CoD), Pakistan', 34, 0.90, 'auto_verified'),
        ('PK_ALS_016', 'PK_FCT_001', 'Jou', 'urdu_vernacular', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_017', 'PK_FCT_001', 'Barley', 'english_synonym', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_018', 'PK_FCT_002', 'Makai', 'urdu_vernacular', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_019', 'PK_FCT_005', 'Bajra', 'urdu_vernacular', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_020', 'PK_FCT_005', 'Pearl millet', 'english_synonym', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_021', 'PK_FCT_012', 'Cheri', 'urdu_vernacular', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        ('PK_ALS_022', 'PK_FCT_012', 'Sorghum', 'english_synonym', 'Food Composition Table for Pakistan', 13, 1.00, 'auto_verified'),
        
        # Legumes
        ('PK_ALS_023', 'PK_FCT_024', 'Lobia', 'urdu_vernacular', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_024', 'PK_FCT_024', 'Broad bean', 'english_synonym', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_025', 'PK_FCT_026', 'Channa', 'urdu_vernacular', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_026', 'PK_FCT_026', 'Chickpea raw', 'english_synonym', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_027', 'PK_FCT_026', 'Kala chana', 'variety_color', 'Pakistan Dietary Guidelines', 57, 0.95, 'auto_verified'),
        ('PK_ALS_028', 'PK_FCT_028', 'Rawan', 'urdu_vernacular', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_029', 'PK_FCT_028', 'Cow pea', 'english_synonym', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_030', 'PK_FCT_030', 'Moth', 'urdu_vernacular', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_031', 'PK_FCT_030', 'Kidney bean', 'english_synonym', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_032', 'PK_FCT_032', 'Masur', 'urdu_vernacular', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_033', 'PK_FCT_032', 'Red lentil', 'english_synonym', 'Food Composition Table for Pakistan', 17, 1.00, 'auto_verified'),
        ('PK_ALS_034', 'PK_FCT_034', 'Moong', 'urdu_vernacular', 'Food Composition Table for Pakistan', 19, 1.00, 'auto_verified'),
        ('PK_ALS_035', 'PK_FCT_034', 'Green gram', 'english_synonym', 'Food Composition Table for Pakistan', 19, 1.00, 'auto_verified'),
        ('PK_ALS_036', 'PK_FCT_036', 'Mash', 'urdu_vernacular', 'Food Composition Table for Pakistan', 19, 1.00, 'auto_verified'),
        ('PK_ALS_037', 'PK_FCT_036', 'Black gram / Urad', 'english_synonym', 'Food Composition Table for Pakistan', 19, 1.00, 'auto_verified'),
        
        # Vegetables, Roots & Tubers
        ('PK_ALS_038', 'PK_FCT_045', 'Palak', 'urdu_vernacular', 'Food Composition Table for Pakistan', 21, 1.00, 'auto_verified'),
        ('PK_ALS_039', 'PK_FCT_045', 'Spinach', 'english_synonym', 'Food Composition Table for Pakistan', 21, 1.00, 'auto_verified'),
        ('PK_ALS_040', 'PK_FCT_065', 'Alu', 'urdu_vernacular', 'Food Composition Table for Pakistan', 25, 1.00, 'auto_verified'),
        ('PK_ALS_041', 'PK_FCT_065', 'Potato', 'english_synonym', 'Food Composition Table for Pakistan', 25, 1.00, 'auto_verified'),
        
        # Spices & Condiments
        ('PK_ALS_042', 'PK_FCT_074', 'Piaz', 'urdu_vernacular', 'Food Composition Table for Pakistan', 27, 1.00, 'auto_verified'),
        ('PK_ALS_043', 'PK_FCT_074', 'Onion', 'english_synonym', 'Food Composition Table for Pakistan', 27, 1.00, 'auto_verified'),
        ('PK_ALS_044', 'PK_FCT_075', 'Lahsan', 'urdu_vernacular', 'Food Composition Table for Pakistan', 27, 1.00, 'auto_verified'),
        ('PK_ALS_045', 'PK_FCT_075', 'Garlic', 'english_synonym', 'Food Composition Table for Pakistan', 27, 1.00, 'auto_verified'),
        ('PK_ALS_046', 'PK_FCT_076', 'Adrak', 'urdu_vernacular', 'Food Composition Table for Pakistan', 27, 1.00, 'auto_verified'),
        ('PK_ALS_047', 'PK_FCT_076', 'Ginger', 'english_synonym', 'Food Composition Table for Pakistan', 27, 1.00, 'auto_verified'),
        
        # Meat, Poultry, Dairy, Fats, Sugar
        ('PK_ALS_048', 'PK_FCT_141', 'Gosht', 'urdu_vernacular', 'Food Composition Table for Pakistan', 37, 1.00, 'auto_verified'),
        ('PK_ALS_049', 'PK_FCT_141', 'Beef meat raw', 'english_synonym', 'Food Composition Table for Pakistan', 37, 1.00, 'auto_verified'),
        ('PK_ALS_050', 'PK_FCT_129', 'Doodh', 'urdu_vernacular', 'Food Composition Table for Pakistan', 35, 1.00, 'auto_verified'),
        ('PK_ALS_051', 'PK_FCT_129', 'Fresh buffalo milk', 'english_synonym', 'Food Composition Table for Pakistan', 35, 1.00, 'auto_verified'),
        ('PK_ALS_052', 'PK_FCT_172', 'Ghee', 'urdu_vernacular', 'Food Composition Table for Pakistan', 43, 1.00, 'auto_verified'),
        ('PK_ALS_053', 'PK_FCT_172', 'Desi Ghee / Butter fat', 'english_synonym', 'Food Composition Table for Pakistan', 43, 1.00, 'auto_verified'),
        ('PK_ALS_054', 'PK_FCT_185', 'Cheeni', 'urdu_vernacular', 'Food Composition Table for Pakistan', 45, 1.00, 'auto_verified'),
        ('PK_ALS_055', 'PK_FCT_185', 'Sugar white refined', 'english_synonym', 'Food Composition Table for Pakistan', 45, 1.00, 'auto_verified')
    ]
    df_alias = pd.DataFrame(aliases, columns=[
        'alias_id', 'food_id', 'alias', 'alias_type', 'source_document', 'pdf_page', 'mapping_confidence', 'review_status'
    ])
    alias_csv = 'Meal/data/processed/pakistan_food_aliases.csv'
    df_alias.to_csv(alias_csv, index=False)
    print(f"Saved {len(df_alias)} expanded aliases to {alias_csv}")

def build_dietary_guidelines():
    guidelines = [
        {
            'exchange_id': 'PK_GDL_001',
            'food_group': 'Cereals & Tubers',
            'target_population': 'Adults 19–60 years',
            'recommended_servings_min': 4.0,
            'recommended_servings_max': 5.0,
            'serving_unit': 'exchange/serving',
            'standard_serving_size_g': 60.0,
            'serving_description': '1 medium chapatti (60g flour / 80g cooked) or 1/2 cup cooked rice (75g) or 1 slice bread (30g)',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'pdf_page': 57,
            'printed_page': 43,
            'source_table': 'Table 7.2 Balanced Diet Recommendations'
        },
        {
            'exchange_id': 'PK_GDL_002',
            'food_group': 'Vegetables',
            'target_population': 'Adults 19–60 years',
            'recommended_servings_min': 3.0,
            'recommended_servings_max': 4.0,
            'serving_unit': 'serving',
            'standard_serving_size_g': 100.0,
            'serving_description': '1 cup raw leafy vegetables (e.g. Palak/Saag) or 1/2 cup cooked vegetables or 1/2 cup vegetable soup',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'pdf_page': 57,
            'printed_page': 43,
            'source_table': 'Table 7.2 Balanced Diet Recommendations'
        },
        {
            'exchange_id': 'PK_GDL_003',
            'food_group': 'Fruits',
            'target_population': 'Adults 19–60 years',
            'recommended_servings_min': 2.0,
            'recommended_servings_max': 3.0,
            'serving_unit': 'serving',
            'standard_serving_size_g': 120.0,
            'serving_description': '1 medium fresh fruit (e.g. apple, orange, guava) or 1/2 cup chopped fruit or 1/4 cup dried fruit',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'pdf_page': 57,
            'printed_page': 43,
            'source_table': 'Table 7.2 Balanced Diet Recommendations'
        },
        {
            'exchange_id': 'PK_GDL_004',
            'food_group': 'Pulses, Meat, Poultry, Fish & Eggs',
            'target_population': 'Adults 19–60 years',
            'recommended_servings_min': 2.0,
            'recommended_servings_max': 3.0,
            'serving_unit': 'serving',
            'standard_serving_size_g': 60.0,
            'serving_description': '2 small pieces cooked meat/poultry/fish (60g) or 1/2 cup cooked daal/pulses (100g) or 1 whole egg',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'pdf_page': 57,
            'printed_page': 43,
            'source_table': 'Table 7.2 Balanced Diet Recommendations'
        },
        {
            'exchange_id': 'PK_GDL_005',
            'food_group': 'Milk & Dairy Products',
            'target_population': 'Adults 19–60 years',
            'recommended_servings_min': 2.0,
            'recommended_servings_max': 3.0,
            'serving_unit': 'serving',
            'standard_serving_size_g': 250.0,
            'serving_description': '1 glass milk (250ml) or 1 cup yogurt/dahi (200g) or 40g paneer/cheese',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'pdf_page': 57,
            'printed_page': 43,
            'source_table': 'Table 7.2 Balanced Diet Recommendations'
        },
        {
            'exchange_id': 'PK_GDL_006',
            'food_group': 'Fats and Oils',
            'target_population': 'Adults 19–60 years',
            'recommended_servings_min': 3.0,
            'recommended_servings_max': 4.0,
            'serving_unit': 'teaspoon',
            'standard_serving_size_g': 5.0,
            'serving_description': '1 teaspoon oil or ghee (5g) used in meal preparation',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'pdf_page': 57,
            'printed_page': 43,
            'source_table': 'Table 7.2 Balanced Diet Recommendations'
        }
    ]
    pd.DataFrame(guidelines).to_csv('Meal/data/processed/pakistan_dietary_guidelines.csv', index=False)
    print("Saved dietary guidelines to Meal/data/processed/pakistan_dietary_guidelines.csv")

def build_cod_historical():
    cod_prices = [
        {'price_id': 'PK_COD_001', 'food_name': 'Atta / Wheat flour', 'food_group': 'Cereals', 'historical_price': 42.5, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Combined', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 34, 'printed_page': 28, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_002', 'food_name': 'Atta / Wheat flour', 'food_group': 'Cereals', 'historical_price': 44.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Sindh', 'urban_rural': 'Combined', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 34, 'printed_page': 28, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_003', 'food_name': 'Atta / Wheat flour', 'food_group': 'Cereals', 'historical_price': 45.5, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'KPK', 'urban_rural': 'Rural', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 34, 'printed_page': 28, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_004', 'food_name': 'Atta / Wheat flour', 'food_group': 'Cereals', 'historical_price': 46.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Balochistan', 'urban_rural': 'Rural', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 34, 'printed_page': 28, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_005', 'food_name': 'Rice Basmati', 'food_group': 'Cereals', 'historical_price': 85.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Urban', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 34, 'printed_page': 28, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_006', 'food_name': 'Rice Irri / Coarse', 'food_group': 'Cereals', 'historical_price': 48.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Sindh', 'urban_rural': 'Rural', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 34, 'printed_page': 28, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_007', 'food_name': 'Daal Masoor (Red Lentil)', 'food_group': 'Legumes', 'historical_price': 148.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_008', 'food_name': 'Daal Moong (Green Gram)', 'food_group': 'Legumes', 'historical_price': 152.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_009', 'food_name': 'Daal Chana (Gram split)', 'food_group': 'Legumes', 'historical_price': 120.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Combined', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_010', 'food_name': 'Potatoes (Alu)', 'food_group': 'Vegetables', 'historical_price': 32.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Combined', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_011', 'food_name': 'Onions (Piaz)', 'food_group': 'Vegetables', 'historical_price': 38.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_012', 'food_name': 'Tomatoes (Tamater)', 'food_group': 'Vegetables', 'historical_price': 45.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_013', 'food_name': 'Spinach (Palak)', 'food_group': 'Vegetables', 'historical_price': 25.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Rural', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 35, 'printed_page': 29, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_014', 'food_name': 'Fresh Milk (Cow/Buffalo)', 'food_group': 'Dairy', 'historical_price': 75.0, 'price_unit': 'per liter', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Combined', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 36, 'printed_page': 30, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_015', 'food_name': 'Eggs (Farm)', 'food_group': 'Poultry', 'historical_price': 92.0, 'price_unit': 'per dozen', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 36, 'printed_page': 30, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_016', 'food_name': 'Chicken (Broiler)', 'food_group': 'Meat & Poultry', 'historical_price': 165.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'Punjab', 'urban_rural': 'Urban', 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 36, 'printed_page': 30, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_017', 'food_name': 'Beef (with bone)', 'food_group': 'Meat', 'historical_price': 320.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 36, 'printed_page': 30, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_018', 'food_name': 'Mutton', 'food_group': 'Meat', 'historical_price': 620.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 36, 'printed_page': 30, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'},
        {'price_id': 'PK_COD_019', 'food_name': 'Cooking Oil / Ghee', 'food_group': 'Fats and Oils', 'historical_price': 155.0, 'price_unit': 'per kg', 'price_year': 2016, 'province': 'National', 'urban_rural': None, 'source_document': 'Minimum Cost of the Diet (CoD), Pakistan', 'pdf_page': 36, 'printed_page': 30, 'source_table_or_appendix': 'Annex 3 Market Survey Food List'}
    ]
    pd.DataFrame(cod_prices).to_csv('Meal/data/processed/pakistan_cod_historical_prices.csv', index=False)
    print("Saved historical prices to Meal/data/processed/pakistan_cod_historical_prices.csv")

if __name__ == '__main__':
    print("=== Master Execution: BioPulse AI Pakistani Nutrition Foundation ===")
    run_full_fct_extraction()
    run_nutrient_plausibility_validation()
    build_all_standardized_recipes()
    build_expanded_aliases()
    build_dietary_guidelines()
    build_cod_historical()
    print("=== Master Execution Complete! ===")
