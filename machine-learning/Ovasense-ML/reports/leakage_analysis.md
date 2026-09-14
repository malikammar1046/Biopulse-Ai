# OvaSense-ML — Target Leakage & Clinical Boundary Analysis

**Project**: OvaSense Standalone PCOS Risk-Screening Machine Learning  
**Date**: August 2026  
**Document Purpose**: In-depth analysis of target leakage, diagnostic confounding, and clinical feature validity to ensure that the OvaSense ML models learn genuine predictive relationships rather than circular definitions of the diagnostic label.

---

## 1. Defining Target Leakage in Clinical Risk Screening

In medical machine learning, **target leakage** occurs when a predictor variable includes information that directly reveals or was used to assign the ground-truth target label, but would not be legitimately available or appropriate at the intended time of model inference.

The clinical objective of OvaSense is:
> **To estimate PCOS risk in a pre-clinical or primary screening context using accessible, non-invasive patient inputs, BEFORE expensive pelvic ultrasound or specialized hormonal blood tests are ordered.**

If a model relies on measurements that can only be obtained through the formal diagnostic procedure itself (e.g. transvaginal ultrasound follicle counts), the model ceases to be a useful screening tool and becomes a redundant, circular predictor.

---

## 2. Deep-Dive: Ultrasound Follicle Counts (`Follicle No. (L)` & `Follicle No. (R)`)

### Clinical Background: The Rotterdam Consensus (2003 / 2018 Update)
Under international clinical guidelines (Rotterdam Consensus), a diagnosis of PCOS requires at least 2 of the following 3 criteria:
1. **Oligo- or Anovulation** (irregular or absent menses)
2. **Clinical and/or Biochemical Hyperandrogenism** (hirsutism, acne, alopecia, or elevated serum androgens)
3. **Polycystic Ovarian Morphology (PCOM) on Ultrasound** (defined as $\ge 12$ follicles measuring 2–9 mm in diameter per ovary, or ovarian volume $> 10$ mL).

### Evidence of Direct Diagnostic Leakage in the Dataset
* Correlation with `PCOS (Y/N)`:
  * `Follicle No. (R)`: $r = +0.648$ (Rank #1 highest correlated feature in the entire dataset)
  * `Follicle No. (L)`: $r = +0.603$ (Rank #2 highest correlated feature in the entire dataset)
* Distribution Analysis:
  * In non-PCOS patients ($Y=0$): Mean follicle count is $3.2$ (Left) and $3.5$ (Right).
  * In PCOS patients ($Y=1$): Mean follicle count is $12.1$ (Left) and $13.1$ (Right).
  * Virtually every patient with $\ge 12$ follicles in either ovary was assigned the label `PCOS (Y/N) = 1`.

### Verdict & Protocol
* **OvaSense Core Model**: **STRICTLY EXCLUDED**. A user using a screening app at home does not have pelvic ultrasound follicle counts.
* **OvaSense Extended Model**: **STRICTLY EXCLUDED**.
* **Full Clinical Benchmark Model**: Evaluated in two distinct variants:
  * Variant A: Full Clinical *without* raw follicle counts (to evaluate pure lab biomarkers).
  * Variant B: Full Clinical *with* follicle counts (to demonstrate the theoretical upper bound of diagnostic replication).

---

## 3. Deep-Dive: The Beta-HCG Investigation (`I beta-HCG` vs `II beta-HCG`)

The raw dataset contains two distinct Beta-hCG columns:
* `  I   beta-HCG(mIU/mL)`
* `II    beta-HCG(mIU/mL)`

### Clinical & Dataset Investigation Findings
1. **Dataset Collection Instruction #10**:
   The `Instructions` sheet in `PCOS_data_without_infertility.xlsx` explicitly states:
   > *"Beta-HCG cases are mentioned as Case I and II , repeat the previous one if only one exist."*
2. **Duplication Rate**:
   * Exactly **311 out of 541 patients (57.5%)** have identical numerical values in `I beta-HCG` and `II beta-HCG`.
   * The correlation between `I beta-HCG` and `II beta-HCG` is $r = 0.534$ (attenuated only by a few extreme pregnancy values and transcription typos like `'1.99.'`).
3. **Clinical Interpretation**:
   * Human Chorionic Gonadotropin (beta-hCG) is a pregnancy hormone secreted by the syncytiotrophoblast. It is **not** a pathophysiological biomarker for PCOS.
   * In infertility and fertility clinics, serial beta-hCG is drawn 48–72 hours apart (Case I vs Case II) to assess embryo implantation and viable intrauterine pregnancy.
   * In non-pregnant women, baseline beta-hCG is $< 2.0$ mIU/mL (which appears in the dataset as `1.99` mIU/mL in 307 patients).
4. **Correlation with PCOS**:
   * `I beta-HCG` correlation with PCOS: $r = -0.028$ (essentially zero correlation).
   * `II beta-HCG` correlation with PCOS: $r = -0.025$.

### Verdict & Protocol
* `I beta-HCG` and `II beta-HCG` do **NOT** represent independent biological predictors.
* They represent clinic workflow artifacts from fertility patient intake.
* **Core & Extended Models**: **STRICTLY EXCLUDED**.
* **Full Clinical Model**: If retained for benchmark completeness, only a single baseline measurement or maximum value should be used, or both excluded to prevent artificial dimensionality expansion.

---

## 4. Other Candidate Features: Legitimate Signal vs Confounders

| Feature | Correlation ($r$) | Leakage Risk Assessment | Clinical Rationale & Recommendation |
|---|---|---|---|
| `AMH(ng/mL)` | $+0.264$ | **Low Leakage / High Biomarker** | Anti-Müllerian Hormone is produced by preantral follicles. While strongly elevated in PCOS, it is a blood test, not a direct definition of the label in Rotterdam 2003. Valid for **Full Clinical** model; excluded from Core/Extended. |
| `Cycle(R/I)` | $+0.402$ | **Zero Leakage / Core Predictor** | While oligo/amenorrhea is part of Rotterdam criteria, self-reported menstrual irregularity is a patient symptom that any woman can report at home. This is **legitimate predictive signal** for screening. |
| `hair growth(Y/N)` | $+0.465$ | **Zero Leakage / Core Predictor** | Patient-reported hirsutism is a primary clinical symptom of hyperandrogenism. Essential for Core screening. |
| `Skin darkening (Y/N)` | $+0.476$ | **Zero Leakage / Core Predictor** | Acanthosis nigricans is a visible cutaneous manifestation of insulin resistance. Essential for Core screening. |
| `Weight gain(Y/N)` | $+0.441$ | **Zero Leakage / Core Predictor** | Common patient-reported metabolic symptom. Essential for Core screening. |
| `FSH/LH Ratio` | $-0.018$ | **Low Leakage / Endocrine Ratio** | Pituitary hormone ratio. Valid for **Full Clinical** model; excluded from Core/Extended. |
| `Endometrium (mm)` | $+0.107$ | **Ultrasound Measurement** | Endometrial thickness measured on ultrasound. Valid for **Full Clinical** model; excluded from Core/Extended. |

---

## 5. Summary of Leakage Prevention Protocols

1. **Strict Feature Partitioning**: No ultrasound or specialized endocrine variables are permitted inside the OvaSense Core or Extended training sets.
2. **Pipeline Encapsulation**: All scaling, missing value imputation, and encoding operations will be strictly fitted on training folds within Stratified Cross-Validation pipelines.
3. **Screening Validity**: By eliminating circular diagnostic variables, OvaSense Core evaluates true clinical screening utility.
