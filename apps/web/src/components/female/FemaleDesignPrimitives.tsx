import React from 'react';
import { ArrowRight, Loading01, AlertCircle } from '@untitledui/icons';

export type IconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

/**
 * Antigravity / Apple-inspired Design Tokens for Female PCOS Experience
 * Ratio: 70-80% neutral white/light, 10-20% soft pink, 5-10% pink accent
 */
export const FEMALE_THEME = {
  primary: '#F43F7D',
  hover: '#DC326C',
  soft: '#FDE6EF',
  veryLight: 'rgba(253, 230, 239, 0.4)',
  deep: '#BE185D',
  bg: '#FAFAFC',
  surface: '#FFFFFF',
  textPrimary: '#111318',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  border: '#EAECF0',
  borderSubtle: '#F2F4F7',
  borderPink: 'rgba(244, 63, 125, 0.2)',
  focusRing: 'rgba(244, 63, 125, 0.25)',
  success: '#16A36A',
  successSoft: '#ECFDF3',
  warning: '#E8A23A',
  warningSoft: '#FEF7EC',
  danger: '#D94A5C',
  dangerSoft: '#FEF3F2',
  info: '#3B82F6',
  infoSoft: '#EFF8FF',
} as const;

/**
 * Apple-standard spring transitions
 * WWDC 'Designing Fluid Interfaces': Damping 1.0 (critically damped), Response 0.3s-0.4s
 */
export const APPLE_SPRINGS = {
  instant: { type: 'spring', damping: 28, stiffness: 350 },
  sheet: { type: 'spring', damping: 30, stiffness: 300 },
  hover: { type: 'spring', damping: 25, stiffness: 400 },
} as const;

// -----------------------------------------------------------------------------
// 1. Female Page Header
// -----------------------------------------------------------------------------
interface FemalePageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const FemalePageHeader: React.FC<FemalePageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 text-left select-none">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#111318] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed max-w-2xl font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 2. Female Card (Hairline Border & Gentle Surface)
// -----------------------------------------------------------------------------
interface FemaleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const FemaleCard: React.FC<FemaleCardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-[#EAECF0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left transition-all duration-200 ${
        hoverable ? 'hover:border-[#F43F7D]/30 hover:shadow-[0_4px_12px_rgba(244,63,125,0.06)] cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3. Status Badges
// -----------------------------------------------------------------------------
interface FemaleStatusBadgeProps {
  variant?: 'neutral' | 'pink' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  icon?: IconComponent;
  size?: 'sm' | 'md';
}

export const FemaleStatusBadge: React.FC<FemaleStatusBadgeProps> = ({
  variant = 'neutral',
  children,
  icon: Icon,
  size = 'md',
}) => {
  const styles = {
    neutral: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
    pink: 'bg-[#FDE6EF] text-[#DC326C] border-[#F43F7D]/20',
    success: 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]',
    warning: 'bg-[#FEF7EC] text-[#B54708] border-[#FEDF89]',
    danger: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles} ${sizeStyles} select-none`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

// -----------------------------------------------------------------------------
// 4. Buttons (Standardized Height: 40px, padding: 16px, gap: 8px)
// -----------------------------------------------------------------------------
interface FemaleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: IconComponent;
  isLoading?: boolean;
}

export const FemalePrimaryButton: React.FC<FemaleButtonProps> = ({
  children,
  icon: Icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-xl bg-[#F43F7D] hover:bg-[#DC326C] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loading01 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
};

export const FemaleSecondaryButton: React.FC<FemaleButtonProps> = ({
  children,
  icon: Icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FDE6EF]/50 active:scale-[0.98] text-[#F43F7D] border border-[#EAECF0] hover:border-[#F43F7D]/30 text-xs sm:text-sm font-semibold shadow-xs transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loading01 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
};

// -----------------------------------------------------------------------------
// 5. Empty State
// -----------------------------------------------------------------------------
interface FemaleEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconComponent;
  badge?: string;
}

export const FemaleEmptyState: React.FC<FemaleEmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = AlertCircle,
  badge,
}) => {
  return (
    <div className="p-8 sm:p-10 rounded-[20px] bg-white border border-[#EAECF0] shadow-xs flex flex-col items-center justify-center text-center space-y-4 select-none">
      <div className="w-12 h-12 rounded-2xl bg-[#FDE6EF] border border-[#F43F7D]/20 flex items-center justify-center text-[#F43F7D]">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-md">
        {badge && (
          <span className="inline-block text-[11px] font-semibold text-[#DC326C] px-2.5 py-0.5 rounded-full bg-[#FDE6EF] mb-1">
            {badge}
          </span>
        )}
        <h3 className="text-base sm:text-lg font-semibold text-[#111318]">{title}</h3>
        <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <FemalePrimaryButton onClick={onAction}>
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </FemalePrimaryButton>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 6. Loading State (Synchronizing / Medical Verification)
// -----------------------------------------------------------------------------
interface FemaleLoadingStateProps {
  title?: string;
  message?: string;
}

export const FemaleLoadingState: React.FC<FemaleLoadingStateProps> = ({
  title = 'Checking Screening Status',
  message = 'Synchronizing your health information...',
}) => {
  return (
    <div className="p-8 sm:p-10 rounded-[20px] bg-white border border-[#EAECF0] shadow-xs flex flex-col items-center justify-center text-center space-y-4 select-none">
      <div className="w-12 h-12 rounded-full border-3 border-[#FDE6EF] border-t-[#F43F7D] animate-spin" />
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm sm:text-base font-semibold text-[#111318]">{title}</h3>
        <p className="text-xs text-[#667085] leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
