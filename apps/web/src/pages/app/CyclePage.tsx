import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const CyclePage: React.FC = () => {
  const { snapshotMetrics, openAiChatWithPrompt } = useUserHealth();

  const totalDays = snapshotMetrics.totalCycleDays || 28;
  const cycleDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  const midpoint = Math.floor(totalDays / 2);

  const getDayPhase = (day: number) => {
    if (day <= 5) return { name: 'Menstruation', color: 'bg-[#FB7185] text-white', tag: 'Period' };
    if (day < midpoint) return { name: 'Follicular', color: 'bg-[#8E3EAF] text-white', tag: 'Follicular' };
    if (day >= midpoint && day <= midpoint + 1) return { name: 'Ovulation', color: 'bg-[#A21CAF] text-white font-bold ring-2 ring-[#FB7185]', tag: 'Peak Fertile' };
    return { name: 'Luteal', color: 'bg-[#EDE4F7] text-[#6E2D8B]', tag: 'Luteal' };
  };

  const currentMonthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFEF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Cycle Intelligence & Rhythm
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Tracking follicular recruitment, estrogen curves, and luteal phase stability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-2xl bg-white border border-[#E7DFEF] text-xs font-mono font-bold text-[#6E2D8B]">
            Current: Day {snapshotMetrics.cycleDay} ({snapshotMetrics.phaseName})
          </span>
        </div>
      </div>

      {/* Cycle Month Calendar Grid */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-[#1C1326]">
            {currentMonthYear} Active Cycle Window
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-[#F8F5FA] hover:bg-[#EDE4F7] text-[#6E2D8B]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-[#1C1326]">{totalDays}-Day Cycle</span>
            <button className="p-2 rounded-xl bg-[#F8F5FA] hover:bg-[#EDE4F7] text-[#6E2D8B]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 28-Day Cycle Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 sm:gap-3">
          {cycleDays.map((day) => {
            const phase = getDayPhase(day);
            const isToday = day === snapshotMetrics.cycleDay;
            return (
              <div
                key={day}
                onClick={() => openAiChatWithPrompt(`What happens in the body on Day ${day}?`)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                  isToday
                    ? 'border-[#8E3EAF] ring-2 ring-[#8E3EAF]/30 bg-[#F2ECF7] shadow-md scale-105'
                    : 'border-[#E7DFEF] bg-[#F8F5FA] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#1C1326]">Day {day}</span>
                  {isToday && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#8E3EAF] text-white">
                      Today
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full block text-center truncate ${phase.color}`}>
                    {phase.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase Breakdown Legend & Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F0EAF5] text-xs">
          <div className="p-3 rounded-2xl bg-[#FDF2F8] border border-[#FDA4AF]/40">
            <span className="font-bold text-[#FB7185] block">1. Menstrual Phase</span>
            <span className="text-[11px] text-[#584B68]">Days 1–5 • Shedding & low hormones</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#EDE4F7] border border-[#D8B4FE]/40">
            <span className="font-bold text-[#8E3EAF] block">2. Follicular Phase</span>
            <span className="text-[11px] text-[#584B68]">Days 6–13 • Estrogen rise & energy</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#C084FC]/40">
            <span className="font-bold text-[#A21CAF] block">3. Ovulation Window</span>
            <span className="text-[11px] text-[#584B68]">Day 14 • LH surge & follicle release</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]">
            <span className="font-bold text-[#6E2D8B] block">4. Luteal Phase</span>
            <span className="text-[11px] text-[#584B68]">Days 15–28 • Progesterone dominance</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CyclePage;
