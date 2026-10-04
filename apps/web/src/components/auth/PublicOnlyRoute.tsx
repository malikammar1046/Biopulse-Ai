import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPathwayDashboardRoute, getPathwayOnboardingRoute } from '../../constants/routes';
import { RouteLoadingFallback } from '../common/RouteLoadingFallback';

export const PublicOnlyRoute: React.FC = () => {
  const { userProfile, isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return <RouteLoadingFallback message="Verifying session..." />;
  }

  if (isAuthenticated) {
    if (isOnboarded) {
      const targetRoute = getPathwayDashboardRoute(userProfile);
      return <Navigate to={targetRoute} replace />;
    }
    const targetOnboarding = getPathwayOnboardingRoute(userProfile);
    return <Navigate to={targetOnboarding} replace />;
  }

  return <Outlet />;
};
