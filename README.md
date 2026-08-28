# PMOSense

**PMOSense** is an AI-assisted health-information and longitudinal monitoring platform focused on PMOS/PCOS.

> **Important Clinical & Regulatory Notice**: PMOSense is strictly an educational health-information and longitudinal monitoring platform. It is **NOT** a diagnostic tool and does **NOT** provide medical diagnosis or treatment prescriptions. Always consult qualified healthcare professionals for medical advice.

---

## 🏗️ Repository Architecture

PMOSense is organized as a lightweight, clean monorepo tailored for academic FYP development:

```text
PMOSense/
├── apps/
│   ├── mobile/          # Mobile Application (React Native, Expo, TypeScript, Expo Router, Reanimated)
│   └── web/             # Web Dashboard (React, TypeScript, Vite, Tailwind CSS, Framer Motion, Three.js)
├── backend/             # REST API Backend (Python, Django, Django REST Framework, Supabase)
├── ml/                  # AI/ML Engine (pandas, NumPy, scikit-learn, SHAP, Tesseract OCR / OpenCV)
├── docs/                # Architecture, API specifications, and research documentation
├── scripts/             # Development, seeding, and environment verification scripts
└── .github/
    └── workflows/       # GitHub Actions CI/CD workflows
```

---

## 🚀 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile** | React Native, Expo, TypeScript, Expo Router, React Native Reanimated |
| **Web** | React, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, React Three Fiber, Drei |
| **Backend** | Python, Django, Django REST Framework |
| **Database & Auth** | Supabase, PostgreSQL, Supabase Storage |
| **AI / ML & OCR** | Python, pandas, NumPy, scikit-learn, SHAP, Tesseract OCR, OpenCV |
| **DevOps & CI** | Git, GitHub, GitHub Actions |

---

## 🌿 Development & Git Workflow

We follow a structured Git workflow to ensure clean incremental development:

### 1. Branch Strategy
- **`main`**: Protected integration and production-ready branch. **Direct commits and force-pushes to `main` are strictly prohibited.**
- All development takes place on dedicated feature/task branches created off `main`.

### 2. Branch Naming Conventions
| Prefix | Purpose | Examples |
| :--- | :--- | :--- |
| `feature/` | New features or functional capabilities | `feature/mobile-onboarding`, `feature/cycle-tracking`, `feature/backend-auth`, `feature/report-upload`, `feature/ocr-processing` |
| `fix/` | Bug fixes and patches | `fix/auth-token-refresh`, `fix/mobile-layout-overflow` |
| `refactor/` | Code refactoring without behavior change | `refactor/api-serializers`, `refactor/web-theme-tokens` |
| `docs/` | Documentation additions and updates | `docs/architecture-erd`, `docs/api-endpoints` |
| `chore/` | Tooling, dependencies, and repo tasks | `chore/upgrade-expo-deps`, `chore/setup-linter` |

### 3. Core Development Rules
1. **Never develop directly on `main`**. Always branch off `main`: `git checkout -b feature/<feature-name>`.
2. **Never force-push `main`** (`git push --force` is forbidden on protected branches).
3. **One feature per branch**: Keep feature branches isolated and scoped to a single capability.
4. **Merge via Pull Requests**: Open a PR to `main` and ensure CI checks pass before merging.
5. **Small, meaningful commits**: Commit atomic changes with clear intent.
6. **Conventional Commit Messages**: Follow conventional commits:
   - `feat:` New feature implementation
   - `fix:` Bug fix
   - `chore:` Routine task, tooling, dependencies
   - `refactor:` Code restructuring without functional change
   - `docs:` Documentation changes only
   - `test:` Adding or correcting unit/integration tests

---

## 🔒 Security & Data Privacy Guidelines

- Never commit real secrets, private keys, Supabase service-role keys, or database credentials.
- All environment configurations must be modeled after `.env.example`.
- No real patient/medical records or identifiable health data must ever enter version control. Use synthetic or anonymized mock datasets only.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v20+)
- **npm**: v9+
- **Python**: v3.10+
- **Git**

### 2. Environment Configuration
Copy `.env.example` to `.env` in the required packages:
```bash
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 4. Web Dashboard Setup
```bash
cd apps/web
npm install
npm run dev
```

### 5. Mobile App Setup
```bash
cd apps/mobile
npm install
npx expo start
```

---

## 📄 License & Academic Note
University Final Year Project (FYP) — Academic Research & Development.
