import React from 'react';
import { ArrowRight, Loading01 } from '@untitledui/icons';

export type IconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

/**
 * Antigravity / Apple-inspired Design Tokens for Male Hypogonadism Experience
 * Palette:
 * Primary: #0868B9 (Male Blue)
 * Hover: #07589D
 * Light/Soft: #DDEFFD
 * Secondary: #2196E3
 * Chart: #287DDB
 * Brand Teal: #16B8C4
 * Ratio: 70-80% neutral white/light, 10-20% soft sky/light blue, 5-10% primary blue accent
 */
export const MALE_THEME = {
  primary: '#0868B9',
  hover: '#07589D',
  soft: '#DDEFFD',
  veryLight: 'rgba(221, 239, 253, 0.4)',
  deep: '#033B6A',
  secondary: '#2196E3',
  chart: '#287DDB',
  teal: '#16B8C4',
  bg: '#FAFAFC',
  surface: '#FFFFFF',
  textPrimary: '#111318',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  border: '#EAECF0',
  borderSubtle: '#F2F4F7',
  borderBlue: 'rgba(8, 104, 185, 0.2)',
  focusRing: 'rgba(8, 104, 185, 0.25)',
  success: '#16A36A',
  successSoft: '#ECFDF3',
  warning: '#E8A23A',
  warningSoft: '#FEF7EC',
  danger: '#D94A5C',
  dangerSoft: '#FEF3F2',
  info: '#0868B9',
  infoSoft: '#DDEFFD',
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
// 1. Male Page Header
// -----------------------------------------------------------------------------
interface MalePageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const MalePageHeader: React.FC<MalePageHeaderProps> = ({
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
// 2. Male Card (Hairline Border & Gentle Surface)
// -----------------------------------------------------------------------------
interface MaleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const MaleCard: React.FC<MaleCardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-[#EAECF0] rounded-[18px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-left transition-all duration-200 ${
        hoverable ? 'hover:border-[#0868B9]/30 hover:shadow-[0_4px_12px_rgba(8,104,185,0.06)] cursor-pointer' : ''
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
interface MaleStatusBadgeProps {
  variant?: 'neutral' | 'blue' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  icon?: IconComponent;
  size?: 'sm' | 'md';
}

export const MaleStatusBadge: React.FC<MaleStatusBadgeProps> = ({
  variant = 'neutral',
  children,
  icon: Icon,
  size = 'md',
}) => {
  const styles = {
    neutral: 'bg-[#F2F4F7] text-[#344054] border-[#EAECF0]',
    blue: 'bg-[#DDEFFD] text-[#0868B9] border-[#0868B9]/20',
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
interface MaleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: IconComponent;
  isLoading?: boolean;
}

export const MalePrimaryButton: React.FC<MaleButtonProps> = ({
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
      className={`h-11 px-5 rounded-xl bg-[#0868B9] hover:bg-[#07589D] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed select-none ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loading01 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export const MaleSecondaryButton: React.FC<MaleButtonProps> = ({
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
      className={`h-11 px-5 rounded-xl bg-white hover:bg-[#F2F4F7] active:scale-[0.98] text-[#344054] hover:text-[#111318] border border-[#D0D5DD] text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed select-none ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loading01 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

// -----------------------------------------------------------------------------
// 5. Loading State
// -----------------------------------------------------------------------------
interface MaleLoadingStateProps {
  title?: string;
  message?: string;
}

export const MaleLoadingState: React.FC<MaleLoadingStateProps> = ({
  title = 'Loading Screening Profile',
  message = 'Calculating statistical parameters...',
}) => {
  return (
    <MaleCard className="flex flex-col items-center justify-center p-12 text-center space-y-3 min-h-[300px]">
      <div className="w-10 h-10 rounded-full bg-[#DDEFFD] flex items-center justify-center text-[#0868B9]">
        <Loading01 className="w-5 h-5 animate-spin" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[#111318]">{title}</h4>
        <p className="text-xs text-[#667085] max-w-sm">{message}</p>
      </div>
    </MaleCard>
  );
};

// -----------------------------------------------------------------------------
// 6. Empty State
// -----------------------------------------------------------------------------
interface MaleEmptyStateProps {
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconComponent;
}

export const MaleEmptyState: React.FC<MaleEmptyStateProps> = ({
  badge,
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
}) => {
  return (
    <MaleCard className="flex flex-col items-center justify-center p-8 sm:p-10 text-center space-y-4 min-h-[320px]">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#DDEFFD] border border-[#0868B9]/20 flex items-center justify-center text-[#0868B9]">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1.5 max-w-md">
        {badge && (
          <span className="text-[11px] font-semibold text-[#0868B9] uppercase tracking-wider block font-mono">
            {badge}
          </span>
        )}
        <h3 className="text-base sm:text-lg font-semibold text-[#111318]">{title}</h3>
        <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <MalePrimaryButton onClick={onAction}>
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </MalePrimaryButton>
        </div>
      )}
    </MaleCard>
  );
};
