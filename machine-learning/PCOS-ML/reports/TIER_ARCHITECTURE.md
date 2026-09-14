# Tier Architecture & Progressive Assessment Design

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Authoritative Architecture Finalized  

---

## 1. Architectural Philosophy: Progressive Evidence Incorporation

In clinical medicine, a diagnostic workup is rarely a one-shot process. A patient first presents with self-perceived symptoms and personal history, followed by targeted physical examination and clinical laboratory testing, and finally specialized diagnostic imaging if indicated.

OvaSense translates this medical paradigm directly into a **3-Tier Progressive Machine Learning Assessment Architecture**:

```
+-----------------------------------------------------------------------------------+
|                                 TIER 1 ASSESSMENT                                 |
|                                                                                   |
|  16 Self-Reported Features (Non-Invasive, Free, Home Scale, Cycle History)        |
|                                         |                                         |
|                                         v                                         |
|                                  [Tier 1 Model]                                   |
|                                         |                                         |
|                                         v                                         |
|                         Initial Pre-Clinical Risk Estimate                        |
+-----------------------------------------------------------------------------------+
                                          |
                                          | User visits clinic / uploads lab panel
                                          v
+-----------------------------------------------------------------------------------+
|                                 TIER 2 ASSESSMENT                                 |
|                                                                                   |
|  TIER 1 (16 Features) + TIER 2 CLINICAL/LABORATORY (16 Features) = 32 Features    |
|  (Vital Signs + CBC + Pituitary/Ovarian Hormones + Metabolic Glucose)             |
|                                         |                                         |
|                                         v                                         |
|                                  [Tier 2 Model]                                   |
|                                         |                                         |
|                                         v                                         |
|                         Refined Clinical Risk Probability                         |
+-----------------------------------------------------------------------------------+
                                          |
                                          | Clinician performs Pelvic Ultrasound (TVS)
                                          v
+-----------------------------------------------------------------------------------+
|                        TIER 3 MULTI-MODAL FUSION (FUTURE)                         |
|                                                                                   |
|  Tabular Evidence (Tier 1 + Tier 2) + Raw Ultrasound Scan Images (CNN / ViT)      |
|                                         |                                         |
|                                         v                                         |
|                                [Multi-Modal Model]                                |
|                                         |                                         |
|                                         v                                         |
|                        Definitive Comprehensive Evaluation                        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Tier 1 — Self-Reported / Non-Invasive Assessment

### 2.1 Clinical Purpose & User Journey
Tier 1 functions as a freely accessible, pre-clinical screening instrument embedded in the OvaSense application. It allows any woman to assess her risk profile in under two minutes without requiring a physician appointment, phlebotomy, or clinical instrumentation.

### 2.2 Strict Inclusion Constraints
A feature qualifies for Tier 1 **if and only if**:
1. It requires no clinical staff, diagnostic equipment, venipuncture, or imaging.
2. It can be answered accurately from user memory, home anthropometrics (scale, tape), or symptom observation.
3. It does not introduce demographic or reproductive bias against unmarried or nulliparous individuals.

### 2.3 Core Tier 1 Feature Inventory (16 Features)

| Clean Feature Name | Clinical Domain | Measurement Modality |
| :--- | :--- | :--- |
| `age` | Demographics | Patient self-report (years) |
| `weight_kg` | Anthropometry | Home scale (kg) |
| `height_cm` | Anthropometry | Self-report (cm) |
| `bmi` | Anthropometry | Calculable: $\text{weight} / (\text{height}/100)^2$ |
| `cycle_regularity` | Menstrual History | Self-report (0 = Regular, 1 = Irregular) |
| `cycle_length_raw` | Menstrual History | Duration of bleeding flow days (0–12 days) |
| `hip_inch` | Anthropometry | Home measuring tape (inches) |
| `waist_inch` | Anthropometry | Home measuring tape (inches) |
| `waist_hip_ratio` | Anthropometry | Calculable: $\text{waist} / \text{hip}$ |
| `weight_gain` | Clinical Symptoms | Binary symptom observation (Y/N) |
| `hirsutism` | Clinical Symptoms | Excess facial/body hair (Y/N) |
| `skin_darkening` | Clinical Symptoms | Acanthosis nigricans observation (Y/N) |
| `hair_loss` | Clinical Symptoms | Scalp hair thinning / alopecia (Y/N) |
| `pimples_acne` | Clinical Symptoms | Persistent acne / pimples (Y/N) |
| `fast_food` | Lifestyle / Habits | Fast food consumption habit (Y/N) |
| `regular_exercise` | Lifestyle / Habits | Physical exercise routine (Y/N) |

---

## 3. Tier 2 — Progressive Clinical & Laboratory Enhancement

### 3.1 The Golden Architecture Rule
> [!IMPORTANT]
> **Tier 2 is NOT an independent model trained only on laboratory variables.**  
> A laboratory test result is only interpretable in the context of patient symptoms, cycle history, and physical habitus.  
> Therefore:  
> $$\text{Tier 2 Feature Matrix} = \text{Tier 1 Core Features (16)} + \text{Tier 2 Clinical/Laboratory Features (16)} = \mathbf{32\ \text{Features}}$$

Training Tier 2 on laboratory variables alone would discard all symptom and cycle history, violating clinical decision-making principles and creating two disjoint, uncomparable models.

### 3.2 Additional Tier 2 Feature Inventory (16 Features)

| Clean Feature Name | Clinical Domain | Biological Function / Diagnostic Role |
| :--- | :--- | :--- |
| `pulse_rate_bpm` | Clinical Vitals | Resting heart rate; autonomic tone marker (cleaned) |
| `respiratory_rate` | Clinical Vitals | Resting respiratory rate |
| `hemoglobin` | Hematology (CBC) | Hemoglobin concentration (g/dL) |
| `beta_hcg_i` | Serum Hormone | Initial serum beta-hCG test (mIU/mL) |
| `beta_hcg_ii` | Serum Hormone | Repeat serum beta-hCG test (mIU/mL) |
| `fsh` | Pituitary Gonadotropin | Follicle-Stimulating Hormone (mIU/mL) |
| `lh` | Pituitary Gonadotropin | Luteinizing Hormone (mIU/mL); elevated in PCOS |
| `fsh_lh_ratio` | Hormone Ratio | Calculated ratio ($FSH / LH$); inverted in classical PCOS |
| `tsh` | Thyroid Function | Thyroid-Stimulating Hormone; rules out hypothyroidism |
| `amh` | Ovarian Biomarker | Anti-Müllerian Hormone; surrogate for ovarian reserve |
| `prolactin` | Pituitary Hormone | Prolactin; differential rule-out for hyperprolactinemia |
| `vitamin_d3` | Biomarker / Vitamin | 25-OH Vitamin D3 (ng/mL); metabolic cofactor |
| `progesterone` | Ovarian Steroid | Serum progesterone; ovulation confirmation |
| `rbs` | Metabolic Biomarker | Random Blood Sugar (mg/dL); glycemic control |
| `bp_systolic` | Clinical Vitals | Systolic blood pressure (mmHg; cleaned) |
| `bp_diastolic` | Clinical Vitals | Diastolic blood pressure (mmHg; cleaned) |

---

## 4. Tier 3 — Ultrasound / Imaging Status & Future Roadmap

### 4.1 Current Dataset Status: Structured Reference Only
The current primary dataset contains **5 structured ultrasound measurements** derived from transvaginal ultrasound (TVS) examinations:
1. `follicle_no_l`: Antral follicle count in left ovary.
2. `follicle_no_r`: Antral follicle count in right ovary.
3. `avg_f_size_l`: Mean follicle diameter (left ovary) in mm.
4. `avg_f_size_r`: Mean follicle diameter (right ovary) in mm.
5. `endometrium_mm`: Endometrial stripe thickness in mm.

> [!CAUTION]
> **Defensibility Mandate**: These 5 columns are structured numeric tabular metrics, **NOT ultrasound B-mode scan image pixels**.  
> Therefore, we formally document:  
> **"Tier 3 cannot currently be trained as an imaging model from this dataset."**  
> We have isolated these features into `data/tiered/tier3_structured_reference.csv` for clinical documentation and comparison, but under no circumstances will we claim to have trained an image-based Tier 3 model.

### 4.2 Future Tier 3 Multi-Modal Fusion Architecture
When a verified ultrasound image repository (e.g., Choudhari's B-mode ovarian scan benchmark) is integrated, the fusion architecture will follow:

$$\hat{y}_{\text{Tier 3}} = \sigma\left( \mathbf{w}_T^T \mathbf{z}_{\text{tabular}} + \mathbf{w}_I^T \mathbf{z}_{\text{imaging}} + b \right)$$

Where:
- $\mathbf{z}_{\text{tabular}} = f_{\text{MLP}}(\mathbf{x}_{\text{Tier 1}}, \mathbf{x}_{\text{Tier 2}})$ represents the dense latent embedding of the tabular clinical/hormonal state.
- $\mathbf{z}_{\text{imaging}} = g_{\text{CNN/ViT}}(\mathbf{I}_{\text{ultrasound}})$ represents deep visual features extracted from ovarian cross-sectional ultrasound scans.
- Fusion occurs at the latent representation layer, **NOT via naive averaging of output probabilities**.

---

## 5. Architectural Verification Check
The automated script `src/verify_pipeline.py` enforces:
1. `tier1_dataset.csv`: Contains exactly 16 features + 1 target = 17 columns.
2. `tier2_dataset.csv`: Contains exactly 32 features + 1 target = 33 columns.
3. Zero Tier 2 or Tier 3 columns exist in Tier 1.
4. All 16 Tier 1 features are strictly preserved in Tier 2.
5. Administrative IDs and empty artifacts are 100% purged from all tiers.
