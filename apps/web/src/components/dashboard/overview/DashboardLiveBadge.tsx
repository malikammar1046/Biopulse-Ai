import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface DashboardLiveBadgeProps {
  type?: 'live' | 'ai' | 'syncing' | 'custom';
  label?: string;
  className?: string;
}

export const DashboardLiveBadge: React.FC<DashboardLiveBadgeProps> = ({
  type = 'live',
  label,
  className = '',
}) => {
  if (type === 'ai') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF] ${className}`}
      >
        <Sparkles className="w-3 h-3 text-[#9333EA]" aria-hidden="true" />
        <span>{label || 'AI powered'}</span>
      </span>
    );
  }

  if (type === 'syncing') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] ${className}`}
      >
        <RefreshCw className="w-3 h-3 animate-spin text-[#16A34A]" aria-hidden="true" />
        <span>Syncing</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
      <span>{label || 'Live data'}</span>
    </span>
  );
};
