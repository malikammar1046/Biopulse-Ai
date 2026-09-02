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
               ├── Data Quality Engine          (You are working on my existing **OvaSense** project. Supabase Google Authentication is already enabled and configured in the Supabase dashboard.

I now want you to integrate **"Sign in with Google" into the existing authentication UI and make the complete Google OAuth flow functional.**

### Important instructions

1. **First inspect the existing project**

   * Identify the Flutter framework/version and current project structure.
   * Inspect the existing login, registration, authentication service/repository, Supabase initialization, routing/navigation, and session-management code.
   * Do NOT blindly create new authentication files if an existing authentication architecture already exists.
   * Reuse the existing architecture and coding conventions.

2. **Do not break existing authentication**

   * Existing email/password authentication must continue working.
   * Existing registration/login UI must remain functional.
   * Existing Supabase session handling must remain intact.
   * Do not remove existing authentication functionality.

### UI changes

Update the existing Login screen to include a professional Google authentication option.

The login UI should have:

* Existing email field

* Existing password field

* Existing "Login/Sign In" button

* A visual divider such as:

  `────────  OR  ────────`

* A **"Continue with Google"** button underneath it.

The Google button should:

* Use the official Google "G" logo if the project already has appropriate assets/package support.
* Have clean, consistent styling with the existing OvaSense design system.
* Match the existing UI rather than looking like a separate component.
* Have appropriate loading/disabled states.
* Prevent multiple authentication requests if the user taps repeatedly.

Do not redesign the entire authentication screen unless necessary.

### Supabase implementation

Use the existing Supabase client already initialized in the project.

Implement Google login using the Supabase Flutter authentication API:

```dart
await supabase.auth.signInWithOAuth(
  OAuthProvider.google,
);
```

Do NOT:

* implement Google authentication manually,
* store Google Client Secrets in Flutter,
* create a custom OAuth backend,
* hardcode sensitive credentials,
* create a second Supabase client.

Supabase should remain responsible for the OAuth authentication flow.

### OAuth redirect handling

Inspect the existing project and determine whether this OvaSense application is currently running as:

* Flutter Web
* Android
* iOS
* multiple platforms

Then implement the redirect handling appropriate to the platforms actually supported by this project.

Do not guess the redirect URL.

Check the existing Supabase configuration and authentication architecture first.

If a redirect URL/deep-link configuration is required in the Flutter project, implement it using the project's existing architecture and document exactly what needs to be configured in Supabase.

### Authentication state

After Google authentication succeeds:

1. Obtain the authenticated Supabase session/user.
2. Use the existing authentication/session listener if one already exists.
3. Navigate the user to the same authenticated destination used after normal email/password login.
4. Do not create a separate Google-only dashboard or navigation flow.

The resulting flow should be:

```text
Login Screen
     ↓
Continue with Google
     ↓
Supabase OAuth
     ↓
Google Account Selection
     ↓
Google Authentication
     ↓
Supabase Session
     ↓
Existing Auth State Handler
     ↓
Existing OvaSense Dashboard
```

### Existing user/profile handling

Inspect how OvaSense currently handles the authenticated user's profile.

If the project already has a `profiles` table or profile creation mechanism:

* Reuse it.
* Associate the profile with `auth.users.id`.
* Do not create duplicate profiles.
* Do not overwrite existing user information unnecessarily.

If a new Google user requires profile initialization, integrate that into the existing profile flow rather than creating a parallel system.

Do NOT automatically invent database columns.

### Error handling

Handle at least these situations gracefully:

* User cancels Google login
* OAuth authentication fails
* Network error
* Supabase authentication error
* Session is not returned
* User is already authenticated

Show a user-friendly error message consistent with the existing OvaSense UI.

Do not expose sensitive OAuth/provider error details directly to the user.

### Loading state

When Google authentication starts:

```text
Continue with Google
        ↓
     Loading...
```

Disable the button while authentication is in progress.

Restore the button if authentication fails or is cancelled.

### Security

Do not put any of the following in Flutter source code:

* Google Client Secret
* Supabase service-role key
* private OAuth credentials

The Flutter application must only use the existing public Supabase configuration intended for the client.

### Code quality

Before modifying anything:

* inspect existing authentication implementation,
* identify reusable services/widgets,
* follow the current project architecture,
* avoid unnecessary dependencies,
* avoid duplicate authentication logic.

After implementation:

1. Run static analysis.
2. Run the relevant tests.
3. Fix any compilation/analyzer errors.
4. Verify that email/password login Vstill works.
5. Verify that Google login triggers the Supabase OAuth flow.
6. Verify that successful Google authentication reaches the existing authenticated area.
7. Verify logout still works.
8. Verify that reopening the app with an existing Supabase session still works.

### Final response

When finished, report:

1. Files changed
2. What was changed in each file
3. How Google authentication works now
4. Any Supabase configuration still required
5. Any platform-specific redirect/deep-link configuration required
6. Tests/commands executed
7. Whether email/password authentication remains functional
8. Any issues that could not be verified

Do not claim Google authentication is fully working unless you actually verified the relevant flow.
sufficient? / insufficient_data?)
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
