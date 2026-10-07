import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud01,
  AlertCircle,
  CheckCircle,
  InfoCircle,
  FileCheck02,
  Trash01,
  RefreshCw01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { fetchActiveAssessment } from '../../services/intelligenceService';
import { ClinicalModalLayout } from './ClinicalModalPrimitives';

interface UltrasoundUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type UltrasoundStage =
  | 'idle'
  | 'uploading'
  | 'processing_ultrasound'
  | 'multimodal_reassessment'
  | 'saving_assessment'
  | 'completed'
  | 'verifying_backend';

interface StageMeta {
  key: UltrasoundStage;
  label: string;
  detail: string;
}

const STAGES: StageMeta[] = [
  { key: 'uploading', label: 'Uploading', detail: 'Transmitting ultrasound scan to secure clinical inference pipeline' },
  { key: 'processing_ultrasound', label: 'Processing Ultrasound', detail: 'Detecting polycystic ovarian morphology (PCOM) and follicle distribution' },
  { key: 'multimodal_reassessment', label: 'Multimodal Reassessment', detail: 'Fusing clinical biomarkers and ultrasound evidence via neural ensemble' },
  { key: 'saving_assessment', label: 'Saving Assessment', detail: 'Persisting updated active assessment with full audit provenance' },
  { key: 'completed', label: 'Completed', detail: 'Multimodal screening updated and verified' },
];

export const UltrasoundUploadModal: React.FC<UltrasoundUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeAssessment, submitUltrasound, userProfile, refreshActiveAssessment } = useUserHealth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState<UltrasoundStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isProcessing = stage !== 'idle' && stage !== 'completed';

  // Restore existing ultrasound preview if present in local storage
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccessNotice(null);
    setSelectedFile(null);
    setStage('idle');

    try {
      const assessId = activeAssessment?.id;
      const uid = userProfile?.id || activeAssessment?.patient_id;
      if (assessId && uid) {
        const storedPreview = localStorage.getItem(`biopulse_original_ultrasound_${uid}_${assessId}`);
        if (storedPreview) {
          setPreviewUrl(storedPreview);
        } else {
          setPreviewUrl(null);
        }
      } else {
        setPreviewUrl(null);
      }
    } catch {
      setPreviewUrl(null);
    }
  }, [isOpen, activeAssessment?.id, activeAssessment?.patient_id, userProfile?.id]);

  if (!isOpen) return null;

  const isTier2Active =
    activeAssessment?.assessment_level === 'tier_1_2' ||
    activeAssessment?.assessment_level === 'tier_1_2_3';

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Image file exceeds maximum allowable size of 15MB.');
      return;
    }
    setSelectedFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const resetSelection = () => {
    if (isProcessing) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or upload a pelvic ultrasound image first.');
      return;
    }

    const previousId = activeAssessment?.id || activeAssessment?.assessment_id;
    setError(null);
    setSuccessNotice(null);
    setStage('uploading');

    // Progressive stage transitions for clear patient feedback
    const t1 = setTimeout(() => {
      setStage((prev) => (prev === 'uploading' ? 'processing_ultrasound' : prev));
    }, 2000);

    const t2 = setTimeout(() => {
      setStage((prev) => (prev === 'processing_ultrasound' ? 'multimodal_reassessment' : prev));
    }, 6000);

    const t3 = setTimeout(() => {
      setStage((prev) => (prev === 'multimodal_reassessment' ? 'saving_assessment' : prev));
    }, 12000);

    try {
      const result = await submitUltrasound(selectedFile);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (!result) {
        throw new Error('No assessment response returned by ultrasound pipeline.');
      }

      setStage('completed');

      if (previewUrl) {
        try {
          const assessId = (result as any)?.assessment_id || (result as any)?.id;
          const uid = userProfile?.id || (result as any)?.patient_id;
          if (assessId && uid) {
            localStorage.setItem(`biopulse_original_ultrasound_${uid}_${assessId}`, previewUrl);
          }
        } catch {
          // ignore localStorage error
        }
      }

      if (result.status_code === 'tier_1_3_model_unavailable' || result.assessment_level === 'tier_1_3') {
        setSuccessNotice(
          'Pelvic ultrasound morphology evaluated. To calculate the combined multimodal AI score, please complete your Tier 2 Clinical Laboratory data.'
        );
      } else {
        setSuccessNotice(
          'Pelvic ultrasound analyzed and fused into Complete Tier 1 + Clinical + Ultrasound Assessment!'
        );
      }

      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessNotice(null);
        setStage('idle');
        onClose();
      }, 1600);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      console.warn('Initial ultrasound upload request interrupted, checking server recovery state...', err);

      // Requirement A & C: Do not immediately fail if backend may still be processing
      setStage('verifying_backend');

      let recovered = false;
      // Poll active assessment for up to 30 seconds
      for (let poll = 0; poll < 6; poll++) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        try {
          const active = await fetchActiveAssessment(true, 'female_pcos');
          if (active) {
            const hasNewId = active.id !== previousId && active.assessment_id !== previousId;
            const hasUltrasoundEvidence = Boolean(
              active.pcom_status ||
              active.fusion_details ||
              active.assessment_level === 'tier_1_2_3' ||
              active.assessment_level === 'tier_1_3' ||
              active.evidence_used?.tier_3_ultrasound
            );

            if (hasNewId && hasUltrasoundEvidence) {
              recovered = true;
              await refreshActiveAssessment();
              setStage('completed');
              setSuccessNotice(
                'Assessment successfully verified from server. Pelvic ultrasound evidence has been incorporated into your active screening.'
              );
              if (onSuccess) onSuccess();
              setTimeout(() => {
                setSuccessNotice(null);
                setStage('idle');
                onClose();
              }, 1600);
              break;
            }
          }
        } catch (pollErr) {
          console.warn('Ultrasound recovery poll check notice:', pollErr);
        }
      }

      if (!recovered) {
        setStage('idle');
        setError(
          err?.message ||
            'Ultrasound processing could not be completed within the time limit. Your existing Tier 1 and Tier 2 records remain completely safe and unchanged. Please try again.'
        );
      }
    }
  };

  const getStageIndex = (s: UltrasoundStage): number => {
    switch (s) {
      case 'uploading':
        return 0;
      case 'processing_ultrasound':
        return 1;
      case 'multimodal_reassessment':
        return 2;
      case 'saving_assessment':
      case 'verifying_backend':
        return 3;
      case 'completed':
        return 4;
      default:
        return -1;
    }
  };

  const currentStageIdx = getStageIndex(stage);

  return (
    <ClinicalModalLayout
      isOpen={isOpen}
      onClose={() => {
        if (!isProcessing) onClose();
      }}
      badgeText="Tier 3"
      title="Add Pelvic Ultrasound Data"
      description="Upload your pelvic ultrasound scan for polycystic ovarian morphology (PCOM) and spatial neural analysis."
      accentColor="pink"
      isSubmitting={isProcessing}
      submitButtonText={
        stage === 'verifying_backend'
          ? 'Verifying Server State...'
          : isProcessing
          ? 'Processing Ultrasound...'
          : 'Run Ultrasound Analysis →'
      }
      submitDisabled={!selectedFile || isProcessing}
      onSubmit={handleSubmit}
      footerLeft={
        <div className="flex items-center gap-2">
          {selectedFile ? (
            <span className="text-xs text-pink-700 font-semibold flex items-center gap-1.5">
              <FileCheck02 className="w-3.5 h-3.5 text-pink-600" aria-hidden="true" />
              <span>
                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">No ultrasound image selected yet</span>
          )}
        </div>
      }
    >
      {/* Fusion Status Context */}
      <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
        <InfoCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          {isTier2Active ? (
            <p>
              <strong className="text-slate-900">Multimodal Fusion Ready: </strong>
              Your active Tier 2 Clinical Labs will be combined with this ultrasound scan using our
              calibrated clinical + ultrasound weighted multimodal ensemble.
            </p>
          ) : (
            <p>
              <strong className="text-slate-900">Tier 1 Active: </strong>
              Your ultrasound will be evaluated for ovarian morphology (PCOM). For a combined multimodal AI
              score, add clinical lab results in Tier 2.
            </p>
          )}
          <p className="text-[11px] text-pink-800 font-medium">
            Note: Deep neural vision analysis evaluates high-resolution morphology and may take 30–60 seconds.
          </p>
        </div>
      </div>

      {/* Explicit Processing State Stepper */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-white border border-pink-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw01 className="w-4 h-4 text-pink-600 animate-spin" aria-hidden="true" />
              <span>
                {stage === 'verifying_backend'
                  ? 'Verifying server completion...'
                  : STAGES[Math.max(0, currentStageIdx)]?.label || 'Processing...'}
              </span>
            </span>
            <span className="text-[11px] text-pink-700 font-semibold">
              Step {Math.min(currentStageIdx + 1, 5)} of 5
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {stage === 'verifying_backend'
              ? 'Checking if the backend has finished persisting your assessment. Please do not close this window.'
              : STAGES[Math.max(0, currentStageIdx)]?.detail}
          </p>

          {/* Stepper Dots */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={s.key} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-pink-600 animate-pulse'
                        : 'bg-slate-200'
                    }`}
                  />
                  <div className="text-[9px] text-slate-500 truncate text-center hidden sm:block">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error & Success Messages */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Upload Zone & Preview */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={isProcessing}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
            isDragging
              ? 'border-pink-500 bg-pink-50/40'
              : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
          } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600">
            <UploadCloud01 className="w-7 h-7 text-pink-600" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or drag and drop your ultrasound scan
            </p>
            <p className="text-xs text-slate-500">
              Supported formats: JPEG, PNG, WebP or DICOM export image • Max 15MB
            </p>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            className="mt-1 px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs"
          >
            Choose Image
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Selected Ultrasound Scan Preview
            </span>
            {!isProcessing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-pink-600 hover:text-pink-700 cursor-pointer"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash01 className="w-3 h-3" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-black flex items-center justify-center max-h-72">
            <img
              src={previewUrl}
              alt="Ultrasound Preview"
              className="max-h-72 w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Clinical Guidance on Features Detected */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          What the deep vision model evaluates:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-semibold text-slate-800 mb-0.5">
              Antral Follicle Distribution
            </div>
            <p className="text-[11px] text-slate-500">
              Identifies peripheral &ldquo;string-of-pearls&rdquo; micro-follicular patterns (2–9 mm) across ovarian cross-sections.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-semibold text-slate-800 mb-0.5">
              Ovarian Stroma & Volume
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluates central stromal echogenicity, stromal hypertrophy, and morphological volume indicators.
            </p>
          </div>
        </div>
      </div>
    </ClinicalModalLayout>
  );
};
