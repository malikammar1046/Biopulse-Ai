import React, { useState } from 'react';
import {
  Flame,
  Lock,
  Unlock,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  Utensils,
  Sparkles,
} from 'lucide-react';
import type { SingleMeal } from '../../types/nutrition';

interface MealCardProps {
  meal: SingleMeal;
  dayIndex: number;
  dayName: string;
  planId: string;
  isMale: boolean;
  isLoggedToday: boolean;
  onMarkAsEaten: (meal: SingleMeal) => Promise<void>;
  onSwapClick: (meal: SingleMeal) => void;
  onToggleLock: (mealRole: string, locked: boolean) => Promise<void>;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  dayIndex: _dayIndex,
  dayName: _dayName,
  planId: _planId,
  isMale,
  isLoggedToday,
  onMarkAsEaten,
  onSwapClick,
  onToggleLock,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [logging, setLogging] = useState<boolean>(false);
  const [locking, setLocking] = useState<boolean>(false);

  const isLocked = Boolean(meal.is_locked);

  const handleEatenClick = async () => {
    if (isLoggedToday) return;
    setLogging(true);
    try {
      await onMarkAsEaten(meal);
    } catch (err) {
      console.error('Failed to mark meal as eaten:', err);
    } finally {
      setLogging(false);
    }
  };

  const handleLockClick = async () => {
    setLocking(true);
    try {
      await onToggleLock(meal.role, !isLocked);
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    } finally {
      setLocking(false);
    }
  };

  const roleColor =
    meal.role.toUpperCase() === 'BREAKFAST'
      ? 'bg-amber-100 text-amber-800'
      : meal.role.toUpperCase() === 'LUNCH'
      ? 'bg-emerald-100 text-emerald-800'
      : meal.role.toUpperCase() === 'DINNER'
      ? 'bg-indigo-100 text-indigo-800'
      : 'bg-purple-100 text-purple-800';

  const accentColor = isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]';

  return (
    <div
      className={`rounded-2xl border transition-all bg-white overflow-hidden shadow-xs ${
        isLocked
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-[#D7EAF2] hover:border-slate-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Header Row: Role, Lock Status, Calorie Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${roleColor}`}>
              {meal.role}
            </span>
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
            {isLoggedToday && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3" />
                <span>Logged</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>~{Math.round(meal.energy_kcal)} kcal</span>
          </div>
        </div>

        {/* Dish Title & Description */}
        <div className="mt-2.5">
          <h3 className="text-sm sm:text-base font-bold text-[#073B72] leading-snug">
            {meal.title}
          </h3>
          {meal.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {meal.description}
            </p>
          )}
        </div>

        {/* Macronutrient Pills */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-600 font-medium">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Protein: <strong className="text-slate-800">{Math.round(meal.protein_g)}g</strong></span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Carbs: <strong className="text-slate-800">{Math.round(meal.carbohydrate_g)}g</strong></span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Fat: <strong className="text-slate-800">{Math.round(meal.fat_g)}g</strong></span>
          </span>
        </div>

        {/* Items Breakdown list */}
        {meal.items && meal.items.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
            {meal.items.map((item, idx) => (
              <span
                key={`${item.entity_id}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium"
              >
                <span>{item.display_name}</span>
                {item.grams > 0 && (
                  <span className="text-slate-400">({Math.round(item.grams)}g)</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Expandable Clinical & Preparation Details */}
        {expanded && (
          <div className="mt-3.5 pt-3.5 border-t border-[#D7EAF2] space-y-2.5 text-xs">
            {meal.why_this_meal && (
              <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] text-slate-700">
                <span className="font-bold text-[#073B72] flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#16B8C4]" />
                  <span>Why this meal?</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{meal.why_this_meal}</p>
              </div>
            )}

            {meal.safe_substitutions && meal.safe_substitutions.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-[#D7EAF2] text-slate-700">
                <span className="font-bold text-slate-800 text-[11px] block mb-1">
                  Safe Substitutions:
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  {meal.safe_substitutions.map((sub, i) => (
                    <li key={i}>{sub}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1">
            {/* Mark as Eaten Button */}
            <button
              type="button"
              onClick={handleEatenClick}
              disabled={isLoggedToday || logging}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isLoggedToday
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                  : `${accentColor} text-white shadow-xs hover:opacity-95`
              }`}
            >
              {logging ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isLoggedToday ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Utensils className="w-3.5 h-3.5" />
              )}
              <span>{isLoggedToday ? 'Marked Eaten' : 'Log as Eaten'}</span>
            </button>

            {/* Swap Meal Button */}
            <button
              type="button"
              onClick={() => onSwapClick(meal)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#073B72] hover:bg-slate-100 transition-colors"
              title="Replace with safe culturally-appropriate candidate"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">Swap</span>
            </button>

            {/* Lock / Unlock Button */}
            <button
              type="button"
              onClick={handleLockClick}
              disabled={locking}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isLocked
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title={isLocked ? 'Unlock meal' : 'Lock meal to preserve during regeneration'}
            >
              {isLocked ? (
                <Lock className="w-3 h-3 text-amber-700" />
              ) : (
                <Unlock className="w-3 h-3 text-slate-400" />
              )}
              <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Lock'}</span>
            </button>
          </div>

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title={expanded ? 'Collapse details' : 'View ingredients & why this meal'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
