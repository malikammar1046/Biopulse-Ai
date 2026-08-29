# OVASense AI/ML Subsystem

This directory contains the machine learning pipelines, explainability models, and OCR processing modules for the **OVASense** project.

> **Disclaimer**: OVASense is an AI-assisted health-information and longitudinal monitoring platform for PCOS and ovarian health. It is **NOT** a diagnostic or treatment-prescription system.

---

## 🔬 Directory Overview

- `models/`: Trained model artifacts, feature extractors, and scalers (tracked via Git LFS or external Supabase Storage).
- `pipelines/`: Data preprocessing, feature engineering, and inference pipelines.
- `explainability/`: Model interpretability and feature contribution modules using **SHAP**.
- `ocr/`: Lab report and document OCR extraction pipelines using **Tesseract OCR** and **OpenCV**.
- `notebooks/`: Exploratory data analysis (EDA), model training, and validation notebooks.

---

## 📦 Dependencies

- Python 3.10+
- `pandas`, `numpy`, `scikit-learn`
- `shap`
- `opencv-python`, `pytesseract`, `Pillow`
