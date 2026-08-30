import React from 'react';
import { Calendar, Plus, ShieldCheck } from 'lucide-react';
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
      className="p-8 sm:p-12 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-center max-w-2xl mx-auto space-y-6 select-none"
    >
      {/* Icon Graphic */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#EDE4F7] to-[#FDF2F8] border border-[#D8B4FE]/40 text-[#6E2D8B] flex items-center justify-center mx-auto shadow-inner">
        <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-[#6E2D8B]" />
      </div>

      {/* Main Copy */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8E3EAF] px-3 py-1 rounded-full bg-[#EDE4F7]">
          Cycle Intelligence
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
          Your cycle story starts here.
        </h2>
        <p className="text-sm text-[#584B68] max-w-md mx-auto leading-relaxed">
          Log your first period to begin understanding your patterns, biological phases, and longitudinal rhythms.
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onLogPeriod}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Your First Period</span>
        </button>
      </div>

      {/* Privacy & Clinical Boundary Disclaimer */}
      <div className="pt-6 border-t border-[#F0EAF5] flex items-center justify-center gap-2 text-xs text-[#8D7E9E]">
        <ShieldCheck className="w-4 h-4 text-[#047857] shrink-0" />
        <span>Your cycle records are privately encrypted with Row Level Security (RLS).</span>
      </div>
    </motion.div>
  );
};
