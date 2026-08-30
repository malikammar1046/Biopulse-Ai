import React from 'react';
import { Calendar, Clock, Activity, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import type { HealthSnapshotMetrics } from '../../types/dashboard';

interface SnapshotCardsProps {
  metrics: HealthSnapshotMetrics;
  onViewSymptoms?: () => void;
  onViewCycle?: () => void;
}

export const HealthSnapshotCard: React.FC<SnapshotCardsProps> = ({
  metrics,
  onViewSymptoms,
  onViewCycle,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 select-none">
      {/* ── 1. CYCLE DAY CARD ── */}
      <div
        onClick={onViewCycle}
        className="p-5 rounded-3xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF]/40 shadow-sm hover:shadow-md transition-all duration-300 text-left space-y-3 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8E3EAF] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span>Your Cycle Day</span>
          </div>
          <span className="text-[10px] font-mono text-[#8D7E9E] font-medium">
            {metrics.totalCycleDays}-day cycle
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
              {metrics.cycleDay > 0 ? `Day ${metrics.cycleDay}` : 'Day —'}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#FB7185] flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-pulse" />
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
            <circle cx="50" cy="8" r="3.5" fill="#6E2D8B" />
          </svg>
          <span className="text-[10px] font-mono text-[#8D7E9E] group-hover:text-[#6E2D8B] flex items-center transition-colors">
            Details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* ── 2. NEXT PERIOD CARD ── */}
      <div
        onClick={onViewCycle}
        className="p-5 rounded-3xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF]/40 shadow-sm hover:shadow-md transition-all duration-300 text-left space-y-3 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6E2D8B] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span>Next Period</span>
          </div>
          <span className="text-[10px] font-mono text-[#8D7E9E] font-medium">Estimated</span>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
            {metrics.nextPeriodDays > 0 ? `In ${metrics.nextPeriodDays} days` : 'Not recorded'}
          </span>
          <span className="text-xs text-[#584B68] block mt-0.5 font-medium">
            {metrics.nextPeriodDate}
          </span>
        </div>

        {/* Mini 28-dot phase tracker bar */}
        <div className="pt-2 flex items-center gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                i < 7
                  ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF]'
                  : 'bg-[#E7DFEF]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── 3. SYMPTOMS LOGGED CARD ── */}
      <div
        onClick={onViewSymptoms}
        className="p-5 rounded-3xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF]/40 shadow-sm hover:shadow-md transition-all duration-300 text-left space-y-3 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A21CAF] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#FDF2F8] text-[#A21CAF]">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <span>Today's Symptoms</span>
          </div>
          <span className="text-[10px] font-mono text-[#A21CAF] font-bold group-hover:underline">
            View all
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
              {metrics.symptomsCountToday}
            </span>
            <span className="text-xs text-[#584B68] font-medium">Logged today</span>
          </div>
          <span className="text-xs text-[#584B68] block mt-0.5 truncate font-sans">
            {metrics.symptomsList.length > 0
              ? metrics.symptomsList.map((s) => s.name).join(' • ')
              : 'No symptoms logged today'}
          </span>
        </div>

        {/* Mini Vertical Bar Indicator */}
        <div className="pt-1 flex items-end gap-1.5 h-6">
          <div className="w-2 h-3 bg-[#D8B4FE] rounded-t-sm" />
          <div className="w-2 h-5 bg-[#FB7185] rounded-t-sm" />
          <div className="w-2 h-4 bg-[#8E3EAF] rounded-t-sm" />
          <div className="w-2 h-2 bg-[#E7DFEF] rounded-t-sm" />
          <div className="w-2 h-6 bg-[#6E2D8B] rounded-t-sm" />
        </div>
      </div>

      {/* ── 4. WELLNESS SCORE CARD ── */}
      <div className="p-5 rounded-3xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF]/40 shadow-sm hover:shadow-md transition-all duration-300 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#047857] uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#047857]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>Wellness Check</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>+{metrics.wellnessScoreChange}% vs last week</span>
          </div>
        </div>

        <div>
          <span className="text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
            {metrics.wellnessScore}%
          </span>
          <span className="text-xs text-[#584B68] block mt-0.5 font-medium">
            Based on sleep, activity & meals
          </span>
        </div>

        {/* Mini Smooth Green Upward Wave */}
        <div className="pt-1 flex items-end justify-between">
          <svg viewBox="0 0 100 24" className="w-28 h-6 overflow-visible">
            <path
              d="M 0 18 Q 20 16, 40 10 T 80 6 T 100 2"
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="2" r="3.5" fill="#047857" />
          </svg>
          <span className="text-[10px] font-mono text-[#047857] font-semibold">Feeling Balanced</span>
        </div>
      </div>
    </div>
  );
};
