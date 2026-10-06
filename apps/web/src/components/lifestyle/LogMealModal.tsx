import React, { useState, useEffect } from 'react';
import { X, Check, Utensils, AlertCircle } from 'lucide-react';
import { nutritionService } from '../../services/nutritionService';
import type { FoodLogItem, SingleMeal } from '../../types/nutrition';

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodLogged: (loggedItem: FoodLogItem) => void;
  plannedMeal?: SingleMeal | null;
  dayName?: string;
  isMale?: boolean;
}

export const LogMealModal: React.FC<LogMealModalProps> = ({
  isOpen,
  onClose,
  onFoodLogged,
  plannedMeal,
  dayName,
  isMale = false,
}) => {
  const [mealType, setMealType] = useState<string>('Lunch');
  const [foodName, setFoodName] = useState<string>('');
  const [serving, setServing] = useState<string>('1 serving');
  const [calories, setCalories] = useState<string>('');
  const [proteinG, setProteinG] = useState<string>('');
  const [carbsG, setCarbsG] = useState<string>('');
  const [fatG, setFatG] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (plannedMeal) {
      setMealType(plannedMeal.role || 'Lunch');
      setFoodName(plannedMeal.title || '');
      setServing('1 planned portion');
      setCalories(plannedMeal.energy_kcal ? String(Math.round(plannedMeal.energy_kcal)) : '');
      setProteinG(plannedMeal.protein_g ? String(Math.round(plannedMeal.protein_g)) : '');
      setCarbsG(plannedMeal.carbohydrate_g ? String(Math.round(plannedMeal.carbohydrate_g)) : '');
      setFatG(plannedMeal.fat_g ? String(Math.round(plannedMeal.fat_g)) : '');
      setNotes(dayName ? `From ${dayName} plan` : 'Planned meal');
    } else {
      setMealType('Lunch');
      setFoodName('');
      setServing('1 serving');
      setCalories('');
      setProteinG('');
      setCarbsG('');
      setFatG('');
      setNotes('');
    }
  }, [isOpen, plannedMeal, dayName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setError('Please specify a dish or food name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const item = await nutritionService.logFood({
        meal_type: mealType,
        food_name: foodName.trim(),
        serving: serving.trim() || '1 serving',
        calories: calories ? parseFloat(calories) : undefined,
        protein_g: proteinG ? parseFloat(proteinG) : undefined,
        carbs_g: carbsG ? parseFloat(carbsG) : undefined,
        fat_g: fatG ? parseFloat(fatG) : undefined,
        notes: notes.trim(),
        logged_at: now,
      });

      onFoodLogged(item);
      onClose();
    } catch (err: any) {
      console.error('Failed to log food:', err);
      setError(err?.message || 'Failed to save food log.');
    } finally {
      setLoading(false);
    }
  };

  const primaryBtnClass = isMale
    ? 'bg-[#0868B9] hover:bg-[#07599c] text-white'
    : 'bg-[#0E9EAA] hover:bg-[#0b828c] text-white';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#D7EAF2] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isMale ? 'bg-sky-100 text-[#0868B9]' : 'bg-teal-100 text-[#0E9EAA]'
              }`}
            >
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#073B72]">
                {plannedMeal ? 'Log Planned Meal' : 'Log a Meal'}
              </h2>
              <p className="text-[11px] text-[#55718F]">
                {plannedMeal ? 'Confirm portion and record to history' : 'Record what you actually ate'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Meal Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
              Meal Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition ${
                    mealType === type
                      ? isMale
                        ? 'bg-sky-50 border border-[#0868B9] text-[#0868B9]'
                        : 'bg-teal-50 border border-[#0E9EAA] text-[#0E9EAA]'
                      : 'bg-white border border-[#D7EAF2] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Food / Dish Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
              Food / Dish Name
            </label>
            <input
              type="text"
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Daal Chana with Roti, Chicken Biryani"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden focus:border-[#0E9EAA]"
            />
          </div>

          {/* Portion Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
              Portion / Serving Size
            </label>
            <input
              type="text"
              value={serving}
              onChange={(e) => setServing(e.target.value)}
              placeholder="e.g. 1 plate, 1 bowl, 2 roti"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden focus:border-[#0E9EAA]"
            />
          </div>

          {/* Optional Calories & Macros (no fake precision) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#55718F]">
                Nutritional Values
              </label>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Calories</span>
                <input
                  type="number"
                  placeholder="kcal"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Protein</span>
                <input
                  type="number"
                  placeholder="g"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Carbs</span>
                <input
                  type="number"
                  placeholder="g"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Fat</span>
                <input
                  type="number"
                  placeholder="g"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#55718F] block">
              Notes / Context
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ate at university, felt energized"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D7EAF2] focus:outline-hidden"
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 ${primaryBtnClass} ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Meal Log
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
