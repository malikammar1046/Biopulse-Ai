"""
OvaSense ML Pipeline - Preprocessing & Tier Dataset Generation Engine
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

This module implements reproducible cleaning, typing, and progressive dataset tiering.
Raw data files are never modified.
"""

import os
import sys
sys.path.insert(0, os.path.abspath('.'))

import pandas as pd
import numpy as np
from src.tier_classifier import COLUMN_METADATA

def load_raw_data(excel_path='PCOS_data_without_infertility.xlsx'):
    """Load raw clinical dataset from Full_new sheet."""
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Raw dataset not found at {excel_path}")
    df = pd.read_excel(excel_path, sheet_name='Full_new')
    return df

def clean_and_normalize_master(df_raw):
    """
    Cleans typos and normalizes datatypes while preserving complete audit traceability.
    """
    df = df_raw.copy()
    
    # 1. Clean string typos in II beta-HCG
    col_beta2 = 'II    beta-HCG(mIU/mL)'
    if col_beta2 in df.columns:
        df[col_beta2] = df[col_beta2].astype(str).str.strip()
        df[col_beta2] = df[col_beta2].replace({'1.99.': '1.99'})
        df[col_beta2] = pd.to_numeric(df[col_beta2], errors='coerce')
        
    # 2. Clean string typos in AMH ('a' -> NaN)
    col_amh = 'AMH(ng/mL)'
    if col_amh in df.columns:
        df[col_amh] = pd.to_numeric(df[col_amh], errors='coerce')
        
    # 3. Handle known extreme data-entry typos in vitals and labs:
    # Row 161: BP Systolic 12 -> 120 (missing trailing zero)
    col_bps = 'BP _Systolic (mmHg)'
    if col_bps in df.columns:
        df[col_bps] = pd.to_numeric(df[col_bps], errors='coerce')
        df.loc[df[col_bps] == 12, col_bps] = 120.0
        
    # Row 200: BP Diastolic 8 -> 80 (missing trailing zero)
    col_bpd = 'BP _Diastolic (mmHg)'
    if col_bpd in df.columns:
        df[col_bpd] = pd.to_numeric(df[col_bpd], errors='coerce')
        df.loc[df[col_bpd] == 8, col_bpd] = 80.0
        
    # Non-physiological vital entries (Pulse 13, 18 bpm) -> NaN for imputer
    col_pulse = 'Pulse rate(bpm) '
    if col_pulse in df.columns:
        df[col_pulse] = pd.to_numeric(df[col_pulse], errors='coerce')
        df.loc[df[col_pulse] <= 30, col_pulse] = np.nan
        
    # Extreme lab data entry errors -> NaN for imputer
    # FSH 5052 (row 329) -> NaN
    col_fsh = 'FSH(mIU/mL)'
    if col_fsh in df.columns:
        df[col_fsh] = pd.to_numeric(df[col_fsh], errors='coerce')
        df.loc[df[col_fsh] > 1000, col_fsh] = np.nan
        
    # LH 2018 (row 455) -> NaN
    col_lh = 'LH(mIU/mL)'
    if col_lh in df.columns:
        df[col_lh] = pd.to_numeric(df[col_lh], errors='coerce')
        df.loc[df[col_lh] > 1000, col_lh] = np.nan
        
    # Recalculate FSH/LH where FSH or LH was cleaned
    col_ratio = 'FSH/LH'
    if col_ratio in df.columns:
        df[col_ratio] = pd.to_numeric(df[col_ratio], errors='coerce')
        mask_recalc = df[col_fsh].isna() | df[col_lh].isna()
        df.loc[mask_recalc, col_ratio] = np.nan
        
    # Vit D3 > 5000 (rows 191, 195) -> NaN
    col_vitd = 'Vit D3 (ng/mL)'
    if col_vitd in df.columns:
        df[col_vitd] = pd.to_numeric(df[col_vitd], errors='coerce')
        df.loc[df[col_vitd] > 1000, col_vitd] = np.nan
        
    # 4. Deterministically recompute derived anthropometrics (BMI, WHR) from cleaned source variables
    col_weight = 'Weight (Kg)'
    col_height = 'Height(Cm) '
    col_bmi = 'BMI'
    if col_weight in df.columns and col_height in df.columns and col_bmi in df.columns:
        df[col_weight] = pd.to_numeric(df[col_weight], errors='coerce')
        df[col_height] = pd.to_numeric(df[col_height], errors='coerce')
        df[col_bmi] = df[col_weight] / ((df[col_height] / 100.0) ** 2)

    col_waist = 'Waist(inch)'
    col_hip = 'Hip(inch)'
    col_whr = 'Waist:Hip Ratio'
    if col_waist in df.columns and col_hip in df.columns and col_whr in df.columns:
        df[col_waist] = pd.to_numeric(df[col_waist], errors='coerce')
        df[col_hip] = pd.to_numeric(df[col_hip], errors='coerce')
        df[col_whr] = df[col_waist] / df[col_hip]

    # 5. Standardize column names
    rename_dict = {raw: meta['clean_name'] for raw, meta in COLUMN_METADATA.items() if raw in df.columns}
    df_cleaned = df.rename(columns=rename_dict)
    
    return df_cleaned

def generate_tiered_datasets(output_dir='data/tiered', master_dir='data/processed'):
    """
    Generates isolated Tier 1, Tier 2, and Tier 3 Reference datasets.
    """
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(master_dir, exist_ok=True)
    
    df_raw = load_raw_data()
    df_master = clean_and_normalize_master(df_raw)
    
    # Save master cleaned dataset
    master_path = os.path.join(master_dir, 'pcos_cleaned_master.csv')
    df_master.to_csv(master_path, index=False)
    print(f"Saved master cleaned dataset: {master_path} ({df_master.shape[0]} rows x {df_master.shape[1]} cols)")
    
    # 1. Tier 1 Core Feature Set (16 non-invasive features + target)
    tier1_core_cols = [
        'age', 'weight_kg', 'height_cm', 'bmi', 'cycle_regularity',
        'cycle_length_raw', 'hip_inch', 'waist_inch', 'waist_hip_ratio',
        'weight_gain', 'hirsutism', 'skin_darkening', 'hair_loss',
        'pimples_acne', 'fast_food', 'regular_exercise', 'pcos_diagnosis'
    ]
    df_tier1 = df_master[tier1_core_cols].copy()
    tier1_path = os.path.join(output_dir, 'tier1_dataset.csv')
    df_tier1.to_csv(tier1_path, index=False)
    print(f"Saved Tier 1 Core Dataset: {tier1_path} ({df_tier1.shape[0]} rows x {df_tier1.shape[1]} cols)")
    
    # Tier 1 Extended (includes 3 reproductive features for sensitivity analysis)
    tier1_ext_cols = tier1_core_cols[:-1] + ['marriage_years', 'pregnant', 'abortions_count', 'pcos_diagnosis']
    df_tier1_ext = df_master[tier1_ext_cols].copy()
    tier1_ext_path = os.path.join(output_dir, 'tier1_extended_dataset.csv')
    df_tier1_ext.to_csv(tier1_ext_path, index=False)
    print(f"Saved Tier 1 Extended Dataset: {tier1_ext_path} ({df_tier1_ext.shape[0]} rows x {df_tier1_ext.shape[1]} cols)")
    
    # 2. Tier 2 Core Feature Set (Tier 1 Core + 15 Clinical/Lab features + target = 32 cols)
    tier2_lab_cols = [
        'pulse_rate_bpm', 'respiratory_rate', 'hemoglobin',
        'beta_hcg_i', 'beta_hcg_ii', 'fsh', 'lh', 'fsh_lh_ratio',
        'tsh', 'amh', 'prolactin', 'vitamin_d3', 'progesterone', 'rbs',
        'bp_systolic', 'bp_diastolic'
    ]
    tier2_cols = tier1_core_cols[:-1] + tier2_lab_cols + ['pcos_diagnosis']
    df_tier2 = df_master[tier2_cols].copy()
    tier2_path = os.path.join(output_dir, 'tier2_dataset.csv')
    df_tier2.to_csv(tier2_path, index=False)
    print(f"Saved Tier 2 Progressive Dataset: {tier2_path} ({df_tier2.shape[0]} rows x {df_tier2.shape[1]} cols)")
    
    # 3. Tier 3 Structured Reference (Tier 1 + Tier 2 + 5 Ultrasound Measurements + target = 37 cols)
    tier3_us_cols = [
        'follicle_no_l', 'follicle_no_r', 'avg_f_size_l', 'avg_f_size_r', 'endometrium_mm'
    ]
    tier3_cols = tier2_cols[:-1] + tier3_us_cols + ['pcos_diagnosis']
    df_tier3 = df_master[tier3_cols].copy()
    tier3_path = os.path.join(output_dir, 'tier3_structured_reference.csv')
    df_tier3.to_csv(tier3_path, index=False)
    print(f"Saved Tier 3 Structured Reference: {tier3_path} ({df_tier3.shape[0]} rows x {df_tier3.shape[1]} cols)")

if __name__ == '__main__':
    generate_tiered_datasets()
