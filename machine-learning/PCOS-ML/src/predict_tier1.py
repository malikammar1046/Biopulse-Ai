"""
OvaSense ML Pipeline - Interactive Manual Prediction Tool for Tier 1
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

Interactive terminal tool to evaluate a patient's self-reported Tier 1 features
using the locked Extra Trees + Platt Sigmoid calibrated screening model.

DO NOT RETRAIN OR ALTER THE MODEL.
"""

import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import joblib
import numpy as np
import pandas as pd
import shap

from src.models import TIER1_NUMERIC_COLS, TIER1_BINARY_COLS

MODEL_PATH = 'models/tier1/tier1_selected_model.joblib'
SCREENING_THRESHOLD = 0.25  # Pre-fixed in development CV for Sensitivity >= 0.85
DEFAULT_THRESHOLD = 0.50

def load_tier1_model():
    """Loads the serialized calibrated Tier 1 model."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Ensure Tier 1 training is completed.")
    model = joblib.load(MODEL_PATH)
    return model

def prompt_float(prompt_text, min_val, max_val):
    """Prompts the user for a floating-point number within [min_val, max_val]."""
    while True:
        raw = input(prompt_text).strip()
        try:
            val = float(raw)
            if min_val <= val <= max_val:
                return val
            else:
                print(f"  [!] Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("  [!] Invalid numeric format. Please enter a valid number.")

def prompt_int(prompt_text, min_val, max_val):
    """Prompts the user for an integer within [min_val, max_val]."""
    while True:
        raw = input(prompt_text).strip()
        try:
            val = int(raw)
            if min_val <= val <= max_val:
                return val
            else:
                print(f"  [!] Please enter an integer between {min_val} and {max_val}.")
        except ValueError:
            print("  [!] Invalid integer format. Please enter a valid integer.")

def prompt_binary(prompt_text):
    """
    Prompts the user for a binary yes/no feature.
    Accepts: yes, y, 1, true / no, n, 0, false.
    Returns: 1 for Yes, 0 for No.
    """
    yes_set = {'yes', 'y', '1', 'true', 't'}
    no_set = {'no', 'n', '0', 'false', 'f'}
    
    while True:
        raw = input(prompt_text).strip().lower()
        if raw in yes_set:
            return 1
        elif raw in no_set:
            return 0
        else:
            print("  [!] Invalid choice. Please enter 'y' / 'yes' / '1' or 'n' / 'no' / '0'.")

def prompt_cycle_regularity(prompt_text):
    """
    Prompts the user for menstrual cycle regularity.
    In the training data:
      2 = Regular
      4 = Irregular
    Accepts: regular, reg, r, 2, no (not irregular) -> 2
             irregular, irreg, i, 4, yes (irregular) -> 4
    Returns: 2 or 4.
    """
    reg_set = {'regular', 'reg', 'r', '2'}
    irreg_set = {'irregular', 'irreg', 'i', '4', 'yes', 'y', '1'}
    
    while True:
        raw = input(prompt_text).strip().lower()
        if raw in reg_set:
            return 2
        elif raw in irreg_set:
            return 4
        else:
            print("  [!] Invalid choice. Please enter 'Regular' (r / 2) or 'Irregular' (i / 4).")

def collect_patient_input():
    """Collects patient self-reported Tier 1 inputs through the CLI."""
    print("\n" + "-" * 55)
    print("ENTER PATIENT TIER 1 SELF-REPORTED INFORMATION:")
    print("-" * 55)
    
    # Demographics & Anthropometrics
    age = prompt_int("1. Age (years) [12 - 60]: ", 12, 60)
    weight_kg = prompt_float("2. Weight (kg) [25.0 - 250.0]: ", 25.0, 250.0)
    height_cm = prompt_float("3. Height (cm) [110.0 - 220.0]: ", 110.0, 220.0)
    waist_inch = prompt_float("4. Waist Circumference (inches) [18.0 - 70.0]: ", 18.0, 70.0)
    hip_inch = prompt_float("5. Hip Circumference (inches) [20.0 - 80.0]: ", 20.0, 80.0)
    
    # Deterministic derived features calculated internally using training pipeline logic
    bmi = weight_kg / ((height_cm / 100.0) ** 2)
    whr = waist_inch / hip_inch
    
    # Menstrual tracking
    cycle_reg = prompt_cycle_regularity("6. Cycle Regularity [Regular (r/2) / Irregular (i/4)]: ")
    cycle_len = prompt_int("7. Cycle Length (bleeding duration in days) [2 - 15]: ", 2, 15)
    
    # Symptoms & Lifestyle
    print("\nClinical Symptoms & Lifestyle Habits (Yes/No):")
    weight_gain = prompt_binary("8. Rapid/Unexplained Weight Gain? [y/n]: ")
    hirsutism = prompt_binary("9. Hirsutism (excess facial/body hair)? [y/n]: ")
    skin_darkening = prompt_binary("10. Skin Darkening (Acanthosis Nigricans)? [y/n]: ")
    hair_loss = prompt_binary("11. Hair Loss / Hair Thinning? [y/n]: ")
    pimples_acne = prompt_binary("12. Persistent Pimples / Acne? [y/n]: ")
    fast_food = prompt_binary("13. Frequent Fast Food / Processed Diet? [y/n]: ")
    regular_exercise = prompt_binary("14. Regular Physical Exercise? [y/n]: ")
    
    data_dict = {
        'age': age,
        'weight_kg': weight_kg,
        'height_cm': height_cm,
        'bmi': bmi,
        'cycle_regularity': cycle_reg,
        'cycle_length_raw': cycle_len,
        'hip_inch': hip_inch,
        'waist_inch': waist_inch,
        'waist_hip_ratio': whr,
        'weight_gain': weight_gain,
        'hirsutism': hirsutism,
        'skin_darkening': skin_darkening,
        'hair_loss': hair_loss,
        'pimples_acne': pimples_acne,
        'fast_food': fast_food,
        'regular_exercise': regular_exercise
    }
    
    df_patient = pd.DataFrame([data_dict])
    # Ensure exact column order expected by the pipeline
    col_order = [
        'age', 'weight_kg', 'height_cm', 'bmi', 'cycle_regularity',
        'cycle_length_raw', 'hip_inch', 'waist_inch', 'waist_hip_ratio',
        'weight_gain', 'hirsutism', 'skin_darkening', 'hair_loss',
        'pimples_acne', 'fast_food', 'regular_exercise'
    ]
    df_patient = df_patient[col_order]
    
    return df_patient, data_dict

def explain_prediction_shap(model, df_patient):
    """
    Extracts individual SHAP attributions using the underlying Extra Trees classifier.
    Returns the top 4 model-attributed factors.
    """
    try:
        # For CalibratedClassifierCV, extract underlying estimator and preprocessor
        base_pipe = model.calibrated_classifiers_[0].estimator
        preprocessor = base_pipe['preprocessor']
        classifier = base_pipe['classifier']
        
        X_trans = preprocessor.transform(df_patient)
        feature_names = TIER1_NUMERIC_COLS + TIER1_BINARY_COLS
        
        explainer = shap.TreeExplainer(classifier)
        shap_values = explainer.shap_values(X_trans)
        
        # Binary classification output format
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        else:
            sv = shap_values[0]
            
        factors = []
        for feat, val in zip(feature_names, sv):
            direction = "increases risk assessment" if val > 0 else "decreases risk assessment"
            factors.append((feat, float(val), direction))
            
        # Sort by absolute SHAP attribution
        factors_sorted = sorted(factors, key=lambda x: abs(x[1]), reverse=True)
        return factors_sorted[:4]
    except Exception as e:
        return []

def display_assessment(df_patient, data_dict, model):
    """Generates prediction and displays clean clinical summary."""
    # Predict calibrated probability
    probs = model.predict_proba(df_patient)[0]
    prob_pcos = float(probs[1])
    prob_percent = prob_pcos * 100.0
    
    # Categorize risk according to pre-fixed screening threshold (0.25) and standard threshold (0.50)
    if prob_pcos >= DEFAULT_THRESHOLD:
        assessment_category = "ELEVATED LIKELIHOOD (Screening Positive & High Confidence)"
        screening_triage = "REFERRAL RECOMMENDED: Prompt medical consultation for clinical & pelvic ultrasound workup."
    elif prob_pcos >= SCREENING_THRESHOLD:
        assessment_category = "MODERATE LIKELIHOOD (Screening Threshold Met for Sensitivity >= 85%)"
        screening_triage = "EVALUATION ADVISABLE: Tier 1 risk flags met. Consider confirmatory clinical/laboratory testing."
    else:
        assessment_category = "LOW LIKELIHOOD (Below Screening Threshold)"
        screening_triage = "ROUTINE MONITORING: Tier 1 symptom profile does not indicate elevated PCOS risk."
        
    cycle_str = "Regular" if data_dict['cycle_regularity'] == 2 else "Irregular"
    
    print("\n" + "=" * 60)
    print("           OVASENSE TIER 1 RISK ASSESSMENT")
    print("=" * 60)
    
    print("\n## INPUT SUMMARY")
    print(f"  Age:                 {data_dict['age']} years")
    print(f"  Weight:              {data_dict['weight_kg']:.1f} kg")
    print(f"  Height:              {data_dict['height_cm']:.1f} cm")
    print(f"  BMI (Calculated):    {data_dict['bmi']:.2f} kg/m²")
    print(f"  Waist Circumference: {data_dict['waist_inch']:.1f} inches")
    print(f"  Hip Circumference:   {data_dict['hip_inch']:.1f} inches")
    print(f"  Waist-Hip Ratio:     {data_dict['waist_hip_ratio']:.2f}")
    print(f"  Cycle Regularity:    {cycle_str}")
    print(f"  Cycle Length:        {data_dict['cycle_length_raw']} days (menses duration)")
    print(f"  Weight Gain:         {'Yes' if data_dict['weight_gain'] == 1 else 'No'}")
    print(f"  Hirsutism:           {'Yes' if data_dict['hirsutism'] == 1 else 'No'}")
    print(f"  Skin Darkening:      {'Yes' if data_dict['skin_darkening'] == 1 else 'No'}")
    print(f"  Hair Loss:           {'Yes' if data_dict['hair_loss'] == 1 else 'No'}")
    print(f"  Pimples/Acne:        {'Yes' if data_dict['pimples_acne'] == 1 else 'No'}")
    print(f"  Fast Food Intake:    {'Yes' if data_dict['fast_food'] == 1 else 'No'}")
    print(f"  Regular Exercise:    {'Yes' if data_dict['regular_exercise'] == 1 else 'No'}")
    
    print("\n" + "-" * 60)
    print("## MODEL SCREENING RESULT")
    print("-" * 60)
    print(f"  Model-Assessed Likelihood: {prob_percent:.2f}%")
    print(f"  Assessment Category:       {assessment_category}")
    print(f"  Screening Threshold Used:  tau* = {SCREENING_THRESHOLD:.2f} (Locked for Sens >= 85%)")
    print(f"  Triage Guideline:          {screening_triage}")
    
    # SHAP Explainability
    shap_factors = explain_prediction_shap(model, df_patient)
    if shap_factors:
        print("\n## TOP MODEL-ATTRIBUTED FACTORS (SHAP Attribution)")
        for rank, (feat, val, direction) in enumerate(shap_factors, start=1):
            clean_feat = feat.replace('_', ' ').title()
            print(f"  {rank}. {clean_feat:20s}: {val:+.4f} ({direction})")
        print("\n  *Note: Factors indicate mathematical model attribution within this cohort, NOT biological causation.")
        
    print("\n" + "=" * 60)
    print("IMPORTANT MEDICAL NOTICE:")
    print("This assessment is an AI-assisted statistical risk estimation based")
    print("exclusively on Tier 1 self-reported information.")
    print("It is NOT a medical diagnosis. Definitive PCOS diagnosis requires")
    print("physician clinical evaluation and pelvic ultrasonography.")
    print("=" * 60 + "\n")

def main():
    print("=" * 60)
    print("  OvaSense PCOS ML — Tier 1 Interactive Assessment CLI")
    print("  Model: Extra Trees + Platt Sigmoid (Calibrated)")
    print("=" * 60)
    
    try:
        model = load_tier1_model()
        print(f"[+] Loaded model artifact from: {MODEL_PATH}")
    except Exception as e:
        print(f"[!] Error loading model: {e}")
        return
        
    while True:
        print("\nMain Menu:")
        print("  1. Test manual patient profile")
        print("  2. Exit")
        choice = input("Select an option (1-2): ").strip()
        
        if choice == '1':
            while True:
                df_patient, data_dict = collect_patient_input()
                display_assessment(df_patient, data_dict, model)
                
                # Follow-up prompt
                again = input("Test another patient? (y/n): ").strip().lower()
                if again not in {'y', 'yes', '1'}:
                    print("\nReturning to main menu...")
                    break
        elif choice == '2' or choice.lower() in {'exit', 'quit', 'q'}:
            print("\nExiting OvaSense Tier 1 Prediction Tool. Good-bye!\n")
            break
        else:
            print("Invalid option. Please choose 1 or 2.")

if __name__ == '__main__':
    main()
