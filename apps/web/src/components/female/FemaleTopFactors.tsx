import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { FemaleCard } from './FemaleDesignPrimitives';

interface ExplanationFactor {
  feature?: string;
  name?: string;
  contribution?: number;
  direction?: string;
  display_name?: string;
  description?: string;
}

interface FemaleTopFactorsProps {
  explanations?: (ExplanationFactor | string)[];
  onViewExplanation?: () => void;
}

// Clean clinical translation map for PCOS features
const FACTOR_TRANSLATIONS: Record<string, { label: string; desc: string }> = {
  cycle_length: {
    label: 'Menstrual Cycle Regularity',
    desc: 'Cycle duration and rhythm consistency strongly influence hormonal balance estimation.',
  },
  bmi: {
    label: 'Body Mass Index (BMI)',
    desc: 'Metabolic body composition and weight distribution metrics.',
  },
  waist_hip_ratio: {
    label: 'Waist-to-Hip Ratio',
    desc: 'Central adiposity distribution associated with insulin dynamics.',
  },
  weight_gain: {
    label: 'Weight Fluctuations',
    desc: 'Recent unprovoked weight shifts or difficulty losing weight.',
  },
  hair_growth: {
    label: 'Excessive Hair Growth',
    desc: 'Elevated androgenic pattern (facial or central hirsutism).',
  },
  skin_darkening: {
    label: 'Skin Texture & Pigmentation',
    desc: 'Acanthosis nigricans markers often linked to insulin sensitivity.',
  },
  hair_thinning: {
    label: 'Hair Density & Shedding',
    desc: 'Diffuse scalp thinning influenced by hormonal signaling.',
  },
  pimples_acne: {
    label: 'Persistent Adult Acne',
    desc: 'Sebaceous gland activity driven by circulating hormone ratios.',
  },
  lh_fsh_ratio: {
    label: 'LH to FSH Ratio',
    desc: 'Laboratory marker indicating pituitary-ovarian signaling balance.',
  },
  amh: {
    label: 'Anti-Müllerian Hormone (AMH)',
    desc: 'Ovarian reserve biomarker reflecting follicular density.',
  },
  fasting_insulin: {
    label: 'Fasting Insulin & Glucose',
    desc: 'Metabolic markers measuring glycemic response efficiency.',
  },
};

export const FemaleTopFactors: React.FC<FemaleTopFactorsProps> = ({
  explanations = [],
  onViewExplanation,
}) => {
  // Normalize explanations into max 3-4 plain-English factors
  const factors = React.useMemo(() => {
    const list: { label: string; desc: string }[] = [];

    for (const exp of explanations) {
      if (list.length >= 3) break;

      let key = '';
      if (typeof exp === 'string') {
        key = exp.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      } else if (exp && typeof exp === 'object') {
        key = (exp.feature || exp.name || exp.display_name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
      }

      // Check translation map or match common substrings
      let matched = Object.entries(FACTOR_TRANSLATIONS).find(([k]) => key.includes(k) || k.includes(key));
      if (matched) {
        if (!list.some((item) => item.label === matched![1].label)) {
          list.push(matched[1]);
        }
      } else if (typeof exp === 'object' && exp?.display_name) {
        list.push({
          label: exp.display_name,
          desc: exp.description || 'Contributing clinical or lifestyle metric.',
        });
      }
    }

    // Default gentle factors if list is empty or insufficient data
    if (list.length === 0) {
      return [
        FACTOR_TRANSLATIONS.cycle_length,
        FACTOR_TRANSLATIONS.hair_growth,
        FACTOR_TRANSLATIONS.bmi,
      ];
    }
    return list;
  }, [explanations]);

  return (
    <FemaleCard className="space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF5F9] border border-[#FBE7F0] flex items-center justify-center text-[#E84A8A]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-[#111318]">
            Key Contributing Factors
          </h3>
        </div>

        {onViewExplanation && (
          <button
            type="button"
            onClick={onViewExplanation}
            className="text-xs font-semibold text-[#E84A8A] hover:text-[#D93B7A] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Why these factors?</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {factors.map((factor, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-[#FAFAFC] border border-[#EAECF0] flex items-start gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-[#FBE7F0] text-[#A92D61] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-[#111318]">
                {factor.label}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#667085] leading-relaxed">
                {factor.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </FemaleCard>
  );
};
