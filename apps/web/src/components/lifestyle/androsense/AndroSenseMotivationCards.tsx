import React from 'react';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AndroSenseMotivationCardsProps {
  onExploreMealPlans?: () => void;
  hasTrackedActions?: boolean;
}

export const AndroSenseMotivationCards: React.FC<AndroSenseMotivationCardsProps> = ({
  onExploreMealPlans,
  hasTrackedActions = false,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`space-y-4 ${isUrdu ? 'text-right' : 'text-left'}`}
    >
      {/* ── 1. Positive Encouragement Card (Sky Blue / Teal) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#DDEFFD] border border-[#BAE6FD] p-5 sm:p-6 shadow-sm">
        {/* Decorative background geometric/pulse wave */}
        <div className="absolute right-0 bottom-0 top-0 w-28 opacity-25 pointer-events-none flex items-center justify-end pr-2">
          <svg
            className="w-24 h-24 text-sky-600"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 50 Q 30 20 50 50 T 90 50" />
            <path d="M20 70 Q 40 40 60 70 T 100 70" />
          </svg>
        </div>

        <div className="relative z-10 flex items-start gap-3.5 max-w-[85%]">
          <div className="w-9 h-9 rounded-2xl bg-sky-100 text-[#0868B9] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {hasTrackedActions
                ? t('androsense.cards.doingGreat', 'Building Daily Momentum!')
                : t('androsense.cards.doingGreat', 'Building Daily Momentum!')}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'androsense.cards.doingGreatDesc',
                'Consistent daily habits compound into lasting vitality and resilience.'
              )}
            </p>
            <span className="text-sky-600 font-semibold text-xs block pt-0.5">💪</span>
          </div>
        </div>
      </div>

      {/* ── 2. Personalized Meal Plan Promotion Card (Soft Blue / White) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F8FAFC] via-[#F0F7FF] to-[#E0F2FE] border border-sky-200/80 p-5 sm:p-6 shadow-sm">
        {/* Soft decorative background pulse accents */}
        <div className="absolute -right-4 -bottom-4 w-28 h-28 opacity-20 pointer-events-none">
          <svg
            className="w-full h-full text-blue-500"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M30 90 Q 60 50 90 20" />
            <path d="M50 70 Q 30 60 35 45 Q 55 55 55 65" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          {/* Ceramic Salad Bowl Image */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-sky-100 bg-white p-1">
            <img
              src="/images/hero/meal-bowl.jpg"
              alt="Personalized nutritious meal plan bowl"
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
            />
          </div>

          {/* Body & CTA */}
          <div className="flex-1 space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {t('androsense.cards.needMealPlan', 'Need a personalized meal plan?')}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'androsense.cards.needMealPlanDesc',
                'Generate a tailored 3-day nutrition plan aligned with your caloric targets and preferences.'
              )}
            </p>

            <button
              type="button"
              onClick={onExploreMealPlans}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0868B9] hover:bg-[#07589D] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer mt-2"
            >
              <span>
                {isUrdu
                  ? '۳ روزہ پلان دیکھیں ←'
                  : t('androsense.cards.exploreMealPlans', 'Explore 3-Day Plans →')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
