import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash01, XClose, Loading01 } from '@untitledui/icons';
import type { SymptomRecord } from '../../types/symptom';

interface DeleteSymptomConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  symptom: SymptomRecord | null;
}

export const DeleteSymptomConfirmationModal: React.FC<DeleteSymptomConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  symptom,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !symptom) return null;

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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-2xl bg-white border border-[#EAECF0] shadow-xl p-6 text-left space-y-5 z-10 select-none"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[#0F172A]">
              Delete Symptom Entry?
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to remove this <strong className="text-[#0F172A]">{symptom.symptomType}</strong> ({symptom.severity}) entry logged on {symptom.occurredAt}? This action cannot be undone.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAECF0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="h-10 px-4 rounded-xl border border-[#EAECF0] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-10 px-4 rounded-xl font-medium text-xs text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loading01 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash01 className="w-4 h-4" aria-hidden="true" />
                  <span>Delete Entry</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
