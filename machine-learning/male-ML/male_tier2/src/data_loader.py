"""
data_loader.py
--------------
Loads and harmonizes CDC NHANES 2013-2016 laboratory and demographic data
for adult men aged 19-60.
Computes Vermeulen Free Testosterone for clinical reference.
Constructs clean, non-leaking laboratory feature set and ground-truth target.
"""

import os
import urllib.request
import pandas as pd
import numpy as np

RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

CDC_BASE_URL = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public"

CYCLES = [
    {"year": "2013", "suffix": "H", "name": "2013-2014"},
    {"year": "2015", "suffix": "I", "name": "2015-2016"}
]

# Required tables for Tier 2 laboratory cohort
TABLES = ["DEMO", "TST", "BIOPRO", "CBC", "GHB", "HDL"]


def download_nhanes_file(base: str, year: str, suffix: str) -> str:
    """Downloads an NHANES XPT file if not cached."""
    filename = f"{base}_{suffix}.xpt"
    local_path = os.path.join(RAW_DIR, filename)
    
    # Also check if already cached in male_tier1/data/raw
    tier1_raw = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "male_tier1", "data", "raw", filename)
    if os.path.exists(tier1_raw) and os.path.getsize(tier1_raw) > 1000:
        return tier1_raw
        
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        return local_path

    url = f"{CDC_BASE_URL}/{year}/DataFiles/{filename}"
    print(f"  [Downloading] {url} -> {filename}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        with open(local_path, "wb") as f:
            f.write(resp.read())
            
    return local_path


def calculate_vermeulen_free_t(total_t_ng_dl, shbg_nmol_l, albumin_g_dl=4.3):
    """
    Calculates Free Testosterone (ng/dL) and Bioavailable Testosterone (ng/dL)
    using the gold-standard Vermeulen (1999) mass-action equilibrium equation.
    """
    t_ng = np.array(total_t_ng_dl, dtype=float)
    shbg_nmol = np.array(shbg_nmol_l, dtype=float)
    alb_g = np.array(albumin_g_dl, dtype=float)
    alb_g = np.where(np.isnan(alb_g), 4.3, alb_g)
    
    # Conversion to mol/L
    # MW of testosterone = 288.42 g/mol
    # 1 ng/dL = 1e-8 g/L = (1e-8 / 288.42) mol/L
    T_mol = (t_ng * 1e-8) / 288.42
    SHBG_mol = shbg_nmol * 1e-9
    Alb_mol = (alb_g * 10.0) / 66437.0
    
    Ka = 3.6e4   # Association constant of Albumin for testosterone (L/mol)
    Kt = 1.0e9   # Association constant of SHBG for testosterone (L/mol)
    
    N = 1.0 + Ka * Alb_mol
    a = Kt * N
    b = N + Kt * SHBG_mol - Kt * T_mol
    c = -T_mol
    
    discriminant = np.maximum(b**2 - 4.0 * a * c, 0.0)
    ft_mol = (-b + np.sqrt(discriminant)) / (2.0 * a)
    
    # Convert back to ng/dL
    ft_ng_dl = (ft_mol * 288.42) / 1e-8
    
    # Bioavailable T = Free T + Albumin-bound T = FT * (1 + Ka * Albumin)
    bio_t_ng_dl = ft_ng_dl * N
    
    return ft_ng_dl, bio_t_ng_dl


def load_and_merge_cycle(cycle: dict) -> pd.DataFrame:
    """Loads and links demographic and laboratory tables for one cycle."""
    yr = cycle["year"]
    sfx = cycle["suffix"]
    name = cycle["name"]
    print(f"\n--- Loading Cycle {name} (Suffix: {sfx}) ---")
    
    paths = {t: download_nhanes_file(t, yr, sfx) for t in TABLES}
    
    # 1. Demographics: SEQN, RIAGENDR (1=Male), RIDAGEYR (Age)
    demo = pd.read_sas(paths["DEMO"], format="xport")[["SEQN", "RIAGENDR", "RIDAGEYR"]]
    
    # 2. Sex Steroid Hormones: LBXTST (Total T, ng/dL), LBXEST (Estradiol, pg/mL), LBXSHBG (SHBG, nmol/L)
    tst = pd.read_sas(paths["TST"], format="xport")
    tst_cols = ["SEQN", "LBXTST", "LBXEST", "LBXSHBG"]
    tst = tst[[c for c in tst_cols if c in tst.columns]]
    
    # 3. Standard Biochemistry: LBDSALSI (Albumin, g/L), LBXSGL (Glucose, mg/dL), 
    #    LBXSATSI (ALT, U/L), LBXSASSI (AST, U/L), LBXSTB (Bilirubin, mg/dL), 
    #    LBXSCR (Creatinine, mg/dL), LBXSBU (BUN, mg/dL), LBXSUA (Uric Acid, mg/dL)
    biopro = pd.read_sas(paths["BIOPRO"], format="xport")
    bio_cols = ["SEQN", "LBDSALSI", "LBXSGL", "LBXSATSI", "LBXSASSI", "LBXSTB", "LBXSCR", "LBXSBU", "LBXSUA"]
    biopro = biopro[[c for c in bio_cols if c in biopro.columns]]
    
    # 4. Complete Blood Count: LBXHGB (Hemoglobin, g/dL), LBXHCT (Hematocrit, %), LBXRBCSI (RBC, 10^6/uL)
    cbc = pd.read_sas(paths["CBC"], format="xport")
    cbc_cols = ["SEQN", "LBXHGB", "LBXHCT", "LBXRBCSI"]
    cbc = cbc[[c for c in cbc_cols if c in cbc.columns]]
    
    # 5. Glycohemoglobin: LBXGH (HbA1c, %)
    ghb = pd.read_sas(paths["GHB"], format="xport")
    ghb_cols = ["SEQN", "LBXGH"]
    ghb = ghb[[c for c in ghb_cols if c in ghb.columns]]
    
    # 6. Lipids: LBDHDD (HDL-C, mg/dL)
    hdl = pd.read_sas(paths["HDL"], format="xport")
    hdl_cols = ["SEQN", "LBDHDD"]
    hdl = hdl[[c for c in hdl_cols if c in hdl.columns]]
    
    # Merge sequentially on SEQN
    merged = demo.merge(tst, on="SEQN", how="inner")
    merged = merged.merge(biopro, on="SEQN", how="left")
    merged = merged.merge(cbc, on="SEQN", how="left")
    merged = merged.merge(ghb, on="SEQN", how="left")
    merged = merged.merge(hdl, on="SEQN", how="left")
    merged["cycle"] = name
    
    print(f"  Cycle {name} total merged: {len(merged)}")
    return merged


def process_male_tier2_data() -> pd.DataFrame:
    """Ingests all cycles, applies 19-60 filtering, cleans features, and constructs target."""
    all_cycles = [load_and_merge_cycle(c) for c in CYCLES]
    combined = pd.concat(all_cycles, ignore_index=True)
    
    # Filter strictly to men aged 19-60 with valid Total Testosterone
    men = combined[
        (combined["RIAGENDR"] == 1) & 
        (combined["RIDAGEYR"] >= 19) & 
        (combined["RIDAGEYR"] <= 60) &
        (combined["LBXTST"].notna())
    ].copy()
    
    print(f"\nFiltered to adult men aged 19-60 with valid Total T: {len(men)} records")
    
    # Clean and standardize feature names
    men["age"] = men["RIDAGEYR"].astype(float)
    men["total_testosterone_ng_dl"] = men["LBXTST"].astype(float)
    men["shbg_nmol_l"] = men["LBXSHBG"].astype(float)
    men["estradiol_pg_ml"] = men["LBXEST"].astype(float)
    
    # Albumin: LBDSALSI is in g/L in NHANES. Convert to clinical standard g/dL (divide by 10)
    men["albumin_g_dl"] = men["LBDSALSI"].astype(float) / 10.0
    
    # Hematology
    men["hemoglobin_g_dl"] = men["LBXHGB"].astype(float)
    men["hematocrit_pct"] = men["LBXHCT"].astype(float)
    men["rbc_count"] = men["LBXRBCSI"].astype(float)
    
    # Glycemic & Metabolic
    men["hba1c_pct"] = men["LBXGH"].astype(float)
    men["glucose_mg_dl"] = men["LBXSGL"].astype(float)
    
    # Liver & Renal
    men["alt_u_l"] = men["LBXSATSI"].astype(float)
    men["ast_u_l"] = men["LBXSASSI"].astype(float)
    men["total_bilirubin_mg_dl"] = men["LBXSTB"].astype(float)
    men["creatinine_mg_dl"] = men["LBXSCR"].astype(float)
    men["bun_mg_dl"] = men["LBXSBU"].astype(float)
    men["uric_acid_mg_dl"] = men["LBXSUA"].astype(float)
    men["hdl_mg_dl"] = men["LBDHDD"].astype(float)
    
    # Calculated Free Testosterone (Vermeulen equation) for clinical reference
    free_t, bio_t = calculate_vermeulen_free_t(
        men["total_testosterone_ng_dl"].values,
        men["shbg_nmol_l"].values,
        men["albumin_g_dl"].values
    )
    men["calculated_free_t_ng_dl"] = free_t
    men["calculated_bio_t_ng_dl"] = bio_t
    
    # Supervision Target: Low Total Testosterone (< 300 ng/dL)
    men["low_total_testosterone"] = (men["total_testosterone_ng_dl"] < 300.0).astype(int)
    
    # Target 2 (Reference): Low Free Testosterone (< 6.5 ng/dL)
    men["low_free_testosterone"] = (men["calculated_free_t_ng_dl"] < 6.5).astype(int)
    
    # Final output path
    out_csv = os.path.join(PROCESSED_DIR, "male_tier2_nhanes_19_60.csv")
    men.to_csv(out_csv, index=False)
    print(f"Saved processed Tier 2 laboratory dataset: {out_csv} ({len(men)} rows)")
    
    return men


if __name__ == "__main__":
    process_male_tier2_data()
