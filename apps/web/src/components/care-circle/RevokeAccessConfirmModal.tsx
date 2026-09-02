import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
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
          className="fixed inset-0 bg-[#10071A]/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#FDA4AF]/40 text-left space-y-6 z-10 select-none overflow-hidden"
        >
          {/* Top Decorative Icon */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-[#F8F5FA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Remove {member.name}?
            </h3>
            <p className="text-xs text-[#584B68] leading-relaxed">
              They will no longer be able to access the health records, cycle rhythms, symptom logs, or reports you shared through OvaSense.
            </p>
          </div>

          {/* Member Card Summary */}
          <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#1C1326] block">{member.name}</span>
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
              className="flex-1 py-3 rounded-2xl font-sans font-bold text-xs text-[#584B68] bg-[#F8F5FA] hover:bg-[#EDE4F7] border border-[#E7DFEF] transition-all cursor-pointer"
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
              className="flex-1 py-3 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:brightness-110 shadow-lg shadow-rose-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
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
