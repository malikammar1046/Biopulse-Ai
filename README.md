# BioPulse AI (PMOSense)

<div align="center">

### Advanced Dual-Pathway Reproductive & Endocrine Health Intelligence Platform
**AI-Assisted Multi-Tier Screening, Fold-Aware TreeSHAP Explainability & Longitudinal Health Monitoring**

[![PMOSense CI](https://github.com/malikammar1046/Biopulse-Ai/actions/workflows/ci.yml/badge.svg)](https://github.com/malikammar1046/Biopulse-Ai/actions/workflows/ci.yml)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![Django 5.0](https://img.shields.io/badge/django-5.0-green.svg)](https://www.djangoproject.com/)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/vite-8-purple.svg)](https://vitejs.dev/)
[![Expo SDK 52](https://img.shields.io/badge/expo-sdk_52-black.svg)](https://expo.dev/)
[![License: Academic](https://img.shields.io/badge/license-Academic_FYP-orange.svg)](#-license--academic-note)

</div>

---

> [!IMPORTANT]
> **Clinical & Regulatory Scope Notice**: BioPulse AI (PMOSense) is an educational health-information, risk-stratification, and longitudinal monitoring platform. It is **NOT** a medical diagnostic device and does **NOT** provide definitive medical diagnoses, prescriptions, or treatment plans. All screening probabilities, feature attributions, and observations must be reviewed with qualified healthcare providers.

---

## 🌟 Platform Overview

**BioPulse AI (PMOSense)** is an end-to-end fullstack clinical intelligence ecosystem engineered to evaluate reproductive and endocrine conditions across biological pathways:
- **Female Reproductive Pathway**: Polycystic Ovary Syndrome (**PCOS**) progressive multi-tier screening and ultrasound analysis.
- **Male Reproductive Pathway**: Male Hypogonadism and Androgen Deficiency in the Aging Male (**ADAM**) screening.

The platform bridges modern patient-facing web and mobile applications with calibrated machine learning ensembles, computer vision neural backbones, automated medical document OCR parsing, and an enterprise 5-fold TreeSHAP/LinearExplainer explainability engine.

---

## 🔬 Core Capabilities

### 1. Dual-Pathway Multi-Tier Clinical Engine
- **Female Pathway (`PCOS-ML`)**:
  - **Tier 1 (Anthropometric & Symptom Baseline)**: 5-fold cross-validated ExtraTrees ensemble with Platt sigmoid calibration evaluating age, BMI, cycle length, cycle irregularity, and phenotypic markers.
  - **Tier 2 (Hormonal & Metabolic Labs)**: Cumulative 5-fold ExtraTrees ensemble incorporating biochemical lab inputs (AMH, LH/FSH ratio, Total Testosterone).
  - **Tier 3 (Multimodal Vision Integration)**: PyTorch EfficientNet-B0 vision backbone detecting Polycystic Ovarian Morphology (**PCOM**) with Grad-CAM visual heatmaps.
- **Male Pathway (`male-ML`)**:
  - **Tier 1 (Vitality & Clinical Screen)**: Calibrated 5-fold ensemble Logistic Regression assessing metabolic markers, BMI, waist circumference, energy levels, and ADAM vitality indicators.
  - **Tier 2 (Endocrine & Laboratory Profile)**: Calibrated 5-fold ensemble Random Forest incorporating Total Testosterone, Free Testosterone, LH, and lipid profiles.

### 2. Enterprise Fold-Aware SHAP Explainability (Schema 1.1)
- **Mathematical Integrity**: SHAP explanations are computed across all 5 cross-validation folds in raw score space (tree-vote space for tree ensembles; log-odds space for linear models), strictly preserving additivity:
  $$\sum \phi_i = f(x) - \mathbb{E}[f(x)]$$
- **Integer Fold-Count Direction Stability**:
  - **Consistent** (5/5 folds agree in direction)
  - **Moderate** (4/5 folds agree in direction)
  - **Mixed Model Influence** (3 vs 2 fold direction disagreement; labeled as `"Mixed model influence"` and separated from confident top drivers)
- **Canonical Feature Metadata Registry**: Provides non-diagnostic patient attributions, clinical reference ranges, and lifestyle/clinical modifiability tags.
- **Strict Longitudinal Comparability**: Guarantees that historical SHAP comparisons are only made between assessments with matching user identities, compatible clinical tiers, identical model stages, and valid Schema 1.1 definitions. Prohibits self-comparison.

### 3. Automated Lab OCR & Document Intelligence
- Automated ingestion of medical laboratory reports in PDF and image formats using **Tesseract OCR**, **PyMuPDF**, and **OpenCV**.
- Robust extraction of structured numerical laboratory values (e.g., LH, FSH, AMH, Testosterone) with automatic reference range parsing and pre-population of Tier 2 assessment fields.

### 4. Authoritative Cloud Persistence & Resilient Fallback
- Primary persistence backed by **Supabase PostgreSQL** via authenticated stored procedures (`save_screening_assessment()`, `patient_clinical_state`).
- Integrated zero-data-loss **SQLite fallback** (`ALLOW_LOCAL_SQLITE_FALLBACK`) enabling offline functionality and fast, hermetic test execution on CI runners.

---

## 🏗️ Repository Architecture

BioPulse AI is organized as a unified monorepo:

```text
PMOSense/
├── apps/
│   ├── mobile/             # React Native & Expo mobile application (SDK 52, Expo Router, Reanimated)
│   │   ├── app/            # File-based routing navigation screens
│   │   ├── src/            # Components, design tokens, hooks, and clinical view components
│   │   └── package.json
│   └── web/                # React 19 & Vite 8 web dashboard (Tailwind CSS v4, Framer Motion, Lucide, Three.js)
│       ├── src/
│       │   ├── components/ # Clinical components (SHAP waterfall/bar charts, longitudinal progress, OCR upload)
│       │   ├── pages/      # Dashboard, Assessment, Master Health Hub, Diet, Progress, Care Circle
│       │   ├── services/   # Supabase auth, intelligence API, and longitudinal data connectors
│       │   └── types/      # Strict TypeScript interfaces
│       └── package.json
├── backend/                # Django 5 & Django REST Framework clinical API backend
│   ├── apps/
│   │   ├── authentication/ # Supabase JWT authentication & user profile management
│   │   ├── health/         # Patient health metrics, logs, and OCR document processing
│   │   └── intelligence/   # Multi-tier orchestrator, SHAP engine, and repository services
│   │       ├── services/   # pcos_ml_service, male_ml_service, longitudinal_shap_service, assessment_repository
│   │       └── tests/      # Hermetic intelligence, SHAP, and security test suites
│   ├── config/             # Django settings, URL routing, WSGI/ASGI configuration
│   ├── manage.py
│   └── requirements.txt
├── machine-learning/       # Production Machine Learning Models & Pipelines
│   ├── PCOS-ML/            # Production Female PCOS 5-fold ensemble & PyTorch vision weights
│   ├── male-ML/            # Production Male Hypogonadism 5-fold ensemble models & weights
│   ├── ml/                 # Legacy ML validation pipeline & baseline tests
│   └── test_production_models.py
├── docs/                   # Clinical specifications, architecture blueprints, and API documentation
├── scripts/                # Verification, migration, and test helper scripts
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI matrix (Backend, ML/OCR, Web, Mobile)
└── package.json            # Monorepo task orchestration scripts (concurrently)
```

---

## 🚀 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Web Dashboard** | React 19, TypeScript, Vite 8, React Router v7, Tailwind CSS v4, Framer Motion, Lucide Icons, Three.js / React Three Fiber |
| **Mobile App** | React Native (0.76), Expo SDK 52, TypeScript, Expo Router v4, React Native Reanimated |
| **Backend API** | Python 3.11, Django 5.0, Django REST Framework, django-cors-headers |
| **Authentication & Cloud DB** | Supabase Auth (JWT), Supabase PostgreSQL, Supabase Storage, PostgREST |
| **AI / ML & Explainability** | PyTorch (EfficientNet-B0), scikit-learn (ExtraTrees, Random Forest, Logistic Regression), SHAP (TreeExplainer, LinearExplainer), pandas, NumPy, SciPy |
| **OCR & Document Processing** | Tesseract OCR, PyMuPDF, OpenCV, Pillow |
| **DevOps & CI/CD** | Git, GitHub Actions, Ubuntu CI matrix, SQLite persistent local fallback |

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: `v20+`
- **npm**: `v9+`
- **Python**: `v3.11` (or `v3.10+`)
- **Git**

---

### 2. Installation & Environment Configuration

#### A. Clone Repository & Setup Environment File
```bash
git clone https://github.com/malikammar1046/Biopulse-Ai.git
cd Biopulse-Ai

# Copy environment template
cp .env.example .env
```

Ensure your `.env` contains your Supabase credentials:
```ini
DJANGO_SECRET_KEY="your-development-django-secret-key"
DJANGO_DEBUG="True"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
ALLOW_LOCAL_SQLITE_FALLBACK="true"
```

#### B. Setup Python Backend Environment
```bash
# On Windows (PowerShell):
python -m venv backend/venv
backend\venv\Scripts\pip install --upgrade pip
backend\venv\Scripts\pip install -r backend/requirements.txt

# On macOS / Linux:
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

#### C. Install Node Dependencies
```bash
npm run install:all
```

---

### 3. Launch Development Environment

Run both the Web Dashboard and the Django ML Backend concurrently with one command:

```bash
npm run dev
```

Once running:
- **Web Dashboard**: `http://localhost:5173`
- **Backend API**: `http://127.0.0.1:8000`
- **API Health Check**: `http://127.0.0.1:8000/api/v1/health/`

---

## 🧪 Testing & Verification

| Target | Command | Description |
| :--- | :--- | :--- |
| **Backend Intelligence & SHAP** | `npm run test:backend` | Runs the full Django intelligence test suite including 21 SHAP safety & mathematical tests |
| **Production ML Validation** | `python -m pytest machine-learning/test_production_models.py -v` | Validates model schemas, artifact integrity, and predictions across all 5 folds |
| **Web Type-Check** | `npm run type-check --prefix apps/web` | Runs strict TypeScript verification across web components |
| **Web Production Build** | `npm run build --prefix apps/web` | Compiles optimized production web bundle (`tsc -b && vite build`) |
| **Mobile Type-Check** | `npm run type-check --prefix apps/mobile` | Validates React Native & Expo TypeScript compilation |
| **Mobile Expo Configuration** | `npx expo config apps/mobile` | Validates Expo app configuration and manifest |

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The repository runs a 4-tier automated GitHub Actions validation matrix on every pull request and push to `main`:

1. **Backend (Django & DRF)**: Validates Django system checks, migrations, model loading, and intelligence test suite.
2. **AI/ML & OCR Pipeline**: Tests Tesseract OCR dependencies, legacy ML stack imports, and production model artifacts.
3. **Web Dashboard (React & Vite)**: Executes strict TypeScript type-checking and production bundle compilation.
4. **Mobile App (Expo & React Native)**: Validates Expo app configuration and React Native TypeScript compilation.

---

## 🔒 Security & Data Privacy Guidelines

- **Authentication & Isolation**: Every screening assessment and observation is derived strictly from the authenticated user's JWT ID. Cross-user access or data leakage is blocked by design.
- **Credential Hygiene**: Supabase Service-Role keys must only be stored in server-side environment variables and never committed to version control or returned in client responses.
- **De-identified Datasets**: Only synthetic or fully anonymized clinical datasets are utilized during training, testing, and benchmark execution.

---

## 📄 License & Academic Note

Developed as part of a **University Final Year Project (FYP)** in Artificial Intelligence & Clinical Informatics.
Copyright © 2026 BioPulse AI Contributors.
