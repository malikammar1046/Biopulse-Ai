import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import type { CycleHistoryItem } from '../../types/cycle';

interface DeleteCycleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: CycleHistoryItem | null;
}

export const DeleteCycleConfirmationModal: React.FC<DeleteCycleConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  item,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete record. Please try again.');
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
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-[28px] bg-white border border-[#BAE6FD] shadow-2xl p-6 sm:p-8 text-left space-y-5 z-10 select-none my-8"
        >
          {/* Top Warning Icon */}
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-[#0F172A]">
              Delete Period Entry?
            </h2>
            <p className="text-xs text-[#475569] leading-relaxed">
              Are you sure you want to permanently remove the period record for{' '}
              <strong className="text-[#0F172A]">{item.startDateFormatted} – {item.endDateFormatted}</strong>?
            </p>
            <p className="text-[11px] text-[#0369A1] bg-[#F0F9FF] p-3 rounded-xl border border-[#BAE6FD]">
              Your cycle metrics, estimated phases, and dashboard statistics will automatically recompute.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-2xl border border-[#E2E8F0] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-2xl font-sans font-semibold text-xs text-white bg-[#DC2626] hover:bg-[#B91C1C] shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Record</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
