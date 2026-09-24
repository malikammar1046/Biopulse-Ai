"""
Inference & Clinical Decision Support Engine for Male Health Digital Twin.
Loads trained model and scaler to compute patient-specific testosterone deficiency probability,
risk category, and actionable clinical guidance.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Union

FEATURE_NAMES = ["Age", "DM", "TG", "HT", "HDL", "AC"]

class MaleHealthDigitalTwinInference:
    def __init__(self, model_path: str = None, scaler_path: str = None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), "artifacts", "male_testosterone_deficiency_model.joblib")
        if scaler_path is None:
            scaler_path = os.path.join(os.path.dirname(__file__), "artifacts", "scaler.joblib")
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
            
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None

    def predict_risk(self, patient_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
        """
        Computes testosterone deficiency risk probability and clinical guidance for a patient.
        
        Expected features in patient_data:
          - Age: int (years, 45-85)
          - DM: int (0 = No, 1 = Yes, Diabetes Mellitus)
          - TG: float (Triglycerides, mg/dL)
          - HT: int (0 = No, 1 = Yes, Hypertension)
          - HDL: float (HDL Cholesterol, mg/dL)
          - AC: float (Abdominal Circumference / Waist, cm)
        """
        if isinstance(patient_data, dict):
            df_patient = pd.DataFrame([patient_data])
        else:
            df_patient = patient_data.copy()
            
        # Ensure column order
        df_patient = df_patient[FEATURE_NAMES]
        
        # Predict probability
        prob = float(self.model.predict_proba(df_patient)[:, 1][0])
        
        # Stratify clinical risk category
        if prob < 0.20:
            risk_tier = "LOW RISK"
            color_code = "GREEN"
            clinical_guidance = (
                "Low pre-test probability of biochemical testosterone deficiency. "
                "Routine screening blood draw is not immediately warranted unless "
                "the patient exhibits overt severe hypogonadal symptoms (e.g., loss of morning erections, severe low libido)."
            )
        elif prob < 0.40:
            risk_tier = "MODERATE RISK"
            color_code = "YELLOW"
            clinical_guidance = (
                "Borderline metabolic-endocrine risk profile. "
                "Assess clinical symptom score (AMS / ADAM questionnaire). "
                "If symptomatic, recommend 2 separate early-morning fasting Total Testosterone draws (8:00–10:00 AM). "
                "Initiate lifestyle and dietary interventions targeting visceral fat reduction and lipid management."
            )
        else:
            risk_tier = "HIGH RISK"
            color_code = "RED"
            clinical_guidance = (
                "Significantly elevated probability of testosterone deficiency. "
                "Strongly recommend fasting morning Total Testosterone laboratory workup (8:00–10:00 AM). "
                "If Total T < 300 ng/dL on repeat testing, obtain serum LH and FSH to distinguish primary from secondary hypogonadism, "
                "along with prolactin, SHBG, and HbA1c."
            )
            
        # Clinical Risk Factor Breakdown
        p_row = df_patient.iloc[0]
        risk_drivers = []
        if p_row["AC"] >= 102.0:
            risk_drivers.append(f"Abdominal Obesity: Waist Circumference {p_row['AC']:.1f} cm (Threshold >= 102 cm)")
        elif p_row["AC"] >= 94.0:
            risk_drivers.append(f"Borderline Increased Waist: {p_row['AC']:.1f} cm (Warning >= 94 cm)")
            
        if p_row["TG"] >= 150.0:
            risk_drivers.append(f"Hypertriglyceridemia: {p_row['TG']:.0f} mg/dL (Threshold >= 150 mg/dL)")
            
        if p_row["HDL"] < 40.0:
            risk_drivers.append(f"Low Protective HDL: {p_row['HDL']:.1f} mg/dL (Threshold < 40 mg/dL)")
            
        if p_row["DM"] == 1:
            risk_drivers.append("Type 2 Diabetes Mellitus (Strong independent driver of functional secondary hypogonadism)")
            
        if p_row["HT"] == 1:
            risk_drivers.append("Hypertension (Vascular & metabolic comorbidity)")

        return {
            "testosterone_deficiency_probability": round(prob, 4),
            "percentage": f"{prob * 100:.1f}%",
            "risk_tier": risk_tier,
            "color_code": color_code,
            "contributing_risk_factors": risk_drivers,
            "clinical_guidance": clinical_guidance,
            "patient_features": p_row.to_dict()
        }

if __name__ == "__main__":
    twin = MaleHealthDigitalTwinInference()
    
    sample_patients = [
        {
            "name": "Patient 1: Metabolic Healthy / Lean Athletic Male",
            "data": {"Age": 50, "DM": 0, "TG": 85, "HT": 0, "HDL": 55.0, "AC": 85.0}
        },
        {
            "name": "Patient 2: Borderline Dysmetabolic Male",
            "data": {"Age": 58, "DM": 0, "TG": 165, "HT": 1, "HDL": 42.0, "AC": 100.0}
        },
        {
            "name": "Patient 3: High Risk Diabetic Visceral Obese Male",
            "data": {"Age": 62, "DM": 1, "TG": 240, "HT": 1, "HDL": 32.0, "AC": 116.0}
        }
    ]
    
    print("="*75)
    print("MALE HEALTH DIGITAL TWIN - CLINICAL INFERENCE DEMONSTRATION")
    print("="*75)
    for p in sample_patients:
        print(f"\nEvaluating {p['name']}:")
        res = twin.predict_risk(p['data'])
        print(f"  -> Predicted Deficiency Probability: {res['percentage']} [{res['risk_tier']}]")
        print("  -> Contributing Factors:")
        for rf in res["contributing_risk_factors"]:
            print(f"     * {rf}")
        if not res["contributing_risk_factors"]:
            print("     * None (Favorable metabolic profile)")
        print(f"  -> Clinical Action:\n     {res['clinical_guidance']}")
