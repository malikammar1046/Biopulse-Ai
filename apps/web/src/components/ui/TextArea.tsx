import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  showCharacterCount?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  helperText,
  errorText,
  showCharacterCount = false,
  maxLength,
  value,
  disabled,
  className,
  id: customId,
  ...props
}) => {
  const generatedId = useId();
  const textareaId = customId || generatedId;
  const hasError = Boolean(errorText);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={textareaId}
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
          'relative w-full rounded-2xl bg-white border transition-all duration-200 focus-within:ring-2 p-3',
          hasError
            ? 'border-[#BE123C] focus-within:border-[#BE123C] focus-within:ring-[#BE123C]/20'
            : 'border-[#E7DFEF] focus-within:border-[#8E3EAF] focus-within:ring-[#6E2D8B]/15 hover:border-[#D8B4FE]',
          disabled && 'bg-[#F2ECF7] opacity-60 cursor-not-allowed'
        )}
      >
        <textarea
          id={textareaId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          aria-invalid={hasError}
          rows={4}
          className={twMerge(
            clsx(
              'w-full text-sm text-[#1C1326] placeholder-[#8D7E9E] bg-transparent outline-none disabled:cursor-not-allowed resize-y',
              className
            )
          )}
          {...props}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5">
        {hasError ? (
          <p className="text-xs text-[#BE123C] font-medium">{errorText}</p>
        ) : helperText ? (
          <p className="text-xs text-[#8D7E9E]">{helperText}</p>
        ) : (
          <span />
        )}

        {showCharacterCount && maxLength ? (
          <p className="text-xs text-[#8D7E9E] font-medium">
            {currentLength}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
};
