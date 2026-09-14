import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowRight, Minus, HelpCircle } from 'lucide-react';
import type { HealthPathway } from '../../types/onboarding';
import type { ShapExplanation } from '../../types/intelligence';
import { ROUTES } from '../../constants/routes';

interface TopFactorsCardProps {
  pathway: HealthPathway;
  explanations?: (ShapExplanation | Record<string, any>)[];
  onViewExplanation?: () => void;
}

// ---------------------------------------------------------------------------
// Patient-Friendly Feature Name Mapping
// Maps both technical ML/dataset strings and snake_case keys to clear clinical terms
// ---------------------------------------------------------------------------
const FEATURE_NAME_MAP: Record<string, string> = {
  // Female PCOS Technical / Dataset Keys
  'hair growth(y/n)': 'Hair growth',
  'hair growth': 'Hair growth',
  'hirsutism': 'Hair growth',
  'excess hair growth (hirsutism)': 'Hair growth',
  'cycle(r/i)': 'Cycle regularity',
  'cycle_regularity': 'Cycle regularity',
  'menstrual regularity': 'Cycle regularity',
  'cycle length(days)': 'Cycle length',
  'cycle_length_raw': 'Cycle length',
  'cycle length': 'Cycle length',
  'reg.exercise(y/n)': 'Regular exercise',
  'regular_exercise': 'Regular exercise',
  'regular physical exercise': 'Regular exercise',
  'skin darkening (y/n)': 'Skin darkening',
  'skin_darkening': 'Skin darkening',
  'skin darkening (acanthosis nigricans)': 'Skin darkening',
  'weight gain(y/n)': 'Weight changes',
  'weight_gain': 'Weight changes',
  'recent weight gain': 'Weight changes',
  'hair loss(y/n)': 'Hair thinning',
  'hair_loss': 'Hair thinning',
  'hair thinning / alopecia': 'Hair thinning',
  'pimples(y/n)': 'Acne & breakouts',
  'pimples_acne': 'Acne & breakouts',
  'acne & skin breakouts': 'Acne & breakouts',
  'fast food (y/n)': 'Dietary patterns',
  'fast_food': 'Dietary patterns',
  'fast food consumption': 'Dietary patterns',
  'bmi': 'Body Mass Index (BMI)',
  'body mass index (bmi)': 'Body Mass Index (BMI)',
  'age': 'Age profile',
  'age (yrs)': 'Age profile',
  'weight (kg)': 'Body weight',
  'weight_kg': 'Body weight',
  'height(cm)': 'Height',
  'height_cm': 'Height',
  'hip(inch)': 'Hip circumference',
  'hip_inch': 'Hip circumference',
  'waist(inch)': 'Waist circumference',
  'waist_inch': 'Waist circumference',
  'waist:hip ratio': 'Waist-to-hip ratio',
  'waist_hip_ratio': 'Waist-to-hip ratio',
  'amh(ng/ml)': 'Anti-Müllerian Hormone (AMH)',
  'amh': 'Anti-Müllerian Hormone (AMH)',
  'lh(miu/ml)': 'Luteinizing Hormone (LH)',
  'lh': 'Luteinizing Hormone (LH)',
  'fsh(miu/ml)': 'Follicle-Stimulating Hormone (FSH)',
  'fsh': 'Follicle-Stimulating Hormone (FSH)',
  'fsh/lh': 'FSH:LH ratio',
  'fsh_lh_ratio': 'FSH:LH ratio',
  'tsh (miu/l)': 'Thyroid Stimulating Hormone (TSH)',
  'tsh': 'Thyroid Stimulating Hormone (TSH)',
  'prl(ng/ml)': 'Serum Prolactin',
  'prolactin': 'Serum Prolactin',
  'vit d3 (ng/ml)': 'Vitamin D3',
  'vitamin_d3': 'Vitamin D3',
  'prg(ng/ml)': 'Progesterone',
  'progesterone': 'Progesterone',
  'rbs(mg/dl)': 'Blood glucose (RBS)',
  'rbs': 'Blood glucose (RBS)',
  'bp _systolic (mmhg)': 'Systolic blood pressure',
  'bp_systolic': 'Systolic blood pressure',
  'bp _diastolic (mmhg)': 'Diastolic blood pressure',
  'bp_diastolic': 'Diastolic blood pressure',
  'follicle no. (l)': 'Left follicle count',
  'follicle no. (r)': 'Right follicle count',
  'avg. fsize (l) (mm)': 'Left follicle size',
  'avg. fsize (r) (mm)': 'Right follicle size',
  'endometrium (mm)': 'Endometrial thickness',

  // Male Hypogonadism Technical / Dataset Keys
  'low_energy': 'Energy & stamina level',
  'energy_fatigue': 'Energy & stamina level',
  'low energy / fatigue': 'Energy & stamina level',
  'sleep_trouble': 'Sleep quality & recovery',
  'sleep quality / post-dinner sleepiness': 'Sleep quality & recovery',
  'low_mood': 'Mood & vitality pattern',
  'mood dips / grumpiness': 'Mood & vitality pattern',
  'low_interest': 'Physical drive & vigor',
  'reduced libido / sex drive': 'Physical drive & vigor',
  'waist_cm': 'Waist circumference',
  'waist circumference (cm)': 'Waist circumference',
  'high_blood_pressure': 'Blood pressure profile',
  'hypertension history': 'Blood pressure profile',
  'diabetes': 'Metabolic health history',
  'diabetes / prediabetes history': 'Metabolic health history',
  'shbg_nmol_l': 'Sex Hormone-Binding Globulin (SHBG)',
  'shbg (sex hormone-binding globulin)': 'Sex Hormone-Binding Globulin (SHBG)',
  'estradiol_pg_ml': 'Estradiol (E2)',
  'albumin_g_dl': 'Serum Albumin',
  'hba1c_pct': 'HbA1c (Glycated Hemoglobin)',
  'glucose_mg_dl': 'Fasting / Random Glucose',
  'hemoglobin_g_dl': 'Hemoglobin (Hb)',
  'hematocrit_pct': 'Hematocrit (HCT)',
  'rbc_count': 'Total RBC Count',
  'alt_u_l': 'ALT Liver Enzyme',
  'ast_u_l': 'AST Liver Enzyme',
  'total_bilirubin_mg_dl': 'Total Bilirubin',
  'creatinine_mg_dl': 'Serum Creatinine',
  'bun_mg_dl': 'Blood Urea Nitrogen (BUN)',
  'uric_acid_mg_dl': 'Serum Uric Acid',
  'hdl_mg_dl': 'HDL Cholesterol',
};

/**
 * Resolves a patient-friendly label from technical/raw feature representations.
 */
function resolvePatientFriendlyName(factor: Record<string, any>): string {
  const rawCandidate = factor.feature || factor.feature_key || '';
  const humanCandidate = factor.human_label || factor.feature_name || factor.label || '';

  // 1. Match against known mapping using lowercase key
  const normRaw = String(rawCandidate).trim().toLowerCase();
  if (normRaw && FEATURE_NAME_MAP[normRaw]) {
    return FEATURE_NAME_MAP[normRaw];
  }

  const normHuman = String(humanCandidate).trim().toLowerCase();
  if (normHuman && FEATURE_NAME_MAP[normHuman]) {
    return FEATURE_NAME_MAP[normHuman];
  }

  // 2. If already human-readable and doesn't have dataset syntax like (Y/N), use it
  if (humanCandidate && !humanCandidate.includes('(Y/N)') && !humanCandidate.includes('(R/I)')) {
    return humanCandidate;
  }

  // 3. Clean up technical syntax fallback
  const fallback = humanCandidate || rawCandidate || 'Health factor';
  const cleaned = fallback
    .replace(/\s*\([yY]\/[nN]\)/g, '')
    .replace(/\s*\([rR]\/[iI]\)/g, '')
    .replace(/_/g, ' ')
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

type FactorDirection = 'increases_risk' | 'decreases_risk' | 'neutral';

function resolveDirection(factor: Record<string, any>): FactorDirection {
  const dir = String(factor.direction || '').toLowerCase();
  if (dir === 'increases_risk' || dir === 'positive' || dir === 'increase') {
    return 'increases_risk';
  }
  if (dir === 'decreases_risk' || dir === 'negative' || dir === 'decrease') {
    return 'decreases_risk';
  }
  if (dir === 'neutral') {
    return 'neutral';
  }
  // If magnitude is strictly 0
  if (factor.magnitude === 0 || factor.impact_score === 0) {
    return 'neutral';
  }
  return 'neutral';
}

export const TopFactorsCard: React.FC<TopFactorsCardProps> = ({
  pathway,
  explanations = [],
  onViewExplanation,
}) => {
  // If no real explanations exist from the assessment, do NOT render
  if (!explanations || explanations.length === 0) {
    return null;
  }

  // Filter out completely neutral items if there are enough non-neutral items to show
  const nonNeutral = explanations.filter((f) => resolveDirection(f) !== 'neutral');
  const candidates = nonNeutral.length >= 2 ? nonNeutral : explanations;

  // Display top 3 factors by default (max 4 per spec)
  const topFactors = candidates.slice(0, 3);

  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between text-left space-y-4 select-none">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
              <HelpCircle className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
              What influenced your result
            </h3>
          </div>

          <span className="text-[11px] font-medium text-[#64748B]">
            Top factors
          </span>
        </div>

        {/* Factors List: Factor name + Direction */}
        <div className="space-y-2">
          {topFactors.map((factor, index) => {
            const displayName = resolvePatientFriendlyName(factor);
            const direction = resolveDirection(factor);

            return (
              <div
                key={index}
                className="px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 transition-colors hover:bg-slate-50/80"
              >
                {/* Factor Name */}
                <span className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate">
                  {displayName}
                </span>

                {/* Direction Badge */}
                {direction === 'increases_risk' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 shrink-0">
                    <ArrowUp className="w-3 h-3 text-rose-600" />
                    <span>Increases risk</span>
                  </span>
                )}

                {direction === 'decreases_risk' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                    <ArrowDown className="w-3 h-3 text-emerald-600" />
                    <span>Decreases risk</span>
                  </span>
                )}

                {direction === 'neutral' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    <Minus className="w-3 h-3 text-slate-500" />
                    <span>Neutral influence</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
        <span className="text-[11px] text-[#64748B]">
          {pathway === 'male'
            ? 'Evaluated from male health profile'
            : 'Evaluated from PCOS health profile'}
        </span>

        {onViewExplanation ? (
          <button
            type="button"
            onClick={onViewExplanation}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] transition-colors cursor-pointer"
          >
            <span>View full explanation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            to={ROUTES.APP.ASSESSMENT}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] transition-colors"
          >
            <span>View full explanation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default TopFactorsCard;

