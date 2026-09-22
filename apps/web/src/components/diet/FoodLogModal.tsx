import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XClose,
  SearchLg,
  Plus,
  Scales01,
  Sunrise,
  Sun,
  Sunset,
  Moon01,
  CheckCircle,
} from '@untitledui/icons';
import type { MealType, FoodLogInput, FoodItem } from '../../types/diet';
import { PAKISTANI_FOOD_DATABASE } from '../../data/pakistaniFoodDatabase';

interface FoodLogModalProps {
  isOpen: boolean;
  initialMealType?: MealType;
  initialFoodName?: string;
  onClose: () => void;
  onSaveLog: (input: FoodLogInput) => Promise<{ success: boolean; error?: string }>;
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({
  isOpen,
  initialMealType = 'breakfast',
  initialFoodName = '',
  onClose,
  onSaveLog,
}) => {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [searchQuery, setSearchQuery] = useState(initialFoodName);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingUnit, setServingUnit] = useState<string>('1 serving');
  const [customServingMultiplier, setCustomServingMultiplier] = useState<number>(1);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customCalories, setCustomCalories] = useState<number>(250);
  const [customProtein, setCustomProtein] = useState<number>(12);
  const [customCarbs, setCustomCarbs] = useState<number>(30);
  const [customFat, setCustomFat] = useState<number>(8);
  const [customFiber, setCustomFiber] = useState<number>(4);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Search filtered foods
  const filteredFoods = PAKISTANI_FOOD_DATABASE.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.urduName && f.urduName.includes(q)) ||
      f.category.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setServingUnit(food.standardServing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const title = isCustomMode
      ? customFoodName.trim() || 'Custom Pakistani Food'
      : selectedFood?.name || searchQuery.trim() || 'Logged Food';

    const calories = isCustomMode
      ? customCalories
      : selectedFood
      ? Math.round(selectedFood.caloriesPerServing * customServingMultiplier)
      : 200;

    const proteinG = isCustomMode
      ? customProtein
      : selectedFood
      ? Math.round(selectedFood.proteinGrams * customServingMultiplier)
      : 8;

    const carbsG = isCustomMode
      ? customCarbs
      : selectedFood
      ? Math.round(selectedFood.carbsGrams * customServingMultiplier)
      : 25;

    const fatG = isCustomMode
      ? customFat
      : selectedFood
      ? Math.round(selectedFood.fatGrams * customServingMultiplier)
      : 6;

    const fiberG = isCustomMode
      ? customFiber
      : selectedFood
      ? Math.round(selectedFood.fiberGrams * customServingMultiplier)
      : 3;

    const mult = customServingMultiplier || 1;
    const serving = isCustomMode
      ? servingUnit || '1 serving'
      : selectedFood
      ? mult === 1 ? selectedFood.standardServing : `${mult}x (${selectedFood.standardServing})`
      : '1 serving';

    const payload: FoodLogInput = {
      mealType,
      foodName: title,
      serving,
      calories,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      notes,
    };

    const res = await onSaveLog(payload);
    setSubmitting(false);

    if (res.success) {
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-[#BAE6FD] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F0F9FF]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
                <Scales01 className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">
                  Log Food & Nourishment
                </h2>
                <p className="text-xs text-[#64748B]">
                  Record nutritional items enjoyed today
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left">
            {/* 1. Meal Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B] block">
                Select Meal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'breakfast', label: 'Breakfast', icon: <Sunrise className="w-3.5 h-3.5" aria-hidden="true" /> },
                  { key: 'morning_snack', label: 'M. Snack', icon: <Sun className="w-3.5 h-3.5" aria-hidden="true" /> },
                  { key: 'lunch', label: 'Lunch', icon: <Scales01 className="w-3.5 h-3.5" aria-hidden="true" /> },
                  { key: 'afternoon_snack', label: 'A. Snack', icon: <Sunset className="w-3.5 h-3.5" aria-hidden="true" /> },
                  { key: 'dinner', label: 'Dinner', icon: <Moon01 className="w-3.5 h-3.5" aria-hidden="true" /> },
                ].map((item) => {
                  const isSelected = mealType === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMealType(item.key as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#E0F2FE] border-[#0288D1] text-[#01579B] font-bold shadow-xs'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white hover:border-[#CBD5E1]'
                      } ${item.key === 'dinner' ? 'col-span-2 sm:col-span-1' : ''}`}
                    >
                      {item.icon}
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Food Search or Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  Search Pakistani & Familiar Foods
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(!isCustomMode);
                    setSelectedFood(null);
                  }}
                  className="text-xs font-semibold text-[#0288D1] hover:underline cursor-pointer"
                >
                  {isCustomMode ? '← Back to Search' : '+ Custom Food'}
                </button>
              </div>

              {!isCustomMode ? (
                <div className="space-y-2">
                  <div className="relative">
                    <SearchLg className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="e.g. Roti, Moong Daal, Chicken Tikka, Chana..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-sans text-[#0F172A] focus:bg-white focus:border-[#0288D1] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Autocomplete list */}
                  <div className="max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] bg-white">
                    {filteredFoods.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFood(f)}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-[#F0F9FF] transition-all cursor-pointer ${
                          selectedFood?.id === f.id ? 'bg-[#E0F2FE] font-bold text-[#01579B]' : 'text-[#0F172A]'
                        }`}
                      >
                        <div>
                          <span className="font-semibold">{f.name}</span>
                          {f.urduName && (
                            <span className="text-[10px] text-[#64748B] ml-2 font-mono">
                              ({f.urduName})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[#0288D1] font-bold">
                          {f.caloriesPerServing} kcal
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Custom Food Manual Entry */
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#64748B]">Food Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Homemade Pulao with Raita"
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-sans text-[#0F172A] focus:border-[#0288D1] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B]">Calories</label>
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B]">Protein (g)</label>
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B]">Carbs (g)</label>
                      <input
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B]">Fats (g)</label>
                      <input
                        type="number"
                        value={customFat}
                        onChange={(e) => setCustomFat(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B]">Fiber (g)</label>
                      <input
                        type="number"
                        value={customFiber}
                        onChange={(e) => setCustomFiber(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Serving Size Presets */}
            {selectedFood && (
              <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-[#01579B]">
                    Serving Portion: {selectedFood.standardServing}
                  </span>
                  <div className="flex items-center gap-1">
                    {[0.5, 1, 1.5, 2].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCustomServingMultiplier(num)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          customServingMultiplier === num
                            ? 'bg-[#0288D1] text-white'
                            : 'bg-white text-[#475569] border border-[#E2E8F0]'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#475569]">
                  <span>Energy: {Math.round(selectedFood.caloriesPerServing * customServingMultiplier)} kcal</span>
                  <span>Protein: {Math.round(selectedFood.proteinGrams * customServingMultiplier * 10) / 10}g</span>
                  <span>Fiber: {Math.round(selectedFood.fiberGrams * customServingMultiplier * 10) / 10}g</span>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#64748B]">Optional Notes</label>
              <input
                type="text"
                placeholder="e.g. cooked with minimal oil, accompanied by dahi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-sans text-[#0F172A] focus:bg-white focus:border-[#0288D1] focus:outline-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {successToast ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" aria-hidden="true" />
                    <span>Logged!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#E0F2FE]" aria-hidden="true" />
                    <span>Save to Today’s Log</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
