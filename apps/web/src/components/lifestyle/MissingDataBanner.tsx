import React from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MissingDataBannerProps {
  missingData: string[];
}

export const MissingDataBanner: React.FC<MissingDataBannerProps> = ({ missingData }) => {
  if (!missingData || missingData.length === 0) {
    return null;
  }

  // Format field names cleanly
  const formattedItems = missingData.map((item) =>
    item.replace(/_/g, ' ').toLowerCase()
  );

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

      <Link
        to="/app/profile"
        className="shrink-0 text-xs font-semibold text-[#0E9EAA] hover:text-[#073B72] hover:underline"
      >
        Update health profile &rarr;
      </Link>
    </aside>
  );
};
