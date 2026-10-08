import React, { useState } from 'react';
import { X, Utensils, Clock, ChevronDown, Check } from 'lucide-react';
import type { MealType } from '../../types/nutrition';

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal: (mealData: {
    meal_type: MealType;
    food_name: string;
    portion_description?: string;
    logged_at?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    notes?: string;
  }) => Promise<void>;
  isMale: boolean;
  initialMealType?: MealType;
  initialDishName?: string;
  initialCalories?: number;
  initialProtein?: number;
  initialCarbs?: number;
  initialFat?: number;
}

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

export const LogMealModal: React.FC<LogMealModalProps> = ({
  isOpen,
  onClose,
  onLogMeal,
  isMale,
  initialMealType = 'lunch',
  initialDishName = '',
  initialCalories,
  initialProtein,
  initialCarbs,
  initialFat,
}) => {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [foodName, setFoodName] = useState<string>(initialDishName);
  const [portion, setPortion] = useState<string>('1 standard serving');
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [showAdvancedNutrition, setShowAdvancedNutrition] = useState<boolean>(
    Boolean(initialCalories || initialProtein)
  );
  const [calories, setCalories] = useState<string>(initialCalories ? String(initialCalories) : '');
  const [protein, setProtein] = useState<string>(initialProtein ? String(initialProtein) : '');
  const [carbs, setCarbs] = useState<string>(initialCarbs ? String(initialCarbs) : '');
  const [fat, setFat] = useState<string>(initialFat ? String(initialFat) : '');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setError('Please enter what you ate.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const [hours, mins] = time.split(':');
      if (hours && mins) {
        now.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
      }

      await onLogMeal({
        meal_type: mealType,
        food_name: foodName.trim(),
        portion_description: portion.trim() || undefined,
        logged_at: now.toISOString(),
        calories: calories ? parseFloat(calories) : undefined,
        protein_g: protein ? parseFloat(protein) : undefined,
        carbs_g: carbs ? parseFloat(carbs) : undefined,
        fat_g: fat ? parseFloat(fat) : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to log meal:', err);
      setError(err?.message || 'Failed to save food log.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]';
  const accentBorder = isMale ? 'border-[#0868B9]' : 'border-[#0E9EAA]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D7EAF2] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl ${accentColor} text-white`}>
              <Utensils className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#073B72]">Log Food / Meal</h2>
              <p className="text-xs text-slate-500">Track what you actually ate today</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Meal Type Selection */}
          <div>
            <label className="block text-xs font-bold text-[#073B72] mb-1.5">Meal Window</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((t) => {
                const isSelected = mealType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMealType(t.id)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      isSelected
                        ? `${accentBorder} bg-[#F5FBFD] font-bold text-[#073B72] shadow-xs`
                        : 'border-[#D7EAF2] text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dish Name */}
          <div>
            <label htmlFor="dish-input" className="block text-xs font-bold text-[#073B72] mb-1">
              Food / Dish Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="dish-input"
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Chicken biryani, daal with chapati, apple"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D7EAF2] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
              required
            />
          </div>

          {/* Portion Description & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="portion-input" className="block text-xs font-bold text-[#073B72] mb-1">
                Portion / Serving
              </label>
              <input
                id="portion-input"
                type="text"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="e.g. 1 plate, 1 bowl, 2 chapatis"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D7EAF2] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
              />
            </div>

            <div>
              <label htmlFor="time-input" className="block text-xs font-bold text-[#073B72] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time Eaten</span>
              </label>
              <input
                id="time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D7EAF2] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
              />
            </div>
          </div>

          {/* Toggle Nutrition Details */}
          <div className="pt-2 border-t border-[#D7EAF2]">
            <button
              type="button"
              onClick={() => setShowAdvancedNutrition(!showAdvancedNutrition)}
              className="text-xs font-semibold text-slate-600 hover:text-[#073B72] flex items-center gap-1"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showAdvancedNutrition ? 'rotate-180' : ''
                }`}
              />
              <span>{showAdvancedNutrition ? 'Hide' : 'Add'} Nutrition Values (Optional)</span>
            </button>

            {showAdvancedNutrition && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-[#D7EAF2] space-y-3">
                <p className="text-[11px] text-slate-500">
                  Leave blank if unknown. BioPulse never fabricates nutritional values.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Calories</label>
                    <input
                      type="number"
                      placeholder="kcal"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D7EAF2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Protein</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D7EAF2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Carbs</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D7EAF2] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Fat</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D7EAF2] bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes-input" className="block text-xs font-bold text-[#073B72] mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ate at university cafeteria, felt energetic after"
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#D7EAF2] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs ${accentColor} hover:opacity-95`}
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Food Log</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
