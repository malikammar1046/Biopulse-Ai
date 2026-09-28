import os
import pandas as pd
import numpy as np

def run_nutrient_plausibility_validation():
    csv_path = 'Meal/data/processed/pakistan_food_composition.csv'
    assert os.path.exists(csv_path), f"Missing {csv_path}"
    df = pd.read_csv(csv_path)
    
    suspicious = []
    
    for idx, r in df.iterrows():
        food_id = r['food_id']
        sr_no = r['sr_no']
        name = r['food_name_en']
        group = r['food_group']
        
        # 1. Non-negativity check
        for col in ['energy_kcal', 'moisture_g', 'protein_g', 'fat_g', 'carb_g', 'fiber_g', 'ash_g', 'calcium_mg', 'iron_mg', 'zinc_mg']:
            val = r[col]
            if pd.notnull(val) and val < 0:
                suspicious.append({
                    'food_id': food_id,
                    'sr_no': sr_no,
                    'food_name_en': name,
                    'food_group': group,
                    'field_name': col,
                    'extracted_value': val,
                    'rule_violated': 'NEGATIVE_VALUE',
                    'plausible_range': '>= 0.0',
                    'note': 'Impossible negative nutrient quantity.'
                })
                
        # 2. Macros > 100g per 100g
        for col in ['protein_g', 'fat_g', 'carb_g', 'fiber_g', 'moisture_g', 'ash_g']:
            val = r[col]
            if pd.notnull(val) and val > 100.0:
                suspicious.append({
                    'food_id': food_id,
                    'sr_no': sr_no,
                    'food_name_en': name,
                    'food_group': group,
                    'field_name': col,
                    'extracted_value': val,
                    'rule_violated': 'MACRO_EXCEEDS_100G',
                    'plausible_range': '<= 100.0 g',
                    'note': 'Macronutrient cannot exceed 100g total edible portion.'
                })
                
        # 3. Proximate mass balance heuristic (90.0 to 108.0 g)
        m = r['moisture_g']
        p = r['protein_g']
        f = r['fat_g']
        c = r['carb_g']
        fib = r['fiber_g']
        ash = r['ash_g']
        
        if pd.notnull(m) and pd.notnull(p) and pd.notnull(f) and pd.notnull(c):
            prox_sum = m + p + f + c + (fib if pd.notnull(fib) else 0) + (ash if pd.notnull(ash) else 0)
            if prox_sum < 85.0 or prox_sum > 112.0:
                suspicious.append({
                    'food_id': food_id,
                    'sr_no': sr_no,
                    'food_name_en': name,
                    'food_group': group,
                    'field_name': 'proximate_mass_sum',
                    'extracted_value': round(prox_sum, 1),
                    'rule_violated': 'PROXIMATE_SUM_OUT_OF_BOUNDS',
                    'plausible_range': '90.0 - 108.0 g',
                    'note': f'Total proximate mass sums to {prox_sum:.1f}g per 100g (heuristic flag only).'
                })
                
        # 4. Atwater energy heuristic: Energy ~ 4*Protein + 9*Fat + 4*Carb
        e = r['energy_kcal']
        if pd.notnull(e) and pd.notnull(p) and pd.notnull(f) and pd.notnull(c):
            atwater_calc = (4.0 * p) + (9.0 * f) + (4.0 * c)
            discrepancy = abs(e - atwater_calc)
            if discrepancy > 35.0:
                suspicious.append({
                    'food_id': food_id,
                    'sr_no': sr_no,
                    'food_name_en': name,
                    'food_group': group,
                    'field_name': 'energy_kcal',
                    'extracted_value': e,
                    'rule_violated': 'ATWATER_ENERGY_DISCREPANCY',
                    'plausible_range': f'{round(atwater_calc - 30)} - {round(atwater_calc + 30)} kcal',
                    'note': f'Atwater theoretical energy is {atwater_calc:.0f} kcal (discrepancy: {discrepancy:.0f} kcal; heuristic flag only).'
                })
                
        # 5. Extreme micronutrients
        if pd.notnull(r['calcium_mg']) and r['calcium_mg'] > 3000.0:
            suspicious.append({
                'food_id': food_id,
                'sr_no': sr_no,
                'food_name_en': name,
                'food_group': group,
                'field_name': 'calcium_mg',
                'extracted_value': r['calcium_mg'],
                'rule_violated': 'EXTREME_MICRONUTRIENT',
                'plausible_range': '<= 3000 mg',
                'note': 'Extreme calcium value, check for missing decimal.'
            })
        if pd.notnull(r['iron_mg']) and r['iron_mg'] > 120.0:
            suspicious.append({
                'food_id': food_id,
                'sr_no': sr_no,
                'food_name_en': name,
                'food_group': group,
                'field_name': 'iron_mg',
                'extracted_value': r['iron_mg'],
                'rule_violated': 'EXTREME_MICRONUTRIENT',
                'plausible_range': '<= 120 mg',
                'note': 'Extreme iron value, check for missing decimal.'
            })
            
    df_susp = pd.DataFrame(suspicious)
    out_csv = 'Meal/data/reviews/suspicious_nutrients.csv'
    df_susp.to_csv(out_csv, index=False)
    print(f"Audited {len(df)} foods. Generated {len(df_susp)} heuristic review items in {out_csv}.")
    return df_susp

if __name__ == '__main__':
    run_nutrient_plausibility_validation()
