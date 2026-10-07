import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XClose,
  InfoCircle,
  Upload01,
  FileCheck02,
  Loading01,
  Trash01,
  ChevronDown,
} from '@untitledui/icons';

/**
 * Standardized medical glossary explaining abbreviations to patients.
 */
export const CLINICAL_GLOSSARY: Record<string, { term: string; explanation: string }> = {
  // Female Hormonal
  fsh: {
    term: 'Follicle-Stimulating Hormone',
    explanation: 'Pituitary hormone that stimulates ovarian follicles to grow and mature each cycle.',
  },
  lh: {
    term: 'Luteinizing Hormone',
    explanation: 'Triggers ovulation and prompts hormone release. An altered LH-to-FSH ratio is common in PCOS.',
  },
  amh: {
    term: 'Anti-Müllerian Hormone',
    explanation: 'Secreted by growing pre-antral follicles; reflects ovarian follicle pool density and egg reserve.',
  },
  tsh: {
    term: 'Thyroid-Stimulating Hormone',
    explanation: 'Screens for thyroid gland imbalances that can cause cycle irregularity and metabolic symptoms.',
  },
  prolactin: {
    term: 'Prolactin (PRL)',
    explanation: 'Pituitary hormone; elevated levels can suppress ovulation and mimic PCOS symptoms.',
  },
  progesterone: {
    term: 'Progesterone (PRG)',
    explanation: 'Key post-ovulation hormone; confirms whether ovulation occurred and supports the luteal phase.',
  },
  // Female Metabolic & Blood
  vitamin_d3: {
    term: 'Vitamin D3 (25-OH)',
    explanation: 'Essential micronutrient involved in insulin sensitivity, follicular growth, and metabolic balance.',
  },
  rbs: {
    term: 'Random Blood Sugar (Glucose)',
    explanation: 'Circulating glucose level to screen for insulin resistance and glycemic regulation.',
  },
  hemoglobin: {
    term: 'Hemoglobin (Hb)',
    explanation: 'Oxygen-carrying protein in red blood cells; evaluates systemic oxygenation and anemia.',
  },
  beta_hcg_i: {
    term: 'Beta hCG (Initial)',
    explanation: 'Baseline Human Chorionic Gonadotropin to evaluate pregnancy status during amenorrhea evaluation.',
  },
  beta_hcg_ii: {
    term: 'Beta hCG (Follow-up)',
    explanation: 'Repeat measurement to evaluate hCG progression over 48–72 hours.',
  },
  // Female Vitals
  pulse_rate_bpm: {
    term: 'Pulse Rate',
    explanation: 'Resting heart rate in beats per minute, assessing baseline cardiovascular autonomic balance.',
  },
  respiratory_rate: {
    term: 'Respiratory Rate',
    explanation: 'Resting breaths per minute, reflecting physiological respiratory baseline.',
  },
  bp_systolic: {
    term: 'Systolic Blood Pressure',
    explanation: 'Peak arterial pressure during heart contraction; screens for metabolic cardiovascular strain.',
  },
  bp_diastolic: {
    term: 'Diastolic Blood Pressure',
    explanation: 'Resting arterial pressure between heart contractions.',
  },
  // Male Hormonal
  total_testosterone: {
    term: 'Total Testosterone',
    explanation: 'Primary androgen hormone governing male vitality, muscle mass, libido, and energy levels.',
  },
  shbg_nmol_l: {
    term: 'Sex Hormone-Binding Globulin',
    explanation: 'Blood protein that binds testosterone; determines how much free/bioavailable testosterone is active.',
  },
  estradiol_pg_ml: {
    term: 'Estradiol (E2)',
    explanation: 'Major estrogen hormone in men, aromatized from testosterone; regulates body fat and pituitary feedback.',
  },
  albumin_g_dl: {
    term: 'Serum Albumin',
    explanation: 'Major carrier protein that weakly binds testosterone; used to calculate bioavailable androgen levels.',
  },
  // Male Metabolic & Organ
  hba1c_pct: {
    term: 'Glycated Hemoglobin (HbA1c)',
    explanation: 'Average blood sugar over the previous 2 to 3 months; key marker for diabetes and insulin resistance.',
  },
  glucose_mg_dl: {
    term: 'Fasting Blood Glucose',
    explanation: 'Circulating blood sugar after an overnight fast; screens for glycemic dysregulation.',
  },
  hdl_mg_dl: {
    term: 'HDL Cholesterol',
    explanation: 'High-density lipoprotein (protective cholesterol); frequently lowered in androgen deficiency.',
  },
  uric_acid_mg_dl: {
    term: 'Serum Uric Acid',
    explanation: 'Byproduct of purine metabolism; elevated levels strongly correlate with metabolic syndrome.',
  },
  hemoglobin_g_dl: {
    term: 'Hemoglobin (Hb)',
    explanation: 'Iron-containing protein in red blood cells; androgen signaling directly supports red blood cell production.',
  },
  hematocrit_pct: {
    term: 'Hematocrit (HCT)',
    explanation: 'Percentage of blood composed of red blood cells; routinely monitored during androgen evaluation.',
  },
  rbc_count: {
    term: 'Red Blood Cell Count',
    explanation: 'Total number of red blood cells carrying oxygen throughout circulation.',
  },
  alt_u_l: {
    term: 'ALT / SGPT (Alanine Aminotransferase)',
    explanation: 'Liver enzyme; sensitive biomarker of hepatic cellular health and metabolic fatty liver disease.',
  },
  ast_u_l: {
    term: 'AST / SGOT (Aspartate Aminotransferase)',
    explanation: 'Enzyme found in liver and muscle tissue; evaluated alongside ALT for organ metabolic health.',
  },
  total_bilirubin_mg_dl: {
    term: 'Total Bilirubin',
    explanation: 'Yellow pigment produced from normal red blood cell breakdown; evaluates liver excretion capacity.',
  },
  creatinine_mg_dl: {
    term: 'Serum Creatinine',
    explanation: 'Metabolic waste product filtered out by healthy kidneys; principal marker of kidney function.',
  },
  bun_mg_dl: {
    term: 'Blood Urea Nitrogen',
    explanation: 'Waste product from dietary protein metabolism; evaluated alongside creatinine for renal health.',
  },
};

/**
 * Accessible medical tooltip component for abbreviations.
 */
interface MedicalGlossaryTooltipProps {
  glossaryKey: string;
  defaultTerm?: string;
  className?: string;
}

export const MedicalGlossaryTooltip: React.FC<MedicalGlossaryTooltipProps> = ({
  glossaryKey,
  defaultTerm,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const entry = CLINICAL_GLOSSARY[glossaryKey];
  const termName = entry?.term || defaultTerm || glossaryKey.toUpperCase();
  const explanation = entry?.explanation;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  if (!entry && !explanation) return null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-label={`Information about ${termName}`}
        aria-expanded={isOpen}
        className="p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400 rounded-full transition-colors cursor-pointer"
      >
        <InfoCircle className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className="absolute left-0 bottom-full mb-1.5 z-50 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl pointer-events-auto border border-slate-700/60 leading-relaxed font-sans"
          >
            <div className="font-semibold text-slate-100 mb-0.5">{termName}</div>
            <div className="text-[11px] text-slate-300">{explanation}</div>
            <div className="absolute left-2.5 top-full w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700/60 -translate-y-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual clinical input field with label, abbreviation tooltip, unit,
 * OCR badge, individual clear button, and calm inline validation.
 */
interface ClinicalFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  min: number;
  max: number;
  step?: string;
  isOcrExtracted?: boolean;
  accentColor?: 'pink' | 'blue';
  onChange: (value: string) => void;
  onClear: () => void;
  errorMessage?: string;
}

export const ClinicalField: React.FC<ClinicalFieldProps> = ({
  id,
  label,
  unit,
  value,
  min,
  max,
  step = 'any',
  isOcrExtracted = false,
  accentColor = 'pink',
  onChange,
  onClear,
  errorMessage,
}) => {
  const isFilled = value.trim() !== '';

  const focusBorderClass =
    accentColor === 'pink'
      ? 'focus:border-[#F43F7D] focus:ring-2 focus:ring-pink-500/20'
      : 'focus:border-[#0288D1] focus:ring-2 focus:ring-sky-500/20';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={`field-${id}`} className="text-xs font-medium text-slate-700 truncate">
            {label}
          </label>
          <MedicalGlossaryTooltip glossaryKey={id} defaultTerm={label} />
          {isOcrExtracted && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
              Extracted
            </span>
          )}
        </div>

        {isFilled && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
            title={`Clear ${label}`}
            aria-label={`Clear value for ${label}`}
          >
            <Trash01 className="w-3 h-3" aria-hidden="true" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          id={`field-${id}`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder="Enter result"
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-10 pl-3.5 pr-14 rounded-xl text-sm font-sans transition-all outline-none border ${
            errorMessage
              ? 'border-rose-400 bg-rose-50/20 text-slate-900'
              : isOcrExtracted
              ? 'border-emerald-300 bg-emerald-50/20 text-slate-900 font-medium'
              : isFilled
              ? 'border-slate-300 bg-white text-slate-900 font-medium'
              : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
          } ${focusBorderClass}`}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `error-${id}` : undefined}
        />
        {unit && (
          <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>

      {errorMessage ? (
        <p id={`error-${id}`} className="text-[11px] text-rose-600 font-sans leading-tight">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

/**
 * Clinical form section with clean title, description, added count badge,
 * and optional collapsible toggle for progressive disclosure.
 */
interface ClinicalSectionProps {
  title: string;
  description?: string;
  addedCount?: number;
  totalCount?: number;
  completionText?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accentColor?: 'pink' | 'blue';
}

export const ClinicalSection: React.FC<ClinicalSectionProps> = ({
  title,
  description,
  addedCount = 0,
  totalCount,
  completionText,
  collapsible = true,
  defaultExpanded = true,
  isExpanded: controlledExpanded,
  onToggle,
  icon,
  children,
  accentColor = 'pink',
}) => {
  const isControlled = controlledExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (!collapsible) return;
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const badgeClass =
    accentColor === 'pink'
      ? 'bg-pink-50 text-pink-700 border-pink-200/70'
      : 'bg-sky-50 dark:bg-sky-950/40 text-[#0288D1] dark:text-sky-300 border-sky-200/70 dark:border-sky-800';

  const iconBgClass =
    accentColor === 'pink'
      ? 'bg-pink-50 text-[#F43F7D]'
      : 'bg-sky-50 dark:bg-sky-950/50 text-[#0288D1] dark:text-sky-300';

  const activeBorderClass =
    isExpanded
      ? accentColor === 'pink'
        ? 'border-pink-200/80 shadow-xs'
        : 'border-sky-200/80 dark:border-sky-900/60 shadow-xs'
      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

  const displayCompletion =
    completionText ??
    (totalCount !== undefined
      ? `${addedCount} of ${totalCount} entered`
      : addedCount > 0
      ? `${addedCount} added`
      : undefined);

  const sectionSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const sectionId = `clinical-section-${sectionSlug}`;

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900/60 border transition-all duration-200 overflow-hidden ${activeBorderClass}`}
    >
      {/* Accordion Header Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!collapsible}
        aria-expanded={isExpanded}
        aria-controls={`${sectionId}-content`}
        id={`${sectionId}-header`}
        className={`w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left transition-colors select-none ${
          collapsible
            ? 'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
            : 'cursor-default'
        } ${isExpanded ? 'bg-slate-50/40 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-900/40'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 ${iconBgClass}`}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {title}
            </h4>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 sm:line-clamp-none">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {displayCompletion && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                addedCount > 0
                  ? badgeClass
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              {displayCompletion}
            </span>
          )}

          {collapsible && (
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-slate-600 dark:text-slate-300' : 'rotate-0'
              }`}
              aria-hidden="true"
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {(!collapsible || isExpanded) && (
          <motion.div
            id={`${sectionId}-content`}
            role="region"
            aria-labelledby={`${sectionId}-header`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Segmented entry method selector: "Upload Lab Report" vs "Enter Manually".
 */
interface EntryMethodSelectorProps {
  mode: 'manual' | 'upload';
  onSelectMode: (mode: 'manual' | 'upload') => void;
  accentColor?: 'pink' | 'blue';
}

export const EntryMethodSelector: React.FC<EntryMethodSelectorProps> = ({
  mode,
  onSelectMode,
  accentColor = 'pink',
}) => {
  const activeClass =
    accentColor === 'pink'
      ? 'border-[#F43F7D] bg-pink-50/40 text-slate-900 shadow-xs'
      : 'border-[#0288D1] bg-sky-50/40 text-slate-900 shadow-xs';

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        How would you like to add results?
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelectMode('upload')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
            mode === 'upload'
              ? activeClass
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              mode === 'upload'
                ? accentColor === 'pink'
                  ? 'bg-pink-100 text-[#F43F7D]'
                  : 'bg-sky-100 text-[#0288D1]'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Upload01 className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">
              Upload Lab Report
            </div>
            <div className="text-[11px] text-slate-500">
              Auto-extract available values from PDF or image
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('manual')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
            mode === 'manual'
              ? activeClass
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              mode === 'manual'
                ? accentColor === 'pink'
                  ? 'bg-pink-100 text-[#F43F7D]'
                  : 'bg-sky-100 text-[#0288D1]'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <FileCheck02 className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">
              Enter Manually
            </div>
            <div className="text-[11px] text-slate-500">
              Type or review values directly from your report
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

/**
 * Clean OCR Report Upload Zone with drag-and-drop support.
 */
interface ReportUploadZoneProps {
  isScanning: boolean;
  onFileSelect: (file: File) => void;
  accentColor?: 'pink' | 'blue';
  accept?: string;
  formatDescription?: string;
}

export const ReportUploadZone: React.FC<ReportUploadZoneProps> = ({
  isScanning,
  onFileSelect,
  accentColor = 'pink',
  accept = '.pdf,image/png,image/jpeg,image/jpg,image/webp',
  formatDescription = 'PDF, JPG or PNG • Max 15MB',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const activeDragClass =
    accentColor === 'pink'
      ? 'border-[#F43F7D] bg-pink-50/40'
      : 'border-[#0288D1] bg-sky-50/40';

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
          isDragging
            ? activeDragClass
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600">
          {isScanning ? (
            <Loading01 className="w-6 h-6 animate-spin text-[#0288D1]" aria-hidden="true" />
          ) : (
            <Upload01 className="w-6 h-6" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {isScanning ? 'Scanning report with OCR...' : 'Click to upload or drag and drop your report'}
          </p>
          <p className="text-xs text-slate-500">
            {isScanning ? 'Extracting clinical values automatically' : formatDescription}
          </p>
        </div>

        <button
          type="button"
          disabled={isScanning}
          className="mt-1 px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs"
        >
          {isScanning ? 'Scanning...' : 'Choose File'}
        </button>
      </div>
    </div>
  );
};

/**
 * Standard Clinical Modal Frame with fixed header, scrollable body,
 * and sticky footer. Always uses a calm clinical pure white surface.
 */
interface ClinicalModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  badgeText?: string;
  title: string;
  description: string;
  accentColor?: 'pink' | 'blue';
  children: React.ReactNode;
  footerLeft?: React.ReactNode;
  isSubmitting?: boolean;
  submitButtonText?: string;
  onSubmit: (e: React.FormEvent) => void;
  cancelButtonText?: string;
  submitDisabled?: boolean;
}

export const ClinicalModalLayout: React.FC<ClinicalModalLayoutProps> = ({
  isOpen,
  onClose,
  badgeText = 'Tier 2',
  title,
  description,
  accentColor = 'pink',
  children,
  footerLeft,
  isSubmitting = false,
  submitButtonText = 'Save Results',
  onSubmit,
  cancelButtonText = 'Cancel',
  submitDisabled = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submitButtonColor =
    accentColor === 'pink'
      ? 'bg-[#F43F7D] hover:bg-[#DC326C] text-white shadow-xs'
      : 'bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-xs';

  const badgeClass =
    accentColor === 'pink'
      ? 'bg-pink-50 text-pink-700 border-pink-200/70'
      : 'bg-sky-50 text-[#0288D1] border-sky-200/70';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clinical-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[820px] max-h-[88vh] flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-auto text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Sticky Header */}
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
                  {badgeText}
                </span>
              </div>
              <h2 id="clinical-modal-title" className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                {title}
              </h2>
              <p className="text-xs text-slate-500 font-sans max-w-xl">
                {description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Form wrapper for entire body + footer */}
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white text-slate-900">
            {/* Scrollable Body Only */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-white text-slate-900">
              {children}
            </div>

            {/* Sticky Fixed Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                {footerLeft}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {cancelButtonText}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || submitDisabled}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${submitButtonColor}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loading01 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{submitButtonText}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
