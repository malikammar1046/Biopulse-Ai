import React from 'react';
import { Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MissingDataBannerProps {
  missingData?: string[];
  personalizationLevel?: string;
  readiness?: import('../../types/nutrition').NutritionReadiness;
  isMale?: boolean;
  onOpenWizard?: () => void;
}

export const MissingDataBanner: React.FC<MissingDataBannerProps> = ({
  missingData,
  personalizationLevel,
  readiness,
  isMale = false,
  onOpenWizard,
}) => {
  const itemsSource = readiness?.missing_required?.length
    ? readiness.missing_required
    : readiness?.missing_optional?.length
    ? readiness.missing_optional
    : missingData || [];

  const activeLevel = readiness?.personalization_level || personalizationLevel;

  // Filter out internal ML artifacts that users do not directly enter
  const cleanItems = itemsSource.filter(
    (item) => item !== 'shap_factors' && item !== 'longitudinal_history' && item !== 'symptom_logs'
  );

  const hasScreeningMissing = cleanItems.includes('screening_assessment');
  const userFacingFields = cleanItems.filter((item) => item !== 'screening_assessment');

  // If no user-actionable fields are missing
  if (cleanItems.length === 0) {
    if (activeLevel && activeLevel !== 'LEVEL_1_PROFILE') {
      return (
        <aside
          aria-label="Personalization status"
          className="rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] p-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#0E9EAA] shrink-0" />
            <div>
              <strong className="font-semibold text-[#073B72] mr-1">Personalized with high fidelity:</strong>
              <span>Your plan is calibrated using your active health profile and clinical assessment.</span>
            </div>
          </div>
        </aside>
      );
    }
    return null;
  }

  // If only screening assessment is missing
  if (hasScreeningMissing && userFacingFields.length === 0) {
    return (
      <aside
        aria-label="Screening assessment recommendation"
        className="rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-[#16B8C4] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <strong className="font-semibold text-[#073B72] mr-1">
              Elevate your personalization:
            </strong>
            <span>
              Complete screening to make hormonal and metabolic recommendations even more personalized.
            </span>
          </div>
        </div>

        <Link
          to="/app/assessment"
          className="shrink-0 text-xs font-semibold text-[#0E9EAA] hover:text-[#073B72] hover:underline"
        >
          Take screening assessment &rarr;
        </Link>
      </aside>
    );
  }

  // Format field names cleanly
  const formattedItems = userFacingFields.map((item) => {
    switch (item) {
      case 'weight_kg':
        return 'weight';
      case 'height_cm':
        return 'height';
      case 'bmi':
        return 'BMI';
      case 'age':
        return 'date of birth';
      case 'activity_information':
      case 'activity_level':
        return 'activity level';
      case 'preferred_cuisines':
        return 'preferred cuisines';
      case 'cooking_time_preference':
        return 'cooking time';
      default:
        return item.replace(/_/g, ' ').toLowerCase();
    }
  });

  return (
    <aside
      aria-label="Pending health information"
      className="rounded-2xl bg-[#F5FBFD] border border-[#D7EAF2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 shadow-xs"
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <Info className="w-4 h-4 text-[#16B8C4] shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <strong className="font-semibold text-[#073B72] mr-1">
            Improve personalization:
          </strong>
          <span>
            Add your{' '}
            <span className="font-medium text-slate-900">
              {formattedItems.join(', ')}
            </span>{' '}
            to unlock calibrated calorie and macronutrient targets.
          </span>
        </div>
      </div>

      {onOpenWizard && (cleanItems.includes('preferred_cuisines') || cleanItems.includes('cooking_time_preference')) ? (
        <button
          type="button"
          onClick={onOpenWizard}
          className={`shrink-0 text-xs font-semibold hover:underline cursor-pointer ${
            isMale ? 'text-[#0868B9]' : 'text-[#0E9EAA]'
          }`}
        >
          Configure preferences &rarr;
        </button>
      ) : (
        <Link
          to="/app/profile"
          className={`shrink-0 text-xs font-semibold hover:underline ${
            isMale ? 'text-[#0868B9]' : 'text-[#0E9EAA]'
          }`}
        >
          Update health profile &rarr;
        </Link>
      )}
    </aside>
  );
};
