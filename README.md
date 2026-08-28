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
