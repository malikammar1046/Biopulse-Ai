import React from 'react';
import { Percent, MoreVertical, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import type { HealthPathway } from '../../../types/onboarding';

interface WellnessIndexMatrixCardProps {
  score?: number;
  isHigherRisk?: boolean;
  riskCategory?: string;
  completenessPercent?: number;
  pathway?: HealthPathway;
}

export const WellnessIndexMatrixCard: React.FC<WellnessIndexMatrixCardProps> = ({
  score,
  isHigherRisk = false,
  riskCategory = 'lower_risk',
  completenessPercent = 100,
  pathway = 'female',
}) => {
  const isMale = pathway === 'male';

  // 12 columns x 5 rows matrix pattern representing 16 features & stability
  const matrixColumns = [
    [0.7, 0.4, 0.8, 0.3, 0.9],
    [0.5, 0.8, 0.3, 0.6, 0.7],
    [0.9, 0.9, 0.5, 0.8, 0.6],
    [0.6, 0.3, 0.8, 0.4, 0.8],
    [0.4, 0.7, 0.9, 0.5, 0.9],
    [0.8, 0.5, 0.3, 0.7, 0.6],
    [0.3, 0.8, 0.6, 0.9, 0.5],
    [0.9, 0.7, 0.8, 0.3, 0.8],
    [0.6, 0.9, 0.5, 0.8, 0.7],
    [0.8, 0.4, 0.7, 0.6, 0.9],
    [0.5, 0.8, 0.9, 0.4, 0.8],
    [0.7, 0.6, 0.4, 0.9, 0.6],
  ];

  const badgeConfig = isHigherRisk
    ? {
        label: isMale ? 'Higher Screening Risk' : 'Higher Risk',
        bg: 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]',
        icon: AlertTriangle,
      }
    : {
        label: isMale ? 'Estimated Screening Risk' : 'Lower Risk',
        bg: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
        icon: ShieldCheck,
      };

  const Icon = badgeConfig.icon;
  const hasScore = score !== undefined && score !== null;

  return (
    <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-4 text-left select-none relative h-full">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
            <Percent className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold font-display text-[#0F172A]">
            {isMale ? 'Hypogonadism Screening Risk' : 'PCOS Screening Index'}
          </h3>
        </div>
        <Link
          to={ROUTES.APP.HUB}
          className="text-[#64748B] hover:text-[#0288D1] p-1 rounded-lg transition-colors cursor-pointer"
          title="View Full ML Report in Hub"
        >
          <MoreVertical className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Main Big Score & Tag ── */}
      <div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {hasScore ? score : '—'}
            </span>
            {hasScore && <span className="text-sm font-display font-bold text-[#0F172A]">%</span>}
            <span className="text-xs text-[#64748B] font-sans ml-1">
              {isMale ? 'Est. Screening Risk' : 'PCOS prob.'}
            </span>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold flex items-center gap-1 ${
              isHigherRisk
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{badgeConfig.label}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1">
          <span>Profile: {completenessPercent}% complete</span>
          <span className="capitalize">{riskCategory.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* ── Dot Matrix Visualization Grid ── */}
      <div className="pt-2">
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center justify-between bg-[#F8FAFC] p-3 sm:p-4 rounded-2xl border border-[#E2E8F0]">
          {matrixColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1.5 sm:gap-2 items-center">
              {col.map((val, rowIdx) => {
                const opacityClass = isHigherRisk
                  ? val > 0.8
                    ? 'bg-rose-500 opacity-100'
                    : val > 0.6
                    ? 'bg-rose-400 opacity-80'
                    : val > 0.4
                    ? 'bg-rose-200 opacity-60'
                    : 'bg-rose-100 opacity-30'
                  : val > 0.8
                  ? 'bg-[#0288D1] opacity-100'
                  : val > 0.6
                  ? 'bg-[#29B6F6] opacity-80'
                  : val > 0.4
                  ? 'bg-[#BAE6FD] opacity-60'
                  : 'bg-[#E0F2FE] opacity-30';

                return (
                  <span
                    key={rowIdx}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 hover:scale-125 cursor-pointer ${opacityClass}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
