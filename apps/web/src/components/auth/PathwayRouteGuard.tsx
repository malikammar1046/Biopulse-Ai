import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPathwayDashboardRoute, getPathwayOnboardingRoute } from '../../constants/routes';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';

interface PathwayRouteGuardProps {
  allowedPathway: HealthPathway;
  children?: React.ReactNode;
}

/**
 * Route Guard that prevents direct URL manipulation between specialized health dashboards.
 * e.g., A male user navigating to /app/ovasense is automatically and safely redirected to /app/androsense.
 */
export const PathwayRouteGuard: React.FC<PathwayRouteGuardProps> = ({ allowedPathway, children }) => {
  const { userProfile, isOnboarded, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#10071A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] flex items-center justify-center shadow-lg shadow-purple-950/40 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-white animate-ping" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#B4A6C7] uppercase">
            Verifying Pathway...
          </span>
        </div>
      </div>
    );
  }

  // If onboarding is incomplete, redirect directly to user's dedicated pathway onboarding
  if (!isOnboarded) {
    const targetOnboarding = getPathwayOnboardingRoute(userProfile);
    return <Navigate to={targetOnboarding} replace />;
  }

  const currentPathway = resolvePathway(userProfile?.gender, userProfile?.pathway);

  if (currentPathway !== allowedPathway) {
    // Safely redirect to user's authorized pathway dashboard
    const targetRoute = getPathwayDashboardRoute(userProfile);
    return <Navigate to={targetRoute} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PathwayRouteGuard;
