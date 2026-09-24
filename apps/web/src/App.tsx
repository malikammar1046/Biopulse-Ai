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
import { PathwayRouteGuard } from './components/auth/PathwayRouteGuard';
import { useUserHealth } from './context/UserHealthContext';
import { getPathwayDashboardRoute } from './constants/routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Dynamic redirection to user's authorized pathway dashboard
const DashboardRedirect: React.FC = () => {
  const { userProfile } = useUserHealth();
  const destination = getPathwayDashboardRoute(userProfile);
  return <Navigate to={destination} replace />;
};

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
const Conditions = lazy(() =>
  import('./pages/public/Conditions').then((m) => ({ default: m.Conditions }))
);
const Contact = lazy(() =>
  import('./pages/public/Contact').then((m) => ({ default: m.Contact }))
);
const CareProviderPortalPage = lazy(() =>
  import('./pages/public/CareProviderPortalPage').then((m) => ({ default: m.CareProviderPortalPage }))
);
const UnderstandMaleHypogonadism = lazy(() =>
  import('./pages/public/UnderstandMaleHypogonadism').then((m) => ({ default: m.UnderstandMaleHypogonadism }))
);
const TrustAndPrivacy = lazy(() =>
  import('./pages/public/TrustAndPrivacy').then((m) => ({ default: m.TrustAndPrivacy }))
);
const Doctors = lazy(() =>
  import('./pages/public/Doctors').then((m) => ({ default: m.Doctors }))
);

// Auth & Onboarding Pages (Lazy-Loaded)
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.Register })));
const OnboardingDispatcher = lazy(() => import('./pages/onboarding/OnboardingDispatcher').then((m) => ({ default: m.OnboardingDispatcher })));
const FemaleOnboarding = lazy(() => import('./pages/onboarding/FemaleOnboarding').then((m) => ({ default: m.FemaleOnboarding })));
const MaleOnboarding = lazy(() => import('./pages/onboarding/MaleOnboarding').then((m) => ({ default: m.MaleOnboarding })));
const GeneralOnboarding = lazy(() => import('./pages/onboarding/GeneralOnboarding').then((m) => ({ default: m.GeneralOnboarding })));

// Authenticated Health App Pages (Lazy-Loaded)
const Dashboard = lazy(() => import('./pages/app/Dashboard').then((m) => ({ default: m.Dashboard })));
const MasterHealthHub = lazy(() => import('./pages/app/MasterHealthHub').then((m) => ({ default: m.MasterHealthHub })));
const CyclePage = lazy(() => import('./pages/app/CyclePage').then((m) => ({ default: m.CyclePage })));
const SymptomsPage = lazy(() => import('./pages/app/SymptomsPage').then((m) => ({ default: m.SymptomsPage })));
const DietPage = lazy(() => import('./pages/app/DietPage').then((m) => ({ default: m.DietPage })));
const FitnessPage = lazy(() => import('./pages/app/FitnessPage').then((m) => ({ default: m.FitnessPage })));
const ReportsPage = lazy(() => import('./pages/app/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const MedicationsPage = lazy(() => import('./pages/app/MedicationsPage').then((m) => ({ default: m.MedicationsPage })));
const CareCirclePage = lazy(() => import('./pages/app/CareCirclePage').then((m) => ({ default: m.CareCirclePage })));
const AppointmentsPage = lazy(() => import('./pages/app/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })));
const TimelinePage = lazy(() => import('./pages/app/TimelinePage').then((m) => ({ default: m.TimelinePage })));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ChatPage = lazy(() => import('./pages/app/ChatPage').then((m) => ({ default: m.ChatPage })));
const AssessmentPage = lazy(() => import('./pages/app/AssessmentPage').then((m) => ({ default: m.AssessmentPage })));
const ProgressPage = lazy(() => import('./pages/app/ProgressPage').then((m) => ({ default: m.ProgressPage })));

export function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <UserHealthProvider>
          <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public Marketing Website */}
              <Route element={<PublicLayout />}>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.CONDITIONS} element={<Conditions />} />
                <Route path={ROUTES.UNDERSTAND_PCOS} element={<UnderstandPCOS />} />
                <Route path={ROUTES.UNDERSTAND_PCOS_CANONICAL} element={<UnderstandPCOS />} />
                <Route path={ROUTES.UNDERSTAND_MALE_HYPOGONADISM} element={<UnderstandMaleHypogonadism />} />
                <Route path={ROUTES.UNDERSTAND_HYPOGONADISM} element={<UnderstandMaleHypogonadism />} />
                
                {/* Redirect deprecated/duplicate public routes to canonical destinations */}
                <Route path={ROUTES.UNDERSTAND_MALE_FERTILITY} element={<Navigate to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM} replace />} />
                <Route path={ROUTES.WOMENS_HEALTH} element={<Navigate to={ROUTES.UNDERSTAND_PCOS_CANONICAL} replace />} />
                <Route path={ROUTES.MENS_HEALTH} element={<Navigate to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM} replace />} />
                <Route path={ROUTES.CARE_CIRCLE} element={<Navigate to={ROUTES.ABOUT} replace />} />
                <Route path={ROUTES.FOR_DOCTORS} element={<Navigate to={ROUTES.ABOUT} replace />} />
                <Route path="/ai-that-explains" element={<Navigate to={ROUTES.HOW_IT_WORKS} replace />} />
                
                <Route path={ROUTES.TRUST_PRIVACY} element={<TrustAndPrivacy />} />
                <Route path={ROUTES.ABOUT} element={<About />} />
                <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
                <Route path={ROUTES.FEATURES} element={<Features />} />
                <Route path={ROUTES.CONTACT} element={<Contact />} />
                <Route path={ROUTES.DOCTORS} element={<Doctors />} />

                {/* Public Only Auth Pages */}
                <Route element={<PublicOnlyRoute />}>
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.REGISTER} element={<Register />} />
                </Route>
              </Route>

              {/* Protected Care Provider Portal (Token-Authorized) */}
              <Route path={ROUTES.CARE_PROVIDER_PORTAL} element={<CareProviderPortalPage />} />

              {/* Separate Pathway-Specific Onboarding Journeys (Guarded) */}
              <Route element={<OnboardingRoute />}>
                <Route path={ROUTES.ONBOARDING} element={<OnboardingDispatcher />} />
                <Route path={ROUTES.ONBOARDING_FEMALE} element={<FemaleOnboarding />} />
                <Route path={ROUTES.ONBOARDING_MALE} element={<MaleOnboarding />} />
                <Route path={ROUTES.ONBOARDING_GENERAL} element={<GeneralOnboarding />} />
              </Route>

              {/* Authenticated OvaSense Health Application (Protected) */}
              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.APP.ROOT} element={<AppLayout />}>
                  {/* Dynamic Pathway Redirection */}
                  <Route index element={<DashboardRedirect />} />
                  <Route path="dashboard" element={<DashboardRedirect />} />

                  {/* Pathway-Specific Specialized Dashboards */}
                  <Route
                    path="ovasense"
                    element={
                      <PathwayRouteGuard allowedPathway="female">
                        <Dashboard pathway="female" />
                      </PathwayRouteGuard>
                    }
                  />
                  <Route
                    path="androsense"
                    element={
                      <PathwayRouteGuard allowedPathway="male">
                        <Dashboard pathway="male" />
                      </PathwayRouteGuard>
                    }
                  />
                  <Route
                    path="vitasense"
                    element={
                      <PathwayRouteGuard allowedPathway="general">
                        <Dashboard pathway="general" />
                      </PathwayRouteGuard>
                    }
                  />

                  {/* Female-Only Cycle Tracking (Protected from unauthorized direct URLs) */}
                  <Route
                    path="cycle"
                    element={
                      <PathwayRouteGuard allowedPathway="female">
                        <CyclePage />
                      </PathwayRouteGuard>
                    }
                  />

                  {/* Universal Platform Features */}
                  <Route path="hub" element={<MasterHealthHub />} />
                  <Route path="master-hub" element={<MasterHealthHub />} />
                  <Route path="ai-twin" element={<ChatPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="ai" element={<ChatPage />} />
                  <Route path="assistant" element={<ChatPage />} />
                  <Route path="symptoms" element={<SymptomsPage />} />
                  <Route path="diet" element={<DietPage />} />
                  <Route path="diet/week" element={<DietPage />} />
                  <Route path="fitness" element={<FitnessPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="medications" element={<MedicationsPage />} />
                  <Route path="care-circle" element={<CareCirclePage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="assessment" element={<AssessmentPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  {/* Backward compatibility aliases */}
                  <Route path="profile" element={<Navigate to={ROUTES.APP.SETTINGS} replace />} />
                  <Route path="lifestyle" element={<Navigate to={ROUTES.APP.DIET} replace />} />
                </Route>
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </Suspense>
          </BrowserRouter>
        </UserHealthProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
