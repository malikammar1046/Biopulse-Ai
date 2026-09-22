import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loading01 } from '@untitledui/icons';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onPress?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  onPress,
  onClick,
  className,
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[#EDE4F7] text-[#6E2D8B] hover:bg-[#E0D0F5] border border-transparent active:bg-[#D5BFF0]';
      case 'outline':
        return 'bg-transparent text-[#6E2D8B] hover:bg-[#F2ECF7] border border-[#6E2D8B] active:bg-[#EDE4F7]';
      case 'ghost':
        return 'bg-transparent text-[#1C1326] hover:bg-[#F2ECF7] border border-transparent active:bg-[#EDE4F7]';
      case 'destructive':
        return 'bg-[#BE123C] text-white hover:bg-[#9F1239] border border-transparent active:bg-[#881337]';
      case 'primary':
      default:
        return 'bg-[#6E2D8B] text-white hover:bg-[#5A189A] border border-transparent shadow-sm hover:shadow-md hover:shadow-purple-900/10 active:bg-[#4A154B]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3.5 py-1.5 text-xs rounded-full font-medium min-h-[36px]';
      case 'lg':
        return 'px-7 py-3 text-base rounded-full font-semibold min-h-[52px]';
      case 'md':
      default:
        return 'px-5 py-2.5 text-sm rounded-full font-semibold min-h-[44px]';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onClick?.(e);
    onPress?.();
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      disabled={disabled || loading}
      onClick={handleClick}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center transition-colors duration-200 cursor-pointer font-sans select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          getVariantStyles(),
          getSizeStyles(),
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <Loading01 className="w-4 h-4 mr-2 animate-spin text-current" aria-hidden="true" />
      ) : iconLeft ? (
        <span className="mr-2 inline-flex items-center">{iconLeft}</span>
      ) : null}

      <span>{children}</span>

      {!loading && iconRight ? (
        <span className="ml-2 inline-flex items-center">{iconRight}</span>
      ) : null}
    </motion.button>
  );
};
