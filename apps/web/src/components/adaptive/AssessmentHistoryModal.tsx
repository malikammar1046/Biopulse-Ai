import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  X,
  Layers,
  CheckCircle2,
  Calendar,
  Clock,
  ImageIcon,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { getRiskPatternDisplay } from '../../services/intelligenceService';

interface AssessmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssessmentHistoryModal: React.FC<AssessmentHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { assessmentHistory } = useUserHealth();

  if (!isOpen) return null;

  const getLevelLabel = (level: string, isMale?: boolean) => {
    if (isMale) {
      switch (level) {
        case 'tier_1_2':
          return 'Tier 1 + Clinical Assessment (Cumulative)';
        case 'tier_1':
        default:
          return 'Tier 1 Screening (Demographics & Biometrics)';
      }
    }
    switch (level) {
      case 'tier_1_2_3':
        return 'Tier 1 + Clinical + Ultrasound (Multimodal)';
      case 'tier_1_2':
        return 'Tier 1 + Clinical (Cumulative)';
      case 'tier_1':
      default:
        return 'Tier 1 (Lifestyle & Biometrics)';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative max-w-3xl w-full my-8 p-6 sm:p-8 rounded-[32px] bg-[#01579B] border border-[#BAE6FD] text-white shadow-2xl space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-mono text-white">
                <History className="w-3.5 h-3.5 text-[#BAE6FD]" />
                <span>Audit Trail & Records</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                Progressive Assessment History
              </h2>
              <p className="text-xs text-sky-100 font-sans">
                Chronological record of your AI risk evaluations and cumulative tier upgrades.
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

          {/* History List */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {assessmentHistory.length === 0 ? (
              <div className="p-8 text-center text-sky-200 space-y-2">
                <History className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">No past assessment records found.</p>
              </div>
            ) : (
              assessmentHistory.map((item, idx) => {
                const isItemMale =
                  item.module === 'male_hypogonadism' ||
                  item.model_name?.toLowerCase().includes('logistic') ||
                  item.model_name?.toLowerCase().includes('male');

                const isActive = item.is_active;
                const pattern = getRiskPatternDisplay(item.risk_category || 'lower');
                const prob = `${item.probability_percent?.toFixed(1) ?? (item.probability * 100).toFixed(1)}%`;
                const dateStr = item.created_at
                  ? new Date(item.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : isItemMale
                  ? 'Assessment date unavailable'
                  : 'Recent';
                const timeStr = item.created_at
                  ? new Date(item.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={item.assessment_id || item.id || idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-white/15 border-white/30 shadow-xs ring-1 ring-white/30'
                        : 'bg-white/5 border-white/15 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full bg-white/15 border border-white/25 text-xs font-mono text-white flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#BAE6FD]" />
                          <span>{getLevelLabel(item.assessment_level, isItemMale)}</span>
                        </span>

                        {isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active Authoritative</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 text-[10px] font-mono">
                            Superseded / Historical
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-sky-200">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {dateStr}
                        </span>
                        {timeStr && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeStr}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="text-[10px] font-mono text-sky-200 uppercase">
                          Probability Score
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold font-mono text-white">{prob}</span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${pattern.badgeClass}`}
                          >
                            {pattern.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-sky-200 uppercase">
                          Model Cutoff
                        </span>
                        <p className="text-sm font-mono text-white">
                          {(item.threshold * 100).toFixed(0)}%
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-sky-200 uppercase">
                          {isItemMale ? 'Clinical Evidence Level' : 'Ultrasound Morphology'}
                        </span>
                        <p className="text-xs font-mono text-white flex items-center gap-1 mt-0.5">
                          {isItemMale ? (
                            item.assessment_level === 'tier_1_2' ? (
                              <>
                                <FlaskConical className="w-3.5 h-3.5 text-[#BAE6FD]" />
                                <span>Tier 1 + Clinical Labs</span>
                              </>
                            ) : (
                              <span className="text-sky-200">Tier 1 Demographics & Biometrics</span>
                            )
                          ) : item.pcom_status ? (
                            <>
                              <ImageIcon className="w-3.5 h-3.5 text-[#BAE6FD]" />
                              <span>{item.pcom_status}</span>
                            </>
                          ) : (
                            <span className="text-sky-200">Not Evaluated</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {item.explanations && item.explanations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="text-[10px] font-mono text-sky-200 uppercase block mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#BAE6FD]" /> Contributing Risk Influences
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.explanations.slice(0, 3).map((exp: any, eIdx: number) => (
                            <span
                              key={eIdx}
                              className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono"
                            >
                              {exp.friendly_name || exp.feature_name || exp.feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-sans text-white transition-colors cursor-pointer"
            >
              Close History
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
