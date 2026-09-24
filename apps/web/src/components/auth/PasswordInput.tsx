import React, { useState, useId } from 'react';
import { Eye, EyeOff, Lock01, AlertCircle } from '@untitledui/icons';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  helperText?: string;
  errorText?: string;
  showStrength?: boolean;
}

export type PasswordStrength = 'none' | 'weak' | 'fair' | 'strong';

export const evaluatePasswordStrength = (pwd: string): { strength: PasswordStrength; score: number; label: string } => {
  if (!pwd || pwd.length === 0) {
    return { strength: 'none', score: 0, label: '' };
  }

  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 2 || pwd.length < 8) {
    return { strength: 'weak', score: 1, label: 'Weak' };
  }
  if (score === 3 || score === 4) {
    return { strength: 'fair', score: 2, label: 'Fair' };
  }
  return { strength: 'strong', score: 3, label: 'Strong' };
};

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  helperText,
  errorText,
  showStrength = false,
  value = '',
  onChange,
  disabled,
  className,
  id: customId,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(errorText);

  const pwdString = typeof value === 'string' ? value : '';
  const { strength, score, label: strengthLabel } = showStrength ? evaluatePasswordStrength(pwdString) : { strength: 'none' as PasswordStrength, score: 0, label: '' };

  const getStrengthBarColor = (index: number) => {
    if (index > score) return 'bg-white/10';
    switch (strength) {
      case 'weak':
        return 'bg-[#E87084] shadow-[0_0_8px_rgba(232,112,132,0.4)]';
      case 'fair':
        return 'bg-[#8E3EAF] shadow-[0_0_8px_rgba(142,62,175,0.4)]';
      case 'strong':
        return 'bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#D946EF] shadow-[0_0_10px_rgba(217,70,239,0.4)]';
      default:
        return 'bg-white/10';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength) {
      case 'weak':
        return 'text-[#F48498]';
      case 'fair':
        return 'text-[#D8B4FE]';
      case 'strong':
        return 'text-[#E879F9]';
      default:
        return 'text-[#8D7E9E]';
    }
  };

  return (
    <div className="w-full text-left space-y-1.5">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className={clsx(
            'block text-xs font-semibold tracking-wider font-sans uppercase',
            hasError ? 'text-[#F48498]' : 'text-[#EDE4F7]'
          )}
        >
          {label}
          {props.required && <span className="text-[#E87084] ml-1">*</span>}
        </label>

        {showStrength && pwdString.length > 0 && (
          <span className={clsx('text-[11px] font-medium transition-colors duration-200', getStrengthTextColor())}>
            Strength: {strengthLabel}
          </span>
        )}
      </div>

      {/* Input container */}
      <div
        className={clsx(
          'relative flex items-center w-full min-h-[48px] rounded-2xl transition-all duration-200',
          'bg-[#12071F]/80 backdrop-blur-xs border',
          hasError
            ? 'border-[#E87084] focus-within:border-[#E87084] focus-within:ring-2 focus-within:ring-[#E87084]/25'
            : 'border-[#6E2D8B]/40 hover:border-[#8E3EAF]/60 focus-within:border-[#8E3EAF] focus-within:ring-2 focus-within:ring-[#8E3EAF]/25',
          disabled && 'opacity-50 cursor-not-allowed bg-[#1A0C2B]/50'
        )}
      >
        <div className="pl-4 pr-1 text-[#8D7E9E] flex items-center shrink-0">
          <Lock01 className="w-4 h-4 shrink-0" aria-hidden="true" />
        </div>

        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={twMerge(
            clsx(
              'w-full pl-2 pr-12 py-3 text-sm text-[#F8F5FA] placeholder-[#7E6F94] bg-transparent outline-none disabled:cursor-not-allowed rounded-2xl font-sans',
              className
            )
          )}
          {...props}
        />

        {/* Show/Hide password button */}
        <button
          type="button"
          tabIndex={0}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2 p-2 rounded-xl text-[#8D7E9E] hover:text-[#EDE4F7] hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]/40 flex items-center justify-center min-w-[40px] min-h-[40px] cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Password Strength Indicator Meter */}
      {showStrength && pwdString.length > 0 && (
        <div className="pt-1 space-y-1">
          <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
            <div className={clsx('h-full rounded-full transition-all duration-300', getStrengthBarColor(1))} />
            <div className={clsx('h-full rounded-full transition-all duration-300', getStrengthBarColor(2))} />
            <div className={clsx('h-full rounded-full transition-all duration-300', getStrengthBarColor(3))} />
          </div>
          <p className="text-[11px] text-[#8D7E9E]">
            {strength === 'weak' && 'Use at least 8 characters with letters, numbers & symbols.'}
            {strength === 'fair' && 'Add uppercase letters or special characters for extra strength.'}
            {strength === 'strong' && 'Great password security.'}
          </p>
        </div>
      )}

      {/* Inline Validation Error */}
      {hasError && (
        <div id={errorId} role="alert" className="flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#E87084] shrink-0" aria-hidden="true" />
          <p className="text-xs text-[#F48498] font-medium leading-tight">{errorText}</p>
        </div>
      )}

      {/* Helper Text */}
      {!hasError && helperText && !showStrength && (
        <p id={helperId} className="text-xs text-[#8D7E9E] pt-0.5 leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
};
