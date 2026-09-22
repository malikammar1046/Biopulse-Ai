import React, { useMemo } from 'react';
import { BarChart01, HelpCircle } from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';

interface ExplanationFactor {
  feature?: string;
  feature_key?: string;
  name?: string;
  human_label?: string;
  contribution?: number;
  direction?: string;
  display_name?: string;
  description?: string;
}

interface TopFactorsCardProps {
  pathway?: HealthPathway;
  explanations?: (ExplanationFactor | Record<string, any> | string)[];
  onViewExplanation?: () => void;
}

// Clinically validated patient-friendly translation map for Male Hypogonadism features
const MALE_FACTOR_TRANSLATIONS: Record<string, { label: string; desc: string }> = {
  energy_fatigue: {
    label: 'Energy & Stamina Levels',
    desc: 'Reported changes in day-to-day energy, fatigue, and physical vitality.',
  },
  low_energy: {
    label: 'Energy & Stamina Levels',
    desc: 'Reported changes in day-to-day energy, fatigue, and physical vitality.',
  },
  sleep_trouble: {
    label: 'Sleep Quality & Recovery',
    desc: 'Patterns of daytime sleepiness, post-meal fatigue, or sleep disruptions.',
  },
  low_mood: {
    label: 'Mood & Vitality Pattern',
    desc: 'Shifts in mood, drive, irritability, or general sense of well-being.',
  },
  low_interest: {
    label: 'Physical Drive & Libido',
    desc: 'Reported changes in physical vigor and sexual health indicators.',
  },
  waist_cm: {
    label: 'Waist Circumference',
    desc: 'Central adiposity distribution linked to metabolic hormone clearance.',
  },
  bmi: {
    label: 'Body Mass Index (BMI)',
    desc: 'Overall body composition and metabolic load metrics.',
  },
  age: {
    label: 'Age Profile',
    desc: 'Age-related physiological reference trajectories for androgen production.',
  },
  total_testosterone: {
    label: 'Total Serum Testosterone',
    desc: 'Primary circulating androgen measured via morning laboratory sample.',
  },
  testosterone: {
    label: 'Total Serum Testosterone',
    desc: 'Primary circulating androgen measured via morning laboratory sample.',
  },
  shbg: {
    label: 'Sex Hormone-Binding Globulin (SHBG)',
    desc: 'Carrier protein regulating circulating free and bioavailable testosterone.',
  },
  shbg_nmol_l: {
    label: 'Sex Hormone-Binding Globulin (SHBG)',
    desc: 'Carrier protein regulating circulating free and bioavailable testosterone.',
  },
  lh: {
    label: 'Luteinizing Hormone (LH)',
    desc: 'Pituitary signaling hormone regulating testicular testosterone synthesis.',
  },
  lh_miu_ml: {
    label: 'Luteinizing Hormone (LH)',
    desc: 'Pituitary signaling hormone regulating testicular testosterone synthesis.',
  },
  fsh: {
    label: 'Pituitary Gonadotropin (FSH)',
    desc: 'Pituitary signaling hormone supporting reproductive and testicular function.',
  },
  fsh_miu_ml: {
    label: 'Pituitary Gonadotropin (FSH)',
    desc: 'Pituitary signaling hormone supporting reproductive and testicular function.',
  },
  glucose: {
    label: 'Fasting Glucose & HbA1c',
    desc: 'Glycemic regulation and metabolic insulin sensitivity indicators.',
  },
  hba1c_pct: {
    label: 'Fasting Glucose & HbA1c',
    desc: 'Glycemic regulation and metabolic insulin sensitivity indicators.',
  },
  diabetes: {
    label: 'Metabolic Health History',
    desc: 'Clinical history of insulin resistance or metabolic conditions.',
  },
  high_blood_pressure: {
    label: 'Blood Pressure Profile',
    desc: 'Vascular health indicators associated with endocrine function.',
  },
};

export const TopFactorsCard: React.FC<TopFactorsCardProps> = ({
  explanations = [],
  onViewExplanation,
}) => {
  // Normalize explanations into max 3 plain-English factors
  const factors = useMemo(() => {
    const list: { label: string; desc: string }[] = [];

    for (const exp of explanations) {
      if (list.length >= 3) break;

      let key = '';
      if (typeof exp === 'string') {
        key = exp.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      } else if (exp && typeof exp === 'object') {
        key = (exp.feature || exp.feature_key || exp.name || exp.display_name || '')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      }

      if (!key) continue;

      // Match against male translation map
      const matched = Object.entries(MALE_FACTOR_TRANSLATIONS).find(
        ([k]) => key === k || key.startsWith(k) || k.startsWith(key)
      );

      if (matched) {
        if (!list.some((item) => item.label === matched[1].label)) {
          const expAny = exp as any;
          list.push({
            label: matched[1].label,
            desc: (typeof exp === 'object' && expAny?.patient_summary) ? expAny.patient_summary : matched[1].desc,
          });
        }
      } else if (typeof exp === 'object') {
        const expAny = exp as any;
        if (expAny.human_label || expAny.display_name || expAny.feature_name) {
          list.push({
            label: expAny.human_label || expAny.display_name || expAny.feature_name || 'Clinical Metric',
            desc: expAny.patient_summary || expAny.description || 'Contributing clinical or metabolic factor.',
          });
        }
      }
    }

    // Do not invent fallback clinical factors - strictly return verified factors or empty list
    return list;
  }, [explanations]);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left transition-all duration-200 space-y-4 select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <BarChart01 className="w-5 h-5 text-medical-primary-hover shrink-0" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-semibold text-medical-text-primary">
            Key Contributing Factors
          </h3>
        </div>

        {onViewExplanation && (
          <button
            type="button"
            onClick={onViewExplanation}
            className="text-xs font-semibold text-medical-primary-hover hover:text-medical-primary-dark flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Why these factors?</span>
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Ranked Factor Rows or Empty State */}
      {factors.length === 0 ? (
        <div className="py-6 px-4 rounded-xl bg-medical-bg border border-dashed border-[#E2E8F0] text-center space-y-1">
          <p className="text-xs font-semibold text-medical-text-primary">No Factor Data Available</p>
          <p className="text-[11px] text-medical-text-muted leading-relaxed">
            Factor contributions will be calibrated once clinical screening responses are recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {factors.map((factor, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-medical-bg border border-[#E2E8F0] flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-medical-primary-muted text-medical-primary-hover flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-medical-text-primary">
                  {factor.label}
                </h4>
                <p className="text-[11px] sm:text-xs text-medical-text-muted leading-relaxed">
                  {factor.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopFactorsCard;
