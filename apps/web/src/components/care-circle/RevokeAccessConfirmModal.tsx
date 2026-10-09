import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XClose, Shield01 } from '@untitledui/icons';
import type { CareCircleMember } from '../../types/careCircle';

interface RevokeAccessConfirmModalProps {
  isOpen: boolean;
  member: CareCircleMember | null;
  onClose: () => void;
  onConfirm: (memberId: string) => Promise<void>;
  loading?: boolean;
}

export const RevokeAccessConfirmModal: React.FC<RevokeAccessConfirmModalProps> = ({
  isOpen,
  member,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen || !member) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#FECACA] text-left space-y-6 z-10 select-none overflow-hidden"
        >
          {/* Top Decorative Icon */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center">
              <Shield01 className="w-6 h-6" aria-hidden="true" />
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-[#0F172A]">
              Remove {member.name}?
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              They will no longer be able to access the health records, biomarker logs, symptom entries, or reports you shared through BIOPulse AI.
            </p>
          </div>

          {/* Member Card Summary */}
          <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FFE4E6] flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#0F172A] block">{member.name}</span>
              <span className="text-[#881337] text-[11px] block">{member.relationship || member.role} • {member.email}</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48]">
              Revoke Access
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-sans font-semibold text-xs text-[#475569] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await onConfirm(member.id);
                onClose();
              }}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-sans font-semibold text-xs text-white bg-[#E11D48] hover:bg-[#BE123C] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Remove Access</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
