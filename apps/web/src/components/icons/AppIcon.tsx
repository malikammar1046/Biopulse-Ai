import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export type IconTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inherit';

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

const TONE_CLASSES: Record<IconTone, string> = {
  default: 'text-slate-500',
  muted: 'text-slate-400',
  primary: 'text-[#0288D1]', // Professional primary clinical accent
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
  inherit: 'text-current',
};

export interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;
  size?: IconSize;
  tone?: IconTone;
  className?: string;
  'aria-label'?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  icon: IconComponent,
  size = 'md',
  tone = 'default',
  className,
  'aria-label': ariaLabel,
  ...restProps
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 18;
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.default;

  const isAccessible = Boolean(ariaLabel);

  return (
    <IconComponent
      size={pixelSize}
      width={pixelSize}
      height={pixelSize}
      className={twMerge(clsx('shrink-0 transition-colors duration-150', toneClass, className))}
      aria-hidden={isAccessible ? undefined : 'true'}
      aria-label={ariaLabel}
      role={isAccessible ? 'img' : undefined}
      {...restProps}
    />
  );
};

export default AppIcon;
