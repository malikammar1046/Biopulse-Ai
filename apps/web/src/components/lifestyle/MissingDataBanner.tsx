import React from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MissingDataBannerProps {
  missingData?: string[];
  available?: string[];
}

const FIELD_LABELS: Record<string, string> = {
  age: 'date of birth',
  weight_kg: 'weight',
  height_cm: 'height',
  bmi: 'height & weight',
  activity_information: 'activity level',
  screening_assessment: 'screening assessment',
  shap_factors: 'screening details',
  preferred_cuisines: 'preferred cuisines',
  cooking_time_preference: 'cooking time preference',
  favorite_ingredients: 'favorite foods',
  dietary_pattern: 'dietary preferences',
};

export const MissingDataBanner: React.FC<MissingDataBannerProps> = ({ missingData, available }) => {
  // Filter out non-blocking items from alarming banner
  const actionableMissing = (missingData || []).filter(
    (item) => !['symptom_logs', 'longitudinal_history', 'laboratory_biomarkers', 'shap_factors'].includes(item)
  );

  if (actionableMissing.length === 0) {
    if (available && available.length > 0) {
      return (
        <aside
          aria-label="Personalization status"
          className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 flex items-center gap-3 text-xs sm:text-sm text-slate-700 shadow-xs"
        >
          <Info className="w-4 h-4 text-[#16A34A] shrink-0" />
          <div className="flex-1 min-w-0">
            <strong className="font-semibold text-[#166534] mr-1">
              Your plan is personalized using:
            </strong>
            <span className="text-slate-700">
              {available.join(' • ')}
            </span>
          </div>
        </aside>
      );
    }
    return null;
  }

  // Format field names cleanly
  const formattedItems = actionableMissing.map((item) => FIELD_LABELS[item] || item.replace(/_/g, ' ').toLowerCase());

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
            to make your meal recommendations even more tailored.
          </span>
        </div>
      </div>

      <Link
        to="/app/profile"
        className="shrink-0 text-xs font-semibold text-[#0E9EAA] hover:text-[#073B72] hover:underline"
      >
        Update health profile &rarr;
      </Link>
    </aside>
  );
};
