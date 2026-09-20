import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Upload,
  Sparkles,
  RotateCcw,
  Check,
  FileCheck,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { ocrService } from '../../services/ocrService';
import type { ReportResultInput } from '../../types/report';
import { parseNumericValue } from '../../utils/reportCalculations';

interface MaleClinicalLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: string;
  category: 'hormones' | 'metabolic' | 'hematology_organ';
}

export const MALE_FIELD_CONFIGS: FieldConfig[] = [
  // Hormonal & Signaling (Direct & Indirect)
  { key: 'total_testosterone', label: 'Total Testosterone', unit: 'ng/dL', min: 0, max: 2000, step: '0.1', category: 'hormones' },
  { key: 'lh', label: 'LH (Luteinizing Hormone)', unit: 'mIU/mL', min: 0, max: 200, step: '0.01', category: 'hormones' },
  { key: 'fsh', label: 'FSH (Follicle-Stimulating)', unit: 'mIU/mL', min: 0, max: 200, step: '0.01', category: 'hormones' },
  { key: 'prolactin', label: 'Prolactin (PRL)', unit: 'ng/mL', min: 0, max: 500, step: '0.01', category: 'hormones' },
  { key: 'shbg_nmol_l', label: 'SHBG (Sex Hormone Globulin)', unit: 'nmol/L', min: 0, max: 300, step: '0.1', category: 'hormones' },
  { key: 'estradiol_pg_ml', label: 'Estradiol (E2)', unit: 'pg/mL', min: 0, max: 200, step: '0.1', category: 'hormones' },
  { key: 'albumin_g_dl', label: 'Serum Albumin', unit: 'g/dL', min: 1, max: 8, step: '0.1', category: 'hormones' },

  // Metabolic & Glycemic
  { key: 'hba1c_pct', label: 'HbA1c (Glycated Hb)', unit: '%', min: 3, max: 20, step: '0.1', category: 'metabolic' },
  { key: 'glucose_mg_dl', label: 'Fasting Glucose', unit: 'mg/dL', min: 20, max: 600, step: '0.1', category: 'metabolic' },
  { key: 'hdl_mg_dl', label: 'HDL Cholesterol', unit: 'mg/dL', min: 5, max: 150, step: '0.1', category: 'metabolic' },
  { key: 'uric_acid_mg_dl', label: 'Serum Uric Acid', unit: 'mg/dL', min: 0.5, max: 20, step: '0.1', category: 'metabolic' },

  // Hematologic & Organ Function
  { key: 'hemoglobin_g_dl', label: 'Hemoglobin (Hb)', unit: 'g/dL', min: 2, max: 25, step: '0.1', category: 'hematology_organ' },
  { key: 'hematocrit_pct', label: 'Hematocrit (HCT)', unit: '%', min: 10, max: 75, step: '0.1', category: 'hematology_organ' },
  { key: 'rbc_count', label: 'RBC Count', unit: 'million/cumm', min: 1, max: 10, step: '0.01', category: 'hematology_organ' },
  { key: 'alt_u_l', label: 'ALT / SGPT (Liver)', unit: 'U/L', min: 0, max: 1000, step: '1', category: 'hematology_organ' },
  { key: 'ast_u_l', label: 'AST / SGOT (Liver)', unit: 'U/L', min: 0, max: 1000, step: '1', category: 'hematology_organ' },
  { key: 'total_bilirubin_mg_dl', label: 'Total Bilirubin', unit: 'mg/dL', min: 0, max: 30, step: '0.01', category: 'hematology_organ' },
  { key: 'creatinine_mg_dl', label: 'Serum Creatinine', unit: 'mg/dL', min: 0.1, max: 20, step: '0.01', category: 'hematology_organ' },
  { key: 'bun_mg_dl', label: 'Blood Urea Nitrogen', unit: 'mg/dL', min: 1, max: 150, step: '0.1', category: 'hematology_organ' },
];

/**
 * Standard medically plausible sample measurements for quick 1-click testing.
 */
export const MALE_SAMPLE_MOCK_DATA: Record<string, string> = {
  total_testosterone: '240.0',
  lh: '2.4',
  fsh: '2.8',
  prolactin: '14.5',
  shbg_nmol_l: '24.5',
  estradiol_pg_ml: '22.0',
  albumin_g_dl: '4.4',
  hba1c_pct: '5.8',
  glucose_mg_dl: '104.0',
  hdl_mg_dl: '42.0',
  uric_acid_mg_dl: '6.4',
  hemoglobin_g_dl: '14.8',
  hematocrit_pct: '44.0',
  rbc_count: '4.9',
  alt_u_l: '32.0',
  ast_u_l: '26.0',
  total_bilirubin_mg_dl: '0.85',
  creatinine_mg_dl: '1.05',
  bun_mg_dl: '17.5',
};

/**
 * Maps OCR extracted lab test results to Male Tier 2 biomarker keys.
 */
export const mapOcrResultsToMaleTier2 = (
  results: ReportResultInput[]
): { mapped: Record<string, string>; count: number } => {
  const mapped: Record<string, string> = {};
  let count = 0;

  for (const item of results) {
    const rawName = (item.testName || '').toLowerCase().trim();
    const valNum = item.resultNumeric ?? parseNumericValue(item.resultValue);
    if (valNum === null || valNum === undefined || isNaN(valNum)) continue;

    const valStr = String(valNum);

    // Testosterone
    if ((rawName.includes('testosterone') || rawName.includes('total t')) && !rawName.includes('free') && !mapped['total_testosterone']) {
      mapped['total_testosterone'] = valStr;
      count++;
    }
    // LH
    else if ((rawName.includes('lh') || rawName.includes('luteinizing')) && !rawName.includes('fsh') && !mapped['lh']) {
      mapped['lh'] = valStr;
      count++;
    }
    // FSH
    else if ((rawName.includes('fsh') || rawName.includes('follicle')) && !rawName.includes('lh') && !mapped['fsh']) {
      mapped['fsh'] = valStr;
      count++;
    }
    // Prolactin
    else if ((rawName.includes('prolactin') || rawName.includes('prl')) && !mapped['prolactin']) {
      mapped['prolactin'] = valStr;
      count++;
    }
    // SHBG
    else if ((rawName.includes('shbg') || rawName.includes('sex hormone')) && !mapped['shbg_nmol_l']) {
      mapped['shbg_nmol_l'] = valStr;
      count++;
    }
    // Estradiol
    else if ((rawName.includes('estradiol') || rawName.includes('e2') || rawName.includes('oestradiol')) && !mapped['estradiol_pg_ml']) {
      mapped['estradiol_pg_ml'] = valStr;
      count++;
    }
    // Albumin
    else if (rawName.includes('albumin') && !mapped['albumin_g_dl']) {
      mapped['albumin_g_dl'] = valStr;
      count++;
    }
    // HbA1c
    else if ((rawName.includes('hba1c') || rawName.includes('glycated')) && !mapped['hba1c_pct']) {
      mapped['hba1c_pct'] = valStr;
      count++;
    }
    // Glucose
    else if ((rawName.includes('glucose') || rawName.includes('sugar') || rawName.includes('rbs') || rawName.includes('fbs')) && !mapped['glucose_mg_dl']) {
      mapped['glucose_mg_dl'] = valStr;
      count++;
    }
    // HDL
    else if (rawName.includes('hdl') && !mapped['hdl_mg_dl']) {
      mapped['hdl_mg_dl'] = valStr;
      count++;
    }
    // Uric Acid
    else if (rawName.includes('uric') && !mapped['uric_acid_mg_dl']) {
      mapped['uric_acid_mg_dl'] = valStr;
      count++;
    }
    // Hemoglobin
    else if ((rawName.includes('hemoglobin') || rawName.includes('hb') || rawName.includes('haemoglobin')) && !rawName.includes('a1c') && !mapped['hemoglobin_g_dl']) {
      mapped['hemoglobin_g_dl'] = valStr;
      count++;
    }
    // Hematocrit
    else if ((rawName.includes('hematocrit') || rawName.includes('hct') || rawName.includes('haematocrit')) && !mapped['hematocrit_pct']) {
      mapped['hematocrit_pct'] = valStr;
      count++;
    }
    // RBC
    else if ((rawName.includes('rbc') || rawName.includes('red blood cell')) && !mapped['rbc_count']) {
      mapped['rbc_count'] = valStr;
      count++;
    }
    // ALT
    else if ((rawName.includes('alt') || rawName.includes('sgpt')) && !mapped['alt_u_l']) {
      mapped['alt_u_l'] = valStr;
      count++;
    }
    // AST
    else if ((rawName.includes('ast') || rawName.includes('sgot')) && !mapped['ast_u_l']) {
      mapped['ast_u_l'] = valStr;
      count++;
    }
    // Total Bilirubin
    else if (rawName.includes('bilirubin') && !rawName.includes('direct') && !mapped['total_bilirubin_mg_dl']) {
      mapped['total_bilirubin_mg_dl'] = valStr;
      count++;
    }
    // Creatinine
    else if (rawName.includes('creatinine') && !mapped['creatinine_mg_dl']) {
      mapped['creatinine_mg_dl'] = valStr;
      count++;
    }
    // BUN
    else if ((rawName.includes('bun') || rawName.includes('urea nitrogen') || rawName.includes('urea')) && !mapped['bun_mg_dl']) {
      mapped['bun_mg_dl'] = valStr;
      count++;
    }
  }

  return { mapped, count };
};

export const MaleClinicalLabsModal: React.FC<MaleClinicalLabsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeAssessment, submitMaleTier2, clearTier2, fetchClinicalState } = useUserHealth();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearingTier2, setClearingTier2] = useState(false);

  // OCR state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Pre-populate with authoritative Tier 2 clinical values if present
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const hydrateState = async () => {
      let existing =
        activeAssessment?.tier_2_inputs ||
        (activeAssessment as any)?.authoritative_tier_2_inputs ||
        activeAssessment?.input_features ||
        {};

      try {
        if (fetchClinicalState) {
          const state = await fetchClinicalState('male_hypogonadism');
          if (state?.tier_2_inputs && Object.keys(state.tier_2_inputs).length > 0) {
            existing = state.tier_2_inputs;
          }
        }
      } catch (err) {
        console.warn('Male clinical state hydration notice:', err);
      }

      if (!isMounted) return;

      const initial: Record<string, string> = {};
      for (const fc of MALE_FIELD_CONFIGS) {
        if (
          existing[fc.key] !== undefined &&
          existing[fc.key] !== null &&
          existing[fc.key] !== ''
        ) {
          initial[fc.key] = String(existing[fc.key]);
        }
      }

      setFormValues(initial);
      setFieldErrors({});
      setSubmitError(null);
      setOcrSuccessMsg(null);
      setOcrError(null);
      setShowConfirmClear(false);
    };

    hydrateState();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeAssessment, fetchClinicalState]);


  // Handle value change
  const handleChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // 1-Click Mock Fill
  const handleFillMockData = () => {
    setFormValues({ ...MALE_SAMPLE_MOCK_DATA });
    setFieldErrors({});
    setSubmitError(null);
    setOcrSuccessMsg('Sample laboratory and hormone measurements filled successfully.');
    setTimeout(() => setOcrSuccessMsg(null), 4000);
  };

  // Reset all
  const handleResetAll = () => {
    setFormValues({});
    setFieldErrors({});
    setSubmitError(null);
    setOcrSuccessMsg(null);
    setOcrError(null);
  };

  // OCR file handler
  const handleOcrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError(null);
    setOcrSuccessMsg(null);

    try {
      const ocrResult = await ocrService.extractReportData(file, 'hormone_test');
      const { mapped, count } = mapOcrResultsToMaleTier2(ocrResult.extractedResults || []);

      if (count === 0) {
        setOcrError('No matching male lab or hormone values could be identified in this document.');
      } else {
        setFormValues((prev) => ({ ...prev, ...mapped }));
        setOcrSuccessMsg(`Extracted and filled ${count} lab value${count > 1 ? 's' : ''} from your report.`);
        setTimeout(() => setOcrSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setOcrError(err?.message || 'Failed to process the document. Please enter values manually.');
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let filledCount = 0;

    for (const fc of MALE_FIELD_CONFIGS) {
      const val = formValues[fc.key];
      if (val !== undefined && val !== null && val.trim() !== '') {
        filledCount++;
        const num = parseFloat(val);
        if (isNaN(num)) {
          errors[fc.key] = 'Must be a valid number.';
        } else if (num < fc.min || num > fc.max) {
          errors[fc.key] = `Value must be between ${fc.min} and ${fc.max} ${fc.unit}.`;
        }
      }
    }

    if (filledCount === 0) {
      setSubmitError('Please enter at least one clinical or laboratory value before continuing.');
      return false;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      const removeFields: string[] = [];
      const existing =
        activeAssessment?.tier_2_inputs ||
        activeAssessment?.input_features ||
        {};

      for (const fc of MALE_FIELD_CONFIGS) {
        const val = formValues[fc.key];
        if (val !== undefined && val !== null && val.trim() !== '') {
          payload[fc.key] = parseFloat(val);
        } else if (
          existing[fc.key] !== undefined &&
          existing[fc.key] !== null &&
          String(existing[fc.key]).trim() !== ''
        ) {
          // Only mark as removed if it previously existed and was cleared
          removeFields.push(fc.key);
        }
      }

      if (removeFields.length > 0) {
        payload['remove_fields'] = removeFields;
      }

      const res = await submitMaleTier2(payload);
      if (!res) {
        throw new Error('Failed to compute updated male assessment.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[Male Labs Modal] Submit error:', err);
      setSubmitError(err?.message || 'Encountered an error submitting laboratory assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmClearTier2 = async () => {
    setClearingTier2(true);
    setSubmitError(null);
    try {
      await clearTier2('male_hypogonadism');
      setShowConfirmClear(false);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to clear male Tier 2 laboratory data.');
    } finally {
      setClearingTier2(false);
    }
  };

  if (!isOpen) return null;


  const categories = [
    { id: 'hormones', title: 'Hormonal & Signaling Panel', desc: 'Direct hormones & binding proteins' },
    { id: 'metabolic', title: 'Metabolic & Glycemic Profile', desc: 'Glucose, HbA1c, lipids & uric acid' },
    { id: 'hematology_organ', title: 'Hematology & Organ Function', desc: 'Complete blood count, liver & renal markers' },
  ] as const;

  const activeValuesCount = Object.values(formValues).filter(
    (v) => v !== undefined && v !== null && v.trim() !== ''
  ).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-[#F0F9FF]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0288D1]/10 text-[#0288D1] flex items-center justify-center font-bold">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#01579B]">
                    Add Clinical & Laboratory Evidence
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
                    Tier 2 Screening
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter available blood markers or upload a lab report to refine your risk estimation.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar: Mock Fill, OCR Upload, Reset */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {activeValuesCount} of {MALE_FIELD_CONFIGS.length} values provided
              </span>
              {activeValuesCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Check className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 1-Click Mock Fill */}
              <button
                type="button"
                onClick={handleFillMockData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 font-medium transition-all"
                title="Fill all fields with medically realistic demo data"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill Mock Data
              </button>

              {/* OCR Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium transition-all disabled:opacity-50"
              >
                {ocrLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {ocrLoading ? 'Scanning...' : 'Upload Lab Report (OCR)'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleOcrFileUpload}
              />

              {/* Clear */}
              {activeValuesCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Clear all inputs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* OCR Feedback Alerts */}
          {ocrSuccessMsg && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
              <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{ocrSuccessMsg}</span>
            </div>
          )}

          {ocrError && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{ocrError}</span>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {categories.map((cat) => {
              const catFields = MALE_FIELD_CONFIGS.filter((f) => f.category === cat.id);
              return (
                <div key={cat.id} className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {cat.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {catFields.map((field) => {
                      const val = formValues[field.key] || '';
                      const err = fieldErrors[field.key];
                      const isFilled = val.trim() !== '';

                      return (
                        <div
                          key={field.key}
                          className={`p-3 rounded-xl border transition-all ${
                            isFilled
                              ? 'bg-teal-50/40 dark:bg-teal-950/10 border-teal-200 dark:border-teal-800/60'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate" title={field.label}>
                            {field.label}
                          </label>

                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step={field.step || 'any'}
                              value={val}
                              placeholder="Optional"
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              className="w-full pr-14 pl-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <span className="absolute right-2 text-[10px] font-medium text-slate-400 pointer-events-none">
                              {field.unit}
                            </span>
                          </div>

                          {err && (
                            <p className="text-[10px] text-red-500 mt-1 font-medium leading-tight">
                              {err}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Informational Footer */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-semibold">Cumulative Non-Leakage Screening Model</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300/80">
                  Total Testosterone and Free Testosterone are strictly reserved for rule-based pattern evaluation and are never used as training inputs. Missing values are filled using population median statistics.
                </p>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {showConfirmClear ? (
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30">
                    <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Revert to Tier 1?</span>
                    <button
                      type="button"
                      onClick={handleConfirmClearTier2}
                      disabled={clearingTier2}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {clearingTier2 ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      <span>Confirm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  (activeAssessment?.tier_2_inputs && Object.keys(activeAssessment.tier_2_inputs).length > 0) && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Explicitly remove all stored Tier 2 laboratory data and revert to Tier 1 screening"
                    >
                      <span>Clear Tier 2 Data</span>
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting || clearingTier2}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || clearingTier2 || activeValuesCount === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0288D1] hover:bg-[#0277BD] rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Computing Screening Model...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Update Assessment Result
                    </>
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
