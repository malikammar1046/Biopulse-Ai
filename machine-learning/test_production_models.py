"""
Production ML Artifact Validation Test Suite
Validates that all production-active model artifacts exist, load cleanly,
match their expected feature signatures, and execute inference without error.
Covers:
- PCOS-ML Tier 1 (16 features)
- PCOS-ML Tier 2 (32 features)
- Male-ML Tier 1 (11 features)
- Male-ML Tier 2 (16 features)
"""

import os
from pathlib import Path
import pytest
import joblib
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent

# 1. PCOS Model Paths
PCOS_DIR = REPO_ROOT / "machine-learning" / "PCOS-ML"
PCOS_T1_PATH = PCOS_DIR / "models" / "tier1" / "tier1_selected_model.joblib"
PCOS_T2_PATH = PCOS_DIR / "models" / "tier2" / "tier2_selected_model.joblib"

# 2. Male Model Paths
MALE_DIR = REPO_ROOT / "machine-learning" / "male-ML"
MALE_T1_PATH = MALE_DIR / "male_tier1" / "artifacts" / "male_low_t_model.joblib"
MALE_T2_PATH = MALE_DIR / "male_tier2" / "artifacts" / "male_tier2_model.joblib"


def test_production_artifacts_exist():
    """Verify all 4 production model artifacts exist at their expected locations."""
    assert PCOS_T1_PATH.exists(), f"Missing PCOS Tier 1 artifact: {PCOS_T1_PATH}"
    assert PCOS_T2_PATH.exists(), f"Missing PCOS Tier 2 artifact: {PCOS_T2_PATH}"
    assert MALE_T1_PATH.exists(), f"Missing Male Tier 1 artifact: {MALE_T1_PATH}"
    assert MALE_T2_PATH.exists(), f"Missing Male Tier 2 artifact: {MALE_T2_PATH}"


def test_pcos_tier1_model_loading_and_inference():
    """Verify PCOS Tier 1 artifact loads, matches 16-feature signature, and executes inference."""
    model = joblib.load(PCOS_T1_PATH)
    assert model is not None

    t1_features = [
        'age', 'weight_kg', 'height_cm', 'bmi', 'cycle_regularity', 'cycle_length_raw',
        'hip_inch', 'waist_inch', 'waist_hip_ratio', 'weight_gain', 'hirsutism',
        'skin_darkening', 'hair_loss', 'pimples_acne', 'fast_food', 'regular_exercise'
    ]
    sample_df = pd.DataFrame([{
        'age': 25.0, 'weight_kg': 60.0, 'height_cm': 160.0, 'bmi': 23.4,
        'cycle_regularity': 0, 'cycle_length_raw': 28.0, 'hip_inch': 37.0,
        'waist_inch': 30.0, 'waist_hip_ratio': 0.81, 'weight_gain': 0,
        'hirsutism': 0, 'skin_darkening': 0, 'hair_loss': 0, 'pimples_acne': 0,
        'fast_food': 0, 'regular_exercise': 1
    }])[t1_features]

    prob = float(model.predict_proba(sample_df)[:, 1][0])
    assert 0.0 <= prob <= 1.0, f"Probability out of range: {prob}"


def test_pcos_tier2_model_loading_and_inference():
    """Verify PCOS Tier 2 artifact loads, matches 32-feature signature, and executes inference."""
    artifact = joblib.load(PCOS_T2_PATH)
    pipeline = artifact['pipeline'] if isinstance(artifact, dict) and 'pipeline' in artifact else artifact
    assert pipeline is not None

    t2_features = [
        'age', 'weight_kg', 'height_cm', 'bmi', 'hip_inch', 'waist_inch', 'waist_hip_ratio',
        'cycle_length_raw', 'cycle_regularity', 'weight_gain', 'hirsutism', 'skin_darkening',
        'hair_loss', 'pimples_acne', 'fast_food', 'regular_exercise', 'pulse_rate_bpm',
        'respiratory_rate', 'hemoglobin', 'beta_hcg_i', 'beta_hcg_ii', 'fsh', 'lh',
        'fsh_lh_ratio', 'tsh', 'amh', 'prolactin', 'vitamin_d3', 'progesterone', 'rbs',
        'bp_systolic', 'bp_diastolic'
    ]
    sample_df = pd.DataFrame([{
        col: 1.0 for col in t2_features
    }])[t2_features]

    prob = float(pipeline.predict_proba(sample_df)[:, 1][0])
    assert 0.0 <= prob <= 1.0, f"Probability out of range: {prob}"


def test_male_tier1_model_loading_and_inference():
    """Verify Male Tier 1 artifact loads, matches 11-feature signature, and executes inference."""
    artifact = joblib.load(MALE_T1_PATH)
    model = artifact["model"] if isinstance(artifact, dict) and "model" in artifact else artifact
    assert model is not None

    m1_features = [
        "age", "height_cm", "weight_kg", "bmi", "waist_cm",
        "low_energy", "sleep_trouble", "low_mood", "low_interest",
        "high_blood_pressure", "diabetes"
    ]
    sample_df = pd.DataFrame([{
        "age": 45.0, "height_cm": 178.0, "weight_kg": 85.0, "bmi": 26.8, "waist_cm": 95.0,
        "low_energy": 1, "sleep_trouble": 1, "low_mood": 0, "low_interest": 1,
        "high_blood_pressure": 1, "diabetes": 0
    }])[m1_features]

    prob = float(model.predict_proba(sample_df)[:, 1][0])
    assert 0.0 <= prob <= 1.0, f"Probability out of range: {prob}"


def test_male_tier2_model_loading_and_inference():
    """Verify Male Tier 2 artifact loads, matches 16-feature signature, and executes inference."""
    artifact = joblib.load(MALE_T2_PATH)
    model = artifact["model"] if isinstance(artifact, dict) and "model" in artifact else artifact
    assert model is not None

    m2_features = [
        "age", "shbg_nmol_l", "estradiol_pg_ml", "albumin_g_dl", "hba1c_pct",
        "glucose_mg_dl", "hemoglobin_g_dl", "hematocrit_pct", "rbc_count",
        "alt_u_l", "ast_u_l", "total_bilirubin_mg_dl", "creatinine_mg_dl",
        "bun_mg_dl", "uric_acid_mg_dl", "hdl_mg_dl"
    ]
    sample_df = pd.DataFrame([{
        "age": 45.0, "shbg_nmol_l": 25.0, "estradiol_pg_ml": 22.0, "albumin_g_dl": 4.5,
        "hba1c_pct": 5.4, "glucose_mg_dl": 95.0, "hemoglobin_g_dl": 15.2,
        "hematocrit_pct": 45.0, "rbc_count": 5.0, "alt_u_l": 25.0, "ast_u_l": 22.0,
        "total_bilirubin_mg_dl": 0.8, "creatinine_mg_dl": 1.0, "bun_mg_dl": 15.0,
        "uric_acid_mg_dl": 5.5, "hdl_mg_dl": 45.0
    }])[m2_features]

    prob = float(model.predict_proba(sample_df)[:, 1][0])
    assert 0.0 <= prob <= 1.0, f"Probability out of range: {prob}"
