import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Sparkles, Play, Clock } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const FitnessPage: React.FC = () => {
  const { openAiChatWithPrompt } = useUserHealth();

  const routines = [
    { title: 'Follicular Zone-2 Power Walk', duration: '30 min', intensity: 'Low-Impact', focus: 'Glucose Uptake & Aerobic Base' },
    { title: 'Full-Body Resistance & Core', duration: '25 min', intensity: 'Moderate', focus: 'Insulin Sensitivity & Muscle Mass' },
    { title: 'Nervous System Reset Pilates', duration: '20 min', intensity: 'Restorative', focus: 'Cortisol Reduction' },
  ];

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
            <span className="p-1.5 rounded-xl bg-[#FDF2F8] text-[#FB7185]">
              <Dumbbell className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Movement & Cortisol Balance
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Phase-matched workouts engineered to optimize glucose sensitivity without elevating adrenal stress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('What workout is ideal for my follicular phase today?')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask Fitness Coach</span>
        </button>
      </div>

      {/* Routine Cards */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <h2 className="text-base font-bold font-display text-[#1C1326]">
          Suggested Routines for Today
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routines.map((r, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C1326]">{r.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B]">
                    {r.intensity}
                  </span>
                </div>
                <p className="text-[11px] text-[#584B68]">{r.focus}</p>
              </div>

              <div className="pt-2 border-t border-[#E7DFEF] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#8E3EAF] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {r.duration}
                </span>

                <button
                  type="button"
                  onClick={() => openAiChatWithPrompt(`Guide me through the ${r.title}`)}
                  className="p-2 rounded-xl bg-white border border-[#E7DFEF] text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#6E2D8B]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default FitnessPage;
