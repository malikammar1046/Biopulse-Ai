/**
 * ==============================================================================
 * VITASense Phase 4: Adaptive Profile Service
 * ==============================================================================
 * 
 * Reuses existing audited data structures (userProfile, cycleRecords, symptomRecords,
 * reports, report_results) to construct the progressive 4-tier adaptive health profile.
 * 
 * Clinical Guardrails:
 * - 'unknown' is NEVER interpreted as 'normal'. Unknown means unknown.
 * - Single-value automated diagnoses are strictly prevented (e.g. no testosterone < 300 = hypogonadism).
 * - Tiers are progressive opportunities for depth, never failure gates.
 * - Information completeness is quantified without generating a fake "health score".
 */

import type { UserProfile, HealthPathway } from '../types/onboarding';
import type { CycleRecord } from '../types/cycle';
import type { SymptomRecord } from '../types/symptom';
import type { MedicalReport } from '../types/report';
import type {
  AdaptiveHealthProfile,
  TierSummary,
  AdaptiveFieldItem,
  TierLevel,
  TierState,
  ScreeningReadinessStatus,
  PrioritizedInformationItem,
  ExplainabilitySummary,
  ADAMQuestionnaireState,
} from '../types/adaptiveScreening';

// ------------------------------------------------------------------------------
// Helper: Age Calculation from Date of Birth
// ------------------------------------------------------------------------------
function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : null;
}

// ------------------------------------------------------------------------------
// Helper: Biomarker Extraction from Uploaded Reports
// ------------------------------------------------------------------------------
interface MatchedBiomarker {
  value: string;
  numeric?: number | null;
  unit: string;
  referenceRange?: string;
  date: string;
  userVerified: boolean;
  status: 'within_range' | 'outside_range' | 'needs_review' | 'insufficient_info';
  reportTitle: string;
  reportId: string;
  resultId: string;
}

function findBiomarkerInReports(
  reports: MedicalReport[],
  candidateNames: string[],
  excludedTokens: string[] = []
): MatchedBiomarker | null {
  const normalizedCandidates = candidateNames.map((n) => n.toLowerCase().trim());
  const normalizedExcluded = excludedTokens.map((n) => n.toLowerCase().trim());

  for (const report of reports) {
    if (!report.results || !Array.isArray(report.results)) continue;
    for (const res of report.results) {
      const testName = res.testName?.toLowerCase().trim() || '';
      const canonical = ((res as any).canonicalCode || (res as any).canonical_code || '').toLowerCase().trim();

      // If excluded token present (e.g. "free" when searching for total testosterone), skip
      if (normalizedExcluded.some((ex) => testName.includes(ex))) {
        continue;
      }

      const match = normalizedCandidates.some((candidate) => {
        if (canonical && canonical === candidate) return true;
        if (testName === candidate) return true;
        const regex = new RegExp(`(^|\\b)${candidate.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(\\b|$)`, 'i');
        return regex.test(testName);
      });

      if (match) {
        return {
          value: res.resultValue,
          numeric: res.resultNumeric,
          unit: res.unit || '',
          referenceRange: res.referenceRange || '',
          date: report.reportDate || report.createdAt || '',
          userVerified: Boolean(res.userVerified),
          status: res.status,
          reportTitle: report.title,
          reportId: report.id,
          resultId: res.id,
        };
      }
    }
  }
  return null;
}

// ------------------------------------------------------------------------------
// Tier Summary Calculator
// ------------------------------------------------------------------------------
function buildTierSummary(
  tier: TierLevel,
  name: string,
  subtitle: string,
  items: AdaptiveFieldItem[]
): TierSummary {
  const totalFieldsCount = items.length;
  let knownCount = 0;
  let pendingCount = 0;
  let unknownCount = 0;

  for (const item of items) {
    if (item.availability === 'known') knownCount++;
    else if (item.availability === 'pending_verification') pendingCount++;
    else if (item.availability === 'unknown') unknownCount++;
    // 'not_applicable' items are omitted from percentage calculation denominator if needed
  }

  const denominator = Math.max(1, totalFieldsCount);
  const completenessPercentage = Math.round((knownCount / denominator) * 100);

  let status: TierState = 'not_started';
  let statusLabel = 'Not Started';
  let statusSymbol: '✓' | '◐' | '○' | '—' = '○';

  if (completenessPercentage >= 80) {
    status = 'ready_for_assessment';
    statusLabel = 'Ready for Assessment';
    statusSymbol = '✓';
  } else if (completenessPercentage >= 35 || knownCount >= 2) {
    status = 'available';
    statusLabel = 'Partially Complete';
    statusSymbol = '◐';
  } else if (knownCount > 0 || pendingCount > 0) {
    status = 'in_progress';
    statusLabel = 'In Progress';
    statusSymbol = '◐';
  } else {
    status = 'not_started';
    statusLabel = 'Not Started';
    statusSymbol = '○';
  }

  return {
    tier,
    name,
    subtitle,
    status,
    statusLabel,
    statusSymbol,
    totalFieldsCount,
    knownCount,
    pendingCount,
    unknownCount,
    completenessPercentage,
    items,
  };
}

// ------------------------------------------------------------------------------
// Female Pathway: OvaSense AI (PCOS 4-Tier Screening)
// ------------------------------------------------------------------------------
function buildFemaleAdaptiveProfile(
  profile: UserProfile,
  cycleRecords: CycleRecord[],
  symptomRecords: SymptomRecord[],
  reports: MedicalReport[]
): AdaptiveHealthProfile {
  const age = calculateAge(profile.dateOfBirth);
  const bmi =
    profile.heightCm && profile.weightKg
      ? Math.round((profile.weightKg / Math.pow(profile.heightCm / 100, 2)) * 10) / 10
      : null;

  const wh = profile.womensHealth;
  const lf = profile.lifestyle;
  const med = profile.medical;

  // ── 1. TIER 1: Accessible / Self-Reported ─────────────────────────────────
  const tier1Items: AdaptiveFieldItem[] = [
    {
      id: 'female_age',
      tier: 'tier_1',
      label: 'Age',
      category: 'demographics',
      availability: age !== null ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: age !== null ? `${age} years` : undefined,
      whyItMatters: 'Age establishes baseline reproductive staging and physiological reference context.',
    },
    {
      id: 'female_bmi',
      tier: 'tier_1',
      label: 'Body Mass Index (BMI)',
      category: 'biometrics',
      availability: bmi !== null ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: bmi !== null ? `${bmi} kg/m²` : undefined,
      unit: 'kg/m²',
      referenceRange: '18.5 – 24.9 kg/m²',
      whyItMatters: 'Metabolic characteristics correlate with insulin sensitivity and ovulatory predictability.',
      isKeyPredictor: true,
    },
    {
      id: 'female_waist_cm',
      tier: 'tier_1',
      label: 'Waist Circumference',
      category: 'biometrics',
      availability: profile.waistCm ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: profile.waistCm ? `${profile.waistCm} cm` : undefined,
      unit: 'cm',
      whyItMatters: 'Central adiposity provides an accessible marker of visceral metabolic activity.',
    },
    {
      id: 'female_cycle_regularity',
      tier: 'tier_1',
      label: 'Menstrual Cycle Regularity',
      category: 'menstrual',
      availability: wh?.periodRegularity ? 'known' : cycleRecords.length > 0 ? 'known' : 'unknown',
      verification: cycleRecords.length > 0 ? 'user_verified' : 'self_reported',
      valueDisplay:
        wh?.periodRegularity
          ? wh.periodRegularity.replace(/_/g, ' ')
          : cycleRecords.length > 0
          ? `${cycleRecords.length} logged cycles`
          : undefined,
      whyItMatters: 'Ovulatory frequency is one of the three cornerstone Rotterdam consensus criteria.',
      isKeyPredictor: true,
      clinicalNote: 'Irregular cycles can occur for many reasons. This information is one part of a broader screening assessment.',
    },
    {
      id: 'female_cycle_length',
      tier: 'tier_1',
      label: 'Cycle Length',
      category: 'menstrual',
      availability: wh?.cycleLength !== undefined ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: wh?.cycleLength ? `${wh.cycleLength} days` : undefined,
      referenceRange: '21 – 35 days',
      whyItMatters: 'Prolonged intervals (>35 days) or oligomenorrhea signal potential anovulatory cycles.',
    },
    {
      id: 'female_symptom_hirsutism',
      tier: 'tier_1',
      label: 'Increased Facial / Body Hair',
      category: 'symptoms',
      availability:
        wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('hair') || s.toLowerCase().includes('hirsutism')) ||
        symptomRecords.some((r) => r.symptomType?.toLowerCase().includes('hair'))
          ? 'known'
          : 'unknown',
      verification: symptomRecords.length > 0 ? 'user_verified' : 'self_reported',
      valueDisplay:
        wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('hair') || s.toLowerCase().includes('hirsutism')) ||
        symptomRecords.some((r) => r.symptomType?.toLowerCase().includes('hair'))
          ? 'Reported'
          : 'Not reported',
      whyItMatters: 'Visual androgenic pattern screening marker considered in hyperandrogenism evaluation.',
      isKeyPredictor: true,
    },
    {
      id: 'female_symptom_acne',
      tier: 'tier_1',
      label: 'Persistent Adult Acne',
      category: 'symptoms',
      availability:
        wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('acne')) ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('acne')) ? 'Reported' : 'Not reported',
      whyItMatters: 'Sebaceous gland stimulation may reflect circulating androgen sensitivity.',
    },
    {
      id: 'female_symptom_hair_thinning',
      tier: 'tier_1',
      label: 'Scalp Hair Thinning',
      category: 'symptoms',
      availability:
        wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('thinning')) ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('thinning')) ? 'Reported' : 'Not reported',
      whyItMatters: 'Pattern hair thinning can reflect androgen receptor sensitivity.',
    },
    {
      id: 'female_weight_management',
      tier: 'tier_1',
      label: 'Weight Fluctuations / Difficulty Managing Weight',
      category: 'symptoms',
      availability:
        wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('weight')) ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: wh?.commonSymptoms?.some((s) => s.toLowerCase().includes('weight')) ? 'Reported' : 'Not reported',
      whyItMatters: 'Often correlated with subtle shifts in metabolic insulin signaling.',
    },
    {
      id: 'female_family_history',
      tier: 'tier_1',
      label: 'Family History of PCOS / Metabolic Conditions',
      category: 'family_history',
      availability: med?.familyHistory && med.familyHistory.length > 0 ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: med?.familyHistory?.join(', ') || undefined,
      whyItMatters: 'Genetic and familial predisposition plays a recognized role in reproductive metabolic health.',
    },
    {
      id: 'female_lifestyle_habits',
      tier: 'tier_1',
      label: 'Lifestyle, Sleep & Activity Rhythm',
      category: 'lifestyle',
      availability: lf?.sleepHours && lf?.activityLevel ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: lf?.sleepHours ? `${lf.sleepHours} hrs sleep • ${lf.activityLevel || 'moderate'} activity` : undefined,
      whyItMatters: 'Circadian rhythm and regular movement heavily modulate hormonal clearance and glucose regulation.',
    },
  ];

  // ── 2. TIER 2: Routine / Accessible Medical Information ──────────────────
  const fGlucose = findBiomarkerInReports(reports, ['fasting glucose', 'glucose', 'blood sugar', 'fbs']);
  const fHbA1c = findBiomarkerInReports(reports, ['hba1c', 'glycated hemoglobin', 'a1c']);
  const fLipid = findBiomarkerInReports(reports, ['lipid', 'cholesterol', 'triglycerides', 'hdl', 'ldl']);
  const fBP = findBiomarkerInReports(reports, ['blood pressure', 'bp', 'systolic']);
  const fCBC = findBiomarkerInReports(reports, ['cbc', 'hemoglobin', 'white blood', 'platelet']);

  const tier2Items: AdaptiveFieldItem[] = [
    {
      id: 'female_fasting_glucose',
      tier: 'tier_2',
      label: 'Fasting Blood Glucose',
      category: 'routine_labs',
      availability: fGlucose ? (fGlucose.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fGlucose ? (fGlucose.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fGlucose ? `${fGlucose.value} ${fGlucose.unit}` : undefined,
      unit: fGlucose?.unit || 'mg/dL',
      referenceRange: fGlucose?.referenceRange || '70 – 99 mg/dL',
      recordedAt: fGlucose?.date,
      source: fGlucose?.reportTitle || 'Laboratory Panel',
      reportId: fGlucose?.reportId,
      resultId: fGlucose?.resultId,
      whyItMatters: 'Evaluates baseline fasting glucose utilization.',
    },
    {
      id: 'female_hba1c',
      tier: 'tier_2',
      label: 'HbA1c (Glycated Hemoglobin)',
      category: 'routine_labs',
      availability: fHbA1c ? (fHbA1c.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fHbA1c ? (fHbA1c.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fHbA1c ? `${fHbA1c.value} %` : undefined,
      unit: '%',
      referenceRange: '< 5.7 %',
      recordedAt: fHbA1c?.date,
      source: fHbA1c?.reportTitle || 'Laboratory Panel',
      reportId: fHbA1c?.reportId,
      resultId: fHbA1c?.resultId,
      whyItMatters: 'Provides an integrated 3-month indicator of average blood glucose levels.',
    },
    {
      id: 'female_lipid_profile',
      tier: 'tier_2',
      label: 'Lipid Profile (Cholesterol & Triglycerides)',
      category: 'routine_labs',
      availability: fLipid ? (fLipid.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fLipid ? (fLipid.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fLipid ? `${fLipid.value} ${fLipid.unit}` : undefined,
      recordedAt: fLipid?.date,
      source: fLipid?.reportTitle || 'Routine Blood Test',
      reportId: fLipid?.reportId,
      resultId: fLipid?.resultId,
      whyItMatters: 'Assesses cardiovascular and metabolic lipid balance.',
    },
    {
      id: 'female_blood_pressure',
      tier: 'tier_2',
      label: 'Blood Pressure',
      category: 'routine_labs',
      availability: fBP ? (fBP.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fBP ? (fBP.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fBP ? `${fBP.value} ${fBP.unit || 'mmHg'}` : undefined,
      unit: 'mmHg',
      referenceRange: '< 120/80 mmHg',
      recordedAt: fBP?.date,
      reportId: fBP?.reportId,
      resultId: fBP?.resultId,
      whyItMatters: 'Key routine vital metric supporting overall cardiometabolic profile.',
    },
    {
      id: 'female_cbc',
      tier: 'tier_2',
      label: 'Complete Blood Count (CBC)',
      category: 'routine_labs',
      availability: fCBC ? (fCBC.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fCBC ? (fCBC.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fCBC ? `${fCBC.value} ${fCBC.unit}` : undefined,
      recordedAt: fCBC?.date,
      reportId: fCBC?.reportId,
      resultId: fCBC?.resultId,
      whyItMatters: 'Screens for routine biological considerations such as anemia that can impact energy levels.',
    },
  ];

  // ── 3. TIER 3: Specialized Hormonal / Clinical Information ───────────────
  const fTotalT = findBiomarkerInReports(reports, ['total testosterone', 'testosterone total', 'testosterone']);
  const fFreeT = findBiomarkerInReports(reports, ['free testosterone', 'bioavailable testosterone']);
  const fDHEAS = findBiomarkerInReports(reports, ['dhea-s', 'dheas', 'dehydroepiandrosterone']);
  const fSHBG = findBiomarkerInReports(reports, ['shbg', 'sex hormone binding']);
  const fLH = findBiomarkerInReports(reports, ['lh', 'luteinizing hormone']);
  const fFSH = findBiomarkerInReports(reports, ['fsh', 'follicle stimulating']);
  const fProlactin = findBiomarkerInReports(reports, ['prolactin']);
  const fTSH = findBiomarkerInReports(reports, ['tsh', 'thyroid stimulating']);

  const tier3Items: AdaptiveFieldItem[] = [
    {
      id: 'female_total_testosterone',
      tier: 'tier_3',
      label: 'Total Testosterone',
      category: 'hormones',
      availability: fTotalT ? (fTotalT.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fTotalT ? (fTotalT.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fTotalT ? `${fTotalT.value} ${fTotalT.unit}` : undefined,
      unit: fTotalT?.unit || 'ng/dL',
      referenceRange: fTotalT?.referenceRange || '15 – 70 ng/dL',
      recordedAt: fTotalT?.date,
      source: fTotalT?.reportTitle || 'Hormone Panel',
      reportId: fTotalT?.reportId,
      resultId: fTotalT?.resultId,
      whyItMatters: 'Circulating androgen measurement evaluated in hyperandrogenemia screening.',
      isKeyPredictor: true,
      clinicalNote: 'Hormonal values alone do not constitute a diagnosis; laboratory patterns must always be interpreted in comprehensive clinical context.',
    },
    {
      id: 'female_free_testosterone',
      tier: 'tier_3',
      label: 'Free / Bioavailable Testosterone',
      category: 'hormones',
      availability: fFreeT ? (fFreeT.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fFreeT ? (fFreeT.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fFreeT ? `${fFreeT.value} ${fFreeT.unit}` : undefined,
      unit: fFreeT?.unit || 'pg/mL',
      recordedAt: fFreeT?.date,
      reportId: fFreeT?.reportId,
      resultId: fFreeT?.resultId,
      whyItMatters: 'Measures unbound androgen actively available to peripheral tissues.',
    },
    {
      id: 'female_dheas',
      tier: 'tier_3',
      label: 'DHEA-S (Adrenal Androgen)',
      category: 'hormones',
      availability: fDHEAS ? (fDHEAS.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fDHEAS ? (fDHEAS.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fDHEAS ? `${fDHEAS.value} ${fDHEAS.unit}` : undefined,
      unit: fDHEAS?.unit || 'µg/dL',
      recordedAt: fDHEAS?.date,
      reportId: fDHEAS?.reportId,
      resultId: fDHEAS?.resultId,
      whyItMatters: 'Clarifies whether circulating androgen contribution has an adrenal signaling component.',
    },
    {
      id: 'female_shbg',
      tier: 'tier_3',
      label: 'SHBG (Sex Hormone-Binding Globulin)',
      category: 'hormones',
      availability: fSHBG ? (fSHBG.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fSHBG ? (fSHBG.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fSHBG ? `${fSHBG.value} ${fSHBG.unit}` : undefined,
      unit: fSHBG?.unit || 'nmol/L',
      recordedAt: fSHBG?.date,
      reportId: fSHBG?.reportId,
      resultId: fSHBG?.resultId,
      whyItMatters: 'Liver protein that binds androgens; lower levels can increase circulating free androgen activity.',
    },
    {
      id: 'female_lh_fsh_ratio',
      tier: 'tier_3',
      label: 'LH & FSH (Gonadotropins)',
      category: 'hormones',
      availability: fLH && fFSH ? (fLH.userVerified && fFSH.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fLH?.userVerified ? 'user_verified' : 'extracted',
      valueDisplay: fLH && fFSH ? `LH: ${fLH.value} ${fLH.unit} • FSH: ${fFSH.value} ${fFSH.unit}` : undefined,
      recordedAt: fLH?.date || fFSH?.date,
      reportId: fLH?.reportId || fFSH?.reportId,
      resultId: fLH?.resultId || fFSH?.resultId,
      whyItMatters: 'Pituitary signaling hormones that orchestrate follicle selection and ovulatory timing.',
      isKeyPredictor: true,
    },
    {
      id: 'female_prolactin',
      tier: 'tier_3',
      label: 'Prolactin',
      category: 'hormones',
      availability: fProlactin ? (fProlactin.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fProlactin ? (fProlactin.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fProlactin ? `${fProlactin.value} ${fProlactin.unit}` : undefined,
      unit: fProlactin?.unit || 'ng/mL',
      referenceRange: fProlactin?.referenceRange || '< 25 ng/mL',
      recordedAt: fProlactin?.date,
      reportId: fProlactin?.reportId,
      resultId: fProlactin?.resultId,
      whyItMatters: 'Screens for other potential causes of menstrual cycle variation.',
    },
    {
      id: 'female_tsh',
      tier: 'tier_3',
      label: 'TSH (Thyroid Function)',
      category: 'hormones',
      availability: fTSH ? (fTSH.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fTSH ? (fTSH.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fTSH ? `${fTSH.value} ${fTSH.unit}` : undefined,
      unit: fTSH?.unit || 'µIU/mL',
      referenceRange: fTSH?.referenceRange || '0.4 – 4.0 µIU/mL',
      recordedAt: fTSH?.date,
      reportId: fTSH?.reportId,
      resultId: fTSH?.resultId,
      whyItMatters: 'Thyroid dysregulation can independently alter menstrual frequency and energy patterns.',
    },
  ];

  // ── 4. TIER 4: Comprehensive Information ─────────────────────────────────
  const fUltrasound = findBiomarkerInReports(reports, ['ultrasound', 'ovarian volume', 'antral follicle', 'follicle count', 'pelvic us']);
  const fAMH = findBiomarkerInReports(reports, ['amh', 'anti-mullerian', 'mullerian']);
  const fFastingInsulin = findBiomarkerInReports(reports, ['fasting insulin', 'serum insulin']);
  const fOGTT = findBiomarkerInReports(reports, ['ogtt', 'glucose tolerance', '2-hour glucose']);

  const tier4Items: AdaptiveFieldItem[] = [
    {
      id: 'female_pelvic_ultrasound',
      tier: 'tier_4',
      label: 'Structured Pelvic Ultrasound Report',
      category: 'imaging',
      availability: fUltrasound ? (fUltrasound.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fUltrasound ? (fUltrasound.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fUltrasound ? `${fUltrasound.value} (${fUltrasound.reportTitle})` : undefined,
      recordedAt: fUltrasound?.date,
      source: fUltrasound?.reportTitle || 'Verified Radiology Report',
      reportId: fUltrasound?.reportId,
      resultId: fUltrasound?.resultId,
      whyItMatters: 'Extracts structured follicle count and ovarian volume metrics from verified clinical radiology reports.',
      clinicalNote: 'Only verified radiology text reports are used. BioPulse AI does not interpret raw ultrasound imagery.',
    },
    {
      id: 'female_amh',
      tier: 'tier_4',
      label: 'AMH (Anti-Müllerian Hormone)',
      category: 'hormones',
      availability: fAMH ? (fAMH.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fAMH ? (fAMH.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fAMH ? `${fAMH.value} ${fAMH.unit}` : undefined,
      unit: fAMH?.unit || 'ng/mL',
      recordedAt: fAMH?.date,
      reportId: fAMH?.reportId,
      resultId: fAMH?.resultId,
      whyItMatters: 'Marker produced by preantral follicles that correlates with ovarian follicle pool reserve.',
    },
    {
      id: 'female_fasting_insulin',
      tier: 'tier_4',
      label: 'Fasting Insulin (HOMA-IR Indicator)',
      category: 'routine_labs',
      availability: fFastingInsulin ? (fFastingInsulin.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fFastingInsulin ? (fFastingInsulin.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fFastingInsulin ? `${fFastingInsulin.value} ${fFastingInsulin.unit}` : undefined,
      recordedAt: fFastingInsulin?.date,
      reportId: fFastingInsulin?.reportId,
      resultId: fFastingInsulin?.resultId,
      whyItMatters: 'Enables precise assessment of insulin sensitivity beyond simple fasting glucose.',
    },
    {
      id: 'female_ogtt_2h',
      tier: 'tier_4',
      label: '2-Hour Oral Glucose Tolerance Test (OGTT)',
      category: 'routine_labs',
      availability: fOGTT ? (fOGTT.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: fOGTT ? (fOGTT.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: fOGTT ? `${fOGTT.value} ${fOGTT.unit}` : undefined,
      recordedAt: fOGTT?.date,
      reportId: fOGTT?.reportId,
      resultId: fOGTT?.resultId,
      whyItMatters: 'Gold standard dynamic evaluation for subtle insulin resistance and glucose clearance curves.',
    },
  ];

  // Construct Summaries
  const tier1Summary = buildTierSummary('tier_1', 'Tier 1: Accessible Information', 'Self-reported biometrics, cycle patterns & symptoms', tier1Items);
  const tier2Summary = buildTierSummary('tier_2', 'Tier 2: Routine Medical Information', 'Accessible laboratory panels, glucose & metabolic markers', tier2Items);
  const tier3Summary = buildTierSummary('tier_3', 'Tier 3: Specialized Hormonal Information', 'Endocrine panel: androgens, gonadotropins & thyroid markers', tier3Items);
  const tier4Summary = buildTierSummary('tier_4', 'Tier 4: Comprehensive Information', 'Verified structured ultrasound data & dynamic metabolic tests', tier4Items);

  // Calculate Overall Information Completeness (weighted towards accessibility)
  const totalAllFields = tier1Items.length + tier2Items.length + tier3Items.length + tier4Items.length;
  const knownAll = tier1Summary.knownCount + tier2Summary.knownCount + tier3Summary.knownCount + tier4Summary.knownCount;
  const overallCompleteness = Math.round((knownAll / totalAllFields) * 100);

  // Screening Readiness
  let readinessStatus: ScreeningReadinessStatus = 'needs_tier1_intake';
  let readinessLabel = 'Intake Needed';
  let readinessDescription = 'Provide your baseline cycle patterns and biometrics in Tier 1 to enable screening assessment.';

  const tier1ReadinessMet = tier1Summary.completenessPercentage >= 50;
  const higherTiersAvailable = tier2Summary.knownCount > 0 || tier3Summary.knownCount > 0 || tier4Summary.knownCount > 0;

  if (tier1ReadinessMet && higherTiersAvailable) {
    readinessStatus = 'additional_information_available';
    readinessLabel = 'Additional Information Available';
    readinessDescription = 'Your screening assessment is active with multiple tiers of verified health data.';
  } else if (tier1ReadinessMet) {
    readinessStatus = 'ready_for_initial_screening';
    readinessLabel = 'Ready for Initial Screening';
    readinessDescription = 'Your profile has enough accessible information for a baseline pattern screening assessment.';
  }

  // Information Gaps
  const allItems = [...tier1Items, ...tier2Items, ...tier3Items, ...tier4Items];
  const availableItems = allItems.filter((i) => i.availability === 'known');
  const pendingVerificationItems = allItems.filter((i) => i.availability === 'pending_verification');
  const missingPrioritizedItems = allItems.filter((i) => i.availability === 'unknown');

  // Cost-Aware Recommendations Placeholder
  const prioritizedRecommendations: PrioritizedInformationItem[] = [
    {
      id: 'rec_hba1c',
      testName: 'HbA1c & Fasting Glucose',
      tier: 'tier_2',
      category: 'routine_labs',
      estimatedBenefit: 'high',
      estimatedBenefitDescription: 'Clarifies insulin sensitivity patterns that frequently accompany ovulatory irregularity.',
      estimatedCostTier: '$',
      estimatedCostRangeText: 'Low Cost (Routine Blood Test)',
      collectionMethod: 'routine_blood',
      clinicalNote: 'Routine metabolic panel readily available via primary care or routine outpatient draw.',
    },
    {
      id: 'rec_hormone_panel',
      testName: 'Serum Total Testosterone & LH/FSH',
      tier: 'tier_3',
      category: 'hormones',
      estimatedBenefit: 'high',
      estimatedBenefitDescription: 'Directly informs the Rotterdam hyperandrogenism criteria and ovulatory signal ratio.',
      estimatedCostTier: '$$',
      estimatedCostRangeText: 'Moderate Cost (Specialized Reproductive Serum)',
      collectionMethod: 'specialized_serum',
      clinicalNote: 'Often drawn during early follicular phase (days 2–5 of cycle) for standardized interpretation.',
    },
    {
      id: 'rec_pelvic_ultrasound',
      testName: 'Pelvic Ultrasound (Structured Report)',
      tier: 'tier_4',
      category: 'imaging',
      estimatedBenefit: 'moderate',
      estimatedBenefitDescription: 'Provides clinical visualization of follicle distribution and ovarian volume.',
      estimatedCostTier: '$$$',
      estimatedCostRangeText: 'Higher Cost (Clinical Imaging Procedure)',
      collectionMethod: 'clinical_ultrasound',
      clinicalNote: 'Requires a referral from a licensed healthcare provider; structured report information is imported upon receipt.',
    },
  ];

  // Explainability Summary Placeholder
  const explainability: ExplainabilitySummary = {
    headline: "These features had the greatest influence on the model's assessment.",
    disclaimer: 'Algorithmic influence reflects mathematical weighting in statistical screening, not biological causation.',
    features: [
      {
        featureId: 'cycle_regularity',
        label: 'Menstrual Cycle Regularity',
        influenceDirection: 'increases_influence',
        patientExplanation: 'Cycle predictability has the strongest statistical weighting in the Rotterdam-aligned model.',
        isKnown: tier1Items.find((i) => i.id === 'female_cycle_regularity')?.availability === 'known',
      },
      {
        featureId: 'facial_body_hair',
        label: 'Excess Facial / Body Hair Pattern',
        influenceDirection: 'increases_influence',
        patientExplanation: 'Self-reported hair growth patterns reflect peripheral androgen activity.',
        isKnown: tier1Items.find((i) => i.id === 'female_symptom_hirsutism')?.availability === 'known',
      },
      {
        featureId: 'bmi_metabolic',
        label: 'Body Mass Index & Metabolic Context',
        influenceDirection: 'moderates_influence',
        patientExplanation: 'Interacts with cycle regularity to refine probability boundaries without being determinative.',
        isKnown: tier1Items.find((i) => i.id === 'female_bmi')?.availability === 'known',
      },
    ],
  };

  return {
    pathway: 'female',
    screeningPathwayName: 'BioPulse AI • PCOS Screening',
    isSpecializedPathway: true,
    readinessStatus,
    readinessLabel,
    readinessDescription,
    overallCompletenessPercentage: overallCompleteness,
    tiers: {
      tier_1: tier1Summary,
      tier_2: tier2Summary,
      tier_3: tier3Summary,
      tier_4: tier4Summary,
    },
    gaps: {
      availableItems,
      pendingVerificationItems,
      missingPrioritizedItems,
      totalAvailableCount: availableItems.length,
      totalMissingCount: missingPrioritizedItems.length,
    },
    prioritizedRecommendations,
    explainability,
    lastCalculatedAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------------------
// Male Pathway: AndroSense AI (Male Hypogonadism 4-Tier Screening)
// ------------------------------------------------------------------------------
function buildMaleAdaptiveProfile(
  profile: UserProfile,
  symptomRecords: SymptomRecord[],
  reports: MedicalReport[]
): AdaptiveHealthProfile {
  const age = calculateAge(profile.dateOfBirth);
  const bmi =
    profile.heightCm && profile.weightKg
      ? Math.round((profile.weightKg / Math.pow(profile.heightCm / 100, 2)) * 10) / 10
      : null;

  const mh = profile.mensHealth;
  const lf = profile.lifestyle;
  const med = profile.medical;

  // ── 1. TIER 1: Accessible / Self-Reported ─────────────────────────────────
  const tier1Items: AdaptiveFieldItem[] = [
    {
      id: 'male_age',
      tier: 'tier_1',
      label: 'Age',
      category: 'demographics',
      availability: age !== null ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: age !== null ? `${age} years` : undefined,
      whyItMatters: 'Age establishes baseline endocrine reference ranges for testosterone and gonadotropins.',
    },
    {
      id: 'male_bmi',
      tier: 'tier_1',
      label: 'Body Mass Index (BMI)',
      category: 'biometrics',
      availability: bmi !== null ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: bmi !== null ? `${bmi} kg/m²` : undefined,
      unit: 'kg/m²',
      referenceRange: '18.5 – 24.9 kg/m²',
      whyItMatters: 'Adipose aromatase enzyme converts testosterone to estrogen, influencing circulating levels.',
      isKeyPredictor: true,
    },
    {
      id: 'male_waist_cm',
      tier: 'tier_1',
      label: 'Waist Circumference',
      category: 'biometrics',
      availability: profile.waistCm ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: profile.waistCm ? `${profile.waistCm} cm` : undefined,
      unit: 'cm',
      whyItMatters: 'Abdominal waist measurement is an accessible clinical indicator of metabolic health.',
    },
    {
      id: 'male_energy_level',
      tier: 'tier_1',
      label: 'Daily Energy & Stamina',
      category: 'symptoms',
      availability:
        mh?.energyLevel || symptomRecords.some((r) => r.symptomType?.toLowerCase().includes('fatigue'))
          ? 'known'
          : 'unknown',
      verification: symptomRecords.length > 0 ? 'user_verified' : 'self_reported',
      valueDisplay: mh?.energyLevel ? mh.energyLevel.replace(/_/g, ' ') : symptomRecords.length > 0 ? 'Logged in symptoms' : undefined,
      whyItMatters: 'Fatigue, afternoon slumps, and reduced stamina are frequent non-specific self-reported symptoms.',
      isKeyPredictor: true,
    },
    {
      id: 'male_sex_drive',
      tier: 'tier_1',
      label: 'Sex Drive (Libido)',
      category: 'symptoms',
      availability: mh?.sexDrive ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.sexDrive ? mh.sexDrive.replace(/_/g, ' ') : undefined,
      whyItMatters: 'Reduced sexual desire is a clinically sensitive symptom in male hypogonadism evaluations.',
      isKeyPredictor: true,
    },
    {
      id: 'male_erectile_function',
      tier: 'tier_1',
      label: 'Erectile Firmness & Quality',
      category: 'symptoms',
      availability: mh?.erectileDifficulties ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.erectileDifficulties ? mh.erectileDifficulties.replace(/_/g, ' ') : undefined,
      whyItMatters: 'Morning erection quality and firmness correlate with vascular and nocturnal hormonal surges.',
    },
    {
      id: 'male_muscle_strength',
      tier: 'tier_1',
      label: 'Muscle Strength & Physical Endurance',
      category: 'symptoms',
      availability: mh?.muscleStrengthChanges ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.muscleStrengthChanges ? mh.muscleStrengthChanges.replace(/_/g, ' ') : undefined,
      whyItMatters: 'Androgens support lean muscle mass maintenance and athletic recovery.',
    },
    {
      id: 'male_body_hair',
      tier: 'tier_1',
      label: 'Body / Facial Hair Density Changes',
      category: 'symptoms',
      availability: mh?.bodyHairChanges ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.bodyHairChanges ? mh.bodyHairChanges.replace(/_/g, ' ') : undefined,
      whyItMatters: 'Significant reduction in beard trimming frequency can accompany prolonged low androgen levels.',
    },
    {
      id: 'male_mood_patterns',
      tier: 'tier_1',
      label: 'Mood, Motivation & Mental Clarity',
      category: 'symptoms',
      availability: mh?.moodChanges && mh.moodChanges.length > 0 ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.moodChanges?.join(', ') || undefined,
      whyItMatters: 'Subtle irritability, low drive, or brain fog are common associated symptom reports.',
    },
    {
      id: 'male_sleep_quality',
      tier: 'tier_1',
      label: 'Sleep Quality & Nocturnal Recovery',
      category: 'symptoms',
      availability: mh?.sleepQuality ? 'known' : lf?.sleepHours ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.sleepQuality ? mh.sleepQuality.replace(/_/g, ' ') : lf?.sleepHours ? `${lf.sleepHours} hrs` : undefined,
      whyItMatters: 'Testosterone synthesis occurs primarily during deep REM sleep; poor sleep directly impairs levels.',
    },
    {
      id: 'male_medication_history',
      tier: 'tier_1',
      label: 'Opioid, Steroid or TRT Exposure History',
      category: 'medical_history',
      availability: mh?.priorMedications && mh.priorMedications.length > 0 ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: mh?.priorMedications?.join(', ') || 'No suppressing medications logged',
      whyItMatters: 'Prescription opioids, anabolic steroids, and exogenous testosterone suppress the hypothalamic-pituitary-gonadal (HPG) axis.',
      isKeyPredictor: true,
    },
    {
      id: 'male_family_history',
      tier: 'tier_1',
      label: 'Family History of Endocrine / Cardiometabolic Factors',
      category: 'family_history',
      availability: med?.familyHistory && med.familyHistory.length > 0 ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: med?.familyHistory?.join(', ') || undefined,
      whyItMatters: 'Familial metabolic conditions inform cardiovascular and hormonal risk context.',
    },
  ];

  // ── 2. TIER 2: Routine / Accessible Medical Information ──────────────────
  const mGlucose = findBiomarkerInReports(reports, ['fasting glucose', 'glucose', 'blood sugar']);
  const mHbA1c = findBiomarkerInReports(reports, ['hba1c', 'a1c']);
  const mTSH = findBiomarkerInReports(reports, ['tsh', 'thyroid', 'free t4', 'ft4']);
  const mLipid = findBiomarkerInReports(reports, ['lipid', 'cholesterol', 'triglycerides']);
  const mCBC = findBiomarkerInReports(reports, ['cbc', 'hematocrit', 'hemoglobin', 'rbc']);
  const mCMP = findBiomarkerInReports(reports, ['cmp', 'metabolic panel', 'creatinine', 'alt', 'ast']);
  const mVitD = findBiomarkerInReports(reports, ['vitamin d', '25-hydroxy', 'vit d']);

  const tier2Items: AdaptiveFieldItem[] = [
    {
      id: 'male_fasting_glucose',
      tier: 'tier_2',
      label: 'Fasting Blood Glucose',
      category: 'routine_labs',
      availability: mGlucose ? (mGlucose.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mGlucose ? (mGlucose.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mGlucose ? `${mGlucose.value} ${mGlucose.unit}` : undefined,
      unit: mGlucose?.unit || 'mg/dL',
      referenceRange: '70 – 99 mg/dL',
      recordedAt: mGlucose?.date,
      reportId: mGlucose?.reportId,
      resultId: mGlucose?.resultId,
      whyItMatters: 'Metabolic syndrome and insulin resistance are bidirectional risk factors for low testosterone.',
    },
    {
      id: 'male_hba1c',
      tier: 'tier_2',
      label: 'HbA1c',
      category: 'routine_labs',
      availability: mHbA1c ? (mHbA1c.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mHbA1c ? (mHbA1c.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mHbA1c ? `${mHbA1c.value} %` : undefined,
      unit: '%',
      referenceRange: '< 5.7 %',
      recordedAt: mHbA1c?.date,
      reportId: mHbA1c?.reportId,
      resultId: mHbA1c?.resultId,
      whyItMatters: 'Glycemic control correlates with circulating hormone binding globulin synthesis in the liver.',
    },
    {
      id: 'male_tsh_ft4',
      tier: 'tier_2',
      label: 'TSH / Free T4 (Thyroid Panel)',
      category: 'routine_labs',
      availability: mTSH ? (mTSH.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mTSH ? (mTSH.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mTSH ? `${mTSH.value} ${mTSH.unit}` : undefined,
      recordedAt: mTSH?.date,
      reportId: mTSH?.reportId,
      resultId: mTSH?.resultId,
      whyItMatters: 'Hypothyroidism can produce fatigue and sexual symptoms that clinically mimic hypogonadism.',
    },
    {
      id: 'male_lipid_panel',
      tier: 'tier_2',
      label: 'Lipid Profile',
      category: 'routine_labs',
      availability: mLipid ? (mLipid.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mLipid ? (mLipid.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mLipid ? `${mLipid.value} ${mLipid.unit}` : undefined,
      recordedAt: mLipid?.date,
      reportId: mLipid?.reportId,
      resultId: mLipid?.resultId,
      whyItMatters: 'Cardiovascular assessment provides context for erectile vitality and overall vascular health.',
    },
    {
      id: 'male_cbc_hematocrit',
      tier: 'tier_2',
      label: 'CBC (Hematocrit & Hemoglobin)',
      category: 'routine_labs',
      availability: mCBC ? (mCBC.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mCBC ? (mCBC.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mCBC ? `${mCBC.value} ${mCBC.unit}` : undefined,
      recordedAt: mCBC?.date,
      reportId: mCBC?.reportId,
      resultId: mCBC?.resultId,
      whyItMatters: 'Testosterone stimulates erythropoiesis; hematocrit serves as an important baseline safety parameter.',
    },
    {
      id: 'male_cmp_renal_liver',
      tier: 'tier_2',
      label: 'Comprehensive Metabolic Panel (CMP)',
      category: 'routine_labs',
      availability: mCMP ? (mCMP.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mCMP ? (mCMP.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mCMP ? `${mCMP.value} ${mCMP.unit}` : undefined,
      recordedAt: mCMP?.date,
      reportId: mCMP?.reportId,
      resultId: mCMP?.resultId,
      whyItMatters: 'Hepatic and renal health directly influence steroid hormone clearance and binding protein production.',
    },
    {
      id: 'male_vitamin_d',
      tier: 'tier_2',
      label: '25-OH Vitamin D',
      category: 'routine_labs',
      availability: mVitD ? (mVitD.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mVitD ? (mVitD.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mVitD ? `${mVitD.value} ${mVitD.unit}` : undefined,
      unit: mVitD?.unit || 'ng/mL',
      referenceRange: '30 – 100 ng/mL',
      recordedAt: mVitD?.date,
      reportId: mVitD?.reportId,
      resultId: mVitD?.resultId,
      whyItMatters: 'Vitamin D receptors are present in Leydig cells and support general endocrine health.',
    },
  ];

  // ── 3. TIER 3: Specialized Hormonal / Clinical Information ───────────────
  const mTotalT = findBiomarkerInReports(reports, ['total testosterone', 'testosterone total', 'testosterone']);
  const mLH = findBiomarkerInReports(reports, ['lh', 'luteinizing hormone']);
  const mFSH = findBiomarkerInReports(reports, ['fsh', 'follicle stimulating']);
  const mProlactin = findBiomarkerInReports(reports, ['prolactin']);
  const mSHBG = findBiomarkerInReports(reports, ['shbg', 'sex hormone binding']);
  const mEstradiol = findBiomarkerInReports(reports, ['estradiol', 'e2']);

  // Check self-reported testosterone from onboarding profile as fallback
  const hasSelfReportedTest = mh?.hadTestosteroneTest === 'yes' && mh.testosteroneValue;

  const tier3Items: AdaptiveFieldItem[] = [
    {
      id: 'male_morning_testosterone',
      tier: 'tier_3',
      label: 'Morning Total Testosterone',
      category: 'hormones',
      availability: mTotalT
        ? (mTotalT.userVerified ? 'known' : 'pending_verification')
        : hasSelfReportedTest
        ? 'known'
        : 'unknown',
      verification: mTotalT
        ? (mTotalT.userVerified ? 'user_verified' : 'extracted')
        : hasSelfReportedTest
        ? 'self_reported'
        : 'self_reported',
      valueDisplay: mTotalT
        ? `${mTotalT.value} ${mTotalT.unit}`
        : hasSelfReportedTest
        ? `${mh.testosteroneValue} ${mh.testosteroneUnit || 'ng/dL'}`
        : undefined,
      unit: mTotalT?.unit || mh?.testosteroneUnit || 'ng/dL',
      referenceRange: '300 – 1,000 ng/dL',
      recordedAt: mTotalT?.date,
      source: mTotalT?.reportTitle || (hasSelfReportedTest ? 'Onboarding Baseline' : 'Laboratory Serum'),
      reportId: mTotalT?.reportId,
      resultId: mTotalT?.resultId,
      whyItMatters: 'Primary androgen biomarker evaluated in male hypogonadism screening.',
      isKeyPredictor: true,
      timingDetails: {
        morningTest: mh?.testDrawTime === 'morning_fasting' || true,
        fastingStatus: mh?.testDrawTime === 'morning_fasting',
        drawTime: mh?.testDrawTime === 'morning_fasting' ? '08:00 AM' : undefined,
      },
      clinicalNote:
        'Testosterone levels can vary during the day, so morning testing (typically 7:00 AM – 10:00 AM) is standard when evaluating low testosterone. A single test value is never an automated diagnosis; clinical guidelines recommend confirmatory morning testing.',
    },
    {
      id: 'male_lh',
      tier: 'tier_3',
      label: 'LH (Luteinizing Hormone)',
      category: 'hormones',
      availability: mLH ? (mLH.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mLH ? (mLH.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mLH ? `${mLH.value} ${mLH.unit}` : undefined,
      unit: mLH?.unit || 'mIU/mL',
      referenceRange: '1.5 – 9.3 mIU/mL',
      recordedAt: mLH?.date,
      reportId: mLH?.reportId,
      resultId: mLH?.resultId,
      whyItMatters: 'Differentiates primary testicular insufficiency (elevated LH) from secondary pituitary signaling patterns (low/normal LH).',
      isKeyPredictor: true,
      clinicalNote: 'Helps characterize whether the hormone signaling loop between the brain and testes is responding as expected.',
    },
    {
      id: 'male_fsh',
      tier: 'tier_3',
      label: 'FSH (Follicle-Stimulating Hormone)',
      category: 'hormones',
      availability: mFSH ? (mFSH.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mFSH ? (mFSH.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mFSH ? `${mFSH.value} ${mFSH.unit}` : undefined,
      unit: mFSH?.unit || 'mIU/mL',
      referenceRange: '1.5 – 12.4 mIU/mL',
      recordedAt: mFSH?.date,
      reportId: mFSH?.reportId,
      resultId: mFSH?.resultId,
      whyItMatters: 'Stimulates Sertoli cells in the seminiferous tubules; pairs with LH in HPG axis evaluation.',
    },
    {
      id: 'male_prolactin',
      tier: 'tier_3',
      label: 'Serum Prolactin',
      category: 'hormones',
      availability: mProlactin ? (mProlactin.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mProlactin ? (mProlactin.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mProlactin ? `${mProlactin.value} ${mProlactin.unit}` : undefined,
      unit: mProlactin?.unit || 'ng/mL',
      referenceRange: '2.0 – 18.0 ng/mL',
      recordedAt: mProlactin?.date,
      reportId: mProlactin?.reportId,
      resultId: mProlactin?.resultId,
      whyItMatters: 'Elevated prolactin can suppress pituitary gonadotropin output.',
      clinicalNote:
        'This pattern can sometimes be associated with conditions involving hormone regulation. Consider discussing your results with an endocrinologist if persistently elevated.',
    },
    {
      id: 'male_shbg',
      tier: 'tier_3',
      label: 'SHBG (Sex Hormone-Binding Globulin)',
      category: 'hormones',
      availability: mSHBG ? (mSHBG.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mSHBG ? (mSHBG.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mSHBG ? `${mSHBG.value} ${mSHBG.unit}` : undefined,
      unit: mSHBG?.unit || 'nmol/L',
      referenceRange: '10 – 57 nmol/L',
      recordedAt: mSHBG?.date,
      reportId: mSHBG?.reportId,
      resultId: mSHBG?.resultId,
      whyItMatters: 'High SHBG can bind more testosterone, lowering biologically available free testosterone despite normal total levels.',
    },
    {
      id: 'male_estradiol',
      tier: 'tier_3',
      label: 'Estradiol (E2)',
      category: 'hormones',
      availability: mEstradiol ? (mEstradiol.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mEstradiol ? (mEstradiol.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mEstradiol ? `${mEstradiol.value} ${mEstradiol.unit}` : undefined,
      unit: mEstradiol?.unit || 'pg/mL',
      referenceRange: '10 – 40 pg/mL',
      recordedAt: mEstradiol?.date,
      reportId: mEstradiol?.reportId,
      resultId: mEstradiol?.resultId,
      whyItMatters: 'Assesses peripheral estrogen conversion and negative feedback on the pituitary gland.',
    },
  ];

  // ── 4. TIER 4: Comprehensive Information ─────────────────────────────────
  const mFreeT = findBiomarkerInReports(reports, ['free testosterone', 'bioavailable testosterone']);
  const mMRI = findBiomarkerInReports(reports, ['pituitary mri', 'brain mri', 'sella mri']);
  const mDEXA = findBiomarkerInReports(reports, ['dexa', 'bone density', 'bmd']);
  const mPSA = findBiomarkerInReports(reports, ['psa', 'prostate specific']);

  const tier4Items: AdaptiveFieldItem[] = [
    {
      id: 'male_free_testosterone',
      tier: 'tier_4',
      label: 'Free / Bioavailable Testosterone (Equilibrium Dialysis)',
      category: 'hormones',
      availability: mFreeT ? (mFreeT.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mFreeT ? (mFreeT.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mFreeT ? `${mFreeT.value} ${mFreeT.unit}` : undefined,
      unit: mFreeT?.unit || 'pg/mL',
      recordedAt: mFreeT?.date,
      reportId: mFreeT?.reportId,
      resultId: mFreeT?.resultId,
      whyItMatters: 'Directly measures the free circulating hormone unattached to SHBG or albumin.',
      clinicalNote: 'Optional comprehensive evaluation often performed when SHBG levels are altered by age or metabolic factors.',
    },
    {
      id: 'male_pituitary_mri',
      tier: 'tier_4',
      label: 'Pituitary MRI Report (If Clinically Indicated)',
      category: 'imaging',
      availability: mMRI ? (mMRI.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mMRI ? (mMRI.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mMRI ? `${mMRI.value} (${mMRI.reportTitle})` : undefined,
      recordedAt: mMRI?.date,
      reportId: mMRI?.reportId,
      resultId: mMRI?.resultId,
      whyItMatters: 'Investigates central pituitary anatomy if severe secondary hypogonadism or high prolactin is identified.',
      clinicalNote: 'Never required routinely; reserved for specific clinical indications guided by an endocrinologist.',
    },
    {
      id: 'male_dexa_scan',
      tier: 'tier_4',
      label: 'DEXA Bone Mineral Density Scan',
      category: 'imaging',
      availability: mDEXA ? (mDEXA.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mDEXA ? (mDEXA.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mDEXA ? `${mDEXA.value}` : undefined,
      recordedAt: mDEXA?.date,
      reportId: mDEXA?.reportId,
      resultId: mDEXA?.resultId,
      whyItMatters: 'Longstanding low androgen levels can lead to osteopenia; bone density tests assess skeletal mineralization.',
    },
    {
      id: 'male_psa',
      tier: 'tier_4',
      label: 'PSA (Prostate-Specific Antigen)',
      category: 'routine_labs',
      availability: mPSA ? (mPSA.userVerified ? 'known' : 'pending_verification') : 'unknown',
      verification: mPSA ? (mPSA.userVerified ? 'user_verified' : 'extracted') : 'self_reported',
      valueDisplay: mPSA ? `${mPSA.value} ${mPSA.unit || 'ng/mL'}` : undefined,
      recordedAt: mPSA?.date,
      reportId: mPSA?.reportId,
      resultId: mPSA?.resultId,
      whyItMatters: 'Standard baseline prostate health biomarker utilized prior to clinical hormone discussions in older men.',
    },
  ];

  // Construct Summaries
  const tier1Summary = buildTierSummary('tier_1', 'Tier 1: Accessible Information', 'Self-reported symptoms, biometrics & health history', tier1Items);
  const tier2Summary = buildTierSummary('tier_2', 'Tier 2: Routine Medical Information', 'Accessible metabolic blood panels, glucose, CBC & lipids', tier2Items);
  const tier3Summary = buildTierSummary('tier_3', 'Tier 3: Specialized Hormonal Information', 'Morning testosterone, LH/FSH & endocrine markers', tier3Items);
  const tier4Summary = buildTierSummary('tier_4', 'Tier 4: Comprehensive Information', 'Free testosterone & specialized clinical reports', tier4Items);

  // Overall Information Completeness
  const totalAllFields = tier1Items.length + tier2Items.length + tier3Items.length + tier4Items.length;
  const knownAll = tier1Summary.knownCount + tier2Summary.knownCount + tier3Summary.knownCount + tier4Summary.knownCount;
  const overallCompleteness = Math.round((knownAll / totalAllFields) * 100);

  // Screening Readiness
  let readinessStatus: ScreeningReadinessStatus = 'needs_tier1_intake';
  let readinessLabel = 'Intake Needed';
  let readinessDescription = 'Provide your vitality ratings and accessible biometrics in Tier 1 to begin screening.';

  const tier1ReadinessMet = tier1Summary.completenessPercentage >= 50;
  const higherTiersAvailable = tier2Summary.knownCount > 0 || tier3Summary.knownCount > 0 || tier4Summary.knownCount > 0;

  if (tier1ReadinessMet && higherTiersAvailable) {
    readinessStatus = 'additional_information_available';
    readinessLabel = 'Additional Information Available';
    readinessDescription = 'Your screening assessment incorporates multiple tiers of verified health data.';
  } else if (tier1ReadinessMet) {
    readinessStatus = 'ready_for_initial_screening';
    readinessLabel = 'Ready for Initial Screening';
    readinessDescription = 'Your profile has enough accessible information for a preliminary vitality and hypogonadism screening assessment.';
  }

  // Information Gaps
  const allItems = [...tier1Items, ...tier2Items, ...tier3Items, ...tier4Items];
  const availableItems = allItems.filter((i) => i.availability === 'known');
  const pendingVerificationItems = allItems.filter((i) => i.availability === 'pending_verification');
  const missingPrioritizedItems = allItems.filter((i) => i.availability === 'unknown');

  // Cost-Aware Recommendations Placeholder
  const prioritizedRecommendations: PrioritizedInformationItem[] = [
    {
      id: 'rec_morning_t',
      testName: 'Morning Total Testosterone (Fasting)',
      tier: 'tier_3',
      category: 'hormones',
      estimatedBenefit: 'high',
      estimatedBenefitDescription: 'Standardized morning draw establishes primary biochemical baseline for testosterone assessment.',
      estimatedCostTier: '$',
      estimatedCostRangeText: 'Accessible Cost (Standard Routine Serum Test)',
      collectionMethod: 'routine_blood',
      clinicalNote: 'Best drawn between 7:00 AM and 10:00 AM after an overnight fast for standardized evaluation.',
    },
    {
      id: 'rec_lh_fsh',
      testName: 'Serum LH & FSH (Pituitary Gonadotropins)',
      tier: 'tier_3',
      category: 'hormones',
      estimatedBenefit: 'high',
      estimatedBenefitDescription: 'Clarifies whether hormone regulatory signals between the brain and testes are operating at expected levels.',
      estimatedCostTier: '$$',
      estimatedCostRangeText: 'Moderate Cost (Endocrine Serum Panel)',
      collectionMethod: 'specialized_serum',
      clinicalNote: 'Critical for differentiating primary testicular from secondary pituitary signaling patterns.',
    },
    {
      id: 'rec_cmp_cbc',
      testName: 'Routine CBC & Comprehensive Metabolic Panel',
      tier: 'tier_2',
      category: 'routine_labs',
      estimatedBenefit: 'moderate',
      estimatedBenefitDescription: 'Confirms baseline hematocrit and liver function to rule out general physiological contributors to fatigue.',
      estimatedCostTier: '$',
      estimatedCostRangeText: 'Low Cost (Routine Primary Care Panel)',
      collectionMethod: 'routine_blood',
      clinicalNote: 'Readily available via standard primary care blood work.',
    },
  ];

  // Explainability Summary Placeholder
  const explainability: ExplainabilitySummary = {
    headline: "These features had the greatest influence on the model's assessment.",
    disclaimer: 'Statistical feature weights reflect algorithmic pattern influence, never a solitary clinical diagnosis.',
    features: [
      {
        featureId: 'energy_vitality',
        label: 'Self-Reported Energy & Stamina',
        influenceDirection: 'increases_influence',
        patientExplanation: 'Persistent daily energy patterns correlate with self-reported screening profiles.',
        isKnown: tier1Items.find((i) => i.id === 'male_energy_level')?.availability === 'known',
      },
      {
        featureId: 'libido_erectile',
        label: 'Libido & Morning Firmness Rhythm',
        influenceDirection: 'increases_influence',
        patientExplanation: 'Considered a key functional indicator in clinical male hypogonadism screening tools.',
        isKnown: tier1Items.find((i) => i.id === 'male_sex_drive')?.availability === 'known',
      },
      {
        featureId: 'sleep_recovery',
        label: 'Sleep Duration & Nocturnal Recovery',
        influenceDirection: 'moderates_influence',
        patientExplanation: 'Essential for diurnal testosterone synthesis and daily stamina regulation.',
        isKnown: tier1Items.find((i) => i.id === 'male_sleep_quality')?.availability === 'known',
      },
    ],
  };

  return {
    pathway: 'male',
    screeningPathwayName: 'BioPulse AI • Male Hypogonadism Screening',
    isSpecializedPathway: true,
    readinessStatus,
    readinessLabel,
    readinessDescription,
    overallCompletenessPercentage: overallCompleteness,
    tiers: {
      tier_1: tier1Summary,
      tier_2: tier2Summary,
      tier_3: tier3Summary,
      tier_4: tier4Summary,
    },
    gaps: {
      availableItems,
      pendingVerificationItems,
      missingPrioritizedItems,
      totalAvailableCount: availableItems.length,
      totalMissingCount: missingPrioritizedItems.length,
    },
    prioritizedRecommendations,
    explainability,
    lastCalculatedAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------------------
// General Pathway: VITASense Baseline Health & Monitoring
// ------------------------------------------------------------------------------
function buildGeneralAdaptiveProfile(
  profile: UserProfile,
  symptomRecords: SymptomRecord[],
  reports: MedicalReport[]
): AdaptiveHealthProfile {
  const age = calculateAge(profile.dateOfBirth);
  const bmi =
    profile.heightCm && profile.weightKg
      ? Math.round((profile.weightKg / Math.pow(profile.heightCm / 100, 2)) * 10) / 10
      : null;

  const lf = profile.lifestyle;
  const med = profile.medical;

  const baselineItems: AdaptiveFieldItem[] = [
    {
      id: 'gen_age',
      tier: 'tier_1',
      label: 'Age',
      category: 'demographics',
      availability: age !== null ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: age !== null ? `${age} years` : undefined,
      whyItMatters: 'Establishes general wellness guidelines and age-appropriate health recommendations.',
    },
    {
      id: 'gen_bmi',
      tier: 'tier_1',
      label: 'BMI & Body Composition',
      category: 'biometrics',
      availability: bmi !== null ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: bmi !== null ? `${bmi} kg/m²` : undefined,
      unit: 'kg/m²',
      referenceRange: '18.5 – 24.9 kg/m²',
      whyItMatters: 'Baseline physical metric supporting overall metabolic wellness.',
    },
    {
      id: 'gen_lifestyle',
      tier: 'tier_1',
      label: 'Lifestyle Habits (Sleep & Activity)',
      category: 'lifestyle',
      availability: lf?.sleepHours ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: lf?.sleepHours ? `${lf.sleepHours} hrs sleep • ${lf.activityLevel || 'moderate'}` : undefined,
      whyItMatters: 'Restorative sleep and regular exercise are fundamental pillars of daily health.',
    },
    {
      id: 'gen_medical',
      tier: 'tier_1',
      label: 'Medical Conditions & Allergies',
      category: 'medical_history',
      availability: med?.conditions && med.conditions.length > 0 ? 'known' : 'unknown',
      verification: 'self_reported',
      valueDisplay: med?.conditions?.join(', ') || 'None recorded',
      whyItMatters: 'Provides context for health tracking and preventive care discussions.',
    },
    {
      id: 'gen_symptoms',
      tier: 'tier_1',
      label: 'Longitudinal Symptom Tracking',
      category: 'symptoms',
      availability: symptomRecords.length > 0 ? 'known' : 'unknown',
      verification: 'user_verified',
      valueDisplay: symptomRecords.length > 0 ? `${symptomRecords.length} observations logged` : undefined,
      whyItMatters: 'Captures daily wellness observations and physical rhythm patterns.',
    },
    {
      id: 'gen_reports',
      tier: 'tier_1',
      label: 'Routine Lab Document Storage',
      category: 'routine_labs',
      availability: reports.length > 0 ? 'known' : 'unknown',
      verification: 'user_verified',
      valueDisplay: reports.length > 0 ? `${reports.length} reports attached` : undefined,
      whyItMatters: 'Enables longitudinal storage of routine clinical documentation.',
    },
  ];

  const tier1Summary = buildTierSummary('tier_1', 'General Health Profile', 'Self-reported measurements, lifestyle habits & history', baselineItems);
  const tier2Summary = buildTierSummary('tier_2', 'Routine Lab Records', 'Imported routine blood work and health panels', []);
  const tier3Summary = buildTierSummary('tier_3', 'Specialized Clinical Data', 'Optional specialist lab data if provided', []);
  const tier4Summary = buildTierSummary('tier_4', 'Comprehensive History', 'Complete longitudinal documentation', []);

  const knownCount = tier1Summary.knownCount;
  const overallCompleteness = Math.round((knownCount / Math.max(1, baselineItems.length)) * 100);

  return {
    pathway: 'general',
    screeningPathwayName: 'BioPulse AI • Baseline Health & Wellness',
    isSpecializedPathway: false,
    readinessStatus: 'ready_for_initial_screening',
    readinessLabel: 'Profile Active',
    readinessDescription: 'Your baseline health profile is active. You can log symptoms, habits, and upload routine reports at any time.',
    overallCompletenessPercentage: overallCompleteness,
    tiers: {
      tier_1: tier1Summary,
      tier_2: tier2Summary,
      tier_3: tier3Summary,
      tier_4: tier4Summary,
    },
    gaps: {
      availableItems: baselineItems.filter((i) => i.availability === 'known'),
      pendingVerificationItems: [],
      missingPrioritizedItems: baselineItems.filter((i) => i.availability === 'unknown'),
      totalAvailableCount: knownCount,
      totalMissingCount: baselineItems.length - knownCount,
    },
    prioritizedRecommendations: [],
    explainability: {
      headline: 'General Health Focus Areas',
      disclaimer: 'BioPulse AI provides preventive baseline wellness tracking.',
      features: [],
    },
    lastCalculatedAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------------------
// ADAM Questionnaire Helper
// ------------------------------------------------------------------------------
export function getInitialADAMQuestions(): ADAMQuestionnaireState {
  const prompts = [
    { number: 1, prompt: 'Do you have a decrease in libido (sex drive)?', isCritical: true },
    { number: 2, prompt: 'Do you have a lack of energy?' },
    { number: 3, prompt: 'Do you have a decrease in strength and/or endurance?' },
    { number: 4, prompt: 'Have you lost height?' },
    { number: 5, prompt: 'Have you noticed a decreased "enjoyment of life"?' },
    { number: 6, prompt: 'Are you sad and/or grumpy?' },
    { number: 7, prompt: 'Are your erections less strong?', isCritical: true },
    { number: 8, prompt: 'Have you noticed a recent deterioration in your ability to play sports?' },
    { number: 9, prompt: 'Are you falling asleep after dinner?' },
    { number: 10, prompt: 'Has there been a recent deterioration in your work performance?' },
  ];

  const questions = prompts.map((p) => ({
    id: `adam_q${p.number}`,
    questionNumber: p.number,
    prompt: p.prompt,
    response: null,
    isCriticalQuestion: p.isCritical,
  }));

  return {
    questions,
    completedCount: 0,
    yesResponsesCount: 0,
    hasCriticalYes: false,
    status: 'not_started',
  };
}

// ------------------------------------------------------------------------------
// Main Exported Service
// ------------------------------------------------------------------------------
export const adaptiveProfileService = {
  /**
   * Generates the pathway-specific AdaptiveHealthProfile from active health records.
   */
  generateAdaptiveProfile(
    pathway: HealthPathway,
    userProfile: UserProfile,
    cycleRecords: CycleRecord[] = [],
    symptomRecords: SymptomRecord[] = [],
    reports: MedicalReport[] = []
  ): AdaptiveHealthProfile {
    if (pathway === 'female') {
      return buildFemaleAdaptiveProfile(userProfile, cycleRecords, symptomRecords, reports);
    }
    if (pathway === 'male') {
      return buildMaleAdaptiveProfile(userProfile, symptomRecords, reports);
    }
    return buildGeneralAdaptiveProfile(userProfile, symptomRecords, reports);
  },

  getInitialADAMQuestions,
};
