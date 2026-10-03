import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DashboardActionMenu, type ActionMenuItem } from './DashboardActionMenu';
import { DashboardLiveBadge } from './DashboardLiveBadge';
import { DashboardErrorState } from './DashboardErrorState';

interface DashboardModuleCardProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'pink' | 'blue' | 'teal';
  isLive?: boolean;
  badgeType?: 'live' | 'ai' | 'syncing' | 'custom';
  badgeLabel?: string;
  syncedModule?: string;
  updatedAt?: string | null;
  menuItems?: ActionMenuItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  footerContent?: React.ReactNode;
}

export const DashboardModuleCard: React.FC<DashboardModuleCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  accentColor = 'pink',
  isLive = false,
  badgeType,
  badgeLabel,
  syncedModule,
  updatedAt,
  menuItems,
  loading = false,
  error = null,
  onRetry,
  children,
  className = '',
  footerContent,
}) => {
  const isFemale = accentColor === 'pink';

  const iconBg = isFemale
    ? 'bg-[#FDE6EF] text-[#E11D48] border border-[#F43F7D]/20'
    : 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]';

  const cardBorder = isFemale
    ? 'border-[#F3E8EC]'
    : 'border-[#E2E8F0]';

  return (
    <div
      className={`bg-white rounded-2xl sm:rounded-3xl border ${cardBorder} p-5 sm:p-6 shadow-xs flex flex-col justify-between select-none text-left transition-shadow duration-200 hover:shadow-sm ${className}`}
    >
      {/* ── Card Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        {/* Left: Icon + Title + Subtitle */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Live Badge & Action Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {loading ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Loading</span>
            </span>
          ) : error ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200">
              Sync issue
            </span>
          ) : badgeType ? (
            <DashboardLiveBadge type={badgeType} label={badgeLabel} />
          ) : isLive ? (
            <DashboardLiveBadge type="live" label="Live data" />
          ) : null}

          {menuItems && menuItems.length > 0 && (
            <DashboardActionMenu items={menuItems} ariaLabel={`${title} options`} />
          )}
        </div>
      </div>

      {/* ── Card Body ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center min-h-[140px]">
        {loading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-md w-3/4" />
            <div className="h-10 bg-slate-100 rounded-xl w-full" />
            <div className="h-4 bg-slate-100 rounded-md w-1/2" />
          </div>
        ) : error ? (
          <DashboardErrorState message={error} onRetry={onRetry} accentColor={accentColor === 'blue' ? 'blue' : 'pink'} />
        ) : (
          children
        )}
      </div>

      {/* ── Card Footer ────────────────────────────────────────────── */}
      {(footerContent || syncedModule || updatedAt) && (
        <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          {footerContent ? (
            footerContent
          ) : (
            <>
              {syncedModule ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                  <span className="truncate">Synced with {syncedModule}</span>
                </div>
              ) : (
                <div />
              )}

              {updatedAt && (
                <span className="text-slate-400 font-mono text-[10.5px] shrink-0 ml-2">
                  {updatedAt.startsWith('Updated') ? updatedAt : `Updated ${updatedAt}`}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
