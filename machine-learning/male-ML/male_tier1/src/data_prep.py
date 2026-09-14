"""
data_prep.py
------------
Downloads and preprocesses CDC NHANES data (2013-2014 and 2015-2016 cycles)
for men aged 19-60, preparing clean features and target label for Male Tier 1 Screening Model.
"""

import os
import urllib.request
import pandas as pd
import numpy as np

RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed")

os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

# CDC NHANES Base URL
CDC_BASE_URL = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public"

CYCLES = [
    {"year": "2013", "suffix": "H", "name": "2013-2014"},
    {"year": "2015", "suffix": "I", "name": "2015-2016"}
]

DATA_FILES = ["TST", "DEMO", "BMX", "DPQ", "BPQ", "DIQ"]


def download_nhanes_file(file_base: str, year: str, suffix: str) -> str:
    """Downloads an NHANES XPT file if not already cached locally."""
    filename = f"{file_base}_{suffix}.xpt"
    local_path = os.path.join(RAW_DATA_DIR, filename)
    
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        print(f"  [Cached] {filename}")
        return local_path
    
    url = f"{CDC_BASE_URL}/{year}/DataFiles/{filename}"
    print(f"  [Downloading] {url} -> {filename}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    with urllib.request.urlopen(req, timeout=45) as resp:
        with open(local_path, "wb") as f:
            f.write(resp.read())
            
    print(f"  [Saved] {filename} ({os.path.getsize(local_path):,} bytes)")
    return local_path


def load_cycle_data(cycle: dict) -> pd.DataFrame:
    """Loads and merges all relevant NHANES survey tables for a single cycle."""
    yr = cycle["year"]
    sfx = cycle["suffix"]
    name = cycle["name"]
    print(f"\n--- Processing Cycle {name} (Suffix: {sfx}) ---")
    
    paths = {}
    for base in DATA_FILES:
        paths[base] = download_nhanes_file(base, yr, sfx)
        
    # Read each table
    demo = pd.read_sas(paths["DEMO"], format="xport")[["SEQN", "RIAGENDR", "RIDAGEYR"]]
    tst = pd.read_sas(paths["TST"], format="xport")[["SEQN", "LBXTST"]]
    
    # BMX (Body measures)
    bmx_cols = ["SEQN", "BMXHT", "BMXWT", "BMXBMI", "BMXWAIST"]
    bmx = pd.read_sas(paths["BMX"], format="xport")
    bmx = bmx[[c for c in bmx_cols if c in bmx.columns]]
    
    # DPQ (Depression screener / Fatigue / Sleep)
    dpq_cols = ["SEQN", "DPQ010", "DPQ020", "DPQ030", "DPQ040"]
    dpq = pd.read_sas(paths["DPQ"], format="xport")
    dpq = dpq[[c for c in dpq_cols if c in dpq.columns]]
    
    # BPQ (Blood pressure history)
    bpq_cols = ["SEQN", "BPQ020"]
    bpq = pd.read_sas(paths["BPQ"], format="xport")
    bpq = bpq[[c for c in bpq_cols if c in bpq.columns]]
    
    # DIQ (Diabetes history)
    diq_cols = ["SEQN", "DIQ010"]
    diq = pd.read_sas(paths["DIQ"], format="xport")
    diq = diq[[c for c in diq_cols if c in diq.columns]]
    
    # Merge on SEQN
    merged = demo.merge(tst, on="SEQN", how="inner")
    merged = merged.merge(bmx, on="SEQN", how="left")
    merged = merged.merge(dpq, on="SEQN", how="left")
    merged = merged.merge(bpq, on="SEQN", how="left")
    merged = merged.merge(diq, on="SEQN", how="left")
    
    merged["cycle"] = name
    print(f"  Cycle {name} total merged participants: {len(merged)}")
    return merged


def clean_and_harmonize(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filters strictly to men aged 19-60, cleans survey codes,
    creates clear plain-English variables and the target label.
    """
    # 1. Filter to Men (RIAGENDR == 1) aged 19 to 60 (RIDAGEYR >= 19 & RIDAGEYR <= 60)
    cohort = df[(df["RIAGENDR"] == 1) & (df["RIDAGEYR"] >= 19) & (df["RIDAGEYR"] <= 60)].copy()
    print(f"\nCohort filtered to Men aged 19-60: {len(cohort)} records")
    
    # 2. Require valid Total Testosterone (LBXTST) for ground truth supervision
    cohort = cohort[cohort["LBXTST"].notna()].copy()
    print(f"Men aged 19-60 with valid Total Testosterone: {len(cohort)} records")
    
    # 3. Create Ground Truth Binary Target (AUA/Endocrine Society consensus: < 300 ng/dL)
    cohort["possible_low_testosterone"] = (cohort["LBXTST"] < 300.0).astype(int)
    
    # 4. Standardize / Clean Input Features
    # Age
    cohort["age"] = cohort["RIDAGEYR"].astype(float)
    
    # Anthropometrics
    cohort["height_cm"] = cohort["BMXHT"].astype(float)
    cohort["weight_kg"] = cohort["BMXWT"].astype(float)
    cohort["bmi"] = cohort["BMXBMI"].astype(float)
    cohort["waist_cm"] = cohort["BMXWAIST"].astype(float)
    
    # Backfill BMI if missing but height and weight exist
    bmi_calc = cohort["weight_kg"] / ((cohort["height_cm"] / 100.0) ** 2)
    cohort["bmi"] = cohort["bmi"].fillna(bmi_calc)
    
    # Symptoms: DPQ coding:
    # 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day
    # 7 = Refused, 9 = Don't know -> map to NaN (to be imputed) or 0
    symptom_cols = {
        "DPQ010": "low_interest",      # Little interest or pleasure
        "DPQ020": "low_mood",          # Feeling down, depressed, hopeless
        "DPQ030": "sleep_trouble",     # Trouble falling/staying asleep, sleeping too much
        "DPQ040": "low_energy"         # Feeling tired or having little energy
    }
    for raw_col, new_col in symptom_cols.items():
        if raw_col in cohort.columns:
            s = cohort[raw_col].copy()
            s = s.replace({7: np.nan, 9: np.nan})  # Refused / Don't know
            cohort[new_col] = s
        else:
            cohort[new_col] = np.nan
            
    # Chronic health indicators:
    # BPQ020: High blood pressure (1 = Yes, 2 = No, 7/9 = Refused/Unknown)
    if "BPQ020" in cohort.columns:
        bp = cohort["BPQ020"].replace({2: 0.0, 1: 1.0, 7: np.nan, 9: np.nan})
        cohort["high_blood_pressure"] = bp
    else:
        cohort["high_blood_pressure"] = np.nan
        
    # DIQ010: Diabetes (1 = Yes, 2 = No, 3 = Borderline, 7/9 = Refused/Unknown)
    if "DIQ010" in cohort.columns:
        diab = cohort["DIQ010"].replace({1: 1.0, 2: 0.0, 3: 1.0, 7: np.nan, 9: np.nan})
        cohort["diabetes"] = diab
    else:
        cohort["diabetes"] = np.nan
        
    # Select final columns
    final_cols = [
        "SEQN", "cycle", "age",
        "height_cm", "weight_kg", "bmi", "waist_cm",
        "low_energy", "sleep_trouble", "low_mood", "low_interest",
        "high_blood_pressure", "diabetes",
        "LBXTST", "possible_low_testosterone"
    ]
    
    clean_df = cohort[[c for c in final_cols if c in cohort.columns]].copy()
    return clean_df


def main():
    print("==================================================")
    print("NHANES Male Tier 1 Data Ingestion & Preprocessing")
    print("Target Population: Men aged 19-60")
    print("==================================================")
    
    all_cycles = []
    for cycle in CYCLES:
        df_cycle = load_cycle_data(cycle)
        all_cycles.append(df_cycle)
        
    combined_raw = pd.concat(all_cycles, ignore_index=True)
    print(f"\nTotal combined records from all cycles: {len(combined_raw)}")
    
    clean_df = clean_and_harmonize(combined_raw)
    
    # Save processed CSV
    out_path = os.path.join(PROCESSED_DATA_DIR, "male_tier1_nhanes_19_60.csv")
    clean_df.to_csv(out_path, index=False)
    print(f"\nSuccessfully generated processed dataset: {out_path}")
    print(f"Total rows: {len(clean_df)}")
    
    # Summary stats
    print("\n--- Cohort Summary ---")
    print(f"Age range: {clean_df['age'].min():.0f} to {clean_df['age'].max():.0f} years")
    print(f"Mean Age: {clean_df['age'].mean():.1f} +/- {clean_df['age'].std():.1f}")
    print(f"Median Age: {clean_df['age'].median():.1f}")
    
    print("\nAge Brackets:")
    clean_df["age_bracket"] = pd.cut(clean_df["age"], bins=[18, 30, 40, 50, 60], labels=["19-30", "31-40", "41-50", "51-60"])
    print(clean_df["age_bracket"].value_counts().sort_index())
    
    print("\nTarget Distribution (possible_low_testosterone, T < 300 ng/dL):")
    pos_count = clean_df["possible_low_testosterone"].sum()
    total_count = len(clean_df)
    print(f"  Positive (<300 ng/dL): {pos_count} ({pos_count / total_count * 100:.1f}%)")
    print(f"  Negative (>=300 ng/dL): {total_count - pos_count} ({(total_count - pos_count) / total_count * 100:.1f}%)")
    
    print("\nPrevalence by Age Bracket:")
    prev_by_age = clean_df.groupby("age_bracket", observed=False)["possible_low_testosterone"].agg(["count", "mean"])
    prev_by_age["percent"] = prev_by_age["mean"] * 100
    print(prev_by_age[["count", "percent"]])
    
    print("\nMissing values:")
    print(clean_df.isnull().sum())
    
    return clean_df


if __name__ == "__main__":
    main()
