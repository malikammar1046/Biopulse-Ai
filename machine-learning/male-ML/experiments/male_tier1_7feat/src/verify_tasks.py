import os
import sys
import joblib
import json
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve, brier_score_loss
)

REPO_ROOT = r"c:\Users\hp\Desktop\Projects\PMOSense"
DATA_PATH = os.path.join(REPO_ROOT, "machine-learning", "male-ML", "male_tier1", "data", "processed", "male_tier1_nhanes_19_60.csv")
LEGACY_MODEL_PATH = os.path.join(REPO_ROOT, "machine-learning", "male-ML", "male_tier1", "artifacts", "male_low_t_model.joblib")
CANDIDATE_MODEL_PATH = os.path.join(REPO_ROOT, "machine-learning", "male-ML", "experiments", "male_tier1_7feat", "artifacts", "male_tier1_7feat_candidate.joblib")

df = pd.read_csv(DATA_PATH)
cand_art = joblib.load(CANDIDATE_MODEL_PATH)
leg_art = joblib.load(LEGACY_MODEL_PATH)

cand_model = cand_art["model"]
leg_model = leg_art["model"]

cand_feats = cand_art["feature_names"]
leg_feats = leg_art["feature_names"]

target = "possible_low_testosterone"
y_all = df[target].astype(int).values

# 80/20 train/test split with seed 42
train_idx, test_idx = train_test_split(np.arange(len(df)), test_size=0.20, stratify=y_all, random_state=42)

df_train = df.iloc[train_idx].copy()
df_test = df.iloc[test_idx].copy()

X_cand_test = df_test[cand_feats]
X_leg_test = df_test[leg_feats]
y_test = df_test[target].astype(int).values

p_cand = cand_model.predict_proba(X_cand_test)[:, 1]
p_leg = leg_model.predict_proba(X_leg_test)[:, 1]

thresh_cand = 0.1799
thresh_leg = 0.1808

y_pred_cand = (p_cand >= thresh_cand).astype(int)
y_pred_leg = (p_leg >= thresh_leg).astype(int)

print("=== TASK 1: STATISTICAL VERIFICATION & PAIRED DISCORDANCE ===")
# Paired contingency table for all test subjects (N=715)
table_all = pd.crosstab(y_pred_cand, y_pred_leg, rownames=["Cand"], colnames=["Leg"])
print("\nAll Test Subjects (N=715) Prediction Crosstab:")
print(table_all)

# McNemar test for overall classification decisions (whether Cand and Leg make the same prediction)
b = int(np.sum((y_pred_cand == 1) & (y_pred_leg == 0)))
c = int(np.sum((y_pred_cand == 0) & (y_pred_leg == 1)))
print(f"Overall discordant predictions: Cand=1/Leg=0: {b}, Cand=0/Leg=1: {c}")

# Paired discordance among TRUE POSITIVES (y=1, N=170)
pos_mask = (y_test == 1)
y_pred_cand_pos = y_pred_cand[pos_mask]
y_pred_leg_pos = y_pred_leg[pos_mask]

# Table of correct detection (Sensitivity)
# Both detected:
n11_pos = int(np.sum((y_pred_cand_pos == 1) & (y_pred_leg_pos == 1)))
# Cand detected, Leg missed:
n10_pos = int(np.sum((y_pred_cand_pos == 1) & (y_pred_leg_pos == 0)))
# Leg detected, Cand missed:
n01_pos = int(np.sum((y_pred_cand_pos == 0) & (y_pred_leg_pos == 1)))
# Both missed:
n00_pos = int(np.sum((y_pred_cand_pos == 0) & (y_pred_leg_pos == 0)))

print(f"\nPositive Cases (N={np.sum(pos_mask)}):")
print(f"  Both detected (TP by both): {n11_pos}")
print(f"  Cand detected, Leg missed (Discordant): {n10_pos}")
print(f"  Leg detected, Cand missed (Discordant): {n01_pos}")
print(f"  Both missed (FN by both): {n00_pos}")

# Exact Binomial test on discordant pairs for Sensitivity
binom_res_sens = stats.binomtest(n10_pos, n10_pos + n01_pos, p=0.5, alternative="two-sided")
print(f"  Exact McNemar / Binomial test p-value for Sensitivity difference: {binom_res_sens.pvalue:.4f}")

# Paired discordance among TRUE NEGATIVES (y=0, N=545)
neg_mask = (y_test == 0)
y_pred_cand_neg = y_pred_cand[neg_mask]
y_pred_leg_neg = y_pred_leg[neg_mask]

# Both TN (correct rejection):
n00_neg = int(np.sum((y_pred_cand_neg == 0) & (y_pred_leg_neg == 0)))
# Cand TN, Leg FP:
n01_neg = int(np.sum((y_pred_cand_neg == 0) & (y_pred_leg_neg == 1)))
# Leg TN, Cand FP:
n10_neg = int(np.sum((y_pred_cand_neg == 1) & (y_pred_leg_neg == 0)))
# Both FP:
n11_neg = int(np.sum((y_pred_cand_neg == 1) & (y_pred_leg_neg == 1)))

print(f"\nNegative Cases (N={np.sum(neg_mask)}):")
print(f"  Both rejected (TN by both): {n00_neg}")
print(f"  Cand TN, Leg FP (Cand correct, Leg false alarm): {n01_neg}")
print(f"  Leg TN, Cand FP (Leg correct, Cand false alarm): {n10_neg}")
print(f"  Both FP: {n11_neg}")

binom_res_spec = stats.binomtest(n01_neg, n01_neg + n10_neg, p=0.5, alternative="two-sided")
print(f"  Exact McNemar / Binomial test p-value for Specificity difference: {binom_res_spec.pvalue:.4f}")

# DeLong test for paired ROC curves
def delong_roc_variance(ground_truth, predictions):
    """Computes DeLong variance of ROC AUC."""
    order = np.argsort(ground_truth)
    ground_truth = ground_truth[order]
    predictions = predictions[order]
    
    m = np.sum(ground_truth == 0)
    n = np.sum(ground_truth == 1)
    
    x = predictions[ground_truth == 1]
    y = predictions[ground_truth == 0]
    
    tx = np.zeros(n)
    ty = np.zeros(m)
    
    for i in range(n):
        tx[i] = np.mean(x[i] > y) + 0.5 * np.mean(x[i] == y)
    for j in range(m):
        ty[j] = np.mean(x > y[j]) + 0.5 * np.mean(x == y[j])
        
    auc = np.mean(tx)
    var_tx = np.var(tx, ddof=1) / n
    var_ty = np.var(ty, ddof=1) / m
    return auc, var_tx + var_ty, tx, ty

auc_c, var_c, tx_c, ty_c = delong_roc_variance(y_test, p_cand)
auc_l, var_l, tx_l, ty_l = delong_roc_variance(y_test, p_leg)

cov_tx = np.cov(tx_c, tx_l)[0, 1] / len(tx_c)
cov_ty = np.cov(ty_c, ty_l)[0, 1] / len(ty_c)
var_diff = var_c + var_l - 2 * (cov_tx + cov_ty)
se_diff = np.sqrt(max(var_diff, 1e-12))
z_diff = (auc_c - auc_l) / se_diff
p_delong = 2 * (1 - stats.norm.cdf(abs(z_diff)))

ci_delong = [round(auc_c - auc_l - 1.96 * se_diff, 4), round(auc_c - auc_l + 1.96 * se_diff, 4)]
print(f"\nDeLong Paired ROC-AUC Comparison:")
print(f"  Cand AUC: {auc_c:.4f}, Leg AUC: {auc_l:.4f}")
print(f"  Delta AUC: {auc_c - auc_l:+.4f} (SE: {se_diff:.4f})")
print(f"  95% CI (DeLong): {ci_delong}")
print(f"  Z-score: {z_diff:.4f}, p-value: {p_delong:.4f}")

# Wilson Score interval for sensitivities
def wilson_ci(k, n, conf=0.95):
    z = stats.norm.ppf((1 + conf) / 2)
    p = k / n
    denom = 1 + z**2 / n
    center = (p + z**2 / (2 * n)) / denom
    half = (z * np.sqrt(p * (1 - p) / n + z**2 / (4 * n**2))) / denom
    return [round(center - half, 4), round(center + half, 4)]

print(f"\nWilson Score 95% CIs for Sensitivity:")
print(f"  Cand Sensitivity: {141/170*100:.2f}% {wilson_ci(141, 170)}")
print(f"  Leg Sensitivity:  {137/170*100:.2f}% {wilson_ci(137, 170)}")

# Newcombe Paired Difference CI for Sensitivity (Method 10)
def paired_diff_ci(n11, n10, n01, n00):
    n = n11 + n10 + n01 + n00
    p1 = (n11 + n10) / n
    p2 = (n11 + n01) / n
    diff = p1 - p2
    ci1 = wilson_ci(n11 + n10, n)
    ci2 = wilson_ci(n11 + n01, n)
    l1, u1 = ci1
    l2, u2 = ci2
    phi = (n11 * n00 - n10 * n01) / np.sqrt((n11 + n10) * (n01 + n00) * (n11 + n01) * (n10 + n00)) if (n11 + n10)*(n01 + n00)*(n11 + n01)*(n10 + n00) > 0 else 0
    lower = diff - np.sqrt((p1 - l1)**2 + (u2 - p2)**2 - 2 * phi * (p1 - l1) * (u2 - p2))
    upper = diff + np.sqrt((u1 - p1)**2 + (p2 - l2)**2 - 2 * phi * (u1 - p1) * (p2 - l2))
    return round(diff, 4), [round(lower, 4), round(upper, 4)]

diff_sens, ci_diff_sens = paired_diff_ci(n11_pos, n10_pos, n01_pos, n00_pos)
print(f"  Paired Sensitivity Difference (Newcombe): {diff_sens:+.4f} (95% CI: {ci_diff_sens})")

diff_spec, ci_diff_spec = paired_diff_ci(n00_neg, n01_neg, n10_neg, n11_neg)
print(f"  Paired Specificity Difference (Newcombe): {diff_spec:+.4f} (95% CI: {ci_diff_spec})")

print("\n=== TASK 2: CV & CALIBRATION VERIFICATION ===")
# Fair comparison of Balanced vs Unweighted Logistic Regression
# Let's inspect Brier score of both before and after calibration across 5 folds on training data
cv_5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
X_train = df_train[cand_feats]
y_train = df_train[target].astype(int).values

for mode in ["balanced", "unweighted"]:
    cw = "balanced" if mode == "balanced" else None
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(C=0.2, class_weight=cw, random_state=42, max_iter=1000))
    ])
    
    # Uncalibrated OOF
    oof_uncal = np.zeros(len(y_train))
    oof_cal = np.zeros(len(y_train))
    for tr, val in cv_5.split(X_train, y_train):
        pipe.fit(X_train.iloc[tr], y_train[tr])
        oof_uncal[val] = pipe.predict_proba(X_train.iloc[val])[:, 1]
        
        cal_clf = CalibratedClassifierCV(estimator=pipe, method="sigmoid", cv=3)
        cal_clf.fit(X_train.iloc[tr], y_train[tr])
        oof_cal[val] = cal_clf.predict_proba(X_train.iloc[val])[:, 1]
        
    print(f"\nConfiguration: Logistic Regression ({mode}):")
    print(f"  Uncalibrated OOF: ROC-AUC={roc_auc_score(y_train, oof_uncal):.4f}, PR-AUC={average_precision_score(y_train, oof_uncal):.4f}, Brier={brier_score_loss(y_train, oof_uncal):.4f}")
    print(f"  Calibrated OOF:   ROC-AUC={roc_auc_score(y_train, oof_cal):.4f}, PR-AUC={average_precision_score(y_train, oof_cal):.4f}, Brier={brier_score_loss(y_train, oof_cal):.4f}")

print("\n=== TASK 3: AGE SUBGROUP DETAILED BREAKDOWN ===")
test_df_age = df_test.copy()
test_df_age["p_cand"] = p_cand
test_df_age["p_leg"] = p_leg
test_df_age["y_cand"] = y_pred_cand
test_df_age["y_leg"] = y_pred_leg
test_df_age["age_group"] = pd.cut(test_df_age["age"], bins=[18, 30, 40, 50, 60], labels=["19-30", "31-40", "41-50", "51-60"])

for grp, gdf in test_df_age.groupby("age_group", observed=False):
    gy = gdf[target].values
    gc = gdf["y_cand"].values
    gl = gdf["y_leg"].values
    n_tot = len(gdf)
    n_pos = int(np.sum(gy))
    n_neg = n_tot - n_pos
    
    tp_c = int(np.sum((gy == 1) & (gc == 1)))
    fn_c = int(np.sum((gy == 1) & (gc == 0)))
    tn_c = int(np.sum((gy == 0) & (gc == 0)))
    fp_c = int(np.sum((gy == 0) & (gc == 1)))
    
    sens_c = tp_c / n_pos if n_pos > 0 else 0
    spec_c = tn_c / n_neg if n_neg > 0 else 0
    
    auc_c = roc_auc_score(gy, gdf["p_cand"].values) if len(np.unique(gy)) > 1 else None
    
    print(f"\nAge Group {grp}: N={n_tot}, Cases={n_pos} ({n_pos/n_tot*100:.1f}%)")
    print(f"  Candidate CM: TP={tp_c}, FP={fp_c}, TN={tn_c}, FN={fn_c}")
    print(f"  Candidate Sens: {sens_c*100:.2f}% (95% Wilson: {wilson_ci(tp_c, n_pos)})")
    print(f"  Candidate Spec: {spec_c*100:.2f}% (95% Wilson: {wilson_ci(tn_c, n_neg)})")
    print(f"  Candidate AUC:  {auc_c:.4f}" if auc_c else "  Candidate AUC: N/A")

# Chi-square test of sensitivity across age groups for candidate
sens_table = []
for grp, gdf in test_df_age.groupby("age_group", observed=False):
    gy = gdf[target].values
    gc = gdf["y_cand"].values
    sens_table.append([np.sum((gy == 1) & (gc == 1)), np.sum((gy == 1) & (gc == 0))])
chi2_sens, p_sens, _, _ = stats.chi2_contingency(sens_table)
print(f"\nChi-Square test across 4 age groups for Sensitivity: Chi2={chi2_sens:.4f}, p={p_sens:.4f}")

print("\n=== TASK 4: MISSING WAIST STRATEGIES (DEVELOPMENT DATA ONLY) ===")
# 6-Feature Fallback Model without waist_cm
feats_6 = ["age", "height_cm", "weight_kg", "bmi", "high_blood_pressure", "diabetes"]
pipe_6 = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(C=0.2, class_weight="balanced", random_state=42, max_iter=1000))
])

oof_6_cal = np.zeros(len(y_train))
for tr, val in cv_5.split(X_train[feats_6], y_train):
    cal_6 = CalibratedClassifierCV(estimator=pipe_6, method="sigmoid", cv=3)
    cal_6.fit(X_train[feats_6].iloc[tr], y_train[tr])
    oof_6_cal[val] = cal_6.predict_proba(X_train[feats_6].iloc[val])[:, 1]

fpr_6, tpr_6, th_6 = roc_curve(y_train, oof_6_cal)
mask_6 = tpr_6 >= 0.80
thresh_6 = float(th_6[mask_6][np.argmin(fpr_6[mask_6])])

print(f"6-Feature Fallback Model (No Waist):")
print(f"  OOF ROC-AUC: {roc_auc_score(y_train, oof_6_cal):.4f} (vs 7-feat: 0.7229)")
print(f"  OOF PR-AUC:  {average_precision_score(y_train, oof_6_cal):.4f} (vs 7-feat: 0.4618)")
print(f"  OOF Brier:   {brier_score_loss(y_train, oof_6_cal):.4f}")
print(f"  Selected Fallback Threshold (Sens >= 80%): {thresh_6:.4f}")

# Fit 6-feat on full train and evaluate on test set
cal_6_full = CalibratedClassifierCV(estimator=pipe_6, method="sigmoid", cv=5)
cal_6_full.fit(X_train[feats_6], y_train)
p_6_test = cal_6_full.predict_proba(df_test[feats_6])[:, 1]
y_6_pred = (p_6_test >= thresh_6).astype(int)
cm_6 = confusion_matrix(y_test, y_6_pred)
tn6, fp6, fn6, tp6 = cm_6.ravel()

print(f"  Test Set Evaluation (6-feat without waist):")
print(f"    ROC-AUC: {roc_auc_score(y_test, p_6_test):.4f} (Drop of {0.7074 - roc_auc_score(y_test, p_6_test):.4f} from 7-feat)")
print(f"    PR-AUC:  {average_precision_score(y_test, p_6_test):.4f}")
print(f"    Sensitivity: {tp6 / (tp6 + fn6) * 100:.2f}% ({tp6}/{tp6 + fn6})")
print(f"    Specificity: {tn6 / (tn6 + fp6) * 100:.2f}% ({tn6}/{tn6 + fp6})")

print("\n=== TASK 6: RISK BOUNDARY ANALYSIS (DEVELOPMENT & TEST) ===")
# Evaluate 0.10, 0.1799 on development OOF
oof_pred_low = (oof_cal < 0.10).astype(int)
oof_pred_high = (oof_cal >= thresh_cand).astype(int)
oof_pred_inter = ((oof_cal >= 0.10) & (oof_cal < thresh_cand)).astype(int)

print("OOF Training Data Risk Stratification (N=2860):")
print(f"  Lower Risk (< 0.10):        N={np.sum(oof_pred_low)} ({np.sum(oof_pred_low)/len(y_train)*100:.1f}%), Cases={np.sum(y_train[oof_pred_low==1])} ({np.mean(y_train[oof_pred_low==1])*100:.2f}% prev), NPV={1-np.mean(y_train[oof_pred_low==1]):.4f}")
print(f"  Intermediate Risk (0.10-0.18): N={np.sum(oof_pred_inter)} ({np.sum(oof_pred_inter)/len(y_train)*100:.1f}%), Cases={np.sum(y_train[oof_pred_inter==1])} ({np.mean(y_train[oof_pred_inter==1])*100:.2f}% prev)")
print(f"  Higher Risk (>= 0.18):      N={np.sum(oof_pred_high)} ({np.sum(oof_pred_high)/len(y_train)*100:.1f}%), Cases={np.sum(y_train[oof_pred_high==1])} ({np.mean(y_train[oof_pred_high==1])*100:.2f}% prev), PPV={np.mean(y_train[oof_pred_high==1]):.4f}")

# Test set risk stratification
test_pred_low = (p_cand < 0.10).astype(int)
test_pred_inter = ((p_cand >= 0.10) & (p_cand < thresh_cand)).astype(int)
test_pred_high = (p_cand >= thresh_cand).astype(int)

print("\nTest Data Risk Stratification (N=715):")
print(f"  Lower Risk (< 0.10):        N={np.sum(test_pred_low)} ({np.sum(test_pred_low)/len(y_test)*100:.1f}%), Cases={np.sum(y_test[test_pred_low==1])} ({np.mean(y_test[test_pred_low==1])*100:.2f}% prev), NPV={1-np.mean(y_test[test_pred_low==1]):.4f}")
print(f"  Intermediate Risk (0.10-0.18): N={np.sum(test_pred_inter)} ({np.sum(test_pred_inter)/len(y_test)*100:.1f}%), Cases={np.sum(y_test[test_pred_inter==1])} ({np.mean(y_test[test_pred_inter==1])*100:.2f}% prev)")
print(f"  Higher Risk (>= 0.18):      N={np.sum(test_pred_high)} ({np.sum(test_pred_high)/len(y_test)*100:.1f}%), Cases={np.sum(y_test[test_pred_high==1])} ({np.mean(y_test[test_pred_high==1])*100:.2f}% prev), PPV={np.mean(y_test[test_pred_high==1]):.4f}")
