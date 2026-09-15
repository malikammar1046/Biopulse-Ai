import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

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
  const { activeAssessment, submitUltrasound } = useUserHealth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTier2Active = activeAssessment?.assessment_level === 'tier_1_2' || activeAssessment?.assessment_level === 'tier_1_2_3';

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a pelvic ultrasound image first.');
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
          localStorage.setItem('biopulse_original_ultrasound_preview', previewUrl);
        } catch {}
      }
      if (result.status_code === 'tier_1_3_model_unavailable') {
        setSuccessNotice(
          'Ultrasound morphology evaluated. To calculate the combined multimodal AI score, please complete your Tier 2 Clinical Laboratory data.'
        );
      } else {
        setSuccessNotice('Pelvic ultrasound analyzed and fused into Complete Tier 1 + Clinical + Ultrasound Assessment!');
      }

      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Ultrasound upload failed:', err);
      setError(err?.message || 'Failed to analyze ultrasound image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative max-w-xl w-full my-8 p-6 sm:p-8 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white shadow-2xl space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-mono text-white">
                <ImageIcon className="w-3.5 h-3.5 text-[#BAE6FD]" />
                <span>Tier 3 Imaging Analysis</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Upload Pelvic Ultrasound
              </h2>
              <p className="text-xs text-sky-100 font-sans">
                Deep neural network evaluation for polycystic ovarian morphology (PCOM) and spatial feature localization.
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

          {/* Fusion Status Context */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3 text-xs text-sky-100">
            <Info className="w-4 h-4 text-[#BAE6FD] shrink-0 mt-0.5" />
            <div className="space-y-1">
              {isTier2Active ? (
                <p>
                  <strong>Multimodal Fusion Ready:</strong> Your active Tier 2 Clinical Labs will be combined with this ultrasound image using our validated 95% clinical + 5% ultrasound weighted fusion algorithm.
                </p>
              ) : (
                <p>
                  <strong>Notice:</strong> Your ultrasound will be evaluated for ovarian morphology. For combined multimodal AI scoring, clinical lab values are required.
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Upload Zone */}
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-white/30 hover:border-white rounded-3xl bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold font-sans text-white">
                    Click to browse or drag and drop image
                  </p>
                  <p className="text-xs text-sky-200">
                    Supported formats: DICOM export, JPEG, PNG (Max 15MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-white/20 overflow-hidden bg-black/40">
                <img
                  src={previewUrl}
                  alt="Ultrasound Preview"
                  className="w-full h-56 object-contain bg-black/60"
                />
                <button
                  type="button"
                  onClick={resetSelection}
                  className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-black/70 hover:bg-black text-xs font-sans text-white border border-white/20 cursor-pointer"
                >
                  Change Image
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/15">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-sans text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="px-6 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white text-xs font-bold font-sans transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Morphology & Grad-CAM...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Run Ultrasound Neural Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
