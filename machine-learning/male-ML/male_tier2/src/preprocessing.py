"""
preprocessing.py
----------------
Data partitioning, feature isolation, and preprocessor definitions for Male Tier 2.
Strictly excludes Total Testosterone and Calculated Free Testosterone from feature inputs
to guarantee zero target leakage.
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "processed", "male_tier2_nhanes_19_60.csv"
)

# Feature list: Laboratory and hormonal predictors strictly excluding Total Testosterone
FEATURE_COLS = [
    "age",
    "shbg_nmol_l",
    "estradiol_pg_ml",
    "albumin_g_dl",
    "hba1c_pct",
    "glucose_mg_dl",
    "hemoglobin_g_dl",
    "hematocrit_pct",
    "rbc_count",
    "alt_u_l",
    "ast_u_l",
    "total_bilirubin_mg_dl",
    "creatinine_mg_dl",
    "bun_mg_dl",
    "uric_acid_mg_dl",
    "hdl_mg_dl"
]

TARGET_COL = "low_total_testosterone"


def load_tier2_data(test_size: float = 0.20, random_state: int = 42):
    """
    Loads processed Tier 2 dataset, verifies age [19, 60],
    and produces stratified train and test partitions.
    """
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Processed dataset not found at {DATA_PATH}. Run data_loader.py first.")
        
    df = pd.read_csv(DATA_PATH)
    
    # Assert age constraint [19, 60]
    assert df["age"].min() >= 19.0 and df["age"].max() <= 60.0, "Age violation in dataset!"
    
    # Assert zero target leakage
    assert "total_testosterone_ng_dl" not in FEATURE_COLS, "Target leakage detected: Total T in features!"
    assert "calculated_free_t_ng_dl" not in FEATURE_COLS, "Target leakage detected: Free T in features!"
    assert "LBXTST" not in FEATURE_COLS, "Target leakage detected: LBXTST in features!"
    
    X = df[FEATURE_COLS].copy()
    y = df[TARGET_COL].astype(int).values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )
    
    return df, X_train, X_test, y_train, y_test, FEATURE_COLS


def build_preprocessor():
    """Builds median imputer and standard scaler pipeline."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])


if __name__ == "__main__":
    df, X_train, X_test, y_train, y_test, features = load_tier2_data()
    print(f"Loaded Tier 2 Data: {len(df)} total rows.")
    print(f"Train split: {len(X_train)} samples ({np.mean(y_train)*100:.1f}% low-T)")
    print(f"Test split:  {len(X_test)} samples ({np.mean(y_test)*100:.1f}% low-T)")
    print(f"Features ({len(features)}): {features}")
