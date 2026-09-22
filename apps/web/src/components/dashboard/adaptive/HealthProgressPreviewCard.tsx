import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendUp01,
  ArrowUpRight,
  ActivityHeart,
  ShieldTick,
  Calendar,
  ChevronRight,
} from '@untitledui/icons';
import { ROUTES } from '../../../constants/routes';
import type { HealthPathway, UserProfile } from '../../../types/onboarding';
import type { SymptomRecord } from '../../../types/symptom';
import type { CycleRecord } from '../../../types/cycle';
import type { MedicalReport } from '../../../types/report';
import type { FitnessLogEntry } from '../../../types/fitness';
import { LongitudinalHealthService } from '../../../services/longitudinalHealthService';

interface HealthProgressPreviewCardProps {
  pathway: HealthPathway;
  userProfile: Partial<UserProfile>;
  symptomRecords: SymptomRecord[];
  cycleRecords: CycleRecord[];
  reports: MedicalReport[];
  fitnessLogs: FitnessLogEntry[];
}

export const HealthProgressPreviewCard: React.FC<HealthProgressPreviewCardProps> = ({
  pathway,
  userProfile,
  symptomRecords,
  cycleRecords,
  reports,
  fitnessLogs,
}) => {
  // Lightweight synthesis of recent 30-day trends
  const longitudinal = useMemo(() => {
    return LongitudinalHealthService.synthesizeState({
      userProfile,
      symptomRecords,
      cycleRecords: pathway === 'female' ? cycleRecords : [],
      reports,
      foodLogs: [],
      waterLog: null,
      fitnessLogs,
      medications: [],
      medicationLogs: [],
      appointments: [],
      careCircleMembers: [],
      pathway,
      period: '30d',
    });
  }, [userProfile, symptomRecords, cycleRecords, reports, fitnessLogs, pathway]);

  const topTrend = longitudinal.trends[0];
  const verifiedReportCount = reports.filter((r) =>
    (r.results || []).some((res) => res.userVerified)
  ).length;

  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] text-[#0F172A] shadow-sm text-left space-y-4 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <TrendUp01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#0288D1] font-bold">
                Longitudinal Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                Phase 8
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A]">
              Your Health Progress
            </h3>
          </div>
        </div>

        <Link
          to={ROUTES.APP.PROGRESS}
          className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E0F2FE] border border-[#E2E8F0] text-xs font-semibold text-[#0288D1] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>Full Progress</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
        </Link>
      </div>

      {/* 3 Metric Pills: Recent Change, Historical Depth, Verified Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
        {/* Metric 1: Recent Changes */}
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#64748B]">
            <ActivityHeart className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
            <span>Recent Changes</span>
          </div>
          <p className="text-xs text-[#0F172A] font-medium line-clamp-2">
            {longitudinal.overview.whatHasChanged[0] || 'Baseline accumulating.'}
          </p>
        </div>

        {/* Metric 2: Historical Depth */}
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#64748B]">
            <Calendar className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
            <span>Historical Depth</span>
          </div>
          <div className="text-xs text-[#0F172A] font-medium">
            <strong>{longitudinal.totalEventsAnalyzed}</strong> verified entries analyzed across 30 days.
          </div>
        </div>

        {/* Metric 3: Verified Biomarkers */}
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#64748B]">
            <ShieldTick className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            <span>Verified Labs</span>
          </div>
          <div className="text-xs text-[#0F172A] font-medium">
            {verifiedReportCount > 0 ? (
              <span><strong>{verifiedReportCount}</strong> verified lab reports on file.</span>
            ) : (
              <span className="text-[#64748B]">No verified lab reports yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Highlight Trend snippet */}
      {topTrend && (
        <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-mono uppercase text-[#0288D1] font-bold block">
              Active Trend: {topTrend.title}
            </span>
            <p className="text-[#0F172A] truncate font-sans">{topTrend.whatChanged}</p>
          </div>
          <Link
            to={ROUTES.APP.PROGRESS}
            className="text-xs font-semibold text-[#0288D1] hover:text-[#0277BD] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Explore Trends</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
};
