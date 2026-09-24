# Contributing to BioPulse AI Risk Assessment

Thank you for contributing to **BioPulse AI**! To maintain code quality, security, and seamless collaboration across UI/UX, Backend, and Machine Learning teams, please follow these guidelines.

---

## 1. Golden Rule

> [!CAUTION]
> **DO NOT WORK DIRECTLY ON `main` OR `develop`.**
> All changes must originate from a dedicated feature branch and be merged via a reviewed Pull Request with passing CI checks.

---

## 2. Standard Contribution Workflow

Follow these 11 steps for every feature or fix:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MHamzaAhmed-dev/biopulse-ai-risk-assessment.git
   cd biopulse-ai-risk-assessment
   ```
2. **Fetch latest changes and switch to `develop`**:
   ```bash
   git fetch origin
   git checkout develop
   git pull origin develop
   ```
3. **Create your feature branch**:
   ```bash
   git checkout -b feature/ui-risk-dashboard
   ```
4. **Configure your local environment**:
   ```bash
   cp .env.example .env
   ```
5. **Install dependencies**:
   ```bash
   # Frontend
   npm run install:all
   # Backend
   python -m venv backend/venv
   .\backend\venv\Scripts\pip install -r backend/requirements.txt
   ```
6. **Run frontend and backend locally**:
   ```bash
   npm run dev
   ```
7. **Run tests before committing**:
   ```bash
   # Frontend type check and build
   npm run type-check --prefix apps/web
   npm run build --prefix apps/web

   # Backend system check and tests
   python backend/manage.py check
   python backend/manage.py test apps.intelligence

   # ML production model tests
   pytest machine-learning/test_production_models.py -v
   ```
8. **Stage and commit changes using Conventional Commits**:
   ```bash
   git add apps/web/src/...
   git commit -m "feat(ui): add risk assessment explanation card"
   ```
9. **Rebase or merge latest `develop` to ensure a clean branch**:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```
10. **Push your branch to GitHub**:
    ```bash
    git push -u origin feature/ui-risk-dashboard
    ```
11. **Open a Pull Request**:
    - Target branch: `develop`
    - Fill in the Pull Request template completely
    - Ensure all CI workflow checks pass
    - Request review from the appropriate domain owner

---

## 3. Branch Naming Conventions

Always prefix branch names with the team/area and a concise hyphenated description:

| Area | Prefix Pattern | Examples |
| :--- | :--- | :--- |
| **Frontend / UI / UX** | `feature/ui-*` | `feature/ui-risk-dashboard`, `feature/ui-vital-gauges` |
| **Machine Learning** | `feature/ml-*` | `feature/ml-pcos-calibration`, `feature/ml-male-shap` |
| **Backend / API** | `feature/backend-*` | `feature/backend-risk-api`, `feature/backend-sqlite-fallback` |
| **Bug Fixes** | `fix/*` | `fix/ui-contrast-issue`, `fix/backend-migration-typo` |
| **Documentation** | `docs/*` | `docs/update-api-contract`, `docs/setup-guide` |
| **DevOps / CI** | `ci/*` | `ci/optimize-ml-caching`, `ci/add-secret-scanning` |

> [!WARNING]
> Do NOT use ambiguous branch names such as `test`, `testing`, `latest`, `new`, `hamza-final`, or `quick-fix`.

---

## 4. Commit Message Convention

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <short description>
```

### Allowed Types
- `feat`: A new user-facing feature or API endpoint.
- `fix`: A bug fix.
- `docs`: Documentation updates only.
- `style`: Formatting, whitespace, missing semicolons (no code logic change).
- `refactor`: Code restructuring without changing behavior.
- `perf`: Performance improvement.
- `test`: Adding or updating test cases.
- `chore`: Tooling, build config, dependency bumps, or repository maintenance.
- `ci`: CI/CD workflow modifications.

### Examples
- `feat(ui): add risk assessment dashboard`
- `feat(ml): add risk prediction pipeline`
- `feat(api): add risk assessment endpoint`
- `fix(ui): correct mobile risk card layout`
- `fix(api): validate assessment payload`
- `test(ml): add inference smoke test`
- `docs: update development setup`
- `ci: add backend workflow`

---

## 5. Security & Privacy Rules

- **Zero Secrets**: Never commit API keys, tokens, `.env` files, or production credentials.
- **De-identified Data Only**: Never commit patient health information (PHI/PII) or real patient records.
- **Dependency Hygiene**: Avoid introducing large, redundant npm or pip dependencies without team discussion.
