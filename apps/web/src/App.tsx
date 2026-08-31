import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { UserHealthProvider } from './context/UserHealthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingRoute } from './components/auth/OnboardingRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';

// Lightweight Page Loading Skeleton / Fallback
const PageLoadingFallback: React.FC = () => (
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

// Route-Level Lazy Loading (Code Splitting)
const Home = lazy(() => import('./pages/public/Home').then((m) => ({ default: m.Home })));
const About = lazy(() => import('./pages/public/About').then((m) => ({ default: m.About })));
const UnderstandPCOS = lazy(() =>
  import('./pages/public/UnderstandPCOS').then((m) => ({ default: m.UnderstandPCOS }))
);
const HowItWorks = lazy(() =>
  import('./pages/public/HowItWorks').then((m) => ({ default: m.HowItWorks }))
);
const Features = lazy(() =>
  import('./pages/public/Features').then((m) => ({ default: m.Features }))
);
const CareCircle = lazy(() =>
  import('./pages/public/CareCircle').then((m) => ({ default: m.CareCircle }))
);
const Contact = lazy(() =>
  import('./pages/public/Contact').then((m) => ({ default: m.Contact }))
);
const CareProviderPortalPage = lazy(() =>
  import('./pages/public/CareProviderPortalPage').then((m) => ({ default: m.CareProviderPortalPage }))
);

// Auth & Onboarding Pages (Lazy-Loaded)
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.Register })));
const OnboardingFlow = lazy(() => import('./pages/onboarding/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow })));

// Authenticated Health App Pages (Lazy-Loaded)
const Dashboard = lazy(() => import('./pages/app/Dashboard').then((m) => ({ default: m.Dashboard })));
const CyclePage = lazy(() => import('./pages/app/CyclePage').then((m) => ({ default: m.CyclePage })));
const SymptomsPage = lazy(() => import('./pages/app/SymptomsPage').then((m) => ({ default: m.SymptomsPage })));
const DietPage = lazy(() => import('./pages/app/DietPage').then((m) => ({ default: m.DietPage })));
const FitnessPage = lazy(() => import('./pages/app/FitnessPage').then((m) => ({ default: m.FitnessPage })));
const ReportsPage = lazy(() => import('./pages/app/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const MedicationsPage = lazy(() => import('./pages/app/MedicationsPage').then((m) => ({ default: m.MedicationsPage })));
const CareCirclePage = lazy(() => import('./pages/app/CareCirclePage').then((m) => ({ default: m.CareCirclePage })));
const AppointmentsPage = lazy(() => import('./pages/app/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })));

export function App() {
  return (
    <AuthProvider>
      <UserHealthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public Marketing Website */}
              <Route element={<PublicLayout />}>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.UNDERSTAND_PCOS} element={<UnderstandPCOS />} />
                <Route path={ROUTES.ABOUT} element={<About />} />
                <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
                <Route path={ROUTES.FEATURES} element={<Features />} />
                <Route path={ROUTES.CARE_CIRCLE} element={<CareCircle />} />
                <Route path={ROUTES.CONTACT} element={<Contact />} />

                {/* Public Only Auth Pages */}
                <Route element={<PublicOnlyRoute />}>
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.REGISTER} element={<Register />} />
                </Route>
              </Route>

              {/* Protected Care Provider Portal (Token-Authorized) */}
              <Route path={ROUTES.CARE_PROVIDER_PORTAL} element={<CareProviderPortalPage />} />

              {/* 7-Step Onboarding Flow (Guarded) */}
              <Route element={<OnboardingRoute />}>
                <Route path={ROUTES.ONBOARDING} element={<OnboardingFlow />} />
              </Route>

              {/* Authenticated OvaSense Health Application (Protected) */}
              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.APP.ROOT} element={<AppLayout />}>
                  <Route index element={<Navigate to={ROUTES.APP.DASHBOARD} replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="cycle" element={<CyclePage />} />
                  <Route path="symptoms" element={<SymptomsPage />} />
                  <Route path="diet" element={<DietPage />} />
                  <Route path="diet/week" element={<DietPage />} />
                  <Route path="fitness" element={<FitnessPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="medications" element={<MedicationsPage />} />
                  <Route path="care-circle" element={<CareCirclePage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  {/* Backward compatibility aliases */}
                  <Route path="profile" element={<Navigate to={ROUTES.APP.SETTINGS} replace />} />
                  <Route path="lifestyle" element={<Navigate to={ROUTES.APP.DIET} replace />} />
                  <Route path="assessment" element={<Navigate to={ROUTES.APP.DASHBOARD} replace />} />
                  <Route path="timeline" element={<Navigate to={ROUTES.APP.CYCLE} replace />} />
                </Route>
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UserHealthProvider>
    </AuthProvider>
  );
}

export default App;

