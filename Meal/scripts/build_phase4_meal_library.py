import os
import re
import pandas as pd
import numpy as np
import pymupdf

def build_phase4_datasets():
    print("="*60)
    print("PHASE 4A: MEAL LIBRARY EXPANSION, AUDIT & COMPONENT PIPELINE")
    print("="*60)

    # -------------------------------------------------------------
    # 1. Update pakistan_portion_references.csv with rectified schema
    # -------------------------------------------------------------
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
            'guideline_raw_weight_g': 60.0,
            'derived_assumed_raw_weight_g': 60.0,
            'source_cooked_weight_g': 80.0,
            'guideline_exchange_energy_kcal': 160.0,
            'guideline_exchange_carb_g': 30.0,
            'guideline_exchange_protein_g': 6.0,
            'guideline_exchange_fat_min_g': 0.0,
            'guideline_exchange_fat_max_g': 2.0,
            # Backward-compatible aliases for Phase 3 validators
            'guideline_reported_energy_kcal': 160.0,
            'guideline_reported_carb_g': 30.0,
            'guideline_reported_protein_g': 6.0,
            'fct_raw_food_id': 'PK_FCT_015',
            'fct_raw_food_name': 'Wheat Whole (Atta)',
            'derived_fct_energy_kcal': 214.2,
            'derived_fct_carb_g': 45.12,
            'derived_fct_protein_g': 6.00,
            'derived_fct_fat_g': 0.72,
            'fct_calculated_energy_kcal': 214.2,
            'fct_calculated_carb_g': 45.12,
            'fct_calculated_protein_g': 6.00,
            'fct_calculated_fat_g': 0.72,
            'energy_discrepancy_pct': 33.9,
            'carb_discrepancy_pct': 50.4,
            'protein_discrepancy_pct': 0.0,
            'discrepancy_status': 'exchange_definition_mismatch',
            'authority_distinction': 'guideline_exchange = generic 2-bread-slices clinical exchange; derived_fct = analytical yield from 60g raw whole wheat atta',
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
            'guideline_raw_weight_g': None,
            'derived_assumed_raw_weight_g': 30.0,
            'source_cooked_weight_g': 75.0,
            'guideline_exchange_energy_kcal': 160.0,
            'guideline_exchange_carb_g': 30.0,
            'guideline_exchange_protein_g': 6.0,
            'guideline_exchange_fat_min_g': 0.0,
            'guideline_exchange_fat_max_g': 2.0,
            # Backward-compatible aliases for Phase 3 validators
            'guideline_reported_energy_kcal': 160.0,
            'guideline_reported_carb_g': 30.0,
            'guideline_reported_protein_g': 6.0,
            'fct_raw_food_id': 'PK_FCT_008',
            'fct_raw_food_name': 'Rice Polished (Chaval)',
            'derived_fct_energy_kcal': 108.0,
            'derived_fct_carb_g': 23.85,
            'derived_fct_protein_g': 2.01,
            'derived_fct_fat_g': 0.27,
            'fct_calculated_energy_kcal': 108.0,
            'fct_calculated_carb_g': 23.85,
            'fct_calculated_protein_g': 2.01,
            'fct_calculated_fat_g': 0.27,
            'energy_discrepancy_pct': -32.5,
            'carb_discrepancy_pct': -20.5,
            'protein_discrepancy_pct': -66.5,
            'discrepancy_status': 'volume_vs_exchange_mismatch',
            'authority_distinction': 'guideline_exchange = generic 2-bread-slices clinical exchange; derived_fct = analytical yield from 30g raw basmati rice yielding 75g cooked',
            'source_document': 'Pakistan Dietary Guidelines for Better Nutrition (2019)',
            'source_section': 'Table on Serving Sizes (p56-57)',
            'notes': 'Dietary Guidelines assigns 2/3 cup cooked rice to the generic 160 kcal exchange, but 75g cooked rice derived from 30g raw basmati yields 108.0 kcal and 23.85g carb by FCT analytical data. Reaching 160 kcal requires ~111g cooked rice (44.4g dry rice).'
        }
    ]
    df_portions = pd.DataFrame(portion_records)
    p_portion_out = 'Meal/data/processed/pakistan_portion_references.csv'
    df_portions.to_csv(p_portion_out, index=False)
    print(f"Updated {p_portion_out} with rectified exchange vs derived schema.")

    # -------------------------------------------------------------
    # 2. Audit all 62 Gastronomy Dishes from 3_v3_1_24.pdf
    # -------------------------------------------------------------
    doc = pymupdf.open('Meal/Nutrition_sources/3_v3_1_24.pdf')
    table2_text = doc[4].get_text() + '\n' + doc[5].get_text()
    lines = [l.strip() for l in table2_text.split('\n') if l.strip()]

    parsed_gastro = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r'^\d+$', line) and 1 <= int(line) <= 62:
            sr = int(line)
            i += 1
            name_parts = []
            while i < len(lines) and not re.match(r'^\d+$', lines[i]):
                name_parts.append(lines[i])
                i += 1
            freq = None
            rel_freq = None
            pct = None
            if i < len(lines) and re.match(r'^\d+$', lines[i]):
                freq = int(lines[i])
                i += 1
            if i < len(lines) and re.match(r'^0?\.\d+$', lines[i]):
                rel_freq = float(lines[i])
                i += 1
            if i < len(lines) and '%' in lines[i]:
                pct = lines[i]
                i += 1
            full_name = ' '.join(name_parts)
            is_std = '*' in pct if pct else False
            parsed_gastro.append({
                'sr_no': sr,
                'dish_raw': full_name,
                'frequency': freq,
                'relative_frequency': rel_freq,
                'percent': pct,
                'is_selected_for_standardization': is_std
            })
        else:
            i += 1

    print(f"Extracted {len(parsed_gastro)} dishes from Gastronomy Table 2.")

    # BioPulse matching dictionary
    # Exact / Normalized Alias matches:
    # S/r 06: Aloo Gosht -> PK_RCP_003 (Alu Gosht) -> READY (LEVEL_A)
    # S/r 21: Beef Pulao -> PK_RCP_006 (Pulao Gosht / Rice with Beef) -> READY (LEVEL_A)
    # S/r 25: Chicken Biryani -> PK_RCP_013 (Biryani / Murgh Biryani) -> READY (LEVEL_A)
    # S/r 55: Saag Makhni -> PK_RCP_CUL_002 (Sarson Ka Saag) -> REFERENCE_ONLY (LEVEL_D)

    audit_records = []
    for g in parsed_gastro:
        sr = g['sr_no']
        raw = g['dish_raw']
        
        # Split English name and description if in parentheses
        m_paren = re.match(r'^(.*?)\s*\((.*?)\)$', raw)
        if m_paren:
            name_en = m_paren.group(1).strip()
            desc = m_paren.group(2).strip()
        else:
            name_en = raw
            desc = ''

        # Determine category
        name_lower = name_en.lower()
        if 'pulao' in name_lower or 'biryani' in name_lower or 'chawwal' in name_lower or 'kichdi' in name_lower:
            cat = 'Rice & Cereal Dish'
        elif 'gosht' in name_lower or 'qeema' in name_lower or 'chicken' in name_lower or 'beef' in name_lower or 'mutton' in name_lower or 'fish' in name_lower:
            cat = 'Meat & Vegetable Curry'
        elif 'bhujia' in name_lower or 'bharta' in name_lower or 'aloo' in name_lower or 'sabzi' in name_lower or 'saag' in name_lower or 'tori' in name_lower or 'tinday' in name_lower or 'karelay' in name_lower or 'gobhi' in name_lower or 'ghiyya' in name_lower or 'arbi' in name_lower or 'mooli' in name_lower or 'moongray' in name_lower:
            cat = 'Vegetable Dish / Curry'
        elif 'makhanay' in name_lower:
            cat = 'Snack / Specialty Dish'
        else:
            cat = 'Traditional Dish'

        # Match logic
        if sr == 6: # Aloo Gosht
            match_id = 'PK_RCP_003'
            match_name = 'Alu Gosht (Potato Meat Curry)'
            match_type = 'normalized_alias_match'
            status = 'READY'
            auth = 'LEVEL_A'
            form_avail = True
            nut_avail = True
            notes = 'Matches PK_RCP_003 Alu Gosht in FCT 2001 (Table 3, Appendix-3). Authoritative Level-A laboratory proximate data available.'
        elif sr == 21: # Beef Pulao
            match_id = 'PK_RCP_006'
            match_name = 'Pulao Gosht (Rice with Beef)'
            match_type = 'normalized_alias_match'
            status = 'READY'
            auth = 'LEVEL_A'
            form_avail = True
            nut_avail = True
            notes = 'Matches PK_RCP_006 Pulao Gosht in FCT 2001 (Table 6, Appendix-6) which specifies beef and rice cooked in beef broth. Authoritative Level-A laboratory proximate data available.'
        elif sr == 25: # Chicken Biryani
            match_id = 'PK_RCP_013'
            match_name = 'Biryani (Rice with Chicken Meat)'
            match_type = 'normalized_alias_match'
            status = 'READY'
            auth = 'LEVEL_A'
            form_avail = True
            nut_avail = True
            notes = 'Matches PK_RCP_013 Biryani in FCT 2001 (Table 13, Appendix-13) which specifies chicken meat layered with rice. Authoritative Level-A laboratory proximate data available.'
        elif sr == 55: # Saag Makhni
            match_id = 'PK_RCP_CUL_002'
            match_name = 'Sarson Ka Saag'
            match_type = 'possible_match_needs_review'
            status = 'REFERENCE_ONLY'
            auth = 'LEVEL_D'
            form_avail = False
            nut_avail = False
            notes = 'Culturally related to PK_RCP_CUL_002 Sarson Ka Saag, but neither FCT nor paper provides quantitative formulation. Retained as reference only.'
        else:
            match_id = None
            match_name = None
            match_type = 'no_match'
            status = 'NEEDS_RECIPE_SOURCE'
            auth = 'LEVEL_D'
            form_avail = False
            nut_avail = False
            notes = 'High cultural consumption frequency in Pakistani Gastronomy study, but paper lacks quantitative ingredient grams and laboratory proximate data. Needs authoritative recipe source in Phase 4B.'

        audit_records.append({
            'sr_no': sr,
            'dish_name': name_en,
            'description': desc,
            'consumption_frequency': g['frequency'],
            'relative_frequency': g['relative_frequency'],
            'percent_frequent_consumption': g['percent'],
            'selected_for_sensory_std': g['is_selected_for_standardization'],
            'category': cat,
            'quantitative_formulation_available': form_avail,
            'tested_nutrition_available': nut_avail,
            'existing_biopulse_match_id': match_id,
            'existing_biopulse_match_name': match_name,
            'match_type': match_type,
            'candidate_status': status,
            'authority_level': auth,
            'source_document': 'Pakistani Traditional Gastronomy Study (South Asian J Public Health 2024)',
            'source_page': 'Pages 5-6 (Table 2)',
            'audit_notes': notes
        })

    df_gastro_audit = pd.DataFrame(audit_records)
    p_gastro_out = 'Meal/data/processed/gastronomy_dishes_audit.csv'
    df_gastro_audit.to_csv(p_gastro_out, index=False)
    print(f"Saved {p_gastro_out} ({len(df_gastro_audit)} dishes audited).")

    # -------------------------------------------------------------
    # 3. Build Standalone Meal Components Library (pakistan_meal_components.csv)
    # -------------------------------------------------------------
    df_fct = pd.read_csv('Meal/data/processed/pakistan_food_composition.csv')
    fct_lookup = df_fct.set_index('food_id').to_dict('index')

    components_spec = [
        # DAIRY
        ('PK_COMP_001', 'Curd / Yogurt (Dahi)', 'دہی', 'PK_FCT_130', 'dairy', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'breakfast|snack|side', '100g edible portion', False, True, False, False, False, False, False, 'lacto_vegetarian_candidate', True),
        ('PK_COMP_002', 'Butter Milk (Lassi)', 'لسی', 'PK_FCT_129', 'dairy', 'processed', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack|beverage', '100g edible portion', False, True, False, False, False, False, False, 'lacto_vegetarian_candidate', True),
        ('PK_COMP_003', 'Whole Buffalo Milk', 'بھینس کا دودھ', 'PK_FCT_133', 'dairy', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'breakfast|snack|beverage', '100g fluid milk', False, True, False, False, False, False, False, 'lacto_vegetarian_candidate', True),
        ('PK_COMP_004', 'Cottage Cheese (Paneer)', 'پنیر', 'PK_FCT_131', 'dairy', 'processed', False, True, 'BOTH', 'READY_DIRECT', True, 'breakfast|snack|side', '100g edible portion', False, True, False, False, False, False, False, 'lacto_vegetarian_candidate', True),
        
        # EGGS
        ('PK_COMP_005', 'Boiled Chicken Egg', 'ابلا ہوا انڈا', 'PK_FCT_167', 'egg', 'boiled', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g boiled egg (~2 medium eggs)', False, False, True, False, False, False, False, 'ovo_lacto_vegetarian_candidate', True),
        ('PK_COMP_006', 'Raw Whole Chicken Egg', 'کچا انڈا', 'PK_FCT_166', 'egg', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'breakfast|lunch|dinner', '100g raw egg', False, False, True, False, False, False, False, 'ovo_lacto_vegetarian_candidate', True),

        # FRUITS
        ('PK_COMP_007', 'Fresh Apple (Seb)', 'سیب', 'PK_FCT_083', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g edible fruit (~1 small apple)', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_008', 'Ripe Banana (Kela)', 'کیلا', 'PK_FCT_085', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g edible fruit (~1 medium banana)', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_009', 'Guava Whole (Amrud)', 'امرود', 'PK_FCT_092', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g edible fruit (~1 medium guava)', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_010', 'Dried Dates (Khajur)', 'خشک کھجور', 'PK_FCT_087', 'fruit', 'dried', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g dried dates (~8-10 dates)', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_011', 'Fresh Apricot (Khubani)', 'خوبانی', 'PK_FCT_084', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g edible fruit (~3-4 apricots)', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_012', 'Fresh Orange (Malta)', 'مالٹا', 'PK_FCT_105', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g edible citrus fruit', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_013', 'Ripe Mango (Aam)', 'آم', 'PK_FCT_099', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack|dessert', '100g edible mango flesh', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_014', 'Pomegranate (Anar)', 'انار', 'PK_FCT_111', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g edible seeds', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_015', 'Watermelon (Tarbuz)', 'تربوز', 'PK_FCT_101', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g edible flesh', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_016', 'Musk Melon (Sarda)', 'سردہ', 'PK_FCT_100', 'fruit', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g edible flesh', False, False, False, False, False, False, False, 'plant_based', True),

        # NUTS & SEEDS
        ('PK_COMP_017', 'Raw Almond (Badam)', 'بادام', 'PK_FCT_117', 'nut_seed', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g raw almonds', False, False, False, False, False, False, True, 'plant_based', True),
        ('PK_COMP_018', 'Raw Walnut (Akhrot)', 'اخروٹ', 'PK_FCT_119', 'nut_seed', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack', '100g raw walnuts', False, False, False, False, False, False, True, 'plant_based', True),
        ('PK_COMP_019', 'Peanut (Mongphali)', 'مونگ پھلی', 'PK_FCT_126', 'nut_seed', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g peanuts', False, False, False, False, False, False, True, 'plant_based', True),
        ('PK_COMP_020', 'Pistachio (Pista)', 'پستہ', 'PK_FCT_124', 'nut_seed', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'snack', '100g pistachios', False, False, False, False, False, False, True, 'plant_based', True),

        # PULSES & LEGUMES
        ('PK_COMP_021', 'Cooked Chickpea (Channa)', 'پکا ہوا چنا', 'PK_FCT_027', 'pulse', 'cooked', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|snack|side', '100g cooked chickpeas', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_022', 'Raw Chickpea (Channa)', 'کچا چنا', 'PK_FCT_026', 'pulse', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g dry raw chickpeas', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_023', 'Cooked Broad Bean (Lobia)', 'پکی ہوئی لوبیا', 'PK_FCT_025', 'pulse', 'cooked', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'lunch|dinner|side', '100g cooked broad beans', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_024', 'Raw Red Lentil (Masur)', 'کچی مسور دال', 'PK_FCT_032', 'pulse', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g dry raw lentils', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_025', 'Raw Green Gram (Mung)', 'کچی مونگ دال', 'PK_FCT_034', 'pulse', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g dry raw mung beans', False, False, False, False, False, False, False, 'plant_based', True),

        # SALAD & RAW VEGETABLES
        ('PK_COMP_026', 'Raw Cucumber (Khira)', 'کھیرا', 'PK_FCT_049', 'vegetable', 'raw', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'lunch|dinner|side|snack', '100g raw sliced cucumber', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_027', 'Raw Tomato (Tamatar)', 'ٹماٹر', 'PK_FCT_063', 'vegetable', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'lunch|dinner|side', '100g raw sliced tomato', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_028', 'Raw Carrot (Gajor)', 'گاجر', 'PK_FCT_066', 'vegetable', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'lunch|dinner|side|snack', '100g raw sliced carrot', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_029', 'Raw Radish (Mooli)', 'مولی', 'PK_FCT_072', 'vegetable', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'lunch|dinner|side', '100g raw sliced radish', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_030', 'Raw Beetroot (Chakunder)', 'چقندر', 'PK_FCT_065', 'vegetable', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'lunch|dinner|side', '100g raw sliced beetroot', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_031', 'Raw Onion (Piaz)', 'پیاز', 'PK_FCT_070', 'vegetable', 'raw', False, True, 'BOTH', 'READY_DIRECT', True, 'lunch|dinner|side', '100g raw sliced onion', False, False, False, False, False, False, False, 'plant_based', True),

        # CEREAL STAPLES & GRAINS
        ('PK_COMP_032', 'Standard Whole Wheat Chapati', 'گندم کی چپاتی', 'PK_PORTION_001', 'cereal_staple', 'cooked', False, True, 'STANDARD_PORTION', 'READY_AS_PORTION', True, 'breakfast|lunch|dinner|staple', '1 standard chapati (80g cooked from 60g atta)', True, False, False, False, False, True, False, 'plant_based', True),
        ('PK_COMP_033', 'Plain Boiled Rice', 'ابلے ہوئے چاول', 'PK_PORTION_002', 'cereal_staple', 'boiled', False, True, 'STANDARD_PORTION', 'READY_AS_PORTION', True, 'lunch|dinner|staple', '1 standard exchange (75g cooked rice, 2/3 cup)', True, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_034', 'Corn Bread (Makai Roti)', 'مکئی کی روٹی', 'PK_FCT_004', 'cereal_staple', 'cooked', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'breakfast|lunch|dinner|staple', '100g baked corn bread', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_035', 'Wheat Tandoori Bread (Nan)', 'نان', 'PK_FCT_018', 'cereal_staple', 'cooked', False, True, 'DIRECT_MEAL_COMPONENT', 'READY_DIRECT', True, 'lunch|dinner|staple', '100g tandoori bread', False, False, False, False, False, True, False, 'plant_based', True),
        ('PK_COMP_036', 'Dry Whole Wheat Atta', 'گندم کا آٹا', 'PK_FCT_015', 'cereal_staple', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'breakfast|lunch|dinner', '100g raw whole wheat flour', False, False, False, False, False, True, False, 'plant_based', True),
        ('PK_COMP_037', 'Raw Polished Basmati Rice', 'کچے چاول', 'PK_FCT_008', 'cereal_staple', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g raw basmati rice', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_038', 'Raw Whole Oats (Jei)', 'کچی جئی', 'PK_FCT_006', 'cereal_staple', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'breakfast', '100g raw whole oat grain', False, False, False, False, False, False, False, 'plant_based', True),
        ('PK_COMP_039', 'Raw Whole Barley (Jou)', 'کچا جو', 'PK_FCT_001', 'cereal_staple', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'breakfast', '100g raw whole barley grain', False, False, False, False, False, False, False, 'plant_based', True),

        # MEAT, FISH & POULTRY (RAW INGREDIENTS)
        ('PK_COMP_040', 'Raw Broiler Chicken Meat', 'کچا چکن', 'PK_FCT_146', 'meat', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g raw chicken flesh', False, False, False, False, True, False, False, 'contains_meat', False),
        ('PK_COMP_041', 'Raw Beef Meat', 'کچی گائے کا گوشت', 'PK_FCT_141', 'meat', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g raw beef flesh', False, False, False, False, True, False, False, 'contains_meat', False),
        ('PK_COMP_042', 'Raw Rohu Freshwater Fish', 'کچی روہو مچھلی', 'PK_FCT_155', 'fish', 'raw', True, False, 'RECIPE_INGREDIENT', 'RECIPE_ONLY', False, 'lunch|dinner', '100g raw cleaned fish flesh', False, False, False, True, False, False, False, 'contains_fish', False)
    ]

    comp_records = []
    for c in components_spec:
        cid, cname, ur, fid, ctype, prep_state, req_prep, rte, usage_class, readiness, eligible, roles, unit_desc, portion_avail, cd, ce, cf, cm, cw, cn, diet, veg = c
        
        # Look up nutrients
        if fid == 'PK_PORTION_001':
            e_100g = 267.8 # derived per 100g cooked
            p_100g = 7.50
            f_100g = 0.90
            c_100g = 56.33
            fib_100g = 0.80
            src_doc = 'Pakistan Dietary Guidelines for Better Nutrition (2019)'
            src_pg = 'p56-57, p93'
            auth = 'LEVEL_B'
            s_name = 'Whole wheat flour atta dough'
        elif fid == 'PK_PORTION_002':
            e_100g = 144.0 # derived per 100g cooked
            p_100g = 2.68
            f_100g = 0.36
            c_100g = 31.80
            fib_100g = 0.16
            src_doc = 'Pakistan Dietary Guidelines for Better Nutrition (2019)'
            src_pg = 'p56-57'
            auth = 'LEVEL_B'
            s_name = 'Polished basmati rice boiled in water'
        else:
            fn = fct_lookup[fid]
            e_100g = fn['energy_kcal']
            p_100g = fn['protein_g']
            f_100g = fn['fat_g']
            c_100g = fn['carb_g']
            fib_100g = fn['fiber_g']
            src_doc = fn['source_document']
            src_pg = f"Printed p{fn['printed_page']}"
            auth = 'LEVEL_A'
            s_name = fn['food_name_en']

        comp_records.append({
            'component_id': cid,
            'component_name': cname,
            'name_ur': ur,
            'food_id': fid,
            'source_food_name': s_name,
            'component_type': ctype,
            'source_preparation_state': prep_state,
            'requires_preparation': req_prep,
            'ready_to_eat': rte,
            'component_usage_class': usage_class,
            'planner_readiness': readiness,
            'planner_eligible': eligible,
            'meal_roles': roles,
            'default_unit_description': unit_desc,
            'source_portion_available': portion_avail,
            'nutrition_basis': 'per_100g_source_food_state',
            'energy_kcal_per_100g': e_100g,
            'protein_g_per_100g': p_100g,
            'fat_g_per_100g': f_100g,
            'carb_g_per_100g': c_100g,
            'fiber_g_per_100g': fib_100g,
            'known_contains_dairy': cd,
            'known_contains_egg': ce,
            'known_contains_fish': cf,
            'known_contains_meat': cm,
            'known_contains_wheat': cw,
            'known_contains_nuts': cn,
            'allergen_assessment_complete': True,
            'dietary_class': diet,
            'vegetarian_candidate': veg,
            'source_document': src_doc,
            'source_page': src_pg,
            'authority_level': auth,
            'notes': f"Source preparation state: {prep_state}. Direct nutrition from primary verified FCT chemical analysis."
        })

    df_components = pd.DataFrame(comp_records)
    p_comp_out = 'Meal/data/processed/pakistan_meal_components.csv'
    df_components.to_csv(p_comp_out, index=False)
    print(f"Saved {p_comp_out} ({len(df_components)} standalone meal components).")

    # -------------------------------------------------------------
    # 4. Build Master Candidate Catalog (pakistan_meal_candidates.csv)
    # -------------------------------------------------------------
    df_recipes = pd.read_csv('Meal/data/processed/pakistan_recipes.csv')
    df_cult = pd.read_csv('Meal/data/processed/pakistan_cultural_dishes.csv')

    candidate_rows = []

    # 1. 17 Level-A Standardized Recipes
    for _, r in df_recipes.iterrows():
        rid = r['recipe_id']
        name_en = r['recipe_name_en']
        name_ur = r['recipe_name_ur']
        cat = r['category']
        
        if 'Halwa' in name_en or 'Kheer' in name_en or 'Zarda' in name_en:
            roles = 'dessert|snack'
        elif 'Chapati' in name_en:
            roles = 'breakfast|lunch|dinner|staple'
        elif 'Kabab' in name_en:
            roles = 'lunch|dinner|snack|side'
        else:
            roles = 'lunch|dinner'

        candidate_rows.append({
            'candidate_id': f"CAN_RCP_{rid.replace('PK_RCP_', '')}",
            'name_en': name_en,
            'name_local': name_ur,
            'entity_class': 'standardized_recipe',
            'meal_role': roles,
            'category': cat,
            'source_document': r['source_document'],
            'source_page': f"PDF p{r['pdf_page']}",
            'source_table': r['source_table_or_appendix'],
            'formulation_available': True,
            'nutrition_available': True,
            'authority_level': 'LEVEL_A',
            'future_planner_eligible': True,
            'candidate_status': 'READY',
            'notes': 'Authoritative Level-A traditional dish with chemical proximate testing and standardized recipe formulation.'
        })

    # 2. 2 Level-B Standard Portions
    for _, p in df_portions.iterrows():
        pid = p['portion_id']
        name_en = p['portion_name_en']
        name_ur = p['portion_name_ur']
        cat = p['category']
        roles = 'breakfast|lunch|dinner|staple' if 'Chapati' in name_en else 'lunch|dinner|staple'

        candidate_rows.append({
            'candidate_id': f"CAN_PORT_{pid.replace('PK_PORTION_', '')}",
            'name_en': name_en,
            'name_local': name_ur,
            'entity_class': 'standard_portion',
            'meal_role': roles,
            'category': cat,
            'source_document': p['source_document'],
            'source_page': p['source_section'],
            'source_table': 'Dietary Guidelines Serving Exchange Tables',
            'formulation_available': True,
            'nutrition_available': True,
            'authority_level': 'LEVEL_B',
            'future_planner_eligible': True,
            'candidate_status': 'READY',
            'notes': 'Official Pakistan Dietary Guidelines standard staple exchange portion with verified raw grain formulation.'
        })

    # 3. 3 Level-D Cultural References
    for _, c in df_cult.iterrows():
        cid = c['recipe_id']
        name_en = c['recipe_name_en']
        name_ur = c['recipe_name_ur']
        cat = c['category']

        candidate_rows.append({
            'candidate_id': f"CAN_CUL_{cid.replace('PK_RCP_CUL_', '')}",
            'name_en': name_en,
            'name_local': name_ur,
            'entity_class': 'cultural_reference',
            'meal_role': 'lunch|dinner',
            'category': cat,
            'source_document': c['source_document'],
            'source_page': 'N/A',
            'source_table': 'Cultural Culinary Reference',
            'formulation_available': False,
            'nutrition_available': False,
            'authority_level': 'LEVEL_D',
            'future_planner_eligible': False,
            'candidate_status': 'REFERENCE_ONLY',
            'notes': 'Culturally prominent dish without empirical laboratory proximate testing or standardized formulation. Ineligible for planning until quantified.'
        })

    # 4. Standalone Meal Components
    for _, m in df_components.iterrows():
        cid = m['component_id']
        name_en = m['component_name']
        name_ur = m['name_ur']
        ctype = m['component_type']
        roles = m['meal_roles']
        eligible = m['planner_eligible']
        readiness = m['planner_readiness']

        candidate_rows.append({
            'candidate_id': f"CAN_CMP_{cid.replace('PK_COMP_', '')}",
            'name_en': name_en,
            'name_local': name_ur,
            'entity_class': 'food_component',
            'meal_role': roles,
            'category': f"Standalone {ctype.replace('_', ' ').title()}",
            'source_document': m['source_document'],
            'source_page': m['source_page'],
            'source_table': 'FCT Primary Food Tables',
            'formulation_available': True,
            'nutrition_available': True,
            'authority_level': m['authority_level'],
            'future_planner_eligible': eligible,
            'candidate_status': readiness,
            'notes': f"Direct component from verified FCT food {m['food_id']} ({m['source_preparation_state']})."
        })

    # 5. Gastronomy Candidates (excluding the ones already represented in Level-A / Level-D)
    existing_gastro_matched_srs = {6, 21, 25, 55}
    for _, g in df_gastro_audit.iterrows():
        sr = g['sr_no']
        if sr in existing_gastro_matched_srs:
            continue # already included via Level-A or Level-D above

        name_en = g['dish_name']
        desc = g['description']
        cat = g['category']
        roles = 'lunch|dinner'

        candidate_rows.append({
            'candidate_id': f"CAN_GAS_{sr:03d}",
            'name_en': name_en,
            'name_local': desc,
            'entity_class': 'candidate_recipe',
            'meal_role': roles,
            'category': cat,
            'source_document': g['source_document'],
            'source_page': g['source_page'],
            'source_table': 'Table 2 Cereal and Vegetable Based Dishes',
            'formulation_available': False,
            'nutrition_available': False,
            'authority_level': 'LEVEL_D',
            'future_planner_eligible': False,
            'candidate_status': 'NEEDS_RECIPE_SOURCE',
            'notes': f"Gastronomy study dish (frequency: {g['consumption_frequency']}, {g['percent_frequent_consumption']}). Requires authoritative recipe formulation in Phase 4B."
        })

    df_candidates = pd.DataFrame(candidate_rows)
    p_can_out = 'Meal/data/processed/pakistan_meal_candidates.csv'
    df_candidates.to_csv(p_can_out, index=False)
    print(f"Saved {p_can_out} ({len(df_candidates)} total candidate meal catalog entries).")

    print("="*60)
    print("PHASE 4A DATASET GENERATION COMPLETE!")
    print("="*60)

if __name__ == '__main__':
    build_phase4_datasets()
