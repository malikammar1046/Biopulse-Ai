import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Trash2,
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
  { key: 'tsh', label: 'TSH', unit: 'mIU/L', min: 0, max: 100, step: '0.01', category: 'hormonal' },
  { key: 'prolactin', label: 'Prolactin (PRL)', unit: 'ng/mL', min: 0, max: 500, step: '0.01', category: 'hormonal' },
  { key: 'progesterone', label: 'Progesterone (PRG)', unit: 'ng/mL', min: 0, max: 100, step: '0.01', category: 'hormonal' },
  // Metabolic & Blood
  { key: 'vitamin_d3', label: 'Vitamin D3', unit: 'ng/mL', min: 0, max: 250, step: '0.01', category: 'metabolic' },
  { key: 'rbs', label: 'RBS (Random Glucose)', unit: 'mg/dL', min: 20, max: 600, step: '0.1', category: 'metabolic' },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', min: 2, max: 25, step: '0.1', category: 'metabolic' },
  { key: 'beta_hcg_i', label: 'Beta HCG I', unit: 'mIU/mL', min: 0, max: 1000000, step: '0.01', category: 'metabolic' },
  { key: 'beta_hcg_ii', label: 'Beta HCG II', unit: 'mIU/mL', min: 0, max: 1000000, step: '0.01', category: 'metabolic' },
  // Vitals
  { key: 'pulse_rate_bpm', label: 'Pulse Rate', unit: 'bpm', min: 30, max: 240, step: '1', category: 'vitals' },
  { key: 'respiratory_rate', label: 'Respiratory Rate', unit: 'breaths/min', min: 6, max: 60, step: '1', category: 'vitals' },
  { key: 'bp_systolic', label: 'BP Systolic', unit: 'mmHg', min: 50, max: 260, step: '1', category: 'vitals' },
  { key: 'bp_diastolic', label: 'BP Diastolic', unit: 'mmHg', min: 30, max: 160, step: '1', category: 'vitals' },
];

/**
 * Standard medically plausible sample / mock measurements for quick 1-click testing.
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

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [removedFields, setRemovedFields] = useState<string[]>([]);
  const [ocrExtractedFields, setOcrExtractedFields] = useState<string[]>([]);
  const [entryMode, setEntryMode] = useState<'manual' | 'mock'>('manual');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearingTier2, setClearingTier2] = useState(false);

  // OCR Upload / Processing state
  const [isScanningReport, setIsScanningReport] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrBanner, setOcrBanner] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Async submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prepopulate form when modal opens from authoritative clinical state
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const hydrateState = async () => {
      let savedInputs = activeAssessment?.tier_2_inputs || (activeAssessment as any)?.authoritative_tier_2_inputs || activeAssessment?.input_features || {};

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

  const handleFieldChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    // If user types a value in a field that was marked for removal, unmark it
    if (val.trim() !== '') {
      setRemovedFields((prev) => prev.filter((f) => f !== key));
    }
  };

  const handleClearField = (key: string) => {
    setFormValues((prev) => ({ ...prev, [key]: '' }));
    setOcrExtractedFields((prev) => prev.filter((k) => k !== key));
    const savedInputs = activeAssessment?.tier_2_inputs || activeAssessment?.input_features || {};
    if (savedInputs[key] !== undefined && savedInputs[key] !== null) {
      setRemovedFields((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  const handleFillMockData = () => {
    setFormValues({ ...SAMPLE_MOCK_DATA });
    setRemovedFields([]);
    setEntryMode('mock');
    setOcrBanner({
      type: 'info',
      message: 'Populated all 15 biomarker cells with realistic mock clinical lab measurements.',
    });
  };

  const handleClearAll = () => {
    const cleared: Record<string, string> = {};
    const allPreviouslySaved = Object.keys(
      activeAssessment?.tier_2_inputs || activeAssessment?.input_features || {}
    ).filter((k) => FIELD_CONFIGS.some((cfg) => cfg.key === k));

    FIELD_CONFIGS.forEach((cfg) => {
      cleared[cfg.key] = '';
    });

    setFormValues(cleared);
    setRemovedFields(allPreviouslySaved);
    setOcrExtractedFields([]);
    setEntryMode('manual');
    setOcrBanner(null);
  };

  const handleToggleEntryMode = (newMode: 'manual' | 'mock') => {
    setEntryMode(newMode);
    if (newMode === 'mock') {
      handleFillMockData();
    } else {
      // Revert to initial activeAssessment saved inputs or clear
      const savedInputs = activeAssessment?.tier_2_inputs || activeAssessment?.input_features || {};
      const restored: Record<string, string> = {};
      FIELD_CONFIGS.forEach((cfg) => {
        const val = savedInputs[cfg.key];
        restored[cfg.key] = val !== undefined && val !== null ? String(val) : '';
      });
      setFormValues(restored);
      setOcrExtractedFields([]);
      setOcrBanner(null);
    }
  };

  const handleProcessReportFile = async (file: File) => {
    if (!file) return;
    setIsScanningReport(true);
    setOcrBanner(null);
    setError(null);

    try {
      const extracted = await ocrService.extractReportData(file, 'hormone_test');
      const { mapped, count } = mapOcrResultsToTier2(extracted.extractedResults);

      if (count > 0) {
        setFormValues((prev) => ({ ...prev, ...mapped }));
        const newlyExtractedKeys = Object.keys(mapped);
        setOcrExtractedFields((prev) => Array.from(new Set([...prev, ...newlyExtractedKeys])));
        setRemovedFields((prev) => prev.filter((f) => !newlyExtractedKeys.includes(f)));

        setOcrBanner({
          type: 'success',
          message: `Extracted ${count} biomarker measurement(s) from "${file.name}" via OCR. You can review or refine any values below before submitting.`,
        });
      } else {
        setOcrBanner({
          type: 'warning',
          message: `Scanned "${file.name}", but no recognized Tier 2 biomarkers were found. You can enter measurements manually or fill mock data.`,
        });
      }
    } catch (err: any) {
      console.error('OCR report extraction failed:', err);
      setOcrBanner({
        type: 'warning',
        message: 'Could not automatically scan this document. You can still input your lab values manually.',
      });
    } finally {
      setIsScanningReport(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessReportFile(file);
    }
  };

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
      handleProcessReportFile(file);
    }
  };

  const countEnteredFields = () => {
    return FIELD_CONFIGS.filter((cfg) => formValues[cfg.key]?.trim() !== '').length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {};
      let enteredCount = 0;

      for (const cfg of FIELD_CONFIGS) {
        const rawStr = formValues[cfg.key]?.trim();
        if (rawStr !== undefined && rawStr !== '') {
          const num = parseFloat(rawStr);
          if (isNaN(num)) {
            throw new Error(`Invalid measurement for ${cfg.label}: please enter a valid number.`);
          }
          if (num < cfg.min || num > cfg.max) {
            const unitText = cfg.unit ? ` ${cfg.unit}` : '';
            throw new Error(
              `${cfg.label} (${num}${unitText}) is outside medically plausible range (${cfg.min}–${cfg.max}${unitText}).`
            );
          }
          payload[cfg.key] = num;
          enteredCount++;
        }
      }

      if (removedFields.length > 0) {
        payload.remove_fields = removedFields;
      }

      // Check if user has at least 1 field entered (or existing unremoved fields)
      const existingRemainingCount = Object.keys(activeAssessment?.tier_2_inputs || {}).filter(
        (k) => !removedFields.includes(k) && !payload[k]
      ).length;

      if (enteredCount === 0 && existingRemainingCount === 0) {
        throw new Error('Please provide at least one clinical or laboratory result to run a Tier 2 assessment.');
      }

      await submitTier2(payload);
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit clinical labs:', err);
      setError(err?.message || 'Failed to submit clinical lab data. Please check your inputs.');
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

  const renderSection = (category: 'hormonal' | 'metabolic' | 'vitals', title: string) => {

    const fields = FIELD_CONFIGS.filter((f) => f.category === category);
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-[#A797BD]">
          {title}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fields.map((cfg) => {
            const val = formValues[cfg.key] || '';
            const isPopulated = val.trim() !== '';
            const isOcrExtracted = ocrExtractedFields.includes(cfg.key);

            return (
              <div key={cfg.key} className="space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <label className="text-[11px] font-mono text-[#CDBDD8] truncate">
                      {cfg.label} {cfg.unit ? `(${cfg.unit})` : ''}
                    </label>
                    {isOcrExtracted && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-mono text-emerald-300">
                        OCR
                      </span>
                    )}
                  </div>

                  {isPopulated && (
                    <button
                      type="button"
                      onClick={() => handleClearField(cfg.key)}
                      title="Clear / Remove value"
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step={cfg.step || 'any'}
                    value={val}
                    placeholder="Not available"
                    onChange={(e) => handleFieldChange(cfg.key, e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl bg-white/10 border text-xs font-mono focus:outline-none transition-colors ${
                      isOcrExtracted
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-white font-semibold'
                        : isPopulated
                        ? 'border-[#BAE6FD] text-white font-semibold'
                        : 'border-white/20 text-white placeholder:text-white/40 focus:border-[#BAE6FD]'
                    }`}
                  />
                  {isPopulated && (
                    <span
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                        isOcrExtracted ? 'bg-emerald-300' : 'bg-[#BAE6FD]'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const enteredCount = countEnteredFields();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative max-w-2xl w-full my-8 p-6 sm:p-8 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-mono text-white">
                <FlaskConical className="w-3.5 h-3.5 text-[#BAE6FD]" />
                <span>Tier 2 Clinical Biomarkers</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Add Clinical & Laboratory Data
              </h2>
              <p className="text-xs text-sky-100 font-sans">
                You can provide only the tests you currently have, auto-extract them from an uploaded lab report, or fill mock data.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Toolbar: Mock / Manual Toggle + Upload OCR */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-sky-100">Input Mode:</span>
                <div className="inline-flex p-1 rounded-xl bg-black/20 border border-white/15 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => handleToggleEntryMode('manual')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      entryMode === 'manual'
                        ? 'bg-white text-[#01579B] font-bold shadow-xs'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Manual Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleEntryMode('mock')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      entryMode === 'mock'
                        ? 'bg-white text-[#01579B] font-bold shadow-xs'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#0288D1]" />
                    <span>Mock / Sample Data</span>
                  </button>
                </div>
              </div>

              {/* Quick Fill / Clear Buttons */}
              <div className="flex items-center gap-2">
                {entryMode === 'manual' && (
                  <button
                    type="button"
                    onClick={handleFillMockData}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono text-sky-100 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#BAE6FD]" />
                    <span>Fill Sample Values</span>
                  </button>
                )}

                {enteredCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-xs font-mono text-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Upload & Auto-Extract OCR Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isScanningReport && fileInputRef.current?.click()}
              className={`p-3.5 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDragging
                  ? 'border-white bg-white/20'
                  : 'border-white/30 bg-black/20 hover:border-white/50 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/15 border border-white/25 text-white shrink-0">
                  {isScanningReport ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#BAE6FD]" />
                  ) : (
                    <Upload className="w-5 h-5 text-[#BAE6FD]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold font-sans text-white flex items-center gap-2">
                    <span>Upload Lab Report (OCR Auto-Extract)</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white">
                      PDF or Image
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-100 font-sans">
                    {isScanningReport
                      ? 'Extracting hormonal & metabolic biomarkers with OCR...'
                      : 'Drop your test report here or click to auto-populate biomarker cells'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isScanningReport}
                className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-mono text-white transition-colors shrink-0 flex items-center gap-1.5"
              >
                {isScanningReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5 text-[#BAE6FD]" />
                    <span>Select Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OCR / Status Banners */}
          {ocrBanner && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border ${
                ocrBanner.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                  : ocrBanner.type === 'info'
                  ? 'bg-white/15 border-white/25 text-white'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-100'
              }`}
            >
              {ocrBanner.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-[#BAE6FD] shrink-0" />
              )}
              <span className="flex-1">{ocrBanner.message}</span>
              <button
                type="button"
                onClick={() => setOcrBanner(null)}
                className="text-white/70 hover:text-white text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Cumulative Model Notice & Partial Indicator */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-3 text-xs text-sky-100">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#BAE6FD] shrink-0" />
              <span>
                Enter at least 1 test to upgrade your assessment. You can always add more results later.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-mono text-white shrink-0">
              {enteredCount} / {FIELD_CONFIGS.length} tests
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>Clinical lab data processed! Your active assessment has been upgraded.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderSection('hormonal', 'Hormonal Panel')}
            {renderSection('metabolic', 'Metabolic & Micronutrient Biomarkers')}
            {renderSection('vitals', 'Clinical Vitals')}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/15">
              <div className="flex items-center gap-2 flex-wrap">
                {showConfirmClear ? (
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-500/20 border border-rose-400/30">
                    <span className="text-[11px] text-rose-200">Revert to Tier 1?</span>
                    <button
                      type="button"
                      onClick={handleConfirmClearTier2}
                      disabled={clearingTier2}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {clearingTier2 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      <span>Confirm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  ((activeAssessment?.tier_2_inputs && Object.keys(activeAssessment.tier_2_inputs).length > 0) ||
                   ((activeAssessment as any)?.authoritative_tier_2_inputs && Object.keys((activeAssessment as any).authoritative_tier_2_inputs).length > 0)) && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Explicitly remove all stored Tier 2 laboratory data and revert to Tier 1 screening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Tier 2 Data</span>
                    </button>
                  )
                )}
                <span className="text-[11px] font-mono text-sky-200">
                  {enteredCount > 0 ? `${enteredCount} measurement(s) ready` : 'No measurements entered'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading || clearingTier2}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-sans text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || clearingTier2}
                  className="px-6 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating Cumulative Model...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4" />
                      <span>{enteredCount > 0 ? 'Submit & Run Cumulative Tier 2' : 'Submit Clinical Data'}</span>
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
