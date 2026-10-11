import React from 'react';
import { Apple, Dumbbell, Moon, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AndroSenseHeroProps {
  onPillarClick?: (pillar: 'nutrition' | 'fitness' | 'sleep' | 'stress') => void;
  riskCategory?: string;
  hasHypogonadismPattern?: boolean;
  userConditions?: string[];
}

export const AndroSenseHero: React.FC<AndroSenseHeroProps> = ({
  onPillarClick,
  riskCategory: _riskCategory,
  hasHypogonadismPattern: _hasHypogonadismPattern = true,
  userConditions = [],
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const isConfirmedHypogonadism = React.useMemo(() => {
    return userConditions.some((c) =>
      c.toLowerCase().includes('hypogonad') || c.toLowerCase().includes('testosterone deficiency')
    );
  }, [userConditions]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F0F9FF] via-[#E0F2FE] to-[#DDEFFD] border border-[#BAE6FD] shadow-xs p-6 sm:p-7 md:p-8 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Decorative sky-blue and teal wellness auras */}
      <div className="absolute top-0 right-1/3 w-64 h-64 bg-sky-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-48 h-48 bg-teal-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left / Start: Typography & Mission */}
        <div className={`flex-1 space-y-2.5 max-w-md ${isUrdu ? 'text-right' : 'text-left'}`}>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0868B9] tracking-tight">
              {t('androsense.heroTitle', 'Lifestyle')}
            </h1>
            <p className="text-base sm:text-lg font-bold text-slate-800">
              {t('androsense.heroSubtitle', 'Small Habits. Stronger Health.')}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isConfirmedHypogonadism
              ? t(
                  'androsense.heroDescription',
                  'Your daily choices support metabolic balance, sustained vitality, and endocrine health. Explore evidence-guided recommendations for nutrition, progressive movement, circadian sleep, and stress management.'
                )
              : t(
                  'androsense.heroDescriptionGeneral',
                  'Your daily choices help optimize metabolic energy, cardiovascular health, and physical resilience. Explore evidence-guided recommendations tailored to your profile.'
                )}
          </p>

          {/* Script / Italicized bottom tagline */}
          <div className="pt-2">
            <p
              className={`text-xs sm:text-sm italic font-serif text-[#0868B9] font-medium tracking-wide flex items-center gap-1.5 flex-wrap ${
                isUrdu ? 'flex-row-reverse justify-end' : ''
              }`}
            >
              <span>{isUrdu ? 'بہتر عادات' : 'Better habits'}</span>
              <span className="text-[#0284C7]">{isUrdu ? '←' : '→'}</span>
              <span>{isUrdu ? 'زیادہ توانائی' : 'Greater vitality'}</span>
              <span className="text-[#0284C7]">{isUrdu ? '←' : '→'}</span>
              <span>{isUrdu ? 'مضبوط صحت' : 'A stronger you'}</span>
            </p>
          </div>
        </div>

        {/* Center: Male Outdoor Wellness & Stretching Illustration */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-sky-50/50 shadow-sm border border-sky-200/80 group">
            <img
              src="/images/hero/androsense-lifestyle.jpg"
              alt="Adult man practicing healthy outdoor stretch in sunny park"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              loading="eager"
            />
            {/* Subtle bottom gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-sky-950/15 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right: 4 Vertically Arranged Colored Indicators */}
        <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
          {/* 1. Balanced Nutrition */}
          <button
            type="button"
            onClick={() => onPillarClick?.('nutrition')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-sky-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0868B9] flex items-center justify-center shrink-0">
              <Apple className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('androsense.pillars.diet', 'Balanced Nutrition')}
            </span>
          </button>

          {/* 2. Physical Activity */}
          <button
            type="button"
            onClick={() => onPillarClick?.('fitness')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-sky-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0E9EAA] flex items-center justify-center shrink-0">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('androsense.pillars.exercise', 'Physical Activity')}
            </span>
          </button>

          {/* 3. Restorative Sleep */}
          <button
            type="button"
            onClick={() => onPillarClick?.('sleep')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-sky-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('androsense.pillars.sleep', 'Restorative Sleep')}
            </span>
          </button>

          {/* 4. Stress Management */}
          <button
            type="button"
            onClick={() => onPillarClick?.('stress')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-sky-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('androsense.pillars.stress', 'Stress Management')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
