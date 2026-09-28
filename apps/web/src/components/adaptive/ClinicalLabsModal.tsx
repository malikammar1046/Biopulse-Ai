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

interface ClinicalLabsModalProps {
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
  category: 'hormonal' | 'metabolic' | 'vitals';
}

export const FIELD_CONFIGS: FieldConfig[] = [
  // Hormonal
  { key: 'fsh', label: 'FSH', unit: 'mIU/mL', min: 0, max: 200, step: '0.01', category: 'hormonal' },
  { key: 'lh', label: 'LH', unit: 'mIU/mL', min: 0, max: 200, step: '0.01', category: 'hormonal' },
  { key: 'amh', label: 'AMH', unit: 'ng/mL', min: 0, max: 100, step: '0.01', category: 'hormonal' },
  { key: 'prolactin', label: 'Prolactin (PRL)', unit: 'ng/mL', min: 0, max: 500, step: '0.01', category: 'hormonal' },
  { key: 'tsh', label: 'TSH', unit: 'mIU/L', min: 0, max: 100, step: '0.01', category: 'hormonal' },
  { key: 'progesterone', label: 'Progesterone (PRG)', unit: 'ng/mL', min: 0, max: 100, step: '0.01', category: 'hormonal' },
  // Metabolic & Blood
  { key: 'rbs', label: 'RBS (Random Glucose)', unit: 'mg/dL', min: 20, max: 600, step: '0.1', category: 'metabolic' },
  { key: 'vitamin_d3', label: 'Vitamin D3', unit: 'ng/mL', min: 0, max: 250, step: '0.01', category: 'metabolic' },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', min: 2, max: 25, step: '0.1', category: 'metabolic' },
  { key: 'beta_hcg_i', label: 'Beta HCG I', unit: 'mIU/mL', min: 0, max: 1000000, step: '0.01', category: 'metabolic' },
  { key: 'beta_hcg_ii', label: 'Beta HCG II', unit: 'mIU/mL', min: 0, max: 1000000, step: '0.01', category: 'metabolic' },
  // Vitals
  { key: 'bp_systolic', label: 'BP Systolic', unit: 'mmHg', min: 50, max: 260, step: '1', category: 'vitals' },
  { key: 'bp_diastolic', label: 'BP Diastolic', unit: 'mmHg', min: 30, max: 160, step: '1', category: 'vitals' },
  { key: 'pulse_rate_bpm', label: 'Pulse Rate', unit: 'bpm', min: 30, max: 240, step: '1', category: 'vitals' },
  { key: 'respiratory_rate', label: 'Respiratory Rate', unit: 'breaths/min', min: 6, max: 60, step: '1', category: 'vitals' },
];

/**
 * Standard sample measurements for development testing only (gated behind DEV).
 */
export const SAMPLE_MOCK_DATA: Record<string, string> = {
  fsh: '6.5',
  lh: '7.2',
  amh: '4.5',
  tsh: '2.1',
  prolactin: '18.0',
  progesterone: '0.8',
  vitamin_d3: '28.5',
  rbs: '95.0',
  hemoglobin: '12.8',
  beta_hcg_i: '1.2',
  beta_hcg_ii: '1.1',
  pulse_rate_bpm: '76',
  respiratory_rate: '16',
  bp_systolic: '118',
  bp_diastolic: '76',
};

/**
 * Intelligently maps OCR extracted lab test results to the 15 Tier 2 biomarker keys.
 */
export const mapOcrResultsToTier2 = (
  results: ReportResultInput[]
): { mapped: Record<string, string>; count: number } => {
  const mapped: Record<string, string> = {};
  let count = 0;
  let assignedBetaHcgI = false;

  for (const item of results) {
    const rawName = (item.testName || '').toLowerCase().trim();
    const valNum = item.resultNumeric ?? parseNumericValue(item.resultValue);
    if (valNum === null || valNum === undefined || isNaN(valNum)) continue;

    const valStr = String(valNum);

    // 1. FSH
    if ((rawName.includes('fsh') || rawName.includes('follicle')) && !mapped['fsh']) {
      mapped['fsh'] = valStr;
      count++;
    }
    // 2. LH
    else if (
      (rawName.includes('lh') || rawName.includes('luteiniz') || rawName.includes('luteinis')) &&
      !mapped['lh']
    ) {
      mapped['lh'] = valStr;
      count++;
    }
    // 3. AMH
    else if (
      (rawName.includes('amh') || rawName.includes('mullerian') || rawName.includes('müllerian')) &&
      !mapped['amh']
    ) {
      mapped['amh'] = valStr;
      count++;
    }
    // 4. TSH
    else if ((rawName.includes('tsh') || rawName.includes('thyroid')) && !mapped['tsh']) {
      mapped['tsh'] = valStr;
      count++;
    }
    // 5. Prolactin
    else if ((rawName.includes('prolactin') || rawName.includes('prl')) && !mapped['prolactin']) {
      mapped['prolactin'] = valStr;
      count++;
    }
    // 6. Progesterone
    else if (
      (rawName.includes('progesterone') || rawName.includes('prg') || rawName === 'p4') &&
      !mapped['progesterone']
    ) {
      mapped['progesterone'] = valStr;
      count++;
    }
    // 7. Vitamin D3
    else if (
      (rawName.includes('vitamin d') ||
        rawName.includes('vit d') ||
        rawName.includes('25-oh') ||
        rawName.includes('d3')) &&
      !mapped['vitamin_d3']
    ) {
      mapped['vitamin_d3'] = valStr;
      count++;
    }
    // 8. RBS / Glucose
    else if (
      (rawName.includes('rbs') ||
        rawName.includes('glucose') ||
        rawName.includes('sugar') ||
        rawName.includes('fbs')) &&
      !mapped['rbs']
    ) {
      mapped['rbs'] = valStr;
      count++;
    }
    // 9. Hemoglobin
    else if (
      (rawName.includes('hemoglobin') ||
        rawName.includes('haemoglobin') ||
        rawName.includes('hb') ||
        rawName.includes('hgb')) &&
      !rawName.includes('hba1c') &&
      !mapped['hemoglobin']
    ) {
      mapped['hemoglobin'] = valStr;
      count++;
    }
    // 10. Beta HCG
    else if (
      (rawName.includes('beta hcg') || rawName.includes('beta-hcg') || rawName.includes('hcg')) &&
      !rawName.includes('fsh')
    ) {
      if (!assignedBetaHcgI) {
        mapped['beta_hcg_i'] = valStr;
        assignedBetaHcgI = true;
        count++;
      } else if (!mapped['beta_hcg_ii']) {
        mapped['beta_hcg_ii'] = valStr;
        count++;
      }
    }
    // 11. Pulse Rate
    else if (
      (rawName.includes('pulse') || rawName.includes('heart rate') || rawName.includes('bpm')) &&
      !mapped['pulse_rate_bpm']
    ) {
      mapped['pulse_rate_bpm'] = valStr;
      count++;
    }
    // 12. Respiratory Rate
    else if (
      (rawName.includes('respiratory') || rawName.includes('breathing')) &&
      !mapped['respiratory_rate']
    ) {
      mapped['respiratory_rate'] = valStr;
      count++;
    }
    // 13. BP Systolic
    else if (
      (rawName.includes('systolic') || (rawName.includes('bp') && rawName.includes('sys'))) &&
      !mapped['bp_systolic']
    ) {
      mapped['bp_systolic'] = valStr;
      count++;
    }
    // 14. BP Diastolic
    else if (
      (rawName.includes('diastolic') || (rawName.includes('bp') && rawName.includes('dia'))) &&
      !mapped['bp_diastolic']
    ) {
      mapped['bp_diastolic'] = valStr;
      count++;
    }
  }

  // Check for compound BP values like "120/80" in non-numeric values
  for (const item of results) {
    const rawName = (item.testName || '').toLowerCase();
    if (rawName.includes('blood pressure') || rawName.includes('bp')) {
      const match = String(item.resultValue).match(/(\d{2,3})\s*[\/\\-]\s*(\d{2,3})/);
      if (match) {
        if (!mapped['bp_systolic']) {
          mapped['bp_systolic'] = match[1];
          count++;
        }
        if (!mapped['bp_diastolic']) {
          mapped['bp_diastolic'] = match[2];
          count++;
        }
      }
    }
  }

  return { mapped, count };
};

export const ClinicalLabsModal: React.FC<ClinicalLabsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeAssessment, submitTier2, clearTier2, fetchClinicalState } = useUserHealth();

  // Workflow entry mode: 'manual' vs 'upload'
  const [entryMode, setEntryMode] = useState<'manual' | 'upload'>('manual');

  // Form values & tracking
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [removedFields, setRemovedFields] = useState<string[]>([]);
  const [ocrExtractedFields, setOcrExtractedFields] = useState<string[]>([]);

  // OCR state
  const [isScanningReport, setIsScanningReport] = useState(false);
  const [ocrBanner, setOcrBanner] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Clear Tier 2 confirmation
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearingTier2, setClearingTier2] = useState(false);

  // Async submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDev = Boolean(import.meta.env.DEV);

  // Hydrate authoritative existing values when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const hydrateState = async () => {
      let savedInputs =
        activeAssessment?.tier_2_inputs ||
        (activeAssessment as any)?.authoritative_tier_2_inputs ||
        activeAssessment?.input_features ||
        {};

      try {
        if (fetchClinicalState) {
          const state = await fetchClinicalState('female_pcos');
          if (state?.tier_2_inputs && Object.keys(state.tier_2_inputs).length > 0) {
            savedInputs = state.tier_2_inputs;
          }
        }
      } catch (err) {
        console.warn('Authoritative state hydration notice:', err);
      }

      if (!isMounted) return;

      const initial: Record<string, string> = {};
      FIELD_CONFIGS.forEach((cfg) => {
        const val = savedInputs[cfg.key];
        if (val !== undefined && val !== null && val !== '') {
          initial[cfg.key] = String(val);
        } else {
          initial[cfg.key] = '';
        }
      });

      setFormValues(initial);
      setFieldErrors({});
      setRemovedFields([]);
      setOcrExtractedFields([]);
      setOcrBanner(null);
      setEntryMode('manual');
      setError(null);
      setSuccess(false);
      setShowConfirmClear(false);
    };

    hydrateState();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeAssessment, fetchClinicalState]);

  if (!isOpen) return null;

  // Handle single field change with calm inline validation
  const handleFieldChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));

    // Unmark removal if user types a value
    if (val.trim() !== '') {
      setRemovedFields((prev) => prev.filter((f) => f !== key));
    }

    // Inline validation check
    const cfg = FIELD_CONFIGS.find((f) => f.key === key);
    if (!cfg) return;

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
    } else if (num < cfg.min || num > cfg.max) {
      setFieldErrors((prev) => ({
        ...prev,
        [key]: `Result must be between ${cfg.min} and ${cfg.max} ${cfg.unit}.`,
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

    const savedInputs = activeAssessment?.tier_2_inputs || activeAssessment?.input_features || {};
    if (savedInputs[key] !== undefined && savedInputs[key] !== null) {
      setRemovedFields((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  // Development only: fill sample values
  const handleDevFillMock = () => {
    setFormValues({ ...SAMPLE_MOCK_DATA });
    setFieldErrors({});
    setRemovedFields([]);
    setOcrBanner({
      type: 'info',
      message: 'Populated sample lab measurements for development verification.',
    });
  };

  // Process OCR lab report
  const handleProcessReportFile = async (file: File) => {
    if (!file) return;
    setIsScanningReport(true);
    setOcrBanner(null);
    setError(null);

    try {
      const extracted = await ocrService.extractReportData(file, 'hormone_test');
      const { mapped, count } = mapOcrResultsToTier2(extracted.extractedResults || []);

      if (count > 0) {
        setFormValues((prev) => ({ ...prev, ...mapped }));
        const newlyExtractedKeys = Object.keys(mapped);
        setOcrExtractedFields((prev) => Array.from(new Set([...prev, ...newlyExtractedKeys])));
        setRemovedFields((prev) => prev.filter((f) => !newlyExtractedKeys.includes(f)));

        // Automatically hand off to manual review of extracted values
        setEntryMode('manual');
        setOcrBanner({
          type: 'success',
          message: `Extracted ${count} result${count > 1 ? 's' : ''} from "${file.name}". You can review or adjust values below before saving.`,
        });
      } else {
        setEntryMode('manual');
        setOcrBanner({
          type: 'warning',
          message: `No recognized PCOS laboratory biomarkers found in "${file.name}". You can type values manually below.`,
        });
      }
    } catch (err: any) {
      console.error('OCR report extraction failed:', err);
      setEntryMode('manual');
      setOcrBanner({
        type: 'warning',
        message: 'Could not automatically scan this document. You can input your lab values manually.',
      });
    } finally {
      setIsScanningReport(false);
    }
  };

  // Count populated fields
  const countEnteredFields = () => {
    return FIELD_CONFIGS.filter((cfg) => formValues[cfg.key]?.trim() !== '').length;
  };

  const countCategoryAdded = (category: 'hormonal' | 'metabolic' | 'vitals') => {
    return FIELD_CONFIGS.filter(
      (cfg) => cfg.category === category && formValues[cfg.key]?.trim() !== ''
    ).length;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {};
      const errors: Record<string, string> = {};
      let enteredCount = 0;

      for (const cfg of FIELD_CONFIGS) {
        const rawStr = formValues[cfg.key]?.trim();
        if (rawStr !== undefined && rawStr !== '') {
          const num = parseFloat(rawStr);
          if (isNaN(num)) {
            errors[cfg.key] = 'Enter a valid numeric result.';
          } else if (num < cfg.min || num > cfg.max) {
            errors[cfg.key] = `Must be between ${cfg.min} and ${cfg.max} ${cfg.unit}.`;
          } else {
            payload[cfg.key] = num;
            enteredCount++;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Please resolve highlighted measurement errors before saving.');
      }

      if (removedFields.length > 0) {
        payload.remove_fields = removedFields;
      }

      const existingRemainingCount = Object.keys(activeAssessment?.tier_2_inputs || {}).filter(
        (k) => !removedFields.includes(k) && !payload[k]
      ).length;

      if (enteredCount === 0 && existingRemainingCount === 0) {
        throw new Error('Please add at least one test result from your lab report before saving.');
      }

      await submitTier2(payload);
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to submit clinical labs:', err);
      setError(err?.message || 'Failed to save clinical laboratory data. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClearTier2 = async () => {
    setClearingTier2(true);
    setError(null);
    try {
      await clearTier2('female_pcos');
      setShowConfirmClear(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to clear Tier 2 clinical data.');
    } finally {
      setClearingTier2(false);
    }
  };

  const enteredCount = countEnteredFields();
  const hormonalCount = countCategoryAdded('hormonal');
  const metabolicCount = countCategoryAdded('metabolic');
  const vitalsCount = countCategoryAdded('vitals');

  const hasExistingSavedData = Boolean(
    (activeAssessment?.tier_2_inputs && Object.keys(activeAssessment.tier_2_inputs).length > 0) ||
      ((activeAssessment as any)?.authoritative_tier_2_inputs &&
        Object.keys((activeAssessment as any).authoritative_tier_2_inputs).length > 0)
  );

  return (
    <ClinicalModalLayout
      isOpen={isOpen}
      onClose={onClose}
      badgeText="Tier 2"
      title="Add Clinical & Laboratory Data"
      description="Add the test results you currently have. You don't need to complete every field. You can return and add more later."
      accentColor="pink"
      isSubmitting={loading}
      submitButtonText={loading ? 'Saving Results...' : 'Save Results →'}
      submitDisabled={enteredCount === 0 && !hasExistingSavedData}
      onSubmit={handleSubmit}
      footerLeft={
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">
            {enteredCount > 0 ? (
              <span className="text-pink-700 font-semibold">
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
              <Beaker01 className="w-3 h-3 text-[#F43F7D]" aria-hidden="true" />
              <span>Fill Sample Values (Dev)</span>
            </button>
          )}

          {/* Revert / Clear Tier 2 Data */}
          {hasExistingSavedData && (
            showConfirmClear ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[11px] text-rose-700 font-medium">Revert to Tier 1?</span>
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
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
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
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-900">Partial data is normal: </span>
        Add only the tests available on your lab report. Your previously saved results are preserved when adding new ones.
      </div>

      {/* Choice of Entry Method: OCR vs Manual */}
      <EntryMethodSelector
        mode={entryMode}
        onSelectMode={(mode) => {
          setEntryMode(mode);
          setOcrBanner(null);
        }}
        accentColor="pink"
      />

      {/* OCR Upload View */}
      {entryMode === 'upload' && (
        <div className="space-y-4">
          <ReportUploadZone
            isScanning={isScanningReport}
            onFileSelect={handleProcessReportFile}
            accentColor="pink"
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
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : ocrBanner.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {ocrBanner.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <RefreshCw01 className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
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
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Clinical results updated! Recalculating your assessment.</span>
        </div>
      )}

      {/* Form Fields: Progressive Disclosure in 2-Column Sections */}
      <div className="space-y-4">
        {/* Section 1: Hormone Tests (Always open) */}
        <ClinicalSection
          title="Hormone Tests"
          description="Core reproductive hormones used in your PCOS screening assessment."
          addedCount={hormonalCount}
          collapsible={false}
          defaultExpanded={true}
          accentColor="pink"
        >
          {FIELD_CONFIGS.filter((f) => f.category === 'hormonal').map((cfg) => (
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
              accentColor="pink"
              onChange={(val) => handleFieldChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 2: Metabolic & Blood Tests (Collapsible) */}
        <ClinicalSection
          title="Metabolic & Blood Chemistry"
          description="Glycemic and nutritional biomarkers that influence hormonal balance."
          addedCount={metabolicCount}
          collapsible={true}
          defaultExpanded={metabolicCount > 0}
          accentColor="pink"
        >
          {FIELD_CONFIGS.filter((f) => f.category === 'metabolic').map((cfg) => (
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
              accentColor="pink"
              onChange={(val) => handleFieldChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 3: Physical Vitals (Collapsible) */}
        <ClinicalSection
          title="Clinical Vitals"
          description="Resting blood pressure and physiological baseline vitals."
          addedCount={vitalsCount}
          collapsible={true}
          defaultExpanded={vitalsCount > 0}
          accentColor="pink"
        >
          {FIELD_CONFIGS.filter((f) => f.category === 'vitals').map((cfg) => (
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
              accentColor="pink"
              onChange={(val) => handleFieldChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>
      </div>
    </ClinicalModalLayout>
  );
};
