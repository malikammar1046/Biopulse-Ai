import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { ProfileCompleteness } from './settingsTypes';

interface CompletenessCardProps {
  completeness: ProfileCompleteness;
  isMale: boolean;
}

export const CompletenessCard: React.FC<CompletenessCardProps> = ({
  completeness,
  isMale,
}) => {
  const { percentage, basicComplete, specificComplete, symptomsComplete, lifestyleComplete, missingRequired } =
    completeness;

  const items = [
    {
      label: 'Basic Demographics',
      complete: basicComplete,
      required: true,
      desc: 'Name, DOB, Height, Weight',
    },
    {
      label: isMale ? 'Male Hormonal Health' : 'Cycle & Reproductive',
      complete: specificComplete,
      required: true,
      desc: isMale ? 'Energy, Libido, Sleep, Waist' : 'Cycle Regularity & Symptoms',
    },
    {
      label: 'Clinical Baseline',
      complete: symptomsComplete,
      required: false,
      desc: 'Blood type, Conditions, Allergies',
    },
    {
      label: 'Lifestyle & Diet',
      complete: lifestyleComplete,
      required: false,
      desc: 'Exercise & Dietary preference',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Screening Profile Completeness
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#0E9EAA]/10 text-[#0E9EAA]">
              {percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {missingRequired.length > 0 ? (
              <span className="text-amber-600 font-medium">
                Missing required: {missingRequired.slice(0, 3).join(', ')}
                {missingRequired.length > 3 ? '...' : ''}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">
                All critical screening baseline data provided
              </span>
            )}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-48">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0E9EAA] h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        {items.map((it, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-xl flex items-center gap-2 border text-xs transition-colors ${
              it.complete
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : it.required
                ? 'bg-amber-50/40 border-amber-200 text-amber-900'
                : 'bg-slate-50/70 border-slate-200 text-slate-600'
            }`}
          >
            {it.complete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : it.required ? (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{it.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
