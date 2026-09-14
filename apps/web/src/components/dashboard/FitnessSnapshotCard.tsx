import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ArrowRight, Sparkles } from 'lucide-react';
import type { FitnessData } from '../../types/dashboard';
import { ROUTES } from '../../constants/routes';

interface FitnessProps {
  data: FitnessData;
}

export const FitnessSnapshotCard: React.FC<FitnessProps> = ({ data }) => {
  return (
    <div className="p-6 sm:p-7 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
            <Dumbbell className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#0F172A]">
            Today’s Movement
          </h3>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          {data.workoutsThisWeek} / {data.weeklyGoal} This Week
        </span>
      </div>

      {/* Metric Visuals */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-xs font-mono text-[#64748B] block">Active Today</span>
          <span className="text-xl font-bold font-display text-[#0F172A]">
            {data.activeMinutesToday}m
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-xs font-mono text-[#64748B] block">Walking</span>
          <span className="text-xl font-bold font-display text-[#0288D1]">
            {data.walkingMinutes}m
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-xs font-mono text-[#64748B] block">Strength</span>
          <span className="text-xl font-bold font-display text-[#0288D1]">
            {data.strengthMinutes}m
          </span>
        </div>
      </div>

      {/* Suggested Exercise Card */}
      <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0288D1] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0288D1]" />
            {data.suggestedMovement.title}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-[#BAE6FD] text-[#0288D1] shadow-2xs">
            {data.suggestedMovement.duration}
          </span>
        </div>
        <p className="text-[11px] text-[#475569] leading-tight font-sans">
          {data.suggestedMovement.reason}
        </p>
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
        <Link
          to={ROUTES.APP.FITNESS}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0288D1] hover:text-[#0277BD] transition-colors group"
        >
          <span>View Movement Routines</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>

        <span className="text-[10px] font-mono text-[#64748B]">
          Gentle & Low-Stress
        </span>
      </div>
    </div>
  );
};
