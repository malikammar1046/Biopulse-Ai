"""
inference_check.py
------------------
Interactive plain-English screening tool for Male Low Testosterone risk.
Targeted strictly for adult men aged 19-60.
Provides clear risk stratification, probability estimate, contributing factor insights,
and essential non-diagnostic medical guidance.
"""

import os
import sys
import argparse
import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "male_low_t_model.joblib")


def load_screening_model():
    """Loads the serialized screening model artifact."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model artifact not found at {MODEL_PATH}. Please run train.py first."
        )
    artifact = joblib.load(MODEL_PATH)
    return artifact


def run_screening(
    age: float,
    height_cm: float,
    weight_kg: float,
    waist_cm: float,
    low_energy: int,
    sleep_trouble: int,
    low_mood: int,
    low_interest: int,
    high_blood_pressure: int,
    diabetes: int,
    model_artifact: dict = None
) -> dict:
    """
    Executes risk screening on provided clinical/lifestyle parameters.
    Returns structured results with risk category, probability, and guidance.
    """
    if model_artifact is None:
        model_artifact = load_screening_model()
        
    # Input validation
    if age < 19 or age > 60:
        print(f"Warning: This model was specifically validated for adult men aged 19–60. (Given age: {age})")
        
    bmi = weight_kg / ((height_cm / 100.0) ** 2)
    
    # Feature dictionary
    input_data = pd.DataFrame([{
        "age": float(age),
        "height_cm": float(height_cm),
        "weight_kg": float(weight_kg),
        "bmi": float(bmi),
        "waist_cm": float(waist_cm),
        "low_energy": float(low_energy),
        "sleep_trouble": float(sleep_trouble),
        "low_mood": float(low_mood),
        "low_interest": float(low_interest),
        "high_blood_pressure": float(high_blood_pressure),
        "diabetes": float(diabetes)
    }])
    
    model = model_artifact["model"]
    screening_threshold = model_artifact.get("screening_threshold", 0.35)
    
    # Predict calibrated probability
    prob = float(model.predict_proba(input_data)[0, 1])
    is_screen_positive = prob >= screening_threshold
    
    # Categorize Risk
    if prob < 0.20:
        risk_level = "Low Likelihood"
        summary_badge = "[ LOW RISK ]"
    elif prob < screening_threshold:
        risk_level = "Moderate / Borderline Likelihood"
        summary_badge = "[ MODERATE RISK ]"
    elif prob < 0.50:
        risk_level = "Elevated Screening Risk"
        summary_badge = "[ ELEVATED SCREENING RISK ]"
    else:
        risk_level = "High Screening Risk"
        summary_badge = "[ HIGH SCREENING RISK ]"
        
    # Analyze key contributing factors
    contributing_factors = []
    if waist_cm >= 102.0:  # >= 40 inches
        contributing_factors.append("Waist circumference >= 102 cm (40 in), which strongly correlates with lower free and total testosterone.")
    elif waist_cm >= 94.0:   # >= 37 inches
        contributing_factors.append("Mildly elevated waist circumference (abdominal adiposity).")
        
    if bmi >= 30.0:
        contributing_factors.append(f"Body Mass Index in the obese range (BMI = {bmi:.1f}).")
    elif bmi >= 25.0:
        contributing_factors.append(f"Body Mass Index in the overweight range (BMI = {bmi:.1f}).")
        
    if low_energy >= 2:
        contributing_factors.append("Frequent tiredness or lack of energy over the past 2 weeks.")
    if sleep_trouble >= 2:
        contributing_factors.append("Frequent sleep disturbance (poor sleep significantly suppresses morning testosterone production).")
    if high_blood_pressure == 1:
        contributing_factors.append("History of high blood pressure (metabolic vascular risk factor).")
    if diabetes == 1:
        contributing_factors.append("History of diabetes or insulin resistance (closely linked to low testosterone).")
    if age >= 45:
        contributing_factors.append(f"Age {int(age)} (testosterone levels gradually decline approximately 1% per year after age 30).")
        
    if not contributing_factors:
        contributing_factors.append("No prominent physical or symptom risk flags detected.")

    # Plain English guidance
    if is_screen_positive:
        primary_message = (
            "Your responses indicate signs and physical factors that are frequently associated "
            "with lower testosterone levels."
        )
        recommendation = (
            "We recommend discussing these symptoms with your primary care doctor. "
            "Ask if a morning fasting Total and Free Testosterone blood panel is appropriate for you."
        )
    else:
        primary_message = (
            "Your profile shows a lower likelihood of testosterone deficiency based on physical metrics "
            "and reported symptoms."
        )
        recommendation = (
            "Maintain healthy sleep, regular strength training, and balanced nutrition. "
            "If persistent fatigue, low mood, or erectile issues continue, consult a physician."
        )
        
    safety_disclaimer = (
        "IMPORTANT SAFETY STATEMENT: This tool is an educational screening model, NOT a medical diagnosis. "
        "Testosterone levels fluctuate throughout the day and are influenced by acute stress, illness, and sleep. "
        "Only a certified morning blood laboratory test and clinical evaluation by a medical doctor can diagnose male hypogonadism."
    )
    
    return {
        "badge": summary_badge,
        "risk_level": risk_level,
        "probability_percent": round(prob * 100, 1),
        "screening_threshold_percent": round(screening_threshold * 100, 1),
        "screen_positive": is_screen_positive,
        "bmi": round(bmi, 1),
        "primary_message": primary_message,
        "contributing_factors": contributing_factors,
        "recommendation": recommendation,
        "safety_disclaimer": safety_disclaimer
    }


def print_result_card(res: dict):
    """Prints a beautiful, clean terminal card for screening output."""
    print("\n" + "=" * 64)
    print(f"       MALE HEALTH TIER 1 SCREENING RESULT: {res['badge']}")
    print("=" * 64)
    print(f"Risk Classification   : {res['risk_level']}")
    print(f"Estimated Probability : {res['probability_percent']}% (Screening Cutoff: {res['screening_threshold_percent']}%)")
    print(f"Calculated BMI        : {res['bmi']} kg/m^2")
    print("-" * 64)
    print(f"Summary:")
    print(f"  {res['primary_message']}")
    print("\nKey Contributing Factors Identified:")
    for f in res["contributing_factors"]:
        print(f"  * {f}")
    print("\nRecommended Next Steps:")
    print(f"  {res['recommendation']}")
    print("-" * 64)
    print(f"\n{res['safety_disclaimer']}")
    print("=" * 64 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Male Tier 1 Low Testosterone Risk Screener (Ages 19-60)")
    parser.add_argument("--age", type=float, help="Age in years (19-60)")
    parser.add_argument("--height", type=float, help="Height in cm (e.g. 178)")
    parser.add_argument("--weight", type=float, help="Weight in kg (e.g. 85)")
    parser.add_argument("--waist", type=float, help="Waist circumference in cm (e.g. 96)")
    parser.add_argument("--energy", type=int, choices=[0, 1, 2, 3], help="Tired / low energy (0=None, 1=Several days, 2=>Half, 3=Nearly every day)")
    parser.add_argument("--sleep", type=int, choices=[0, 1, 2, 3], help="Sleep trouble (0-3)")
    parser.add_argument("--mood", type=int, choices=[0, 1, 2, 3], help="Low mood / feeling down (0-3)")
    parser.add_argument("--interest", type=int, choices=[0, 1, 2, 3], help="Low interest / drive (0-3)")
    parser.add_argument("--bp", type=int, choices=[0, 1], help="High blood pressure (0=No, 1=Yes)")
    parser.add_argument("--diabetes", type=int, choices=[0, 1], help="Diabetes (0=No, 1=Yes)")
    
    args = parser.parse_args()
    
    # If arguments not provided, run built-in demonstration cases
    if args.age is None:
        print("\n[Running Sample Screening Profile 1: Active 28-Year-Old Male]")
        res1 = run_screening(
            age=28, height_cm=180, weight_kg=78, waist_cm=84,
            low_energy=0, sleep_trouble=0, low_mood=0, low_interest=0,
            high_blood_pressure=0, diabetes=0
        )
        print_result_card(res1)
        
        print("\n[Running Sample Screening Profile 2: 48-Year-Old Male with Fatigue & High Waist Size]")
        res2 = run_screening(
            age=48, height_cm=175, weight_kg=98, waist_cm=106,
            low_energy=3, sleep_trouble=2, low_mood=1, low_interest=2,
            high_blood_pressure=1, diabetes=0
        )
        print_result_card(res2)
        
        print("\nTip: You can pass custom arguments to test any profile:")
        print("python inference_check.py --age 35 --height 178 --weight 90 --waist 98 --energy 2 --sleep 1 --mood 1 --interest 1 --bp 0 --diabetes 0")
    else:
        res = run_screening(
            age=args.age,
            height_cm=args.height or 175.0,
            weight_kg=args.weight or 80.0,
            waist_cm=args.waist or 90.0,
            low_energy=args.energy or 0,
            sleep_trouble=args.sleep or 0,
            low_mood=args.mood or 0,
            low_interest=args.interest or 0,
            high_blood_pressure=args.bp or 0,
            diabetes=args.diabetes or 0
        )
        print_result_card(res)


if __name__ == "__main__":
    main()
