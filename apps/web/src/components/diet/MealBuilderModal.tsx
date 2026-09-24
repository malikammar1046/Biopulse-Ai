import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XClose,
  Sliders01,
  Clock,
  Scales01,
  Plus,
} from '@untitledui/icons';
import type { MealType, MealBuilderFilters, BuildMealResult } from '../../types/diet';
import { dietService } from '../../services/dietService';

interface MealBuilderModalProps {
  isOpen: boolean;
  userPreference?: string;
  userAllergies?: string[];
  onClose: () => void;
  onSelectAndLog: (meal: BuildMealResult) => void;
}

export const MealBuilderModal: React.FC<MealBuilderModalProps> = ({
  isOpen,
  userPreference = 'Non-Vegetarian / Halal',
  userAllergies = [],
  onClose,
  onSelectAndLog,
}) => {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [budget, setBudget] = useState<'low' | 'medium' | 'flexible'>('low');
  const [cookingTime, setCookingTime] = useState<'10' | '20' | '30+'>('20');
  const [mainIngredient, setMainIngredient] = useState<string>('Daal / Lentils');

  const [generatedResults, setGeneratedResults] = useState<BuildMealResult[]>(() => {
    return dietService.buildCustomMeal(
      { mealType: 'lunch', budget: 'low', cookingTime: '20', mainIngredient: 'Daal' },
      userAllergies
    );
  });

  const handleGenerate = () => {
    const filters: MealBuilderFilters = {
      mealType,
      budget,
      cookingTime,
      mainIngredient,
      dietPreference: userPreference,
    };
    const results = dietService.buildCustomMeal(filters, userAllergies);
    setGeneratedResults(results);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#BAE6FD] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F0F9FF]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
                <Scales01 className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  Build My Meal
                </h2>
                <p className="text-xs text-[#64748B]">
                  Generate Pakistani meals customized to your kitchen, budget & time
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#E0F2FE] transition-all cursor-pointer"
              aria-label="Close dialog"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-left">
            {/* Filter Controls */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Meal Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-[#64748B]">
                    Meal Slot
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-sans font-semibold text-[#0F172A] focus:border-[#0288D1] focus:outline-none"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="morning_snack">Morning Snack</option>
                    <option value="afternoon_snack">Afternoon Snack</option>
                  </select>
                </div>

                {/* Main Ingredient */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-[#64748B]">
                    Main Staple
                  </label>
                  <select
                    value={mainIngredient}
                    onChange={(e) => setMainIngredient(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-sans font-semibold text-[#0F172A] focus:border-[#0288D1] focus:outline-none"
                  >
                    <option value="Daal">Daal / Lentils</option>
                    <option value="Chicken">Chicken (Halal)</option>
                    <option value="Eggs">Eggs</option>
                    <option value="Paneer">Paneer / Dahi</option>
                    <option value="Chana">Chana / Chickpeas</option>
                    <option value="Fish">Fish / Machhli</option>
                    <option value="Vegetable">Subzi / Greens</option>
                  </select>
                </div>

                {/* Budget */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-[#64748B]">
                    Budget
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-sans font-semibold text-[#0F172A] focus:border-[#0288D1] focus:outline-none"
                  >
                    <option value="low">Budget-Friendly (Low)</option>
                    <option value="medium">Standard (Medium)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                {/* Cooking Time */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-[#64748B]">
                    Prep Time
                  </label>
                  <select
                    value={cookingTime}
                    onChange={(e) => setCookingTime(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-sans font-semibold text-[#0F172A] focus:border-[#0288D1] focus:outline-none"
                  >
                    <option value="10">10 mins (Quick)</option>
                    <option value="20">20 mins (Moderate)</option>
                    <option value="30+">30+ mins (Complete)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-5 py-2 rounded-xl bg-[#0288D1] text-white text-xs font-bold hover:bg-[#0277BD] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders01 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Generate Recipes</span>
                </button>
              </div>
            </div>

            {/* Generated Results */}
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                Suggested Pakistani Recipes ({generatedResults.length})
              </span>

              <div className="space-y-4">
                {generatedResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-5 rounded-xl bg-white border border-[#BAE6FD] hover:border-[#0288D1] shadow-none space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A]">
                          {result.title}
                        </h3>
                        {result.urduTitle && (
                          <span className="text-[11px] font-mono text-[#0288D1]">
                            {result.urduTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#F8FAFC] text-[#0F172A] font-bold">
                          {result.calories} kcal
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#E0F2FE] text-[#01579B] font-bold">
                          {result.proteinG}g Protein
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#475569] leading-relaxed">
                      {result.description}
                    </p>

                    {/* Ingredients preview */}
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] space-y-1">
                      <span className="font-semibold text-[#0288D1] block">Ingredients Needed:</span>
                      <p className="text-[#475569]">{result.ingredients.join(' • ')}</p>
                    </div>

                    {/* Footer Guidance & Quick Log */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                          <span>{result.cookingTimeMinutes}m</span>
                        </span>
                        <span>•</span>
                        <span className="capitalize">{result.budgetCategory} budget</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectAndLog(result);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Log This Meal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
