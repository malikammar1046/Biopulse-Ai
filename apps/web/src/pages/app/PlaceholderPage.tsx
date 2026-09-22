import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, File01 } from '@untitledui/icons';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface PlaceholderProps {
  title: string;
  subtitle: string;
  moduleName: string;
  expectedCapabilities: string[];
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({
  title,
  subtitle,
  moduleName,
  expectedCapabilities,
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm" showDot>
              Phase 2 Module: {moduleName}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold font-display text-[#0F172A]">{title}</h1>
          <p className="text-sm text-[#475569] mt-1">{subtitle}</p>
        </div>

        <Link to={ROUTES.HOME}>
          <Button variant="outline" size="sm" iconLeft={<ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />}>
            Public Site
          </Button>
        </Link>
      </div>

      <Card variant="standard" className="p-8 space-y-6 border-[#BAE6FD]">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1]">
          <File01 className="w-5 h-5 shrink-0 text-[#0288D1]" aria-hidden="true" />
          <p className="text-xs font-semibold">
            This module is reserved for Phase 2 implementation. The UI architecture, database schemas,
            and API controllers will connect during the authenticated application phase.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase font-bold tracking-wider text-[#0F172A]">
            Planned Capabilities for {moduleName}:
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expectedCapabilities.map((cap, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] text-xs font-medium text-[#0F172A] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export const DashboardPlaceholder = () => (
  <PlaceholderPage
    title="Health Overview & Monitoring Dashboard"
    subtitle="Central hub displaying recent cycle phase, symptom trends, and longitudinal indicators."
    moduleName="Dashboard"
    expectedCapabilities={[
      'Current cycle phase dial & ovulation window',
      'Daily quick-log action card',
      'Latest AI pattern index summary',
      'Recent laboratory test highlights',
    ]}
  />
);

export const ProfilePlaceholder = () => (
  <PlaceholderPage
    title="User Health Profile"
    subtitle="Demographic baseline, medical history, and clinical parameters."
    moduleName="Health Profile"
    expectedCapabilities={[
      'Age, BMI, metabolic baseline configuration',
      'Historical endocrine conditions log',
      'Physician contact & clinical reference units',
    ]}
  />
);

export const CyclePlaceholder = () => (
  <PlaceholderPage
    title="Cycle & Ovulation Tracker"
    subtitle="Menstrual calendar, follicular and luteal phase visualizer."
    moduleName="Cycle Tracking"
    expectedCapabilities={[
      'Interactive monthly period calendar',
      'Cycle variability & regularity statistics',
      'Estimated follicular vs luteal phase days',
    ]}
  />
);

export const SymptomsPlaceholder = () => (
  <PlaceholderPage
    title="Daily Symptom & Wellness Logger"
    subtitle="Multi-symptom logging across acne, hirsutism, sleep, mood, and pelvic comfort."
    moduleName="Symptom Tracking"
    expectedCapabilities={[
      '5-point severity grading sliders',
      'Custom symptom tag additions',
      'Daily notes and lifestyle factor links',
    ]}
  />
);

export const ReportsPlaceholder = () => (
  <PlaceholderPage
    title="Medical Report Reader & Staging"
    subtitle="Document upload repository with Tesseract OCR scanning."
    moduleName="Medical Reports"
    expectedCapabilities={[
      'PDF and image document file uploader',
      'Automated OCR laboratory test extraction',
      'Side-by-side human-in-the-loop verification form',
    ]}
  />
);

export const AssessmentPlaceholder = () => (
  <PlaceholderPage
    title="AI Pattern Assessment & SHAP Transparency"
    subtitle="Multimodal machine learning evaluation with explainable feature attribution."
    moduleName="AI Assessment"
    expectedCapabilities={[
      'Multivariate ensemble model inference',
      'SHAP feature importance bar charts',
      'Positive & negative biomarker impact breakdown',
    ]}
  />
);

export const LifestylePlaceholder = () => (
  <PlaceholderPage
    title="Supportive Lifestyle Guidance"
    subtitle="Evidence-backed nutrition, physical activity, and stress support."
    moduleName="Lifestyle Support"
    expectedCapabilities={[
      'Culturally adapted low-glycemic meal suggestions',
      'Exercise pacing routines for insulin sensitivity',
      'Sleep hygiene and stress reduction modules',
    ]}
  />
);

export const TimelinePlaceholder = () => (
  <PlaceholderPage
    title="Longitudinal Health Timeline & Summaries"
    subtitle="Multi-month trend trajectory graphs and clinician discussion report export."
    moduleName="Health Timeline"
    expectedCapabilities={[
      'Biomarker progression charts across 3, 6, 12 months',
      'Symptom frequency correlation graphs',
      'One-page PDF summary export for doctor appointments',
    ]}
  />
);

export const SettingsPlaceholder = () => (
  <PlaceholderPage
    title="Account & Privacy Settings"
    subtitle="Data privacy preferences, security controls, and export options."
    moduleName="Settings"
    expectedCapabilities={[
      'Encrypted data backup & complete export',
      'Account credentials & security settings',
      'Notification and reminder preferences',
    ]}
  />
);
