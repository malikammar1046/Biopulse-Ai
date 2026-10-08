import React, { useEffect, useState } from 'react';
import { X, History, Calendar, Check } from 'lucide-react';
import type { NutritionPlanSummary } from '../../types/nutrition';
import { nutritionService } from '../../services/nutritionService';

interface PlanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => Promise<void>;
  currentPlanId?: string;
  isMale: boolean;
}

export const PlanHistoryModal: React.FC<PlanHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlanId,
  isMale,
}) => {
  const [plans, setPlans] = useState<NutritionPlanSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await nutritionService.getPlanHistory(15);
      setPlans(history);
    } catch (err) {
      console.error('Failed to load plan history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (planId: string) => {
    setActivatingId(planId);
    try {
      await nutritionService.updatePlanStatus(planId, 'active');
      await onSelectPlan(planId);
      onClose();
    } catch (err) {
      console.error('Failed to activate plan:', err);
    } finally {
      setActivatingId(null);
    }
  };

  if (!isOpen) return null;

  const accentColor = isMale ? 'bg-[#0868B9]' : 'bg-[#0E9EAA]';
  const accentBorder = isMale ? 'border-[#0868B9]' : 'border-[#0E9EAA]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D7EAF2] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D7EAF2] bg-[#F5FBFD]">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl ${accentColor} text-white`}>
              <History className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#073B72]">Plan History</h2>
              <p className="text-xs text-slate-500">View and switch between historical 7-day meal plans</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading plan history...</div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No historical plans found yet. Generating your first plan will save a permanent record here.
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((p) => {
                const isActive = p.is_active || p.id === currentPlanId;
                const formattedDate = new Date(p.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? `${accentBorder} bg-[#F5FBFD] shadow-xs`
                        : 'border-[#D7EAF2] bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#073B72]">
                          7-Day Plan • {formattedDate}
                        </span>
                        {isActive && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isMale ? 'bg-sky-100 text-[#0868B9]' : 'bg-teal-100 text-[#0E9EAA]'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Active Plan</span>
                          </span>
                        )}
                      </div>

                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleActivate(p.id)}
                          disabled={activatingId === p.id}
                          className={`text-xs font-semibold px-3 py-1 rounded-xl text-white ${accentColor} hover:opacity-90 transition-opacity`}
                        >
                          {activatingId === p.id ? 'Activating...' : 'Activate'}
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {p.start_date} → {p.end_date}
                        </span>
                      </span>
                      <span className="capitalize">
                        Pathway: {p.condition_pathway.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#D7EAF2] bg-[#F5FBFD]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
