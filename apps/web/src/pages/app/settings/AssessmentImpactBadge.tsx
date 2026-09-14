import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface AssessmentImpactBadgeProps {
  impact?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const AssessmentImpactBadge: React.FC<AssessmentImpactBadgeProps> = ({
  impact = true,
  className = '',
  size = 'sm',
}) => {
  if (!impact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/60 ${className}`}
        title="This field does not modify the AI screening algorithm inputs"
      >
        <CheckCircle2 className="w-3 h-3 text-slate-400" />
        <span>No screening impact</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#0E9EAA] bg-[#0E9EAA]/10 border border-[#0E9EAA]/25 transition-all ${
        size === 'sm' ? 'text-[11px] py-0.5' : 'text-xs py-1'
      } ${className}`}
      title="This field directly feeds your AI screening risk assessment"
    >
      <Sparkles className="w-3 h-3 text-[#0E9EAA] animate-pulse" />
      <span>Assessment impact</span>
    </span>
  );
};
