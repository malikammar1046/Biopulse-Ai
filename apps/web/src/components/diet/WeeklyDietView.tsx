import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Utensils, Droplets, TrendingUp } from 'lucide-react';
import type { WeeklyDietDaySummary } from '../../types/diet';
import { dietService } from '../../services/dietService';

interface WeeklyDietViewProps {
  userId: string;
}

export const WeeklyDietView: React.FC<WeeklyDietViewProps> = ({ userId }) => {
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDietDaySummary[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeek() {
      setLoading(true);
      try {
        const summaries = await dietService.fetchWeeklyDietSummary(userId);
        setWeeklyDays(summaries);
      } catch (err) {
        console.warn('Error loading weekly diet summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWeek();
  }, [userId]);

  const totalMealsThisWeek = weeklyDays.reduce((sum, d) => sum + d.mealsLoggedCount, 0);
  const totalWaterGlasses = weeklyDays.reduce((sum, d) => sum + d.waterGlasses, 0);
  const averageBalance = weeklyDays.length > 0
    ? Math.round(weeklyDays.reduce((sum, d) => sum + d.balanceScore, 0) / weeklyDays.length)
    : 70;

  return (
    <div className="space-y-6 text-left select-none">
      {/* Top Weekly Summary Metrics Card */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#1E0B2E] via-[#2A103D] to-[#160724] text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/10 text-[#FDA4AF]">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold font-display text-white">
                7-Day Nutrition & Hydration Journey
              </h2>
            </div>
            <p className="text-xs text-[#D8CDE8]">
              Longitudinal check-in from Monday through Sunday
            </p>
          </div>

          {/* Average Balance Badge */}
          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FDA4AF] block font-bold">
              Weekly Balance Average
            </span>
            <span className="text-xl font-extrabold font-display text-white leading-none">
              {averageBalance} <span className="text-xs font-mono text-[#D8CDE8]">/ 100</span>
            </span>
          </div>
        </div>

        {/* 3 Overview Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-mono text-[#D8CDE8] flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#FDA4AF]" />
              <span>Meals Logged</span>
            </span>
            <span className="text-xl font-bold font-display text-white block">
              {totalMealsThisWeek} Meals
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-mono text-[#D8CDE8] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Hydration Total</span>
            </span>
            <span className="text-xl font-bold font-display text-white block">
              {totalWaterGlasses} Glasses ({(totalWaterGlasses * 0.25).toFixed(1)}L)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-mono text-[#D8CDE8] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Logging Consistency</span>
            </span>
            <span className="text-xl font-bold font-display text-white block">
              {weeklyDays.filter((d) => d.mealsLoggedCount > 0).length} of 7 Days Active
            </span>
          </div>
        </div>
      </div>

      {/* Lightweight SVG Weekly Trend Graph (Zero heavy charts) */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold font-display text-[#1C1326]">
              Weekly Energy & Hydration Trends
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8D7E9E]">Pure CSS / SVG</span>
        </div>

        {/* CSS Flex Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 pb-2 items-end h-44 border-b border-[#F5F0FA]">
          {weeklyDays.map((day, idx) => {
            const heightPercent = Math.max(15, Math.min(100, (day.caloriesLogged / 2000) * 100));
            const waterHeight = Math.max(10, Math.min(100, (day.waterGlasses / 8) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                {/* Bar Stack */}
                <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32">
                  {/* Calorie Bar */}
                  <div
                    className="w-1/2 bg-gradient-to-t from-[#6E2D8B] to-[#8E3EAF] rounded-t-lg transition-all duration-700"
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.dayName}: ${day.caloriesLogged} kcal`}
                  />
                  {/* Water Bar */}
                  <div
                    className="w-1/2 bg-gradient-to-t from-[#0284C7] to-[#38BDF8] rounded-t-lg transition-all duration-700"
                    style={{ height: `${waterHeight}%` }}
                    title={`${day.dayName}: ${day.waterGlasses} glasses`}
                  />
                </div>

                {/* Day Label */}
                <div className="text-center">
                  <span className="text-xs font-bold font-mono text-[#1C1326] block">
                    {day.dayShort}
                  </span>
                  <span className="text-[10px] font-mono text-[#8D7E9E]">
                    {day.date.slice(5)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6E2D8B]" />
            <span className="text-[#584B68]">Food Energy Logged</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0284C7]" />
            <span className="text-[#584B68]">Water Progress (Glasses)</span>
          </div>
        </div>
      </div>

      {/* 7-Day Day-by-Day Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold font-display text-[#1C1326]">
          Daily Log Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weeklyDays.map((day, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-4 rounded-2xl bg-white border border-[#E7DFEF] hover:border-[#D8B4FE] shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#F5F0FA]">
                <span className="text-xs font-bold font-mono text-[#6E2D8B]">
                  {day.dayShort}
                </span>
                <span className="text-[10px] font-mono text-[#8D7E9E]">
                  {day.date.slice(5)}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#584B68] text-[11px]">Meals:</span>
                  <span className="font-bold text-[#1C1326] font-mono">
                    {day.mealsLoggedCount} Logged
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#584B68] text-[11px]">Energy:</span>
                  <span className="font-bold text-[#1C1326] font-mono">
                    {day.caloriesLogged} kcal
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#584B68] text-[11px]">Water:</span>
                  <span className="font-bold text-[#0284C7] font-mono">
                    {day.waterGlasses} / {day.waterTarget} gls
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F5F0FA] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8D7E9E]">Balance:</span>
                <span className="text-xs font-bold font-mono text-[#6E2D8B]">
                  {day.balanceScore}/100
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
