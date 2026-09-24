"""
OvaSense ML Pipeline - Data Audit Script
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

Audits the raw Excel file (PCOS_data_without_infertility.xlsx) and CSV (PCOS_infertility.csv),
verifying raw file integrity, shapes, types, missing values, and target distribution.
"""

import os
import hashlib
import pandas as pd
import numpy as np

def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def run_audit():
    excel_path = 'PCOS_data_without_infertility.xlsx'
    csv_path = 'PCOS_infertility.csv'
    
    print("="*60)
    print("OVASENSE RAW DATA AUDIT")
    print("="*60)
    
    # 1. Hashes
    h_excel = compute_sha256(excel_path)
    h_csv = compute_sha256(csv_path)
    print(f"File: {excel_path} (SHA256: {h_excel})")
    print(f"File: {csv_path} (SHA256: {h_csv})")
    
    # 2. Sheets
    xl = pd.ExcelFile(excel_path)
    print(f"\nExcel Sheets: {xl.sheet_names}")
    
    df_full = pd.read_excel(excel_path, sheet_name='Full_new')
    df_csv = pd.read_csv(csv_path)
    
    print(f"\nSheet 'Full_new' dimensions: {df_full.shape[0]} rows x {df_full.shape[1]} columns")
    print(f"CSV dimensions: {df_csv.shape[0]} rows x {df_csv.shape[1]} columns")
    
    # 3. Target Distribution
    target = 'PCOS (Y/N)'
    print(f"\nTarget column: '{target}'")
    counts = df_full[target].value_counts()
    print(f"Class 0 (Negative): {counts.get(0, 0)} ({counts.get(0, 0)/len(df_full)*100:.2f}%)")
    print(f"Class 1 (Positive): {counts.get(1, 0)} ({counts.get(1, 0)/len(df_full)*100:.2f}%)")
    print(f"Target nulls: {df_full[target].isna().sum()}")
    
    # 4. Patient Uniqueness
    sl_unique = df_full['Sl. No'].nunique()
    pf_unique = df_full['Patient File No.'].nunique()
    print(f"\nSl. No uniqueness: {sl_unique}/{len(df_full)}")
    print(f"Patient File No. uniqueness: {pf_unique}/{len(df_full)}")
    print(f"Exact duplicates (all 45 cols): {df_full.duplicated().sum()}")
    print(f"Duplicates excluding IDs: {df_full.drop(columns=['Sl. No', 'Patient File No.']).duplicated().sum()}")
    
    # 5. Missing values
    null_counts = df_full.isna().sum()
    print(f"\nColumns with missing values:")
    for col, cnt in null_counts[null_counts > 0].items():
        print(f"  - {col}: {cnt} missing ({cnt/len(df_full)*100:.2f}%)")
        
    print("\nAudit completed successfully. Raw files are strictly read-only.")

if __name__ == '__main__':
    run_audit()
