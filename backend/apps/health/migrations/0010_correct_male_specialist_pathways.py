"""
BioPulse AI Health App — Correct Male Specialists Incorrectly Seeded as Both.
Fixes urologists/andrologists (Dr. Hafiz Abdul Momin, Dr. Muhammad Fayyaz,
Prof. Dr. Irfan Nazir, Dr. Khalil Ahmad, Dr. Ahmad Nadeem) to male_hypogonadism.
"""
from django.db import migrations


def correct_male_pathways(apps, schema_editor):
    Doctor = apps.get_model("health", "Doctor")

    MALE_UPDATES = {
        "dr-hafiz-abdul-momin": {
            "pathway": "male_hypogonadism",
            "relevance_reason": "Specialist for Male Hormonal Health & Andrology",
        },
        "dr-muhammad-fayyaz": {
            "pathway": "male_hypogonadism",
            "relevance_reason": "Specialist for Urological & Endocrine Health",
        },
        "prof-dr-irfan-nazir": {
            "pathway": "male_hypogonadism",
            "relevance_reason": "Specialist for Male Hormonal Health & Andrology",
        },
        "dr-khalil-ahmad": {
            "pathway": "male_hypogonadism",
            "relevance_reason": "Specialist for Male Hormonal Health & Andrology",
        },
        "dr-ahmad-nadeem": {
            "pathway": "male_hypogonadism",
            "relevance_reason": "Specialist for Male Hormonal Health & Andrology",
        },
    }

    for slug, data in MALE_UPDATES.items():
        Doctor.objects.filter(slug=slug).update(
            pathway=data["pathway"],
            relevance_reason=data["relevance_reason"],
        )


def reverse_male_pathways(apps, schema_editor):
    Doctor = apps.get_model("health", "Doctor")
    slugs = [
        "dr-hafiz-abdul-momin",
        "dr-muhammad-fayyaz",
        "prof-dr-irfan-nazir",
        "dr-khalil-ahmad",
        "dr-ahmad-nadeem",
    ]
    Doctor.objects.filter(slug__in=slugs).update(
        pathway="both",
        relevance_reason="Specialist for Reproductive & Sexual Medicine",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("health", "0009_populate_doctor_pathways"),
    ]

    operations = [
        migrations.RunPython(correct_male_pathways, reverse_male_pathways),
    ]
