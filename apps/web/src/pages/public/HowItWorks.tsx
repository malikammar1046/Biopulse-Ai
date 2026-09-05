import React from 'react';
import {
  HowItWorksHeroSection,
  StartWithStorySection,
  StructuredProfileSection,
  UploadReportsSection,
  VerifyControlSection,
  MLAssessmentSection,
  ExplainResultSection,
  InformationGapSection,
  LifestyleActionSection,
  LongitudinalStorySection,
  ReassessmentSection,
  AnatomyReturnSection,
  HowItWorksResponsibleAISection,
  HowItWorksCTASection,
} from './how-it-works-sections';

export const HowItWorks: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. Hero: Unified Reproductive-Health Screening Platform */}
      <HowItWorksHeroSection />

      {/* 2. Step 1 (Start): Start With What You Know & Pathway Routing */}
      <StartWithStorySection />

      {/* 3. Progressive Structure: The 4-Tier Information Model */}
      <StructuredProfileSection />

      {/* 4. Report Ingestion: 5-Step OCR Processing Flow */}
      <UploadReportsSection />

      {/* 5. Human Verification: User-in-the-Loop Control */}
      <VerifyControlSection />

      {/* 6. Step 2 (Assess): Multimodal Risk Assessment (PCOS vs Hypogonadism vs Baseline) */}
      <MLAssessmentSection />

      {/* 7. Step 3 (Explain): Explainable AI & Feature Attribution */}
      <ExplainResultSection />

      {/* 8. Step 4 & 5 (Gaps & Prioritize): Gap Analysis & Cost-Utility Information Prioritization */}
      <InformationGapSection />

      {/* 9. Step 6 (Support): Contextual Health Support & Care Circle */}
      <LifestyleActionSection />

      {/* 10. Step 7 (Monitor): Longitudinal Health Story & Multi-Cohort Milestones */}
      <LongitudinalStorySection />

      {/* 11. Step 8 (Reassess): Progressive Dynamic Reassessment */}
      <ReassessmentSection />

      {/* 12. Synthesis: Biology + Data + Understanding Convergence */}
      <AnatomyReturnSection />

      {/* 13. Governance: Platform-Wide Responsible AI & Safety Disclaimers */}
      <HowItWorksResponsibleAISection />

      {/* 14. Primary CTA: Start Your Assessment */}
      <HowItWorksCTASection />
    </div>
  );
};
