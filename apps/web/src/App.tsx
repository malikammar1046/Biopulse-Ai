import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';

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

// Auth Pages (Lazy-Loaded)
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.Register })));

// Authenticated App Shell Placeholders (Lazy-Loaded)
const DashboardPlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.DashboardPlaceholder }))
);
const ProfilePlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.ProfilePlaceholder }))
);
const CyclePlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.CyclePlaceholder }))
);
const SymptomsPlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.SymptomsPlaceholder }))
);
const ReportsPlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.ReportsPlaceholder }))
);
const AssessmentPlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.AssessmentPlaceholder }))
);
const LifestylePlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.LifestylePlaceholder }))
);
const TimelinePlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.TimelinePlaceholder }))
);
const SettingsPlaceholder = lazy(() =>
  import('./pages/app/PlaceholderPage').then((m) => ({ default: m.SettingsPlaceholder }))
);

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Public Marketing Website */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.ABOUT} element={<About />} />
            <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
            <Route path={ROUTES.FEATURES} element={<Features />} />
            <Route path={ROUTES.CARE_CIRCLE} element={<CareCircle />} />
            <Route path={ROUTES.CONTACT} element={<Contact />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
          </Route>

          {/* Authenticated App Shell Placeholders */}
          <Route path={ROUTES.APP.ROOT} element={<AppLayout />}>
            <Route index element={<Navigate to={ROUTES.APP.DASHBOARD} replace />} />
            <Route path="dashboard" element={<DashboardPlaceholder />} />
            <Route path="profile" element={<ProfilePlaceholder />} />
            <Route path="cycle" element={<CyclePlaceholder />} />
            <Route path="symptoms" element={<SymptomsPlaceholder />} />
            <Route path="reports" element={<ReportsPlaceholder />} />
            <Route path="assessment" element={<AssessmentPlaceholder />} />
            <Route path="lifestyle" element={<LifestylePlaceholder />} />
            <Route path="timeline" element={<TimelinePlaceholder />} />
            <Route path="settings" element={<SettingsPlaceholder />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
