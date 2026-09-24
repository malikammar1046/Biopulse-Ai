# Comprehensive Tier 3 Ultrasound Image Pipeline Audit Report
**OvaSense / PCOS-ML Research Project**  
**Target:** Tier 3 Ultrasound Imaging Pipeline (Experiment 3A: PCOM Morphology & Experiment 3B: Clinical PCOS Reference Outcome)

---

## 1. Current Pipeline Architecture

The OvaSense Tier 3 ultrasound pipeline processes pelvic B-mode ultrasound scans to perform two explicitly separated tasks:
1. **Experiment 3A — Primary Ultrasound Task**: Ovarian Morphology Classification  
   - **Target**: `Class label (whether polycsytic ovary is visible or not visible)` from `Ultrasound_Images/class label.csv` (1 = PCOM Visible, 0 = Not Visible).  
   - **Clinical Role**: Detection of polycystic ovarian morphology (PCOM) as an imaging phenotype.
2. **Experiment 3B — Exploratory Systemic Outcome Association**:  
   - **Target**: Dataset-provided clinical diagnosis `pcos_diagnosis` from `tier2_dataset.csv` (1 = PCOS, 0 = Non-PCOS).  
   - **Clinical Role**: Exploratory evaluation to assess whether ultrasound image features carry independent predictive signal for the clinical systemic syndrome.

### Execution Workflow:
- 541 patients from `PCOS_infertility.csv` (Patient File Nos. 10001–10541) are mapped 1-to-1 to ultrasound images `Ultrasound_Images/images/image10001.jpg` through `image10541.jpg`.
- Images are preprocessed and fed into a deep convolutional vision backbone (EfficientNet-B0 / ConvNeXt-Tiny) to extract spatial feature representations.
- A regularized linear classification head with Platt sigmoid probability calibration produces well-calibrated class probabilities.
- Explainability is provided via Grad-CAM applied to the final convolutional layer (`features[-1]`).

---

## 2. Current Preprocessing

The existing preprocessing in `src/tier3_image_models.py` (`get_transforms`):
```python
transforms.Resize((224, 224))
transforms.ToTensor()
transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
```
- **Image Input Format**: RGB conversion from JPEG (`PIL.Image.open(path).convert('RGB')`).
- **Resizing**: Direct bilinear interpolation from native 300×300 to 224×224 pixels. Because the original images are exactly square (300×300), direct resizing does not alter aspect ratio.
- **Color Normalization**: Standard ImageNet mean `[0.485, 0.456, 0.406]` and standard deviation `[0.229, 0.224, 0.225]`.
- **Limitation**: While ImageNet statistics are standard for pretrained backbones, medical ultrasound images are grayscale B-mode scans where R=G=B channels are identical. ImageNet color normalization treats channels as if they were natural RGB scenes with chromatic variability.

---

## 3. Current Augmentation

The existing training augmentation (`get_transforms(img_size=224)`):
```python
transforms.Resize((224, 224))
transforms.RandomHorizontalFlip(p=0.5)
transforms.RandomRotation(degrees=10)
transforms.ColorJitter(brightness=0.1, contrast=0.1)
transforms.ToTensor()
transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
```
- **Horizontal Flipping**: $p=0.5$, clinically valid for pelvic ultrasound (bilateral ovarian symmetry).
- **Rotation**: Uniform random rotation in $[-10^\circ, +10^\circ]$, preserving anatomical orientation without causing severe corner black clipping.
- **Color Jitter**: Brightness $\pm 10\%$, contrast $\pm 10\%$.
- **Strengths**: Conservative, does not invert or distort anatomical relationships.
- **Omissions**: Lacks mild affine translation (handling varying transducer probe positioning), mild zoom/crop (handling variable probe depth), and ultrasound speckle/Gaussian noise simulation.

---

## 4. Current Model Architecture & Backbone

The primary model is **EfficientNet-B0** (`torchvision.models.efficientnet_b0(weights=DEFAULT)`):
- **Backbone**: 7 inverted residual convolutional blocks with Squeeze-and-Excitation (SE) attention, producing a 1,280-dimensional feature embedding at the global average pooling layer (`avgpool`).
- **Classification Head**:
  ```python
  nn.Sequential(
      nn.Dropout(p=0.3),
      nn.Linear(1280, 1)
  )
  ```
- **Secondary Model Evaluated**: ConvNeXt-Tiny (`timm.create_model('convnext_tiny', pretrained=True, drop_rate=0.3)`), producing 768-dimensional feature embeddings.
- **Pretrained Weights**: Pretrained on ImageNet-1k (supervised).
- **Current Artifact Structure (`models/tier3/tier3_pcom_model.joblib`)**:
  Contains a `CalibratedClassifierCV(estimator=LogisticRegression(C=0.1), method='sigmoid')` fitted on `StandardScaler`-normalized 1,280-dim EfficientNet-B0 embeddings.

---

## 5. Current Split Strategy & Patient Isolation

- **Cohort Size**: 541 linked patients.
- **Split Ratio**: 80% Development ($N=432$, PCOS+: 141, 32.6%) vs. 20% Frozen Holdout ($N=109$, PCOS+: 36, 33.0%).
- **Split Mechanism**: `sklearn.model_selection.train_test_split(random_state=42, stratify=y_pcos)`.
- **Cross-Validation**: 5-Fold Stratified Cross-Validation on Development set ($N=432$).
- **Patient-Level Guarantee**: Each row in `tier2_dataset.csv` corresponds to exactly one patient (`Patient File No. 10001 + i`) and exactly one ultrasound image (`image10001.jpg + i`). Patient-level and image-level units are identical; zero multi-image patient split contamination occurs.

---

## 6. Current Duplicate Strategy & Leakage Audit

A comprehensive hash audit of all 1,468 ultrasound images in `Ultrasound_Images/images/` was conducted:
- **Total Exact Duplicate Groups**: 19 duplicate clusters across the entire disk image pool.
- **Development ↔ Frozen Holdout Duplicates**: **Strictly 0**.
- **Quarantined Duplicate Pairs**: 3 external unlinked images (`image10716.jpg`, `image10949.jpg`, `image10962.jpg`) are exact bit-for-bit duplicates of holdout images (`image10274.jpg`, `image10516.jpg`, `image10534.jpg`).
- **Quarantine Enforcement**: These 3 unlinked files are permanently excluded from all training, development, and evaluation pools.
- **Leakage Status**: **Zero data leakage confirmed**.

---

## 7. Current Evaluation Methodology & Baseline Performance

Evaluation is conducted using threshold-independent discrimination metrics, calibration loss, and thresholded clinical metrics at $0.50$:
- Discrimination: ROC-AUC, Precision-Recall AUC (PR-AUC)
- Calibration: Brier Score Loss ($\frac{1}{N}\sum (y_i - p_i)^2$)
- Clinical: Sensitivity (Recall), Specificity, Precision (PPV), F1-Score, Accuracy

### Baseline Benchmark (Existing Tier 3 Artifacts):

#### Task 3A: PCOM Morphology Classification (Target: Visible vs. Not-Visible)
- **Development 5-Fold OOF ($N=432$)**:
  - ROC-AUC: **0.9733**
  - PR-AUC: **0.9608**
  - Accuracy: **96.8%**
  - Sensitivity: **96.9%**
  - Specificity: **96.6%**
  - Brier Score: **0.0282**
- **Frozen Holdout ($N=109$)**:
  - ROC-AUC: **0.9199**
  - PR-AUC: **0.9039**
  - Accuracy: **91.7%**
  - Sensitivity: **98.3%**
  - Specificity: **84.3%**
  - Brier Score: **0.0769**

#### Task 3B: Exploratory Ultrasound → Clinical PCOS Prediction
- **Development 5-Fold OOF ($N=432$)**: ROC-AUC = **0.5513**, PR-AUC = **0.3553**, Brier = **0.2184**
- **Frozen Holdout ($N=109$)**: ROC-AUC = **0.5042**, PR-AUC = **0.3414**, Brier = **0.2205** (chance-level)

---

## 8. Current Probability Calibration

- **Method**: Platt Sigmoid Calibration (`CalibratedClassifierCV(method='sigmoid', cv=3)`).
- **Behavior**: Maps linear classifier decision values into monotonic calibrated posterior probabilities.
- **Performance**: Development OOF Brier score of **0.0282** demonstrates strong probability alignment for the PCOM morphology classification task.
- **Limitation**: While Platt sigmoid avoids overfitting on small cohorts, it assumes a parametric logistic shape that may compress intermediate probabilities (the 20–40% region) towards the extremes. Isotonic regression or spline calibration has not yet been compared.

---

## 9. Potential Weaknesses & Limitations in Current Pipeline

1. **Absence of Grayscale/B-mode Domain Adaptation**:
   - The vision backbone processes ultrasound as RGB, applying standard natural-image ImageNet color jitter and normalizations. Real ultrasound scans exhibit transducer attenuation, speckle noise, and gain variability that standard RGB transforms do not simulate.
2. **Lack of Contrast / Intensity Standardization**:
   - Ultrasound scans from different machines show varying background gain and dynamic range. A single global contrast standardization (e.g., adaptive histogram equalization or percentile intensity normalization) is absent.
3. **Absence of Region-of-Interest (ROI) Cropping**:
   - Images contain peripheral black backgrounds and potential corner annotations. The network could potentially attend to transducer sector edges rather than intrastromal follicles.
4. **Intermediate Probability Compression (The 30–40% Issue)**:
   - Several PCOM-positive cases receive probabilities between 20% and 40% (e.g., `image10163.jpg` at 35.1%, `image10110.jpg` at 39.7%), falling just below the decision threshold.
5. **Class Imbalance Handling**:
   - Training uses unweighted cross-entropy loss without exploring class weighting or focal loss to focus on ambiguous boundary cases.

---

## 10. Recommended Improvements

1. **Conservative Ultrasound-Specific Preprocessing (Pipeline B)**:
   - Test percentile-based intensity normalization ($1^{\text{st}}$ and $99^{\text{th}}$ percentiles) and mild Contrast Limited Adaptive Histogram Equalization (CLAHE) to standardize gain across scans without amplifying high-frequency noise.
2. **Lightweight Anatomical ROI Extraction (Pipeline C)**:
   - Center/morphological bounding-box cropping to eliminate non-anatomical peripheral margins (black border trimming).
3. **Medically Conservative Augmentations**:
   - Add mild affine translation ($\pm 5\%$), slight scale variation ($[0.95, 1.05]$), and subtle Gaussian speckle noise to simulate acoustic transducer interference.
4. **Transfer Learning Architecture Exploration**:
   - Benchmark EfficientNet-B0 against **EfficientNet-B2** (higher resolution compound scaling) and **ResNet-50** (residual connections with distinct inductive bias).
5. **Loss Function Optimization**:
   - Evaluate balanced class-weighted binary cross-entropy and Focal Loss ($\gamma=2.0$) on Development OOF to reduce false negatives on borderline morphological cases.
6. **Data-Driven Probability Calibration**:
   - Systematically compare raw probabilities, Platt sigmoid calibration, and Isotonic regression using OOF Brier score, Expected Calibration Error (ECE), and reliability diagrams.
7. **In-Depth Hard-Case Investigation**:
   - Audit the specific false negative and false positive samples with high-resolution Grad-CAM heatmaps and document findings in `reports/tier3/HARD_CASE_ANALYSIS.md`.

---

## 11. Expected Risk Assessment of Each Improvement

| Proposed Improvement | Intended Benefit | Potential Risk | Mitigation / Guardrail |
|:---|:---|:---|:---|
| **CLAHE / Contrast Normalization** | Improves follicle contour visibility across varying scanner gain | May amplify speckle noise or background ultrasound artifacts | Use low clip limit ($\le 2.0$), test strictly on Dev OOF first |
| **ROI / Peripheral Cropping** | Eliminates irrelevant black borders and scanner annotations | Risk of truncating subcapsular peripheral follicles near ovarian boundary | Use conservative margin (keep $\ge 90\%$ of bounding area); revert if OOF PR-AUC drops |
| **Ultrasound Speckle Augmentation** | Improves robustness to transducer noise | Distorts subtle microfollicular borders if too intense | Keep noise variance very small ($\sigma \le 0.02$) |
| **Larger Architecture (e.g., EfficientNet-B2)** | Learns finer multi-scale acoustic features | Overfitting on small development cohort ($N=432$) | Regularize with weight decay ($10^{-4}$), dropout ($0.3$), evaluate strictly on OOF |
| **Focal / Weighted Loss** | Prioritizes borderline 20–40% false-negative cases | May elevate false-positive rate and impair specificity | Select loss strictly based on Dev OOF F1 and PR-AUC |
| **Isotonic Calibration** | Flexible non-parametric probability calibration | Prone to step-function overfitting on smaller sample sizes | Compare directly against Platt sigmoid via OOF Brier score |
