export interface TeamMember {
  id: string;
  name: string;
  role: string;
  focus: string;
  initials: string;
  bio: string;
}

export const STUDENT_RESEARCHERS: TeamMember[] = [
  {
    id: 'lead-dev',
    name: 'FYP Project Lead & AI Engineer',
    role: 'Core Architecture & Machine Learning',
    focus: 'Multimodal ML Models, Explainable AI (SHAP), Pipeline Integration',
    initials: 'PL',
    bio: 'Lead engineering for PMOSense machine learning models, OCR document extraction pipeline, and system architecture.',
  },
  {
    id: 'fullstack-dev',
    name: 'Full Stack & Mobile Lead',
    role: 'Frontend & Mobile Engineering',
    focus: 'React Native Design System, Web Architecture, State Flow',
    initials: 'FS',
    bio: 'Oversees the cross-platform responsive web application and React Native mobile client design systems.',
  },
  {
    id: 'data-researcher',
    name: 'Biomedical Informatics Researcher',
    role: 'Clinical Data & Validation Research',
    focus: 'Endocrine Biomarker Schemas, Clinical Data Preprocessing',
    initials: 'BR',
    bio: 'Focuses on dataset curation, Rotterdam criteria alignment, clinical reference intervals, and ethical data handling.',
  },
];

export const PROJECT_SUPERVISORS: TeamMember[] = [
  {
    id: 'faculty-advisor',
    name: 'Faculty Project Supervisor',
    role: 'Academic & Research Supervision',
    focus: 'Academic Research Methodology, AI Ethics, Project Governance',
    initials: 'PS',
    bio: 'Provides academic guidance on research methodology, machine learning validation standards, and project integrity.',
  },
  {
    id: 'co-advisor',
    name: 'Project Co-Advisor / Domain Mentor',
    role: 'Clinical Domain & System Evaluation',
    focus: 'Clinical System Usability, Evaluation Metrics',
    initials: 'CA',
    bio: 'Advises on clinical health information workflow, user safety safeguards, and physician communication summaries.',
  },
];
