"""
backend/apps/health/services/health_pdf_generator.py

BioPulse AI — Personal Health Summary PDF Generator.
Generates an A4, multi-page, publication-quality medical health summary PDF
for authenticated BioPulse AI users.

Color Palette:
  Primary Teal: #16B8C4
  Deep Navy:    #073B72
  Text Slate:   #1E293B
  Muted Slate:  #55718F
  Soft Border:  #D7EAF2
  Soft Card:    #F5FBFD
"""

from __future__ import annotations

import io
import logging
import os
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.pdfgen import canvas
    from reportlab.platypus import (
        HRFlowable,
        KeepTogether,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    colors = None
    A4 = None
    ParagraphStyle = None
    getSampleStyleSheet = None
    canvas = type("canvas", (), {"Canvas": object})
    HRFlowable = KeepTogether = Paragraph = SimpleDocTemplate = Spacer = Table = TableStyle = None


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accurately calculates total page count
    and draws consistent running headers and footers on every page.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[Dict[str, Any]] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count: int) -> None:
        self.saveState()
        page_width, page_height = A4

        # Running Header (pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#073B72"))
            self.drawString(36, page_height - 28, "BioPulse AI")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#55718F"))
            self.drawString(88, page_height - 28, "• Personal Health Summary")

            self.setStrokeColor(colors.HexColor("#D7EAF2"))
            self.setLineWidth(0.75)
            self.line(36, page_height - 32, page_width - 36, page_height - 32)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#D7EAF2"))
        self.setLineWidth(0.75)
        self.line(36, 32, page_width - 36, 32)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#55718F"))
        self.drawString(
            36,
            20,
            "BioPulse AI • Confidential Health Record • For Informational & Health-Monitoring Purposes Only",
        )

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(page_width - 36, 20, page_str)

        self.restoreState()


class HealthSummaryPDFGenerator:
    """
    Builds the structured Personal Health Summary PDF using ReportLab Platypus.
    """

    def __init__(self, data: Dict[str, Any]) -> None:
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError("ReportLab is required for PDF generation. Install reportlab.")
        self.data = data
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self) -> None:
        # Base modifications
        normal = self.styles["Normal"]
        normal.textColor = colors.HexColor("#1E293B")
        normal.fontSize = 8.5
        normal.leading = 11.5
        normal.fontName = "Helvetica"

        # Brand Custom Styles
        self.styles.add(
            ParagraphStyle(
                "DocTitle",
                parent=normal,
                fontName="Helvetica-Bold",
                fontSize=20,
                leading=24,
                textColor=colors.HexColor("#073B72"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "DocSubtitle",
                parent=normal,
                fontName="Helvetica",
                fontSize=10,
                leading=13,
                textColor=colors.HexColor("#16B8C4"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "SectionHeading",
                parent=normal,
                fontName="Helvetica-Bold",
                fontSize=11.5,
                leading=15,
                textColor=colors.HexColor("#073B72"),
                spaceBefore=10,
                spaceAfter=4,
            )
        )
        self.styles.add(
            ParagraphStyle(
                "TableHeader",
                parent=normal,
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10,
                textColor=colors.HexColor("#073B72"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "TableCell",
                parent=normal,
                fontName="Helvetica",
                fontSize=8,
                leading=10.5,
                textColor=colors.HexColor("#1E293B"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "TableCellBold",
                parent=normal,
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10.5,
                textColor=colors.HexColor("#073B72"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "MutedText",
                parent=normal,
                fontName="Helvetica",
                fontSize=7.5,
                leading=10,
                textColor=colors.HexColor("#55718F"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "DisclaimerText",
                parent=normal,
                fontName="Helvetica",
                fontSize=7.5,
                leading=10.5,
                textColor=colors.HexColor("#334155"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                "BadgeText",
                parent=normal,
                fontName="Helvetica-Bold",
                fontSize=7.5,
                leading=9,
                textColor=colors.white,
            )
        )

    def generate(self) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=42,
            bottomMargin=42,
        )

        story: List[Any] = []

        # A. Header & Report Info
        story.extend(self._build_header_section())

        # B. Profile & Biometrics
        story.extend(self._build_profile_section())

        # C. Latest Screening Assessment
        story.extend(self._build_assessment_section())

        # D. Top Factors & SHAP Explanations
        story.extend(self._build_shap_factors_section())

        # E. Symptoms History
        story.extend(self._build_symptoms_section())

        # F. BMI, Weight & Measurements
        story.extend(self._build_measurements_section())

        # G. Laboratory Results & Medical Reports
        story.extend(self._build_labs_section())

        # H. Medications
        story.extend(self._build_medications_section())

        # I. Appointments
        story.extend(self._build_appointments_section())

        # J. Health Progress Summary
        story.extend(self._build_progress_summary_section())

        # K. Medical Disclaimer
        story.extend(self._build_disclaimer_section())

        doc.build(story, canvasmaker=NumberedCanvas)
        return buffer.getvalue()

    # -------------------------------------------------------------------------
    # Section Builders
    # -------------------------------------------------------------------------

    def _build_header_section(self) -> List[Any]:
        items: List[Any] = []
        gen_time = self.data.get("generated_at") or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        patient_name = self.data.get("patient_name") or "Authorized Patient"
        pathway = self.data.get("pathway") or "General Health"
        pathway_label = (
            "Female Reproductive Health (PCOS)"
            if "female" in pathway.lower() or "pcos" in pathway.lower()
            else "Male Hormonal Vitality & Endocrine Health"
            if "male" in pathway.lower()
            else pathway.title()
        )

        header_table_data = [
            [
                Paragraph("BioPulse AI", self.styles["DocTitle"]),
                Paragraph(f"<b>Generated:</b> {gen_time}<br/><b>Patient:</b> {patient_name}", self.styles["MutedText"]),
            ],
            [
                Paragraph("PERSONAL HEALTH SUMMARY & CLINICAL PROFILE", self.styles["DocSubtitle"]),
                Paragraph(f"<b>Pathway:</b> {pathway_label}", self.styles["MutedText"]),
            ],
        ]

        t = Table(header_table_data, colWidths=[330, 192])
        t.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 4))
        items.append(
            Paragraph(
                "<i>This comprehensive record consolidates self-reported indicators, verified laboratory biomarkers, "
                "screening assessment findings, and longitudinal monitoring records from your BioPulse AI account.</i>",
                self.styles["MutedText"],
            )
        )
        items.append(Spacer(1, 8))
        items.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#16B8C4"), spaceAfter=8))
        return items

    def _build_profile_section(self) -> List[Any]:
        items: List[Any] = []
        p = self.data.get("profile") or {}

        height = f"{p.get('height_cm')} cm" if p.get("height_cm") is not None else "Not provided"
        weight = f"{p.get('weight_kg')} kg" if p.get("weight_kg") is not None else "Not provided"

        # Calculate or extract BMI
        bmi = p.get("bmi")
        if bmi is None and p.get("height_cm") and p.get("weight_kg"):
            try:
                h_m = float(p["height_cm"]) / 100.0
                w_kg = float(p["weight_kg"])
                if h_m > 0:
                    bmi = round(w_kg / (h_m * h_m), 1)
            except Exception:
                bmi = None
        bmi_str = f"{bmi} kg/m²" if bmi is not None else "Not provided"

        dob = p.get("date_of_birth") or "Not provided"
        age = p.get("age") or "Not provided"
        gender = (p.get("gender") or "Not provided").title()

        cycle_info = "Not applicable"
        if "female" in str(p.get("pathway", "")).lower() or gender == "Female":
            reg = (p.get("period_regularity") or "").replace("_", " ").title()
            c_len = p.get("cycle_length") or "28"
            cycle_info = f"{c_len} days ({reg})" if reg else f"{c_len} days"

        conditions = ", ".join(p.get("conditions", [])) if p.get("conditions") else "None recorded"
        diet = (p.get("dietary_preference") or "Not specified").replace("_", " ").title()
        sleep = f"{p.get('sleep_hours')} hrs/night" if p.get("sleep_hours") is not None else "Not provided"
        water = f"{p.get('daily_water_glasses')} glasses/day" if p.get("daily_water_glasses") is not None else "Not provided"

        items.append(Paragraph("1. Patient Profile & Clinical Baselines", self.styles["SectionHeading"]))

        profile_table_data = [
            [
                Paragraph("<b>Full Name:</b>", self.styles["TableCellBold"]),
                Paragraph(str(self.data.get("patient_name") or "Authorized Patient"), self.styles["TableCell"]),
                Paragraph("<b>Biological Sex:</b>", self.styles["TableCellBold"]),
                Paragraph(gender, self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Date of Birth:</b>", self.styles["TableCellBold"]),
                Paragraph(f"{dob} (Age: {age})", self.styles["TableCell"]),
                Paragraph("<b>Height / Weight:</b>", self.styles["TableCellBold"]),
                Paragraph(f"{height} / {weight}", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>BMI Index:</b>", self.styles["TableCellBold"]),
                Paragraph(bmi_str, self.styles["TableCell"]),
                Paragraph("<b>Menstrual Cycle:</b>", self.styles["TableCellBold"]),
                Paragraph(cycle_info, self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Recorded Conditions:</b>", self.styles["TableCellBold"]),
                Paragraph(conditions, self.styles["TableCell"]),
                Paragraph("<b>Sleep & Hydration:</b>", self.styles["TableCellBold"]),
                Paragraph(f"{sleep}, {water}", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Dietary Style:</b>", self.styles["TableCellBold"]),
                Paragraph(diet, self.styles["TableCell"]),
                Paragraph("<b>Activity Level:</b>", self.styles["TableCellBold"]),
                Paragraph((p.get("activity_level") or "Not recorded").replace("_", " ").title(), self.styles["TableCell"]),
            ],
        ]

        t = Table(profile_table_data, colWidths=[105, 155, 105, 157])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5FBFD")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 8))
        return items

    def _build_assessment_section(self) -> List[Any]:
        items: List[Any] = []
        assessment = self.data.get("assessment") or {}

        items.append(Paragraph("2. Latest Screening Assessment", self.styles["SectionHeading"]))

        if not assessment or not assessment.get("has_assessment", True):
            items.append(
                Paragraph(
                    "<i>No screening assessment is available for this account. Complete onboarding or submit Tier 1 screening in the portal to generate risk estimates.</i>",
                    self.styles["MutedText"],
                )
            )
            items.append(Spacer(1, 8))
            return items

        prob = assessment.get("probability_percent")
        if prob is None and assessment.get("probability") is not None:
            prob = round(float(assessment["probability"]) * 100, 1)
        prob_str = f"{prob}%" if prob is not None else "Not calculated"

        risk_cat = (assessment.get("risk_category") or "lower").replace("_", " ").title()
        tier = (assessment.get("assessment_level") or "tier_1").replace("_", " ").title()
        model_name = assessment.get("model_name") or assessment.get("model_version") or "BioPulse AI Extra Trees"
        ass_date = assessment.get("created_at") or "Recent Baseline"
        if "T" in str(ass_date):
            ass_date = str(ass_date).split("T")[0]

        summary_text = assessment.get("summary_text") or (
            f"The latest {tier} evaluation identifies statistical markers indicating {risk_cat.lower()} pattern risk. "
            "This model evaluates symptom presentation and physiological baselines."
        )

        badge_color = colors.HexColor("#059669") if "lower" in risk_cat.lower() else colors.HexColor("#D97706") if "moderate" in risk_cat.lower() else colors.HexColor("#E11D48")

        summary_table_data = [
            [
                Paragraph("<b>Screening Category:</b>", self.styles["TableCellBold"]),
                Paragraph(f"<b><font color='{badge_color.hexval()}'>{risk_cat} Risk</font></b>", self.styles["TableCell"]),
                Paragraph("<b>Calculated Probability:</b>", self.styles["TableCellBold"]),
                Paragraph(f"<b>{prob_str}</b>", self.styles["TableCellBold"]),
            ],
            [
                Paragraph("<b>Assessment Tier:</b>", self.styles["TableCellBold"]),
                Paragraph(tier, self.styles["TableCell"]),
                Paragraph("<b>Assessment Date:</b>", self.styles["TableCellBold"]),
                Paragraph(str(ass_date), self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Model Version:</b>", self.styles["TableCellBold"]),
                Paragraph(str(model_name), self.styles["TableCell"]),
                Paragraph("<b>Verification Status:</b>", self.styles["TableCellBold"]),
                Paragraph("Verified Algorithmic Screening", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Clinical Summary:</b>", self.styles["TableCellBold"]),
                Paragraph(summary_text, self.styles["TableCell"]),
                "",
                "",
            ],
        ]

        t = Table(summary_table_data, colWidths=[110, 150, 110, 152])
        t.setStyle(
            TableStyle(
                [
                    ("SPAN", (1, 3), (3, 3)),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5FBFD")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 4))
        items.append(
            Paragraph(
                "<i>Note: BioPulse screening risk categories reflect calibrated statistical probabilities based on validated "
                "machine learning models. They are intended for educational and clinical discussion preparation, not medical diagnosis.</i>",
                self.styles["MutedText"],
            )
        )
        items.append(Spacer(1, 8))
        return items

    def _build_shap_factors_section(self) -> List[Any]:
        items: List[Any] = []
        assessment = self.data.get("assessment") or {}
        explanations = assessment.get("explanations") or []

        items.append(Paragraph("3. Top Model Factors & Feature Influence (TreeSHAP)", self.styles["SectionHeading"]))

        if not explanations:
            items.append(
                Paragraph(
                    "<i>No factor importance or SHAP explanations are available for this assessment.</i>",
                    self.styles["MutedText"],
                )
            )
            items.append(Spacer(1, 8))
            return items

        table_rows = [
            [
                Paragraph("<b>Factor / Indicator</b>", self.styles["TableHeader"]),
                Paragraph("<b>Observed Value</b>", self.styles["TableHeader"]),
                Paragraph("<b>Directional Influence</b>", self.styles["TableHeader"]),
                Paragraph("<b>Patient-Friendly Context</b>", self.styles["TableHeader"]),
            ]
        ]

        for exp in explanations[:8]:
            fname = exp.get("feature_name") or exp.get("human_label") or "Clinical Feature"
            val = exp.get("value")
            val_str = str(round(val, 2)) if isinstance(val, float) else str(val) if val is not None else "Recorded"

            direction = str(exp.get("direction", "")).lower()
            if "increase" in direction:
                dir_label = "<font color='#BE123C'>Increases Risk (+)</font>"
            elif "decrease" in direction:
                dir_label = "<font color='#047857'>Lowers Risk (-)</font>"
            else:
                dir_label = "Neutral"

            desc = exp.get("description") or exp.get("patient_explanation") or "Evaluated as part of multi-factor risk assessment."

            table_rows.append(
                [
                    Paragraph(f"<b>{fname}</b>", self.styles["TableCellBold"]),
                    Paragraph(val_str, self.styles["TableCell"]),
                    Paragraph(f"<b>{dir_label}</b>", self.styles["TableCell"]),
                    Paragraph(desc, self.styles["TableCell"]),
                ]
            )

        t = Table(table_rows, colWidths=[120, 75, 95, 232])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 4))
        items.append(
            Paragraph(
                "<i>Important: Model factor influence reflects statistical importance identified across clinical cohorts. "
                "It describes correlation within the screening algorithm and does not establish individual medical causation.</i>",
                self.styles["MutedText"],
            )
        )
        items.append(Spacer(1, 8))
        return items

    def _build_symptoms_section(self) -> List[Any]:
        items: List[Any] = []
        symptoms = self.data.get("symptoms") or []

        items.append(Paragraph("4. Recorded Symptoms & Temporal History", self.styles["SectionHeading"]))

        if not symptoms:
            items.append(
                Paragraph(
                    "<i>No symptoms have been recorded in your BioPulse health log.</i>",
                    self.styles["MutedText"],
                )
            )
            items.append(Spacer(1, 8))
            return items

        table_rows = [
            [
                Paragraph("<b>Symptom Type</b>", self.styles["TableHeader"]),
                Paragraph("<b>Category</b>", self.styles["TableHeader"]),
                Paragraph("<b>Severity</b>", self.styles["TableHeader"]),
                Paragraph("<b>Date Logged</b>", self.styles["TableHeader"]),
                Paragraph("<b>Cycle Day</b>", self.styles["TableHeader"]),
            ]
        ]

        # Show up to 10 most recent symptoms
        for s in symptoms[:10]:
            stype = str(s.get("symptom_type") or "Unspecified").replace("_", " ").title()
            cat = str(s.get("category") or "General").replace("_", " ").title()
            sev = str(s.get("severity") or "mild").lower()
            sev_color = "#E11D48" if sev == "severe" else "#D97706" if sev == "moderate" else "#059669"

            dt = str(s.get("occurred_at") or "Unknown").split("T")[0]
            cycle_day = f"Day {s['cycle_day']}" if s.get("cycle_day") is not None else "—"

            table_rows.append(
                [
                    Paragraph(f"<b>{stype}</b>", self.styles["TableCellBold"]),
                    Paragraph(cat, self.styles["TableCell"]),
                    Paragraph(f"<b><font color='{sev_color}'>{sev.title()}</font></b>", self.styles["TableCell"]),
                    Paragraph(dt, self.styles["TableCell"]),
                    Paragraph(cycle_day, self.styles["TableCell"]),
                ]
            )

        t = Table(table_rows, colWidths=[150, 110, 85, 100, 77])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 8))
        return items

    def _build_measurements_section(self) -> List[Any]:
        items: List[Any] = []
        p = self.data.get("profile") or {}
        measurements = self.data.get("measurements") or []

        items.append(Paragraph("5. Body Measurements & Vitals Timeline", self.styles["SectionHeading"]))

        height_cm = p.get("height_cm")
        weight_kg = p.get("weight_kg")
        bmi = p.get("bmi")
        if bmi is None and height_cm and weight_kg:
            try:
                bmi = round(float(weight_kg) / ((float(height_cm) / 100) ** 2), 1)
            except Exception:
                pass

        bmi_category = "Normal"
        if bmi:
            if bmi < 18.5:
                bmi_category = "Underweight"
            elif bmi < 25.0:
                bmi_category = "Normal weight"
            elif bmi < 30.0:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obesity"

        table_rows = [
            [
                Paragraph("<b>Metric</b>", self.styles["TableHeader"]),
                Paragraph("<b>Latest Value</b>", self.styles["TableHeader"]),
                Paragraph("<b>Standard Reference / Classification</b>", self.styles["TableHeader"]),
                Paragraph("<b>Recorded Status</b>", self.styles["TableHeader"]),
            ],
            [
                Paragraph("<b>Height</b>", self.styles["TableCellBold"]),
                Paragraph(f"{height_cm} cm" if height_cm else "Not recorded", self.styles["TableCell"]),
                Paragraph("Stature baseline", self.styles["TableCell"]),
                Paragraph("Baseline Verified" if height_cm else "Pending", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Weight</b>", self.styles["TableCellBold"]),
                Paragraph(f"{weight_kg} kg" if weight_kg else "Not recorded", self.styles["TableCell"]),
                Paragraph("Body mass measurement", self.styles["TableCell"]),
                Paragraph("Active Tracker" if weight_kg else "Pending", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Body Mass Index (BMI)</b>", self.styles["TableCellBold"]),
                Paragraph(f"<b>{bmi} kg/m²</b>" if bmi else "Not calculated", self.styles["TableCell"]),
                Paragraph(f"18.5 – 24.9 kg/m² ({bmi_category})", self.styles["TableCell"]),
                Paragraph("Calculated" if bmi else "Pending", self.styles["TableCell"]),
            ],
        ]

        # Add additional historical measurements if available
        for m in measurements[:3]:
            m_name = m.get("name") or "Measurement"
            m_val = f"{m.get('value')} {m.get('unit', '')}".strip()
            m_dt = str(m.get("date") or "Logged")
            table_rows.append(
                [
                    Paragraph(f"<b>{m_name}</b>", self.styles["TableCellBold"]),
                    Paragraph(m_val, self.styles["TableCell"]),
                    Paragraph(f"Recorded on {m_dt}", self.styles["TableCell"]),
                    Paragraph("Historical Record", self.styles["TableCell"]),
                ]
            )

        t = Table(table_rows, colWidths=[130, 110, 160, 122])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 8))
        return items

    def _build_labs_section(self) -> List[Any]:
        items: List[Any] = []
        labs = self.data.get("lab_results") or []
        reports = self.data.get("medical_reports") or []

        items.append(Paragraph("6. Laboratory Results & Medical Reports", self.styles["SectionHeading"]))

        if not labs and not reports:
            items.append(
                Paragraph(
                    "<i>No laboratory results or uploaded medical reports have been recorded.</i>",
                    self.styles["MutedText"],
                )
            )
            items.append(Spacer(1, 8))
            return items

        if labs:
            table_rows = [
                [
                    Paragraph("<b>Biomarker / Assay</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Result</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Unit</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Reference Range</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Flag / Status</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Test Date</b>", self.styles["TableHeader"]),
                ]
            ]

            for lab in labs[:12]:
                tname = lab.get("test_name") or "Biomarker"
                val = lab.get("result_numeric")
                val_str = str(val) if val is not None else "—"
                unit = lab.get("unit") or "—"

                ref_low = lab.get("reference_low")
                ref_high = lab.get("reference_high")
                if ref_low is not None and ref_high is not None:
                    ref_str = f"{ref_low} – {ref_high}"
                elif ref_low is not None:
                    ref_str = f"≥ {ref_low}"
                elif ref_high is not None:
                    ref_str = f"≤ {ref_high}"
                else:
                    ref_str = "Stated by Lab"

                stat = str(lab.get("status") or "normal").lower()
                stat_color = "#E11D48" if stat in ("critical", "high") else "#0284C7" if stat == "low" else "#059669"
                dt = str(lab.get("report_date") or "Recent").split("T")[0]

                table_rows.append(
                    [
                        Paragraph(f"<b>{tname}</b>", self.styles["TableCellBold"]),
                        Paragraph(f"<b>{val_str}</b>", self.styles["TableCell"]),
                        Paragraph(unit, self.styles["TableCell"]),
                        Paragraph(ref_str, self.styles["TableCell"]),
                        Paragraph(f"<b><font color='{stat_color}'>{stat.upper()}</font></b>", self.styles["TableCell"]),
                        Paragraph(dt, self.styles["TableCell"]),
                    ]
                )

            t = Table(table_rows, colWidths=[130, 65, 55, 105, 87, 80])
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )
            items.append(t)
            items.append(Spacer(1, 4))

        if reports:
            items.append(Paragraph("<b>Uploaded Clinical Documents:</b>", self.styles["TableCellBold"]))
            rep_rows = [
                [
                    Paragraph("<b>Document Name</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Upload Date</b>", self.styles["TableHeader"]),
                    Paragraph("<b>Extraction Status</b>", self.styles["TableHeader"]),
                ]
            ]
            for rep in reports[:4]:
                rname = rep.get("file_name") or "Medical Lab Report"
                rdt = str(rep.get("created_at") or rep.get("report_date") or "").split("T")[0] or "Recorded"
                rstat = (rep.get("status") or "Extracted / Awaiting Review").title()
                rep_rows.append(
                    [
                        Paragraph(rname, self.styles["TableCellBold"]),
                        Paragraph(rdt, self.styles["TableCell"]),
                        Paragraph(rstat, self.styles["TableCell"]),
                    ]
                )

            t_rep = Table(rep_rows, colWidths=[240, 110, 172])
            t_rep.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )
            items.append(t_rep)

        items.append(Spacer(1, 8))
        return items

    def _build_medications_section(self) -> List[Any]:
        items: List[Any] = []
        meds = self.data.get("medications") or []

        items.append(Paragraph("7. Prescribed & Logged Medications", self.styles["SectionHeading"]))

        if not meds:
            items.append(
                Paragraph(
                    "<i>No medications have been recorded.</i>",
                    self.styles["MutedText"],
                )
            )
            items.append(Spacer(1, 8))
            return items

        table_rows = [
            [
                Paragraph("<b>Medication Name</b>", self.styles["TableHeader"]),
                Paragraph("<b>Frequency / Schedule</b>", self.styles["TableHeader"]),
                Paragraph("<b>Start Date</b>", self.styles["TableHeader"]),
                Paragraph("<b>Active Status</b>", self.styles["TableHeader"]),
            ]
        ]

        for m in meds:
            mname = m.get("name") or "Medication"
            freq = (m.get("frequency") or "As directed").replace("_", " ").title()
            sdate = str(m.get("start_date") or "Recorded").split("T")[0]
            is_active = m.get("is_active", True)
            stat_str = "<font color='#059669'>Active</font>" if is_active else "<font color='#64748B'>Inactive</font>"

            table_rows.append(
                [
                    Paragraph(f"<b>{mname}</b>", self.styles["TableCellBold"]),
                    Paragraph(freq, self.styles["TableCell"]),
                    Paragraph(sdate, self.styles["TableCell"]),
                    Paragraph(stat_str, self.styles["TableCell"]),
                ]
            )

        t = Table(table_rows, colWidths=[180, 140, 102, 100])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 8))
        return items

    def _build_appointments_section(self) -> List[Any]:
        items: List[Any] = []
        appts = self.data.get("appointments") or []

        items.append(Paragraph("8. Scheduled & Completed Appointments", self.styles["SectionHeading"]))

        if not appts:
            items.append(
                Paragraph(
                    "<i>No appointments have been recorded.</i>",
                    self.styles["MutedText"],
                )
            )
            items.append(Spacer(1, 8))
            return items

        table_rows = [
            [
                Paragraph("<b>Date & Time</b>", self.styles["TableHeader"]),
                Paragraph("<b>Practitioner / Clinic</b>", self.styles["TableHeader"]),
                Paragraph("<b>Clinical Specialty</b>", self.styles["TableHeader"]),
                Paragraph("<b>Status</b>", self.styles["TableHeader"]),
            ]
        ]

        for a in appts[:6]:
            dt = str(a.get("scheduled_at") or a.get("date") or "Scheduled").replace("T", " ")
            doc = a.get("doctor_name") or "Healthcare Provider"
            spec = a.get("specialty") or "General Medicine / Endocrinology"
            stat = str(a.get("status") or "Upcoming").title()
            stat_color = "#059669" if "completed" in stat.lower() else "#0284C7" if "upcoming" in stat.lower() else "#64748B"

            table_rows.append(
                [
                    Paragraph(dt, self.styles["TableCellBold"]),
                    Paragraph(doc, self.styles["TableCell"]),
                    Paragraph(spec, self.styles["TableCell"]),
                    Paragraph(f"<b><font color='{stat_color}'>{stat}</font></b>", self.styles["TableCell"]),
                ]
            )

        t = Table(table_rows, colWidths=[130, 142, 150, 100])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 8))
        return items

    def _build_progress_summary_section(self) -> List[Any]:
        items: List[Any] = []
        p = self.data.get("profile") or {}
        symptoms_count = len(self.data.get("symptoms") or [])
        labs_count = len(self.data.get("lab_results") or [])
        meds_count = len(self.data.get("medications") or [])
        appts_count = len(self.data.get("appointments") or [])

        items.append(Paragraph("9. Health Progress & Monitoring Summary", self.styles["SectionHeading"]))

        profile_created = str(p.get("created_at") or "Active").split("T")[0]
        summary_text = (
            f"Patient record active since {profile_created}. Over the monitoring period, {symptoms_count} symptom "
            f"entries have been recorded, alongside {labs_count} verified laboratory biomarker evaluations. "
            f"Current active medication regimen includes {meds_count} items with {appts_count} documented clinical appointments. "
            "Biometric and longitudinal trend tracking remains consistent with continuous health record maintenance."
        )

        prog_data = [
            [
                Paragraph("<b>Timeline Status:</b>", self.styles["TableCellBold"]),
                Paragraph("Active Longitudinal Profile", self.styles["TableCell"]),
                Paragraph("<b>Total Symptom Logs:</b>", self.styles["TableCellBold"]),
                Paragraph(str(symptoms_count), self.styles["TableCellBold"]),
            ],
            [
                Paragraph("<b>Biomarkers Evaluated:</b>", self.styles["TableCellBold"]),
                Paragraph(f"{labs_count} entries", self.styles["TableCell"]),
                Paragraph("<b>Clinical Consultations:</b>", self.styles["TableCellBold"]),
                Paragraph(f"{appts_count} records", self.styles["TableCell"]),
            ],
            [
                Paragraph("<b>Longitudinal Synthesis:</b>", self.styles["TableCellBold"]),
                Paragraph(summary_text, self.styles["TableCell"]),
                "",
                "",
            ],
        ]

        t = Table(prog_data, colWidths=[110, 150, 110, 152])
        t.setStyle(
            TableStyle(
                [
                    ("SPAN", (1, 2), (3, 2)),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5FBFD")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D7EAF2")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        items.append(t)
        items.append(Spacer(1, 10))
        return items

    def _build_disclaimer_section(self) -> List[Any]:
        items: List[Any] = []
        disclaimer_text = (
            "<b>Medical Disclaimer:</b> This report is generated from information recorded in BioPulse AI and is "
            "intended for informational and health-monitoring purposes only. AI-generated screening probabilities, "
            "risk categories, and explanations are not medical diagnoses. This report does not replace professional "
            "medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional for "
            "interpretation of your results and medical decisions."
        )

        d_box = Table(
            [[Paragraph(disclaimer_text, self.styles["DisclaimerText"])]],
            colWidths=[522],
        )
        d_box.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        items.append(KeepTogether([d_box]))
        return items


logger = logging.getLogger(__name__)


def _get_db_client():
    from apps.health.services.supabase_health_service import _get_supabase_client
    try:
        return _get_supabase_client()
    except Exception as exc:
        logger.debug("Supabase client not available: %s", exc)
        return None


def assemble_user_health_pdf_data(patient_uuid: str, auth_token: str | None = None) -> Dict[str, Any]:
    """
    Retrieves and normalizes real user data from Supabase / assessment repositories
    for Personal Health Summary PDF generation.
    Strictly scoped to patient_uuid. No mocked or fake data.
    """
    client = _get_db_client()
    if client and auth_token:
        try:
            client.postgrest.auth(auth_token)
        except Exception:
            pass

    # 1. Profile & Basic Demographics
    profile_data: Dict[str, Any] = {}
    full_name: str | None = None
    pathway: str | None = None

    if client:
        try:
            res = (
                client.table("profiles")
                .select("*")
                .eq("id", patient_uuid)
                .maybe_single()
                .execute()
            )
            row = getattr(res, "data", None) or {}
            if row:
                full_name = row.get("full_name")
                pathway = row.get("pathway")
                profile_data = {
                    "height_cm": row.get("height_cm"),
                    "weight_kg": row.get("weight_kg"),
                    "date_of_birth": str(row.get("date_of_birth")) if row.get("date_of_birth") else None,
                    "gender": row.get("gender"),
                    "pathway": row.get("pathway"),
                    "cycle_length": row.get("cycle_length"),
                    "period_regularity": row.get("period_regularity"),
                    "common_symptoms": row.get("common_symptoms") or [],
                    "conditions": row.get("conditions") or [],
                    "dietary_preference": row.get("dietary_preference"),
                    "sleep_hours": row.get("sleep_hours"),
                    "daily_water_glasses": row.get("daily_water_glasses"),
                    "activity_level": row.get("activity_level"),
                    "waist_cm": row.get("waist_cm"),
                    "hip_cm": row.get("hip_cm"),
                    "medications": row.get("medications") or [],
                    "created_at": row.get("created_at"),
                }
                # Calculate age if date_of_birth is valid
                if profile_data.get("date_of_birth"):
                    try:
                        dob_val = datetime.strptime(str(profile_data["date_of_birth"])[:10], "%Y-%m-%d").date()
                        today = datetime.now(timezone.utc).date()
                        age_calc = today.year - dob_val.year - ((today.month, today.day) < (dob_val.month, dob_val.day))
                        if 0 <= age_calc < 130:
                            profile_data["age"] = age_calc
                    except Exception:
                        pass
                # Calculate BMI if height & weight available
                if profile_data.get("height_cm") and profile_data.get("weight_kg"):
                    try:
                        h_m = float(profile_data["height_cm"]) / 100.0
                        w_kg = float(profile_data["weight_kg"])
                        if h_m > 0:
                            profile_data["bmi"] = round(w_kg / (h_m * h_m), 1)
                    except Exception:
                        pass
        except Exception as exc:
            logger.warning("Could not fetch profile for user %s: %s", patient_uuid[:8] + "***", exc)

    # 2. Latest Screening Assessment & Explanations
    assessment_data: Dict[str, Any] = {"has_assessment": False}
    try:
        from apps.intelligence.services.assessment_repository import assessment_repository
        active_assessment = None
        for mod in ["female_pcos", "male_hypogonadism"]:
            try:
                act = assessment_repository.get_active_assessment(patient_uuid, module=mod, auth_token=auth_token)
                if act and act.get("has_assessment") is not False:
                    active_assessment = act
                    break
            except Exception:
                pass

        if not active_assessment and client:
            try:
                res_ass = (
                    client.table("screening_assessments")
                    .select("*")
                    .eq("user_id", patient_uuid)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                rows_ass = getattr(res_ass, "data", None) or []
                if rows_ass:
                    active_assessment = rows_ass[0]
            except Exception:
                pass

        if active_assessment:
            prob = active_assessment.get("probability_percent")
            if prob is None and active_assessment.get("probability") is not None:
                prob = round(float(active_assessment["probability"]) * 100, 1)

            explanations_list: List[Dict[str, Any]] = []
            raw_exps = active_assessment.get("explanations") or active_assessment.get("shap_explanation") or []
            if isinstance(raw_exps, dict):
                raw_exps = raw_exps.get("top_factors") or raw_exps.get("features") or []

            if isinstance(raw_exps, list):
                for item in raw_exps:
                    if isinstance(item, dict):
                        explanations_list.append(
                            {
                                "feature_name": item.get("feature_name") or item.get("human_label") or item.get("name") or "Indicator",
                                "value": item.get("value") or item.get("patient_value") or item.get("observed_value"),
                                "direction": item.get("direction") or item.get("impact") or "neutral",
                                "description": item.get("description") or item.get("patient_explanation") or item.get("clinical_meaning") or "",
                            }
                        )

            assessment_data = {
                "has_assessment": True,
                "probability_percent": prob,
                "probability": active_assessment.get("probability"),
                "risk_category": active_assessment.get("risk_category") or "lower",
                "assessment_level": active_assessment.get("assessment_level") or "tier_1",
                "model_name": active_assessment.get("model_name") or "BioPulse AI Extra Trees",
                "summary_text": active_assessment.get("summary_text") or "",
                "created_at": active_assessment.get("created_at") or "",
                "explanations": explanations_list,
            }
            if not pathway:
                pathway = active_assessment.get("module")
    except Exception as exc:
        logger.warning("Could not assemble assessment for user %s: %s", patient_uuid[:8] + "***", exc)

    # 3. Symptoms History
    symptoms_data: List[Dict[str, Any]] = []
    if client:
        try:
            res_sym = (
                client.table("symptom_records")
                .select("id, symptom_type, category, severity, occurred_at, cycle_day, notes")
                .eq("user_id", patient_uuid)
                .order("occurred_at", desc=True)
                .limit(20)
                .execute()
            )
            symptoms_data = getattr(res_sym, "data", None) or []
        except Exception as exc:
            logger.warning("Could not fetch symptoms for user %s: %s", patient_uuid[:8] + "***", exc)

    # 4. Body Measurements & Vitals
    measurements_data: List[Dict[str, Any]] = []
    if profile_data.get("waist_cm"):
        measurements_data.append(
            {"name": "Waist Circumference", "value": profile_data["waist_cm"], "unit": "cm", "date": "Profile Baseline"}
        )
    if profile_data.get("hip_cm"):
        measurements_data.append(
            {"name": "Hip Circumference", "value": profile_data["hip_cm"], "unit": "cm", "date": "Profile Baseline"}
        )

    if client:
        try:
            res_obs = (
                client.table("patient_metric_observations")
                .select("metric_key, value, unit, observed_at")
                .eq("user_id", patient_uuid)
                .order("observed_at", desc=True)
                .limit(10)
                .execute()
            )
            for obs in getattr(res_obs, "data", None) or []:
                m_key = str(obs.get("metric_key") or "Metric").replace("_", " ").title()
                measurements_data.append(
                    {
                        "name": m_key,
                        "value": obs.get("value"),
                        "unit": obs.get("unit") or "",
                        "date": str(obs.get("observed_at") or "").split("T")[0],
                    }
                )
        except Exception as exc:
            logger.warning("Could not fetch metric observations for user %s: %s", patient_uuid[:8] + "***", exc)

    # 5. Laboratory Results & Medical Reports
    lab_results_data: List[Dict[str, Any]] = []
    medical_reports_data: List[Dict[str, Any]] = []

    if client:
        try:
            res_rep = (
                client.table("medical_reports")
                .select("id, file_name, report_type, report_date, status, created_at")
                .eq("user_id", patient_uuid)
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )
            medical_reports_data = getattr(res_rep, "data", None) or []
            rep_ids = [r["id"] for r in medical_reports_data if r.get("id")]
            if rep_ids:
                res_res = (
                    client.table("report_results")
                    .select("id, report_id, test_name, result_numeric, result_value, unit, reference_low, reference_high, reference_range, status, user_verified, report_date, created_at")
                    .in_("report_id", rep_ids)
                    .order("created_at", desc=True)
                    .limit(25)
                    .execute()
                )
                lab_results_data = getattr(res_res, "data", None) or []
        except Exception as exc:
            logger.warning("Could not fetch labs/reports for user %s: %s", patient_uuid[:8] + "***", exc)

    # 6. Medications
    medications_data: List[Dict[str, Any]] = []
    if client:
        try:
            res_med = (
                client.table("medications")
                .select("id, name, dose, unit, frequency, start_date, end_date, is_active")
                .eq("user_id", patient_uuid)
                .order("created_at", desc=True)
                .limit(15)
                .execute()
            )
            med_rows = getattr(res_med, "data", None) or []
            for m in med_rows:
                full_dose = f"{m.get('dose', '')} {m.get('unit', '')}".strip()
                m_title = f"{m.get('name', 'Medication')} {full_dose}".strip()
                medications_data.append(
                    {
                        "name": m_title,
                        "frequency": m.get("frequency") or "As prescribed",
                        "start_date": m.get("start_date"),
                        "is_active": m.get("is_active", True),
                    }
                )
        except Exception as exc:
            logger.warning("Could not fetch medications for user %s: %s", patient_uuid[:8] + "***", exc)

    if not medications_data and profile_data.get("medications"):
        for m in profile_data["medications"]:
            if isinstance(m, dict):
                medications_data.append(
                    {
                        "name": m.get("name") or "Medication",
                        "frequency": m.get("frequency") or "As prescribed",
                        "start_date": m.get("start_date"),
                        "is_active": m.get("is_active", True),
                    }
                )
            elif isinstance(m, str) and m.strip():
                medications_data.append(
                    {
                        "name": m.strip(),
                        "frequency": "As prescribed",
                        "start_date": None,
                        "is_active": True,
                    }
                )

    # 7. Appointments
    appointments_data: List[Dict[str, Any]] = []
    if client:
        try:
            res_app = (
                client.table("appointments")
                .select("id, provider_name, provider_specialty, title, scheduled_at, status, reason")
                .eq("patient_id", patient_uuid)
                .order("scheduled_at", desc=True)
                .limit(10)
                .execute()
            )
            app_rows = getattr(res_app, "data", None) or []
            for a in app_rows:
                appointments_data.append(
                    {
                        "scheduled_at": a.get("scheduled_at"),
                        "doctor_name": a.get("provider_name") or "Healthcare Provider",
                        "specialty": a.get("provider_specialty") or a.get("title") or "Clinical Specialist",
                        "status": a.get("status") or "Scheduled",
                    }
                )
        except Exception as exc:
            logger.warning("Could not fetch appointments for user %s: %s", patient_uuid[:8] + "***", exc)

    return {
        "patient_name": full_name or "Authorized Patient",
        "pathway": pathway or "General Health",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "profile": profile_data,
        "assessment": assessment_data,
        "symptoms": symptoms_data,
        "measurements": measurements_data,
        "lab_results": lab_results_data,
        "medical_reports": medical_reports_data,
        "medications": medications_data,
        "appointments": appointments_data,
    }


def generate_user_health_pdf(patient_uuid: str, auth_token: str | None = None) -> tuple[bytes, str]:
    """
    Assembles user health records and compiles the multi-page BioPulse Health Summary PDF.
    Returns (pdf_bytes, filename).
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("The 'reportlab' package is required to generate health summary PDFs.")
    data = assemble_user_health_pdf_data(patient_uuid, auth_token=auth_token)
    generator = HealthSummaryPDFGenerator(data)
    pdf_bytes = generator.generate()
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"BioPulse_Health_Summary_{date_str}.pdf"
    return pdf_bytes, filename
