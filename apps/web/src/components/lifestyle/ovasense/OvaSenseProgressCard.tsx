import React, { useState } from 'react';
import { TrendingUp, ChevronRight, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CircularRingProps {
  label: string;
  value: number | null;
  color: string;
  trackColor?: string;
  explanation: string;
  isUrdu?: boolean;
}

const CircularProgressRing: React.FC<CircularRingProps> = ({
  label,
  value,
  color,
  trackColor = '#F1F5F9',
  explanation,
  isUrdu = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const displayPercent = value !== null ? Math.max(0, Math.min(100, Math.round(value))) : null;
  const strokeDashoffset =
    displayPercent !== null
      ? circumference - (displayPercent / 100) * circumference
      : circumference;

  const notTrackedText = isUrdu ? 'ابھی تک درج نہیں' : 'Not tracked yet';

  return (
    <div
      className="relative flex flex-col items-center text-center cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${
        displayPercent !== null ? `${displayPercent}%` : notTrackedText
      }. ${explanation}`}
    >
      {/* Label above the ring */}
      <span className="text-[11px] sm:text-xs font-semibold text-slate-600 mb-1.5 transition-colors group-hover:text-slate-900">
        {label}
      </span>

      {/* Circular SVG Ring */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-14 h-14 -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Filled Progress Arc */}
          {displayPercent !== null && displayPercent > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>

        {/* Value Text in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {displayPercent !== null ? (
            <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono">
              {displayPercent}%
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium font-sans">
              --
            </span>
          )}
        </div>
      </div>

      {/* Status sub-label underneath when untracked */}
      {displayPercent === null && (
        <span className="text-[9px] text-slate-400 mt-1 font-medium leading-none max-w-[65px] truncate">
          {notTrackedText}
        </span>
      )}

      {/* Accessible Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 z-30 w-48 p-2 rounded-xl bg-slate-900 text-white text-[11px] leading-tight shadow-lg animate-fadeIn pointer-events-none text-center">
          <p className="font-semibold text-slate-200">{label}</p>
          <p className="text-slate-300 mt-0.5">{explanation}</p>
          {displayPercent === null && (
            <p className="text-pink-300 font-medium mt-1">
              {isUrdu ? 'حساب کے لیے آج لاگ کریں' : 'Log today to calculate'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface OvaSenseProgressCardProps {
  nutritionPercent?: number | null;
  exercisePercent?: number | null;
  sleepPercent?: number | null;
  stressPercent?: number | null;
  onViewAll?: () => void;
}

export const OvaSenseProgressCard: React.FC<OvaSenseProgressCardProps> = ({
  nutritionPercent = null,
  exercisePercent = null,
  sleepPercent = null,
  stressPercent = null,
  onViewAll,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Dynamic explanation strings with non-diagnostic transparency
  const nutritionExplanation =
    nutritionPercent !== null
      ? isUrdu
        ? 'آج کے درج شدہ کھانوں کی بنیاد پر غذائی ہدف'
        : `Fuel target completion based on today's logged meals.`
      : isUrdu
      ? 'آج کا کھانا درج نہیں ہوا۔ ٹریکنگ کے لیے کھانا لاگ کریں۔'
      : `No meals logged today yet. Log a meal to calculate target adherence.`;

  const exerciseExplanation =
    exercisePercent !== null
      ? isUrdu
        ? 'روزانہ 30 منٹ کے ہدف کے مطابق سرگرمی'
        : `Active movement goal based on 30 min recommended daily pace.`
      : isUrdu
      ? 'آج کی ورزش درج نہیں ہوئی۔ منٹ لاگ کریں۔'
      : `No activity logged today yet. Log minutes to calculate progress.`;

  const sleepExplanation =
    sleepPercent !== null
      ? isUrdu
        ? 'روزانہ 8 گھنٹے کے ہدف کے مقابلے میں نیند کا تناسب'
        : `Calculated from your reported sleep relative to the 8-hour target.`
      : isUrdu
      ? 'نیند کی معلومات درج نہیں ہوئیں۔'
      : `Sleep baseline unrecorded. Complete daily goals to calculate.`;

  const stressExplanation =
    stressPercent !== null
      ? isUrdu
        ? 'آج کی ریلیکسیشن یا مائنڈفلنس کی عادت کی تکمیل (غیر تشخیصی)'
        : `Self-reported mindfulness & relaxation habit completion (non-diagnostic wellness observation).`
      : isUrdu
      ? 'تناؤ میں کمی کی سرگرمی درج نہیں ہوئی۔'
      : `Stress relief habit unrecorded today. Complete daily goals to calculate.`;

  const hasAnyTracking =
    (nutritionPercent !== null && nutritionPercent > 0) ||
    (exercisePercent !== null && exercisePercent > 0) ||
    (sleepPercent !== null && sleepPercent > 0) ||
    (stressPercent !== null && stressPercent > 0);

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-[#FCE7F0] p-5 sm:p-6 shadow-sm space-y-5 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            {t('ovasense.progress.title', 'Your Lifestyle Progress')}
          </h3>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-slate-400 hover:text-[#BE185D] transition-colors p-1 rounded-lg cursor-pointer"
          aria-label="View Lifestyle Progress Details"
        >
          <ChevronRight className={`w-4 h-4 ${isUrdu ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 4 Circular Progress Rings in One Row */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 items-center justify-between py-1">
        {/* 1. Nutrition Ring (Pink) */}
        <CircularProgressRing
          label={t('ovasense.progress.nutrition', 'Nutrition')}
          value={nutritionPercent}
          color="#F43F7D"
          trackColor="#FCE7F0"
          explanation={nutritionExplanation}
          isUrdu={isUrdu}
        />

        {/* 2. Exercise Ring (Teal) */}
        <CircularProgressRing
          label={t('ovasense.progress.exercise', 'Exercise')}
          value={exercisePercent}
          color="#0E9EAA"
          trackColor="#E0F2F1"
          explanation={exerciseExplanation}
          isUrdu={isUrdu}
        />

        {/* 3. Sleep Ring (Purple) */}
        <CircularProgressRing
          label={t('ovasense.progress.sleep', 'Sleep')}
          value={sleepPercent}
          color="#8B5CF6"
          trackColor="#EDE9FE"
          explanation={sleepExplanation}
          isUrdu={isUrdu}
        />

        {/* 4. Stress Ring (Blue) */}
        <CircularProgressRing
          label={t('ovasense.progress.stress', 'Stress')}
          value={stressPercent}
          color="#38BDF8"
          trackColor="#E0F2FE"
          explanation={stressExplanation}
          isUrdu={isUrdu}
        />
      </div>

      {/* Motivational Progress Banner */}
      <div className="rounded-2xl bg-[#FFF0F5] border border-pink-100/90 p-3 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-pink-200/80 text-[#BE185D] flex items-center justify-center shrink-0">
          <Star className="w-3.5 h-3.5 fill-[#BE185D]" />
        </div>
        <div className="text-xs leading-tight">
          <span className="font-bold text-slate-800 block">
            {hasAnyTracking
              ? t('ovasense.progress.bannerTitle', 'Great progress!')
              : t('ovasense.progress.startTitle', 'Begin Today!')}
          </span>
          <span className="text-slate-500 text-[11px]">
            {t('ovasense.progress.bannerSubtitle', 'Keep going. Small steps make a big difference.')}
          </span>
        </div>
      </div>
    </div>
  );
};
