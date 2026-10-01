import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPathwayDashboardRoute, getPathwayOnboardingRoute } from '../../constants/routes';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import { BioPulseLoadingScreen } from '../brand/BioPulseLoadingScreen';

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
    return <BioPulseLoadingScreen message="Preparing your health experience" fullScreen={true} />;
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
