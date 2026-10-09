import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DashboardEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  accentColor?: 'pink' | 'blue' | 'teal';
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  accentColor = 'pink',
}) => {
  const btnBg = accentColor === 'pink'
    ? 'bg-[#F43F7D] hover:bg-[#E11D48] text-white shadow-xs'
    : accentColor === 'teal'
    ? 'bg-[#008CA5] hover:bg-[#007A90] text-white shadow-xs'
    : 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-xs';

  const iconBg = accentColor === 'pink'
    ? 'bg-[#FDE6EF] text-[#F43F7D]'
    : accentColor === 'teal'
    ? 'bg-[#E0F7FA] text-[#008CA5]'
    : 'bg-[#E0F2FE] text-[#0284C7]';

  return (
    <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-3 my-auto">
      {Icon && (
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg} mb-1`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1 max-w-xs">
        <h4 className="text-sm font-semibold text-slate-800 font-display">
          {title}
        </h4>
        <p className="text-xs text-slate-500 font-sans leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${btnBg}`}
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
