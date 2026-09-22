import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ArrowRight } from '@untitledui/icons';
import type { NutritionReadiness } from '../../types/nutrition';
import { ROUTES } from '../../constants/routes';

interface NutritionReadinessBannerProps {
  readiness: NutritionReadiness | null;
  loading?: boolean;
}

export const NutritionReadinessBanner: React.FC<NutritionReadinessBannerProps> = ({
  readiness,
  loading = false,
}) => {
  const navigate = useNavigate();

  if (loading || !readiness || readiness.ready) {
    return null;
  }

  const missingBiometrics = readiness.required_biometrics?.missing || [];
  const missingSafety = readiness.safety_confirmations?.missing || [];
  const missingPlanning = readiness.planning_inputs?.missing || [];
  const warnings = readiness.warnings || [];

  const hasUnsupportedAllergy = missingSafety.includes(
    'unsupported_allergen_requires_manual_review'
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 shadow-sm space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-amber-100 text-amber-700 mt-0.5 shrink-0">
            {hasUnsupportedAllergy ? (
              <AlertTriangle className="w-5 h-5 text-amber-800" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-800" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-amber-950">
              {hasUnsupportedAllergy
                ? 'Allergy Safety Confirmation Required'
                : 'Complete Your Nutrition Profile to Unlock 7-Day Planning'}
            </h3>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              {hasUnsupportedAllergy
                ? 'Your specified allergy requires manual clinical review because the verified Pakistani catalog cannot guarantee exclusion. Automated planning is temporarily on hold.'
                : 'BioPulse uses strict fail-closed clinical safeguards. We need verified biometrics, dietary preference, and activity level before calculating tailored nutrition.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.APP.SETTINGS)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-900 text-white hover:bg-amber-950 transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <span>Update Settings</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Missing items checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 border-t border-amber-200/60">
        {missingBiometrics.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span className="capitalize">{item.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {missingSafety.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span className="capitalize">{item.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {missingPlanning.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span className="capitalize">{item.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="text-[11px] text-amber-800/90 italic bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/40">
          {warnings.join(' • ')}
        </div>
      )}
    </div>
  );
};
