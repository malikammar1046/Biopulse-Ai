# Local Development & Environment Setup Guide

This guide walks new team members through configuring their local environment to run and test BioPulse AI across Frontend, Backend, and Machine Learning subsystems.

---

## 1. Prerequisites

- **Python**: Version 3.11, 3.12, 3.13, or 3.14
- **Node.js**: Version 20, 22, or 24 LTS
- **Package Managers**: `npm` (v10+) and `pip`
- **Git**: Installed with standard credential helper configured
- **Optional System Tools**: Tesseract OCR (if testing local OCR parsing)

---

## 2. Fast Setup (All Subsystems)

### Step 1: Clone Repository
```bash
git clone https://github.com/MHamzaAhmed-dev/biopulse-ai-risk-assessment.git
cd biopulse-ai-risk-assessment
```

### Step 2: Configure Environment Template
```bash
cp .env.example .env
```
Edit `.env` to supply local configuration if connecting to a live Supabase project. For offline development, leave defaults with `ALLOW_LOCAL_SQLITE_FALLBACK=True`.

### Step 3: Setup Frontend Dependencies
```bash
npm install
npm install --prefix apps/web
```

### Step 4: Setup Backend Virtual Environment
```bash
# Windows (PowerShell)
python -m venv backend/venv
.\backend\venv\Scripts\pip install -r backend/requirements.txt

# macOS / Linux
python3 -m venv backend/venv
source backend/venv/bin/activate && pip install -r backend/requirements.txt
```

---

## 3. Running Services

### Concurrent Mode (Frontend + Backend)
```bash
npm run dev
```
Starts:
- Django Backend at `http://127.0.0.1:8000`
- React Web App at `http://localhost:5173`

### Run Backend Individually
```bash
npm run dev:backend
# or directly:
python backend/manage.py runserver 127.0.0.1:8000
```

### Run Frontend Individually
```bash
npm run dev:web
# or:
cd apps/web && npm run dev
```

---

## 4. Verification & Testing

### Frontend Validation
```bash
npm run type-check --prefix apps/web
npm run build --prefix apps/web
```

### Backend Validation
```bash
python backend/manage.py check
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py test apps.intelligence
```

### ML Pipeline Validation
```bash
pytest machine-learning/test_production_models.py -v
```
