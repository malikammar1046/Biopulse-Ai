"""
Data Loader and Preprocessing Module for Male Testosterone Deficiency Model.
Loads ptestost.xlsx, audits for duplicates, validates ranges, and performs stratified splitting.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

FEATURE_NAMES = ["Age", "DM", "TG", "HT", "HDL", "AC"]
TARGET_NAME = "T"

CLINICAL_BOUNDS = {
    "Age": (45, 85),
    "AC": (40.0, 200.0),    # Abdominal / Waist Circumference in cm
    "TG": (10.0, 1000.0),   # Triglycerides in mg/dL
    "HDL": (10.0, 150.0),   # HDL Cholesterol in mg/dL
    "DM": (0, 1),           # Diabetes Mellitus binary
    "HT": (0, 1)            # Hypertension binary
}

def load_and_preprocess_data(file_path: str, test_size: float = 0.20, random_state: int = 42):
    """
    Loads ptestost.xlsx, drops exact duplicates, validates clinical ranges,
    and returns stratified train/test sets and fitted scaler.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset not found at {file_path}")
        
    df_raw = pd.read_excel(file_path, engine='openpyxl')
    initial_rows = len(df_raw)
    
    # Prune exact duplicates
    df = df_raw.drop_duplicates().copy()
    duplicates_removed = initial_rows - len(df)
    
    # Check for missing values
    assert df.isnull().sum().sum() == 0, "Unexpected null values detected in dataset"
    
    # Verify features and target
    for col in FEATURE_NAMES:
        assert col in df.columns, f"Missing required feature: {col}"
    assert TARGET_NAME in df.columns, f"Missing target: {TARGET_NAME}"
    
    # Validate clinical ranges
    for col, (min_val, max_val) in CLINICAL_BOUNDS.items():
        out_of_bounds = ((df[col] < min_val) | (df[col] > max_val)).sum()
        if out_of_bounds > 0:
            print(f"Warning: {out_of_bounds} values outside typical bounds for {col} ({min_val}-{max_val})")
            
    X = df[FEATURE_NAMES].copy()
    y = df[TARGET_NAME].astype(int).values
    
    # Stratified Train/Test split to preserve the 19.3% positive class ratio
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )
    
    # Fit scaler strictly on X_train to prevent data leakage
    scaler = StandardScaler()
    scaler.fit(X_train)
    
    X_train_scaled = pd.DataFrame(scaler.transform(X_train), columns=FEATURE_NAMES, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=FEATURE_NAMES, index=X_test.index)
    
    metadata = {
        "initial_rows": initial_rows,
        "clean_rows": len(df),
        "duplicates_removed": duplicates_removed,
        "features": FEATURE_NAMES,
        "target": TARGET_NAME,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_positives": int(y_train.sum()),
        "train_prevalence": float(y_train.mean()),
        "test_positives": int(y_test.sum()),
        "test_prevalence": float(y_test.mean())
    }
    
    return {
        "X_train": X_train,
        "X_test": X_test,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler,
        "metadata": metadata,
        "df_clean": df
    }
