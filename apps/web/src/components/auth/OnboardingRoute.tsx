import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { BioPulseLoadingScreen } from '../brand/BioPulseLoadingScreen';

export const OnboardingRoute: React.FC = () => {
  const { userProfile, isAuthenticated, isOnboarded, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <BioPulseLoadingScreen message="Preparing health setup..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  // If already completed onboarding, redirect to designated pathway dashboard unless explicitly launched to re-onboard
  const isExplicitRelaunch = (location.state as any)?.allowReonboard;
  if (isOnboarded && !isExplicitRelaunch) {
    const targetRoute = getPathwayDashboardRoute(userProfile);
    return <Navigate to={targetRoute} replace />;
  }

  return <Outlet />;
};
