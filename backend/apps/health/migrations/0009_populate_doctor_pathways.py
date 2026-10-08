"""
BioPulse AI Health App — Populate Doctor Pathways and Clinical Relevance Rationale.
"""
from django.db import migrations


def populate_pathways(apps, schema_editor):
    Doctor = apps.get_model("health", "Doctor")

    female_keywords = [
        "gynecolog", "obstetric", "women's health", "pcos", "antenatal", "maternal", "female"
    ]
    male_keywords = [
        "urolog", "androlog", "hypogonadism", "men's health", "testosterone", "male health"
    ]

    for doc in Doctor.objects.all():
        name_lower = (doc.name or "").lower()
        spec_lower = (doc.specialty or "").lower()
        bio_lower = (doc.short_bio or "").lower()
        services_lower = (doc.services_offered or "").lower()
        combined = f"{spec_lower} {bio_lower} {services_lower}"

        # 1. Dual-gender / Sexologists (Only if truly dual-practice, with verified female/PCOS or general scope)
        is_male_specialist = any(k in spec_lower for k in ["urolog", "androlog", "male sexual health", "male health"])
        has_female_care = any(k in combined for k in ["pcos", "female", "women's"])

        if ("sexolog" in combined or "dual" in combined) and (has_female_care or not is_male_specialist):
            doc.pathway = "both"
            doc.relevance_reason = "Specialist for Reproductive & Sexual Medicine"
        # 2. Female Gynecologists & PCOS Specialists
        elif any(k in combined for k in female_keywords) and not is_male_specialist and "male health clinic" not in name_lower:
            doc.pathway = "female_pcos"
            if "endocrin" in combined or "hormon" in combined:
                doc.relevance_reason = "Specialist for PCOS & Hormonal Evaluation"
            elif "fertility" in combined or "infertility" in combined:
                doc.relevance_reason = "Specialist for Reproductive Care & PCOS"
            else:
                doc.relevance_reason = "Specialist for Gynecological & PCOS Care"
        # 3. Male Urologists, Andrologists, Hypogonadism
        elif any(k in combined for k in male_keywords) or is_male_specialist or "male health clinic" in name_lower:
            doc.pathway = "male_hypogonadism"
            if "androlog" in combined or "testosterone" in combined or "hypogonadism" in combined:
                doc.relevance_reason = "Specialist for Male Hormonal Health & Andrology"
            else:
                doc.relevance_reason = "Specialist for Urological & Endocrine Health"
        # 4. Specific known doctors
        elif "sarah ahmed" in name_lower:
            doc.pathway = "female_pcos"
            doc.relevance_reason = "Specialist for Hormonal & Metabolic Evaluation"
        elif "imran siddiqui" in name_lower:
            doc.pathway = "male_hypogonadism"
            doc.relevance_reason = "Specialist for Hormonal & Endocrine Evaluation"
        elif "usman raza" in name_lower:
            doc.pathway = "male_hypogonadism"
            doc.relevance_reason = "Specialist for Andrology & Male Hormones"
        elif "hina tariq" in name_lower:
            doc.pathway = "female_pcos"
            doc.relevance_reason = "Specialist for Women's Health & PCOS"
        else:
            doc.pathway = "both"
            doc.relevance_reason = "Specialist for General Health & Clinical Evaluation"

        doc.save(update_fields=["pathway", "relevance_reason"])


def unpopulate_pathways(apps, schema_editor):
    Doctor = apps.get_model("health", "Doctor")
    Doctor.objects.all().update(pathway="female_pcos", relevance_reason=None)


class Migration(migrations.Migration):

    dependencies = [
        ("health", "0008_add_doctor_pathway_and_relevance"),
    ]

    operations = [
        migrations.RunPython(populate_pathways, unpopulate_pathways),
    ]
