import React, { useState, useEffect, useRef } from 'react';

export interface MeasurementInputProps {
  id?: string;
  name?: string;
  value: number | null | undefined;
  onChange: (canonicalValue: number | null) => void;
  unit: string;
  toDisplay?: (canonical: number | null | undefined) => number | null;
  fromDisplay?: (display: number | null | undefined) => number | null;
  placeholder?: string;
  className?: string;
  unitLabel?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: string | number;
  ariaLabel?: string;
  onBlur?: () => void;
}

/**
 * Shared numeric biometric measurement input.
 * - Buffers raw keystrokes locally to prevent cursor jumping or decimal stripping.
 * - Does not apply destructive unit conversion or forced decimal formatting on every keystroke.
 * - Handles empty values cleanly without restoring previous values.
 * - Synchronizes with canonical values without lossy re-formatting.
 */
export const MeasurementInput: React.FC<MeasurementInputProps> = ({
  id,
  name,
  value,
  onChange,
  unit,
  toDisplay,
  fromDisplay,
  placeholder,
  className = '',
  unitLabel,
  disabled = false,
  min,
  max,
  step,
  ariaLabel,
  onBlur,
}) => {
  // Helper to compute display number from canonical value
  const getDisplayValue = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val) || val <= 0) return '';
    const displayNum = toDisplay ? toDisplay(val) : val;
    return displayNum != null && !isNaN(displayNum) ? String(displayNum) : '';
  };

  const [rawInput, setRawInput] = useState<string>(() => getDisplayValue(value));
  const lastCommittedCanonicalRef = useRef<number | null | undefined>(value);
  const prevUnitRef = useRef<string>(unit);

  // Synchronize when the unit toggles (e.g., kg <-> lbs or cm <-> in)
  useEffect(() => {
    if (prevUnitRef.current !== unit) {
      prevUnitRef.current = unit;
      const nextDisplay = getDisplayValue(value);
      setRawInput(nextDisplay);
    }
  }, [unit, value, toDisplay]);

  // Synchronize when canonical value changes externally (e.g. initial profile load or reset)
  useEffect(() => {
    if (value !== lastCommittedCanonicalRef.current) {
      lastCommittedCanonicalRef.current = value;
      setRawInput(getDisplayValue(value));
    }
  }, [value, toDisplay]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;

    // Reject non-numeric input; allow empty string or numbers with at most one decimal point
    if (nextVal !== '' && !/^\d*\.?\d*$/.test(nextVal)) {
      return;
    }

    setRawInput(nextVal);

    // If cleared, immediately commit null canonical value
    if (nextVal.trim() === '') {
      lastCommittedCanonicalRef.current = null;
      onChange(null);
      return;
    }

    // If complete number (not ending with pending decimal like "125.")
    if (!nextVal.endsWith('.')) {
      const parsed = parseFloat(nextVal);
      if (!isNaN(parsed) && parsed > 0) {
        const canonical = fromDisplay ? fromDisplay(parsed) : parsed;
        lastCommittedCanonicalRef.current = canonical;
        onChange(canonical);
      }
    }
  };

  const handleInputBlur = () => {
    const trimmed = rawInput.trim();

    if (trimmed === '') {
      setRawInput('');
      lastCommittedCanonicalRef.current = null;
      onChange(null);
    } else if (trimmed.endsWith('.')) {
      // Clean up dangling decimal point, e.g. "125." -> "125"
      const cleaned = trimmed.slice(0, -1);
      setRawInput(cleaned);
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        const canonical = fromDisplay ? fromDisplay(parsed) : parsed;
        lastCommittedCanonicalRef.current = canonical;
        onChange(canonical);
      }
    }

    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="decimal"
        id={id}
        name={name}
        value={rawInput}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        className={className}
      />
      {unitLabel && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#55718F] pointer-events-none select-none font-medium">
          {unitLabel}
        </span>
      )}
    </div>
  );
};
