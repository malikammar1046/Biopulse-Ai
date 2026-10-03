import React from 'react';
import { BioPulseHeartEmblem } from '../brand/Logo';

interface RouteLoadingFallbackProps {
  message?: string;
}

/**
 * Modern, non-intrusive loading fallback for route-level lazy loading (React Suspense).
 * Replaces disruptive full-screen takeovers with a sleek top progress bar and a calm, centered pulse.
 */
export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div
      role="progressbar"
      aria-label={message}
      className="w-full min-h-[50vh] flex flex-col items-center justify-center relative p-6 text-center select-none"
    >
      {/* Sleek Top Loading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-slate-100 pointer-events-none">
        <div className="h-full bg-gradient-to-r from-[#0891B2] via-[#F43F7D] to-[#0891B2] animate-pulse w-full" />
      </div>

      {/* Calm Center Pulse Indicator */}
      <div className="flex flex-col items-center gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
          <BioPulseHeartEmblem size={38} />
        </div>
        <span className="text-xs font-medium text-slate-500 font-sans tracking-tight">
          {message}
        </span>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
