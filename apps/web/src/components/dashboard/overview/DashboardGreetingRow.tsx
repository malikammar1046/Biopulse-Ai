import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Calendar, Activity } from 'lucide-react';
import type { HealthPathway } from '../../../types/onboarding';

interface DashboardGreetingRowProps {
  fullName?: string;
  pathway: HealthPathway;
  cycleDay?: number | null;
  hasCycleData?: boolean;
  lastSyncedFormatted?: string;
}

export const DashboardGreetingRow: React.FC<DashboardGreetingRowProps> = ({
  fullName,
  pathway,
  cycleDay,
  hasCycleData = false,
  lastSyncedFormatted = 'just now',
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const isFemale = pathway === 'female';

  // 1. First Name Resolution
  const firstName = useMemo(() => {
    const trimmed = (fullName || '').trim();
    if (!trimmed) return t('greetingThere');
    return trimmed.split(' ')[0] || t('greetingThere');
  }, [fullName, t]);

  // 2. Dynamic Local Time Greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greetingMorning');
    if (hour >= 12 && hour < 17) return t('greetingAfternoon');
    return t('greetingEvening');
  }, [t]);

  // 3. Current Formatted Date (e.g. "Tue, Apr 23, 2024")
  const formattedToday = useMemo(() => {
    const locale = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
    }
  }, [i18n.language]);

  // 4. Subtext for context card
  const contextSubtext = useMemo(() => {
    if (isFemale) {
      if (hasCycleData && cycleDay && cycleDay > 0) {
        const cycleWeek = Math.ceil(cycleDay / 7);
        return `${t('week')} ${cycleWeek}, ${t('cycleDay')} ${cycleDay}`;
      }
      return t('noCycleData');
    }
    return t('activeHealthTracking');
  }, [isFemale, hasCycleData, cycleDay, t]);

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 select-none text-left">
      {/* ── Left: Sun Icon + Dynamic Greeting + Subtitle ───────────────── */}
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0 shadow-xs mt-0.5 sm:mt-0">
          <Sun className="w-5 h-5 animate-pulse" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 font-display leading-tight truncate">
            {greetingTime}, {firstName}
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-sans mt-0.5">
            {t('greetingSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Right: Pathway Badge + Sync Status + Date Context Card ─────── */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0 self-start lg:self-center">
        {/* Pathway Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-xs ${
            isFemale
              ? 'bg-[#FDE6EF] text-[#E11D48] border-[#F43F7D]/30'
              : 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
          }`}
        >
          {isFemale ? (
            <span className="font-bold text-sm leading-none">♀</span>
          ) : (
            <span className="font-bold text-sm leading-none">♂</span>
          )}
          <span>{isFemale ? t('femalePathwayBadge') : t('malePathwayBadge')}</span>
        </div>

        {/* Global Sync Status (from real fetch completion) */}
        <div className="hidden sm:flex flex-col text-right text-[11px] leading-tight">
          <div className="flex items-center justify-end gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
            <span>{t('lastSynced')} {lastSyncedFormatted}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans mt-0.5">
            {t('allDataUpToDate')}
          </span>
        </div>

        {/* Date / Current Context Card */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isFemale
                ? 'bg-[#FDE6EF] text-[#E11D48]'
                : 'bg-[#E0F2FE] text-[#0284C7]'
            }`}
          >
            {isFemale && hasCycleData ? (
              <Calendar className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Activity className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-bold text-slate-800 font-sans">
              {formattedToday}
            </div>
            <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">
              {contextSubtext}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
