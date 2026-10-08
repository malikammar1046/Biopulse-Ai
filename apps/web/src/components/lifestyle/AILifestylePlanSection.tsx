import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Utensils,
  Dumbbell,
  Moon,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Flame,
  Info,
} from 'lucide-react';
import { lifestyleService } from '../../services/lifestyleService';
import type { AILifestylePlan, AIDailyMeals } from '../../types/lifestyle';

interface AILifestylePlanSectionProps {
  pathway: string;
  isMale: boolean;
  dietaryPreference?: string;
  activityLevel?: string;
}

export const AILifestylePlanSection: React.FC<AILifestylePlanSectionProps> = ({
  pathway,
  isMale,
  dietaryPreference,
  activityLevel,
}) => {
  const [plan, setPlan] = useState<AILifestylePlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [generationStep, setGenerationStep] = useState<number>(1);

  // Load existing plan from backend cache on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCachedPlan() {
      try {
        setInitialLoading(true);
        const cached = await lifestyleService.getAIPlan(pathway as any);
        if (isMounted && cached) {
          setPlan(cached);
        }
      } catch (err) {
        console.debug('No cached AI plan found or error fetching:', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }
    loadCachedPlan();
    return () => {
      isMounted = false;
    };
  }, [pathway]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setGenerationStep(1);

      // Simulation timer for realistic FYP demonstration of hybrid pipeline stages
      const t1 = setTimeout(() => setGenerationStep(2), 700);
      const t2 = setTimeout(() => setGenerationStep(3), 1600);
      const t3 = setTimeout(() => setGenerationStep(4), 2600);

      const generated = await lifestyleService.generateAIPlan(pathway as any, {
        dietary_preference: dietaryPreference,
        activity_level: activityLevel,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setPlan(generated);
      setActiveDayIndex(0);
    } catch (err: any) {
      console.error('Failed to generate AI plan:', err);
      setError(err?.message || 'Unable to generate personalized AI plan at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#D7EAF2] p-6 shadow-xs animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  // 1. Initial State: No plan generated yet
  if (!plan && !loading) {
    return (
      <div className="rounded-2xl bg-white border border-[#D7EAF2] p-6 sm:p-7 shadow-xs text-left space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hybrid Rule-Based + Generative AI Engine</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                7-Day Personalized Protocol
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#073B72]">
              Personalized 7-Day Pakistani Lifestyle & Nutrition Plan
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              BioPulse combines our deterministic clinical safety engine (caloric floors, allergen
              filters, joint limits) with Google Gemini AI to construct a safe, authentic 7-day
              meal and movement roadmap grounded in Pakistani culinary culture.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-xs shrink-0 cursor-pointer ${
              isMale ? 'bg-[#0868B9] hover:bg-[#07599D]' : 'bg-[#0E9EAA] hover:bg-[#0B8590]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate My 7-Day AI Plan</span>
          </button>
        </div>

        {/* Clinical Guardrails Proof Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#D7EAF2]">
          <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2]/70 space-y-1">
            <div className="text-xs font-semibold text-[#073B72] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Caloric Floor Protected</span>
            </div>
            <p className="text-xs text-slate-500">
              {isMale ? '1500 kcal/day' : '1200 kcal/day'} minimum system floor enforced; no extreme deficits.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2]/70 space-y-1">
            <div className="text-xs font-semibold text-[#073B72] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Allergen & Diet Filtering</span>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic exclusion of user allergens and dietary restriction invariants.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2]/70 space-y-1">
            <div className="text-xs font-semibold text-[#073B72] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pakistani Recipe Grounding</span>
            </div>
            <p className="text-xs text-slate-500">
              Drawn from peer-reviewed Pakistani FCT and Khan (2019) composite dishes.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2]/70 space-y-1">
            <div className="text-xs font-semibold text-[#073B72] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Non-Diagnostic Gate</span>
            </div>
            <p className="text-xs text-slate-500">
              AI output validator strips medical diagnoses, cures, and medication tampering.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Generating State with Multi-Step Progress Indicator
  if (loading) {
    const steps = [
      'Evaluating deterministic safety rules & calibrated caloric floors...',
      'Grounding in peer-reviewed Pakistani food composition catalog...',
      'Synthesizing personalized 7-day schedule with Gemini LLM...',
      'Validating output constraints through deterministic safety gate...',
    ];

    return (
      <div className="rounded-2xl bg-white border border-[#D7EAF2] p-8 shadow-xs text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-[#0E9EAA] flex items-center justify-center animate-spin">
          <RefreshCw className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-[#073B72]">Synthesizing Your 7-Day Plan</h3>
          <p className="text-xs text-slate-500">
            BioPulse is coordinating deterministic health constraints with AI personalization.
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2.5 text-left">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isDone = generationStep > stepNum;
            const isCurrent = generationStep === stepNum;
            return (
              <div
                key={s}
                className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-colors ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 font-medium'
                    : isCurrent
                    ? 'bg-white border-[#0E9EAA] text-[#073B72] font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-[#0E9EAA] animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0">
                    {stepNum}
                  </div>
                )}
                <span>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Plan Display View
  const dailyMeals: AIDailyMeals[] = plan?.nutrition?.daily_meals || [];
  const activeDayPlan = dailyMeals[activeDayIndex] || dailyMeals[0];
  const activeActivity = plan?.physical_activity?.schedule?.[activeDayIndex];
  const authoritativeTargets = plan?.authoritative_daily_targets;

  return (
    <div className="rounded-2xl bg-white border border-[#D7EAF2] p-5 sm:p-7 shadow-xs text-left space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#D7EAF2]">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{plan?.engine_type || 'Hybrid Rule-Based + Generative AI Recommendation Engine'}</span>
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Grounded in Pakistani Nutrition
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#073B72]">
            Your 7-Day Personalized Lifestyle & Nutrition Plan
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{plan?.summary}</p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D7EAF2] text-xs font-semibold text-[#073B72] hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0E9EAA]" />
          <span>Regenerate Plan</span>
        </button>
      </div>

      {/* Authoritative Caloric & Hydration Target Strip */}
      <div className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {authoritativeTargets?.target_status === 'calculated' && authoritativeTargets?.daily_calories_kcal ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Calibrated Energy Floor</div>
                <div className="text-sm font-bold text-[#073B72]">
                  {authoritativeTargets.calorie_range_min}–{authoritativeTargets.calorie_range_max} kcal/day
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Calorie counts deferred (nutritional quality and satiety prioritized)</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Hydration Goal</div>
              <div className="text-sm font-bold text-[#073B72]">
                {plan?.hydration?.daily_target_liters || 2.5} Liters / day
              </div>
            </div>
          </div>
        </div>

        {/* Personalization Reasons Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {plan?.personalization_reasons?.map((reason, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#D7EAF2] text-slate-700"
            >
              • {reason}
            </span>
          ))}
        </div>
      </div>

      {/* 7-Day Selector Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-[#D7EAF2] scrollbar-none">
          {dailyMeals.map((dm, idx) => {
            const isSelected = activeDayIndex === idx;
            return (
              <button
                key={dm.day}
                type="button"
                onClick={() => setActiveDayIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? isMale
                      ? 'bg-[#0868B9] text-white shadow-xs'
                      : 'bg-[#0E9EAA] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                Day {dm.day} ({dm.day_name})
              </button>
            );
          })}
        </div>

        {/* Selected Day Content */}
        {activeDayPlan && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#073B72] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0E9EAA]" />
                <span>
                  Day {activeDayPlan.day} Schedule — {activeDayPlan.day_name}
                </span>
              </h3>
            </div>

            {/* 4 Daily Meals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Breakfast */}
              <div className="p-4 rounded-xl bg-white border border-[#D7EAF2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E9EAA]">
                    Breakfast
                  </span>
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-sm font-bold text-[#073B72]">{activeDayPlan.breakfast?.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeDayPlan.breakfast?.description}
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  <strong className="text-slate-700 not-italic">Why:</strong> {activeDayPlan.breakfast?.why}
                </div>
              </div>

              {/* Lunch */}
              <div className="p-4 rounded-xl bg-white border border-[#D7EAF2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E9EAA]">
                    Lunch
                  </span>
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-sm font-bold text-[#073B72]">{activeDayPlan.lunch?.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeDayPlan.lunch?.description}
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  <strong className="text-slate-700 not-italic">Why:</strong> {activeDayPlan.lunch?.why}
                </div>
              </div>

              {/* Afternoon Snack */}
              <div className="p-4 rounded-xl bg-white border border-[#D7EAF2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E9EAA]">
                    Midday Snack
                  </span>
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-sm font-bold text-[#073B72]">{activeDayPlan.snack?.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeDayPlan.snack?.description}
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  <strong className="text-slate-700 not-italic">Why:</strong> {activeDayPlan.snack?.why}
                </div>
              </div>

              {/* Dinner */}
              <div className="p-4 rounded-xl bg-white border border-[#D7EAF2] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E9EAA]">
                    Dinner
                  </span>
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-sm font-bold text-[#073B72]">{activeDayPlan.dinner?.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeDayPlan.dinner?.description}
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  <strong className="text-slate-700 not-italic">Why:</strong> {activeDayPlan.dinner?.why}
                </div>
              </div>
            </div>

            {/* Daily Physical Activity & Circadian Recovery Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Activity Session */}
              <div className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#073B72] flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-[#0E9EAA]" />
                    <span>Physical Movement Focus</span>
                  </span>
                  {activeActivity && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-[#D7EAF2] text-slate-700 capitalize">
                      {activeActivity.intensity} • {activeActivity.duration_mins} mins
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-[#073B72]">
                  {activeActivity?.activity || 'Moderate Aerobic Movement'}
                </div>
                <p className="text-xs text-slate-600">
                  {activeActivity?.coaching_cue || 'Maintain conversational pacing to support aerobic endurance.'}
                </p>
              </div>

              {/* Sleep & Lifestyle */}
              <div className="p-4 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] space-y-2">
                <span className="text-xs font-bold text-[#073B72] flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Circadian & Rest Protocol</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {plan?.sleep_and_lifestyle?.sleep_guidance || 'Aim for 7 to 9 hours of restorative sleep.'}
                </p>
                <p className="text-xs text-slate-500">
                  {plan?.sleep_and_lifestyle?.stress_guidance || 'Take mindful relaxation pauses during high-stress hours.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety Notices & Clinical Disclaimers */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Clinical Safety Disclosures & Validation Notes</span>
        </div>
        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-500">
          {plan?.safety_notices?.map((sn, idx) => (
            <li key={idx}>{sn}</li>
          ))}
        </ul>
        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200">
          {plan?.disclaimer}
        </p>
      </div>
    </div>
  );
};

export default AILifestylePlanSection;
