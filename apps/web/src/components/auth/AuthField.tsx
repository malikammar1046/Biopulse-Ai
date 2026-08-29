import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle } from 'lucide-react';

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorText?: string;
  optional?: boolean;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export const AuthField: React.FC<AuthFieldProps> = ({
  label,
  helperText,
  errorText,
  optional = false,
  leftAccessory,
  rightAccessory,
  disabled,
  className,
  id: customId,
  ...props
}) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(errorText);

  return (
    <div className="w-full text-left space-y-1.5">
      {/* Label and Optional badge */}
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

        {optional && (
          <span className="text-[11px] font-mono text-[#8D7E9E] tracking-normal lowercase">
            (optional)
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
        {leftAccessory && (
          <div className="pl-4 pr-1 text-[#8D7E9E] flex items-center shrink-0">
            {leftAccessory}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={twMerge(
            clsx(
              'w-full px-4 py-3 text-sm text-[#F8F5FA] placeholder-[#7E6F94] bg-transparent outline-none disabled:cursor-not-allowed rounded-2xl font-sans',
              leftAccessory && 'pl-2',
              rightAccessory && 'pr-2',
              className
            )
          )}
          {...props}
        />

        {rightAccessory && (
          <div className="pr-3.5 pl-1 text-[#8D7E9E] flex items-center shrink-0">
            {rightAccessory}
          </div>
        )}
      </div>

      {/* Inline Validation Error */}
      {hasError && (
        <div id={errorId} role="alert" className="flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#E87084] shrink-0" />
          <p className="text-xs text-[#F48498] font-medium leading-tight">{errorText}</p>
        </div>
      )}

      {/* Helper Text */}
      {!hasError && helperText && (
        <p id={helperId} className="text-xs text-[#8D7E9E] pt-0.5 leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
};
