import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';

interface CycleDialProps {
  currentDay: number;
  totalDays: number;
  phaseName: string;
}

export const CycleProgressDial: React.FC<CycleDialProps> = ({
  currentDay = 0,
  totalDays = 28,
  phaseName = 'Start tracking your cycle',
}) => {
  const hasLogged = currentDay > 0 && !phaseName.toLowerCase().includes('start tracking');

  // SVG calculations for circular progress arc
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = hasLogged ? Math.min(Math.max(currentDay / totalDays, 0), 1) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const getPhaseGuidance = () => {
    if (!hasLogged) {
      return 'Log your first period to activate real-time cycle day calculations, biological phase estimates, and personalized rhythm tracking.';
    }
    const lower = phaseName.toLowerCase();
    if (lower.includes('period') || lower.includes('menstruat')) {
      return 'Focus on restorative rest, warmth, iron-rich nourishment, and gentle stretching.';
    }
    if (lower.includes('ovulat')) {
      return 'Estimated peak energy window. Ideal for high-output focus, social connection, and strength training.';
    }
    if (lower.includes('luteal')) {
      return 'Support progesterone with magnesium, complex carbohydrates, and calming evening routines.';
    }
    return 'Rising estrogen supports increasing energy, progressive workouts, and creative focus.';
  };

  const mid = Math.floor(totalDays / 2);

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAECF0] shadow-xs flex flex-col justify-between select-none text-left space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#F43F7D] shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold font-display text-[#0F172A]">
            Cycle Progress
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-[#DC326C] bg-[#FDE6EF] border border-[#F43F7D]/20 px-3 py-1 rounded-full">
          {totalDays} Days Cycle
        </span>
      </div>

      {/* Main Dial & Narrative Content */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular Progress Ring */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="12"
            />

            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#F43F7D"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {hasLogged ? (
              <>
                <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                  Day
                </span>
                <span className="text-3xl font-extrabold font-display text-[#0F172A] leading-none">
                  {currentDay}
                </span>
                <span className="text-[11px] font-mono text-[#64748B] mt-0.5">
                  of {totalDays}
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold font-display text-[#94A3B8] leading-none">
                  —
                </span>
                <span className="text-[10px] font-mono text-[#64748B] mt-1 font-semibold">
                  No log yet
                </span>
              </>
            )}
          </div>
        </div>

        {/* Textual Narrative & Guidance */}
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div>
            <span className="text-xs font-mono uppercase text-[#64748B] tracking-wider block">
              {hasLogged ? 'Current Phase' : 'Rhythm Status'}
            </span>
            <h4 className="text-lg sm:text-xl font-bold font-display text-[#F43F7D]">
              {phaseName}
            </h4>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed font-sans">
            {getPhaseGuidance()}
          </p>

          <Link
            to={ROUTES.APP.CYCLE}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F43F7D] hover:text-[#DC326C] transition-colors group"
          >
            <span>{hasLogged ? 'View Cycle Calendar' : 'Start Tracking Your Cycle'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Segment Legend */}
      <div className="pt-4 border-t border-[#EAECF0] flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-1.5 text-[#475569]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
          <span>Period (1–5)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8E3EAF]" />
          <span>Follicular (6–{mid - 1})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A21CAF]" />
          <span>Ovulation ({mid})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#475569]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6E2D8B]" />
          <span>Luteal ({mid + 1}–{totalDays})</span>
        </div>
      </div>
    </div>
  );
};
