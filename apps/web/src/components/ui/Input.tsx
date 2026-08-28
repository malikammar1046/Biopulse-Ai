import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  leftAccessory,
  rightAccessory,
  disabled,
  className,
  id: customId,
  ...props
}) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const hasError = Boolean(errorText);

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'block text-xs font-semibold uppercase tracking-wider mb-1.5',
            hasError ? 'text-[#BE123C]' : 'text-[#1C1326]'
          )}
        >
          {label}
        </label>
      )}

      <div
        className={clsx(
          'relative flex items-center w-full rounded-2xl bg-white border transition-all duration-200 focus-within:ring-2',
          hasError
            ? 'border-[#BE123C] focus-within:border-[#BE123C] focus-within:ring-[#BE123C]/20'
            : 'border-[#E7DFEF] focus-within:border-[#8E3EAF] focus-within:ring-[#6E2D8B]/15 hover:border-[#D8B4FE]',
          disabled && 'bg-[#F2ECF7] opacity-60 cursor-not-allowed'
        )}
      >
        {leftAccessory && (
          <div className="pl-3.5 pr-1 text-[#8D7E9E] flex items-center shrink-0">
            {leftAccessory}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError}
          className={twMerge(
            clsx(
              'w-full px-4 py-3 text-sm text-[#1C1326] placeholder-[#8D7E9E] bg-transparent outline-none disabled:cursor-not-allowed rounded-2xl',
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

      {hasError ? (
        <p className="mt-1.5 text-xs text-[#BE123C] font-medium">{errorText}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#8D7E9E]">{helperText}</p>
      ) : null}
    </div>
  );
};
