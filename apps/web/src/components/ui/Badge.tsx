import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'neutral' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
export type BadgeStyle = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  badgeStyle?: BadgeStyle;
  size?: BadgeSize;
  showDot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  badgeStyle = 'soft',
  size = 'md',
  showDot = false,
  className,
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    if (badgeStyle === 'solid') {
      switch (variant) {
        case 'secondary':
          return 'bg-[#A21CAF] text-white';
        case 'accent':
          return 'bg-[#E87084] text-white';
        case 'success':
          return 'bg-[#047857] text-white';
        case 'warning':
          return 'bg-[#B45309] text-white';
        case 'error':
          return 'bg-[#BE123C] text-white';
        case 'info':
          return 'bg-[#4338CA] text-white';
        case 'neutral':
          return 'bg-[#584B68] text-white';
        case 'primary':
        default:
          return 'bg-[#6E2D8B] text-white';
      }
    }

    if (badgeStyle === 'outline') {
      switch (variant) {
        case 'secondary':
          return 'bg-transparent text-[#A21CAF] border border-[#A21CAF]';
        case 'accent':
          return 'bg-transparent text-[#E87084] border border-[#E87084]';
        case 'success':
          return 'bg-transparent text-[#047857] border border-[#047857]';
        case 'warning':
          return 'bg-transparent text-[#B45309] border border-[#B45309]';
        case 'error':
          return 'bg-transparent text-[#BE123C] border border-[#BE123C]';
        case 'info':
          return 'bg-transparent text-[#4338CA] border border-[#4338CA]';
        case 'neutral':
          return 'bg-transparent text-[#584B68] border border-[#E7DFEF]';
        case 'primary':
        default:
          return 'bg-transparent text-[#6E2D8B] border border-[#6E2D8B]';
      }
    }

    // Soft style (default)
    switch (variant) {
      case 'secondary':
        return 'bg-[#FDF2F8] text-[#A21CAF] border border-[#FCE7F3]';
      case 'accent':
        return 'bg-[#FFF0F2] text-[#E87084] border border-[#FFE4E8]';
      case 'success':
        return 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]';
      case 'warning':
        return 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]';
      case 'error':
        return 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]';
      case 'info':
        return 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]';
      case 'neutral':
        return 'bg-[#F2ECF7] text-[#584B68] border border-[#E7DFEF]';
      case 'primary':
      default:
        return 'bg-[#EDE4F7] text-[#6E2D8B] border border-[#D8B4FE]/50';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-[11px]';
      case 'lg':
        return 'px-4 py-1.5 text-sm';
      case 'md':
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const getDotColor = () => {
    if (badgeStyle === 'solid') return 'bg-white';
    switch (variant) {
      case 'secondary':
        return 'bg-[#A21CAF]';
      case 'accent':
        return 'bg-[#E87084]';
      case 'success':
        return 'bg-[#047857]';
      case 'warning':
        return 'bg-[#B45309]';
      case 'error':
        return 'bg-[#BE123C]';
      case 'info':
        return 'bg-[#4338CA]';
      case 'neutral':
        return 'bg-[#584B68]';
      case 'primary':
      default:
        return 'bg-[#6E2D8B]';
    }
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full font-semibold font-sans tracking-wide select-none',
          getVariantStyles(),
          getSizeStyles(),
          className
        )
      )}
      {...props}
    >
      {showDot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', getDotColor())} />
      )}
      <span>{children}</span>
    </span>
  );
};
