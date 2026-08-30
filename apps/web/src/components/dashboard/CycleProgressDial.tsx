import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

interface CycleDialProps {
  currentDay: number;
  totalDays: number;
  phaseName: string;
}

export const CycleProgressDial: React.FC<CycleDialProps> = ({
  currentDay = 14,
  totalDays = 28,
  phaseName = 'Follicular Phase',
}) => {
  // SVG calculations for circular progress arc
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(Math.max(currentDay / totalDays, 0), 1);
  const strokeDashoffset = circumference - progressRatio * circumference;

  const getPhaseGuidance = () => {
    const lower = phaseName.toLowerCase();
    if (lower.includes('period') || lower.includes('menstruat')) {
      return 'Focus on restorative rest, warmth, iron-rich nourishment, and gentle stretching.';
    }
    if (lower.includes('ovulat')) {
      return 'Peak energy window. Ideal for high-output work, social connection, and strength training.';
    }
    if (lower.includes('luteal')) {
      return 'Support progesterone with magnesium, complex carbohydrates, and calming evening routines.';
    }
    return 'This is a great phase for building energy, progressive workouts, and focused creative work as estrogen naturally rises.';
  };

  const mid = Math.floor(totalDays / 2);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <Calendar className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Cycle Progress
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-[#6E2D8B] bg-[#EDE4F7] px-3 py-1 rounded-full">
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
              stroke="#F2ECF7"
              strokeWidth="12"
            />

            {/* Gradient Arc Fill */}
            <defs>
              <linearGradient id="cycleDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="50%" stopColor="#8E3EAF" />
                <stop offset="100%" stopColor="#A21CAF" />
              </linearGradient>
            </defs>

            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#cycleDialGrad)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-mono text-[#8D7E9E] uppercase tracking-wider font-semibold">
              Day
            </span>
            <span className="text-3xl font-extrabold font-display text-[#1C1326] leading-none">
              {currentDay}
            </span>
            <span className="text-[11px] font-mono text-[#584B68] mt-0.5">
              of {totalDays}
            </span>
          </div>
        </div>

        {/* Textual Narrative & Guidance */}
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div>
            <span className="text-xs font-mono uppercase text-[#8D7E9E] tracking-wider block">
              Current Phase
            </span>
            <h4 className="text-xl font-bold font-display text-[#8E3EAF]">
              {phaseName}
            </h4>
          </div>

          <p className="text-xs text-[#584B68] leading-relaxed font-sans">
            {getPhaseGuidance()}
          </p>

          <Link
            to={ROUTES.APP.CYCLE}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors group"
          >
            <span>View Cycle Calendar</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Segment Legend */}
      <div className="pt-4 border-t border-[#F0EAF5] flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
          <span>Period (1–5)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8E3EAF]" />
          <span>Follicular (6–{mid - 1})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A21CAF]" />
          <span>Ovulation ({mid})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#584B68]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C084FC]" />
          <span>Luteal ({mid + 1}–{totalDays})</span>
        </div>
      </div>
    </div>
  );
};
