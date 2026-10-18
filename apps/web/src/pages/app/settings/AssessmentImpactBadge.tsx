import React from 'react';
import { ActivityHeart, CheckCircle } from '@untitledui/icons';
import { useUserHealth } from '../../../context/UserHealthContext';
import { resolvePathway } from '../../../types/onboarding';

interface AssessmentImpactBadgeProps {
  impact?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  isMale?: boolean;
}

export const AssessmentImpactBadge: React.FC<AssessmentImpactBadgeProps> = ({
  impact = true,
  className = '',
  size = 'sm',
  isMale: isMaleProp,
}) => {
  const { userProfile } = useUserHealth();
  const isMale =
    isMaleProp !== undefined
      ? isMaleProp
      : resolvePathway(userProfile?.gender, userProfile?.pathway) === 'male';

  if (!impact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/60 ${className}`}
        title="This field does not modify the AI screening algorithm inputs"
      >
        <CheckCircle className="w-3 h-3 text-slate-400" aria-hidden="true" />
        <span>No screening impact</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
        isMale
          ? 'text-[#0288D1] bg-[#E0F2FE] border border-[#BAE6FD]'
          : 'text-[#BE185D] bg-[#FDE6EF] border border-[#F43F7D]/30'
      } ${
        size === 'sm' ? 'text-[11px] py-0.5' : 'text-xs py-1'
      } ${className}`}
      title="This field directly feeds your AI screening risk assessment"
    >
      <ActivityHeart className={`w-3 h-3 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
      <span>Assessment impact</span>
    </span>
  );
};
