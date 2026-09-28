"""
Validation script for Phase 4A Meal Library Expansion, Cultural Inventory & Component Foundation.
Verifies integrity across:
- pakistan_portion_references.csv
- gastronomy_dishes_audit.csv
- pakistan_meal_components.csv
- pakistan_meal_candidates.csv
"""

import os
import sys
import glob
import pandas as pd
import numpy as np

def run_phase4_validation():
    print("=" * 65)
    print("PHASE 4A INTEGRITY & AUDIT VALIDATION SUITE")
    print("=" * 65)
    
    passed_tests = 0
    total_tests = 0

    def assert_test(cond, msg):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if cond:
            print(f"  [PASS] {msg}")
            passed_tests += 1
        else:
            print(f"  [FAIL] {msg}")
            sys.exit(1)

    # -------------------------------------------------------------
    # 1. Dataset Existence & Row Counts
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 1: Dataset Existence & Row Counts ---")
    p_port = "Meal/data/processed/pakistan_portion_references.csv"
    p_gastro = "Meal/data/processed/gastronomy_dishes_audit.csv"
    p_comp = "Meal/data/processed/pakistan_meal_components.csv"
    p_cand = "Meal/data/processed/pakistan_meal_candidates.csv"
    p_fct = "Meal/data/processed/pakistan_food_composition.csv"
    p_rcp = "Meal/data/processed/pakistan_recipes.csv"

    for p in [p_port, p_gastro, p_comp, p_cand, p_fct, p_rcp]:
        assert_test(os.path.exists(p), f"File exists: {p}")

    df_port = pd.read_csv(p_port)
    df_gastro = pd.read_csv(p_gastro)
    df_comp = pd.read_csv(p_comp)
    df_cand = pd.read_csv(p_cand)
    df_fct = pd.read_csv(p_fct)
    df_rcp = pd.read_csv(p_rcp)

    assert_test(len(df_port) == 2, f"Portion references count is exactly 2 (got {len(df_port)})")
    assert_test(len(df_gastro) == 62, f"Gastronomy audit count is exactly 62 (got {len(df_gastro)})")
    assert_test(len(df_comp) >= 40, f"Meal components count is >= 40 (got {len(df_comp)})")
    assert_test(len(df_cand) >= 120, f"Meal candidates catalog count is >= 120 (got {len(df_cand)})")

    # -------------------------------------------------------------
    # 2. Referential Integrity
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 2: Referential Integrity ---")
    p_cult = "Meal/data/processed/pakistan_cultural_dishes.csv"
    assert_test(os.path.exists(p_cult), f"File exists: {p_cult}")
    df_cult = pd.read_csv(p_cult)

    fct_ids = set(df_fct['food_id'].dropna())
    port_ids = set(df_port['portion_id'].dropna())
    rcp_ids = set(df_rcp['recipe_id'].dropna()) | set(df_cult['recipe_id'].dropna())

    for idx, row in df_comp.iterrows():
        fid = row['food_id']
        if fid.startswith('PK_FCT_'):
            assert_test(fid in fct_ids, f"Component {row['component_id']} food_id {fid} exists in FCT")
        elif fid.startswith('PK_PORTION_'):
            assert_test(fid in port_ids, f"Component {row['component_id']} food_id {fid} exists in portions")
        else:
            assert_test(False, f"Component {row['component_id']} has unknown food_id prefix: {fid}")

    # Check matches in gastronomy audit
    for idx, row in df_gastro.iterrows():
        mid = row['existing_biopulse_match_id']
        if pd.notna(mid) and str(mid).strip() != '':
            assert_test(mid in rcp_ids or mid in port_ids, f"Gastronomy dish match {mid} exists in BioPulse recipes/portions")

    # -------------------------------------------------------------
    # 3. Preparation State & Planner Readiness Logic
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 3: Preparation State & Planner Readiness ---")
    allowed_prep_states = {'raw', 'cooked', 'boiled', 'fried', 'roasted', 'dried', 'processed', 'unknown'}
    allowed_usage_classes = {'DIRECT_MEAL_COMPONENT', 'RECIPE_INGREDIENT', 'STANDARD_PORTION', 'BOTH'}
    allowed_dietary_classes = {'plant_based', 'lacto_vegetarian_candidate', 'ovo_lacto_vegetarian_candidate', 'contains_fish', 'contains_meat', 'unknown'}
    allowed_readiness_values = {'READY_DIRECT', 'READY_AS_PORTION', 'RECIPE_ONLY', 'NEEDS_PORTION_SOURCE', 'NEEDS_RECIPE_SOURCE', 'REFERENCE_ONLY'}

    for idx, row in df_comp.iterrows():
        cid = row['component_id']
        prep = row['source_preparation_state']
        req_prep = bool(row['requires_preparation'])
        rte = bool(row['ready_to_eat'])
        usage = row['component_usage_class']
        readiness = row['planner_readiness']
        eligible = bool(row['planner_eligible'])
        diet = row['dietary_class']

        assert_test(prep in allowed_prep_states, f"{cid}: prep state '{prep}' is valid")
        assert_test(usage in allowed_usage_classes, f"{cid}: usage class '{usage}' is valid")
        assert_test(readiness in allowed_readiness_values, f"{cid}: readiness '{readiness}' is valid")
        assert_test(diet in allowed_dietary_classes, f"{cid}: dietary class '{diet}' is valid")

        # Invariant: If requires_preparation is True, CANNOT be ready_to_eat and CANNOT be planner_eligible
        if req_prep:
            assert_test(rte is False, f"{cid}: requires_prep=True implies ready_to_eat=False")
            assert_test(eligible is False, f"{cid}: requires_prep=True implies planner_eligible=False")
            assert_test(readiness in ['RECIPE_ONLY', 'NEEDS_PORTION_SOURCE', 'NEEDS_RECIPE_SOURCE'], f"{cid}: requires_prep=True implies readiness is not READY_*")

        # Invariant: If ready_to_eat is True, requires_preparation MUST be False
        if rte:
            assert_test(req_prep is False, f"{cid}: ready_to_eat=True implies requires_preparation=False")
            assert_test(eligible is True, f"{cid}: ready_to_eat=True implies planner_eligible=True")
            assert_test(readiness in ['READY_DIRECT', 'READY_AS_PORTION'], f"{cid}: ready_to_eat=True implies readiness is READY_*")

    # -------------------------------------------------------------
    # 4. Allergen Metadata Semantics
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 4: Allergen Semantics ---")
    allergen_cols = [
        'known_contains_dairy', 'known_contains_egg', 'known_contains_fish',
        'known_contains_meat', 'known_contains_wheat', 'known_contains_nuts',
        'allergen_assessment_complete'
    ]
    for col in allergen_cols:
        assert_test(col in df_comp.columns, f"Allergen column exists: {col}")
        # Check all values are boolean
        non_bools = [v for v in df_comp[col] if not isinstance(v, (bool, np.bool_))]
        assert_test(len(non_bools) == 0, f"All values in {col} are strict booleans")

    # -------------------------------------------------------------
    # 5. Portion References Rectified Schema & Discrepancies
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 5: Portion References Schema & Rectification ---")
    port_required_cols = [
        'guideline_raw_weight_g', 'derived_assumed_raw_weight_g', 'source_cooked_weight_g',
        'guideline_exchange_energy_kcal', 'guideline_exchange_carb_g', 'guideline_exchange_protein_g',
        'derived_fct_energy_kcal', 'derived_fct_carb_g', 'derived_fct_protein_g', 'derived_fct_fat_g',
        'energy_discrepancy_pct', 'carb_discrepancy_pct', 'protein_discrepancy_pct',
        'discrepancy_status', 'authority_distinction'
    ]
    for col in port_required_cols:
        assert_test(col in df_port.columns, f"Portion ref column exists: {col}")

    # Row 1: Chapati
    chap = df_port[df_port['portion_id'] == 'PK_PORTION_001'].iloc[0]
    assert_test(float(chap['guideline_raw_weight_g']) == 60.0, "Chapati guideline_raw_weight_g == 60.0")
    assert_test(float(chap['derived_assumed_raw_weight_g']) == 60.0, "Chapati derived_assumed_raw_weight_g == 60.0")
    assert_test(float(chap['source_cooked_weight_g']) == 80.0, "Chapati source_cooked_weight_g == 80.0")
    assert_test(float(chap['guideline_exchange_energy_kcal']) == 160.0, "Chapati guideline_exchange_energy_kcal == 160.0")
    assert_test(float(chap['derived_fct_energy_kcal']) == 214.2, "Chapati derived_fct_energy_kcal == 214.2")

    # Row 2: Boiled Rice
    rice = df_port[df_port['portion_id'] == 'PK_PORTION_002'].iloc[0]
    assert_test(pd.isna(rice['guideline_raw_weight_g']), "Boiled rice guideline_raw_weight_g is NULL/NaN")
    assert_test(float(rice['derived_assumed_raw_weight_g']) == 30.0, "Boiled rice derived_assumed_raw_weight_g == 30.0")
    assert_test(float(rice['source_cooked_weight_g']) == 75.0, "Boiled rice source_cooked_weight_g == 75.0")
    assert_test(float(rice['guideline_exchange_energy_kcal']) == 160.0, "Boiled rice guideline_exchange_energy_kcal == 160.0")
    assert_test(float(rice['derived_fct_energy_kcal']) == 108.0, "Boiled rice derived_fct_energy_kcal == 108.0")

    # -------------------------------------------------------------
    # 6. Neutrality & Zero Banned Clinical Words
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 6: Nutritional Neutrality & Zero Disease Claims ---")
    banned_words = [
        "pcos", "hypogonadism", "testosterone", "hormone", "insulin-sensitizing",
        "therapeutic", "disease-specific", "pcos-friendly", "testosterone-boosting"
    ]
    for name, df in [("portions", df_port), ("gastronomy", df_gastro), ("components", df_comp), ("candidates", df_cand)]:
        text_data = df.astype(str).values.flatten()
        found_banned = []
        for word in banned_words:
            for cell in text_data:
                if word in cell.lower():
                    found_banned.append((word, cell[:60]))
        assert_test(len(found_banned) == 0, f"0 banned clinical claims in {name} dataset (found: {len(found_banned)})")

    # -------------------------------------------------------------
    # 7. PyMuPDF Script Compliance
    # -------------------------------------------------------------
    print("\n--- TEST GROUP 7: PyMuPDF Script Compliance ---")
    banned_pattern = "import " + "fitz"
    script_files = glob.glob("Meal/scripts/*.py")
    violations = []
    for sf in script_files:
        if os.path.basename(sf) == "validate_phase4_library.py":
            continue
        with open(sf, "r", encoding="utf-8", errors="ignore") as f:
            for line_no, line in enumerate(f, 1):
                if banned_pattern in line:
                    violations.append(f"{sf}:{line_no}")
    assert_test(len(violations) == 0, f"0 scripts use deprecated legacy fitz import (found: {violations})")

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    print(f"PHASE 4A VALIDATION SUMMARY: {passed_tests} / {total_tests} TESTS PASSED")
    print("=" * 65)

if __name__ == "__main__":
    run_phase4_validation()
