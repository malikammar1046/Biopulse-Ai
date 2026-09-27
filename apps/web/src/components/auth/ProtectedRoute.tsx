import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayOnboardingRoute } from '../../constants/routes';

import { BioPulseLoadingScreen } from '../brand/BioPulseLoadingScreen';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isOnboarded, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <BioPulseLoadingScreen message="Verifying Session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (!isOnboarded) {
    const targetOnboarding = getPathwayOnboardingRoute(userProfile);
    return <Navigate to={targetOnboarding} replace />;
  }

  return <Outlet />;
};
