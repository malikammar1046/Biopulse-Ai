import React from 'react';
import { Link } from 'react-router-dom';
import { Scales01, ArrowRight, CheckCircle } from '@untitledui/icons';
import type { NutritionData } from '../../types/dashboard';
import { ROUTES } from '../../constants/routes';

interface NutritionProps {
  data: NutritionData;
  isMale?: boolean;
}

export const NutritionSnapshotCard: React.FC<NutritionProps> = ({ data, isMale = false }) => {
  const calPercent = Math.min((data.caloriesLogged / data.caloriesTarget) * 100, 100);

  return (
    <div
      className={`p-6 sm:p-7 rounded-[32px] bg-white border ${
        isMale ? 'border-[#BAE6FD]' : 'border-[#F3E8EC]'
      } shadow-sm flex flex-col justify-between select-none text-left space-y-5`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scales01
            className={`w-5 h-5 shrink-0 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
            aria-hidden="true"
          />
          <h3 className="text-base font-bold font-display text-[#0F172A]">
            Today’s Food & Meals
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
              isMale
                ? 'text-[#0288D1] bg-[#E0F2FE] border-[#BAE6FD]'
                : 'text-[#008CA5] bg-[#E0F7FA] border-[#B2EBF2]'
            }`}
          >
            💧 {data.waterIntakeLiters}L / {data.waterTargetLiters}L
          </span>
        </div>
      </div>

      {/* Calorie & Macros Split */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Calorie Dial Indicator */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={isMale ? '#0288D1' : '#F43F7D'}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={(2 * Math.PI * 48) * (1 - calPercent / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-extrabold font-display text-[#0F172A] leading-none">
              {data.caloriesLogged.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#64748B] mt-0.5">
              of {data.caloriesTarget} kcal
            </span>
          </div>
        </div>

        {/* Macronutrients Breakdown Bars */}
        <div className="space-y-3 flex-1 w-full">
          {/* Protein */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="font-semibold text-[#0F172A]">Protein</span>
              <span className="font-mono text-[#64748B]">{data.proteinGrams}g / {data.proteinTarget}g</span>
            </div>
            <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className={`h-full rounded-full ${isMale ? 'bg-[#0288D1]' : 'bg-[#F43F7D]'}`}
                style={{ width: `${(data.proteinGrams / data.proteinTarget) * 100}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="font-semibold text-[#0F172A]">Complex Carbs</span>
              <span className="font-mono text-[#64748B]">{data.carbsGrams}g / {data.carbsTarget}g</span>
            </div>
            <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className={`h-full rounded-full ${isMale ? 'bg-[#29B6F6]' : 'bg-[#FB7185]'}`}
                style={{ width: `${(data.carbsGrams / data.carbsTarget) * 100}%` }}
              />
            </div>
          </div>

          {/* Healthy Fats */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-sans">
              <span className="font-semibold text-[#0F172A]">Healthy Fats</span>
              <span className="font-mono text-[#64748B]">{data.fatGrams}g / {data.fatTarget}g</span>
            </div>
            <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className="h-full bg-[#059669] rounded-full"
                style={{ width: `${(data.fatGrams / data.fatTarget) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Phase Meal Pill */}
      {data.suggestedMeals[0] && (
        <div
          className={`p-3.5 rounded-2xl space-y-1.5 border ${
            isMale ? 'bg-[#F0F9FF] border-[#BAE6FD]' : 'bg-[#FFF8FA] border-[#FDE6EF]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isMale ? 'text-[#01579B]' : 'text-[#BE185D]'
              }`}
            >
              <CheckCircle
                className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`}
                aria-hidden="true"
              />
              Suggested: {data.suggestedMeals[0].name}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                isMale
                  ? 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
                  : 'bg-[#FDE6EF] text-[#E11D48] border-[#F43F7D]/20'
              }`}
            >
              {data.suggestedMeals[0].culturalTag || 'Hormone Balanced'}
            </span>
          </div>
          <p className="text-[11px] text-[#475569] leading-tight font-sans">
            {data.suggestedMeals[0].desc}
          </p>
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
        <Link
          to={ROUTES.APP.LIFESTYLE}
          className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors group ${
            isMale
              ? 'text-[#0288D1] hover:text-[#01579B]'
              : 'text-[#F43F7D] hover:text-[#BE185D]'
          }`}
        >
          <span>View Lifestyle Plan</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>

        <span className="text-[10px] font-mono text-[#64748B]">
          Roti • Daal • Rice • Chai
        </span>
      </div>
    </div>
  );
};
