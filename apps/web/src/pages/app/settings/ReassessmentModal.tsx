import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityHeart, XClose, RefreshCw01, CheckCircle } from '@untitledui/icons';
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E0F2FE] text-[#0288D1]">
              <ActivityHeart className="w-6 h-6 text-[#0288D1]" aria-hidden="true" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
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
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
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
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Not Now
                </button>

                <button
                  type="button"
                  onClick={handleUpdateScreening}
                  disabled={isLoading || assessmentLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer bg-[#0288D1] hover:bg-[#0277BD] shadow-[#0288D1]/25 disabled:opacity-50"
                >
                  <RefreshCw01
                    className={`w-3.5 h-3.5 ${isLoading || assessmentLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
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
