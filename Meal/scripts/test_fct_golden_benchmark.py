import json
import os
import sys
sys.path.insert(0, os.path.abspath('.'))
from Meal.scripts.extract_fct import join_page_pair

def run_regression_test():
    benchmark_path = 'Meal/data/raw/fct_golden_benchmark_20.json'
    with open(benchmark_path, 'r', encoding='utf-8') as f:
        golden_rows = json.load(f)
        
    golden_by_sr = {r['sr_no']: r for r in golden_rows}
    
    # Run extractor on pages 13-18
    pairs = [
        (13, 14, "Cereals and Cereal Products"),
        (15, 16, "Cereals and Cereal Products"),
        (17, 18, "Pulses and Legumes")
    ]
    extracted_by_sr = {}
    for ep, op, grp in pairs:
        recs, mism = join_page_pair(ep, op, grp)
        for r in recs:
            extracted_by_sr[r['sr_no']] = r
            
    print(f"=== Running FCT Golden Regression Benchmark ({len(golden_rows)} targets) ===")
    passed = 0
    failed = 0
    tolerance = 1.5 # tolerance for minor OCR decimal differences
    
    for sr, gold in golden_by_sr.items():
        if sr not in extracted_by_sr:
            print(f"FAILED: Sr {sr} ({gold['food_name_en']}) was NOT joined by extractor.")
            failed += 1
            continue
            
        ext = extracted_by_sr[sr]
        sr_passed = True
        diffs = []
        
        # Check macros
        for field in ['energy_kcal', 'moisture_g', 'protein_g', 'fat_g', 'carb_g', 'fiber_g']:
            g_val = gold.get(field)
            e_val = ext.get(field)
            if g_val is not None:
                if e_val is None:
                    diffs.append(f"{field}: expected {g_val}, got None")
                    sr_passed = False
                elif abs(g_val - e_val) > tolerance:
                    diffs.append(f"{field}: expected {g_val}, got {e_val}")
                    sr_passed = False
                    
        # Check minerals
        for field in ['calcium_mg', 'phosphorus_mg', 'iron_mg', 'zinc_mg']:
            g_val = gold.get(field)
            e_val = ext.get(field)
            if g_val is not None:
                if e_val is None:
                    diffs.append(f"{field}: expected {g_val}, got None")
                    sr_passed = False
                elif abs(g_val - e_val) > tolerance:
                    diffs.append(f"{field}: expected {g_val}, got {e_val}")
                    sr_passed = False
                    
        if sr_passed:
            passed += 1
            print(f"  PASS [Sr {sr:02d}]: {ext['food_name_en']} ({ext['food_name_ur']}) - Energy: {ext['energy_kcal']} kcal, Protein: {ext['protein_g']} g, Ca: {ext['calcium_mg']} mg, Fe: {ext['iron_mg']} mg")
        else:
            failed += 1
            print(f"  FAIL [Sr {sr:02d}]: {gold['food_name_en']} -> {', '.join(diffs)}")
            
    success_rate = (passed / len(golden_rows)) * 100
    print(f"\nBenchmark Results: {passed}/{len(golden_rows)} passed ({success_rate:.1f}%).")
    
    if success_rate < 85.0:
        raise RuntimeError(f"Golden benchmark failed! Only {passed}/{len(golden_rows)} passed. Systematic errors present.")
    else:
        print(">>> GOLDEN BENCHMARK PASSED. Automated FCT extractor is validated for Phase 2!")

if __name__ == '__main__':
    run_regression_test()
