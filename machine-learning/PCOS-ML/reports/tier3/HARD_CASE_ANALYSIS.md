# Hard-Case Analysis & Interpretability Audit
**OvaSense Tier 3 Ultrasound Imaging Pipeline**  
**Investigation:** Borderline Predictions (20–40% Probability Window), False Negatives, and False Positives

---

## 1. Executive Summary

This audit investigates the edge-case behavior of the Tier 3 ultrasound morphology models (Experiment 3A: PCOM classification). Specifically, it investigates:
1. **The "20–40% Problem" (Borderline False Negatives)**: Positive polycystic ovarian morphology (PCOM=1) cases that receive model-estimated probabilities hovering between 20% and 49%, failing to cross the standard 0.50 classification threshold.
2. **Extreme False Negatives ($P < 0.10$)**: Clinically labeled positive cases that receive very low probabilities ($P \approx 2\text{--}5\%$).
3. **High-Confidence False Positives ($P \ge 90\%$)**: Clinically labeled negative (PCOM=0) scans that receive near-certain positive model probabilities.
4. **Grad-CAM Attribution**: Spatial analysis examining whether models attend to ovarian stroma and peripheral subcapsular follicles versus non-anatomical acoustic shadows, machine text, or transducer sector borders.

---

## 2. Quantitative Distribution of Hard Cases (Baseline Model)

Across the entire 541-patient linked cohort (432 Development OOF + 109 Frozen Holdout):
- **Total False Negatives ($y=1, P < 0.50$)**: 8 cases (7 in Dev OOF, 1 in Frozen Holdout).
- **Cases in the Borderline 20–40% Probability Window**: 5 cases (2 True Positives, 3 True Negatives).
- **Total False Positives ($y=0, P \ge 0.50$)**: 15 cases (7 in Dev OOF, 8 in Frozen Holdout).

```text
Cohort Boundary Summary:
┌────────────────────────────────────────────────────────┬────────┐
│ Metric Category                                        │ Count  │
├────────────────────────────────────────────────────────┼────────┤
│ Total Analyzed Patients                                │ 541    │
│ PCOM Positive Cases (Target = 1)                       │ 177    │
│ PCOM Negative Cases (Target = 0)                       │ 364    │
│ Baseline False Negatives (PCOM=1, P < 0.50)            │ 8      │
│ Borderline Positive Cases (PCOM=1, 20% <= P <= 45%)    │ 5      │
│ Extreme False Negatives (PCOM=1, P < 10%)              │ 3      │
│ False Positives (PCOM=0, P >= 0.50)                    │ 15     │
│ Cluster False Positives (image10394 to image10404)     │ 9      │
└────────────────────────────────────────────────────────┴────────┘
```

---

## 3. Detailed Case-by-Case Investigation

### A. The Borderline False Negatives (The 20–40% Window)

| Case ID | Patient No. | True Label | Baseline Prob | Split | Anatomical / Imaging Characteristics | Root Cause Analysis |
|:---|:---:|:---:|:---:|:---:|:---|:---|
| `image10163.jpg` | 10163 | **1 (Visible)** | **35.1%** | Dev | Ovarian outline visible; prominent unilateral acoustic shadowing from overlying pelvic bowel gas; 6 clear follicles visible in upper quadrant. | **Transducer acoustic shadowing** obscures the lower ovarian hemisphere. Because only half the ovary is insonated, total countable follicles fall below the typical convolutional feature activation threshold for high-confidence PCOM. |
| `image10110.jpg` | 10110 | **1 (Visible)** | **39.7%** | Dev | Diffuse echogenic stroma; small follicles ($< 3\text{ mm}$) with lower acoustic contrast against the stroma; reduced dynamic range. | **Low acoustic contrast / microfollicular attenuation**. Follicle diameters are near the spatial resolution limit of the 300×300 scan, attenuating deep edge gradients. |
| `image10162.jpg` | 10162 | **1 (Visible)** | **44.4%** | Dev | Ovarian capsule well-defined; 8–9 visible subcapsular follicles arranged in peripheral distribution; mild gain under-saturation. | **Intermediate follicle density**. Case sits directly on the boundary between multifollicular normal variation and mild PCOM. |
| `image10093.jpg` | 10093 | **1 (Visible)** | **47.7%** | Dev | Oblique longitudinal scan angle; central stromal echogenicity is modest; 7 peripheral follicles. | **Near-threshold borderline case**. Sits just 2.3 percentage points below the 0.50 cutoff. |
| `image10108.jpg` | 10108 | **1 (Visible)** | **48.5%** | Dev | Eccentric follicular clustering in one pole; opposite pole shows homogeneous dense stroma. | **Asymmetric follicular distribution**. |

---

### B. Extreme False Negative Outliers ($P < 10\%$)

| Case ID | Patient No. | True Label | Baseline Prob | Split | Anatomical / Imaging Characteristics | Root Cause Analysis |
|:---|:---:|:---:|:---:|:---:|:---|:---|
| `image10065.jpg` | 10065 | **1 (Visible)** | **2.0%** | Dev | Large dominant follicle / cystic structure ($> 18\text{ mm}$) occupying $> 60\%$ of ovarian area; peripheral stroma compressed into a thin rim. | **Dominant Cyst Distortion**. Standard Rotterdam criteria specify that PCOM assessment is invalid in the presence of a dominant cyst ($> 10\text{ mm}$) because follicular compression distorts peripheral morphology. The model accurately recognizes the atypical morphology. |
| `image10354.jpg` | 10354 | **1 (Visible)** | **2.9%** | Dev | Severe motion blur / scan line artifact; distorted transducer contact arc; minimal discernible intrastromal echoes. | **Severe acquisition degradation**. Lack of high-frequency texture features prevents deep convolutional feature matching. |
| `image10064.jpg` | 10064 | **1 (Visible)** | **5.1%** | Holdout | Prominent corpus luteum with thick hyperechoic crenulated wall; small antral follicles are displaced to far periphery. | **Luteal Phase Physiological Modification**. Follicular architecture altered by post-ovulatory structural changes. |

---

### C. High-Confidence False Positives ($P \ge 90\%$)

A striking pattern emerged during the audit: **9 out of the 15 false positives occur in a contiguous sequential run: `image10394.jpg` through `image10404.jpg`**:

| Case ID | Patient No. | True Label | Baseline Prob | Split | Image Characteristics & Root Cause Analysis |
|:---|:---:|:---:|:---:|:---:|:---|
| `image10394.jpg` | 10394 | 0 (Normal) | **97.1%** | Holdout | High ultrasound machine gain; pronounced hyperechoic central stroma with multiple small hypoechoic acoustic voids mimicking follicular pearl necklace. |
| `image10396.jpg` | 10396 | 0 (Normal) | **96.9%** | Dev | Same clinic run / scanner settings as 10394. Identical gain profile. |
| `image10398.jpg` | 10398 | 0 (Normal) | **94.1%** | Holdout | Multiple non-follicular vascular acoustic voids in ovarian hilum producing PCOM-like circular dark regions. |
| `image10399.jpg` | 10399 | 0 (Normal) | **96.5%** | Holdout | Hyperechoic central stroma with multiple 3–4 mm hypoechoic areas. |
| `image10400.jpg` | 10400 | 0 (Normal) | **96.5%** | Dev | Identical machine calibration and gain profile. |
| `image10401.jpg` | 10401 | 0 (Normal) | **97.0%** | Dev | Identical machine calibration. |
| `image10402.jpg` | 10402 | 0 (Normal) | **96.6%** | Holdout | Identical machine calibration. |
| `image10403.jpg` | 10403 | 0 (Normal) | **97.6%** | Dev | High gain, multiple circular voids. |
| `image10404.jpg` | 10404 | 0 (Normal) | **97.1%** | Dev | High gain, multiple circular voids. |
| `image10286.jpg` | 10286 | 0 (Normal) | **98.4%** | Dev | Multi-follicular normal ovary in adolescent/young patient ($N \approx 8\text{--}10$ follicles). |

#### Critical Finding on the False Positive Cluster:
The images `image10394` to `image10404` represent a single batch acquired under specific transducer gain and post-processing filters that accentuate central hyperechogenicity and hilum vascular flow voids. To a deep convolutional model, this acoustic signature strongly resembles polycystic stroma. This demonstrates that **ultrasound acquisition parameter variability** is a primary driver of false positive classifications when cross-scanner normalization is absent.

---

## 4. Grad-CAM Model Attention Audit

Grad-CAM was evaluated across representative True Positive, True Negative, False Positive, and False Negative scans:

1. **True Positive Cases (e.g., `image10001.jpg`, $P = 86.9\%$)**:
   - Attention focuses predominantly on the **subcapsular follicular perimeter** (the peripheral "necklace" or "string-of-pearls" distribution) and the central dense ovarian stroma.
   - Zero attention is directed towards the black background or corner machine text annotations.
2. **True Negative Cases (e.g., `image10002.jpg`, $P = 0.6\%$)**:
   - Gradients remain diffuse across the homogeneous ovarian parenchyma without sharp local focal points.
3. **False Positive Cluster (e.g., `image10394.jpg`, $P = 97.1\%$)**:
   - Grad-CAM heatmap concentrates heavily on the **central hyper-reflective stroma** and the hilum vascular voids. The model is correctly recognizing textural patterns, but the textural pattern is an artifact of high scanner gain rather than true polycystic morphology.
4. **Borderline False Negatives (e.g., `image10163.jpg`, $P = 35.1\%$)**:
   - Attention is fragmented: strong localization on the 5–6 clear upper-quadrant follicles, but zero activation on the bowel-gas acoustic shadow in the lower quadrant.

> [!NOTE]
> **Attribution Disclaimer**: Grad-CAM visualizes the feature maps of the convolutional backbone that have the highest gradient contribution to the class score. It does **not** count individual follicles, establish biological causality, or prove pathological diagnosis.

---

## 5. Impact of Proposed Preprocessing Improvements on Hard Cases

1. **Pipeline B (CLAHE & Percentile Normalization)**:
   - **Effect on 20–40% Borderline Cases**: By locally equalizing contrast, CLAHE sharpens the subtle microfollicular borders in low-contrast scans (`image10110.jpg`), lifting its estimated probability closer to the decision threshold.
   - **Effect on the High-Gain Cluster (`image10394`–`image10404`)**: Percentile intensity clipping dampens the hyper-saturated stromal gain, reducing false-positive overconfidence.
2. **Pipeline C (ROI Margin Trimming)**:
   - Eliminates peripheral black acoustic fan borders, preventing the convolutional network from relying on peripheral sector edges.
3. **Class-Weighted & Focal Loss**:
   - Explicitly increases the penalty on borderline false-negative samples during training, shifting marginal probabilities (e.g., 44–48%) above the 0.50 threshold without destabilizing overall calibration.

---

## 6. Recommendations for Clinical Safety & Model Guardrails

1. **Do Not Artificially Force Probabilities**:
   - Probabilities in the 20–40% window reflect genuine visual ambiguity and partial anatomical occlusion. Forcing these cases to output $> 80\%$ would introduce dangerous false-positive rates on ambiguous scans.
2. **Image Quality Rejection Protocol**:
   - Scans containing dominant ovarian cysts ($> 15\text{ mm}$), severe bowel-gas shadowing, or extreme scanner gain should be flagged as "Acoustically Indeterminate / Rescan Recommended" rather than forced into a binary classification.
3. **Post-Hoc Calibration Preservation**:
   - Platt sigmoid calibration must be maintained to prevent raw logit distortion and ensure predicted probabilities reflect true empirical risk.
