# OvaSense-ML — Feature Classification Report

**Project**: OvaSense Standalone PCOS Risk-Screening Machine Learning  
**Date**: August 2026  
**Document Purpose**: Definitive classification of every dataset attribute into strict feature tiers to ensure clinical integrity, user accessibility, and complete absence of target leakage.

---

## 1. Feature Classification Taxonomy

Every column in the raw dataset has been assigned to exactly one of the following five categories:

```
┌────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
│ Category           │ Definition & Scope                                                          │
├────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ CORE               │ Primary OvaSense model. Non-invasive, patient-reportable features obtainable │
│                    │ without clinical equipment, blood tests, or ultrasound imaging.             │
│ EXTENDED           │ Secondary model. CORE features plus basic, accessible clinical/vital metrics│
│                    │ (e.g. blood pressure, heart rate, routine hemoglobin, fingerstick glucose). │
│ FULL_CLINICAL      │ Benchmark comparison model. Comprehensive specialized endocrine, hormonal,  │
│                    │ and ultrasound variables. (Used to measure screening performance retention) │
│ POTENTIAL_LEAKAGE  │ Diagnostic criteria ground-truth variables (e.g. antral follicle count)     │
│                    │ that risk circular label leakage if used in screening. Excluded from Core.  │
│ REMOVE             │ Identifiers, index artifacts, or corrupted ghost columns.                   │
└────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Classification Table (All 45 Columns)

| # | Feature Name (Raw) | Clean Column Name | Category | Reason for Classification | OvaSense Relevance |
|---|---|---|---|---|---|
| 1 | `Sl. No` | `sl_no` | `REMOVE` | Serial sequence number / database row index. Carries no clinical or physiological meaning. Risk of spurious correlation if unremoved. | None (Must be dropped) |
| 2 | `Patient File No.` | `patient_file_no` | `REMOVE` | Hospital medical record identifier. Arbitrary administrative numbering. | None (Must be dropped) |
| 3 | `PCOS (Y/N)` | `pcos_yn` | **TARGET** | Ground truth diagnostic target label. (0 = Non-PCOS, 1 = PCOS). | Primary learning target |
| 4 | ` Age (yrs)` | `age_years` | `CORE` | Basic demographic variable. Readily known and reported by the patient. PCOS phenotyping varies across age cohorts. | High (Core Demographic) |
| 5 | `Weight (Kg)` | `weight_kg` | `CORE` | Basic anthropometric metric. Easily measured at home with a standard bathroom scale. Obesity is strongly associated with PCOS metabolic phenotype. | High (Core Anthropometric) |
| 6 | `Height(Cm) ` | `height_cm` | `CORE` | Basic anthropometric metric. Easily measured at home. Required to compute Body Mass Index and assess body proportions. | High (Core Anthropometric) |
| 7 | `BMI` | `bmi` | `CORE` | Derived anthropometric indicator of adiposity. Non-invasive and patient-computable ($kg/m^2$). Metabolic syndrome and insulin resistance correlate with elevated BMI in PCOS. | High (Core Anthropometric) |
| 8 | `Blood Group` | `blood_group` | `EXTENDED` | Routine blood group status. Requires prior blood typing test (not always known by all users at home, but easily accessible from standard medical records). | Moderate (Extended Clinical) |
| 9 | `Pulse rate(bpm) ` | `pulse_rate_bpm` | `EXTENDED` | Basic clinical vital sign. Measured via pulse check, smart watch, or routine physical examination. Autonomic tone indicator. | Moderate (Extended Clinical) |
| 10 | `RR (breaths/min)` | `rr_breaths_min` | `EXTENDED` | Basic clinical vital sign. Measured during physical examination. | Low-Moderate (Extended Clinical) |
| 11 | `Hb(g/dl)` | `hb_g_dl` | `EXTENDED` | Basic routine Complete Blood Count (CBC) parameter. Accessible from routine annual health checks. Anemia is a common differential/comorbidity with menorrhagia. | Moderate (Extended Clinical) |
| 12 | `Cycle(R/I)` | `cycle_ri` | `CORE` | Patient-reported menstrual regularity (Regular vs Irregular). Oligomenorrhea/amenorrhea is a cornerstone clinical symptom of anovulation in PCOS. | Critical (Core Menstrual) |
| 13 | `Cycle length(days)` | `cycle_length_days` | `CORE` | Duration of menses / cycle bleeding length. Easily tracked and reported by patients via calendar or period tracking apps. | High (Core Menstrual) |
| 14 | `Marraige Status (Yrs)` | `marriage_status_years` | `CORE` | Demographic / reproductive history duration. Readily reportable by the patient. Relevant context for infertility screening duration. | Moderate (Core Demographic) |
| 15 | `Pregnant(Y/N)` | `pregnant_yn` | `CORE` | Patient reproductive status / pregnancy history. Readily known by the patient. | Moderate (Core Reproductive) |
| 16 | `No. of aborptions` | `no_of_abortions` | `CORE` | Obstetric history of miscarriage/abortion. Known by patient; recurrent pregnancy loss is associated with hyperandrogenism and luteal insufficiency in PCOS. | Moderate (Core Reproductive) |
| 17 | `  I   beta-HCG(mIU/mL)` | `beta_hcg_i` | `FULL_CLINICAL` | Specialized serum laboratory assay for human chorionic gonadotropin. Used in fertility clinics to evaluate pregnancy status; not a primary screening marker for PCOS. | Low (Benchmark Only) |
| 18 | `II    beta-HCG(mIU/mL)` | `beta_hcg_ii` | `FULL_CLINICAL` | Sequential repeat pregnancy test. 57.5% duplicate of Test I per hospital data collection protocol. | Low (Benchmark Only) |
| 19 | `FSH(mIU/mL)` | `fsh_miu_ml` | `FULL_CLINICAL` | Specialized serum pituitary gonadotropin lab test. Requires venipuncture and laboratory processing. Used in secondary diagnostic workup. | High (Benchmark Hormonal) |
| 20 | `LH(mIU/mL)` | `lh_miu_ml` | `FULL_CLINICAL` | Specialized serum pituitary gonadotropin lab test. Requires venipuncture. Elevated LH/FSH ratio is classic endocrine hallmark of PCOS. | High (Benchmark Hormonal) |
| 21 | `FSH/LH` | `fsh_lh_ratio` | `FULL_CLINICAL` | Derived endocrine ratio. Requires laboratory hormone panel. | High (Benchmark Hormonal) |
| 22 | `Hip(inch)` | `hip_inch` | `EXTENDED` | Anthropometric body circumference. Requires measuring tape; often measured during clinical consultation. | Moderate (Extended Anthropometric) |
| 23 | `Waist(inch)` | `waist_inch` | `EXTENDED` | Anthropometric body circumference. Central/visceral adiposity indicator; measured during clinical examination. | High (Extended Anthropometric) |
| 24 | `Waist:Hip Ratio` | `waist_hip_ratio` | `EXTENDED` | Anthropometric ratio measuring android vs gynoid fat distribution. Clinical proxy for visceral adiposity and metabolic risk. | High (Extended Anthropometric) |
| 25 | `TSH (mIU/L)` | `tsh_miu_l` | `FULL_CLINICAL` | Thyroid hormone blood test. Used clinically to rule out thyroid dysfunction as an etiology of menstrual irregularity. | Moderate (Benchmark Hormonal) |
| 26 | `AMH(ng/mL)` | `amh_ng_ml` | `FULL_CLINICAL` | Anti-Müllerian Hormone. Specialized ovarian reserve blood test produced by pre-antral granulosa cells. Strongly elevated in PCOS. | High (Benchmark Hormonal) |
| 27 | `PRL(ng/mL)` | `prl_ng_ml` | `FULL_CLINICAL` | Serum prolactin blood test. Used to rule out hyperprolactinemia in anovulatory patients. | Moderate (Benchmark Hormonal) |
| 28 | `Vit D3 (ng/mL)` | `vit_d3_ng_ml` | `FULL_CLINICAL` | 25-OH Vitamin D blood test. Specialized nutritional laboratory assay. | Low-Moderate (Benchmark Lab) |
| 29 | `PRG(ng/mL)` | `prg_ng_ml` | `FULL_CLINICAL` | Serum progesterone blood test. Luteal phase hormonal marker for confirming ovulation. | Moderate (Benchmark Hormonal) |
| 30 | `RBS(mg/dl)` | `rbs_mg_dl` | `EXTENDED` | Random Blood Sugar. Routine fingerstick or basic lab test accessible at primary care level or home glucometer. Reflects glycemic dysregulation. | Moderate (Extended Clinical) |
| 31 | `Weight gain(Y/N)` | `weight_gain_yn` | `CORE` | Patient-reported symptom of rapid or unexplained weight gain. Direct clinical manifestation of metabolic syndrome and insulin resistance. | High (Core Symptom) |
| 32 | `hair growth(Y/N)` | `hair_growth_yn` | `CORE` | Patient-reported symptom of excess facial/body hair (clinical hirsutism). Hallmark clinical sign of hyperandrogenism (one of Rotterdam criteria). | Critical (Core Symptom) |
| 33 | `Skin darkening (Y/N)` | `skin_darkening_yn` | `CORE` | Patient-reported symptom of velvety skin darkening in body folds (acanthosis nigricans). Highly specific cutaneous marker of severe insulin resistance. | Critical (Core Symptom) |
| 34 | `Hair loss(Y/N)` | `hair_loss_yn` | `CORE` | Patient-reported symptom of female pattern scalp hair thinning (androgenic alopecia). Manifestation of androgen excess. | High (Core Symptom) |
| 35 | `Pimples(Y/N)` | `pimples_yn` | `CORE` | Patient-reported symptom of persistent inflammatory acne. Clinical sign of hyperandrogenemia and increased sebum production. | High (Core Symptom) |
| 36 | `Fast food (Y/N)` | `fast_food_yn` | `CORE` | Patient-reported dietary habit (frequent fast food intake). Reflects lifestyle factors contributing to metabolic dysfunction and insulin resistance. | Moderate (Core Lifestyle) |
| 37 | `Reg.Exercise(Y/N)` | `reg_exercise_yn` | `CORE` | Patient-reported physical activity lifestyle indicator. Sedentary lifestyle correlates with increased PCOS severity and insulin resistance. | Moderate (Core Lifestyle) |
| 38 | `BP _Systolic (mmHg)` | `bp_systolic_mmhg` | `EXTENDED` | Clinical blood pressure measurement using sphygmomanometer/cuff. Reflects cardiovascular and metabolic strain. | Moderate (Extended Clinical) |
| 39 | `BP _Diastolic (mmHg)` | `bp_diastolic_mmhg` | `EXTENDED` | Clinical blood pressure measurement using sphygmomanometer/cuff. | Moderate (Extended Clinical) |
| 40 | `Follicle No. (L)` | `follicle_no_l` | `POTENTIAL_LEAKAGE` / `FULL_CLINICAL` | Left ovary antral follicle count via transvaginal ultrasound. **Direct Rotterdam diagnostic criterion** (>=12 follicles). Excluded from Core/Extended due to target leakage. | Leakage in Core / Benchmark in Full |
| 41 | `Follicle No. (R)` | `follicle_no_r` | `POTENTIAL_LEAKAGE` / `FULL_CLINICAL` | Right ovary antral follicle count via ultrasound. **Direct Rotterdam diagnostic criterion** (>=12 follicles). Strongest correlation with label ($r=0.65$). Excluded from Core/Extended. | Leakage in Core / Benchmark in Full |
| 42 | `Avg. F size (L) (mm)` | `avg_f_size_l_mm` | `FULL_CLINICAL` | Pelvic ultrasound follicle diameter measurement. Requires specialized radiologist / sonographer imaging. | Moderate (Benchmark Ultrasound) |
| 43 | `Avg. F size (R) (mm)` | `avg_f_size_r_mm` | `FULL_CLINICAL` | Pelvic ultrasound follicle diameter measurement. Requires specialized sonographer imaging. | Moderate (Benchmark Ultrasound) |
| 44 | `Endometrium (mm)` | `endometrium_mm` | `FULL_CLINICAL` | Transvaginal ultrasound measurement of endometrial lining thickness. Specialized imaging metric. | Moderate (Benchmark Ultrasound) |
| 45 | `Unnamed: 44` | `unnamed_44` | `REMOVE` | Artifact column containing 99.63% missing values and 2 stray characters. Excel artifact. | None (Must be dropped) |

---

## 3. Recommended Feature Set Tiers

### Tier 1: OvaSense CORE Feature Set (14 Features)
> **Goal**: Non-invasive, accessible screening using only patient-reportable inputs.
1. ` Age (yrs)`
2. `Weight (Kg)`
3. `Height(Cm) `
4. `BMI`
5. `Cycle(R/I)`
6. `Cycle length(days)`
7. `Marraige Status (Yrs)`
8. `Pregnant(Y/N)`
9. `No. of aborptions`
10. `Weight gain(Y/N)`
11. `hair growth(Y/N)`
12. `Skin darkening (Y/N)`
13. `Hair loss(Y/N)`
14. `Pimples(Y/N)`
15. `Fast food (Y/N)`
16. `Reg.Exercise(Y/N)`
*(Note: 16 patient-reportable variables representing Demographics, Anthropometrics, Menstrual history, Symptoms, and Lifestyle)*

### Tier 2: OvaSense EXTENDED Feature Set (24 Features)
> **Goal**: CORE features + routine, non-hormonal vital signs and basic clinical measurements accessible during a primary care checkup.
* All 16 CORE features PLUS:
17. `Blood Group`
18. `Pulse rate(bpm) `
19. `RR (breaths/min)`
20. `Hb(g/dl)`
21. `BP _Systolic (mmHg)`
22. `BP _Diastolic (mmHg)`
23. `Hip(inch)`
24. `Waist(inch)`
25. `Waist:Hip Ratio`
26. `RBS(mg/dl)`

### Tier 3: FULL CLINICAL Feature Set (39 Features)
> **Goal**: Comprehensive clinical benchmark containing all available hormonal assays and ultrasound measurements.
* All 26 EXTENDED features PLUS:
27. `FSH(mIU/mL)`
28. `LH(mIU/mL)`
29. `FSH/LH`
30. `TSH (mIU/L)`
31. `AMH(ng/mL)`
32. `PRL(ng/mL)`
33. `Vit D3 (ng/mL)`
34. `PRG(ng/mL)`
35. `  I   beta-HCG(mIU/mL)`
36. `II    beta-HCG(mIU/mL)`
37. `Avg. F size (L) (mm)`
38. `Avg. F size (R) (mm)`
39. `Endometrium (mm)`
*(With `Follicle No. (L)` and `Follicle No. (R)` evaluated in a dedicated leakage sub-experiment)*

### Features to Permanently REMOVE (3 Columns)
1. `Sl. No`
2. `Patient File No.`
3. `Unnamed: 44`
