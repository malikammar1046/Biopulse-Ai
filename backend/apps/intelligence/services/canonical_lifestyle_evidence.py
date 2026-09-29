"""
backend/apps/intelligence/services/canonical_lifestyle_evidence.py

Canonical Evidence & Clinical Guideline Registry for BioPulse AI Lifestyle Recommendations.
Maps every recommendation pillar, safety threshold, and behavioral guideline to
authoritative professional medical organizations and clinical practice consensus documents:
- International Evidence-based Guideline for the Assessment and Management of PCOS (2023)
- Endocrine Society Clinical Practice Guidelines (Male Hypogonadism, 2018; PCOS, 2013)
- American Urological Association (AUA) Guidelines on Testosterone Deficiency (2018)
- World Health Organization (WHO) Guidelines on Physical Activity and Sedentary Behaviour (2020)
- American College of Sports Medicine (ACSM) Exercise Guidelines (2021)
- American Diabetes Association (ADA) Standards of Care in Diabetes (2024)
- American Academy of Sleep Medicine (AASM) & Sleep Research Society (SRS) Consensus (2015)
- Institute of Medicine (IOM) / Dietary Guidelines for Americans (USDA/HHS, 2020-2025)

Separates rule generation logic from evidence metadata, ensuring zero hardcoded clinical
overreach or unsourced claims in patient-facing outputs.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class EvidenceEntry:
    evidence_id: str
    short_title: str
    source_organization: str
    guideline_document: str
    publication_year: int
    evidence_category: str  # 'guideline_supported' | 'general_wellness_guidance' | 'product_safety_guardrail' | 'evidence_limited'
    clinical_summary: str
    patient_rationale: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evidence_id": self.evidence_id,
            "short_title": self.short_title,
            "source_organization": self.source_organization,
            "guideline_document": self.guideline_document,
            "publication_year": self.publication_year,
            "evidence_category": self.evidence_category,
            "clinical_summary": self.clinical_summary,
            "patient_rationale": self.patient_rationale,
        }


LIFESTYLE_EVIDENCE_REGISTRY: Dict[str, EvidenceEntry] = {
    # -------------------------------------------------------------
    # 1. Nutrition & Energy
    # -------------------------------------------------------------
    "pcos_balanced_nutrition": EvidenceEntry(
        evidence_id="pcos_balanced_nutrition",
        short_title="Healthy Lifestyle & Dietary Quality in PCOS",
        source_organization="International PCOS Network / Endocrine Society",
        guideline_document="International Evidence-based Guideline for the Assessment and Management of Polycystic Ovary Syndrome",
        publication_year=2023,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Recommends tailored dietary interventions emphasizing overall nutritional quality, balanced macronutrients, "
            "and low-glycemic complex carbohydrates. No single dietary composition is clinically superior; focus is on "
            "sustainable behavioral adherence and metabolic support."
        ),
        patient_rationale=(
            "Focusing on high-fiber whole foods, lean proteins, and unsaturated fats supports steady energy and blood sugar balance."
        ),
    ),
    "product_safety_floor_energy": EvidenceEntry(
        evidence_id="product_safety_floor_energy",
        short_title="Conservative Energy Intake Floor (Product Safety Guardrail)",
        source_organization="BioPulse Clinical Governance / General Nutrition Consensus",
        guideline_document="Dietary Guidelines for Americans & Academy of Nutrition and Dietetics Adult Energy Standards",
        publication_year=2020,
        evidence_category="product_safety_guardrail",
        clinical_summary=(
            "Acts as an automated system guardrail (minimum 1200 kcal for females, 1500 kcal for males) to prevent extreme, "
            "unsupervised crash dieting. Not an individualized clinical prescription."
        ),
        patient_rationale=(
            "A safety guardrail ensures recommended daily calories do not drop below basic metabolic needs."
        ),
    ),
    "ada_low_glycemic_quality": EvidenceEntry(
        evidence_id="ada_low_glycemic_quality",
        short_title="Glycemic Quality & Dietary Fiber",
        source_organization="American Diabetes Association (ADA)",
        guideline_document="Standards of Care in Diabetes — Facilitating Positive Health Behaviors and Well-being to Improve Health Outcomes",
        publication_year=2024,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Emphasizes replacement of refined starches and added sugars with intact whole grains, legumes, vegetables, "
            "and minimally processed foods with high dietary fiber content to flatten postprandial glycemic excursions."
        ),
        patient_rationale=(
            "Choosing fiber-rich legumes and whole grains helps keep blood sugar levels steady and sustains satiety after meals."
        ),
    ),
    "general_adult_hydration": EvidenceEntry(
        evidence_id="general_adult_hydration",
        short_title="General Daily Fluid Guidance",
        source_organization="Institute of Medicine (IOM) / National Academies",
        guideline_document="Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate",
        publication_year=2005,
        evidence_category="general_wellness_guidance",
        clinical_summary=(
            "General adult fluid guidance provides typical reference intakes (~2.0-2.7 L total daily fluids for women, "
            "~2.5-3.7 L for men from all beverages and moisture in food). Must not be prescribed as an exact clinical formula; "
            "fluid needs vary widely by temperature, physical activity, sweat rate, and underlying cardiopulmonary/renal status."
        ),
        patient_rationale=(
            "Drinking adequate water throughout the day supports natural hydration. Fluid needs naturally vary based on thirst, exercise, and climate."
        ),
    ),
    "male_lifestyle_support": EvidenceEntry(
        evidence_id="male_lifestyle_support",
        short_title="Lifestyle & Metabolic Health in Male Hypogonadism",
        source_organization="Endocrine Society / American Urological Association (AUA)",
        guideline_document="Diagnosis and Management of Testosterone Deficiency: AUA Guideline / Endocrine Society Guidelines",
        publication_year=2018,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Recommends lifestyle interventions—including balanced whole-food nutrition, physical activity, and weight "
            "management—to support metabolic health, strength, and body composition in men with borderline or low testosterone. "
            "Lifestyle interventions support metabolic vitality and do not replace medical evaluation or clinical management."
        ),
        patient_rationale=(
            "Wholesome nutrition, consistent movement, and restorative sleep support physical strength, metabolic balance, and overall vitality."
        ),
    ),

    # -------------------------------------------------------------
    # 2. Physical Activity & Resistance
    # -------------------------------------------------------------
    "who_aerobic_activity": EvidenceEntry(
        evidence_id="who_aerobic_activity",
        short_title="Moderate Aerobic Physical Activity Guidelines",
        source_organization="World Health Organization (WHO)",
        guideline_document="WHO Guidelines on Physical Activity and Sedentary Behaviour",
        publication_year=2020,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Recommends all adults undertake 150–300 minutes of moderate-intensity or 75–150 minutes of vigorous-intensity "
            "physical activity throughout the week for substantial cardiometabolic health benefits and mortality reduction."
        ),
        patient_rationale=(
            "Gradually accumulating regular moderate aerobic movement across most days supports cardiovascular and metabolic health."
        ),
    ),
    "acsm_resistance_training": EvidenceEntry(
        evidence_id="acsm_resistance_training",
        short_title="Progressive Muscle-Strengthening Activity",
        source_organization="American College of Sports Medicine (ACSM)",
        guideline_document="ACSM's Guidelines for Exercise Testing and Prescription (11th Edition)",
        publication_year=2021,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Recommends progressive resistance training targeting major muscle groups 2 to 3 days per week to preserve lean muscle mass, "
            "improve non-insulin dependent glucose disposal, and support functional strength."
        ),
        patient_rationale=(
            "Strength training 2 to 3 times weekly helps build and preserve muscle, supporting physical strength and steady energy."
        ),
    ),
    "joint_friendly_movement": EvidenceEntry(
        evidence_id="joint_friendly_movement",
        short_title="Comfort Pacing for Higher Body Weight",
        source_organization="CDC / ACSM",
        guideline_document="Physical Activity for People with Joint Conditions and Higher Weight",
        publication_year=2022,
        evidence_category="general_wellness_guidance",
        clinical_summary=(
            "Promotes low-impact movement modalities (brisk walking, stationary cycling, water aerobics, seated resistance) "
            "to maximize comfort, minimize joint loading, and encourage long-term exercise adherence."
        ),
        patient_rationale=(
            "Lower-impact activities like walking or cycling provide excellent health benefits while keeping joints comfortable."
        ),
    ),

    # -------------------------------------------------------------
    # 3. Circadian, Sleep & Stress Pacing
    # -------------------------------------------------------------
    "aasm_sleep_duration": EvidenceEntry(
        evidence_id="aasm_sleep_duration",
        short_title="Nocturnal Adult Sleep Duration",
        source_organization="American Academy of Sleep Medicine (AASM) & Sleep Research Society (SRS)",
        guideline_document="Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement",
        publication_year=2015,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Consensus recommendation that adults should sleep 7 or more hours per night on a regular basis to promote optimal health, "
            "including healthy endocrine signaling, metabolic regulation, and cardiovascular safety."
        ),
        patient_rationale=(
            "Consistent sleep of 7 to 9 hours nightly gives your body time for essential restorative rest and daytime vitality."
        ),
    ),
    "circadian_morning_light": EvidenceEntry(
        evidence_id="circadian_morning_light",
        short_title="Morning Natural Light Exposure",
        source_organization="Sleep Research Society / Circadian Biology Consensus",
        guideline_document="Circadian Rhythms and Sleep Health Practice Review",
        publication_year=2021,
        evidence_category="general_wellness_guidance",
        clinical_summary=(
            "Exposure to outdoor daylight within an hour of waking provides ocular light intensity that entrains the central circadian clock, "
            "reinforcing daytime alertness and nighttime melatonin onset."
        ),
        patient_rationale=(
            "Spending a few minutes in natural morning sunlight helps align your body's internal clock and supports evening sleepiness."
        ),
    ),
    "respiratory_relaxation_pause": EvidenceEntry(
        evidence_id="respiratory_relaxation_pause",
        short_title="Breath-Paced Relaxation Pause",
        source_organization="National Institutes of Health (NIH) / Mind-Body Health Practices",
        guideline_document="Mind-Body Practices and Stress Modulation Overview",
        publication_year=2023,
        evidence_category="general_wellness_guidance",
        clinical_summary=(
            "Cyclic slow breathing patterns with prolonged exhalations promote acute shifts toward parasympathetic autonomic tone and "
            "self-reported relaxation. Useful as an adjunct behavioral pacing tool."
        ),
        patient_rationale=(
            "Taking a few slow, intentional breaths with extended exhales provides a simple pause to ease tension during busy days."
        ),
    ),

    # -------------------------------------------------------------
    # 4. Clinical Review & Safety Escalations
    # -------------------------------------------------------------
    "aua_endocrine_testosterone_threshold": EvidenceEntry(
        evidence_id="aua_endocrine_testosterone_threshold",
        short_title="Serum Total Testosterone Review Threshold",
        source_organization="American Urological Association (AUA) / Endocrine Society",
        guideline_document="Diagnosis and Management of Testosterone Deficiency: AUA Guideline / Endocrine Society Clinical Practice Guideline",
        publication_year=2018,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Recommends total testosterone < 300 ng/dL as a clinical decision threshold that warrants repeat morning fasting measurement, "
            "clinical symptom assessment, and formal evaluation by a physician. A single reading is non-diagnostic."
        ),
        patient_rationale=(
            "A testosterone level below 300 ng/dL warrants repeat morning testing and discussion with a physician to evaluate symptoms and overall context."
        ),
    ),
    "ada_glycemic_threshold": EvidenceEntry(
        evidence_id="ada_glycemic_threshold",
        short_title="Glycemic Review Threshold",
        source_organization="American Diabetes Association (ADA)",
        guideline_document="Classification and Diagnosis of Diabetes: Standards of Care in Diabetes",
        publication_year=2024,
        evidence_category="guideline_supported",
        clinical_summary=(
            "HbA1c >= 6.5% or fasting plasma glucose >= 126 mg/dL represent clinical diagnostic criteria for diabetes that require "
            "repeat confirmatory testing in the absence of unequivocal hyperglycemia. Automated systems must escalate to clinical review."
        ),
        patient_rationale=(
            "Elevated blood sugar or HbA1c values warrant formal medical evaluation and repeat confirmatory testing by a doctor."
        ),
    ),
    "endocrine_society_hyperprolactinemia": EvidenceEntry(
        evidence_id="endocrine_society_hyperprolactinemia",
        short_title="Elevated Prolactin Review Threshold",
        source_organization="Endocrine Society",
        guideline_document="Diagnosis and Treatment of Hyperprolactinemia: An Endocrine Society Clinical Practice Guideline",
        publication_year=2011,
        evidence_category="guideline_supported",
        clinical_summary=(
            "Serum prolactin > 30 ng/mL warrants clinical evaluation to exclude medication effects, stress, hypothyroidism, or pituitary adenomas."
        ),
        patient_rationale=(
            "Elevated prolactin levels warrant clinical follow-up with a healthcare provider to investigate underlying causes."
        ),
    ),
}


def get_evidence_entry(evidence_id: str) -> Optional[EvidenceEntry]:
    """Retrieve structured evidence entry by ID."""
    return LIFESTYLE_EVIDENCE_REGISTRY.get(evidence_id)


def get_evidence_metadata_dict(evidence_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve dictionary representation of evidence entry."""
    entry = get_evidence_entry(evidence_id)
    return entry.to_dict() if entry else None
