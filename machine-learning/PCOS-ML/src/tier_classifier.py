"""
OvaSense ML Pipeline - Tier Classifier & Feature Schema Engine
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

This module provides the authoritative schema mapping for all 45 raw columns
in the primary PCOS dataset (PCOS_data_without_infertility.xlsx, sheet 'Full_new').
"""

COLUMN_METADATA = {
    'Sl. No': {
        'clean_name': 'sl_no',
        'tier': 'ID',
        'category': 'Identifier',
        'modality': 'Database metadata',
        'usable_for_ml': False,
        'core_status': 'Excluded',
        'reason': 'Administrative row serial index (1-541). Predictive leakage risk.'
    },
    'Patient File No.': {
        'clean_name': 'patient_file_no',
        'tier': 'ID',
        'category': 'Identifier',
        'modality': 'Hospital record',
        'usable_for_ml': False,
        'core_status': 'Excluded',
        'reason': 'Hospital patient file identifier (1-541). Predictive leakage risk.'
    },
    'PCOS (Y/N)': {
        'clean_name': 'pcos_diagnosis',
        'tier': 'Target',
        'category': 'Reported PCOS Status',
        'modality': 'Physician clinical diagnosis (Rotterdam consensus)',
        'usable_for_ml': False,  # Not a feature
        'core_status': 'Target',
        'reason': 'Dataset-provided reference outcome (0=No PCOS, 1=PCOS). Target variable.'
    },
    ' Age (yrs)': {
        'clean_name': 'age',
        'tier': 'Tier 1',
        'category': 'Demographics',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Patient chronological age in years. Non-invasive baseline demographic.'
    },
    'Weight (Kg)': {
        'clean_name': 'weight_kg',
        'tier': 'Tier 1',
        'category': 'Anthropometry',
        'modality': 'User self-report (home scale)',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Self-reported body weight in kg. Direct indicator of adiposity.'
    },
    'Height(Cm) ': {
        'clean_name': 'height_cm',
        'tier': 'Tier 1',
        'category': 'Anthropometry',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Self-reported body height in cm. Anthropometric normalization factor.'
    },
    'BMI': {
        'clean_name': 'bmi',
        'tier': 'Tier 1',
        'category': 'Anthropometry',
        'modality': 'User self-report / Calculable',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Body Mass Index. Calculable as weight / (height/100)^2.'
    },
    'Blood Group': {
        'clean_name': 'blood_group',
        'tier': 'Tier 2',
        'category': 'Hematology / Lab',
        'modality': 'Venipuncture / ABO-Rh typing',
        'usable_for_ml': True,
        'core_status': 'Candidate Excluded from Core / Retained for Ablation',
        'reason': 'ABO/Rh typing is a laboratory test. No meaningful univariate association (p=0.957). Retained for ablation.'
    },
    'Pulse rate(bpm) ': {
        'clean_name': 'pulse_rate_bpm',
        'tier': 'Tier 2',
        'category': 'Clinical Vitals',
        'modality': 'Clinical examination',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Resting heart rate measured at clinic triage. Contains typos (13, 18 bpm) needing imputation.'
    },
    'RR (breaths/min)': {
        'clean_name': 'respiratory_rate',
        'tier': 'Tier 2',
        'category': 'Clinical Vitals',
        'modality': 'Clinical examination',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Respiratory rate measured at clinical triage.'
    },
    'Hb(g/dl)': {
        'clean_name': 'hemoglobin',
        'tier': 'Tier 2',
        'category': 'Hematology / Lab',
        'modality': 'Venipuncture blood test (CBC)',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Hemoglobin concentration. Blood test result.'
    },
    'Cycle(R/I)': {
        'clean_name': 'cycle_regularity',
        'tier': 'Tier 1',
        'category': 'Menstrual History',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Menstrual cycle regularity (2=Regular, 4=Irregular, 5=Irregular outlier). Cardinal PCOS sign.'
    },
    'Cycle length(days)': {
        'clean_name': 'cycle_length_raw',
        'tier': 'Tier 1',
        'category': 'Menstrual History',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Values suggest bleeding duration in days; authoritative metadata is absent, so semantic uncertainty is acknowledged.'
    },
    'Marraige Status (Yrs)': {
        'clean_name': 'marriage_years',
        'tier': 'Tier 1',
        'category': 'Demographic / Social',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Candidate Excluded from Core / Retained for Ablation',
        'reason': 'Marital duration. Inapplicable to unmarried users; potential generalizability concern. Retained for ablation.'
    },
    'Pregnant(Y/N)': {
        'clean_name': 'pregnant',
        'tier': 'Tier 1',
        'category': 'Obstetric History',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Candidate Excluded from Core / Retained for Ablation',
        'reason': 'Pregnancy status. Acute physiological state confounding endocrine baselines. Retained for ablation.'
    },
    'No. of aborptions': {
        'clean_name': 'abortions_count',
        'tier': 'Tier 1',
        'category': 'Obstetric History',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Candidate Excluded from Core / Retained for Ablation',
        'reason': 'Obstetric history. Inapplicable to nulliparous users; potential generalizability concern. Retained for ablation.'
    },
    '  I   beta-HCG(mIU/mL)': {
        'clean_name': 'beta_hcg_i',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Quantitative serum beta-hCG test.'
    },
    'II    beta-HCG(mIU/mL)': {
        'clean_name': 'beta_hcg_ii',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Repeat serum beta-hCG test. Contains typo "1.99.". High redundancy with beta_hcg_i.'
    },
    'FSH(mIU/mL)': {
        'clean_name': 'fsh',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Follicle-Stimulating Hormone. Core reproductive gonadotropin. Outlier 5052 mIU/mL.'
    },
    'LH(mIU/mL)': {
        'clean_name': 'lh',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Luteinizing Hormone. Core reproductive gonadotropin. Outlier 2018 mIU/mL.'
    },
    'FSH/LH': {
        'clean_name': 'fsh_lh_ratio',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Calculated lab ratio',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Calculated gonadotropin ratio. Collinear with source FSH and LH.'
    },
    'Hip(inch)': {
        'clean_name': 'hip_inch',
        'tier': 'Tier 1',
        'category': 'Anthropometry',
        'modality': 'User self-report (measuring tape)',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Hip circumference in inches. Anthropometric fat distribution metric.'
    },
    'Waist(inch)': {
        'clean_name': 'waist_inch',
        'tier': 'Tier 1',
        'category': 'Anthropometry',
        'modality': 'User self-report (measuring tape)',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Waist circumference in inches. Key marker of visceral adiposity and insulin resistance.'
    },
    'Waist:Hip Ratio': {
        'clean_name': 'waist_hip_ratio',
        'tier': 'Tier 1',
        'category': 'Anthropometry',
        'modality': 'User self-report / Calculable',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Calculable as waist / hip. Standard WHO cardiovascular and metabolic metric.'
    },
    'TSH (mIU/L)': {
        'clean_name': 'tsh',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Thyroid-Stimulating Hormone. Differential diagnosis rule-out test for hypothyroidism.'
    },
    'AMH(ng/mL)': {
        'clean_name': 'amh',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Anti-Mullerian Hormone. Cardinal PCOS ovarian reserve biomarker. Typo "a" at row 305.'
    },
    'PRL(ng/mL)': {
        'clean_name': 'prolactin',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Prolactin. Differential diagnosis rule-out test for hyperprolactinemia.'
    },
    'Vit D3 (ng/mL)': {
        'clean_name': 'vitamin_d3',
        'tier': 'Tier 2',
        'category': 'Biomarker / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': '25-hydroxy Vitamin D3. Extreme data entry errors (6014.66, 5418.60 ng/mL).'
    },
    'PRG(ng/mL)': {
        'clean_name': 'progesterone',
        'tier': 'Tier 2',
        'category': 'Hormone / Lab',
        'modality': 'Serum laboratory test',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Serum Progesterone. Reflects luteal activity and pregnancy state.'
    },
    'RBS(mg/dl)': {
        'clean_name': 'rbs',
        'tier': 'Tier 2',
        'category': 'Metabolic / Lab',
        'modality': 'Venipuncture / Glucometer',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Random Blood Sugar / glucose test. Core metabolic marker.'
    },
    'Weight gain(Y/N)': {
        'clean_name': 'weight_gain',
        'tier': 'Tier 1',
        'category': 'Symptoms',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Unexplained or rapid weight gain symptom. Self-reported.'
    },
    'hair growth(Y/N)': {
        'clean_name': 'hirsutism',
        'tier': 'Tier 1',
        'category': 'Symptoms',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Excessive facial/body hair growth (hirsutism). Physical hallmark of hyperandrogenism.'
    },
    'Skin darkening (Y/N)': {
        'clean_name': 'skin_darkening',
        'tier': 'Tier 1',
        'category': 'Symptoms',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Acanthosis nigricans symptom. Hallmark physical sign of severe insulin resistance.'
    },
    'Hair loss(Y/N)': {
        'clean_name': 'hair_loss',
        'tier': 'Tier 1',
        'category': 'Symptoms',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Androgenic alopecia / scalp hair thinning symptom. Self-reported.'
    },
    'Pimples(Y/N)': {
        'clean_name': 'pimples_acne',
        'tier': 'Tier 1',
        'category': 'Symptoms',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Acne vulgaris / persistent pimples symptom. Self-reported.'
    },
    'Fast food (Y/N)': {
        'clean_name': 'fast_food',
        'tier': 'Tier 1',
        'category': 'Lifestyle',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Fast food dietary consumption habit. 1 missing value at row 156.'
    },
    'Reg.Exercise(Y/N)': {
        'clean_name': 'regular_exercise',
        'tier': 'Tier 1',
        'category': 'Lifestyle',
        'modality': 'User self-report',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Regular physical exercise habit. Self-reported.'
    },
    'BP _Systolic (mmHg)': {
        'clean_name': 'bp_systolic',
        'tier': 'Tier 2',
        'category': 'Clinical Vitals',
        'modality': 'Sphygmomanometer',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Systolic blood pressure. Contains typo (12 mmHg at row 161, intended 120).'
    },
    'BP _Diastolic (mmHg)': {
        'clean_name': 'bp_diastolic',
        'tier': 'Tier 2',
        'category': 'Clinical Vitals',
        'modality': 'Sphygmomanometer',
        'usable_for_ml': True,
        'core_status': 'Core Included',
        'reason': 'Diastolic blood pressure. Contains typo (8 mmHg at row 200, intended 80).'
    },
    'Follicle No. (L)': {
        'clean_name': 'follicle_no_l',
        'tier': 'Tier 3 (Structured)',
        'category': 'Ultrasound Measurement',
        'modality': 'Transvaginal pelvic ultrasound (TVS)',
        'usable_for_ml': False,  # Not in Tier 1 or Tier 2
        'core_status': 'Structured Reference Only',
        'reason': 'Left ovary follicle count from TVS. Direct Rotterdam diagnostic criterion.'
    },
    'Follicle No. (R)': {
        'clean_name': 'follicle_no_r',
        'tier': 'Tier 3 (Structured)',
        'category': 'Ultrasound Measurement',
        'modality': 'Transvaginal pelvic ultrasound (TVS)',
        'usable_for_ml': False,  # Not in Tier 1 or Tier 2
        'core_status': 'Structured Reference Only',
        'reason': 'Right ovary follicle count from TVS. Direct Rotterdam diagnostic criterion.'
    },
    'Avg. F size (L) (mm)': {
        'clean_name': 'avg_f_size_l',
        'tier': 'Tier 3 (Structured)',
        'category': 'Ultrasound Measurement',
        'modality': 'Transvaginal pelvic ultrasound (TVS)',
        'usable_for_ml': False,  # Not in Tier 1 or Tier 2
        'core_status': 'Structured Reference Only',
        'reason': 'Mean follicle diameter (left ovary) via TVS imaging.'
    },
    'Avg. F size (R) (mm)': {
        'clean_name': 'avg_f_size_r',
        'tier': 'Tier 3 (Structured)',
        'category': 'Ultrasound Measurement',
        'modality': 'Transvaginal pelvic ultrasound (TVS)',
        'usable_for_ml': False,  # Not in Tier 1 or Tier 2
        'core_status': 'Structured Reference Only',
        'reason': 'Mean follicle diameter (right ovary) via TVS imaging.'
    },
    'Endometrium (mm)': {
        'clean_name': 'endometrium_mm',
        'tier': 'Tier 3 (Structured)',
        'category': 'Ultrasound Measurement',
        'modality': 'Transvaginal pelvic ultrasound (TVS)',
        'usable_for_ml': False,  # Not in Tier 1 or Tier 2
        'core_status': 'Structured Reference Only',
        'reason': 'Endometrial stripe thickness measured via TVS imaging.'
    },
    'Unnamed: 44': {
        'clean_name': 'unnamed_44',
        'tier': 'Artifact',
        'category': 'Excel Overflow',
        'modality': 'Spreadsheet error',
        'usable_for_ml': False,
        'core_status': 'Excluded',
        'reason': '99.6% missing. Unnamed trailing Excel column with stray data entry marks.'
    }
}

def get_tier_features(tier_name, core_only=True):
    """Return list of raw column names belonging to a specific tier."""
    res = []
    for raw_col, meta in COLUMN_METADATA.items():
        if meta['tier'] == tier_name:
            if core_only:
                if meta['core_status'] == 'Core Included':
                    res.append(raw_col)
            else:
                if meta['usable_for_ml']:
                    res.append(raw_col)
    return res

def get_tier1_core_features():
    return get_tier_features('Tier 1', core_only=True)

def get_tier1_all_candidates():
    return get_tier_features('Tier 1', core_only=False)

def get_tier2_core_features():
    """Returns Tier 2 specific core features (excluding Tier 1)."""
    return get_tier_features('Tier 2', core_only=True)

def get_tier2_all_candidates():
    return get_tier_features('Tier 2', core_only=False)

def get_tier3_structured_features():
    return [c for c, m in COLUMN_METADATA.items() if m['tier'] == 'Tier 3 (Structured)']

def get_target_col():
    return 'PCOS (Y/N)'

def get_excluded_cols():
    return [c for c, m in COLUMN_METADATA.items() if not m['usable_for_ml'] and m['tier'] != 'Target']
