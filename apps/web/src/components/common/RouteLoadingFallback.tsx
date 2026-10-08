import React from 'react';

interface RouteLoadingFallbackProps {
  message?: string;
}

/**
 * Modern, non-disruptive loading fallback for route-level lazy loading (React Suspense).
 * Eliminates disruptive full-screen and centered white-card takeovers,
 * displaying only an elegant, high-precision top progress bar.
 */
export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div
      role="progressbar"
      aria-label={message}
      className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden pointer-events-none"
    >
      <div className="h-full bg-gradient-to-r from-[#0891B2] via-[#E11D48] to-[#0891B2] animate-pulse w-full shadow-xs shadow-cyan-500/20" />
    </div>
  );
};

export default RouteLoadingFallback;
