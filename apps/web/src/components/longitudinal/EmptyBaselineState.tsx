import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ShieldTick } from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';

interface EmptyBaselineStateProps {
  pathway: HealthPathway;
}

export const EmptyBaselineState: React.FC<EmptyBaselineStateProps> = ({ pathway }) => {
  const isMale = pathway === 'male';

  const assessmentRoute = isMale ? ROUTES.APP.ANDROSENSE : ROUTES.APP.OVASENSE;

  return (
    <div className="bg-white border border-[#EAECF0] rounded-[24px] p-8 sm:p-12 text-center shadow-xs select-none max-w-2xl mx-auto space-y-6">
      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[#F8F9FC] border border-[#EAECF0]">
        <Activity className={`w-7 h-7 ${isMale ? 'text-[var(--color-medical-primary-hover,#0288D1)]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-[#111318]">
          Establish Your Health Baseline
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] leading-relaxed max-w-md mx-auto">
          {isMale
            ? 'Complete your initial hypogonadism and vitality screening to establish your reference health baseline and unlock longitudinal progression tracking.'
            : 'Complete your initial PCOS clinical screening to establish your reference health baseline and unlock longitudinal progression tracking.'}
        </p>
      </div>

      <div className="pt-2">
        <Link
          to={assessmentRoute}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-xs transition-all active:scale-[0.98] ${
            isMale
              ? 'bg-[var(--color-medical-primary-hover,#0288D1)] hover:bg-[var(--color-medical-primary-active,#0277BD)]'
              : 'bg-[#F43F7D] hover:bg-[#DC326C]'
          }`}
        >
          <span>Start Initial Screening</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>

      <div className="pt-4 border-t border-[#F2F4F7] flex items-center justify-center gap-2 text-xs text-[#667085]">
        <ShieldTick className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />
        <span>Clinical data strictly encrypted and isolated to your authenticated account</span>
      </div>
    </div>
  );
};

export default EmptyBaselineState;
