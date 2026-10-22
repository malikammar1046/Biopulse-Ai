# PMOSense Recommendation Engine — End-to-End Architectural, Frontend, Logging, Persistence & Adaptive Feedback Audit

> **Document Type:** Production Healthcare Systems Audit & Implementation Specification  
> **Target System:** PMOSense / BioPulse AI (Full Stack: Django Intelligence Backend + Expo/React Native Mobile App + Supabase PostgreSQL)  
> **Auditor Role:** Senior Full-Stack Software Architect, AI/ML Healthcare Systems Engineer, Database Specialist  
> **Verification Level:** Evidence-Based Source Code Inspection + Live Production Supabase Introspection + Django Test Suite Execution  
> **Status:** Analysis Complete — Read-Only — Zero Application Code Modified  

---

## Executive Summary

The PMOSense (BioPulse AI) recommendation engine possesses a **sophisticated, clinically calibrated, and deterministic backend architecture** (`LifestyleContextBuilder` → `LifestyleSafetyEngine` → `LifestyleRecommendationEngine` → `AILifestylePlanner`). However, an exhaustive investigation across the entire React Native mobile frontend, service layers, tracking pipelines, persistence repositories, and live Supabase database reveals a **critical end-to-end disconnect**:

1. **Frontend Disconnection:** The primary user-facing recommendation screen ([`recommendations.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/recommendations.tsx#L51-L213)), meal plan screen ([`meal-plan.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx#L42-L242)), and movement screen ([`movement.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/movement.tsx#L44-L171)) render **static, hardcoded client-side catalog items**. The mobile app never calls the authoritative backend recommendation endpoints (`/api/v1/intelligence/lifestyle-recommendations/` or `/api/v1/intelligence/lifestyle-ai-plan/`).
2. **Missing Recommendation-to-Logging Pipeline:** When users log meals, record movement, or log symptoms in the mobile UI, records are written directly to separate Supabase tables (`nutrition_food_logs`, `fitness_logs`, `symptom_logs`) via PostgREST. These records carry **no recommendation identifiers, no plan IDs, and no adherence statuses**. The user cannot mark recommended items as completed or skipped from the recommendation UI.
3. **Pillar Structural Asymmetry:** The backend adherence status endpoint ([`LifestyleRecommendationStatusView`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/views_lifestyle.py#L216-L268)) is only capable of updating items inside `payload.recommendations[]`. The rich structured pillar outputs (`nutrition.meal_concepts`, `fitness.weekly_schedule`, `lifestyle.recommended_habits`) **lack unique identifiers and status fields**, making direct adherence logging impossible for specific meals or scheduled workouts.
4. **Live Database Verification & Schema Drift:**
   - `public.lifestyle_recommendations` exists in the live Supabase production database (170 rows, RLS enabled), but was **never committed to `supabase/schema.sql` or `supabase/migrations/`**. Fresh environments and local setups fail to create it and fall back to SQLite.
   - `public.cycle_records` in production has a check constraint `flow IN ('light', 'medium', 'heavy')` and **lacks a `cycle_length` column**. The mobile app sends `flow: 'moderate'` and `cycle_length: 28`, triggering immediate PostgreSQL runtime errors on cycle submission.
   - `public.profiles` lacks a `lifestyle` column, causing logged 42703 PostgreSQL errors when the backend queries user context.
5. **Adaptive Feedback Loop Reality:** The recommendation engine is **partially adaptive, but blocked by cache fingerprinting**:
   - The engine *does* contain code to adapt status to `longitudinal.weight_trend_30d` and `longitudinal.logged_fitness_30d >= 3`.
   - However, the lightweight cache fingerprint (`is_cache_fresh`) **excludes fitness logs, food logs, and symptom records**. Subsequent visits hit the 30-day cache and serve stale recommendations without evaluating fresh user tracking.
   - Meal contents, calories, exercise duration, and adherence history **do not adapt caloric targets, macro distributions, or workout selections**.

---

## 1. Complete Frontend Investigation

### Screen-by-Screen Architectural Audit

Every React Native screen and component related to recommendations, meal plans, fitness, lifestyle, tracking, and dashboard overview was inspected and traced back to its data sources:

| Screen / Component Path | UI Purpose & Visual Features | Data Source / APIs Called | Implementation Reality & Operational Status |
|---|---|---|---|
| [`recommendations.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/recommendations.tsx) | Dedicated Recommendations Screen. Filter pills: Nutrition, Movement, Lifestyle, Follow-up. Structured cards with What / Why / How. | `useMemo` in component ([L67-L213](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/recommendations.tsx#L67-L213)). No API calls. | **UI-Only / Hardcoded:** Renders 8 static items (`rec-nut-1`, `rec-nut-2`, `rec-mov-1`, `rec-mov-2`, `rec-life-1`, `rec-life-2`, `rec-fol-1`, `rec-fol-2`). Buttons either route to other screens or trigger `Alert.alert("Reminder saved!")` ([L224-L228](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/recommendations.tsx#L224-L228)). Completely disconnected from Django backend. |
| [`meal-plan.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx) | Daily Meal Plan Screen. Slot cards (Breakfast, Lunch, Dinner, Snacks), calorie/macro breakdown, cuisine filters (South Asian, Vegetarian, Low-cost, High Protein). | `NutritionService.getPreferences` ([L272](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx#L272)), `NutritionService.getCurrentMealPlan` ([L281](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx#L281)), `useHealthStore.addMeal` ([L339](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx#L339)). | **Partially Implemented:** Fetches user cuisine preferences and current meal plan title from Django (`/v1/health/nutrition/preferences/`). However, the displayed meals are rendered from static catalog `CLINICAL_MEAL_CATALOG` ([L42-L242](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx#L42-L242)). "Log to Today" logs food to Supabase `nutrition_food_logs` via `healthStore`, but doesn't connect to Django AI planner or recommendation engine. |
| [`nutrition.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/nutrition.tsx) | Nutrition Diary & Calorie Tracker. Daily totals, meal breakdown, food logging modal, empty states. | Supabase `nutrition_food_logs` via `useHealthStore` / `nutritionService.getFoodLogsByDate` ([L278](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/nutritionService.ts#L278)). | **Functional for Tracking / Disconnected from Recommendations:** Successfully reads and writes food logs to Supabase `nutrition_food_logs`. Displays calorie/macro progress bars against targets from `healthStore`. Does not display or link to backend lifestyle recommendations. |
| [`movement.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/movement.tsx) | Exercise & Movement Screen. Tabs: Today, Week, Recommendations. Routine detail modal, activity logger. | Supabase `fitness_logs` via `useHealthStore.movementLogs` and `trackingService.logActivity` ([L338](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/movement.tsx#L338)). | **Partially Implemented:** Today and Week tabs accurately reflect logged `fitness_logs`. However, the "Recommendations" tab ([L818-L920](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/movement.tsx#L818-L920)) renders static lists `FEMALE_ROUTINES` and `MALE_ROUTINES` ([L44-L240](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/movement.tsx#L44-L240)). Completing a routine logs generic minutes to `fitness_logs` with no recommendation attribution. |
| [`guidance.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/guidance.tsx) | Guidance Hub Screen. Cards: Nutrition, Fitness, Health Education, AI Companion, Next Best Action. | Client-side routing to `recommendations?category=Nutrition`, `Movement`, `Lifestyle` ([L57-L67](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/guidance.tsx#L57-L67)). | **Navigation Router / Disconnected:** Serves as a navigational directory pointing into the hardcoded `recommendations.tsx` screen. |
| [`symptom-log.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/symptom-log.tsx) | Daily Symptom Check-in. Multi-select symptom chips, severity selector, notes, history list. | Supabase `symptom_logs` via `useHealthStore.saveSymptomCheckIn` and `trackingService.logSymptom` ([L1521](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/store/healthStore.tsx#L1521)). | **Functional for Tracking:** Successfully writes records to `symptom_logs` and syncs `common_symptoms` to `user_profiles`. However, check-in completion does not notify backend recommendation engine or trigger recommendation invalidation. |
| [`cycle-tracking.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/cycle-tracking.tsx) | Menstrual Cycle Tracker. Calendar, phase indicator, fertile window, period logging modal. | Supabase `cycle_records` via `trackingService.logCycle` / `updateCycle` ([L115-L126](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/cycle-tracking.tsx#L115-L126)). | **Runtime Failure:** Crashes on submission with PostgreSQL error. Sends `flow: 'moderate'` (DB requires `'light' \| 'medium' \| 'heavy'`) and `cycle_length: 28` (column does not exist on `cycle_records`). |
| [`water-log.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/water-log.tsx) | Hydration Logging Screen. Quick-add glasses (250ml), daily target progress ring. | Supabase `water_logs` via `trackingService.logWater` and `healthStore.addWaterMl` ([L1662](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/store/healthStore.tsx#L1662)). | **Functional for Tracking:** Successfully records and fetches daily hydration counts. Independent from recommendations. |
| [`FemaleDashboardOverview.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/components/dashboard/FemaleDashboardOverview.tsx) | Female Home Dashboard. Cards: PCOS Screening, Your Cycle, Today Summary, Medication Reminder, Next Best Action. | `useDashboardData('female')` → `dashboardService.ts` ([L45](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/components/dashboard/FemaleDashboardOverview.tsx#L45)). | **Disconnected from Recommendations:** Real-time data for screening, cycle, and today's tracking (calories, water, movement). **Contains no card or component displaying lifestyle recommendations, daily habits, or adherence scores.** |
| [`MaleDashboardOverview.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/components/dashboard/MaleDashboardOverview.tsx) | Male Home Dashboard. Cards: Hypogonadism Screening, Today's Progress, Nutrition, Medication Reminder. | `useDashboardData('male')` → `dashboardService.ts` ([L50](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/components/dashboard/MaleDashboardOverview.tsx#L50)). | **Disconnected from Recommendations:** Real-time data for hypogonadism assessment and daily totals. **Contains no card or component displaying lifestyle recommendations, male workouts, or adherence scores.** |
| [`female-screening-result.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/female-screening-result.tsx) | Female Screening Assessment Results. Risk gauge, risk factors (SHAP), disclaimer, Next Best Action. | Django `/v1/intelligence/assessment/active/` via `assessmentService.ts`. | **Assessment Only:** Accurately displays clinical risk probability and SHAP feature attributions. Primary CTA navigates to `/add-labs` (Tier 2). Secondary buttons route to reports and appointments. **Does not link to or preview lifestyle recommendations.** |
| [`male-screening-result.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/male-screening-result.tsx) | Male ADAM Screening Results. Probability gauge, risk level, ADAM factor breakdown. | Django `/v1/intelligence/assessment/male/tier1/` via `assessmentService.ts`. | **Assessment Only:** Accurately displays ADAM screening results. Primary CTA routes to Male Dashboard or `/add-labs`. **Does not link to or preview male lifestyle recommendations.** |

---

## 2. Recommendation-to-Logging Investigation

### Category-by-Category Analysis

| Category | Can User Mark Completed? | Can User Skip? | Can User Record Details? | Does Logging Create DB Record? | Does It Update Adherence? | Reflected in Dashboard? | ID Stability Across Regeneration? |
|---|---|---|---|---|---|---|---|
| **PCOS Nutrition Recommendations** | **No** (Button opens `/meal-plan` or shows Alert) | **No** (No skip control exists in UI) | **No** (Cannot log against the recommendation) | **No** (No recommendation logging call) | **No** (Status remains NEW/ACTIVE) | **No** (Dashboard only counts raw calories) | **Stable** (`nutr-strategy-primary` in backend, but unused by mobile) |
| **Male Nutrition Recommendations** | **No** (Button opens `/meal-plan` or shows Alert) | **No** (No skip control exists in UI) | **No** (Cannot log against the recommendation) | **No** (No recommendation logging call) | **No** (Status remains NEW/ACTIVE) | **No** (Dashboard only counts raw calories) | **Stable** (`nutr-strategy-primary` in backend, but unused by mobile) |
| **Meal Concepts (Breakfast, Lunch, Dinner)** | **Partial** (In `meal-plan.tsx`, user can tap "Log to Today") | **No** (Cannot skip) | **Partial** (Logs hardcoded title, calories, and macros) | **Yes** (Inserts into Supabase `nutrition_food_logs`) | **No** (Does not pass `recommendation_id` or notify backend) | **Yes** (Calories/protein added to Today Summary) | **Unstable** (Meal concepts generated by engine have **no unique ID**) |
| **Fitness Protocol (General)** | **No** (Button routes to `/movement`) | **No** (No skip control exists in UI) | **No** (Cannot record completion) | **No** (No recommendation logging call) | **No** (Status remains NEW/ACTIVE) | **No** (Dashboard only displays active minutes) | **Stable** (`fit-protocol-primary` in backend, but unused by mobile) |
| **Exercise Routines (Movement Tab)** | **Yes** (User can tap "Log Routine") | **No** (Cannot skip) | **Yes** (Inputs minutes and steps in modal) | **Yes** (Inserts into Supabase `fitness_logs`) | **No** (Routine IDs `f_cramps_pelvic` are local-only and unknown to backend) | **Yes** (Minutes added to Today and Weekly bar charts) | **Disconnected** (Routines defined in mobile TS, not in backend engine) |
| **Stress & Breathing Habits** | **No** (Button shows "Reminder saved!" Alert) | **No** (No skip control exists in UI) | **No** (Cannot record session details) | **No** (No record created anywhere) | **No** (No adherence updated) | **No** (Stress is not tracked on dashboard) | **Stable** (`habit-circadian-primary` in backend, but unused by mobile) |
| **Sleep Quality Recommendations** | **No** (Button shows "Reminder saved!" Alert) | **No** (No skip control exists in UI) | **No** (Cannot log sleep hours from rec) | **No** (No record created anywhere) | **No** (No adherence updated) | **No** (Sleep is not tracked on dashboard) | **Stable** (`habit-circadian-primary` in backend, but unused by mobile) |
| **Clinical Follow-up Recommendations** | **No** (Routes to `/add-labs` or `/specialists`) | **No** (No skip control exists in UI) | **No** (Logs labs separately under Track) | **Indirect** (Labs saved to `medical_reports`) | **No** (Status remains NEW/ACTIVE) | **Partial** (Shows lab count in events) | **Stable** (`clin-labs-tier2`, `clin-consult-eval` in backend) |

### Pillar Output Structure vs. `payload.recommendations[]`

The backend recommendation engine returns a dual-level data structure in [`LifestyleRecommendationsResult`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L163-L186):

```json
{
  "recommendations": [
    {
      "id": "nutr-strategy-primary",
      "category": "nutrition",
      "title": "Low-Glycemic Pacing for PCOS",
      "status": "NEW",
      "priority": "high"
    },
    {
      "id": "fit-protocol-primary",
      "category": "fitness",
      "title": "Supportive Low-Impact Conditioning",
      "status": "NEW",
      "priority": "moderate"
    }
  ],
  "nutrition": {
    "daily_targets": { "daily_calories_kcal": 1750, "protein": { "grams": 85 } },
    "targeted_swaps": [ { "replace_food": "White rice", "recommended_alternative": "Brown basmati" } ],
    "meal_concepts": [
      {
        "meal_type": "Breakfast",
        "title": "Besan Chilla with Mint Dahi",
        "key_ingredients": ["chickpea flour", "spinach", "dahi"],
        "est_calories": 340
      }
    ]
  },
  "fitness": {
    "protocol_name": "Supportive Low-Impact Conditioning",
    "weekly_schedule": [
      {
        "day_name": "Monday",
        "focus": "Supported Machine Strength",
        "duration_mins": 30,
        "intensity": "moderate",
        "key_movements": ["Seated Leg Press", "Lat Pulldown"]
      }
    ]
  },
  "lifestyle": {
    "circadian_headline": "Morning Sunlight & Consistent Sleep Routine",
    "recommended_habits": [
      {
        "category": "Circadian",
        "title": "Morning Sunlight Exposure",
        "action_item": "Step outdoors for 10-15 minutes within 1 hour of waking"
      }
    ]
  }
}
```

#### The Adherence Endpoint Capability Gap

The adherence update endpoint is [`LifestyleRecommendationStatusView`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/views_lifestyle.py#L216-L268), which delegates to [`LifestyleRepository.update_item_status`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_repository.py#L527-L640).

Inspection of lines 563–571 of `lifestyle_repository.py` reveals:
```python
# 2. Update status inside payload recommendations list
updated_item = False
if isinstance(payload, dict) and "recommendations" in payload:
    for item in payload.get("recommendations", []):
        if str(item.get("id")) == str(recommendation_id):
            item["status"] = valid_status
            updated_item = True
            break
```

**Architectural Limitation:**
1. The endpoint updates `item_statuses[recommendation_id]` and iterates **strictly over `payload["recommendations"]`**.
2. Items inside `payload["nutrition"]["meal_concepts"]`, `payload["fitness"]["weekly_schedule"]`, and `payload["lifestyle"]["recommended_habits"]` **do not have `id` fields and do not have `status` fields**.
3. Consequently, **the backend adherence system cannot record adherence on individual meals, individual workouts, or individual lifestyle habits**. It can only record status on the top-level macro strategy items (`nutr-strategy-primary`, `fit-protocol-primary`, `habit-circadian-primary`, `clin-labs-tier2`, `clin-consult-eval`).

---

## 3. Unified Lifestyle Tracking Investigation

### Shared Data Model vs. Siloed Tracking

The tracking subsystem was investigated to see whether nutrition, fitness, stress, sleep, symptoms, and hydration share a unified health data model:

```
[Mobile UI Actions]
      │
      ├── Log Meal ──────► Supabase: public.nutrition_food_logs (siloed)
      ├── Log Activity ──► Supabase: public.fitness_logs        (siloed)
      ├── Log Water ─────► Supabase: public.water_logs          (siloed)
      ├── Log Symptoms ──► Supabase: public.symptom_logs        (siloed)
      │                   └─► updates profiles.common_symptoms
      ├── Log Cycle ─────► Supabase: public.cycle_records       (siloed - fails on 'moderate')
      └── Mark Med ──────► Supabase: public.medication_logs     (siloed)

[Django Backend Intelligence]
      │
      ├── LifestyleRecommendationsView ──► Reads from Supabase via LifestyleContextBuilder
      │                                     (aggregates food_logs, fitness_logs, symptom_logs, profiles)
      └── LifestyleRecommendationStatusView ─► Writes to public.lifestyle_recommendations
                                              (completely disconnected from mobile tracking)
```

### Impact Analysis Across Core Subsystems

1. **Activity History:**
   - Fitness logs are written to `public.fitness_logs` ([`trackingService.ts:L652`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/trackingService.ts#L652)).
   - They appear in `movement.tsx` history and weekly bar charts.
   - They are **not linked** to any recommended routine or workout session.
2. **Recommendation Completion Status:**
   - Logging an activity in `movement.tsx` or logging a meal in `meal-plan.tsx` **never calls** `LifestyleRecommendationStatusView`.
   - Recommendation status remains frozen at `NEW` or `ACTIVE`.
3. **Dashboard Statistics:**
   - The dashboard consumes raw aggregates via [`dashboardService.ts`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/dashboardService.ts#L300-L450): sum of calories consumed, sum of water liters, sum of activity minutes.
   - It displays no recommendation adherence score, no completed habit count, and no active protocol cards.
4. **Daily and Weekly Progress:**
   - Daily progress tracks strictly against static targets: 1,800 kcal (female) / 2,200 kcal (male), 2.5 L water, 30 min (female) / 60 min (male) activity.
   - These targets are hardcoded in mobile fallbacks and not dynamically synchronized with the recommendation engine's computed `daily_targets.daily_calories_kcal`.
5. **Longitudinal Health Context:**
   - `LifestyleContextBuilder` queries `food_logs`, `fitness_logs`, and `symptom_records` over the last 30 days ([`lifestyle_context_builder.py:L719-L733`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_context_builder.py#L719-L733)).
   - It computes `logged_meals_30d`, `logged_fitness_30d`, and `active_tracking_consistency_pct`.
   - However, this context is only built when recommendations are regenerated, which rarely happens due to cache fingerprinting.
6. **Future Recommendation Personalization:**
   - Because user tracking actions do not invalidate the recommendation cache fingerprint, fresh tracking data **does not influence future recommendations** during routine app usage.

### Stale-State, Duplicate Records & Disconnected Services

- **Duplicate Tables:** The codebase contains legacy `public.food_logs` (12 rows in DB) and active `public.nutrition_food_logs` (1 row in DB). Mobile code specifically uses `nutrition_food_logs`, but backend `LifestyleContextBuilder` queries `food_logs` through `supabase_health_service.py` ([`supabase_health_service.py:L268`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/supabase_health_service.py#L268)). **Result: The backend reads from the wrong/legacy food log table!**
- **Disconnected Repositories:** Mobile state is managed via `useHealthStore` with React state + AsyncStorage, while backend recommendations are cached in `lifestyle_recommendations` in Supabase/SQLite. No synchronization protocol exists between the two.

---

## 4. Database Verification & Schema Analysis

### Live Supabase Database Comparison (`dqqrqwjeebecmgfsihtv`)

Through authorized read-only SQL queries via the Supabase toolchain, the actual PostgreSQL database structure was compared against the repository source code:

| Verification Target | Codebase Definition (`schema.sql` / code) | Live Supabase Database Structure | Defect Classification | Detailed Evidence & Root Cause |
|---|---|---|---|---|
| `public.lifestyle_recommendations` | Referenced in `lifestyle_repository.py:L414-L435`. **Absent from `schema.sql` and all migrations.** | **Exists in live DB.** Columns: `id` (uuid), `user_id` (uuid), `module` (text), `context_version` (text), `payload_json` (jsonb), `item_statuses` (jsonb), `is_active` (bool), `created_at` (timestamptz), `updated_at` (timestamptz). Contains **170 rows**. RLS enabled with 3 user policies. | **Confirmed Migration Drift:** The table was created manually or via uncommitted script in production. Any fresh environment deployed from repository files will fail to create the table, causing `lifestyle_repository` to catch `PGRST205` and silently fall back to local SQLite. |
| `cycle_records.flow` constraint | `schema.sql:L139`: `CHECK (flow IN ('light', 'medium', 'heavy'))`. Mobile sends `'moderate'` ([`trackingService.ts:L192`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/trackingService.ts#L192)). | **Constraint verified in live DB:** `conname: "cycle_records_flow_check"`, `CHECK ((flow = ANY (ARRAY['light'::text, 'medium'::text, 'heavy'::text])))`. | **Confirmed Runtime Defect:** When a female user logs a period in `cycle-tracking.tsx` (where default flow is `'Moderate'`), `trackingService.ts` executes `INSERT INTO cycle_records` with `flow: 'moderate'`. PostgreSQL aborts the transaction with constraint violation. |
| `cycle_records.cycle_length` column | Mobile sends `cycle_length: input.cycleLength \|\| 28` ([`trackingService.ts:L191`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/trackingService.ts#L191)). | **Verified absent in live DB.** Columns are: `id`, `user_id`, `period_start_date`, `period_end_date`, `flow`, `symptoms`, `notes`, `created_at`, `updated_at`. | **Confirmed Runtime Defect:** PostgREST rejects the insert with error `PGRST204: Could not find the 'cycle_length' column of 'cycle_records' in the schema cache`. `cycle_length` belongs in `user_profiles.cycle_length`, not `cycle_records`. |
| `profiles.lifestyle` column | Backend queries `profiles.lifestyle` in `supabase_health_service.py:L82-L95`. | **Verified absent in live DB.** `profiles` has columns `activity_level`, `sleep_hours`, `dietary_preference`, `fast_food_intake`, `regular_exercise`, but no column named `lifestyle`. | **Confirmed Runtime Warning:** Backend logs emit: `WARNING: column profiles.lifestyle does not exist, code 42703` on every profile fetch, falling back to individual profile columns. |
| AI Plan Persistence | `ai_lifestyle_planner.py:L213-L223` stores plan in `payload["ai_lifestyle_plan"]`. | Live DB `lifestyle_recommendations.payload_json` contains embedded `ai_lifestyle_plan` objects. | **Verified Working in Backend:** The AI plan is successfully persisted as a sub-document within `payload_json`. |
| Adherence Persistence | `lifestyle_repository.py:L576-L582` updates `item_statuses` and `payload_json`. | Live DB `lifestyle_recommendations.item_statuses` contains key-value status records. | **Verified Working in Backend:** Adherence status updates persist to Supabase when called via API. The disconnect is that mobile never calls this API. |
| User Isolation & RLS | RLS enabled on all health tables. | Verified on `lifestyle_recommendations`: policies `(auth.uid() = user_id)` for SELECT, INSERT, UPDATE. | **Verified Secure:** User isolation is enforced at the database level when authenticated with Supabase JWT. |
| Cache Invalidation | `LifestyleContextBuilder.is_cache_fresh` computes 16-char SHA-256 fingerprint. | Evaluated in memory and against stored record. | **Confirmed Functional Defect:** Fingerprint inputs exclude tracking tables. Logging food, workouts, or symptoms never invalidates the 30-day cache. |

---

## 5. Adaptive Recommendation Assessment

### Is the PMOSense Engine Truly Adaptive?

To classify a healthcare recommendation engine as **adaptive**, changes in user behavioral history (logged meals, completed exercise, symptom tracking, adherence) must demonstrably alter future generated outputs.

An exhaustive audit of the generation algorithms in `lifestyle_context_builder.py`, `lifestyle_safety_rules.py`, and `lifestyle_recommendation_engine.py` yields the following precise classification:

> **Verdict: The PMOSense engine is STATIC-PROFILE RULE-BASED with MINIMAL PSEUDO-ADAPTIVE STATUS HOOKS, and the adaptive loop is currently BLOCKED by cache fingerprinting.**

### Signal-by-Signal Trace Matrix

| User Tracking Signal | Is Signal Collected by App? | Is Signal Consumed by Context Builder? | Does It Affect Generated Recommendations? | Exact Mechanism in Recommendation Engine |
|---|---|---|---|---|
| **Logged Meals (Calories & Macros)** | Yes (`nutrition_food_logs`) | Partially (Queries legacy `food_logs`, counts `len(food_logs)`) | **No** | Caloric target is calculated strictly from static `weight_kg`, `height_cm`, `age`, and `gender` via Mifflin-St Jeor ([`engine:L252-L298`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L252-L298)). Actual calories or macros consumed **do not alter** caloric targets, macro targets, or meal concepts. |
| **Completed Workouts (Minutes & Steps)** | Yes (`fitness_logs`) | Yes (`len(fitness_logs)` in last 30d) | **Minor Status String Only** | If `longitudinal.logged_fitness_30d >= 3`, changes `fit-protocol-primary` status from `ACTIVE` to `MAINTAIN` ([`engine:L531-L533`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L531-L533)). **Does not change** workout selection, exercises, frequency, or intensity. |
| **Exercise Intensity & Modality** | Yes (`activity_type` in `fitness_logs`) | No (Ignored) | **No** | Workout protocol is selected from 1 of 4 static personas based on baseline BMI and stress level ([`engine:L1275-L1278`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L1275-L1278)). Actual activities logged have zero impact. |
| **Symptom Logging & Check-ins** | Yes (`symptom_logs` + `common_symptoms`) | Yes (`symptoms.active_symptoms`, `high_severity`) | **Yes (Food Swaps & Personas)** | 1. If "fatigue" is high severity + sedentary, activates `is_high_stress_fatigue` movement persona ([`engine:L1277`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L1277)).<br>2. Triggers targeted food swaps (e.g. acne → zinc/omega-3; bloating → probiotic/dahi; cramps → magnesium) ([`engine:L900-L960`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L900-L960)). |
| **Weight Tracking & Trends** | Yes (via assessment features or profile) | Yes (`longitudinal.weight_trend_30d`, `weight_delta_kg`) | **Yes (Nutrition Status String)** | If assessment count > 1 and BMI >= 25: downward trend sets nutrition status to `IMPROVING`; upward trend sets status to `REASSESS` ([`engine:L475-L480`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py#L475-L480)). Caloric target does not adapt. |
| **Recommendation Adherence (COMPLETED / SKIPPED)** | Yes (via backend status API) | Yes (Preserved in `lifestyle_repository.item_statuses`) | **No** | Stored statuses are re-attached to recommendation items upon regeneration ([`lifestyle_repository.py:L391-L396`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_repository.py#L391-L396)). **No logic in the recommendation engine reads past adherence to adapt difficulty, swap meals, or adjust targets.** |
| **Hydration Logging** | Yes (`water_logs`) | No (Ignored) | **No** | Hydration target is calculated from weight (35 ml/kg) or defaulted to 2.5L. Daily water logged is never evaluated. |
| **Cycle Tracking (Phase & Flow)** | Yes (`cycle_records`) | Partially (Extracts `cycle_length`, `period_duration`) | **No** | Cycle phase (follicular, luteal, menstrual) is **not used** by the engine to adjust caloric needs, exercise intensity, or macro distribution. |

### The Cache Fingerprint Blockade

Even for the few signals that *do* affect recommendation output (e.g. newly logged severe symptoms or weight changes), the backend caching mechanism in [`LifestyleContextBuilder.is_cache_fresh`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_context_builder.py#L1028-L1065) uses a lightweight fingerprint:

```python
# Lines 970-987 of lifestyle_context_builder.py
freshness_inputs = {
    "pathway": pathway,
    "allergens": final_allergens,
    "intolerances": final_intolerances,
    "dietary_preference": canonical_diet,
    "activity_level": activity_level,
    "weight_kg": w_val,
    "height_cm": h_val,
    "waist_cm": waist_val,
    "bmi": bmi_val,
    "sleep_hours": sleep_val,
    "stress_level": stress_level,
    "profile_updated_at": profile_updated_at,
    "has_assessment": has_assessment,
    "assessment_id": assessment_id,
    "assessment_level": assessment_level,
    "risk_category": risk_category,
    "assessment_updated_at": assessment_updated_at,
}
```

Notice that `freshness_inputs` **completely omits**:
- `symptom_logs`
- `fitness_logs`
- `food_logs`
- `water_logs`
- `item_statuses`

**Consequence:** When a user logs severe symptoms or completes workouts, `is_cache_fresh()` computes the fingerprint from profile and assessment timestamps only. Because profile and assessment have not changed, `is_cache_fresh()` returns `True`, and the API returns the cached recommendation set for up to 30 days without regenerating!

---

## 6. Complete User Journey Matrix

### Female PCOS Pathway

| Feature / Domain | Recommendation Generated in Backend? | Shown in Mobile UI? | Can User Log / Interact? | Persisted in Database? | Reflected in Dashboard? | Influences Future Plans? | End-to-End Status |
|---|---|---|---|---|---|---|---|
| **PCOS Caloric & Macro Targets** | **Yes** (`daily_targets` in `LifestyleRecommendationEngine:L252`) | **No** (Mobile shows hardcoded 1,800 kcal fallback in `nutrition.tsx:L106`) | **No** (User logs food, not targets) | **Yes** (Inside `lifestyle_recommendations.payload_json`) | **No** (Dashboard shows static target 1,800) | **No** (Calculated from baseline biometrics) | **Disconnected** |
| **PCOS Dietary Guidelines** | **Yes** (`strategy_summary` & `key_guidelines` in `engine:L390`) | **No** (Mobile shows hardcoded items in `recommendations.tsx:L67`) | **No** (Alert only: "Reminder saved!") | **Yes** (Inside `payload_json`) | **No** | **No** | **Disconnected** |
| **PCOS Targeted Food Swaps** | **Yes** (`targeted_swaps` based on SHAP/symptoms in `engine:L391`) | **No** (Not rendered in any mobile screen) | **No** | **Yes** (Inside `payload_json`) | **No** | **No** | **Disconnected / Backend-Only** |
| **PCOS Meal Concepts** | **Yes** (`meal_concepts` in `engine:L392`) | **No** (`meal-plan.tsx:L42` renders static `CLINICAL_MEAL_CATALOG`) | **Yes** (Can tap "Log to Today" in `meal-plan.tsx:L337`) | **Yes** (Food logged to `nutrition_food_logs`) | **Yes** (Calories added to Today card) | **No** (Logged meals don't adapt future plans) | **Partially Implemented (Catalog only)** |
| **PCOS Fitness Protocol** | **Yes** (`fitness_pillar.protocol_name` in `engine:L1291`) | **No** (`movement.tsx:L44` renders static `FEMALE_ROUTINES`) | **Yes** (Can tap "Log Routine" in `movement.tsx:L458`) | **Yes** (Logged to `fitness_logs`) | **Yes** (Minutes added to Today card) | **Minimal** (>=3 logs sets status string to MAINTAIN) | **Partially Implemented (Catalog only)** |
| **Menstrual Movement Adjustments** | **No** (Backend does not adjust fitness for cycle phase) | **Yes** (`f_cramps_pelvic` routine in `movement.tsx:L46`) | **Yes** (Can log minutes) | **Yes** (Logged to `fitness_logs`) | **Yes** (Minutes counted) | **No** | **UI-Only Logic** |
| **Circadian & Sleep Protocol** | **Yes** (`lifestyle_pillar` in `engine:L417`) | **No** (`recommendations.tsx:L150` renders hardcoded sleep card) | **No** (Alert only) | **Yes** (Inside `payload_json`) | **No** (Sleep not on dashboard) | **No** | **Disconnected** |
| **Stress & Cortisol Protocol** | **Yes** (Box breathing / pacing in `engine:L620`) | **No** (`recommendations.tsx:L167` renders hardcoded stress card) | **No** (Alert only) | **Yes** (Inside `payload_json`) | **No** (Stress not on dashboard) | **No** | **Disconnected** |
| **Symptom Check-in Logging** | **N/A** (Tracking feature) | **Yes** (`symptom-log.tsx:L50`) | **Yes** (Select symptoms, severity, cycle day) | **Yes** (`symptom_logs` + `profiles.common_symptoms`) | **No** (Symptoms not on dashboard) | **Blocked by cache** (Backend has swap rules, but cache doesn't refresh) | **Functional Tracking / Blocked Feedback** |
| **Cycle Tracking Logging** | **N/A** (Tracking feature) | **Yes** (`cycle-tracking.tsx:L50`) | **Fails at Runtime** | **No** (Crashes with check constraint / missing column) | **No** | **No** | **Broken at Runtime** |
| **Clinical Tier 2 Lab Follow-up** | **Yes** (`clin-labs-tier2` in `engine:L660`) | **Yes** (Next Best Action card in `FemaleDashboardOverview:L420`) | **Yes** (Routes to `/add-labs`) | **Yes** (`medical_reports` + `report_results`) | **Yes** (Events list updated) | **Yes** (Tier 2 labs trigger LEVEL_3_CLINICAL) | **Functional Navigation** |

---

### Male Hypogonadism Pathway

| Feature / Domain | Recommendation Generated in Backend? | Shown in Mobile UI? | Can User Log / Interact? | Persisted in Database? | Reflected in Dashboard? | Influences Future Plans? | End-to-End Status |
|---|---|---|---|---|---|---|---|
| **Male Caloric & Macro Targets** | **Yes** (`daily_targets` calibrated for testosterone in `engine:L256`) | **No** (Mobile shows hardcoded 2,200 kcal in `MaleDashboardOverview:L284`) | **No** | **Yes** (Inside `lifestyle_recommendations.payload_json`) | **No** (Shows static 2,200) | **No** | **Disconnected** |
| **Male Dietary Guidelines** | **Yes** (Zinc, magnesium, healthy fats in `engine:L378`) | **No** (`recommendations.tsx:L72` renders hardcoded male text) | **No** (Alert only) | **Yes** (Inside `payload_json`) | **No** | **No** | **Disconnected** |
| **Male Targeted Food Swaps** | **Yes** (Testosterone cofactor swaps in `engine:L391`) | **No** (Not rendered in mobile) | **No** | **Yes** (Inside `payload_json`) | **No** | **No** | **Disconnected / Backend-Only** |
| **Male Meal Concepts** | **Yes** (`meal_concepts` in `engine:L392`) | **No** (`meal-plan.tsx` renders generic catalog) | **Yes** (Can log to `nutrition_food_logs`) | **Yes** (`nutrition_food_logs`) | **Yes** (Calories on dashboard) | **No** | **Partially Implemented (Catalog only)** |
| **Male Resistance & Strength Protocol** | **Yes** (Compound resistance training in `engine:L1310`) | **No** (`movement.tsx:L174` renders static `MALE_ROUTINES`) | **Yes** (Can log minutes) | **Yes** (`fitness_logs`) | **Yes** (Minutes on dashboard) | **Minimal** (>=3 logs sets status to MAINTAIN) | **Partially Implemented (Catalog only)** |
| **Leydig Cell Nocturnal Sleep Protocol** | **Yes** (Deep sleep testosterone synthesis in `engine:L417`) | **No** (`recommendations.tsx:L156` hardcoded sleep card) | **No** (Alert only) | **Yes** (Inside `payload_json`) | **No** | **No** | **Disconnected** |
| **Sympathetic / Cortisol Modulation** | **Yes** (Adrenal-gonadal axis pacing in `engine:L620`) | **No** (`recommendations.tsx:L171` hardcoded stress card) | **No** (Alert only) | **Yes** (Inside `payload_json`) | **No** | **No** | **Disconnected** |
| **ADAM Symptom Tracking** | **N/A** (Tracking feature) | **Partial** (`symptom-log.tsx` uses physical/PCOS symptoms) | **Yes** | **Yes** (`symptom_logs`) | **No** | **No** | **Partially Implemented** |
| **Testosterone Lab Follow-up** | **Yes** (`clin-labs-tier2` in `engine:L660`) | **Yes** (`male-screening-result.tsx:L275` Recommended Next Step) | **Yes** (Routes to `/add-labs`) | **Yes** (`medical_reports` + `patient_clinical_state`) | **Yes** (Events list updated) | **Yes** (Total T < 300 ng/dL triggers high risk) | **Functional Navigation** |

---

## 7. Verification and Test Results

### 1. Verified by Live Database Introspection (Supabase `dqqrqwjeebecmgfsihtv`)
- `public.lifestyle_recommendations` exists with 170 rows and active RLS policies (`auth.uid() = user_id`), confirming remote persistence works in production despite absence from `schema.sql`.
- `public.cycle_records` has constraint `CHECK (flow IN ('light', 'medium', 'heavy'))` and lacks `cycle_length`. Confirms that mobile inserts with `flow: 'moderate'` and `cycle_length` will fail.
- `public.profiles` lacks `lifestyle` column. Confirms source of backend warning 42703.
- `public.nutrition_food_logs` (1 row) vs `public.food_logs` (12 rows). Confirms backend context builder queries the legacy/empty food table.

### 2. Verified by Backend Test Suite Execution
- Executed `python backend/manage.py test apps.intelligence.tests.test_lifestyle_recommendations`:
  - **Result: 35 tests passed in 26.93s (100% OK).**
  - Confirmed: Caloric floors, allergen exclusions, renal/hepatic rules, adolescent safety, pregnancy safety, and clinician review gates operate with complete deterministic precision.
  - Confirmed runtime warning emitted during test: `column profiles.lifestyle does not exist, code 42703`.
  - Confirmed runtime error handled during test: `invalid input syntax for type uuid: "778899"`.

### 3. Verified by Mobile Test Suite Execution
- Executed `node apps/mobile/services/mobileBugAuditRepair.test.mjs`:
  - **Result: 7 tests passed in 9.18ms.**
  - Test 5 (`Bug Audit Repair — Guidance and Recommendations Strict Filtering`) passed by filtering an **in-memory mock array**, confirming that mobile recommendations tests do not touch any backend API or real data layer.

### 4. Verified by Source Code Inspection
- `recommendations.tsx` (lines 67–213): Recommendations are entirely hardcoded in client-side `useMemo`.
- `meal-plan.tsx` (lines 42–242): Meal items rendered from static `CLINICAL_MEAL_CATALOG`.
- `movement.tsx` (lines 44–240): Exercise routines rendered from static `FEMALE_ROUTINES` and `MALE_ROUTINES`.
- `views_lifestyle.py` (lines 49–155): Backend endpoints exist and are fully functional, but are never queried by `apps/mobile`.
- `lifestyle_repository.py` (lines 563–571): Status updates can only modify top-level `payload.recommendations[]`, not meals, workouts, or habits.
- `lifestyle_context_builder.py` (lines 970–987): Cache freshness fingerprint ignores tracking tables, locking recommendations into stale cache for 30 days.

---

## 8. Confirmed Bugs and Incomplete Features

### Confirmed Runtime Bugs (P0 / P1)

1. **Cycle Tracking Insert Crash (P0 — Runtime Bug):**
   - **Location:** [`apps/mobile/services/trackingService.ts:L191-L192`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/trackingService.ts#L191-L192) and [`apps/mobile/app/(app)/cycle-tracking.tsx:L66`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/cycle-tracking.tsx#L66).
   - **Defect:** Mobile sends `flow: 'moderate'` (violates DB check `flow IN ('light', 'medium', 'heavy')`) and `cycle_length: 28` (column does not exist in `cycle_records`).
   - **Impact:** Female users cannot log menstrual cycles in the mobile app; all submissions fail with PostgreSQL errors.
2. **Backend Food Log Query Target Mismatch (P1 — Functional Bug):**
   - **Location:** [`backend/apps/intelligence/services/supabase_health_service.py:L268`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/supabase_health_service.py#L268).
   - **Defect:** Backend queries `public.food_logs` (legacy table), whereas mobile writes to `public.nutrition_food_logs`.
   - **Impact:** Backend `LifestyleContextBuilder` never sees user food logs; `logged_meals_30d` is always evaluated as 0.
3. **Repository Migration Drift (P1 — Deployment Risk):**
   - **Location:** [`supabase/schema.sql`](file:///c:/Users/hp/Desktop/Projects/PMOSense/supabase/schema.sql) and [`supabase/migrations/`](file:///c:/Users/hp/Desktop/Projects/PMOSense/supabase/migrations).
   - **Defect:** `public.lifestyle_recommendations` exists in production but is absent from repository SQL files.
   - **Impact:** Any new staging or production environment built from repository scripts fails to create the table, causing silent fallback to local SQLite.
4. **Missing Profile Column Query Warning (P2 — Runtime Noise):**
   - **Location:** [`backend/apps/intelligence/services/supabase_health_service.py:L82-L95`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/supabase_health_service.py#L82-L95).
   - **Defect:** Queries non-existent column `profiles.lifestyle`, triggering error code 42703 on every profile fetch.

### Incomplete Features & Architectural Disconnects

5. **Recommendations Screen is UI-Only:** [`recommendations.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/recommendations.tsx) never calls `/api/v1/intelligence/lifestyle-recommendations/`. Users see generic hardcoded cards instead of their personalized AI/rule-based plan.
6. **No Mobile Recommendation Service:** `apps/mobile/services/` contains `nutritionService.ts`, `trackingService.ts`, and `assessmentService.ts`, but **no `recommendationService.ts` or `lifestyleService.ts`**.
7. **No Recommendation Adherence from Mobile:** Mobile app has zero UI controls to mark a recommendation as `COMPLETED` or `SKIPPED`, and never calls `/api/v1/intelligence/lifestyle-recommendations/status/`.
8. **Dashboard Ignores Recommendations:** Neither `FemaleDashboardOverview` nor `MaleDashboardOverview` displays active recommendations, daily habit checklists, or adherence progress.
9. **Granular Adherence Impossible in Backend:** Backend adherence status method cannot update individual meals in `nutrition.meal_concepts` or workouts in `fitness.weekly_schedule` because they lack unique IDs and status attributes.
10. **Recommendation Regeneration Blocked by Cache Fingerprint:** Cache fingerprint ignores tracking logs. Logging meals, workouts, or symptoms never triggers recommendation recalculation.

---

## 9. Missing Database & API Relationships

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              MISSING RELATIONSHIPS                                │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 1. nutrition_food_logs ──[MISSING: recommendation_id]──► lifestyle_recommendations │
│    • Current: Food logs are isolated.                                             │
│    • Needed: food_logs.plan_meal_id / recommendation_id link to meal concepts.     │
│                                                                                   │
│ 2. fitness_logs ─────────[MISSING: recommendation_id]──► lifestyle_recommendations │
│    • Current: Fitness logs store only duration/steps.                             │
│    • Needed: fitness_logs.routine_id / session_id link to weekly workout session. │
│                                                                                   │
│ 3. symptom_logs ─────────[MISSING: feedback_trigger]───► lifestyle_recommendations │
│    • Current: Logging severe fatigue or cramps does not invalidate rec cache.     │
│    • Needed: Symptom log trigger updates profile_updated_at or cache fingerprint. │
│                                                                                   │
│ 4. Mobile Client ────────[MISSING: API integration]────► /lifestyle-recommendations│
│    • Current: recommendations.tsx is hardcoded client-side useMemo.               │
│    • Needed: Typed recommendationService.ts fetching live recommendations.        │
│                                                                                   │
│ 5. Dashboard Summary ────[MISSING: adherence aggregation]─► dashboardService.ts   │
│    • Current: DashboardData interface has no recommendations or adherence field.  │
│    • Needed: DashboardData.adherence: { score, completedCount, totalCount }.      │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Prioritized Development Roadmap

### Phase 1: Database & Runtime Defect Repairs (Immediate Fixes)
*Objective: Eliminate runtime crashes, schema drift, and query mismatches.*
- **Step 1.1:** Fix `cycle_records` logging in `apps/mobile/services/trackingService.ts`:
  - Map `flow: 'Moderate'` → `'medium'` (valid values: `'light'`, `'medium'`, `'heavy'`).
  - Remove `cycle_length` from `cycle_records` insert payload. Save `cycle_length` strictly to `profiles.cycle_length`.
- **Step 1.2:** Add `20261023_add_lifestyle_recommendations_schema.sql` to `supabase/migrations/` and update `supabase/schema.sql` to document `public.lifestyle_recommendations` with indexes and RLS.
- **Step 1.3:** Fix backend query in `backend/apps/intelligence/services/supabase_health_service.py:L268`:
  - Query `public.nutrition_food_logs` (with fallback to `food_logs`).
  - Remove non-existent `lifestyle` column from `profiles` SELECT query.

### Phase 2: Granular Recommendation Architecture Upgrades (Backend)
*Objective: Enable granular tracking and adherence on meals, workouts, and lifestyle habits.*
- **Step 2.1:** Assign deterministic IDs to all granular pillar outputs in [`LifestyleRecommendationEngine`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_recommendation_engine.py):
  - `MealConcept`: Add `id: str` (e.g. `meal-bf-besan-chilla`), `status: str = 'NEW'`.
  - `WorkoutSession`: Add `id: str` (e.g. `workout-mon-resistance`), `status: str = 'NEW'`.
  - `HabitRecommendation`: Add `id: str` (e.g. `habit-circ-sunlight`), `status: str = 'NEW'`.
- **Step 2.2:** Upgrade [`LifestyleRepository.update_item_status`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_repository.py#L527-L640) to traverse and update statuses inside `nutrition.meal_concepts`, `fitness.weekly_schedule`, and `lifestyle.recommended_habits` in addition to top-level `recommendations[]`.
- **Step 2.3:** Fix cache fingerprinting in [`LifestyleContextBuilder`](file:///c:/Users/hp/Desktop/Projects/PMOSense/backend/apps/intelligence/services/lifestyle_context_builder.py#L970-L1026):
  - Include `latest_symptom_at`, `latest_fitness_at`, and `latest_food_at` timestamps in `freshness_inputs`.
  - Logging a new symptom or workout immediately produces a fresh fingerprint and triggers regeneration on next fetch.

### Phase 3: Mobile Service & Store Integration (Frontend Core)
*Objective: Connect React Native to the authoritative recommendation backend.*
- **Step 3.1:** Create `apps/mobile/services/recommendationService.ts`:
  - `getRecommendations(token, pathway, refresh?)`: Calls `GET /api/v1/intelligence/lifestyle-recommendations/`.
  - `updateAdherence(token, recommendationId, status, note?)`: Calls `PATCH /api/v1/intelligence/lifestyle-recommendations/status/`.
  - `getAIPlan(token, pathway)`: Calls `GET /api/v1/intelligence/lifestyle-ai-plan/`.
- **Step 3.2:** Extend `useHealthStore` in `apps/mobile/store/healthStore.tsx`:
  - Add `recommendations: LifestyleRecommendationsResult | null`.
  - Add `isLoadingRecommendations: boolean`.
  - Add `loadRecommendations(forceRefresh?: boolean): Promise<void>`.
  - Add `setRecommendationStatus(id: string, status: 'COMPLETED' | 'SKIPPED'): Promise<boolean>`.

### Phase 4: Frontend Screen Connections & Adherence UI
*Objective: Replace hardcoded screens with live, personalized, interactive recommendations.*
- **Step 4.1:** Overhaul [`recommendations.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/recommendations.tsx):
  - Replace static `allRecommendations` with live data from `useHealthStore.recommendations`.
  - Render actual personalized strategy, calorie targets, and model-attributed why/how.
  - Add interactive adherence controls: **"Mark Completed ✓"** and **"Skip ✕"** buttons that call `setRecommendationStatus`.
- **Step 4.2:** Connect [`meal-plan.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/meal-plan.tsx):
  - Replace static `CLINICAL_MEAL_CATALOG` with `recommendations.nutrition.meal_concepts` or live `lifestyle-ai-plan`.
  - "Log to Today" passes `plan_meal_id: meal.id` to `nutrition_food_logs` and marks meal as `COMPLETED`.
- **Step 4.3:** Connect [`movement.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/app/%28app%29/movement.tsx):
  - Recommendations tab renders `recommendations.fitness.weekly_schedule` instead of static arrays.
  - "Log Routine" pre-fills exercises from the recommended session and marks workout as `COMPLETED`.

### Phase 5: Dashboard Overview & Unified Progress Integration
*Objective: Surface active recommendations and adherence metrics directly on home screens.*
- **Step 5.1:** Update [`dashboardService.ts`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/services/dashboardService.ts):
  - Fetch active recommendation summary and adherence count for today.
  - Add `DashboardRecommendationSummary` to `DashboardData`.
- **Step 5.2:** Add **"Today's Plan & Recommendations"** card to [`FemaleDashboardOverview.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/components/dashboard/FemaleDashboardOverview.tsx) and [`MaleDashboardOverview.tsx`](file:///c:/Users/hp/Desktop/Projects/PMOSense/apps/mobile/components/dashboard/MaleDashboardOverview.tsx):
  - Displays today's recommended workout, meal focus, and top habit.
  - Shows quick-toggle completion buttons and overall adherence progress ring (e.g. "2 of 4 completed today").

---

## 11. Exact Implementation Order with Dependencies

```
[Step 1: DB & Tracking Fixes]
   │  • Fix cycle_records flow 'moderate' -> 'medium'
   │  • Remove cycle_length from cycle_records payload
   │  • Fix food_logs -> nutrition_food_logs in backend
   │  • Commit lifestyle_recommendations migration
   ▼
[Step 2: Backend Granular Upgrades]
   │  • Add unique IDs to meal_concepts, weekly_schedule, recommended_habits
   │  • Update update_item_status to handle granular IDs
   │  • Include tracking timestamps in cache fingerprint
   ▼
[Step 3: Mobile Service & Store Layer]
   │  • Create apps/mobile/services/recommendationService.ts
   │  • Add recommendation state & adherence actions to healthStore.tsx
   ▼
[Step 4: Screen Overhauls]
   │  • Connect recommendations.tsx to live backend + complete/skip buttons
   │  • Connect meal-plan.tsx to recommendations.nutrition.meal_concepts
   │  • Connect movement.tsx to recommendations.fitness.weekly_schedule
   ▼
[Step 5: Dashboard & Feedback Loop]
      • Add recommendation summary to dashboardService.ts
      • Render "Today's Recommendations" card on Female/Male Dashboards
      • Verify full feedback loop: Log -> Adherence -> Dashboard -> Adaptation
```

---

## 12. Suggested Test Cases & Acceptance Criteria

### Test Suite 1: Cycle Tracking Persistence
- **TC-1.1:** Given a female user selecting `'Moderate'` flow and cycle length 28, when saving a cycle log, the payload sent to Supabase contains `flow: 'medium'`, excludes `cycle_length`, and the insert succeeds with status 201 without constraint violation.
- **TC-1.2:** Verify cycle log appears in `cycle-tracking.tsx` history and Female Dashboard shows `Cycle Day X`.

### Test Suite 2: Granular Adherence API
- **TC-2.1:** Given an active recommendation with meal concept `meal-bf-besan-chilla`, when sending `PATCH /api/v1/intelligence/lifestyle-recommendations/status/` with `recommendation_id: "meal-bf-besan-chilla"` and `status: "COMPLETED"`, the response returns 200 and the meal's status in `payload_json.nutrition.meal_concepts` is updated to `"COMPLETED"`.
- **TC-2.2:** Verify that calling `GET /api/v1/intelligence/lifestyle-recommendations/` returns the updated status and does not overwrite it upon cache hit.

### Test Suite 3: Mobile Recommendation Integration
- **TC-3.1:** Given an authenticated female user with Tier 1 PCOS screening (elevated risk, high BMI), when opening `recommendations.tsx`, the screen displays the calibrated caloric target (e.g. 1,650 kcal with safety floor notice) and SHAP-attributed dietary strategy from the backend, not static strings.
- **TC-3.2:** Tapping "Mark Completed" on a recommendation updates its UI state to `Completed ✓`, persists the status to the backend via `recommendationService.updateAdherence`, and updates the dashboard adherence widget.

### Test Suite 4: Cache Invalidation & Adaptive Feedback Loop
- **TC-4.1:** Given a cached recommendation set for a user, when the user logs 3 severe symptom check-ins for "fatigue" in `symptom-log.tsx`, the next fetch of recommendations detects a stale fingerprint (`latest_symptom_at` changed), rebuilds context, and switches the fitness pillar to the restorative/fatigue movement persona.
- **TC-4.2:** Given a user with initial weight 80kg, when a new assessment or profile update records 77kg (-3kg), the next recommendation fetch displays `IMPROVING` status on the nutrition strategy item with text acknowledging the 3kg weight reduction.

---

## Conclusion & Architectural Recommendation

The PMOSense recommendation engine is clinically sound and algorithmically robust on the backend. Its deterministic safety rules, caloric floors, allergen filters, and SHAP-aligned evidence linkages provide a reliable healthcare foundation.

The primary task ahead is **not to rewrite the recommendation algorithms**, but to **bridge the gap between backend intelligence and mobile execution**:
1. Fix the two immediate database/runtime errors in cycle tracking and table schema.
2. Provide typed client access from React Native to the lifestyle API.
3. Replace hardcoded mock lists with live recommendation data.
4. Enable bidirectional adherence logging so user actions complete the clinical loop.
