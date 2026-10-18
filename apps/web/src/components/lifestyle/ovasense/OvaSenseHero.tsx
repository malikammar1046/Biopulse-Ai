import React from 'react';
import { Apple, Dumbbell, Moon, Flower2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getOvaSenseDiagnosticFraming } from '../../../utils/allergySafetyRules';

interface OvaSenseHeroProps {
  onPillarClick?: (pillar: 'nutrition' | 'fitness' | 'sleep' | 'stress') => void;
  riskCategory?: string;
  hasPCOSPattern?: boolean;
  userConditions?: string[];
}

export const OvaSenseHero: React.FC<OvaSenseHeroProps> = ({
  onPillarClick,
  riskCategory: _riskCategory,
  hasPCOSPattern: _hasPCOSPattern = true,
  userConditions = [],
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const diagnosticFraming = React.useMemo(() => {
    return getOvaSenseDiagnosticFraming(userConditions);
  }, [userConditions]);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF0F5] via-[#FFF3F6] to-[#FFE8F0] border border-[#FCDCE8] shadow-xs p-6 sm:p-7 md:p-8 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Decorative background botanical accents */}
      <div className="absolute top-0 right-1/3 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-48 h-48 bg-teal-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left / Start: Typography & Mission */}
        <div className={`flex-1 space-y-2.5 max-w-md ${isUrdu ? 'text-right' : 'text-left'}`}>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#B81D5B] tracking-tight">
              {t('ovasense.heroTitle', 'Lifestyle')}
            </h1>
            <p className="text-base sm:text-lg font-bold text-slate-800">
              {isUrdu ? 'چھوٹی عادات۔ بڑی تبدیلیاں۔' : diagnosticFraming.heroHeadline}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isUrdu
              ? diagnosticFraming.isConfirmedPcos
                ? t(
                    'ovasense.heroDescription',
                    'آپ کے روزمرہ فیصلے پی سی او ایس کو سنبھالنے، ہارمونز کے توازن اور مجموعی صحت کی بہتری میں مددگار ثابت ہو سکتے ہیں۔ خوراک، ورزش اور نیند کے لیے مخصوص تجاویز دریافت کریں۔'
                  )
                : 'آپ کے روزمرہ فیصلے میٹابولک توازن اور عمومی توانائی کو بہتر بنانے میں مددگار ثابت ہو سکتے ہیں۔ خوراک، ورزش اور نیند کے لیے مخصوص تجاویز دریافت کریں۔'
              : diagnosticFraming.isConfirmedPcos
              ? t(
                  'ovasense.heroDescription',
                  'Your daily choices can help manage PCOS, balance hormones and improve your overall well-being. Explore personalized recommendations for diet, exercise, sleep and more.'
                )
              : t(
                  'ovasense.heroDescriptionGeneral',
                  'Your daily choices can help support metabolic health, balance energy and improve your overall well-being. Explore personalized recommendations for diet, exercise, sleep and more.'
                )}
          </p>

          {/* Script / Italicized bottom tagline */}
          <div className="pt-2">
            <p
              className={`text-xs sm:text-sm italic font-serif text-[#C2185B] font-medium tracking-wide flex items-center gap-1.5 flex-wrap ${
                isUrdu ? 'flex-row-reverse justify-end' : ''
              }`}
            >
              <span>{isUrdu ? 'بہتر عادات' : 'Better habits'}</span>
              <span className="text-[#E11D48]">{isUrdu ? '←' : '→'}</span>
              <span>{isUrdu ? 'متوازن ہارمونز' : 'Better hormones'}</span>
              <span className="text-[#E11D48]">{isUrdu ? '←' : '→'}</span>
              <span>{isUrdu ? 'صحت مند زندگی ♡' : 'A healthier you ♡'}</span>
            </p>
          </div>
        </div>

        {/* Center: Serene Meditation & Botanical Illustration */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-pink-50/50 shadow-sm border border-pink-100/70 group">
            <img
              src="/images/hero/ovasense-meditation.jpg"
              alt="Woman practicing mindful yoga and meditation with lush botanicals"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              loading="eager"
            />
            {/* Subtle bottom gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right: 4 Vertically Arranged Colored Indicators */}
        <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
          {/* 1. Balanced Diet */}
          <button
            type="button"
            onClick={() => onPillarClick?.('nutrition')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-pink-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Apple className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('ovasense.pillars.diet', 'Balanced Diet')}
            </span>
          </button>

          {/* 2. Regular Exercise */}
          <button
            type="button"
            onClick={() => onPillarClick?.('fitness')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-pink-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0E9EAA] flex items-center justify-center shrink-0">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('ovasense.pillars.exercise', 'Regular Exercise')}
            </span>
          </button>

          {/* 3. Quality Sleep */}
          <button
            type="button"
            onClick={() => onPillarClick?.('sleep')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-pink-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Moon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('ovasense.pillars.sleep', 'Quality Sleep')}
            </span>
          </button>

          {/* 4. Stress Management */}
          <button
            type="button"
            onClick={() => onPillarClick?.('stress')}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-pink-100 shadow-2xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isUrdu ? 'text-right flex-row-reverse' : 'text-left'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Flower2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {t('ovasense.pillars.stress', 'Stress Management')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
