import React, { useState } from 'react';
import { X, RefreshCw, ShieldCheck, Check } from 'lucide-react';
import type { SingleMeal } from '../../types/nutrition';

interface MealSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: SingleMeal | null;
  dayIndex: number;
  dayName: string;
  planId: string;
  onSwapMeal: (planId: string, dayIndex: number, mealRole: string, customDish?: string) => Promise<void>;
  isMale: boolean;
  userAllergies?: string[];
}

const POPULAR_PAKISTANI_SWAP_CANDIDATES = [
  { name: 'Daal Masoor Curry', desc: 'Protein & fiber rich red lentil curry', role: 'lunch_dinner' },
  { name: 'Chicken Curry', desc: 'Lean poultry with gentle aromatic spices', role: 'lunch_dinner' },
  { name: 'Chicken Tikka', desc: 'Marinated lean chicken breast, low refined fat', role: 'lunch_dinner' },
  { name: 'Kalool (Kidney Bean Curry)', desc: 'High prebiotic fiber legume preparation', role: 'lunch_dinner' },
  { name: 'Chapal Kabab', desc: 'Traditional spiced patty with coriander and tomatoes', role: 'lunch_dinner' },
  { name: 'Machli (Spiced Fish)', desc: 'Omega-3 fatty acid rich grilled/pan fish', role: 'lunch_dinner' },
  { name: 'Chana Masala', desc: 'Chickpea curry with ginger and whole spices', role: 'lunch_dinner' },
  { name: 'Kofta Gravy', desc: 'Minced lean meatballs in tomato gravy', role: 'lunch_dinner' },
  { name: 'Standard Chapati & Mixed Sabzi', desc: 'Whole wheat flatbread with seasonal vegetables', role: 'lunch_dinner' },
  { name: 'Oats with Boiled Egg', desc: 'Complex low-GI oats paired with quality egg protein', role: 'breakfast' },
  { name: 'Spiced Omelette with Chapati', desc: 'Egg with onions, green chilies and whole wheat', role: 'breakfast' },
  { name: 'Yogurt with Nuts & Seeds', desc: 'Protein-rich curd with healthy unsaturated fats', role: 'snack' },
];

export const MealSwapModal: React.FC<MealSwapModalProps> = ({
  isOpen,
  onClose,
  meal,
  dayIndex,
  dayName,
  planId,
  onSwapMeal,
  isMale,
  userAllergies = [],
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [customDish, setCustomDish] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !meal) return null;

  const roleLower = meal.role.toLowerCase();
  const relevantCandidates = POPULAR_PAKISTANI_SWAP_CANDIDATES.filter((c) => {
    if (roleLower === 'breakfast') return c.role === 'breakfast';
    if (roleLower === 'snack') return c.role === 'snack';
    return c.role === 'lunch_dinner';
  });

  const handleConfirmSwap = async () => {
    setSubmitting(true);
    setError(null);

    const targetDish = useCustom ? customDish.trim() : selectedCandidate;

    if (useCustom) {
      if (!targetDish) {
        setError('Please enter a dish name.');
        setSubmitting(false);
        return;
      }
      // Basic allergy safety check on custom input
      const conflict = userAllergies.find((a) => targetDish.toLowerCase().includes(a.toLowerCase()));
      if (conflict) {
        setError(`This custom dish may contain declared allergen: ${conflict.toUpperCase()}`);
        setSubmitting(false);
        return;
      }
    }

    try {
      await onSwapMeal(planId, dayIndex, meal.role, targetDish || undefined);
      onClose();
    } catch (err: any) {
      console.error('Failed to swap meal:', err);
      setError(err?.message || 'Failed to swap meal.');
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
              <RefreshCw className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#073B72]">Swap Meal</h2>
              <p className="text-xs text-slate-500">
                {dayName} • {meal.role.charAt(0) + meal.role.slice(1).toLowerCase()}
              </p>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Current Meal Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#D7EAF2] text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Current Planned Dish</span>
            <div className="font-bold text-[#073B72] mt-0.5 text-sm">{meal.title}</div>
            <div className="text-slate-500 text-[11px] mt-1">
              ~{meal.energy_kcal} kcal • Protein {meal.protein_g}g • Carbs {meal.carbohydrate_g}g • Fat {meal.fat_g}g
            </div>
          </div>

          {/* Toggle Candidate List vs Custom Dish */}
          <div className="flex items-center justify-between text-xs font-semibold pt-1">
            <span className="text-slate-700">Choose Safe Alternative:</span>
            <button
              type="button"
              onClick={() => {
                setUseCustom(!useCustom);
                setError(null);
              }}
              className="text-[#16B8C4] hover:underline cursor-pointer"
            >
              {useCustom ? 'Pick from recommendations' : 'Enter custom dish'}
            </button>
          </div>

          {!useCustom ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {relevantCandidates.map((c) => {
                const isSelected = selectedCandidate === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedCandidate(c.name)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between ${
                      isSelected
                        ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                        : 'border-[#D7EAF2] hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#073B72]">{c.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#16B8C4] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="custom-dish-input" className="block text-xs font-semibold text-slate-700">
                Custom Dish Name
              </label>
              <input
                id="custom-dish-input"
                type="text"
                value={customDish}
                onChange={(e) => setCustomDish(e.target.value)}
                placeholder="e.g. Daal Chana with brown rice"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D7EAF2] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
              />
              <p className="text-[11px] text-slate-500">
                Will be checked against your declared allergies before saving to your plan.
              </p>
            </div>
          )}

          <div className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] p-3 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All swaps respect your dietary preferences and target nutrient safety constraints.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D7EAF2]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSwap}
              disabled={submitting || (!useCustom && !selectedCandidate && relevantCandidates.length > 0)}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs ${accentColor} hover:opacity-95 disabled:opacity-50`}
            >
              {submitting ? (
                <span>Swapping...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Swap</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
