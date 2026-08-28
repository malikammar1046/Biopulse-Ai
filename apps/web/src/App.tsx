import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { HowItWorks } from './pages/public/HowItWorks';
import { Features } from './pages/public/Features';
import { Team } from './pages/public/Team';
import { Contact } from './pages/public/Contact';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// App Placeholder Pages
import {
  DashboardPlaceholder,
  ProfilePlaceholder,
  CyclePlaceholder,
  SymptomsPlaceholder,
  ReportsPlaceholder,
  AssessmentPlaceholder,
  LifestylePlaceholder,
  TimelinePlaceholder,
  SettingsPlaceholder,
} from './pages/app/PlaceholderPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing Website */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.ABOUT} element={<About />} />
          <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
          <Route path={ROUTES.FEATURES} element={<Features />} />
          <Route path={ROUTES.TEAM} element={<Team />} />
          <Route path={ROUTES.CONTACT} element={<Contact />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
        </Route>

        {/* Future Authenticated App Shell Placeholders */}
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
    </BrowserRouter>
  );
}

export default App;
