# BioPulse AI — Azure Deployment Guide

This guide details the deployment architecture, configuration, and operational commands for deploying **BioPulse AI (PMOSense)** to Microsoft Azure under the **Azure for Students** subscription tier.

---

## 1. Deployment Topology & Targets

| Component | Target Service | Tier / Plan | Key Config |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Azure Static Web Apps (SWA) | Free | `app_location: "apps/web"`, `output_location: "dist"` |
| **Backend & ML API** | Azure Container Apps (ACA) | Consumption | 1 vCPU, 2 GiB RAM, min replicas = 0, max replicas = 1 |
| **Database & Auth** | Supabase Cloud | Existing Plan | PostgreSQL 15 + RLS + GoTrue Auth |
| **Repository** | GitHub | `MHamzaAhmed-dev/biopulse-ai-risk-assessment` | Branch: `ammar-latest-work` |

---

## 2. Backend Container Deployment (Azure Container Apps)

### A. Resource Sizing & Memory Management
The backend runs Django 5.0 with PyTorch (CPU), XGBoost, LightGBM, and Tesseract OCR:
- **Gunicorn Execution**: Runs with **1 worker** and **2 threads** (`--workers 1 --threads 2 --bind 0.0.0.0:8000 --timeout 120`).
  - *Memory Invariant*: Using 1 worker prevents loading duplicate ML model instances into RAM, staying well within the 2 GiB limit.
- **Initial Allocation**: **1.0 vCPU** and **2.0 GiB RAM**.
- **Replica Scaling**: `--min-replicas 0 --max-replicas 1`.
  - Staging cost optimization: scales to zero when idle, caps instances at 1 to prevent unexpected charges.
- **Memory Scaling Option**: If high-resolution ultrasound vision inference or simultaneous feature attribution exceeds available memory, scale memory up to 4 GiB using:
  ```bash
  az containerapp update \
    --name biopulse-backend \
    --resource-group biopulse-rg \
    --cpu 2.0 \
    --memory 4.0Gi
  ```

### B. Deployment Commands
```bash
# 1. Create Azure Resource Group & Container Registry
az group create --name biopulse-rg --location eastus
az acr create --resource-group biopulse-rg --name biopulseacr --sku Basic --admin-enabled true

# 2. Build Container Image using Azure ACR
az acr build \
  --registry biopulseacr \
  --image biopulse-backend:latest \
  https://github.com/MHamzaAhmed-dev/biopulse-ai-risk-assessment.git#ammar-latest-work

# 3. Create Container Apps Environment
az containerapp env create \
  --name biopulse-env \
  --resource-group biopulse-rg \
  --location eastus

# 4. Deploy Backend Container App
az containerapp create \
  --name biopulse-backend \
  --resource-group biopulse-rg \
  --environment biopulse-env \
  --image biopulseacr.azurecr.io/biopulse-backend:latest \
  --target-port 8000 \
  --ingress external \
  --cpu 1.0 \
  --memory 2.0Gi \
  --min-replicas 0 \
  --max-replicas 1 \
  --env-vars \
    DJANGO_DEBUG="False" \
    ALLOW_LOCAL_SQLITE_FALLBACK="False" \
    LLM_PROVIDER="gemini" \
    DJANGO_ALLOWED_HOSTS="*.azurecontainerapps.io" \
    CORS_ALLOWED_ORIGINS="https://<your-static-web-app>.azurestaticapps.net" \
    SUPABASE_URL="https://<your-project>.supabase.co" \
    SUPABASE_ANON_KEY="<your-anon-key>" \
  --secrets \
    django-secret-key="<your-50-char-secret>" \
    supabase-service-role-key="<your-service-role-key>" \
    gemini-api-key="<your-gemini-key>"
```

---

## 3. Frontend Deployment (Azure Static Web Apps)

### A. CI/CD Workflow (`.github/workflows/azure-static-web-apps.yml`)
The workflow automatically triggers on pushes to `ammar-latest-work`:
- **Source Location**: `apps/web`
- **Output Location**: `dist`
- **Build Command**: `npm run build`
- **Deployment Secret**: `AZURE_STATIC_WEB_APPS_API_TOKEN` (provided by Azure when creating the Static Web App).

### B. Build-Time Environment Variable Injection
Configure the following in your GitHub Repository under **Settings > Secrets and variables > Actions > Variables**:
1. `VITE_BACKEND_API_URL`: `https://<your-backend-fqdn>.azurecontainerapps.io/api`
2. `VITE_SUPABASE_URL`: `https://<your-supabase-project>.supabase.co`
3. `VITE_SUPABASE_ANON_KEY`: `<your-supabase-public-anon-key>`

> [!IMPORTANT]
> **Production Localhost Protection**: The frontend build incorporates runtime guards (`apps/web/src/config/apiConfig.ts`) that strictly prevent production builds from silently querying `localhost` or `127.0.0.1`. If `VITE_BACKEND_API_URL` is omitted, the app defaults safely to relative `/api`.

### C. Single Page Application (SPA) Routing Fallback
Azure Static Web Apps routes all client-side React Router paths (e.g. `/lifestyle`, `/assessments`, `/onboarding`) to `/index.html` via `apps/web/public/staticwebapp.config.json`, which is automatically bundled into `dist/`.

---

## 4. Manual Credential Rotation Notice

Historical test scripts in `apps/web/scripts/` have been updated to read test passwords strictly from environment variables (`TEST_PASSWORD`). No real user passwords were modified or reset in the database.

The following test identities previously had test passwords committed in historical test scripts and must be manually rotated in the Supabase Dashboard:
- `ammar@ammar.com`
- `qa.test.female@biopulse.health`
- `qa.test.male@biopulse.health`
- `biopulse_qa_1791463522240@example.com`
- `biopulse_male_qa_1791463619122@example.com`
