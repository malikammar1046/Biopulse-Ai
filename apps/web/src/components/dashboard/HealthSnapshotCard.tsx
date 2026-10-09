import React from 'react';
import {
  Calendar,
  Clock,
  ActivityHeart,
  LineChartUp01,
  ChevronRight,
  ShieldTick,
  CheckCircle,
} from '@untitledui/icons';
import type { HealthSnapshotMetrics } from '../../types/dashboard';

interface SnapshotCardsProps {
  metrics: HealthSnapshotMetrics;
  onViewSymptoms?: () => void;
  onViewCycle?: () => void;
  isMale?: boolean;
}

export const HealthSnapshotCard: React.FC<SnapshotCardsProps> = ({
  metrics,
  onViewSymptoms,
  onViewCycle,
  isMale,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
      {/* ── CARD 1: PATHWAY SPECIFIC (Cycle Day for Female, Hormone Health for Male) ── */}
      {isMale ? (
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs transition-all text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0288D1] uppercase tracking-wider">
              <ShieldTick className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
              <span>Hormone Health</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              Active
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-display text-[#0F172A] tracking-tight">
                Hypogonadism
              </span>
            </div>
            <span className="text-xs font-semibold text-[#0288D1] flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#0288D1]" />
              Androgen & Metabolic Pathway
            </span>
          </div>

          <div className="pt-1 flex items-end justify-between text-[10px] text-[#64748B] font-mono">
            <span>Clinical Tier 1 Protocol</span>
          </div>
        </div>
      ) : (
        <div
          onClick={onViewCycle}
          className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#FDE6EF] shadow-xs transition-all text-left space-y-3 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
              <span>Your Cycle Day</span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] font-medium">
              {metrics.totalCycleDays}-day cycle
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
                {metrics.cycleDay > 0 ? `Day ${metrics.cycleDay}` : 'Day —'}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#F43F7D] flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
              {metrics.phaseName}
            </span>
          </div>

          {/* Mini Sparkline Curve */}
          <div className="pt-1 flex items-end justify-between">
            <svg viewBox="0 0 100 24" className="w-28 h-6 overflow-visible">
              <path
                d="M 0 18 Q 25 22, 50 8 T 100 12"
                fill="none"
                stroke="#FB7185"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="8" r="3.5" fill="#F43F7D" />
            </svg>
            <span className="text-[10px] font-mono text-[#64748B] group-hover:text-[#F43F7D] flex items-center transition-colors">
              Details <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      )}

      {/* ── CARD 2: PATHWAY SPECIFIC (Next Period for Female, Vitality & Stamina for Male) ── */}
      {isMale ? (
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs transition-all text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0288D1] uppercase tracking-wider">
              <ActivityHeart className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
              <span>Vitality Baseline</span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] font-medium">ADAM Profile</span>
          </div>

          <div>
            <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {metrics.wellnessScore}%
            </span>
            <span className="text-xs text-[#64748B] block mt-0.5 font-medium">
              Daily Energy & Stamina Index
            </span>
          </div>

          <div className="pt-2 flex items-center gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  i < 9 ? 'bg-[#0288D1]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          onClick={onViewCycle}
          className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#FDE6EF] shadow-xs transition-all text-left space-y-3 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#F43F7D] uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
              <span>Next Period</span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] font-medium">Estimated</span>
          </div>

          <div>
            <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {metrics.nextPeriodDays > 0 ? `In ${metrics.nextPeriodDays} days` : 'Not recorded'}
            </span>
            <span className="text-xs text-[#64748B] block mt-0.5 font-medium">
              {metrics.nextPeriodDate}
            </span>
          </div>

          {/* Mini 14-dot phase tracker bar */}
          <div className="pt-2 flex items-center gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  i < 7 ? 'bg-[#F43F7D]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 3. SYMPTOMS LOGGED CARD ── */}
      <div
        onClick={onViewSymptoms}
        className={`p-5 rounded-2xl bg-white border border-[#E2E8F0] ${
          isMale ? 'hover:border-[#BAE6FD]' : 'hover:border-[#FDE6EF]'
        } shadow-xs transition-all text-left space-y-3 cursor-pointer group`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider ${
              isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'
            }`}
          >
            <ActivityHeart
              className={`w-4 h-4 shrink-0 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
              aria-hidden="true"
            />
            <span>Today&apos;s Symptoms</span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold group-hover:underline ${
              isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'
            }`}
          >
            View all
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {metrics.symptomsCountToday}
            </span>
            <span className="text-xs text-[#64748B] font-medium">Logged today</span>
          </div>
          <span className="text-xs text-[#64748B] block mt-0.5 truncate font-sans">
            {metrics.symptomsList.length > 0
              ? metrics.symptomsList.map((s) => s.name).join(' • ')
              : 'No symptoms logged today'}
          </span>
        </div>

        {/* Mini Vertical Bar Indicator */}
        <div className="pt-1 flex items-end gap-1.5 h-6">
          <div className={`w-2 h-3 rounded-t-sm ${isMale ? 'bg-[#BAE6FD]' : 'bg-[#FDE6EF]'}`} />
          <div className={`w-2 h-5 rounded-t-sm ${isMale ? 'bg-[#29B6F6]' : 'bg-[#FB7185]'}`} />
          <div className={`w-2 h-4 rounded-t-sm ${isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'}`} />
          <div className="w-2 h-2 bg-[#E2E8F0] rounded-t-sm" />
          <div className={`w-2 h-6 rounded-t-sm ${isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'}`} />
        </div>
      </div>

      {/* ── 4. WELLNESS SCORE CARD ── */}
      <div
        className={`p-5 rounded-2xl bg-white border border-[#E2E8F0] ${
          isMale ? 'hover:border-[#BAE6FD]' : 'hover:border-[#FDE6EF]'
        } shadow-xs transition-all text-left space-y-3`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Wellness Check</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <LineChartUp01 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            <span>+{metrics.wellnessScoreChange}% vs last week</span>
          </div>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            {metrics.wellnessScore}%
          </span>
          <span className="text-xs text-[#64748B] block mt-0.5 font-medium">
            Based on sleep, activity & meals
          </span>
        </div>

        {/* Mini Smooth Green Upward Wave */}
        <div className="pt-1 flex items-end justify-between">
          <svg viewBox="0 0 100 24" className="w-28 h-6 overflow-visible">
            <path
              d="M 0 18 Q 20 16, 40 10 T 80 6 T 100 2"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="2" r="3.5" fill="#059669" />
          </svg>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold">Feeling Balanced</span>
        </div>
      </div>
    </div>
  );
};

