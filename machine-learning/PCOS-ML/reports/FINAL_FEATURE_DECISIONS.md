# Final Feature Decisions & Diagnostic Criteria Overlap Audit

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Status**: Authoritative Feature Decisions & Criteria Mapping Finalized  

---

## 1. Multi-Dimensional Decision Framework

To prevent premature feature elimination based on univariate metrics alone, every feature is evaluated across five clinical and technical axes:
- **A. Clinical Appropriateness**: Does the feature reflect the pathophysiology of PCOS or the patient's presentation context?
- **B. Availability**: Can the target end-user (pre-clinical screener vs. clinical triage) obtain or provide this information without undue burden?
- **C. Fairness / Generalizability Risk**: Could the feature behave unreliably across sub-populations (e.g., unmarried, adolescent, or nulliparous individuals)?
- **D. Predictive Usefulness (Hypothesized)**: Does the feature offer non-linear or multivariable predictive potential in tree ensembles or linear models?
- **E. Potential Confounding**: Does the feature introduce physiological or workflow confounding (e.g., gestational hormone shifts)?

---

## 2. Structured Assessment of Disputed Candidate Features

### 2.1 `Marraige Status (Yrs)` (`marriage_years`)
- **A. Clinical Appropriateness**: Non-causal social metric. Marriage duration does not drive PCOS etiology; it is recorded in infertility clinics to evaluate duration of involuntary subfertility.
- **B. Availability**: Freely reportable by married users, but inapplicable to unmarried users.
- **C. Fairness / Generalizability Risk**: **High generalizability concern**. In OvaSense, users include young adolescents and unmarried university students. Requiring marriage duration creates an institutional selection bias inherited from hospital fertility clinics.
- **D. Predictive Usefulness**: Weak univariate correlation ($r = +0.0163, p = 0.7061$); multivariable utility remains to be tested in ablation.
- **E. Potential Confounding**: Reflects clinic referral patterns rather than PCOS pathology.
- **Final Classification**: **Candidate excluded from Core Tier 1 screening model; potential fairness/generalizability concern across unmarried cohorts; retained in `tier1_extended_dataset.csv` for sensitivity/ablation evaluation.**

### 2.2 `Pregnant(Y/N)` (`pregnant`)
- **A. Clinical Appropriateness**: Non-diagnostic clinical state. PCOS guidelines (Rotterdam, ASRM/ESHRE 2023) apply to non-pregnant females. Active pregnancy triggers acute endocrine shifts.
- **B. Availability**: Self-reportable by users with known pregnancy status.
- **C. Fairness / Generalizability Risk**: Generalizability concern across pre-conceptional screening populations.
- **D. Predictive Usefulness**: Weak univariate association ($\chi^2 = 0.4144, p = 0.5197$; 31.07% PCOS in pregnant vs. 33.73% in non-pregnant).
- **E. Potential Confounding**: **Severe physiological confounding**. Gestation alters beta-hCG, progesterone, FSH, and LH, potentially causing models to learn gestational patterns rather than PCOS risk.
- **Final Classification**: **Candidate excluded from Core Tier 1 screening model; represents distinct physiological state confounding endocrine baselines; retained for sensitivity/ablation evaluation.**

### 2.3 `No. of aborptions` (`abortions_count`)
- **A. Clinical Appropriateness**: Obstetric history metric. While recurrent miscarriage is associated with metabolic/endocrine dysfunction, it is not an initial diagnostic criterion.
- **B. Availability**: Self-reportable by individuals who have conceived.
- **C. Fairness / Generalizability Risk**: **High generalizability concern**. Nulliparous and unmarried women will universally have a count of 0, which does not confer lower risk of PCOS.
- **D. Predictive Usefulness**: Weak univariate association ($\chi^2 = 0.8652, p = 0.3523$; 36.54% PCOS in $\ge 1$ abortion vs. 31.81% in 0 abortions).
- **E. Potential Confounding**: Confounded by age and parity.
- **Final Classification**: **Candidate excluded from Core Tier 1 screening model; potential generalizability concern for nulliparous populations; retained in extended dataset for sensitivity/ablation evaluation.**

### 2.4 `Blood Group` (`blood_group`)
- **A. Clinical Appropriateness**: Hematologic antigen phenotype (ABO/Rh). No established biological mechanism connects ABO antigens to hyperandrogenism or follicular arrest.
- **B. Availability**: Requires laboratory serology, though often recalled from donor cards.
- **C. Fairness / Generalizability Risk**: Low demographic risk, but adds 7 degrees of freedom of sparse categories.
- **D. Predictive Usefulness**: Weak univariate association ($\chi^2 = 2.0488, p = 0.9571$). Multivariable utility to be tested in ablation.
- **E. Potential Confounding**: Minimal confounding, but risk of overfitting on small samples ($N = 541$).
- **Final Classification**: **Candidate excluded from Core Tier 2 model; no meaningful univariate association detected; candidate for multivariable ablation in Tier 2.**

---

## 3. Comprehensive Diagnostic Criteria Overlap & Circularity Audit

To ensure academic and viva defensibility, we distinguish **Screening Information** (patient-observed symptoms and baseline anthropometrics) from **Diagnostic Confirmation Information** (physician-administered diagnostic criteria).

Under the international Rotterdam consensus, PCOS diagnosis requires at least two of:
1. **Oligo- or Anovulation** (manifested clinically as irregular menstruation).
2. **Hyperandrogenism** (clinical hirsutism/acne/alopecia, or biochemical elevated androgens).
3. **Polycystic Ovaries on Ultrasound** ($\ge 12$ follicles measuring 2–9 mm per ovary or ovarian volume $> 10\ \text{mL}$).

| Feature Name | Direct Diagnostic Criterion? | Indirect Diagnostic Evidence? | Pre-Diagnostic Symptom? | Potential Circularity Risk? | Recommended Tier | Final Decision |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `Cycle(R/I)` | **Yes (Criterion 1)** | — | **Yes** | Low (Symptom exists before clinical visit) | Tier 1 | **Core Included** (Valid screening symptom) |
| `Cycle length(days)` | No | Yes (Bleeding flow duration) | **Yes** | Low | Tier 1 | **Core Included** (Named `cycle_length_raw`) |
| `hair growth(Y/N)` | **Yes (Criterion 2)** | — | **Yes** | Low (Visible physical sign) | Tier 1 | **Core Included** (Valid clinical sign of hirsutism) |
| `Pimples(Y/N)` | **Yes (Criterion 2)** | — | **Yes** | Low | Tier 1 | **Core Included** (Clinical hyperandrogenism sign) |
| `Hair loss(Y/N)` | **Yes (Criterion 2)** | — | **Yes** | Low | Tier 1 | **Core Included** (Androgenic alopecia sign) |
| `Skin darkening` | No | Yes (Acanthosis nigricans / Insulin Resistance) | **Yes** | Low | Tier 1 | **Core Included** (Metabolic physical sign) |
| `Weight gain` | No | Yes (Metabolic decelerator) | **Yes** | Low | Tier 1 | **Core Included** (Metabolic symptom) |
| `Age` | No | No (Baseline demographic) | Yes | None | Tier 1 | **Core Included** |
| `Weight` & `Height` | No | No (Anthropometry) | Yes | None | Tier 1 | **Core Included** |
| `BMI` | No | Yes (Metabolic risk indicator) | Yes | None | Tier 1 | **Core Included** (Calculated deterministically) |
| `Waist` & `Hip` | No | Yes (Visceral fat distribution) | Yes | None | Tier 1 | **Core Included** |
| `Waist:Hip Ratio` | No | Yes (WHO cardiovascular/metabolic risk) | Yes | None | Tier 1 | **Core Included** (Calculated deterministically) |
| `Fast food` & `Exercise` | No | No (Lifestyle factors) | Yes | None | Tier 1 | **Core Included** |
| `Pulse rate` & `RR` | No | No (Clinical triage vitals) | No | None | Tier 2 | **Core Included** (Vitals, cleaned) |
| `BP Systolic & Diastolic` | No | Yes (Metabolic syndrome component) | No | None | Tier 2 | **Core Included** (Vitals, cleaned) |
| `Hb(g/dl)` | No | No (Hematology baseline) | No | None | Tier 2 | **Core Included** |
| `AMH(ng/mL)` | **Yes (2023 Guideline Proxy for Criterion 3)** | Yes (Surrogate for antral follicle pool) | No | **Moderate** (Recognized proxy for ultrasound) | Tier 2 | **Core Included** (Key laboratory biomarker) |
| `FSH` & `LH` | No | Yes (Pituitary gonadotropins) | No | Low | Tier 2 | **Core Included** (Endocrine evaluation) |
| `FSH/LH Ratio` | No | Yes (LH:FSH inversion) | No | Low (Collinear with source hormones) | Tier 2 | **Core Included** (Candidate for ablation) |
| `TSH` & `PRL` | No | Yes (Mandatory differential rule-out tests) | No | None (Differential diagnosis tests) | Tier 2 | **Core Included** |
| `RBS(mg/dl)` | No | Yes (Metabolic glucose tolerance) | No | None | Tier 2 | **Core Included** |
| `I & II beta-HCG` | No | No (Pregnancy test marker) | No | **High (Gestational confounder)** | Tier 2 | **Core Included** (Candidate for ablation) |
| `Progesterone` | No | Yes (Luteal / Ovulation marker) | No | **High (Gestational/phase confounder)** | Tier 2 | **Core Included** (Candidate for ablation) |
| `Follicle No. (L/R)` | **Yes (Criterion 3)** | — | No | **Severe (Direct diagnostic criterion)** | Tier 3 | **Structured Reference Only** (Excluded from T1/T2) |
| `Avg. F size (L/R)` | No | Yes (Follicular arrest 2–9 mm) | No | **Severe (Ultrasound measurement)** | Tier 3 | **Structured Reference Only** (Excluded from T1/T2) |
| `Endometrium (mm)` | No | Yes (TVS endometrial lining) | No | **Severe (Ultrasound measurement)** | Tier 3 | **Structured Reference Only** (Excluded from T1/T2) |

---

## 4. Screening Information vs. Diagnostic Confirmation

> [!IMPORTANT]
> **Defensibility Distinction**:
> - **Screening Information (Tier 1 & Tier 2)**: Observational symptoms (irregular bleeding, hirsutism, acne) and general laboratory indicators (AMH, LH/FSH, fasting glucose). These identify individuals who exhibit manifestations of anovulation or androgen excess and require medical follow-up.
> - **Diagnostic Confirmation Information (Tier 3)**: Formal TVS follicular counts ($\ge 12$ follicles) and exhaustive exclusion of non-classical congenital adrenal hyperplasia, Cushing's, and androgen-secreting tumors.
> 
> Keeping TVS follicle counts out of Tier 1 and Tier 2 prevents circular evaluation, ensuring that OvaSense models pre-diagnostic risk rather than post-diagnostic verification.
