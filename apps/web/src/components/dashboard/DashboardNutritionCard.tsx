import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scales01,
  ArrowRight,
  ShieldTick,
  CheckCircle,
  Activity,
  ActivityHeart,
} from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';
import type { HealthPathway } from '../../types/onboarding';
import { lifestyleService } from '../../services/lifestyleService';
import type { LifestyleRecommendationsResult } from '../../types/lifestyle';

interface DashboardNutritionCardProps {
  pathway: HealthPathway;
}

export const DashboardNutritionCard: React.FC<DashboardNutritionCardProps> = ({ pathway }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<LifestyleRecommendationsResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const moduleName = pathway === 'male' ? 'androsense' : 'ovasense';
        const res = await lifestyleService.getRecommendations(moduleName);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        // Non-blocking for dashboard
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [pathway]);

  const isMale = pathway === 'male';

  const description =
    data?.nutrition.strategy_title ||
    (isMale
      ? 'Testosterone optimization, steady insulin sensitivity, and lean mass protocol.'
      : 'Glycemic load blunting, androgen-lowering, and metabolic recovery protocol.');

  const calories = data?.nutrition.daily_targets.daily_calories_kcal;
  const aerobicMins = data?.fitness.aerobic_target_minutes;

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
                Lifestyle & Nutrition Protocol
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                Dynamic Clinical Protocol Active
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] max-w-xl leading-relaxed">
              {description}
            </p>

            <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px] text-[#64748B] font-medium">
              {calories && (
                <>
                  <span className="flex items-center gap-1 font-mono font-bold text-[#0F172A]">
                    <ShieldTick className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    {calories} kcal/day
                  </span>
                  <span>•</span>
                </>
              )}
              {aerobicMins && (
                <>
                  <span className="flex items-center gap-1 font-mono text-[#0288D1]">
                    <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                    {aerobicMins} min/wk Movement
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1 text-slate-600">
                <ActivityHeart className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                SHAP-Attributed Swaps
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.LIFESTYLE)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <span>Explore Lifestyle Plan</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
