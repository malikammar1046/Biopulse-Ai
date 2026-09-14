import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Plus, Utensils, Sparkles } from 'lucide-react';
import type { PlannedMeal } from '../../types/diet';

interface MealDetailModalProps {
  meal: PlannedMeal | null;
  isOpen: boolean;
  onClose: () => void;
  onLogMeal: (meal: PlannedMeal) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  meal,
  isOpen,
  onClose,
  onLogMeal,
}) => {
  if (!isOpen || !meal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-[#BAE6FD] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F0F9FF]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
                <Utensils className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0288D1] block">
                  {meal.mealType} Recipe & Guidance
                </span>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  {meal.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#E0F2FE] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left">
            {/* Quick Nutrition Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] font-mono text-[#64748B] block">Calories</span>
                <span className="text-sm font-bold font-mono text-[#0F172A]">{meal.calories}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD]">
                <span className="text-[10px] font-mono text-[#01579B] block">Protein</span>
                <span className="text-sm font-bold font-mono text-[#01579B]">{meal.proteinG}g</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] font-mono text-[#0288D1] block">Carbs</span>
                <span className="text-sm font-bold font-mono text-[#0288D1]">{meal.carbsG}g</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] font-mono text-emerald-700 block">Fiber</span>
                <span className="text-sm font-bold font-mono text-emerald-800">{meal.fiberG}g</span>
              </div>
            </div>

            {/* Why this was suggested */}
            <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#0288D1] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Why this was suggested</span>
              </span>
              <p className="text-xs text-[#475569] leading-relaxed">
                {meal.whyItWorks}
              </p>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                Ingredients & Measurements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meal.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />
                    <span>{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simple Prep Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#64748B] tracking-wider">
                  Simple Preparation
                </span>
                <span className="text-xs font-mono text-[#0288D1] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{meal.prepTimeMinutes} mins</span>
                </span>
              </div>

              <div className="space-y-2">
                {meal.simpleSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-[#334155] leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#01579B] font-mono font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Serving advice */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] space-y-1">
              <span className="font-semibold text-[#0F172A] block">Portion Guidance:</span>
              <p>{meal.approxServing}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-[#E2E8F0] flex items-center justify-end gap-3 bg-[#F0F9FF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-white transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onLogMeal(meal);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-[#0288D1] text-white text-xs font-semibold hover:bg-[#0277BD] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log This Meal</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
