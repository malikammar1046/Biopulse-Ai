# Feature Decision Log: Complete 45-Column Clinical & Technical Audit

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Authoritative Feature Decisions Finalized  

---

## 1. Overview & Decision Methodology

Every variable in the raw dataset (`PCOS_data_without_infertility.xlsx`, sheet `Full_new`) was evaluated across medical validity, user availability, leakage potential, algorithmic bias, and data quality.

Decisions are categorized into four operational states:
1. **Core Included**: Feature meets all criteria for its assigned tier and is included in the baseline predictive pipeline.
2. **Flagged / Sensitivity Variant**: Feature is clinically problematic or biased for general screening, but retained in an extended dataset variant for sensitivity analysis.
3. **Structured Reference Only**: Feature contains structured clinical measurements from ultrasound (TVS), but cannot be trained as an imaging model.
4. **Excluded**: Variable contains administrative identifiers, empty artifacts, or unacceptable leakage.

---

## 2. In-Depth Evaluation of Candidate Tier 1 Features (19 Features)

Candidate Tier 1 features are self-reported metrics that an individual can provide without visiting a clinic, laboratory, or undergoing clinical instrumentation.

Each candidate is evaluated across the 8 standardized questions:
- **A. Non-invasive availability**: Can the user reasonably provide this without a clinical/laboratory test?
- **B. Clinical utility**: Is the feature actually meaningful for a PCOS/PMOS assessment?
- **C. Bias risk**: Could the feature introduce demographic, reproductive, or social bias?
- **D. Consequence vs. Predictor**: Could the feature represent a consequence rather than a useful predictor?
- **E. Derivation**: Is it derived from another feature?
- **F. Data quality**: Does it have sufficient data quality?
- **G. Leakage potential**: Does it potentially create target or workflow leakage?
- **H. Final decision**: Retained / Retained but flagged / Excluded / Transformed / Derived inside preprocessing.

---

### Feature 1: ` Age (yrs)` (`age`)
- **A**: Yes. Known to all users.
- **B**: Highly meaningful. PCOS manifests during reproductive years (15–45), and phenotypic expression (e.g., hyperandrogenism vs. metabolic sequelae) shifts across age cohorts.
- **C**: Low bias. Standard demographic covariate across all populations.
- **D**: Baseline predictor; independent of PCOS onset.
- **E**: Primary feature.
- **F**: 100% complete (range 20–48 years, mean 31.4, median 31.0).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 2: `Weight (Kg)` (`weight_kg`)
- **A**: Yes. Readily measured using a standard home bathroom scale.
- **B**: Highly meaningful. Obesity and adiposity strongly correlate with insulin resistance, hyperinsulinemia, and the severity of ovulatory dysfunction in PCOS.
- **C**: Low bias; universally applicable.
- **D**: Bidirectional: weight gain is both an exacerbating risk factor and a consequence of androgen-driven metabolic deceleration.
- **E**: Primary feature; source component for BMI.
- **F**: 100% complete (range 31.0–108.0 kg, mean 59.6, median 59.0).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 3: `Height(Cm) ` (`height_cm`)
- **A**: Yes. Readily measured at home.
- **B**: Meaningful as an anthropometric normalizer for weight.
- **C**: Low bias.
- **D**: Baseline physical trait.
- **E**: Primary feature; source component for BMI.
- **F**: 100% complete (range 137.0–180.0 cm, mean 156.5, median 156.0).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 4: `BMI` (`bmi`)
- **A**: Yes. Directly calculable from self-reported height and weight: $\text{BMI} = \text{weight} / (\text{height}/100)^2$.
- **B**: Established international clinical marker for PCOS metabolic stratification (Asian population cutoff for overweight $\ge 23.0\ \text{kg/m}^2$, obese $\ge 25.0\ \text{kg/m}^2$).
- **C**: Low bias. Standard physiological index.
- **D**: Metabolic phenotype marker.
- **E**: Derived feature from `weight_kg` and `height_cm`.
- **F**: 98.89% of rows match exact formula within $\pm 0.1\ \text{kg/m}^2$. Six minor data entry rounding discrepancies exist (largest diff 1.58 at row 440).
- **G**: No leakage.
- **H**: **Retained (Core Included)**. Pipeline can recalculate deterministically to eliminate historical manual rounding errors.

### Feature 5: `Cycle(R/I)` (`cycle_regularity`)
- **A**: Yes. Self-reported menstrual regularity based on personal cycle tracking.
- **B**: **Cardinal clinical feature**. Oligomenorrhea or amenorrhea is Criterion 1 of the Rotterdam 2003 / 2023 Consensus for PCOS diagnosis. In this dataset, irregular cycles exhibit a 62.7% PCOS prevalence vs. 21.0% in regular cycles ($\chi^2 = 87.4, p < 10^{-19}$).
- **C**: Low bias; applicable to all post-menarcheal females.
- **D**: Direct clinical manifestation of chronic anovulation.
- **E**: Primary feature (coded 2=Regular, 4=Irregular, 5=Irregular outlier at row 512).
- **F**: 100% complete. Cleaned to binary (0 = Regular [code 2], 1 = Irregular [codes 4 and 5]).
- **G**: No leakage. Symptoms exist prior to diagnosis and prompt clinical evaluation.
- **H**: **Retained (Core Included)**.

### Feature 6: `Cycle length(days)` (`cycle_length_raw`)
- **A**: Yes. Self-reported menstrual duration.
- **B**: Reflects menstrual flow characteristics (scanty vs. prolonged menses).
- **C**: Low bias.
- **D**: Clinical manifestation.
- **E**: Primary feature.
- **F**: Range 0–12 days, mean 4.94, median 5.0. 92% of entries are between 2 and 7 days. Values suggest bleeding duration in days; however, authoritative metadata is absent, so semantic uncertainty is formally acknowledged.
- **G**: No leakage.
- **H**: **Retained but Flagged (Core Included)**. Formally named `cycle_length_raw` to reflect semantic uncertainty.

### Feature 7: `Marraige Status (Yrs)` (`marriage_years`)
- **A**: Yes. Self-reported social/demographic history.
- **B**: **Clinically non-specific**. Duration of marriage does not drive PCOS pathophysiology; it is recorded in infertility clinics to evaluate duration of involuntary subfertility. Point-biserial correlation is $r = +0.0163, p = 0.7061$.
- **C**: **Fairness / Generalizability Concern**. OvaSense is intended as a general screening tool for all women, including unmarried adolescents and young adults. Inapplicable to unmarried individuals.
- **D**: Confounding selection variable originating from hospital fertility clinics.
- **E**: Primary feature.
- **F**: 1 missing value (row 458).
- **G**: No target leakage, but represents institutional clinic intake selection.
- **H**: **Candidate excluded from Core Tier 1**; potential fairness/generalizability concern across unmarried cohorts; retained in `tier1_extended_dataset.csv` for sensitivity/ablation evaluation.

### Feature 8: `Pregnant(Y/N)` (`pregnant`)
- **A**: Yes. Self-reported current pregnancy status.
- **B**: **Physiological Confounder**. Active pregnancy triggers major endocrine shifts (beta-hCG, progesterone, pituitary gonadotropins) that confound diagnostic PCOS thresholds.
- **C**: Generalizability concern across pre-conceptional screening populations. Pregnant women require antenatal care, not initial PCOS screening.
- **D**: Acute physiological state.
- **E**: Primary binary.
- **F**: 100% complete (335 No, 206 Yes).
- **G**: Confounder for endocrine lab values.
- **H**: **Candidate excluded from Core Tier 1**; represents a distinct physiological state confounding endocrine baselines; retained for ablation/context evaluation.

### Feature 9: `No. of aborptions` (`abortions_count`)
- **A**: Yes. Self-reported obstetric history.
- **B**: Obstetric history metric. Not statistically associated with PCOS in this cohort ($\chi^2 = 0.865, p = 0.352$).
- **C**: Generalizability concern for nulliparous, unmarried, or younger women who have never attempted pregnancy (they will universally score 0).
- **D**: Consequence of conception complications rather than screening predictor.
- **E**: Primary count.
- **F**: 100% complete (437 zero, 104 $\ge 1$).
- **G**: No leakage.
- **H**: **Candidate excluded from Core Tier 1**; potential generalizability concern for nulliparous populations; retained in extended dataset for sensitivity/ablation evaluation.

### Feature 10: `Hip(inch)` (`hip_inch`)
- **A**: Yes. Measurable at home with a standard tape measure.
- **B**: Gynoid vs. android body fat distribution metric.
- **C**: Low bias.
- **D**: Physical anthropometric trait.
- **E**: Primary feature; denominator for Waist:Hip Ratio.
- **F**: 100% complete (range 26–48 inches, mean 38.0, median 38.0).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 11: `Waist(inch)` (`waist_inch`)
- **A**: Yes. Measurable at home with a standard tape measure.
- **B**: **Cardinal metabolic marker**. Direct surrogate for visceral abdominal fat, which drives insulin resistance and systemic low-grade inflammation in PCOS.
- **C**: Low bias.
- **D**: Physical anthropometric trait.
- **E**: Primary feature; numerator for Waist:Hip Ratio.
- **F**: 100% complete (range 24–47 inches, mean 33.8, median 34.0).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 12: `Waist:Hip Ratio` (`waist_hip_ratio`)
- **A**: Yes. Calculable from waist and hip measurements.
- **B**: Established WHO diagnostic marker for central/abdominal obesity ($\text{WHR} > 0.85$ in women indicates elevated metabolic and cardiovascular risk).
- **C**: Low bias.
- **D**: Metabolic risk indicator.
- **E**: Derived feature ($Waist / Hip$). 98.71% of rows match exact calculation within 0.0001.
- **F**: 100% complete (range 0.756–0.979, mean 0.892, median 0.895).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 13: `Weight gain(Y/N)` (`weight_gain`)
- **A**: Yes. Self-reported symptom of rapid or unexplained weight gain.
- **B**: Common clinical manifestation of insulin resistance and altered basal metabolic rate in PCOS.
- **C**: Low bias.
- **D**: Symptom consequence of metabolic dysfunction.
- **E**: Primary binary.
- **F**: 100% complete (337 No, 204 Yes; PCOS rate 61.3% in Yes vs. 15.4% in No).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 14: `hair growth(Y/N)` (`hirsutism`)
- **A**: Yes. Self-reported symptom of coarse, male-pattern facial or body hair growth.
- **B**: **Cardinal clinical feature (Rotterdam Criterion 2)**. Physical manifestation of clinical hyperandrogenism. PCOS rate is 70.3% in Yes vs. 18.6% in No ($\chi^2 = 127.9, p < 10^{-29}$).
- **C**: Low bias.
- **D**: Direct phenotypic expression of androgen excess.
- **E**: Primary binary.
- **F**: 100% complete (393 No, 148 Yes).
- **G**: No leakage. Pre-diagnostic physical sign.
- **H**: **Retained (Core Included)**.

### Feature 15: `Skin darkening (Y/N)` (`skin_darkening`)
- **A**: Yes. Self-reported symptom of velvety hyperpigmentation in neck/axillary folds (Acanthosis nigricans).
- **B**: High clinical relevance. Physical hallmark of severe hyperinsulinemia and peripheral insulin resistance.
- **C**: Low bias.
- **D**: Cutaneous consequence of insulin-stimulated keratinocyte proliferation.
- **E**: Primary binary.
- **F**: 100% complete (375 No, 166 Yes; PCOS rate 66.9% in Yes vs. 17.6% in No).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 16: `Hair loss(Y/N)` (`hair_loss`)
- **A**: Yes. Self-reported scalp hair thinning or male-pattern vertex alopecia.
- **B**: Sign of clinical hyperandrogenism caused by excess dihydrotestosterone (DHT) action on scalp hair follicles.
- **C**: Low bias.
- **D**: Consequence of androgen excess.
- **E**: Primary binary.
- **F**: 100% complete (296 No, 245 Yes).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 17: `Pimples(Y/N)` (`pimples_acne`)
- **A**: Yes. Self-reported persistent, cystic, or adult-onset acne vulgaris.
- **B**: Common dermatologic sign of sebaceous gland hyperstimulation by circulating androgens.
- **C**: Low bias.
- **D**: Physical manifestation.
- **E**: Primary binary.
- **F**: 100% complete (276 No, 265 Yes).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 18: `Fast food (Y/N)` (`fast_food`)
- **A**: Yes. Self-reported dietary habit.
- **B**: Environmental lifestyle risk factor linked to glycemic load, visceral adiposity, and metabolic endotoxemia.
- **C**: Low bias.
- **D**: Behavioral lifestyle factor.
- **E**: Primary binary.
- **F**: 1 missing value (row 156, Sl. No 157; imputed via median inside validation folds).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

### Feature 19: `Reg.Exercise(Y/N)` (`regular_exercise`)
- **A**: Yes. Self-reported physical activity habit.
- **B**: Lifestyle factor; regular exercise enhances insulin sensitivity and improves menstrual cyclicity.
- **C**: Low bias.
- **D**: Protective behavioral factor.
- **E**: Primary binary.
- **F**: 100% complete (407 No, 134 Yes).
- **G**: No leakage.
- **H**: **Retained (Core Included)**.

---

## 3. Tier 2 Candidate Features Audit (17 Features)

Tier 2 features represent clinical measurements and laboratory biomarkers obtained through physician examination or venipuncture blood draws.

| Feature Name | Clinical Meaning & Pathology | Dtype & Range | Missingness & Outliers | Leakage & Confounding Risk | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Blood Group` | ABO and Rh(D) blood typing. | `int64` (11–18) | 0 missing. Standard distribution. | No meaningful univariate association ($\chi^2 = 2.05, p = 0.957$). Adding 7 sparse categories risks overfitting. | **Candidate Excluded from Core** (Retained for Ablation) |
| `Pulse rate(bpm) ` | Resting pulse from clinical triage. | `int64` (13–82) | 0 missing. **2 non-physiological typos** (13 and 18 bpm). | Autonomic tone marker; typos must be imputed inside folds. | **Retained (Core Included)** |
| `RR (breaths/min)` | Resting respiratory rate. | `int64` (16–28) | 0 missing. Normal clinical range. | Vital sign triage baseline. | **Retained (Core Included)** |
| `Hb(g/dl)` | Hemoglobin from Complete Blood Count. | `float64` (8.5–14.8) | 0 missing. Normal clinical range. | Screens for chronic anemia vs. hemoconcentration. | **Retained (Core Included)** |
| `  I   beta-HCG(mIU/mL)` | Quantitative serum beta-hCG test 1. | `float64` (1.3–32461) | 0 missing. Highly skewed by pregnancy. | In non-pregnant women $< 5\ \text{mIU/mL}$. Confounded by pregnancy. | **Retained (Core Included)** |
| `II    beta-HCG(mIU/mL)` | Quantitative serum beta-hCG test 2. | `object` $\to$ `float64` | Typo `'1.99.'` cleaned. Duplicate of test 1 in 57.5% of cases. | High collinearity with test 1. Cleaned deterministically. | **Retained (Core Included)** |
| `FSH(mIU/mL)` | Follicle-Stimulating Hormone. | `float64` (0.21–5052) | 0 missing. **Extreme error**: 5052 mIU/mL at row 329. | Pituitary gonadotropin. Typo replaced by NaN inside pipeline. | **Retained (Core Included)** |
| `LH(mIU/mL)` | Luteinizing Hormone. | `float64` (0.02–2018) | 0 missing. **Extreme error**: 2018 mIU/mL at row 455. | Elevated in classical PCOS due to GnRH pulsatility. Typo replaced by NaN. | **Retained (Core Included)** |
| `FSH/LH` | Ratio of FSH to LH. | `float64` (0.002–1373) | Derived ratio ($FSH / LH$). Inverted in PCOS ($LH > FSH$). | Collinear with source FSH and LH. Pre-computed lab metric. | **Retained (Core Included)** |
| `TSH (mIU/L)` | Thyroid-Stimulating Hormone. | `float64` (0.04–65.0) | 0 missing. Range spans normal to hypothyroid. | Mandatory differential test to rule out thyroid disease. | **Retained (Core Included)** |
| `AMH(ng/mL)` | Anti-Müllerian Hormone. | `object` $\to$ `float64` | String typo `'a'` at row 305 parsed to NaN. | **Cardinal ovarian biomarker**. Produced by granulosa cells. | **Retained (Core Included)** |
| `PRL(ng/mL)` | Serum Prolactin. | `float64` (0.4–128.2) | 0 missing. Range spans normal to hyperprolactinemia. | Mandatory differential test to rule out prolactinoma. | **Retained (Core Included)** |
| `Vit D3 (ng/mL)` | 25-hydroxy Vitamin D3. | `float64` (0.0–6015) | **Extreme errors**: 6014.66 and 5418.60 ng/mL. | Implausible values $> 1000$ parsed to NaN for fold imputer. | **Retained (Core Included)** |
| `PRG(ng/mL)` | Serum Progesterone. | `float64` (0.05–85.0) | 0 missing. Elevated values in pregnant patients. | Assesses ovulation / luteal phase status. | **Retained (Core Included)** |
| `RBS(mg/dl)` | Random Blood Sugar (glucose). | `float64` (60–350) | 0 missing. Evaluates impaired glucose tolerance. | Evaluates metabolic dysregulation and diabetes risk. | **Retained (Core Included)** |
| `BP _Systolic (mmHg)` | Systolic blood pressure. | `int64` (12–140) | Typo: 12 mmHg at row 161 (corrected to 120 mmHg). | Cardiovascular / metabolic syndrome component. | **Retained (Core Included)** |
| `BP _Diastolic (mmHg)` | Diastolic blood pressure. | `int64` (8–100) | Typo: 8 mmHg at row 200 (corrected to 80 mmHg). | Cardiovascular / metabolic syndrome component. | **Retained (Core Included)** |

---

## 4. Tier 3 Structured Ultrasound Features Audit (5 Features)

| Feature Name | Clinical Modality | Diagnostic Role | Action & Rationale |
| :--- | :--- | :--- | :--- |
| `Follicle No. (L)` | Transvaginal Ultrasound (TVS) | Antral follicle count in left ovary ($\ge 12$ follicles is Rotterdam Criterion 3). | **Isolated to Reference Dataset**. Direct diagnostic criterion; tabular measurement, NOT image data. |
| `Follicle No. (R)` | Transvaginal Ultrasound (TVS) | Antral follicle count in right ovary. | **Isolated to Reference Dataset**. |
| `Avg. F size (L) (mm)` | Transvaginal Ultrasound (TVS) | Mean follicle diameter (left ovary). Arrested follicles measure 2–9 mm. | **Isolated to Reference Dataset**. |
| `Avg. F size (R) (mm)` | Transvaginal Ultrasound (TVS) | Mean follicle diameter (right ovary). | **Isolated to Reference Dataset**. |
| `Endometrium (mm)` | Transvaginal Ultrasound (TVS) | Endometrial thickness measured via TVS. | **Isolated to Reference Dataset**. |

---

## 5. Excluded Columns Summary

| Column Name | Category | Primary Reason for Exclusion |
| :--- | :--- | :--- |
| `Sl. No` | Identifier | Administrative serial number. High risk of spurious memorization. |
| `Patient File No.` | Identifier | Administrative patient identifier. Duplicate of Sl. No. |
| `PCOS (Y/N)` | Target | Ground truth label. Excluded from all feature matrices. |
| `Unnamed: 44` | Artifact | Empty trailing Excel column (99.6% null) with stray typographical marks. |
| `Blood Group` | Candidate Excluded from Core | No meaningful univariate association detected ($\chi^2 = 2.05, p = 0.957$). Candidate for multivariable ablation in Tier 2. |
| `Marraige Status (Yrs)` | Candidate Excluded from Core | Inapplicable to unmarried users; potential generalizability concern. Retained in extended dataset for ablation. |
| `Pregnant(Y/N)` | Candidate Excluded from Core | Distinct physiological state that alters endocrine baselines. Retained for ablation/context analysis. |
| `No. of aborptions` | Candidate Excluded from Core | Inapplicable to nulliparous users; potential generalizability concern. Retained in extended dataset for ablation. |
