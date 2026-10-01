import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPathwayDashboardRoute, getPathwayOnboardingRoute } from '../../constants/routes';
import { BioPulseLoadingScreen } from '../brand/BioPulseLoadingScreen';

export const PublicOnlyRoute: React.FC = () => {
  const { userProfile, isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return <BioPulseLoadingScreen message="Preparing your health experience" fullScreen={true} />;
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
