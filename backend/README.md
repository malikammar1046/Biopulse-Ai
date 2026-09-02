# OvaSense Intelligence Backend

## Architecture

```
React Frontend
     │ Bearer <supabase_access_token>
     ▼
Django REST API  (port 8000)
     │
     ├── GET  /api/v1/intelligence/status/      ← public, model metadata
     ├── GET  /api/v1/intelligence/health/      ← authenticated, health snapshot
     └── POST /api/v1/intelligence/assessment/  ← authenticated, ML + SHAP
               │
               ├── Supabase Health Repository   (service role key, server-side only)
               ├── Feature Extractor            (22 numeric features)
               ├── Data Quality Engine          (sufficient? / insufficient_data?)
               ├── RandomForestClassifier       (sklearn Pipeline, joblib artifact)
               └── SHAP TreeExplainer           (real feature contributions)
```

## Setup

### 1. Create virtual environment

```bash
cd d:/PMOSense
python -m venv backend/venv
backend/venv/Scripts/pip install -r backend/requirements.txt
```

### 2. Configure environment variables

Copy the example and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required values:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key    # NEVER expose to frontend
SUPABASE_JWT_SECRET=your-jwt-secret                 # from Supabase Settings → API
DJANGO_SECRET_KEY=your-50-char-random-secret
DJANGO_DEBUG=True
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Train the ML model

```bash
backend/venv/Scripts/python -m ml.training.train_pipeline
```

This creates:
- `ml/artifacts/model.joblib`   — trained sklearn Pipeline
- `ml/artifacts/metadata.json`  — model metadata

### 4. Run Django system check

```bash
backend/venv/Scripts/python backend/manage.py check
```

### 5. Run backend tests

```bash
backend/venv/Scripts/python backend/manage.py test apps.intelligence
```

### 6. Start development server

```bash
backend/venv/Scripts/python backend/manage.py runserver 8000
```

---

## API Endpoints

### GET /api/v1/intelligence/status/

Public endpoint. Returns model metadata and readiness status.

```json
{
  "status": "ok",
  "service": "OvaSense Intelligence API",
  "model": {
    "name": "ovasense_metabolic_pattern_classifier",
    "version": "0.1.0",
    "algorithm": "RandomForestClassifier",
    "shap_enabled": true,
    "clinical_validation": false,
    "ready": true
  }
}
```

### GET /api/v1/intelligence/health/

Requires: `Authorization: Bearer <access_token>`

Returns normalised health snapshot without ML inference.

### POST /api/v1/intelligence/assessment/

Requires: `Authorization: Bearer <access_token>`

Request body: `{}` (empty — patient identity from JWT only)

Returns full ML assessment with SHAP explanations:

```json
{
  "risk_pattern": "moderate_pattern",
  "risk_pattern_description": "...",
  "confidence": 0.71,
  "probabilities": { ... },
  "data_quality": { "completeness_percentage": 68, ... },
  "explanations": [
    {
      "feature": "medication_adherence_rate",
      "human_label": "Medication consistency",
      "direction": "positive",
      "magnitude": 0.184,
      "patient_explanation": "..."
    }
  ],
  "disclaimer": "OvaSense provides educational health-pattern insights..."
}
```

---

## Security

- All patient data access is scoped to the JWT-authenticated user UUID.
- The service role key is only used server-side; it is never returned or logged.
- Any `user_id` in the request body is ignored — the JWT is authoritative.
- Anonymous requests to protected endpoints return 401.

---

## Medical Safety Boundary

The model produces ONLY pattern labels:
- `lower_pattern`
- `moderate_pattern`
- `higher_pattern`
- `insufficient_data`

**Never**: "You have PCOS", "You have diabetes", or any diagnosis.

Every response includes the medical disclaimer.

---

## Model Limitations

⚠️ **RESEARCH PROTOTYPE — SYNTHETIC TRAINING DATA — NOT CLINICALLY VALIDATED**

- Trained on synthetically-generated data
- Not validated against clinical patient outcomes
- Not a medical device
- Not intended for clinical decision-making
- For educational and informational purposes only
