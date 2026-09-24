import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';

export const PublicOnlyRoute: React.FC = () => {
  const { userProfile, isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#10071A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] flex items-center justify-center shadow-lg shadow-purple-950/40 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-white animate-ping" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#B4A6C7] uppercase">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isOnboarded) {
      const targetRoute = getPathwayDashboardRoute(userProfile);
      return <Navigate to={targetRoute} replace />;
    }
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return <Outlet />;
};
