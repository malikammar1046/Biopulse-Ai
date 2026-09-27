# BioPulse AI — System Architecture

This document describes the high-level system architecture of the **BioPulse AI Risk Assessment Platform**, illustrating how the presentation layer, API service, machine learning inference engines, and persistent cloud databases interact.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph ClientLayer["Presentation Layer (Client Apps)"]
        WEB["React 19 + Vite 8 Web App\n(apps/web)\nTailwind CSS 4, Framer Motion, Three.js"]
        MOBILE["React Native + Expo App\n(apps/mobile)\nExpo Router, Reanimated"]
    end

    subgraph APILayer["Backend & API Gateway (backend/)"]
        DJANGO["Django 6.1 + Django REST Framework\n(backend/manage.py)"]
        AUTH_APP["Authentication App\n(apps/authentication)"]
        HEALTH_APP["Health & Digital Twin App\n(apps/health)"]
        INTEL_APP["Clinical Intelligence App\n(apps/intelligence)"]
    end

    subgraph MLLayer["Machine Learning Subsystem (machine-learning/)"]
        PCOS_ENG["PCOS Risk Engine\nTier 1 (16 feat) & Tier 2 (32 feat)"]
        MALE_ENG["Male Hypogonadism Risk Engine\nTier 1 (11 feat) & Tier 2 (16 feat)"]
        SHAP_ENG["TreeSHAP Explainability\nFold-Aware Calibrated Adapter"]
        VISION_ENG["Ultrasound Vision Backbone\nPyTorch EfficientNet-B0 + GradCAM"]
        OCR_ENG["Medical Lab Report OCR\nRapidOCR + Tesseract"]
    end

    subgraph DataLayer["Storage & Persistence"]
        SUPABASE[("Supabase Cloud\nPostgreSQL + Auth + Storage")]
        SQLITE_FALLBACK[("Local Persistent Store\nSQLite Fallback Engine")]
    end

    %% Client to API
    WEB -->|REST API Calls\nJWT Bearer Auth| DJANGO
    MOBILE -->|REST API Calls\nJWT Bearer Auth| DJANGO

    %% API Routing
    DJANGO --> AUTH_APP
    DJANGO --> HEALTH_APP
    DJANGO --> INTEL_APP

    %% Intelligence App to ML
    INTEL_APP --> PCOS_ENG
    INTEL_APP --> MALE_ENG
    INTEL_APP --> SHAP_ENG
    INTEL_APP --> VISION_ENG
    INTEL_APP --> OCR_ENG

    %% Persistence
    AUTH_APP --> SUPABASE
    HEALTH_APP --> SUPABASE
    INTEL_APP --> SUPABASE
    INTEL_APP -.->|Offline / Failure Fallback| SQLITE_FALLBACK
```

---

## 2. Key Subsystem Highlights

### A. Presentation Layer (`apps/web` & `apps/mobile`)
- Built with React 19, TypeScript, and modern component systems.
- Implements interactive risk dashboards, 3D anatomical models (Three.js/Fiber), dynamic radar charts, and downloadable clinical PDF reports.
- Handles responsive UX across desktop, tablet, and mobile breakpoints.

### B. API Layer (`backend/`)
- Powered by Django 6.1 and Django REST Framework.
- Enforces strict role-based access control, user isolation, and structured clinical state machine transitions.
- Automatic SQLite fallback (`ALLOW_LOCAL_SQLITE_FALLBACK`) guarantees resilient local development and offline CI test execution.

### C. Machine Learning Engine (`machine-learning/`)
- Dual-tier progressive risk pipelines for female reproductive health (PCOS) and male endocrine health (Hypogonadism).
- TreeSHAP and LinearSHAP explainers ensure every predicted probability is accompanied by human-interpretable feature contribution weights.
- Multi-modal vision integration enables analysis of pelvic ultrasound scans with Grad-CAM visual heatmaps.

### D. Persistence Layer
- Production: Supabase managed PostgreSQL, Row-Level Security (RLS), and secure storage buckets.
- Testing / Development: Self-contained SQLite test database ensuring completely isolated automated CI validation.
