"""
OvaSense ML Pipeline - Automated Pipeline Verification Script
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

Validates dataset dimensions, strict tier isolation, zero leakage,
and preservation of raw file hashes.
"""

import os
import hashlib
import pandas as pd

EXPECTED_HASHES = {
    'PCOS_data_without_infertility.xlsx': 'b663ec9f491be419718e0935eb1c5b6c4923b527282230a73cfc9aca8533f742',
    'PCOS_infertility.csv': '2e4f06b6dc68450c0e05d7a433dabd4ff50ad2edb7e9302d6103449a95b63ad3'
}

def verify_raw_integrity():
    for fname, exp_hash in EXPECTED_HASHES.items():
        if not os.path.exists(fname):
            raise FileNotFoundError(f"Missing raw file: {fname}")
        with open(fname, 'rb') as f:
            curr_hash = hashlib.sha256(f.read()).hexdigest()
        assert curr_hash == exp_hash, f"Integrity check failed for {fname}! Hash mismatch."
    print("[PASS] Raw files hash verification: 100% untouched.")

def verify_tiered_datasets():
    t1_path = 'data/tiered/tier1_dataset.csv'
    t2_path = 'data/tiered/tier2_dataset.csv'
    t3_path = 'data/tiered/tier3_structured_reference.csv'
    
    for p in [t1_path, t2_path, t3_path]:
        assert os.path.exists(p), f"Missing dataset: {p}"
        
    df1 = pd.read_csv(t1_path)
    df2 = pd.read_csv(t2_path)
    df3 = pd.read_csv(t3_path)
    
    # 1. Row count check
    assert len(df1) == 541, f"Tier 1 row count error: {len(df1)}"
    assert len(df2) == 541, f"Tier 2 row count error: {len(df2)}"
    assert len(df3) == 541, f"Tier 3 row count error: {len(df3)}"
    print("[PASS] Row count check: Exactly 541 rows in all datasets.")
    
    # 2. Target check
    target = 'pcos_diagnosis'
    for name, df in [('Tier 1', df1), ('Tier 2', df2), ('Tier 3', df3)]:
        assert target in df.columns, f"Target '{target}' missing in {name}!"
        counts = df[target].value_counts()
        assert counts.get(0) == 364, f"Class 0 count mismatch in {name}!"
        assert counts.get(1) == 177, f"Class 1 count mismatch in {name}!"
    print("[PASS] Target check: Class 0 = 364 (67.28%), Class 1 = 177 (32.72%) preserved.")
    
    # 3. ID and Artifact Exclusion check
    forbidden = ['sl_no', 'patient_file_no', 'unnamed_44', 'Sl. No', 'Patient File No.', 'Unnamed: 44']
    for name, df in [('Tier 1', df1), ('Tier 2', df2), ('Tier 3', df3)]:
        for col in forbidden:
            assert col not in df.columns, f"Forbidden ID/Artifact '{col}' found in {name}!"
    print("[PASS] Exclusion check: IDs and artifacts completely excluded from all feature sets.")
    
    # 4. Strict Tier 1 Isolation check
    lab_cols = [
        'pulse_rate_bpm', 'respiratory_rate', 'hemoglobin', 'beta_hcg_i', 'beta_hcg_ii',
        'fsh', 'lh', 'fsh_lh_ratio', 'tsh', 'amh', 'prolactin', 'vitamin_d3',
        'progesterone', 'rbs', 'bp_systolic', 'bp_diastolic'
    ]
    us_cols = ['follicle_no_l', 'follicle_no_r', 'avg_f_size_l', 'avg_f_size_r', 'endometrium_mm']
    
    for col in lab_cols + us_cols:
        assert col not in df1.columns, f"Tier 1 Isolation breach! Clinical/Lab column '{col}' found in Tier 1."
    print("[PASS] Tier 1 Isolation check: Zero clinical/lab or ultrasound features present in Tier 1.")
    
    # 5. Progressive Tier 2 check
    t1_features = [c for c in df1.columns if c != target]
    for col in t1_features:
        assert col in df2.columns, f"Progressive Architecture breach! Tier 1 feature '{col}' missing in Tier 2."
    for col in us_cols:
        assert col not in df2.columns, f"Tier 2 Isolation breach! Ultrasound column '{col}' found in Tier 2."
    print(f"[PASS] Progressive Tier 2 check: All {len(t1_features)} Tier 1 features included in Tier 2; ultrasound excluded.")
    
    # 6. Column counts
    print(f"\nFinal Verified Column Counts:")
    print(f"  - Tier 1 Core: {df1.shape[1]-1} features + 1 target = {df1.shape[1]} columns")
    print(f"  - Tier 2 Core: {df2.shape[1]-1} features + 1 target = {df2.shape[1]} columns")
    print(f"  - Tier 3 Structured Ref: {df3.shape[1]-1} features + 1 target = {df3.shape[1]} columns")
    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY.")

if __name__ == '__main__':
    verify_raw_integrity()
    verify_tiered_datasets()
