import React from 'react';
import { BarChart01, HelpCircle } from '@untitledui/icons';
import { MaleCard } from './MaleDesignPrimitives';

interface ExplanationFactor {
  feature?: string;
  name?: string;
  contribution?: number;
  direction?: string;
  display_name?: string;
  description?: string;
  impact?: string;
  patient_summary?: string;
  patient_friendly_summary?: string;
}

interface MaleTopFactorsProps {
  explanations?: (ExplanationFactor | string)[];
  onViewExplanation?: () => void;
}

// Clean clinical translation map for Male Hypogonadism features
const MALE_FACTOR_TRANSLATIONS: Record<string, { label: string; desc: string }> = {
  low_interest: {
    label: 'Reduced Libido & Sex Drive',
    desc: 'Subjective decrease in sexual interest strongly corresponds with androgen activity.',
  },
  libido: {
    label: 'Reduced Libido & Sex Drive',
    desc: 'Subjective decrease in sexual interest strongly corresponds with androgen activity.',
  },
  low_energy: {
    label: 'Low Energy & Daytime Stamina',
    desc: 'Fatigue and reduced physical stamina are core neurobehavioral signs of androgen deficiency.',
  },
  fatigue: {
    label: 'Low Energy & Daytime Stamina',
    desc: 'Fatigue and reduced physical stamina are core neurobehavioral signs of androgen deficiency.',
  },
  sleep_trouble: {
    label: 'Sleep Disruption & Evening Fatigue',
    desc: 'Circadian rhythm fragmentation and falling asleep unusually early after dinner.',
  },
  sleep_quality: {
    label: 'Sleep Disruption & Evening Fatigue',
    desc: 'Circadian rhythm fragmentation and falling asleep unusually early after dinner.',
  },
  low_mood: {
    label: 'Mood Shifts & Lower Motivation',
    desc: 'Irritability, low motivation, and affective dips associated with endocrine variation.',
  },
  mood: {
    label: 'Mood Shifts & Lower Motivation',
    desc: 'Irritability, low motivation, and affective dips associated with endocrine variation.',
  },
  bmi: {
    label: 'Body Mass Index (BMI)',
    desc: 'Body composition and adipose tissue conversion of androgens to estrogens via aromatase.',
  },
  weight_kg: {
    label: 'Body Weight & Composition',
    desc: 'Overall weight distribution and metabolic demands influencing circulating hormones.',
  },
  waist_cm: {
    label: 'Waist Circumference',
    desc: 'Central visceral adiposity is a recognized marker of metabolic and endocrine health.',
  },
  age: {
    label: 'Age',
    desc: 'Gradual epidemiological progression of late-onset hypogonadism across decades.',
  },
  high_blood_pressure: {
    label: 'Blood Pressure Baseline',
    desc: 'Cardiovascular and endothelial status linked to systemic metabolic regulation.',
  },
  diabetes: {
    label: 'Metabolic & Insulin History',
    desc: 'Insulin resistance is clinically correlated with altered sex hormone binding and synthesis.',
  },
  total_testosterone: {
    label: 'Morning Total Testosterone',
    desc: 'Primary circulating androgen measured via morning fasting serum draw.',
  },
  shbg: {
    label: 'Sex Hormone-Binding Globulin (SHBG)',
    desc: 'Carrier protein determining bioavailable and free testosterone fractions.',
  },
  lh: {
    label: 'Luteinizing Hormone (LH)',
    desc: 'Pituitary signaling gonadotropin stimulating testicular Leydig cells.',
  },
  fsh: {
    label: 'Follicle-Stimulating Hormone (FSH)',
    desc: 'Pituitary gonadotropin reflecting hypothalamic-pituitary-gonadal axis integrity.',
  },
  estradiol: {
    label: 'Serum Estradiol',
    desc: 'Estrogen fraction modulating hypothalamic feedback and bone-metabolic balance.',
  },
  albumin: {
    label: 'Serum Albumin',
    desc: 'Non-specific androgen carrier protein affecting bioavailable hormone fractions.',
  },
  glucose: {
    label: 'Fasting Blood Glucose',
    desc: 'Circulating glycemic marker reflecting baseline metabolic efficiency.',
  },
  hba1c: {
    label: 'Glycated Hemoglobin (HbA1c)',
    desc: 'Medium-term glycemic regulation associated with secondary endocrine variations.',
  },
};

export const MaleTopFactors: React.FC<MaleTopFactorsProps> = ({
  explanations = [],
  onViewExplanation,
}) => {
  // Normalize explanations into max 3-4 plain-English patient-safe factors
  const factors = React.useMemo(() => {
    const list: { label: string; desc: string; impact?: string }[] = [];

    for (const exp of explanations) {
      if (list.length >= 3) break;

      let key = '';
      let impactText: string | undefined = undefined;

      if (typeof exp === 'string') {
        key = exp.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      } else if (exp && typeof exp === 'object') {
        key = (exp.feature || exp.name || exp.display_name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');

        if (exp.impact) {
          const imp = String(exp.impact).toLowerCase();
          impactText = imp.includes('high') || imp.includes('strong')
            ? 'Strong'
            : imp.includes('mod')
            ? 'Moderate'
            : 'Mild';
        } else if (exp.direction) {
          const dir = String(exp.direction).toLowerCase();
          impactText = dir.includes('increase') || dir.includes('risk')
            ? 'Higher Influence'
            : dir.includes('decrease') || dir.includes('protect')
            ? 'Lower Influence'
            : undefined;
        }
      }

      // Check translation map
      const matched = Object.entries(MALE_FACTOR_TRANSLATIONS).find(([k]) => key.includes(k) || k.includes(key));
      if (matched) {
        if (!list.some((item) => item.label === matched[1].label)) {
          list.push({
            label: matched[1].label,
            desc: matched[1].desc,
            impact: impactText,
          });
        }
      } else if (typeof exp === 'object') {
        const customLabel = exp.display_name || exp.name || exp.feature;
        const customDesc = exp.patient_friendly_summary || exp.patient_summary || exp.description;
        if (customLabel) {
          list.push({
            label: customLabel,
            desc: customDesc || 'Contributing clinical or demographic metric in screening model.',
            impact: impactText,
          });
        }
      }
    }

    // Default gentle factors if list is empty or insufficient data
    if (list.length === 0) {
      return [
        { ...MALE_FACTOR_TRANSLATIONS.low_interest, impact: 'Primary' },
        { ...MALE_FACTOR_TRANSLATIONS.low_energy, impact: 'Strong' },
        { ...MALE_FACTOR_TRANSLATIONS.bmi, impact: 'Moderate' },
      ];
    }
    return list;
  }, [explanations]);

  return (
    <MaleCard className="p-5 sm:p-6 select-none">
      <div className="flex items-center justify-between border-b border-[#EAECF0] pb-4">
        <div className="flex items-center gap-2">
          <BarChart01 className="w-5 h-5 text-[#0868B9] shrink-0" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-semibold text-[#111318]">
            Key Contributing Factors
          </h3>
        </div>

        {onViewExplanation && (
          <button
            type="button"
            onClick={onViewExplanation}
            className="text-xs font-semibold text-[#0868B9] hover:text-[#07589D] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Why these factors?</span>
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="pt-4 sm:pt-4.5 space-y-3 sm:space-y-3.5">
        {factors.map((factor, idx) => (
          <div
            key={idx}
            className="p-3.5 sm:p-4 rounded-xl bg-[#FAFAFC] border border-[#EAECF0] flex items-start gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-[#DDEFFD] text-[#0868B9] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-[#111318]">
                  {factor.label}
                </h4>
                {factor.impact && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#DDEFFD] text-[#0868B9]">
                    {factor.impact}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#667085] leading-relaxed">
                {factor.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MaleCard>
  );
};

export default MaleTopFactors;
