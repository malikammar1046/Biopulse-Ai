import React from 'react';
import { Calendar, Plus, ShieldTick } from '@untitledui/icons';
import { motion } from 'framer-motion';

interface CycleEmptyStateProps {
  onLogPeriod: () => void;
}

export const CycleEmptyState: React.FC<CycleEmptyStateProps> = ({ onLogPeriod }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-8 sm:p-12 rounded-2xl bg-white border border-[#EAECF0] shadow-xs text-center max-w-2xl mx-auto space-y-6 select-none"
    >
      {/* Icon Graphic */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FDE6EF] border border-[#F43F7D]/20 text-[#F43F7D] flex items-center justify-center mx-auto shadow-xs">
        <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-[#F43F7D]" aria-hidden="true" />
      </div>

      {/* Main Copy */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#DC326C] px-3 py-1 rounded-full bg-[#FDE6EF]">
          Cycle Intelligence
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
          Your cycle story starts here.
        </h2>
        <p className="text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
          Log your first period to begin understanding your patterns, biological phases, and longitudinal rhythms.
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onLogPeriod}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-medium text-sm text-white bg-[#F43F7D] hover:bg-[#DC326C] shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Log Your First Period</span>
        </button>
      </div>

      {/* Privacy & Clinical Boundary Disclaimer */}
      <div className="pt-6 border-t border-[#EAECF0] flex items-center justify-center gap-2 text-xs text-[#64748B]">
        <ShieldTick className="w-4 h-4 text-[#F43F7D] shrink-0" aria-hidden="true" />
        <span>Your cycle records are privately encrypted with Row Level Security (RLS).</span>
      </div>
    </motion.div>
  );
};
