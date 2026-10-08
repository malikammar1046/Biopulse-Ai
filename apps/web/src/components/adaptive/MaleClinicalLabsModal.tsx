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
  Activity,
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

interface MaleClinicalLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type MaleCategory = 'hormones' | 'metabolic' | 'hematology_organ';

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
  // Hormonal & Androgen Panel
  { key: 'total_testosterone', label: 'Total Testosterone', unit: 'ng/dL', min: 0, max: 2000, step: '0.1', category: 'hormones' },
  { key: 'lh', label: 'LH (Luteinizing Hormone)', unit: 'mIU/mL', min: 0, max: 200, step: '0.01', category: 'hormones' },
  { key: 'fsh', label: 'FSH (Follicle-Stimulating)', unit: 'mIU/mL', min: 0, max: 200, step: '0.01', category: 'hormones' },
  { key: 'prolactin', label: 'Prolactin (PRL)', unit: 'ng/mL', min: 0, max: 500, step: '0.01', category: 'hormones' },
  { key: 'shbg_nmol_l', label: 'SHBG (Sex Hormone Globulin)', unit: 'nmol/L', min: 0, max: 300, step: '0.1', category: 'hormones' },
  { key: 'estradiol_pg_ml', label: 'Estradiol (E2)', unit: 'pg/mL', min: 0, max: 200, step: '0.1', category: 'hormones' },
  { key: 'albumin_g_dl', label: 'Serum Albumin', unit: 'g/dL', min: 1, max: 8, step: '0.1', category: 'hormones' },

  // Metabolic & Glycemic Profile
  { key: 'glucose_mg_dl', label: 'Fasting Glucose', unit: 'mg/dL', min: 20, max: 600, step: '0.1', category: 'metabolic' },
  { key: 'hba1c_pct', label: 'HbA1c (Glycated Hb)', unit: '%', min: 3, max: 20, step: '0.1', category: 'metabolic' },
  { key: 'hdl_mg_dl', label: 'HDL Cholesterol', unit: 'mg/dL', min: 5, max: 150, step: '0.1', category: 'metabolic' },
  { key: 'uric_acid_mg_dl', label: 'Serum Uric Acid', unit: 'mg/dL', min: 0.5, max: 20, step: '0.1', category: 'metabolic' },

  // Hematology & Organ Function
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
  glucose_mg_dl: '104.0',
  hba1c_pct: '5.8',
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
  category?: MaleCategory;
  count?: number;
  error?: string;
}

export const MaleClinicalLabsModal: React.FC<MaleClinicalLabsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeAssessment, submitMaleTier2, clearTier2, fetchClinicalState, userProfile } = useUserHealth();

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
  const [expandedSections, setExpandedSections] = useState<Record<MaleCategory, boolean>>({
    hormones: true,
    metabolic: false,
    hematology_organ: false,
  });

  const toggleSection = (category: MaleCategory) => {
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const isDev = Boolean(import.meta.env.DEV);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const categoryFileInputRefs = {
    hormones: useRef<HTMLInputElement>(null),
    metabolic: useRef<HTMLInputElement>(null),
    hematology_organ: useRef<HTMLInputElement>(null),
  };

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
      const initialProv: Record<string, FieldProvenance> = {};
      for (const fc of MALE_FIELD_CONFIGS) {
        if (
          existing[fc.key] !== undefined &&
          existing[fc.key] !== null &&
          existing[fc.key] !== ''
        ) {
          initial[fc.key] = String(existing[fc.key]);
          initialProv[fc.key] = { source: 'Saved clinical profile', origin: 'manual' };
        } else {
          initial[fc.key] = '';
        }
      }

      setFormValues(initial);
      setFieldProvenances(initialProv);
      setFieldErrors({});
      setRemovedFields([]);
      setOcrExtractedFields([]);
      setUploadedReports([]);
      setConflicts([]);
      setIsScanningReports(false);
      setExpandedSections({
        hormones: true,
        metabolic: false,
        hematology_organ: false,
      });
      setOcrBanner(null);
      setReportUploadTab('multiple');
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

  // Handle single field change with calm inline validation and provenance update
  const handleChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));

    if (val.trim() !== '') {
      setRemovedFields((prev) => prev.filter((f) => f !== key));
      setFieldProvenances((prev) => ({
        ...prev,
        [key]: { source: 'Manual entry', origin: 'manual' },
      }));
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
    const provs: Record<string, FieldProvenance> = {};
    Object.keys(MALE_SAMPLE_MOCK_DATA).forEach((k) => {
      provs[k] = { source: 'Dev Sample', origin: 'manual' };
    });
    setFieldProvenances(provs);
    setFieldErrors({});
    setRemovedFields([]);
    setExpandedSections({
      hormones: true,
      metabolic: true,
      hematology_organ: true,
    });
    setOcrBanner({
      type: 'info',
      message: 'Populated sample male lab measurements for development verification.',
    });
  };

  // Multi-Report Clinical Inbox: Parallel file processing, storage preservation & conflict routing
  const handleProcessMultipleFiles = async (
    files: FileList | File[],
    specificCategory?: MaleCategory
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsScanningReports(true);
    setOcrBanner(null);
    setSubmitError(null);

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
            : specificCategory === 'hematology_organ'
            ? 'blood_test'
            : 'hormone_test';

        // 1. OCR extraction
        const extracted = await ocrService.extractReportData(file, reportType);
        const { mapped, count } = mapOcrResultsToMaleTier2(extracted.extractedResults || []);

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
            console.warn('Male report service save notice:', persistErr);
          }
        }

        if (count === 0) {
          return {
            name: file.name,
            status: 'error' as const,
            error: 'No matching male endocrine or metabolic values found. You can enter values manually.',
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
      const cfg = MALE_FIELD_CONFIGS.find((f) => f.key === key);
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
    const hasHormones = MALE_FIELD_CONFIGS.filter((f) => f.category === 'hormones').some((f) =>
      extractedSet.has(f.key)
    );
    const hasMetabolic = MALE_FIELD_CONFIGS.filter((f) => f.category === 'metabolic').some((f) =>
      extractedSet.has(f.key)
    );
    const hasHematology = MALE_FIELD_CONFIGS.filter((f) => f.category === 'hematology_organ').some((f) =>
      extractedSet.has(f.key)
    );

    setExpandedSections((prev) => ({
      hormones: hasHormones || prev.hormones,
      metabolic: hasMetabolic || prev.metabolic,
      hematology_organ: hasHematology || prev.hematology_organ,
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

  // Count active values
  const countEnteredFields = () => {
    return MALE_FIELD_CONFIGS.filter((fc) => formValues[fc.key]?.trim() !== '').length;
  };

  const countCategoryAdded = (category: MaleCategory) => {
    return MALE_FIELD_CONFIGS.filter(
      (fc) => fc.category === category && formValues[fc.key]?.trim() !== ''
    ).length;
  };

  // Submit Handler: One single cumulative reassessment
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

      // Requirement 3: Enforce valid result check before showing success
      const res = await submitMaleTier2(payload);
      if (!res) {
        throw new Error(
          'Clinical data was not saved or the updated assessment could not be generated. Please try again.'
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
      description="Enter available blood markers or upload a lab report to refine your risk estimation. You don't need to complete every field. Previously saved values are preserved with patch semantics."
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
      {/* Multi-Report Clinical Inbox */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Upload01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
              <span>Add Clinical Reports</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload one or multiple reports. BioPulse will extract available values and place them in the correct clinical sections.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setReportUploadTab('multiple')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                reportUploadTab === 'multiple'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Add Multiple Reports
            </button>
            <button
              type="button"
              onClick={() => setReportUploadTab('category')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                reportUploadTab === 'category'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              className="p-6 rounded-xl border-2 border-dashed border-sky-200 dark:border-sky-900 hover:border-sky-300 dark:hover:border-sky-700 bg-white dark:bg-slate-800 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 text-center cursor-pointer transition-colors space-y-2"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-[#0288D1] flex items-center justify-center mx-auto">
                {isScanningReports ? (
                  <Loading01 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload01 className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isScanningReports
                    ? 'Processing and extracting uploaded reports...'
                    : 'Click to select multiple reports or drag and drop'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Select endocrine panel, metabolic profile, or hematology report • PDF, PNG, JPG
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Tab B: Upload by Category */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Category 1: Hormonal & Androgen Panel */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <input
                ref={categoryFileInputRefs.hormones}
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessMultipleFiles(e.target.files, 'hormones');
                  }
                }}
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Beaker01 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <span>Hormonal & Androgen Panel</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Testosterone, LH, FSH, Prolactin, SHBG, Estradiol, Albumin
              </p>
              <button
                type="button"
                onClick={() => categoryFileInputRefs.hormones.current?.click()}
                disabled={isScanningReports}
                className="w-full py-1.5 px-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[#0288D1] dark:text-sky-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Upload Hormonal Report
              </button>
            </div>

            {/* Category 2: Metabolic & Glycemic Profile */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
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
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>Metabolic & Glycemic</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Fasting Glucose, HbA1c, HDL, Uric Acid
              </p>
              <button
                type="button"
                onClick={() => categoryFileInputRefs.metabolic.current?.click()}
                disabled={isScanningReports}
                className="w-full py-1.5 px-2 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Upload Metabolic Report
              </button>
            </div>

            {/* Category 3: Hematology & Organ Function */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <input
                ref={categoryFileInputRefs.hematology_organ}
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessMultipleFiles(e.target.files, 'hematology_organ');
                  }
                }}
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Drop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>Hematology & Organ</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Hb, Hematocrit, RBC, ALT, AST, Bilirubin, Creatinine, BUN
              </p>
              <button
                type="button"
                onClick={() => categoryFileInputRefs.hematology_organ.current?.click()}
                disabled={isScanningReports}
                className="w-full py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Upload CBC / Organ Report
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
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      : item.status === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <File01 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-medium truncate max-w-[140px]">{item.name}</span>
                  {item.status === 'processing' ? (
                    <Loading01 className="w-3 h-3 animate-spin text-slate-500" />
                  ) : item.status === 'success' ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ {item.count} extracted
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400">⚠ Manual</span>
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
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2 shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <span>Multiple values found for {conflict.label}</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Different uploaded reports contain different results for this biomarker. Please select which value to use:
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {conflict.values.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleResolveConflict(conflict.key, opt.valStr, opt.fileName)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-900 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="text-slate-500 dark:text-slate-400">{opt.fileName}:</span>
                    <strong className="text-slate-900 dark:text-white">
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
          <span>Clinical results saved and reassessment verified!</span>
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
          {hormoneCount === 0 && (
            <div className="text-[11px] text-slate-500 italic pb-1">
              Don&apos;t have a report for this section? Enter values manually below.
            </div>
          )}
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
              sourceProvenance={fieldProvenances[cfg.key]?.source}
              originStatus={fieldProvenances[cfg.key]?.origin}
              accentColor="blue"
              onChange={(val) => handleChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 2: Metabolic & Glycemic Profile */}
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
          {metabolicCount === 0 && (
            <div className="text-[11px] text-slate-500 italic pb-1">
              Don&apos;t have a report for this section? Enter values manually below.
            </div>
          )}
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
              sourceProvenance={fieldProvenances[cfg.key]?.source}
              originStatus={fieldProvenances[cfg.key]?.origin}
              accentColor="blue"
              onChange={(val) => handleChange(cfg.key, val)}
              onClear={() => handleClearField(cfg.key)}
              errorMessage={fieldErrors[cfg.key]}
            />
          ))}
        </ClinicalSection>

        {/* Section 3: Hematology & Organ Function */}
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
          {organCount === 0 && (
            <div className="text-[11px] text-slate-500 italic pb-1">
              Don&apos;t have a report for this section? Enter values manually below.
            </div>
          )}
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
              sourceProvenance={fieldProvenances[cfg.key]?.source}
              originStatus={fieldProvenances[cfg.key]?.origin}
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
