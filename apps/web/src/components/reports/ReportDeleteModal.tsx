import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { MedicalReport } from '../../types/report';

interface ReportDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  report: MedicalReport | null;
}

export const ReportDeleteModal: React.FC<ReportDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  report,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !report) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-[32px] bg-white border border-[#BAE6FD] shadow-2xl p-6 text-left space-y-5 z-10 select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center border border-[#FDA4AF]/60">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold font-display text-[#0F172A]">
              Delete Medical Report?
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#0F172A]">{report.title}</strong> ({report.reportDate}) and all its extracted numbers? This action cannot be undone.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-2xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#E11D48] hover:bg-[#BE123C] shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Report</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
