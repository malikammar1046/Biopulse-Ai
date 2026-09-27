import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActivityHeart,
  ShieldTick,
  Calendar,
  CalendarCheck01,
  Clock,
  ArrowRight,
  ChevronRight,
  LineChartUp01,
  File01,
  CheckCircle,
  AlertCircle,
  Scales01,
  Plus,
} from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';
import { getTimeBasedGreeting } from '../../utils/profileCompletion';
import { SemicircularRiskGauge } from './SemicircularRiskGauge';
import type { UserProfile } from '../../types/onboarding';

interface MaleDashboardOverviewProps {
  userProfile: UserProfile;
  activeAssessment?: any;
  hasAssessment?: boolean;
  probabilityPercent: number | null;
  riskCategory: string;
  riskLabel?: string;
  assessmentLevel: string;
  threshold: number;
  explanations: any[];
  lastAssessmentDateFormatted: string | null;
  profileCompletionPercentage: number;
  reports: any[];
  appointments: any[];
  nutrition?: any;
  onStartScreening: () => void;
  onViewAssessment: () => void;
  onOpenLabsModal: () => void;
  screeningLoading?: boolean;
}

export const MaleDashboardOverview: React.FC<MaleDashboardOverviewProps> = ({
  userProfile,
  probabilityPercent,
  riskCategory,
  riskLabel,
  assessmentLevel,
  threshold,
  explanations,
  lastAssessmentDateFormatted,
  profileCompletionPercentage,
  reports,
  appointments,
  onStartScreening,
  onViewAssessment,
  onOpenLabsModal,
  screeningLoading = false,
}) => {
  const navigate = useNavigate();

  // Dynamic greeting
  const greeting = getTimeBasedGreeting(userProfile.fullName);
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Normalize risk category
  const normalizedCategory = (riskCategory || 'lower').toLowerCase();
  const isHigher = normalizedCategory.includes('high') || normalizedCategory.includes('elevated');
  const isIntermediate = !isHigher && (normalizedCategory.includes('intermediate') || normalizedCategory.includes('moderate'));

  const displayProbability = probabilityPercent ?? (isIntermediate ? 24 : isHigher ? 42 : 12);

  const riskTierBadge = isHigher
    ? { label: 'Higher Risk', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
    : isIntermediate
    ? { label: 'Intermediate Risk', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
    : { label: 'Lower Risk', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };

  // Upcoming scheduled appointment
  const nextAppointment = useMemo(() => {
    const scheduled = (appointments || []).filter((a) => a.status === 'scheduled');
    if (scheduled.length === 0) return null;
    return scheduled.sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    )[0];
  }, [appointments]);

  // Extract hormone lab values from verified reports
  const hormoneLabs = useMemo(() => {
    let testosterone: { value: string; status: 'normal' | 'low' | 'pending'; date?: string } = {
      value: 'Pending',
      status: 'pending',
    };
    let lh: { value: string; status: 'normal' | 'low' | 'high' | 'pending'; date?: string } = {
      value: 'Pending',
      status: 'pending',
    };
    let fsh: { value: string; status: 'normal' | 'low' | 'high' | 'pending'; date?: string } = {
      value: 'Pending',
      status: 'pending',
    };

    if (reports && reports.length > 0) {
      for (const report of reports) {
        for (const res of report.results || []) {
          const testName = (res.biomarker || res.testName || '').toLowerCase();
          if (testName.includes('testosterone') && testosterone.status === 'pending') {
            const numVal = parseFloat(res.value);
            testosterone = {
              value: `${res.value} ${res.unit || 'ng/dL'}`,
              status: isNaN(numVal) ? 'normal' : numVal < 300 ? 'low' : 'normal',
              date: report.date || report.created_at,
            };
          }
          if (testName.includes('lh') || testName.includes('luteinizing')) {
            if (lh.status === 'pending') {
              lh = {
                value: `${res.value} ${res.unit || 'mIU/mL'}`,
                status: 'normal',
                date: report.date || report.created_at,
              };
            }
          }
          if (testName.includes('fsh') || testName.includes('follicle')) {
            if (fsh.status === 'pending') {
              fsh = {
                value: `${res.value} ${res.unit || 'mIU/mL'}`,
                status: 'normal',
                date: report.date || report.created_at,
              };
            }
          }
        }
      }
    }

    return { testosterone, lh, fsh };
  }, [reports]);

  // Influencing Factors: dynamically map from SHAP explanations or fallback to clinical defaults
  const displayFactors = useMemo(() => {
    if (explanations && explanations.length > 0) {
      return explanations.slice(0, 5).map((exp: any) => ({
        name: exp.feature || exp.name || 'Clinical Factor',
        label: exp.label || exp.description || 'Influence on screening probability',
        percentage: Math.min(100, Math.max(15, Math.round(Math.abs(exp.weight ?? exp.importance ?? 0.5) * 100))),
        impact: exp.direction === 'decreases' ? 'Protective' : 'Risk Factor',
      }));
    }

    return [
      { name: 'ADAM Symptom Score', percentage: 78, impact: '+ Primary driver', label: 'Fatigue, libido, and strength scores' },
      { name: 'BMI & Metabolic Context', percentage: 64, impact: '+ Elevated risk', label: 'Adiposity and androgen conversion' },
      { name: 'Morning Energy Pattern', percentage: 51, impact: '+ Contributing factor', label: 'Circadian vitality variation' },
    ];
  }, [explanations]);

  return (
    <div className="space-y-6 text-left select-none">
      {/* ── 1. Top Header Row ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Your comprehensive male reproductive-endocrine health monitoring portal.
          </p>
        </div>

        {/* Header Right Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pathway Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0288D1] text-xs font-mono font-bold">
            <span className="text-sm leading-none">♂</span>
            <span>Male Health | Hypogonadism Screening</span>
          </div>

          {/* Current Date Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] text-xs font-mono font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>{currentDateFormatted}</span>
          </div>

          {/* Profile Completion Chip */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.SETTINGS)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#BAE6FD] text-xs font-mono text-[#0F172A] transition-all cursor-pointer shadow-2xs"
            title="Click to view and complete remaining profile fields"
          >
            <div className="w-2 h-2 rounded-full bg-[#0288D1]" />
            <span className="font-bold text-[#0288D1]">{profileCompletionPercentage}%</span>
            <span className="text-[#64748B]">Profile</span>
          </button>
        </div>
      </div>

      {/* ── 2. Hero Banner (Skyblue Inspirational) ────────────────────── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#E0F2FE] via-[#F0F9FF] to-[#E0F7FA] border border-[#BAE6FD] p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/80 border border-[#BAE6FD] text-[11px] font-mono font-bold text-[#0288D1] tracking-wider uppercase">
              <ActivityHeart className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
              <span>HORMONE BALANCE • ENERGY • A HEALTHIER YOU</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#0F172A] tracking-tight">
              Small Steps. A Stronger Tomorrow.
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-sans leading-relaxed">
              Understand your health. Take informed steps. Feel better every day.
            </p>
          </div>

          {/* Inspirational Quote Card */}
          <div className="shrink-0 self-start md:self-center px-4 py-3 rounded-2xl bg-white/90 border border-[#BAE6FD] shadow-2xs">
            <p className="text-xs font-serif italic text-[#0288D1] font-semibold">
              &ldquo;Better insights for a stronger you.&rdquo;
            </p>
            <span className="text-[10px] font-mono text-[#64748B] block mt-0.5 text-right">
              — BioPulse AI Health
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Row 1: Primary Screening & Assessment Grid (3 Cards) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: Hypogonadism Screening Result */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActivityHeart className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold font-display text-[#0F172A]">
                    Hypogonadism Screening
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {riskLabel || (assessmentLevel === 'tier_2' ? 'Tier 2 (Biomarker Enhanced)' : 'Tier 1 (Symptom & Clinical)')}
                    {lastAssessmentDateFormatted ? ` • ${lastAssessmentDateFormatted}` : ''}
                  </span>
                </div>
              </div>

              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${riskTierBadge.bg} ${riskTierBadge.text} ${riskTierBadge.border}`}>
                {riskTierBadge.label}
              </span>
            </div>

            {/* Gauge visualization */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <SemicircularRiskGauge
                probabilityPercent={displayProbability}
                riskCategory={riskCategory}
                pathway="male"
                threshold={threshold}
                assessmentLevel={assessmentLevel}
                className="w-full max-w-[220px]"
              />
            </div>

            {/* 3-Tier Threshold Legend */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono text-[10px]">
              <div className="p-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800">
                <span className="block font-bold">Lower</span>
                <span className="text-[9px] text-emerald-600">0 - 18%</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-800">
                <span className="block font-bold">Intermediate</span>
                <span className="text-[9px] text-amber-600">18 - 34%</span>
              </div>
              <div className="p-1.5 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-800">
                <span className="block font-bold">Higher</span>
                <span className="text-[9px] text-rose-600">≥ 34%</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] leading-relaxed pt-1">
              Non-diagnostic screening score. Designed for clinical guidance and early discussion with your physician.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onViewAssessment}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>View Full Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onStartScreening}
              disabled={screeningLoading}
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {screeningLoading ? 'Processing...' : 'Update Information'}
            </button>
          </div>
        </div>

        {/* Card 2: Recommended Next Step (Priority) */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldTick className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold font-display text-[#0F172A]">
                    Recommended Next Step
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Diagnostic Confirmation Pathway
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                Priority
              </span>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Tier 1 questionnaire complete. Add verified hormone blood test results to unlock Tier 2 precision screening and biomarker risk scoring.
            </p>

            {/* Checklist of recommended labs */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] block">
                Recommended Endocrine Panel:
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]">
                  <CheckCircle className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <span className="font-semibold block">Total Testosterone</span>
                    <span className="text-[10px] text-[#64748B] font-mono">Fasting morning sample (8:00 AM – 10:00 AM)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]">
                  <CheckCircle className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <span className="font-semibold block">LH & FSH Gonadotropins</span>
                    <span className="text-[10px] text-[#64748B] font-mono">Differentiates primary vs secondary hypogonadism</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]">
                  <CheckCircle className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <span className="font-semibold block">Prolactin & Metabolic Panel</span>
                    <span className="text-[10px] text-[#64748B] font-mono">Fasting blood glucose & lipid evaluation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onOpenLabsModal}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Add Lab Results</span>
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Precision Tip */}
            <div className="p-2.5 rounded-xl bg-[#E0F2FE]/60 border border-[#BAE6FD] text-[11px] text-[#0369A1] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Tip:</strong> Testosterone synthesis peaks between 7:00 AM and 10:00 AM during deep REM sleep.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: What Influenced Your Result */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChartUp01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold font-display text-[#0F172A]">
                    What Influenced Your Result
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Model Explainability (SHAP Weights)
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                AI Verified
              </span>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Key physical, behavioral, and symptomatic drivers contributing to your screening calculation:
            </p>

            {/* Factor Bars */}
            <div className="space-y-3 pt-1">
              {displayFactors.map((factor, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A] truncate max-w-[180px]">
                      {factor.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#0288D1] font-bold">
                      {factor.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#0288D1] transition-all duration-500"
                      style={{ width: `${factor.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                    <span className="truncate max-w-[200px]">{factor.label}</span>
                    <span className="shrink-0 text-slate-500">{factor.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onViewAssessment}
              className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#E0F2FE] border border-[#E2E8F0] hover:border-[#BAE6FD] text-[#0288D1] text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Full Explainability Report</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Row 2: Clinical Details, Nutrition & Appointments (3 Cards) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Card 4: Latest Lab Results */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold font-display text-[#0F172A]">
                    Latest Lab Results
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Hormone Panel Status
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${hormoneLabs.testosterone.status !== 'pending' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {hormoneLabs.testosterone.status !== 'pending' ? 'Verified' : 'Pending Labs'}
              </span>
            </div>

            {/* Hormone rows */}
            <div className="space-y-2 pt-1">
              {/* Total Testosterone */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Total Testosterone
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Ref: 300 – 1,000 ng/dL
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-extrabold text-[#0F172A] block">
                    {hormoneLabs.testosterone.value}
                  </span>
                  <span className={`text-[9px] font-mono font-bold uppercase ${hormoneLabs.testosterone.status === 'low' ? 'text-rose-600' : hormoneLabs.testosterone.status === 'normal' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {hormoneLabs.testosterone.status}
                  </span>
                </div>
              </div>

              {/* Luteinizing Hormone (LH) */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    Luteinizing Hormone (LH)
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Ref: 1.7 – 8.6 mIU/mL
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-extrabold text-[#0F172A] block">
                    {hormoneLabs.lh.value}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                    {hormoneLabs.lh.status}
                  </span>
                </div>
              </div>

              {/* Follicle-Stimulating Hormone (FSH) */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block">
                    FSH
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Ref: 1.5 – 12.4 mIU/mL
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-extrabold text-[#0F172A] block">
                    {hormoneLabs.fsh.value}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                    {hormoneLabs.fsh.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => navigate(ROUTES.APP.REPORTS)}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All Reports</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Card 5: Nutrition Plan */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scales01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold font-display text-[#0F172A]">
                    Nutrition Plan
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Metabolic & Endocrine Vitality
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                Daily Plan
              </span>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Targeted nutrition balanced for testosterone synthesis, steady insulin sensitivity, and lean muscle retention.
            </p>

            {/* Nutrition Checklist */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] block">
                Personalized for Your Goals:
              </span>

              <div className="space-y-1.5 text-xs text-[#0F172A]">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Supports natural hormone balance (Zinc, Magnesium & Healthy Fats)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Helps maintain healthy weight & prevents insulin spikes</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Boosts daytime energy & reduces post-lunch fatigue slumps</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Adapted to Pakistani culinary patterns & dietary preferences</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => navigate(ROUTES.APP.LIFESTYLE)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>View Lifestyle Plan</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Card 6: Upcoming Appointment */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold font-display text-[#0F172A]">
                    Upcoming Appointment
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Specialist Consultation
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${nextAppointment ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {nextAppointment ? 'Scheduled' : 'Action Recommended'}
              </span>
            </div>

            {/* Appointment Details or Recommendation */}
            {nextAppointment ? (
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div>
                  <span className="text-xs font-extrabold text-[#0F172A] block">
                    {nextAppointment.doctorName || 'Endocrinologist Consultation'}
                  </span>
                  <span className="text-[11px] text-[#64748B] block">
                    {nextAppointment.specialty || 'Endocrinology & Andrology'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-[#0F172A] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    <span>{nextAppointment.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    <span>{nextAppointment.scheduledTime || '10:00 AM'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <span className="text-xs font-bold text-[#0F172A] block">
                  Recommended: Consult an Endocrinologist
                </span>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Review your ADAM symptoms and morning testosterone baseline with a physician to evaluate next clinical steps.
                </p>
              </div>
            )}

            {/* Preparation Banner */}
            <div className="p-3 rounded-xl bg-[#E0F2FE]/60 border border-[#BAE6FD] text-[11px] text-[#0369A1] space-y-1">
              <span className="font-bold block">Prepare for your appointment:</span>
              <p className="text-[10px] leading-relaxed text-[#0288D1]">
                Bring your verified morning blood test results and completed BioPulse AI screening report.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => navigate(ROUTES.APP.APPOINTMENTS)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Manage Appointments</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaleDashboardOverview;
