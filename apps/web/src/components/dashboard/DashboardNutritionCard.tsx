import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scales01,
  ArrowRight,
  CalendarCheck01,
  ShieldTick,
  CheckCircle,
  ClockFastForward,
} from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';
import type { HealthPathway } from '../../types/onboarding';
import { nutritionService } from '../../services/nutritionService';
import type { WeeklyNutritionPlan, NutritionReadiness } from '../../types/nutrition';

interface DashboardNutritionCardProps {
  pathway: HealthPathway;
}

export const DashboardNutritionCard: React.FC<DashboardNutritionCardProps> = ({ pathway }) => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<WeeklyNutritionPlan | null>(null);
  const [readiness, setReadiness] = useState<NutritionReadiness | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const [planRes, readinessRes] = await Promise.allSettled([
          nutritionService.getCurrentPlan(),
          nutritionService.getReadiness(),
        ]);
        if (isMounted) {
          if (planRes.status === 'fulfilled') {
            setActivePlan(planRes.value);
          }
          if (readinessRes.status === 'fulfilled') {
            setReadiness(readinessRes.value);
          }
        }
      } catch (err) {
        // Non-blocking for dashboard
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Condition-aware copy strictly adhering to requirement 12
  const description =
    pathway === 'female'
      ? 'Personalized Pakistani meal planning with PCOS-aware health guidance.'
      : pathway === 'male'
      ? 'Personalized Pakistani meal planning with male hormonal-health guidance.'
      : 'Personalized Pakistani meal planning based on your metabolic profile.';

  const isPlanActive = Boolean(activePlan);
  const isReady = readiness?.ready ?? true;

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-white via-[#F8FAFC] to-[#F0F9FF] border border-[#BAE6FD] shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      {/* Decorative subtle background gradient blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E0F2FE]/40 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0288D1] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0288D1]/20">
            <Scales01 className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                Nutrition Plan
              </h3>
              {isPlanActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3 h-3" aria-hidden="true" />
                  7-Day Plan Active
                </span>
              ) : isReady ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  <ClockFastForward className="w-3 h-3" aria-hidden="true" />
                  Ready to Generate
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Profile Setup Needed
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#475569] max-w-xl leading-relaxed">
              {description}
            </p>

            <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px] text-[#64748B] font-medium">
              <span className="flex items-center gap-1">
                <CalendarCheck01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                7-Day Culturally Calibrated
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldTick className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                Portion Gram Targets
              </span>
              <span>•</span>
              <span>Breakfast, Lunch, Dinner, Snack</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.DIET)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <span>{isPlanActive ? 'View Meal Plan' : 'View Nutrition Plan'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
