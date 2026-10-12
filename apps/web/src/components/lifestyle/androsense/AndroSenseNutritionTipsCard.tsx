import React from 'react';
import { Lightbulb, Check, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AndroSenseNutritionTipsCardProps {
  customTips?: string[];
  userAllergens?: string[];
}

export const AndroSenseNutritionTipsCard: React.FC<AndroSenseNutritionTipsCardProps> = ({
  customTips,
  userAllergens = [],
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Allergen detection for fat recommendation safety
  const normAllergens = userAllergens.map((a) => a.toLowerCase().trim());
  const hasNutOrSeedAllergy = normAllergens.some(
    (a) => a.includes('nut') || a.includes('peanut') || a.includes('seed') || a.includes('sesame')
  );

  const defaultTips = [
    t('androsense.tips.tip1', 'Prioritize quality protein with each meal to support muscle synthesis'),
    hasNutOrSeedAllergy
      ? isUrdu
        ? 'زیتون کا تیل اور دالوں جیسی الرجی سے پاک غذائیں استعمال کریں'
        : 'Include healthy fats like cold-pressed olive oil and avocado (nut-free)'
      : t('androsense.tips.tip2', 'Include zinc- and magnesium-rich foods like seeds, legumes, and greens'),
    t('androsense.tips.tip3', 'Choose whole unrefined grains over processed starches'),
    t('androsense.tips.tip4', 'Moderate liquid sugars and fried foods to preserve insulin sensitivity'),
  ];

  const tipsToDisplay = customTips && customTips.length > 0 ? customTips.slice(0, 4) : defaultTips;

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-4 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {t('androsense.tips.title', 'Nutrition Tips')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
            {t('androsense.tips.subtitle', 'Actionable guidelines to support sustained physical energy and recovery.')}
          </p>
        </div>
      </div>

      {/* 4 Checkmark Tips */}
      <div className="space-y-2.5 pt-1">
        {tipsToDisplay.map((tip, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
            <div className="w-4 h-4 rounded-full bg-[#0868B9] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="leading-snug">{tip}</span>
          </div>
        ))}
      </div>

      {/* Footer Pill Banner */}
      <div className="rounded-2xl bg-[#F0F7FF] border border-sky-200/90 p-2.5 sm:p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-sky-100 text-[#0868B9] flex items-center justify-center shrink-0">
            <Dumbbell className="w-3 h-3 text-[#0868B9]" />
          </div>
          <span className="text-xs font-semibold text-[#0868B9]">
            {t('androsense.tips.tagline', 'Good fuel drives strength and vitality. 💪')}
          </span>
        </div>

        {/* Decorative mini geometric/leaf accent */}
        <svg
          className="w-5 h-5 text-sky-400/80 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22v-8" />
          <path d="M12 14c-4-1-6-5-6-9 4 0 8 3 8 7" />
          <path d="M12 10c3-1 5-4 5-8-3 0-6 2-7 6" />
        </svg>
      </div>
    </div>
  );
};
