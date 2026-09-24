# Tier 1 Input Requirements & Human-Centered Availability Taxonomy

**Project**: OvaSense FYP  
**Date**: September 2026  
**Auditor**: OvaSense ML / Data Science Team  
**Focus**: OvaSense UI/UX Data Capture & User Burden Analysis  

---

## 1. The Human-Centered Principle: Not All "Self-Reported" Data is Equal

In previous ML literature, features are often naively labeled "self-reported" under the assumption that any user can instantly and accurately provide them. In reality, user data capture ranges from immediate recall to complex physical measurement and mathematical calculation.

To design an intuitive, clinically sound mobile application for OvaSense, we classify every Tier 1 candidate feature across four operational accessibility classes:
1. **Class 1 — Directly Observable / Recallable**: Can be answered immediately from personal memory or symptom self-observation without any physical instrument.
2. **Class 2 — Requires Measurement Device**: Requires standard, non-medical household equipment (e.g., home bathroom scale, flexible measuring tape).
3. **Class 3 — Requires Mathematical Calculation**: Derived deterministically from source measurements; calculated automatically by the application software.
4. **Class 4 — Requires Medical / Tracking Interpretation**: Requires understanding menstrual cycle tracking terminology or interpreting historical records.

---

## 2. Complete Tier 1 Feature Availability Breakdown

| Clean Feature Name | Raw Column Name | Accessibility Class | Required Device / Tool | User Cognitive / Physical Burden | OvaSense App UI/UX Design Guidance |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `age` | ` Age (yrs)` | **Class 1** | None | Minimal (immediate recall) | Simple integer input or date-of-birth picker. |
| `cycle_regularity` | `Cycle(R/I)` | **Class 1** | None | Low (recall of period patterns) | Binary selector: "Do your periods arrive on a predictable schedule (every 21–35 days) or are they irregular / unpredictable?" |
| `weight_gain` | `Weight gain(Y/N)` | **Class 1** | None | Low (symptom self-awareness) | Checkbox / Yes-No: "Have you experienced rapid or unexplained weight gain that is difficult to lose?" |
| `hirsutism` | `hair growth(Y/N)` | **Class 1** | None | Low (physical self-observation) | Visual Ferriman-Gallwey illustrated guide: "Do you notice excess coarse, dark hair on your chin, upper lip, chest, or abdomen?" |
| `skin_darkening` | `Skin darkening (Y/N)` | **Class 1** | None | Low (physical self-observation) | Illustrated prompt: "Have you noticed velvety dark patches of skin on your neck, armpits, or groin (Acanthosis nigricans)?" |
| `hair_loss` | `Hair loss(Y/N)` | **Class 1** | None | Low (physical self-observation) | Yes-No: "Are you experiencing noticeable scalp hair thinning, widening of your hair part, or excess shedding?" |
| `pimples_acne` | `Pimples(Y/N)` | **Class 1** | None | Low (physical self-observation) | Yes-No: "Do you struggle with persistent, cystic, or adult acne, especially along the jawline or chin?" |
| `fast_food` | `Fast food (Y/N)` | **Class 1** | None | Low (dietary habit recall) | Yes-No: "Do you consume fast food, fried snacks, or heavily processed meals on a regular basis (3+ times a week)?" |
| `regular_exercise` | `Reg.Exercise(Y/N)` | **Class 1** | None | Low (lifestyle habit recall) | Yes-No: "Do you engage in regular physical exercise (e.g., brisk walking, workout, sports) for at least 150 minutes per week?" |
| `weight_kg` | `Weight (Kg)` | **Class 2** | Standard Home Bathroom Scale | Moderate (requires weighing) | Numeric input with unit toggle (kg / lbs). App provides auto-conversion. |
| `height_cm` | `Height(Cm) ` | **Class 2** | Measuring Tape / Wall Ruler | Moderate (requires measuring) | Numeric input with unit toggle (cm / ft+in). App provides auto-conversion. |
| `hip_inch` | `Hip(inch)` | **Class 2** | Flexible Measuring Tape | High (requires measuring tape) | Illustrated anatomical guide showing widest point of buttocks/hips. Input with unit toggle (inches / cm). |
| `waist_inch` | `Waist(inch)` | **Class 2** | Flexible Measuring Tape | High (requires measuring tape) | Illustrated guide showing midpoint between lower rib and iliac crest (navel level). Input with unit toggle. |
| `bmi` | `BMI` | **Class 3** | Application Software Logic | **Zero user burden** (Auto-computed) | Automatically calculated by OvaSense backend: $\text{BMI} = \text{weight\_kg} / (\text{height\_m})^2$. Displayed with WHO category feedback. |
| `waist_hip_ratio` | `Waist:Hip Ratio` | **Class 3** | Application Software Logic | **Zero user burden** (Auto-computed) | Automatically calculated by OvaSense backend: $\text{WHR} = \text{waist} / \text{hip}$. Displayed with metabolic risk threshold. |
| `cycle_length_raw` | `Cycle length(days)`| **Class 4** | Period Tracker App or Memory | Moderate to High (semantic clarity required) | Specific prompt: "How many days does your menstrual bleeding typically last during a period? (Normal is usually 3–7 days)." |

---

## 3. Disputed Candidate Features Availability

| Feature Name | Accessibility Class | Burden & Availability Assessment | Recommendation for OvaSense App |
| :--- | :---: | :--- | :--- |
| `marriage_years` | **Class 1** | Simple recall for married users; **inapplicable / distressing** for unmarried adolescents or young adults. | Exclude from core screener. Include only in dedicated "Trying to Conceive / Infertility" assessment sub-module. |
| `pregnant` | **Class 1** | Immediate recall if known; requires urine pregnancy test if uncertain. | Implement as an initial screening qualifier / contraindication check: "Are you currently pregnant?" (Redirects to prenatal care). |
| `abortions_count`| **Class 1** | Recallable, but emotionally sensitive and inapplicable to nulliparous/unmarried women. | Exclude from core screener. Retain only in specialized secondary fertility history modules. |

---

## 4. UI/UX Fallback & Robustness Strategy

1. **Missing Measuring Tape Fallback**:
   - In home environments, many users have a scale but lack a flexible tailor's tape for waist and hip.
   - **App Solution**: The mobile app allows completing the Tier 1 assessment with `age`, `weight`, `height`, `cycle_regularity`, `cycle_length_raw`, symptoms, and lifestyle. If waist and hip are unavailable, the model gracefully falls back to the anthropometric subset (`bmi`), flagging slightly wider uncertainty bounds.
2. **Unit Conversion Transparency**:
   - Users may enter height in feet/inches and weight in pounds. The mobile application performs deterministic conversion to metric units (`height_cm`, `weight_kg`) prior to ML pipeline inference.
