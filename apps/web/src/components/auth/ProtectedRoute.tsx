import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayOnboardingRoute } from '../../constants/routes';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isOnboarded, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shadow-xs animate-pulse text-[#0288D1]">
            <div className="w-3 h-3 rounded-full bg-[#0288D1] animate-ping" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#64748B] uppercase">
            Verifying Session...
          </span>
        </div>
      </div>
    );
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
