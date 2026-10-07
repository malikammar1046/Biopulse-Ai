import React, { useState, useEffect, useRef } from 'react';
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
  ActivityHeart,
  Upload01,
  File01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { ocrService } from '../../services/ocrService';
import { reportService } from '../../services/reportService';
import type { ReportResultInput } from '../../types/report';
import { parseNumericValue } from '../../utils/reportCalculations';
import {
  ClinicalModalLayout,
  ClinicalSection,
  ClinicalField,
} from './ClinicalModalPrimitives';

interface ClinicalLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type FemaleCategory = 'hormonal' | 'metabolic' | 'vitals';

interface FieldConfig {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: string;
  category: FemaleCategory;
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
    // 4. Prolactin
    else if ((rawName.includes('prolactin') || rawName.includes('prl')) && !mapped['prolactin']) {
      mapped['prolactin'] = valStr;
      count++;
    }
    // 5. TSH
    else if ((rawName.includes('tsh') || rawName.includes('thyroid')) && !mapped['tsh']) {
      mapped['tsh'] = valStr;
      count++;
    }
    // 6. Progesterone
    else if ((rawName.includes('progesterone') || rawName.includes('prg')) && !mapped['progesterone']) {
      mapped['progesterone'] = valStr;
      count++;
    }
    // 7. RBS / Glucose
    else if (
      (rawName.includes('glucose') ||
        rawName.includes('rbs') ||
        rawName.includes('blood sugar') ||
        rawName.includes('fbs')) &&
      !mapped['rbs']
    ) {
      mapped['rbs'] = valStr;
      count++;
    }
    // 8. Vitamin D3
    else if (
      (rawName.includes('vitamin d') || rawName.includes('vit d') || rawName.includes('25-oh')) &&
      !mapped['vitamin_d3']
    ) {
      mapped['vitamin_d3'] = valStr;
      count++;
    }
    // 9. Hemoglobin
    else if (
      (rawName.includes('hemoglobin') || rawName.includes('haemoglobin') || rawName.includes('hb')) &&
      !rawName.includes('a1c') &&
      !mapped['hemoglobin']
    ) {
      mapped['hemoglobin'] = valStr;
      count++;
    }
    // 10. Beta HCG
    else if (
      rawName.includes('hcg') ||
      rawName.includes('human chorionic') ||
      rawName.includes('pregnancy')
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

interface BiomarkerConflict {
  key: string;
  label: string;
  unit: string;
  values: Array<{
    fileName: string;
    valStr: string;
  }>;
}

interface FieldProvenance {
  source: string;
  origin: 'extracted' | 'manual';
}

interface UploadedReportItem {
  id: string;
  name: string;
  status: 'processing' | 'success' | 'error';
  category?: FemaleCategory;
  count?: number;
  error?: string;
}

export const ClinicalLabsModal: React.FC<ClinicalLabsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeAssessment, submitTier2, clearTier2, fetchClinicalState, userProfile } = useUserHealth();

  // Multi-Report Clinical Inbox UI Mode
  const [reportUploadTab, setReportUploadTab] = useState<'multiple' | 'category'>('multiple');

  // Form values & tracking
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [removedFields, setRemovedFields] = useState<string[]>([]);
  const [ocrExtractedFields, setOcrExtractedFields] = useState<string[]>([]);
  const [fieldProvenances, setFieldProvenances] = useState<Record<string, FieldProvenance>>({});

  // Multi-report tracking & conflict resolution
  const [uploadedReports, setUploadedReports] = useState<UploadedReportItem[]>([]);
  const [conflicts, setConflicts] = useState<BiomarkerConflict[]>([]);
  const [isScanningReports, setIsScanningReports] = useState(false);

  // Categorized Accordion state
  const [expandedSections, setExpandedSections] = useState<Record<FemaleCategory, boolean>>({
    hormonal: true,
    metabolic: false,
    vitals: false,
  });

  const toggleSection = (category: FemaleCategory) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

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

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const categoryFileInputRefs = {
    hormonal: useRef<HTMLInputElement>(null),
    metabolic: useRef<HTMLInputElement>(null),
    vitals: useRef<HTMLInputElement>(null),
  };

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
      const initialProvenances: Record<string, FieldProvenance> = {};
      FIELD_CONFIGS.forEach((cfg) => {
        const val = savedInputs[cfg.key];
        if (val !== undefined && val !== null && val !== '') {
          initial[cfg.key] = String(val);
          initialProvenances[cfg.key] = { source: 'Prior assessment', origin: 'manual' };
        } else {
          initial[cfg.key] = '';
        }
      });

      setFormValues(initial);
      setFieldProvenances(initialProvenances);
      setFieldErrors({});
      setRemovedFields([]);
      setOcrExtractedFields([]);
      setUploadedReports([]);
      setConflicts([]);
      setExpandedSections({
        hormonal: true,
        metabolic: false,
        vitals: false,
      });
      setOcrBanner(null);
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

  // Handle single field change with calm inline validation and provenance update
  const handleFieldChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));

    if (val.trim() !== '') {
      setRemovedFields((prev) => prev.filter((f) => f !== key));
      setFieldProvenances((prev) => ({
        ...prev,
        [key]: { source: 'Manual entry', origin: 'manual' },
      }));
    }

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
    setFieldProvenances((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
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
    const provs: Record<string, FieldProvenance> = {};
    Object.keys(SAMPLE_MOCK_DATA).forEach((k) => {
      provs[k] = { source: 'Dev Sample', origin: 'manual' };
    });
    setFieldProvenances(provs);
    setFieldErrors({});
    setRemovedFields([]);
    setExpandedSections({
      hormonal: true,
      metabolic: true,
      vitals: true,
    });
    setOcrBanner({
      type: 'info',
      message: 'Populated sample lab measurements for development verification.',
    });
  };

  // Multi-Report Clinical Inbox: Parallel file processing, storage preservation & conflict routing
  const handleProcessMultipleFiles = async (
    files: FileList | File[],
    specificCategory?: FemaleCategory
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsScanningReports(true);
    setOcrBanner(null);
    setError(null);

    const newReportItems: UploadedReportItem[] = fileArray.map((f) => ({
      id: `${f.name}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      status: 'processing' as const,
      category: specificCategory,
    }));

    setUploadedReports((prev) => [...prev, ...newReportItems]);

    // Map each file safely in parallel
    const uploadTasks = fileArray.map(async (file) => {
      try {
        const reportType =
          specificCategory === 'metabolic'
            ? 'blood_test'
            : specificCategory === 'vitals'
            ? 'other'
            : 'hormone_test';

        // 1. OCR extraction
        const extracted = await ocrService.extractReportData(file, reportType);
        const { mapped, count } = mapOcrResultsToTier2(extracted.extractedResults || []);

        // 2. Preserve report via existing reportService
        const activeUid = userProfile?.id || activeAssessment?.patient_id || '';
        if (activeUid) {
          try {
            const { filePath } = await reportService.uploadReportFile(activeUid, file);
            await reportService.createMedicalReport(activeUid, {
              title: file.name.replace(/\.[^/.]+$/, '').replace(/[_.-]/g, ' '),
              reportType: reportType as any,
              reportDate: new Date().toISOString().split('T')[0],
              fileName: file.name,
              fileSize: file.size,
              filePath,
              mimeType: file.type || 'application/pdf',
              results: (extracted.extractedResults || []).map((r) => ({
                testName: r.testName,
                resultValue: r.resultValue,
                resultNumeric: r.resultNumeric ?? parseNumericValue(r.resultValue),
                unit: r.unit || '',
                referenceRange: r.referenceRange || '',
                status: 'within_range' as const,
                userVerified: false,
              })),
            });
          } catch (persistErr) {
            console.warn('Report service save notice:', persistErr);
          }
        }

        if (count === 0) {
          return {
            name: file.name,
            status: 'error' as const,
            error: 'No recognized biomarker numbers were identified in this file. You can enter values manually.',
            mapped: {},
            count: 0,
          };
        }

        return {
          name: file.name,
          status: 'success' as const,
          count,
          mapped,
        };
      } catch (err: any) {
        return {
          name: file.name,
          status: 'error' as const,
          error: err?.message || 'Report extraction failed. You can enter values manually.',
          mapped: {},
          count: 0,
        };
      }
    });

    const results = await Promise.all(uploadTasks);

    // Update statuses of uploaded reports
    setUploadedReports((prev) =>
      prev.map((item) => {
        const match = results.find((r) => r.name === item.name);
        return match
          ? { ...item, status: match.status, count: match.count, error: match.error }
          : item;
      })
    );

    // Aggregate extracted values by biomarker to detect conflicts across multiple files
    const biomarkerOccurrences: Record<string, Array<{ fileName: string; valStr: string }>> = {};
    const extractedKeys = new Set<string>();

    results.forEach((res) => {
      if (res.status === 'success' && res.mapped) {
        Object.entries(res.mapped).forEach(([key, valStr]) => {
          if (!biomarkerOccurrences[key]) biomarkerOccurrences[key] = [];
          biomarkerOccurrences[key].push({ fileName: res.name, valStr });
          extractedKeys.add(key);
        });
      }
    });

    const newConflicts: BiomarkerConflict[] = [];
    const directUpdates: Record<string, string> = {};
    const directProvs: Record<string, FieldProvenance> = {};

    Object.entries(biomarkerOccurrences).forEach(([key, occurrences]) => {
      const cfg = FIELD_CONFIGS.find((f) => f.key === key);
      const uniqueValues = Array.from(new Set(occurrences.map((o) => o.valStr)));

      if (uniqueValues.length > 1 && cfg) {
        // Conflict UI requirement: Multiple files contain differing values for the same biomarker
        newConflicts.push({
          key,
          label: cfg.label,
          unit: cfg.unit,
          values: occurrences,
        });
      } else {
        // Single value or identical across reports
        directUpdates[key] = occurrences[0].valStr;
        directProvs[key] = { source: occurrences[0].fileName, origin: 'extracted' };
      }
    });

    setFormValues((prev) => ({ ...prev, ...directUpdates }));
    setFieldProvenances((prev) => ({ ...prev, ...directProvs }));

    if (newConflicts.length > 0) {
      setConflicts((prev) => [
        ...prev.filter((c) => !newConflicts.some((nc) => nc.key === c.key)),
        ...newConflicts,
      ]);
    }

    const newlyExtractedKeys = Array.from(extractedKeys);
    setOcrExtractedFields((prev) => Array.from(new Set([...prev, ...newlyExtractedKeys])));
    setRemovedFields((prev) => prev.filter((f) => !newlyExtractedKeys.includes(f)));

    // Expand categories where extracted biomarkers were placed
    const extractedSet = new Set(newlyExtractedKeys);
    const hasHormonal = FIELD_CONFIGS.filter((f) => f.category === 'hormonal').some((f) =>
      extractedSet.has(f.key)
    );
    const hasMetabolic = FIELD_CONFIGS.filter((f) => f.category === 'metabolic').some((f) =>
      extractedSet.has(f.key)
    );
    const hasVitals = FIELD_CONFIGS.filter((f) => f.category === 'vitals').some((f) =>
      extractedSet.has(f.key)
    );

    setExpandedSections((prev) => ({
      hormonal: hasHormonal || prev.hormonal,
      metabolic: hasMetabolic || prev.metabolic,
      vitals: hasVitals || prev.vitals,
    }));

    const successfulFilesCount = results.filter((r) => r.status === 'success').length;
    const totalExtractedValues = results.reduce((sum, r) => sum + (r.count || 0), 0);

    if (successfulFilesCount > 0) {
      setOcrBanner({
        type: 'success',
        message: `Extracted ${totalExtractedValues} measurement${
          totalExtractedValues > 1 ? 's' : ''
        } from ${successfulFilesCount} clinical report${
          successfulFilesCount > 1 ? 's' : ''
        }. Review and edit any values below.`,
      });
    } else {
      setOcrBanner({
        type: 'warning',
        message: 'Could not extract measurements from the uploaded files. You can enter values manually below.',
      });
    }

    setIsScanningReports(false);
  };

  const handleResolveConflict = (key: string, chosenValue: string, sourceFileName: string) => {
    setFormValues((prev) => ({ ...prev, [key]: chosenValue }));
    setFieldProvenances((prev) => ({
      ...prev,
      [key]: { source: sourceFileName, origin: 'extracted' },
    }));
    setConflicts((prev) => prev.filter((c) => c.key !== key));
  };

  // Count populated fields
  const countEnteredFields = () => {
    return FIELD_CONFIGS.filter((cfg) => formValues[cfg.key]?.trim() !== '').length;
  };

  const countCategoryAdded = (category: FemaleCategory) => {
    return FIELD_CONFIGS.filter(
      (cfg) => cfg.category === category && formValues[cfg.key]?.trim() !== ''
    ).length;
  };

  // Submit Handler: One single reassessment for all reports & manual entries combined
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
        throw new Error('Please add at least one clinical or laboratory measurement before saving.');
      }

      // Requirement 3: Enforce valid result check before showing success
      const result = await submitTier2(payload);

      if (!result) {
        throw new Error(
          'Clinical data was not saved or the updated assessment could not be generated. Please try again.'
        );
      }

      if (
        result.assessment_level !== 'tier_1_2' &&
        result.assessment_level !== 'tier_1_2_3'
      ) {
        throw new Error(
          'Clinical data was not incorporated into the active assessment.'
        );
      }

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
      description="Add the test results you currently have. You don't need to complete every field. Previously saved values are preserved with patch semantics."
      accentColor="pink"
      isSubmitting={loading}
      submitButtonText={loading ? 'Saving Results...' : 'Save & Update Assessment →'}
      submitDisabled={enteredCount === 0 && !hasExistingSavedData}
      onSubmit={handleSubmit}
      footerLeft={
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">
            {enteredCount > 0 ? (
              <span className="text-pink-700 font-semibold">
                {enteredCount} measurement{enteredCount > 1 ? 's' : ''} added
              </span>
            ) : (
              'No results entered yet'
            )}
          </span>

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
      {/* ── Multi-Report Clinical Inbox ─────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Upload01 className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
              <span>Add Clinical Reports</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload one or multiple reports. BioPulse will extract available values and place them in the correct clinical sections.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-200/70 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setReportUploadTab('multiple')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                reportUploadTab === 'multiple'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Add Multiple Reports
            </button>
            <button
              type="button"
              onClick={() => setReportUploadTab('category')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                reportUploadTab === 'category'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload by Category
            </button>
          </div>
        </div>

        {/* Tab A: Multi-Report Uploader */}
        {reportUploadTab === 'multiple' ? (
          <div>
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessMultipleFiles(e.target.files);
                }
              }}
            />
            <div
              onClick={() => !isScanningReports && multiFileInputRef.current?.click()}
              className="p-6 rounded-xl border-2 border-dashed border-pink-200 hover:border-pink-300 bg-white hover:bg-pink-50/20 text-center cursor-pointer transition-colors space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F43F7D] flex items-center justify-center mx-auto">
                {isScanningReports ? (
                  <Loading01 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload01 className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {isScanningReports
                    ? 'Processing and extracting uploaded reports...'
                    : 'Click to select multiple reports or drag and drop'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Select hormone reports, CBC, lipid profiles, or metabolic tests • PDF, PNG, JPG
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Tab B: Upload by Category */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Category 1: Hormonal */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
              <input
                ref={categoryFileInputRefs.hormonal}
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessMultipleFiles(e.target.files, 'hormonal');
                  }
                }}
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Beaker01 className="w-3.5 h-3.5 text-pink-600" aria-hidden="true" />
                <span>Hormonal Tests</span>
              </div>
              <p className="text-[10px] text-slate-500">
                FSH, LH, AMH, Prolactin, TSH, Progesterone
              </p>
              <button
                type="button"
                onClick={() => categoryFileInputRefs.hormonal.current?.click()}
                disabled={isScanningReports}
                className="w-full py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Upload Hormone Report
              </button>
            </div>

            {/* Category 2: Metabolic */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
              <input
                ref={categoryFileInputRefs.metabolic}
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessMultipleFiles(e.target.files, 'metabolic');
                  }
                }}
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Drop className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                <span>Metabolic & Blood</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Random Blood Sugar, Vitamin D3, Hemoglobin, Beta HCG
              </p>
              <button
                type="button"
                onClick={() => categoryFileInputRefs.metabolic.current?.click()}
                disabled={isScanningReports}
                className="w-full py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Upload Metabolic Report
              </button>
            </div>

            {/* Category 3: Clinical Vitals */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
              <input
                ref={categoryFileInputRefs.vitals}
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessMultipleFiles(e.target.files, 'vitals');
                  }
                }}
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ActivityHeart className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Clinical Vitals</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Blood Pressure, Pulse Rate, Respiratory Rate
              </p>
              <button
                type="button"
                onClick={() => categoryFileInputRefs.vitals.current?.click()}
                disabled={isScanningReports}
                className="w-full py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Upload Vitals / Clinic Sheet
              </button>
            </div>
          </div>
        )}

        {/* Uploaded Reports Inbox Tray */}
        {uploadedReports.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Processed Reports in Inbox:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {uploadedReports.map((item) => (
                <div
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                    item.status === 'processing'
                      ? 'bg-slate-100 border-slate-200 text-slate-600'
                      : item.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <File01 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-medium truncate max-w-[140px]">{item.name}</span>
                  {item.status === 'processing' ? (
                    <Loading01 className="w-3 h-3 animate-spin text-slate-500" />
                  ) : item.status === 'success' ? (
                    <span className="text-[10px] font-bold text-emerald-600">
                      ✓ {item.count} extracted
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-600">⚠ Manual</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conflict Resolution UI */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map((conflict) => (
            <div
              key={conflict.key}
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Multiple values found for {conflict.label}</span>
              </div>
              <p className="text-xs text-amber-800">
                Different uploaded reports contain different results for this biomarker. Please select which value to use:
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {conflict.values.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleResolveConflict(conflict.key, opt.valStr, opt.fileName)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="text-slate-500">{opt.fileName}:</span>
                    <strong className="text-slate-900">
                      {opt.valStr} {conflict.unit}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
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
          <span>Clinical results saved and reassessment verified!</span>
        </div>
      )}

      {/* Form Fields: Categorized Accordion Sections */}
      <div className="space-y-3.5">
        {/* Section 1: Hormone Tests */}
        <ClinicalSection
          title="Hormonal Tests"
          description="Core reproductive and thyroid hormones from your endocrine panel."
          addedCount={hormonalCount}
          totalCount={6}
          collapsible={true}
          isExpanded={expandedSections.hormonal}
          onToggle={() => toggleSection('hormonal')}
          icon={<Beaker01 className="w-4 h-4" />}
          accentColor="pink"
        >
          {hormonalCount === 0 && (
            <div className="text-[11px] text-slate-500 italic pb-1">
              Don&apos;t have a report for this section? Enter values manually below.
            </div>
          )}
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
              sourceProvenance={fieldProvenances[cfg.key]?.source}
              originStatus={fieldProvenances[cfg.key]?.origin}
              accentColor="pink"
              onChange={(val) => handleFieldChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 2: Metabolic & Blood Chemistry */}
        <ClinicalSection
          title="Metabolic & Blood Chemistry"
          description="Glycemic and micronutrient biomarkers that influence metabolic regulation."
          addedCount={metabolicCount}
          totalCount={5}
          collapsible={true}
          isExpanded={expandedSections.metabolic}
          onToggle={() => toggleSection('metabolic')}
          icon={<Drop className="w-4 h-4" />}
          accentColor="pink"
        >
          {metabolicCount === 0 && (
            <div className="text-[11px] text-slate-500 italic pb-1">
              Don&apos;t have a report for this section? Enter values manually below.
            </div>
          )}
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
              sourceProvenance={fieldProvenances[cfg.key]?.source}
              originStatus={fieldProvenances[cfg.key]?.origin}
              accentColor="pink"
              onChange={(val) => handleFieldChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 3: Clinical Vitals */}
        <ClinicalSection
          title="Clinical Vitals / Blood & Clinical Measurements"
          description="Resting blood pressure and physiological baseline measurements."
          addedCount={vitalsCount}
          totalCount={4}
          collapsible={true}
          isExpanded={expandedSections.vitals}
          onToggle={() => toggleSection('vitals')}
          icon={<ActivityHeart className="w-4 h-4" />}
          accentColor="pink"
        >
          {vitalsCount === 0 && (
            <div className="text-[11px] text-slate-500 italic pb-1">
              Don&apos;t have a report for this section? Enter values manually below.
            </div>
          )}
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
              sourceProvenance={fieldProvenances[cfg.key]?.source}
              originStatus={fieldProvenances[cfg.key]?.origin}
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

export default ClinicalLabsModal;
