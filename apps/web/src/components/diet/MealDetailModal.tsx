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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-[#E7DFEF] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#E7DFEF] flex items-center justify-between bg-gradient-to-r from-[#FAF5FF] to-[#FDF2F8]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B]">
                <Utensils className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8E3EAF] block">
                  {meal.mealType} Recipe & Guidance
                </span>
                <h2 className="text-lg font-bold font-display text-[#1C1326]">
                  {meal.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#8D7E9E] hover:text-[#1C1326] hover:bg-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-left">
            {/* Quick Nutrition Pills */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]">
                <span className="text-[10px] font-mono text-[#8D7E9E] block">Calories</span>
                <span className="text-sm font-bold font-mono text-[#1C1326]">{meal.calories}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#EDE4F7]/40 border border-[#D8B4FE]/40">
                <span className="text-[10px] font-mono text-[#6E2D8B] block">Protein</span>
                <span className="text-sm font-bold font-mono text-[#6E2D8B]">{meal.proteinG}g</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FDF2F8] border border-[#FCE7F3]">
                <span className="text-[10px] font-mono text-[#BE185D] block">Carbs</span>
                <span className="text-sm font-bold font-mono text-[#BE185D]">{meal.carbsG}g</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A]">
                <span className="text-[10px] font-mono text-[#B45309] block">Fiber</span>
                <span className="text-sm font-bold font-mono text-[#B45309]">{meal.fiberG}g</span>
              </div>
            </div>

            {/* Why this was suggested */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5FF] to-[#FDF2F8] border border-[#EDE4F7] space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6E2D8B] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Why this was suggested</span>
              </span>
              <p className="text-xs text-[#584B68] leading-relaxed">
                {meal.whyItWorks}
              </p>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-[#8D7E9E] tracking-wider block">
                Ingredients & Measurements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meal.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs text-[#1C1326] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8E3EAF]" />
                    <span>{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simple Prep Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#8D7E9E] tracking-wider">
                  Simple Preparation
                </span>
                <span className="text-xs font-mono text-[#8E3EAF] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{meal.prepTimeMinutes} mins</span>
                </span>
              </div>

              <div className="space-y-2">
                {meal.simpleSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-[#3E3050] leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] font-mono font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Serving advice */}
            <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs text-[#584B68] space-y-1">
              <span className="font-semibold text-[#1C1326] block">Portion Guidance:</span>
              <p>{meal.approxServing}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-[#E7DFEF] flex items-center justify-end gap-3 bg-[#FAF5FF]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-[#E7DFEF] text-xs font-bold text-[#584B68] hover:bg-white transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onLogMeal(meal);
                onClose();
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white text-xs font-bold hover:brightness-110 shadow-md shadow-purple-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
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
