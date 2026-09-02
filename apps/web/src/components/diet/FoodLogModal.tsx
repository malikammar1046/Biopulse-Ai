import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Plus,
  Utensils,
  Sun,
  Coffee,
  CupSoda,
  Moon,
  CheckCircle2,
} from 'lucide-react';
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
    setIsCustomMode(false);
    setSearchQuery(food.name);
    setServingUnit(food.standardServing);
    setCustomServingMultiplier(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let foodName = searchQuery;
    let calories = 0;
    let proteinG = 0;
    let carbsG = 0;
    let fatG = 0;
    let fiberG = 0;
    let serving = servingUnit;

    if (isCustomMode) {
      foodName = customFoodName.trim() || searchQuery || 'Custom Meal';
      calories = customCalories;
      proteinG = customProtein;
      carbsG = customCarbs;
      fatG = customFat;
      fiberG = customFiber;
      serving = servingUnit || '1 serving';
    } else if (selectedFood) {
      foodName = selectedFood.name;
      const mult = customServingMultiplier || 1;
      calories = Math.round(selectedFood.caloriesPerServing * mult);
      proteinG = Math.round(selectedFood.proteinGrams * mult * 10) / 10;
      carbsG = Math.round(selectedFood.carbsGrams * mult * 10) / 10;
      fatG = Math.round(selectedFood.fatGrams * mult * 10) / 10;
      fiberG = Math.round(selectedFood.fiberGrams * mult * 10) / 10;
      serving = mult === 1 ? selectedFood.standardServing : `${mult}x (${selectedFood.standardServing})`;
    } else {
      foodName = searchQuery.trim() || 'Logged Food';
      calories = 200;
      proteinG = 8;
      carbsG = 25;
      fatG = 6;
      fiberG = 3;
    }

    const payload: FoodLogInput = {
      mealType,
      foodName,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-[#E7DFEF] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-6 pb-4 border-b border-[#E7DFEF] flex items-center justify-between bg-[#FAF5FF]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B]">
                <Utensils className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold font-display text-[#1C1326]">
                  Log Food & Nourishment
                </h2>
                <p className="text-xs text-[#584B68]">
                  Record what you enjoyed today
                </p>
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-left">
            {/* 1. Meal Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8D7E9E] block">
                Select Meal
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { key: 'breakfast', label: 'Breakfast', icon: <Sun className="w-3.5 h-3.5" /> },
                  { key: 'morning_snack', label: 'M. Snack', icon: <Coffee className="w-3.5 h-3.5" /> },
                  { key: 'lunch', label: 'Lunch', icon: <Utensils className="w-3.5 h-3.5" /> },
                  { key: 'afternoon_snack', label: 'A. Snack', icon: <CupSoda className="w-3.5 h-3.5" /> },
                  { key: 'dinner', label: 'Dinner', icon: <Moon className="w-3.5 h-3.5" /> },
                ].map((item) => {
                  const isSelected = mealType === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMealType(item.key as MealType)}
                      className={`p-2.5 rounded-2xl text-xs font-bold font-sans flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#6E2D8B] text-white border-[#6E2D8B] shadow-md shadow-purple-950/20'
                          : 'bg-[#F8F5FA] text-[#584B68] border-[#E7DFEF] hover:bg-[#FAF5FF]'
                      }`}
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
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8D7E9E]">
                  Search Pakistani & Familiar Foods
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(!isCustomMode);
                    setSelectedFood(null);
                  }}
                  className="text-xs font-bold text-[#6E2D8B] hover:underline cursor-pointer"
                >
                  {isCustomMode ? '← Back to Search' : '+ Custom Food'}
                </button>
              </div>

              {!isCustomMode ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8D7E9E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Roti, Moong Daal, Chicken Tikka, Chana..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-sans text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Autocomplete list */}
                  <div className="max-h-40 overflow-y-auto border border-[#E7DFEF] rounded-2xl divide-y divide-[#F5F0FA] bg-white">
                    {filteredFoods.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFood(f)}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-[#FAF5FF] transition-all cursor-pointer ${
                          selectedFood?.id === f.id ? 'bg-[#EDE4F7] font-bold text-[#6E2D8B]' : 'text-[#1C1326]'
                        }`}
                      >
                        <div>
                          <span className="font-semibold">{f.name}</span>
                          {f.urduName && (
                            <span className="text-[10px] text-[#8D7E9E] ml-2 font-mono">
                              ({f.urduName})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[#8E3EAF] font-bold">
                          {f.caloriesPerServing} kcal
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Custom Food Manual Entry */
                <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#8D7E9E]">Food Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Homemade Pulao with Raita"
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7DFEF] text-xs font-sans text-[#1C1326] focus:border-[#8E3EAF] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-[#8D7E9E]">Calories</label>
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => setCustomCalories(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#8D7E9E]">Protein (g)</label>
                      <input
                        type="number"
                        value={customProtein}
                        onChange={(e) => setCustomProtein(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#8D7E9E]">Carbs (g)</label>
                      <input
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#8D7E9E]">Fats (g)</label>
                      <input
                        type="number"
                        value={customFat}
                        onChange={(e) => setCustomFat(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#8D7E9E]">Fiber (g)</label>
                      <input
                        type="number"
                        value={customFiber}
                        onChange={(e) => setCustomFiber(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Serving Size Presets */}
            {selectedFood && (
              <div className="p-4 rounded-2xl bg-[#EDE4F7]/40 border border-[#D8B4FE]/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-[#6E2D8B]">
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
                            ? 'bg-[#6E2D8B] text-white'
                            : 'bg-white text-[#584B68] border border-[#E7DFEF]'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#584B68]">
                  <span>Energy: {Math.round(selectedFood.caloriesPerServing * customServingMultiplier)} kcal</span>
                  <span>Protein: {Math.round(selectedFood.proteinGrams * customServingMultiplier * 10) / 10}g</span>
                  <span>Fiber: {Math.round(selectedFood.fiberGrams * customServingMultiplier * 10) / 10}g</span>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8D7E9E]">Optional Notes</label>
              <input
                type="text"
                placeholder="e.g. cooked with minimal oil, accompanied by dahi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-sans text-[#1C1326] focus:bg-white focus:border-[#8E3EAF] focus:outline-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DFEF]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-[#E7DFEF] text-xs font-bold text-[#584B68] hover:bg-[#FAF5FF] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-purple-950/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {successToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Logged!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#FDA4AF]" />
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
