import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useUserHealth } from '../../../context/UserHealthContext';

interface ReassessmentModalProps {
  isOpen: boolean;
  isMale: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const ReassessmentModal: React.FC<ReassessmentModalProps> = ({
  isOpen,
  isMale,
  onClose,
  onCompleted,
}) => {
  const { submitTier1, assessmentLoading } = useUserHealth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateScreening = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await submitTier1();
      if (res) {
        setSuccessMsg(true);
        setTimeout(() => {
          if (onCompleted) onCompleted();
          onClose();
        }, 1200);
      } else {
        setErrorMsg('Failed to update screening result. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error executing reassessment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          {/* Header icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#0E9EAA]/10 text-[#0E9EAA]">
              <Sparkles className="w-6 h-6" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            Your Screening Information Changed
          </h3>

          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            The profile adjustments you just saved include clinical variables utilized by our{' '}
            <strong className="text-slate-800">
              {isMale ? 'Hypogonadism Screening Model' : 'PCOS Screening Pipeline'}
            </strong>
            . Would you like to refresh your screening estimate now?
          </p>

          {successMsg ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm font-medium"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Screening result updated with your latest profile data!</span>
            </motion.div>
          ) : (
            <>
              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading || assessmentLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Not Now
                </button>

              <button
                type="button"
                onClick={handleUpdateScreening}
                disabled={isLoading || assessmentLoading}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer ${
                  isMale
                    ? 'bg-[#0E9EAA] hover:bg-[#0C8B96] shadow-[#0E9EAA]/25'
                    : 'bg-[#0E9EAA] hover:bg-[#0C8B96] shadow-[#0E9EAA]/25'
                } disabled:opacity-50`}
              >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading || assessmentLoading ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isLoading || assessmentLoading ? 'Updating Estimate...' : 'Update Screening Result'}
                  </span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
