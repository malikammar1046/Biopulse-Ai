import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle,
  AlertCircle,
  Loading01,
  Trash01,
  RefreshCw01,
  Beaker01,
  Drop,
  Activity,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { ocrService } from '../../services/ocrService';
import type { ReportResultInput } from '../../types/report';
import { parseNumericValue } from '../../utils/reportCalculations';
import {
  ClinicalModalLayout,
  ClinicalSection,
  ClinicalField,
  EntryMethodSelector,
  ReportUploadZone,
} from './ClinicalModalPrimitives';

interface MaleClinicalLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type MaleCategory = 'hormones' | 'hematology_organ' | 'metabolic';

interface FieldConfig {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: string;
  category: MaleCategory;
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

  // Hematologic & Organ Function
  { key: 'hemoglobin_g_dl', label: 'Hemoglobin (Hb)', unit: 'g/dL', min: 2, max: 25, step: '0.1', category: 'hematology_organ' },
  { key: 'hematocrit_pct', label: 'Hematocrit (HCT)', unit: '%', min: 10, max: 75, step: '0.1', category: 'hematology_organ' },
  { key: 'rbc_count', label: 'RBC Count', unit: 'million/cumm', min: 1, max: 10, step: '0.01', category: 'hematology_organ' },
  { key: 'alt_u_l', label: 'ALT / SGPT (Liver)', unit: 'U/L', min: 0, max: 1000, step: '1', category: 'hematology_organ' },
  { key: 'ast_u_l', label: 'AST / SGOT (Liver)', unit: 'U/L', min: 0, max: 1000, step: '1', category: 'hematology_organ' },
  { key: 'total_bilirubin_mg_dl', label: 'Total Bilirubin', unit: 'mg/dL', min: 0, max: 30, step: '0.01', category: 'hematology_organ' },
  { key: 'creatinine_mg_dl', label: 'Serum Creatinine', unit: 'mg/dL', min: 0.1, max: 20, step: '0.01', category: 'hematology_organ' },
  { key: 'bun_mg_dl', label: 'Blood Urea Nitrogen', unit: 'mg/dL', min: 1, max: 150, step: '0.1', category: 'hematology_organ' },

  // Metabolic & Glycemic
  { key: 'glucose_mg_dl', label: 'Fasting Glucose', unit: 'mg/dL', min: 20, max: 600, step: '0.1', category: 'metabolic' },
  { key: 'hba1c_pct', label: 'HbA1c (Glycated Hb)', unit: '%', min: 3, max: 20, step: '0.1', category: 'metabolic' },
  { key: 'hdl_mg_dl', label: 'HDL Cholesterol', unit: 'mg/dL', min: 5, max: 150, step: '0.1', category: 'metabolic' },
  { key: 'uric_acid_mg_dl', label: 'Serum Uric Acid', unit: 'mg/dL', min: 0.5, max: 20, step: '0.1', category: 'metabolic' },
];

/**
 * Standard sample measurements for development testing only (gated behind DEV).
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
    // Glucose
    else if ((rawName.includes('glucose') || rawName.includes('sugar') || rawName.includes('rbs') || rawName.includes('fbs')) && !mapped['glucose_mg_dl']) {
      mapped['glucose_mg_dl'] = valStr;
      count++;
    }
    // HbA1c
    else if ((rawName.includes('hba1c') || rawName.includes('glycated')) && !mapped['hba1c_pct']) {
      mapped['hba1c_pct'] = valStr;
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

  // Workflow entry mode: 'manual' vs 'upload'
  const [entryMode, setEntryMode] = useState<'manual' | 'upload'>('manual');

  // Form values & tracking
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [removedFields, setRemovedFields] = useState<string[]>([]);
  const [ocrExtractedFields, setOcrExtractedFields] = useState<string[]>([]);

  // Categorized Accordion state (independent of clinical form state)
  const [expandedSections, setExpandedSections] = useState<Record<MaleCategory, boolean>>({
    hormones: true,
    hematology_organ: false,
    metabolic: false,
  });

  const toggleSection = (category: MaleCategory) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrBanner, setOcrBanner] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Clear Tier 2 confirmation
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearingTier2, setClearingTier2] = useState(false);

  // Async submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const isDev = Boolean(import.meta.env.DEV);

  // Hydrate authoritative existing values when modal opens
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
        } else {
          initial[fc.key] = '';
        }
      }

      setFormValues(initial);
      setFieldErrors({});
      setRemovedFields([]);
      setOcrExtractedFields([]);
      setExpandedSections({
        hormones: true,
        hematology_organ: false,
        metabolic: false,
      });
      setOcrBanner(null);
      setEntryMode('manual');
      setSubmitError(null);
      setSuccessNotice(false);
      setShowConfirmClear(false);
    };

    hydrateState();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeAssessment, fetchClinicalState]);

  if (!isOpen) return null;

  // Handle single field change with calm inline validation
  const handleChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));

    if (val.trim() !== '') {
      setRemovedFields((prev) => prev.filter((f) => f !== key));
    }

    const fc = MALE_FIELD_CONFIGS.find((f) => f.key === key);
    if (!fc) return;

    const trimmed = val.trim();
    if (trimmed === '') {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      setFieldErrors((prev) => ({ ...prev, [key]: 'Enter a valid numeric result.' }));
    } else if (num < fc.min || num > fc.max) {
      setFieldErrors((prev) => ({
        ...prev,
        [key]: `Result must be between ${fc.min} and ${fc.max} ${fc.unit}.`,
      }));
    } else {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Clear single field
  const handleClearField = (key: string) => {
    setFormValues((prev) => ({ ...prev, [key]: '' }));
    setOcrExtractedFields((prev) => prev.filter((k) => k !== key));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    const existing =
      activeAssessment?.tier_2_inputs ||
      activeAssessment?.input_features ||
      {};
    if (existing[key] !== undefined && existing[key] !== null) {
      setRemovedFields((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  // Dev 1-Click Mock Fill
  const handleDevFillMock = () => {
    setFormValues({ ...MALE_SAMPLE_MOCK_DATA });
    setFieldErrors({});
    setRemovedFields([]);
    setExpandedSections({
      hormones: true,
      hematology_organ: true,
      metabolic: true,
    });
    setOcrBanner({
      type: 'info',
      message: 'Populated sample male lab measurements for development verification.',
    });
  };

  // OCR file upload handler
  const handleOcrFileUpload = async (file: File) => {
    if (!file) return;

    setOcrLoading(true);
    setOcrBanner(null);
    setSubmitError(null);

    try {
      const ocrResult = await ocrService.extractReportData(file, 'hormone_test');
      const { mapped, count } = mapOcrResultsToMaleTier2(ocrResult.extractedResults || []);

      if (count === 0) {
        setEntryMode('manual');
        setOcrBanner({
          type: 'warning',
          message: `No matching male endocrine or metabolic values found in "${file.name}". You can type values manually below.`,
        });
      } else {
        setFormValues((prev) => ({ ...prev, ...mapped }));
        const newlyExtractedKeys = Object.keys(mapped);
        setOcrExtractedFields((prev) => Array.from(new Set([...prev, ...newlyExtractedKeys])));
        setRemovedFields((prev) => prev.filter((f) => !newlyExtractedKeys.includes(f)));

        // Automatically expand only categories containing at least one successfully OCR-mapped value
        const mappedKeysSet = new Set(newlyExtractedKeys);
        const newlyMappedHormones = MALE_FIELD_CONFIGS.filter((f) => f.category === 'hormones').some((f) => mappedKeysSet.has(f.key));
        const newlyMappedHematology = MALE_FIELD_CONFIGS.filter((f) => f.category === 'hematology_organ').some((f) => mappedKeysSet.has(f.key));
        const newlyMappedMetabolic = MALE_FIELD_CONFIGS.filter((f) => f.category === 'metabolic').some((f) => mappedKeysSet.has(f.key));

        setExpandedSections({
          hormones: newlyMappedHormones,
          hematology_organ: newlyMappedHematology,
          metabolic: newlyMappedMetabolic,
        });

        setEntryMode('manual');
        setOcrBanner({
          type: 'success',
          message: `Extracted ${count} result${count > 1 ? 's' : ''} from "${file.name}". Review and adjust any values below before saving.`,
        });
      }
    } catch (err: any) {
      setEntryMode('manual');
      setOcrBanner({
        type: 'warning',
        message: err?.message || 'Failed to process document with OCR. Please enter values manually.',
      });
    } finally {
      setOcrLoading(false);
    }
  };

  // Count active values
  const countEnteredFields = () => {
    return MALE_FIELD_CONFIGS.filter((fc) => formValues[fc.key]?.trim() !== '').length;
  };

  const countCategoryAdded = (category: 'hormones' | 'metabolic' | 'hematology_organ') => {
    return MALE_FIELD_CONFIGS.filter(
      (fc) => fc.category === category && formValues[fc.key]?.trim() !== ''
    ).length;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      const errors: Record<string, string> = {};
      let filledCount = 0;

      for (const fc of MALE_FIELD_CONFIGS) {
        const val = formValues[fc.key]?.trim();
        if (val !== undefined && val !== '') {
          const num = parseFloat(val);
          if (isNaN(num)) {
            errors[fc.key] = 'Enter a valid numeric result.';
          } else if (num < fc.min || num > fc.max) {
            errors[fc.key] = `Must be between ${fc.min} and ${fc.max} ${fc.unit}.`;
          } else {
            payload[fc.key] = num;
            filledCount++;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Please resolve highlighted measurement errors before saving.');
      }

      const existing =
        activeAssessment?.tier_2_inputs ||
        activeAssessment?.input_features ||
        {};

      const existingRemainingCount = Object.keys(existing).filter(
        (k) => !removedFields.includes(k) && !payload[k]
      ).length;

      if (filledCount === 0 && existingRemainingCount === 0) {
        throw new Error('Please enter at least one clinical or laboratory value before saving.');
      }

      if (removedFields.length > 0) {
        payload['remove_fields'] = removedFields;
      }

      if (import.meta.env.DEV) {
        console.log(
          `[TIER2_TRACE] event=submit_start user=${activeAssessment?.patient_id || 'unknown'} module=male_hypogonadism active_before_id=${activeAssessment?.id} active_before_level=${activeAssessment?.assessment_level} tier2_field_count=${filledCount}`
        );
      }

      const res = await submitMaleTier2(payload);
      if (!res) {
        throw new Error(
          "We couldn't update your screening with these clinical values. Your previous assessment is unchanged. Please try again."
        );
      }

      if (
        res.assessment_level !== 'tier_1_2' &&
        res.assessment_level !== 'tier_1_2_3'
      ) {
        throw new Error(
          'Clinical data was not incorporated into the active assessment.'
        );
      }

      setSuccessNotice(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessNotice(false);
        onClose();
      }, 1200);
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

  const enteredCount = countEnteredFields();
  const hormoneCount = countCategoryAdded('hormones');
  const metabolicCount = countCategoryAdded('metabolic');
  const organCount = countCategoryAdded('hematology_organ');

  const hasExistingSavedData = Boolean(
    activeAssessment?.tier_2_inputs && Object.keys(activeAssessment.tier_2_inputs).length > 0
  );

  return (
    <ClinicalModalLayout
      isOpen={isOpen}
      onClose={onClose}
      badgeText="Tier 2"
      title="Add Clinical & Laboratory Evidence"
      description="Enter available blood markers or upload a lab report to refine your risk estimation. You don't need to complete every field."
      accentColor="blue"
      isSubmitting={submitting}
      submitButtonText={submitting ? 'Saving Results...' : 'Save Results →'}
      submitDisabled={enteredCount === 0 && !hasExistingSavedData}
      onSubmit={handleSubmit}
      footerLeft={
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {enteredCount > 0 ? (
              <span className="text-[#0288D1] dark:text-sky-300 font-semibold">
                {enteredCount} result{enteredCount > 1 ? 's' : ''} added
              </span>
            ) : (
              'No results entered yet'
            )}
          </span>

          {/* Development mock data button */}
          {isDev && (
            <button
              type="button"
              onClick={handleDevFillMock}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Development only: Quick fill sample values"
            >
              <Beaker01 className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
              <span>Fill Sample Values (Dev)</span>
            </button>
          )}

          {/* Revert / Clear Tier 2 Data */}
          {hasExistingSavedData && (
            showConfirmClear ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Revert to Tier 1?</span>
                <button
                  type="button"
                  onClick={handleConfirmClearTier2}
                  disabled={clearingTier2}
                  className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {clearingTier2 ? <Loading01 className="w-3 h-3 animate-spin" aria-hidden="true" /> : null}
                  <span>Confirm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-2 py-0.5 rounded-md text-slate-600 hover:text-slate-900 text-[11px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Remove previously saved Tier 2 results and revert to Tier 1"
              >
                <Trash01 className="w-3 h-3" aria-hidden="true" />
                <span>Clear Stored Labs</span>
              </button>
            )
          )}
        </div>
      }
    >
      {/* Informative Guidance */}
      <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <span className="font-semibold text-slate-900 dark:text-white">Partial data is normal: </span>
        Add only the tests available on your lab report. Your previously saved results are preserved when adding new ones.
      </div>

      {/* Choice of Entry Method: OCR vs Manual */}
      <EntryMethodSelector
        mode={entryMode}
        onSelectMode={(mode) => {
          setEntryMode(mode);
          setOcrBanner(null);
        }}
        accentColor="blue"
      />

      {/* OCR Upload View */}
      {entryMode === 'upload' && (
        <div className="space-y-4">
          <ReportUploadZone
            isScanning={ocrLoading}
            onFileSelect={handleOcrFileUpload}
            accentColor="blue"
            formatDescription="PDF, JPG or PNG • Max 15MB"
          />
        </div>
      )}

      {/* OCR Status Banner */}
      {ocrBanner && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 border ${
            ocrBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : ocrBanner.type === 'info'
              ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {ocrBanner.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <RefreshCw01 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            )}
            <span>{ocrBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setOcrBanner(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Error & Success Messages */}
      {submitError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Clinical results updated! Recalculating your assessment.</span>
        </div>
      )}

      {/* Form Fields: Categorized Accordion Sections */}
      <div className="space-y-3.5">
        {/* Section 1: Hormonal & Androgen Panel */}
        <ClinicalSection
          title="Hormonal & Androgen Panel"
          description="Core androgen markers, gonadotropins, and binding proteins."
          addedCount={hormoneCount}
          totalCount={7}
          collapsible={true}
          isExpanded={expandedSections.hormones}
          onToggle={() => toggleSection('hormones')}
          icon={<Beaker01 className="w-4 h-4" />}
          accentColor="blue"
        >
          {MALE_FIELD_CONFIGS.filter((f) => f.category === 'hormones').map((cfg) => (
            <ClinicalField
              key={cfg.key}
              id={cfg.key}
              label={cfg.label}
              unit={cfg.unit}
              value={formValues[cfg.key] || ''}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              isOcrExtracted={ocrExtractedFields.includes(cfg.key)}
              accentColor="blue"
              onChange={(val) => handleChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 2: Hematology & Organ Function */}
        <ClinicalSection
          title="Hematology & Organ Function"
          description="Complete blood counts, renal function, and hepatic cellular safety markers."
          addedCount={organCount}
          totalCount={8}
          collapsible={true}
          isExpanded={expandedSections.hematology_organ}
          onToggle={() => toggleSection('hematology_organ')}
          icon={<Drop className="w-4 h-4" />}
          accentColor="blue"
        >
          {MALE_FIELD_CONFIGS.filter((f) => f.category === 'hematology_organ').map((cfg) => (
            <ClinicalField
              key={cfg.key}
              id={cfg.key}
              label={cfg.label}
              unit={cfg.unit}
              value={formValues[cfg.key] || ''}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              isOcrExtracted={ocrExtractedFields.includes(cfg.key)}
              accentColor="blue"
              onChange={(val) => handleChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 3: Metabolic & Glycemic Profile */}
        <ClinicalSection
          title="Metabolic & Glycemic Profile"
          description="Fasting glucose, glycated hemoglobin, and lipid markers assessing metabolic syndrome."
          addedCount={metabolicCount}
          totalCount={4}
          collapsible={true}
          isExpanded={expandedSections.metabolic}
          onToggle={() => toggleSection('metabolic')}
          icon={<Activity className="w-4 h-4" />}
          accentColor="blue"
        >
          {MALE_FIELD_CONFIGS.filter((f) => f.category === 'metabolic').map((cfg) => (
            <ClinicalField
              key={cfg.key}
              id={cfg.key}
              label={cfg.label}
              unit={cfg.unit}
              value={formValues[cfg.key] || ''}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              isOcrExtracted={ocrExtractedFields.includes(cfg.key)}
              accentColor="blue"
              onChange={(val) => handleChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>
      </div>
    </ClinicalModalLayout>
  );
};
