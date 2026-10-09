import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardErrorStateProps {
  message?: string;
  onRetry?: () => void;
  accentColor?: 'pink' | 'blue' | 'teal';
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  message = "Couldn't load module data.",
  onRetry,
  accentColor = 'pink',
}) => {
  const isFemale = accentColor === 'pink';

  return (
    <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-3 my-auto">
      <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-1">
        <AlertCircle className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-xs">
        <h4 className="text-sm font-semibold text-slate-800">
          Sync issue
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
            isFemale
              ? 'border-[#F43F7D]/30 text-[#E11D48] hover:bg-[#FDE6EF]/40'
              : accentColor === 'teal'
              ? 'border-[#008CA5]/30 text-[#008CA5] hover:bg-[#E0F7FA]/40'
              : 'border-[#0284C7]/30 text-[#0284C7] hover:bg-[#E0F2FE]/40'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
