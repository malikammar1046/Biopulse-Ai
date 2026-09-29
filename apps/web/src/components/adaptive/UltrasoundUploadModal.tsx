import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud01,
  AlertCircle,
  CheckCircle,
  InfoCircle,
  FileCheck02,
  Trash01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { ClinicalModalLayout } from './ClinicalModalPrimitives';

interface UltrasoundUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UltrasoundUploadModal: React.FC<UltrasoundUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeAssessment, submitUltrasound, userProfile } = useUserHealth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Restore existing ultrasound preview if present in local storage
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccessNotice(null);
    setSelectedFile(null);

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

    setLoading(true);
    setError(null);

    try {
      const result = await submitUltrasound(selectedFile);
      if (!result) {
        throw new Error('No assessment response received from server.');
      }
      if (previewUrl) {
        try {
          const assessId = (result as any)?.assessment_id || (result as any)?.id;
          const uid = userProfile?.id || (result as any)?.patient_id;
          if (assessId && uid) {
            localStorage.setItem(`biopulse_original_ultrasound_${uid}_${assessId}`, previewUrl);
          }
        } catch {}
      }
      if (result.status_code === 'tier_1_3_model_unavailable') {
        setSuccessNotice(
          'Ultrasound morphology evaluated. To calculate the combined multimodal AI score, please complete your Tier 2 Clinical Laboratory data.'
        );
      } else {
        setSuccessNotice(
          'Pelvic ultrasound analyzed and fused into Complete Tier 1 + Clinical + Ultrasound Assessment!'
        );
      }

      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Ultrasound upload failed:', err);
      setError(err?.message || 'Failed to analyze ultrasound image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClinicalModalLayout
      isOpen={isOpen}
      onClose={onClose}
      badgeText="Tier 3"
      title="Add Pelvic Ultrasound Data"
      description="Upload your pelvic ultrasound scan for polycystic ovarian morphology (PCOM) and spatial neural analysis."
      accentColor="pink"
      isSubmitting={loading}
      submitButtonText={loading ? 'Analyzing Ultrasound...' : 'Run Ultrasound Analysis →'}
      submitDisabled={!selectedFile}
      onSubmit={handleSubmit}
      footerLeft={
        <div className="flex items-center gap-2">
          {selectedFile ? (
            <span className="text-xs text-pink-700 font-semibold flex items-center gap-1.5">
              <FileCheck02 className="w-3.5 h-3.5 text-pink-600" aria-hidden="true" />
              <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              No ultrasound image selected yet
            </span>
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
              Your active Tier 2 Clinical Labs will be combined with this ultrasound scan using our validated 95% clinical + 5% ultrasound weighted fusion model.
            </p>
          ) : (
            <p>
              <strong className="text-slate-900">Notice: </strong>
              Your ultrasound will be evaluated for ovarian morphology. For combined multimodal AI scoring, clinical lab values are required.
            </p>
          )}
        </div>
      </div>

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
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
            isDragging
              ? 'border-pink-500 bg-pink-50/40'
              : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
          }`}
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
