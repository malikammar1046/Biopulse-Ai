"""
simulate_dual_model_routing.py
------------------------------
Isolated Offline Simulation Harness for Proposed Dual-Model Tier 1 Architecture.

Verifies:
1. Routing logic between 7-feature primary model and 6-feature fallback model.
2. Separate feature schemas, thresholds, and version identifiers.
3. Explicit validation of missing, out-of-range, and contradictory inputs.
4. Auditability and version tracking in simulated assessment records.
5. Analysis of waist missingness selection bias on NHANES data.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional

MALE_ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_PATH = os.path.join(MALE_ML_DIR, "male_tier1", "data", "processed", "male_tier1_nhanes_19_60.csv")
EXP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ART_7_PATH = os.path.join(EXP_DIR, "artifacts", "male_tier1_7feat_candidate.joblib")
ART_6_PATH = os.path.join(EXP_DIR, "artifacts", "male_tier1_6feat_fallback.joblib")


class DualModelRouter:
    """
    Simulation router implementing the future dual-model Tier 1 contract.
    Does NOT modify or touch active production code.
    """
    def __init__(self, path_7feat: str, path_6feat: str):
        assert os.path.exists(path_7feat), f"7-feat artifact not found at {path_7feat}"
        assert os.path.exists(path_6feat), f"6-feat artifact not found at {path_6feat}"
        
        self.art_7 = joblib.load(path_7feat)
        self.art_6 = joblib.load(path_6feat)
        
        self.model_7 = self.art_7["model"]
        self.model_6 = self.art_6["model"]
        
        self.feats_7 = self.art_7["feature_names"]
        self.feats_6 = self.art_6["feature_names"]
        
        self.thresh_7 = float(self.art_7["screening_threshold"])
        self.thresh_6 = float(self.art_6["screening_threshold"])
        
        self.version_7 = self.art_7.get("model_version", "male_tier1_7feat_v1.0.0_exp")
        self.version_6 = self.art_6.get("model_version", "male_tier1_6feat_v1.0.0_exp")
        
        self.lower_risk_cutoff = 0.10

    def validate_and_route(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes explicit schema validation, routing, inference, and audit record generation.
        """
        # 1. Essential validation: Age (19-60)
        age = raw_input.get("age")
        if age is None or not (19.0 <= float(age) <= 60.0):
            return {
                "status": "ineligible_or_missing_age",
                "message": f"Age must be provided and between 19 and 60 inclusive. Provided: {age}",
                "assessment": None
            }
        age = float(age)

        # 2. Height and Weight
        height = raw_input.get("height_cm")
        weight = raw_input.get("weight_kg")
        bmi_input = raw_input.get("bmi")
        
        if height is not None and not (120.0 <= float(height) <= 230.0):
            return {
                "status": "invalid_height",
                "message": f"Height outside plausible biological range (120-230 cm): {height}",
                "assessment": None
            }
        if weight is not None and not (30.0 <= float(weight) <= 300.0):
            return {
                "status": "invalid_weight",
                "message": f"Weight outside plausible biological range (30-300 kg): {weight}",
                "assessment": None
            }

        # Calculate or validate BMI
        if height is not None and weight is not None and float(height) > 0:
            h_m = float(height) / 100.0
            bmi = round(float(weight) / (h_m ** 2), 2)
        elif bmi_input is not None and (12.0 <= float(bmi_input) <= 80.0):
            bmi = float(bmi_input)
            height = height if height is not None else np.nan
            weight = weight if weight is not None else np.nan
        else:
            return {
                "status": "missing_biometrics",
                "message": "Both height and weight, or valid BMI, must be supplied.",
                "assessment": None
            }

        # 3. Medical History (4-State: confirmed_yes=1, confirmed_no=0, unsure=None, skipped=None)
        hbp_state = raw_input.get("diagnosed_hypertension")
        dm_state = raw_input.get("diagnosed_diabetes")
        
        def parse_condition(val):
            if val in (True, 1, 1.0, "yes", "true"):
                return 1.0
            if val in (False, 0, 0.0, "no", "false"):
                return 0.0
            return np.nan # Unsure or not answered
            
        hbp_val = parse_condition(hbp_state)
        dm_val = parse_condition(dm_state)
        
        # 4. Waist Circumference Validation & Routing
        waist_raw = raw_input.get("waist_cm")
        waist_valid = False
        waist_val = np.nan
        
        warnings = []
        if waist_raw is not None and str(waist_raw).strip() not in ("", "none", "null", "nan"):
            try:
                w_f = float(waist_raw)
                if 50.0 <= w_f <= 200.0:
                    waist_val = w_f
                    waist_valid = True
                else:
                    warnings.append(f"Waist circumference {w_f} cm outside plausible range (50-200 cm); ignored for routing.")
            except (ValueError, TypeError):
                warnings.append(f"Waist circumference value '{waist_raw}' unparseable; ignored.")
                
        # Contradiction check: severe BMI with tiny waist, or vice versa
        if waist_valid:
            if bmi >= 35.0 and waist_val < 75.0:
                warnings.append("Severe adiposity paradox: High BMI (>= 35) with small waist (< 75 cm). Verify measurements.")
            elif bmi < 20.0 and waist_val > 115.0:
                warnings.append("Severe lean paradox: Low BMI (< 20) with very large waist (> 115 cm). Verify measurements.")

        # 5. Routing Execution
        if waist_valid:
            selected_model = self.model_7
            selected_version = self.version_7
            selected_thresh = self.thresh_7
            routing_tier = "primary_7feature"
            row_dict = {
                "age": age,
                "height_cm": float(height) if height is not None else np.nan,
                "weight_kg": float(weight) if weight is not None else np.nan,
                "bmi": bmi,
                "waist_cm": waist_val,
                "high_blood_pressure": hbp_val,
                "diabetes": dm_val
            }
            row_df = pd.DataFrame([row_dict])[self.feats_7]
        else:
            selected_model = self.model_6
            selected_version = self.version_6
            selected_thresh = self.thresh_6
            routing_tier = "fallback_6feature_no_waist"
            row_dict = {
                "age": age,
                "height_cm": float(height) if height is not None else np.nan,
                "weight_kg": float(weight) if weight is not None else np.nan,
                "bmi": bmi,
                "high_blood_pressure": hbp_val,
                "diabetes": dm_val
            }
            row_df = pd.DataFrame([row_dict])[self.feats_6]

        # 6. Inference
        prob = float(selected_model.predict_proba(row_df)[0, 1])
        
        # Categorize Risk
        if prob >= selected_thresh:
            category = "higher"
            label = "Higher Screening Risk"
        elif prob >= self.lower_risk_cutoff:
            category = "intermediate"
            label = "Intermediate Screening Risk"
        else:
            category = "lower"
            label = "Lower Screening Risk"

        # 7. Audit Record Creation
        audit_record = {
            "status": "success",
            "routing": {
                "tier": routing_tier,
                "model_version": selected_version,
                "model_threshold": round(selected_thresh, 4),
                "lower_risk_cutoff": self.lower_risk_cutoff,
                "waist_circumference_utilized": waist_valid
            },
            "assessment": {
                "predicted_probability": round(prob, 4),
                "risk_category": category,
                "risk_label": label,
                "inputs_consumed": row_dict,
                "warnings": warnings,
                "disclaimer": "AI-assisted risk screening estimate only; not a diagnosis of male hypogonadism. Fasting morning testosterone laboratory testing required."
            }
        }
        return audit_record


def investigate_waist_missingness_bias(df: pd.DataFrame):
    """
    Investigates demographic and metabolic differences between men with vs without waist measurements.
    """
    has_waist = df["waist_cm"].notna()
    n_with = int(np.sum(has_waist))
    n_without = int(np.sum(~has_waist))
    
    df_with = df[has_waist]
    df_without = df[~has_waist]
    
    print("\n--- NHANES Waist Missingness Selection Bias Analysis ---")
    print(f"Total Men (19-60): {len(df)}")
    print(f"  With Measured Waist:    N={n_with} ({n_with/len(df)*100:.1f}%)")
    print(f"  Without Measured Waist: N={n_without} ({n_without/len(df)*100:.1f}%)")
    
    metrics = ["age", "bmi", "weight_kg", "height_cm", "possible_low_testosterone"]
    comparison = {}
    for m in metrics:
        val_with = float(df_with[m].mean())
        val_without = float(df_without[m].mean())
        comparison[m] = {
            "mean_with_waist": round(val_with, 2),
            "mean_without_waist": round(val_without, 2),
            "difference": round(val_without - val_with, 2)
        }
        print(f"  {m:26s} | With Waist: {val_with:6.2f} | Without Waist: {val_without:6.2f} | Delta: {val_without - val_with:+6.2f}")
    
    return comparison


def main():
    print("================================================================================")
    print("SIMULATION HARNESS: DUAL-MODEL ROUTING & CONTRACT VALIDATION")
    print("================================================================================")
    
    router = DualModelRouter(ART_7_PATH, ART_6_PATH)
    
    # 1. Test Cases for Routing & Schema Handling
    test_cases = [
        {
            "name": "Case 1: Standard Male with Valid Waist",
            "input": {"age": 42, "height_cm": 178, "weight_kg": 86, "waist_cm": 96.0, "diagnosed_hypertension": "no", "diagnosed_diabetes": "no"}
        },
        {
            "name": "Case 2: Missing Waist (Should Route to 6-Feature Fallback)",
            "input": {"age": 42, "height_cm": 178, "weight_kg": 86, "waist_cm": None, "diagnosed_hypertension": "no", "diagnosed_diabetes": "no"}
        },
        {
            "name": "Case 3: Implausible Out-of-Range Waist (Should Ignore Waist & Fallback)",
            "input": {"age": 35, "height_cm": 172, "weight_kg": 75, "waist_cm": 25.0, "diagnosed_hypertension": "no", "diagnosed_diabetes": "no"}
        },
        {
            "name": "Case 4: Severe Contradiction (BMI 42 with Waist 62 cm)",
            "input": {"age": 38, "height_cm": 165, "weight_kg": 115, "waist_cm": 62.0, "diagnosed_hypertension": "yes", "diagnosed_diabetes": "no"}
        },
        {
            "name": "Case 5: Unanswered Medical History (Unsure / Skipped)",
            "input": {"age": 28, "height_cm": 180, "weight_kg": 78, "waist_cm": 84.0, "diagnosed_hypertension": "unsure", "diagnosed_diabetes": None}
        },
        {
            "name": "Case 6: Ineligible Age (Age 17)",
            "input": {"age": 17, "height_cm": 175, "weight_kg": 70, "waist_cm": 80.0, "diagnosed_hypertension": "no", "diagnosed_diabetes": "no"}
        },
        {
            "name": "Case 7: Missing Height and Weight (Incomplete Biometrics)",
            "input": {"age": 30, "height_cm": None, "weight_kg": None, "waist_cm": 88.0, "diagnosed_hypertension": "no", "diagnosed_diabetes": "no"}
        }
    ]
    
    simulation_results = []
    print("\n--- Executing Simulated Input Harness ---")
    for tc in test_cases:
        res = router.validate_and_route(tc["input"])
        simulation_results.append({"test_case": tc["name"], "raw_input": tc["input"], "output": res})
        print(f"\n[{tc['name']}]")
        print(f"  Status:  {res.get('status')}")
        if res.get("status") == "success":
            print(f"  Tier:    {res['routing']['tier']} (Version: {res['routing']['model_version']})")
            print(f"  Thresh:  {res['routing']['model_threshold']:.4f}")
            print(f"  Prob:    {res['assessment']['predicted_probability']:.4f} -> {res['assessment']['risk_label']}")
            if res["assessment"]["warnings"]:
                print(f"  Warnings:{res['assessment']['warnings']}")
        else:
            print(f"  Message: {res.get('message')}")
            
    # 2. Investigate Waist Missingness Bias
    df = pd.read_csv(DATA_PATH)
    bias_comp = investigate_waist_missingness_bias(df)
    
    # Save simulation results
    sim_out_path = os.path.join(EXP_DIR, "reports", "simulation_harness_results.json")
    with open(sim_out_path, "w") as f:
        json.dump({"simulation_test_cases": simulation_results, "waist_missingness_bias": bias_comp}, f, indent=2)
    print(f"\nSaved Simulation Results to: {sim_out_path}")
    print("\n================================================================================")
    print("SIMULATION COMPLETED SUCCESSFULLY!")
    print("================================================================================")


if __name__ == "__main__":
    main()
