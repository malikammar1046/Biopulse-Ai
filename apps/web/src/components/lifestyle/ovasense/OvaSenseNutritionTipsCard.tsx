import React from 'react';
import { Lightbulb, Check, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OvaSenseNutritionTipsCardProps {
  customTips?: string[];
  userAllergens?: string[];
}

export const OvaSenseNutritionTipsCard: React.FC<OvaSenseNutritionTipsCardProps> = ({
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
    t('ovasense.tips.tip1', 'Choose whole grains over refined grains'),
    t('ovasense.tips.tip2', 'Add more colorful vegetables to your plate'),
    hasNutOrSeedAllergy
      ? isUrdu
        ? 'زیتون کے تیل اور ایوکاڈو جیسی الرجی سے پاک مفید چکنائی استعمال کریں'
        : 'Include healthy fats like extra virgin olive oil and avocado (nut-free)'
      : t('ovasense.tips.tip3', 'Include healthy fats like nuts, seeds and olive oil'),
    t('ovasense.tips.tip4', 'Avoid sugary drinks and processed snacks'),
  ];

  const tipsToDisplay = customTips && customTips.length > 0 ? customTips.slice(0, 4) : defaultTips;

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-[#FCE7F0] p-5 sm:p-6 shadow-sm space-y-4 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {t('ovasense.tips.title', 'Nutrition Tips')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
            {t('ovasense.tips.subtitle', 'Quick tips to make your meals work better for you.')}
          </p>
        </div>
      </div>

      {/* 4 Checkmark Tips */}
      <div className="space-y-2.5 pt-1">
        {tipsToDisplay.map((tip, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
            <div className="w-4 h-4 rounded-full bg-[#0E9EAA] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="leading-snug">{tip}</span>
          </div>
        ))}
      </div>

      {/* Footer Pill Banner */}
      <div className="rounded-2xl bg-[#FFF0F5] border border-pink-100/90 p-2.5 sm:p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-pink-200/80 text-[#BE185D] flex items-center justify-center shrink-0">
            <Apple className="w-3 h-3 text-[#BE185D]" />
          </div>
          <span className="text-xs font-semibold text-[#B81D5B]">
            {t('ovasense.tips.tagline', 'Good food fuels your goals. ♡')}
          </span>
        </div>

        {/* Decorative mini botanical leaf branch SVG */}
        <svg
          className="w-5 h-5 text-teal-500/70 shrink-0"
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
