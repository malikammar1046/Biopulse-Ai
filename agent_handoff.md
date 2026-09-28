# BioPulse Personalized Nutrition Engine — Agent Handoff

## Purpose

This document is the permanent context/handoff file for any coding agent working on the BioPulse `Meal/` module.

Before making changes, read this file completely, then inspect the actual referenced datasets, engine modules, tests, and `walkthrough.md`.

Do not assume this document overrides the repository. If a statement conflicts with actual code or locked datasets, investigate before editing.

---

# 1. Project Context

BioPulse AI is a reproductive/endocrine health screening platform.

Current condition pathways:

* Female: PCOS screening
* Male: Hypogonadism / late-onset hypogonadism screening

The nutrition module is a shared engine for both pathways.

It must NOT become two independent meal planners.

Architecture:

```text
User
 ↓
Neutral Nutrition Engine
 ↓
Condition Evidence Layer
 ├── PCOS
 └── Hypogonadism
 ↓
Safe Pakistani Meal Catalog
 ↓
Future Meal Scoring
 ↓
Future Portion Optimization
 ↓
Future Daily Plan
 ↓
Future 7-Day Plan
```

The nutrition module must remain scientifically conservative and clearly distinguish screening from diagnosis.

---

# 2. Current Repository Location

Project root:

```text
C:\Users\hp\Desktop\Projects\PMOSense
```

Nutrition module:

```text
PMOSense/
└── Meal/
```

Important directories:

```text
Meal/
├── Nutrition_sources/
├── data/
│   ├── raw/
│   ├── processed/
│   ├── research/
│   └── evidence/
├── engine/
├── evidence/
├── scripts/
└── tests/

Note: Canonical documentation files (`agent_handoff.md` and `walkthrough.md`) reside at the repository root (`PMOSense/`). Subdirectory paths such as `Meal/walkthrough.md` or `Meal/AGENT_HANDOFF.md` do not exist.
```

---

# 3. Locked Phase History

## Phase 2 / 2.5 — Pakistani Food Composition Recovery

Status:

```text
LOCKED_FINAL
```

Source:

Food Composition Table for Pakistan, Revised 2001.

Recovered:

```text
198 / 198 foods
```

Important rule:

All nutrition values must preserve source food state and provenance.

Never convert missing nutrient values to zero.

---

## Phase 3 — Traditional Pakistani Recipe Ground Truth

Status:

```text
LOCKED_FINAL
```

17 laboratory-tested Pakistani traditional dishes were recovered from the FCT.

The authoritative nutrition basis is:

```text
per_100g_cooked
```

The 17 dishes are:

1. Chapati
2. Daal Masoor Curry
3. Alu Gosht
4. Kalool / Kidney Bean Curry
5. Kofta
6. Pulao Gosht
7. Shami Kabab
8. Chapal Kabab
9. Chicken Curry
10. Haleem
11. Machli
12. Sajji
13. Biryani
14. Halwa Suji
15. Zarda
16. Kheer
17. Halwa Gajar

Important rules:

* Laboratory values are authoritative.
* Ingredient-derived nutrition is QA only.
* Never overwrite laboratory nutrition with recipe calculations.
* Never average independent laboratory observations.
* Unknown ingredient quantity remains NULL.
* Never invent cooked yields.
* Never infer serving size from recipe weight.

Two standard portion references exist:

```text
PK_PORTION_001 — Standard Whole Wheat Chapati
PK_PORTION_002 — Plain Boiled Rice
```

These are portion references, not composite recipes.

---

# 4. Phase 4 — Pakistani Planner Catalog

Status:

```text
LOCKED_FINAL
```

Phase 4 built the scientific Pakistani food foundation that future planning uses.

## Final catalog architecture

```text
47 independent laboratory observations
        ↓
40 canonical composite dishes

+

29 READY_DIRECT food components

+

2 standard portions

=

71 planner-ready entities
```

Final readiness:

```text
READY_RECIPE_AND_NUTRITION = 17
READY_NUTRITION_ONLY       = 23
READY_DIRECT_COMPONENT     = 29
READY_STANDARD_PORTION     = 2

TOTAL = 71
```

Important processed datasets:

```text
Meal/data/processed/pakistan_nutrition_observations.csv
Meal/data/processed/pakistan_canonical_dishes.csv
Meal/data/processed/pakistan_planner_nutrition_profiles.csv
Meal/data/processed/pakistan_master_planner_catalog.csv
Meal/data/processed/pakistan_master_catalog_traceability.csv
```

Important research datasets:

```text
Meal/data/research/khan_2019_pakistani_dishes.csv
Meal/data/research/fct_khan_identity_resolution.csv
Meal/data/research/pakistan_recipe_cross_source_validation.csv
Meal/data/research/gastronomy_source_recovery.csv
Meal/data/research/pakistan_recipe_source_registry.csv
```

---

# 5. FCT + Khan 2019 Evidence Architecture

Phase 4B introduced a second Pakistani laboratory source:

Imran Khan et al. (2019), Progress in Nutrition.

It contains:

```text
30 laboratory-tested Pakistani dishes
```

Seven are confirmed same-dish overlaps with FCT.

One fish preparation is a related variant and remains separate.

Final result:

```text
17 FCT dishes
+
23 distinct Khan additions / retained variant
=
40 canonical laboratory-tested Pakistani dishes
```

Independent observations remain preserved.

Example:

```text
Alu Gosht
├── FCT observation
└── Khan 2019 observation
```

The planner selects one default observation according to evidence policy but never averages them.

For confirmed FCT/Khan same-dish pairs, FCT is generally the planner default because it includes laboratory analysis plus a documented formulation.

The Khan observation remains alternate evidence.

---

# 6. Nutrition Authority vs Recipe Authority

These are separate concepts.

A dish may have strong laboratory nutrition evidence but no complete recipe formulation.

Example:

```text
Chicken Karahi

nutrition_authority =
LAB_TESTED_PEER_REVIEWED_PAKISTAN

nutrition_planner_eligible = true

recipe_instruction_eligible = false
```

Never fabricate recipe instructions for nutrition-only dishes.

---

# 7. Critical Phase 4 Rules

Never modify locked Phase 2–4 datasets unless explicitly performing a validated correction.

Never:

* average independent lab observations;
* overwrite FCT observations with Khan observations;
* invent missing nutrients;
* convert NULL to zero;
* invent source serving sizes;
* invent recipe gram quantities;
* create recipes from names alone;
* promote raw ingredients into ready-to-eat foods;
* introduce foods merely to increase catalog size.

Current catalog size is sufficient for the FYP.

Do not restart recipe acquisition unless specifically requested.

---

# 8. Phase 5A & 5A.1 — Neutral Nutrition Target, Safety Foundation & Hardening

Status:

```text
PHASE_5A_1 = LOCKED_FINAL
```

Detailed implementation is documented in:

```text
walkthrough.md (at repository root)
```

Read that file completely before modifying Phase 5 logic.

Engine modules:

```text
Meal/engine/
├── __init__.py
├── schemas.py
├── profile.py
├── energy.py
├── nutrient_targets.py
├── safety.py
├── nutrient_coverage.py
└── orchestrator.py
```

Public entry point:

```python
build_nutrition_target_profile(
    profile: UserNutritionProfile
) -> NutritionTargetProfile
```

Execution:

```text
validate profile
 ↓
age routing / BMI
 ↓
profile safety
 ↓
2023 NASEM EER
 ↓
neutral goal policy
 ↓
DRI / AMDR / AI targets
 ↓
NutritionTargetProfile
```

---

# 9. Phase 5A Scientific Rules

## Energy

Uses:

```text
National Academies Dietary Reference Intakes for Energy, 2023
```

PAL-specific equations from Tables S-2 and S-3.

PAL values:

```text
INACTIVE
LOW_ACTIVE
ACTIVE
VERY_ACTIVE
```

Height is in centimeters.

Weight is in kilograms.

Age calculation supports decimal age.

Adolescent boundaries:

```text
12.00–13.99
14.00–18.99
19.00+
```

Energy tests use independent golden fixtures:

```text
Meal/tests/fixtures/nasem_2023_eer_golden.json
```

Do not modify expected golden values merely to make implementation pass.

---

## Protein

RDA floors:

```text
12–13 years = 0.95 g/kg/day
14–18 years = 0.85 g/kg/day
19+ years   = 0.80 g/kg/day
```

AMDR:

```text
12–18 = 10–30% energy
19+   = 10–35% energy
```

---

## Carbohydrate

Preserve separately:

```text
RDA = 130 g/day
AMDR = 45–65% energy
```

Only raise:

```text
TARGET_REFERENCE_CONFLICT
```

when the RDA is above the AMDR maximum.

Do not create invalid ranges.

---

## Fat

```text
Adolescent = 25–35% energy
Adult      = 20–35% energy
```

---

## Fiber

Official age/sex DRI AI and the derived:

```text
14 g / 1000 kcal
```

are stored separately.

Do not call the energy-density derivation the official AI.

Fiber is currently:

```text
SOFT_TARGET_ONLY
```

because planner data coverage is incomplete.

---

# 10. Weight Management Policy

Phase 5A does NOT automatically create weight-loss deficits.

For:

```text
GRADUAL_WEIGHT_MANAGEMENT
```

the neutral engine keeps maintenance EER.

Status:

```text
DEFERRED_TO_EVIDENCE_BASED_GOAL_LAYER
```

No arbitrary:

```text
400 kcal deficit
20% deficit
1200 kcal floor
1500 kcal floor
```

exists in Phase 5A.

For adolescents:

```text
automatic_weight_loss_deficit = false
```

must remain absolute.

---

# 11. BMI Policy

Adults may use standard BMI interpretation.

For adolescents:

```text
BMI calculated numerically
but
bmi_interpretation =
NOT_INTERPRETED_FOR_ADOLESCENT
```

Do not apply adult BMI categories to adolescents.

---

# 12. Safety Rules

Important principle:

```text
known absent != unknown
```

For allergies:

```text
known allergen present
→ EXCLUDED_KNOWN_ALLERGEN

unknown allergen status
→ EXCLUDED_UNKNOWN_ALLERGEN_STATUS

explicitly absent + complete assessment
→ eligible with respect to allergen
```

Allergens currently supported by catalog metadata:

```text
DAIRY
EGG
FISH
WHEAT
NUTS
```

Meat is NOT an allergen.

Dietary restrictions are handled separately.

Unknown dietary compatibility must not automatically be considered safe.

---

# 13. Special Medical State Routing

Phase 5A does not provide therapeutic nutrition plans for:

```text
pregnancy
lactation
significant kidney disease
significant liver disease
medically managed diabetes
eating-disorder flag
```

When flagged:

```text
automated_personalized_planning_allowed = false
safety_status =
REQUIRES_CLINICIAN_GUIDED_NUTRITION
```

Do not diagnose these conditions.

---

# 14. Core Macro Coverage

Current runtime audit:

```text
63 / 71 entities
core_macro_optimization_eligible = true

8 / 71
core_macro_optimization_eligible = false
```

The 8 incomplete entities are:

```text
PK_COMP_005
PK_COMP_016
PK_COMP_017
PK_COMP_018
PK_COMP_019
PK_COMP_020
PK_COMP_026
PK_COMP_029
```

Never fill missing macro values with zero.

---

# 15. Current Test Baseline

Before new work:

```text
pytest Meal/tests/ -v
```

Expected locked baseline (Phase 5B):

```text
251 passed
```

Test breakdown across 12 test files:
- `test_energy.py`: 29 passed (24 Golden Fixtures + 5 Boundary/Edge)
- `test_nutrient_coverage.py`: 22 passed
- `test_nutrient_targets.py`: 24 passed
- `test_orchestrator.py`: 11 passed
- `test_phase5a1_hardening.py`: 99 passed
- `test_profile.py`: 11 passed
- `test_safety.py`: 21 passed
- `test_evidence_registry.py`: 10 passed
- `test_evidence_context.py`: 6 passed
- `test_pcos_evidence.py`: 8 passed
- `test_hypogonadism_evidence.py`: 6 passed
- `test_condition_immutability.py`: 4 passed

Phase 4 regression:

```text
python Meal/scripts/validate_phase4c_canonical_catalog.py
→ 517 / 517 PASS

python Meal/scripts/validate_phase4_library.py
→ 395 / 395 PASS
```

If these fail before your changes, investigate before continuing.

---

# 16. Current Development Boundary

Current completed state:

```text
Phase 2   LOCKED
Phase 2.5 LOCKED
Phase 3   LOCKED
Phase 4A  LOCKED
Phase 4B  LOCKED
Phase 4C  LOCKED
Phase 5A  LOCKED
Phase 5A.1 LOCKED
Phase 5B  LOCKED_FINAL
```

Not yet implemented:

```text
Phase 6  — Meal planner / ranking / optimization
Phase 7  — Persistence / API
Phase 8  — React nutrition UI
Phase 9  — Shopping list / meal logging / adherence
```

---

# 17. NEXT TASK — Phase 6: Meal Planner / Ranking / Optimization

The immediate next task after Phase 5B is Phase 6.

Phase 5B must NOT generate meals.

Phase 5B must NOT modify Phase 5A EER or macro targets.

Architecture:

```text
NutritionTargetProfile
        ↓
Condition Evidence Context
        ↓
PCOS or Hypogonadism Evidence Profile
        ↓
ConditionNutritionProfile
```

It should annotate evidence-backed priorities only.

---

# 18. PCOS Rules for Phase 5B

Primary evidence:

```text
2023 International Evidence-Based Guideline
for Assessment and Management of PCOS
```

Core rule:

There is no evidence supporting one specific dietary composition as superior for PCOS outcomes.

Therefore never automatically implement:

```text
low-carb PCOS diet
ketogenic PCOS diet
high-protein PCOS diet
insulin-sensitizing diet
hormone-balancing diet
PCOS-friendly diet
```

Condition layer should preserve Phase 5A:

```text
energy
protein
carbohydrate
fat
fiber references
```

PCOS layer may annotate:

```text
healthy eating priority
sustainable eating priority
metabolic health priority
preference alignment
weight-management context where personally appropriate
```

Lifestyle benefits must not be presented as dependent only on weight loss.

---

# 19. Hypogonadism Rules for Phase 5B

Do not create:

```text
testosterone-boosting foods
testosterone diet
hormone boosting meals
hypogonadism curing diet
```

BioPulse screening does not diagnose hypogonadism.

Condition layer may annotate:

```text
healthy eating
metabolic health
weight-management relevance where appropriate
```

but must not promise changes in testosterone.

---

# 20. Screening vs Diagnosis

Introduce separate context:

```text
SCREENING_PATHWAY
SELF_REPORTED_DIAGNOSIS
CLINICIAN_CONFIRMED
UNKNOWN
```

Never translate:

```text
high screening risk
```

into:

```text
user has PCOS
```

or:

```text
user has hypogonadism
```

Screening explainability / SHAP must remain separate from nutrition recommendations.

Never map:

```text
cycle irregularity
hair growth
skin darkening
ADAM score
libido symptom
SHAP importance
```

directly into food prescriptions.

---

# 21. Phase 5B Evidence Architecture

Recommended:

```text
Meal/evidence/
├── __init__.py
├── schemas.py
├── registry.py
├── pcos.py
└── hypogonadism.py

Meal/data/evidence/
└── nutrition_evidence_registry.json
```

Every condition rule must contain provenance.

Suggested record fields:

```text
evidence_id
condition
topic
statement
implementation_effect
evidence_strength
recommendation_strength
applies_to
source_title
source_organization
source_year
source_url
source_section
review_status
notes
```

Condition effects should be enums, not arbitrary numeric macro manipulation.

Examples:

```text
PRESERVE_NEUTRAL_TARGETS
PRIORITIZE_HEALTHY_EATING
PRIORITIZE_METABOLIC_HEALTH
PRIORITIZE_SUSTAINABILITY
CONSIDER_WEIGHT_MANAGEMENT_CONTEXT
PREVENT_EXCESS_WEIGHT_GAIN_ADOLESCENT
NO_SPECIFIC_DIET_SUPPORTED
NO_THERAPEUTIC_FOOD_CLAIMS
```

---

# 22. Phase 5B Critical Immutability Rule

Take a Phase 5A `NutritionTargetProfile`.

Before Phase 5B:

```text
EER = X
protein = A/B
carbohydrate = C/D
fat = E/F
```

Apply PCOS.

Values must remain:

```text
X
A/B
C/D
E/F
```

Apply hypogonadism.

Values must again remain unchanged.

This should be enforced by automated tests.

---

# 23. Absolutely Do Not Do Yet

Do not implement:

```text
food ranking
meal scoring
portion optimization
breakfast generation
lunch generation
daily plans
7-day plans
shopping lists
Django API
Supabase persistence
React Meal UI
```

until Phase 5B has been reviewed and locked.

---

# 24. Required Agent Workflow

Before editing:

1. Read this file.
2. Read `walkthrough.md` (at repository root).
3. Inspect actual Phase 5A engine modules.
4. Run existing tests.
5. Inspect current schemas before adding new types.
6. Audit before editing.
7. Preserve all locked phases.
8. Implement only Phase 5B.
9. Run all new tests plus existing regression tests.
10. Produce a new walkthrough section documenting exactly what changed.

Do not rewrite working architecture unnecessarily.

Do not silently repair unrelated parts of the repository.

Do not proceed to the next phase automatically.
