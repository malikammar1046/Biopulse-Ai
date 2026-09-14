import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Utensils,
  RefreshCw,
  Info,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { DailyNutritionPlan, WeeklyNutritionPlan } from '../../types/nutrition';
import { nutritionService } from '../../services/nutritionService';

interface WeeklyDietViewProps {
  userId?: string;
  onPlanGenerated?: (plan: WeeklyNutritionPlan) => void;
}

export const WeeklyDietView: React.FC<WeeklyDietViewProps> = ({ onPlanGenerated }) => {
  const [plan, setPlan] = useState<WeeklyNutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const active = await nutritionService.getCurrentPlan();
      setPlan(active);
      if (active && onPlanGenerated) {
        onPlanGenerated(active);
      }
    } catch (err: any) {
      console.warn('Error loading active nutrition plan:', err);
      setError(err.message || 'Unable to load current nutrition plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const newPlan = await nutritionService.regeneratePlan();
      setPlan(newPlan);
      setSelectedDayIndex(1);
      if (onPlanGenerated) {
        onPlanGenerated(newPlan);
      }
    } catch (err: any) {
      console.error('Failed to regenerate plan:', err);
      setError(err.message || 'Failed to regenerate plan.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleGenerateFirstPlan = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const newPlan = await nutritionService.generateWeeklyPlan();
      setPlan(newPlan);
      setSelectedDayIndex(1);
      if (onPlanGenerated) {
        onPlanGenerated(newPlan);
      }
    } catch (err: any) {
      console.error('Failed to generate plan:', err);
      setError(err.message || 'Failed to generate plan.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-[#BAE6FD] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0288D1] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#0F172A]">
          Loading your calibrated 7-day Pakistani meal plan...
        </p>
      </div>
    );
  }

  // Empty state: no plan generated yet
  if (!plan) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-[#BAE6FD] space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0288D1] flex items-center justify-center mx-auto shadow-sm">
          <Utensils className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-[#0F172A]">
            Your 7-Day Pakistani Meal Plan
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            No meal plan has been generated yet. Complete your nutrition profile and generate your first plan.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 max-w-md mx-auto">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={regenerating}
          onClick={handleGenerateFirstPlan}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {regenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Your 7-Day Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate 7-Day Plan</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const selectedDay: DailyNutritionPlan =
    plan.days.find((d) => d.day_index === selectedDayIndex) || plan.days[0];

  const hasDeviations =
    plan.status.includes('DEVIATION') || plan.days_with_deviations > 0;

  return (
    <div className="space-y-6 text-left select-none pb-8">
      {/* ── 1. HEADER CARD ── */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#01579B] text-white shadow-md border border-[#0288D1] relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/15 text-[#E0F2FE]">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Your 7-Day Pakistani Meal Plan
              </h2>
            </div>
            <p className="text-xs text-[#E0F2FE]">
              Calibrated from {plan.start_date} to {plan.end_date} • Generated{' '}
              {new Date(plan.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Pathway Context Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-xs font-semibold text-[#E0F2FE] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#81D4FA]" />
              <span>
                {plan.profile_context.condition_pathway === 'PCOS'
                  ? 'PCOS Pathway'
                  : plan.profile_context.condition_pathway === 'MALE_HYPOGONADISM'
                  ? 'Endocrine Pathway'
                  : 'General Wellness'}
              </span>
            </div>

            {/* Regenerate Button */}
            <button
              type="button"
              disabled={regenerating}
              onClick={handleRegenerate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#01579B] bg-white hover:bg-[#E0F2FE] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Regenerate your weekly meal plan"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`}
              />
              <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          </div>
        </div>

        {/* Target Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-0.5">
            <span className="text-[10px] font-mono text-[#E0F2FE] uppercase block">
              Energy Target
            </span>
            <span className="text-lg font-extrabold text-white">
              {Math.round(plan.targets.energy_kcal)} <span className="text-xs font-normal">kcal/day</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-0.5">
            <span className="text-[10px] font-mono text-[#E0F2FE] uppercase block">
              Protein Target
            </span>
            <span className="text-lg font-extrabold text-white">
              {Math.round(plan.targets.protein_g.min)}–{Math.round(plan.targets.protein_g.max)}{' '}
              <span className="text-xs font-normal">g</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-0.5">
            <span className="text-[10px] font-mono text-[#E0F2FE] uppercase block">
              Carbohydrate Target
            </span>
            <span className="text-lg font-extrabold text-white">
              {Math.round(plan.targets.carbohydrate_g.min)}–{Math.round(plan.targets.carbohydrate_g.max)}{' '}
              <span className="text-xs font-normal">g</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-0.5">
            <span className="text-[10px] font-mono text-[#E0F2FE] uppercase block">
              Fat Target (AMDR)
            </span>
            <span className="text-lg font-extrabold text-white">
              {Math.round(plan.targets.fat_g.min)}–{Math.round(plan.targets.fat_g.max)}{' '}
              <span className="text-xs font-normal">g</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. TRUTHFUL DEVIATION NOTICE (IF APPLICABLE) ── */}
      {hasDeviations && (
        <div className="p-4 rounded-xl bg-sky-50 border border-[#BAE6FD] text-[#0369A1] flex items-start gap-3 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-[#0288D1] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Best Available Verified Plan</span>
            <p className="text-[#0288D1]">
              Some daily targets could not be fully met with the currently verified food subset.
              Nutritional values reflect calibrated continuous portions without artificial inflation.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. 7-DAY NAVIGATION TABS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {plan.days.map((day) => {
          const isSelected = day.day_index === selectedDayIndex;
          const dayHasDeviation = day.status.includes('DEVIATION');

          return (
            <button
              key={day.day_index}
              type="button"
              onClick={() => setSelectedDayIndex(day.day_index)}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#0288D1] text-white border-[#0288D1] shadow-sm'
                  : 'bg-white text-[#0F172A] border-[#BAE6FD] hover:border-[#0288D1]'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span
                  className={`text-xs font-bold font-mono ${
                    isSelected ? 'text-white' : 'text-[#0288D1]'
                  }`}
                >
                  {day.day_name.slice(0, 3)}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    dayHasDeviation
                      ? isSelected
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-amber-100 text-amber-800'
                      : isSelected
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {dayHasDeviation ? 'Dev.' : 'Target'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] block font-mono">
                  {Math.round(day.energy_kcal)} kcal
                </span>
                <span
                  className={`text-[10px] block ${
                    isSelected ? 'text-[#E0F2FE]' : 'text-[#64748B]'
                  }`}
                >
                  {day.meals.length} Meals
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 4. SELECTED DAY DETAIL ── */}
      {selectedDay && (
        <div className="space-y-5">
          {/* Day Nutrition Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {selectedDay.day_name} Nutrition Breakdown
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    selectedDay.status.includes('DEVIATION')
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {selectedDay.status.includes('DEVIATION')
                    ? 'Best Available'
                    : 'Target Met'}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">Date: {selectedDay.date}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[#64748B] block text-[10px]">Energy</span>
                <span className="font-bold text-[#0F172A]">
                  {Math.round(selectedDay.energy_kcal)} kcal
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Protein</span>
                <span className="font-bold text-[#0F172A]">
                  {selectedDay.protein_g.toFixed(1)}g
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Carbs</span>
                <span className="font-bold text-[#0F172A]">
                  {selectedDay.carbohydrate_g.toFixed(1)}g
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Fat</span>
                <span className="font-bold text-[#0F172A]">
                  {selectedDay.fat_g.toFixed(1)}g
                </span>
              </div>
              {selectedDay.fiber_g !== null && selectedDay.fiber_g !== undefined && (
                <div>
                  <span className="text-[#64748B] block text-[10px]">Known Fiber</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedDay.fiber_g.toFixed(1)}g
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fiber Coverage Notice */}
          {selectedDay.fiber_coverage === 'PARTIAL' && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Known fiber:{' '}
                <strong>
                  {typeof selectedDay.fiber_g === 'number'
                    ? `${selectedDay.fiber_g.toFixed(1)}g`
                    : 'N/A'}
                </strong>
                . Some selected Pakistani dishes do not have verified source fiber data.
              </span>
            </div>
          )}

          {/* 4 Meal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDay.meals.map((meal, mIdx) => (
              <div
                key={mIdx}
                className="p-5 rounded-2xl bg-white border border-[#BAE6FD] hover:border-[#0288D1] transition-all space-y-4 shadow-none"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
                      <Utensils className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">
                        {meal.title}
                      </h4>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {meal.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-[#0F172A] block">
                      {Math.round(meal.energy_kcal)} kcal
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      P: {meal.protein_g.toFixed(1)}g • C: {meal.carbohydrate_g.toFixed(1)}g
                    </span>
                  </div>
                </div>

                {/* Meal Items */}
                <div className="space-y-2.5">
                  {meal.items.map((item, itIdx) => (
                    <div
                      key={itIdx}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#0F172A]">
                          {item.display_name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#0288D1] shrink-0">
                          {Math.round(item.grams)}g
                        </span>
                      </div>

                      {item.standard_portion && (
                        <p className="text-[11px] text-[#475569]">
                          {item.standard_portion}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1">
                        <span>{Math.round(item.energy_kcal)} kcal</span>
                        <span>
                          P: {item.protein_g.toFixed(1)}g • C:{' '}
                          {item.carbohydrate_g.toFixed(1)}g • F: {item.fat_g.toFixed(1)}g
                        </span>
                      </div>

                      {item.recipe_note && (
                        <p className="text-[10px] text-[#94A3B8] italic pt-0.5">
                          {item.recipe_note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. COVERAGE & EVIDENCE GUIDANCE ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Subset Disclosure Notice */}
        <div className="p-5 rounded-2xl bg-white border border-[#BAE6FD] space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0288D1]">
              <Info className="w-3.5 h-3.5" />
            </span>
            <h4 className="font-bold text-[#0F172A]">
              Verified Production Subset Notice
            </h4>
          </div>
          <p className="text-[#475569] leading-relaxed">
            {plan.coverage?.verified_subset_notice ||
              'Some Pakistani dishes are available for nutritional reference but are not yet included in automated portion planning.'}
          </p>
        </div>

        {/* Condition Guidance */}
        <div className="p-5 rounded-2xl bg-white border border-[#BAE6FD] space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0288D1]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <h4 className="font-bold text-[#0F172A]">Condition-Aware Guidance</h4>
          </div>
          <ul className="space-y-1.5 text-[#475569] list-disc pl-4 leading-relaxed">
            {plan.condition_guidance && plan.condition_guidance.length > 0 ? (
              plan.condition_guidance.map((g, idx) => <li key={idx}>{g}</li>)
            ) : (
              <li>
                Maintain balanced whole foods aligned with dietary reference intakes.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
