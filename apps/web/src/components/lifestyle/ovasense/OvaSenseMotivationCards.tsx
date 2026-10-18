import React from 'react';
import { Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OvaSenseMotivationCardsProps {
  onExploreMealPlans?: () => void;
  hasTrackedActions?: boolean;
}

export const OvaSenseMotivationCards: React.FC<OvaSenseMotivationCardsProps> = ({
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
      {/* ── 1. Positive Encouragement Card (Mint / Teal) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ECFDF5] via-[#E8FAF5] to-[#DCF7ED] border border-[#A7F3D0] p-5 sm:p-6 shadow-sm">
        {/* Decorative background leaf branch SVG */}
        <div className="absolute right-0 bottom-0 top-0 w-28 opacity-30 pointer-events-none flex items-center justify-end pr-2">
          <svg
            className="w-24 h-24 text-teal-600"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 90 Q 50 50 80 10" />
            <path d="M40 70 Q 20 60 25 45 Q 45 55 45 65" />
            <path d="M55 50 Q 75 40 70 25 Q 50 35 55 45" />
            <path d="M68 30 Q 88 20 83 5 Q 63 15 68 25" />
          </svg>
        </div>

        <div className="relative z-10 flex items-start gap-3.5 max-w-[85%]">
          <div className="w-9 h-9 rounded-2xl bg-teal-100 text-[#0E9EAA] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
              {hasTrackedActions
                ? t('ovasense.cards.doingGreat', "You're doing great!")
                : t('ovasense.cards.doingGreat', "You're doing great!")}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'ovasense.cards.doingGreatDesc',
                'Healthy choices today build a stronger tomorrow.'
              )}
            </p>
            <span className="text-slate-400 text-xs block pt-0.5">♡</span>
          </div>
        </div>
      </div>

      {/* ── 2. Personalized Meal Plan Promotion Card (Blush Pink) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF0F5] via-[#FFF3F6] to-[#FFE4EE] border border-[#FCDCE8] p-5 sm:p-6 shadow-sm">
        {/* Soft decorative background leaf accents */}
        <div className="absolute -right-4 -bottom-4 w-28 h-28 opacity-25 pointer-events-none">
          <svg
            className="w-full h-full text-rose-500"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M30 90 Q 60 50 90 20" />
            <path d="M50 70 Q 30 60 35 45 Q 55 55 55 65" />
            <path d="M65 50 Q 85 40 80 25 Q 60 35 65 45" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          {/* Ceramic Salad Bowl Image */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-pink-100 bg-white p-1">
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
              {t('ovasense.cards.needMealPlan', 'Need a meal plan?')}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'ovasense.cards.needMealPlanDesc',
                'Get personalized nutrition plans based on your goals and preferences.'
              )}
            </p>

            <button
              type="button"
              onClick={onExploreMealPlans}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E11D48] hover:bg-[#BE185D] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer mt-2"
            >
              <span>
                {isUrdu
                  ? 'کھانوں کے منصوبے دیکھیں ←'
                  : t('ovasense.cards.exploreMealPlans', 'Explore Meal Plans →')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
