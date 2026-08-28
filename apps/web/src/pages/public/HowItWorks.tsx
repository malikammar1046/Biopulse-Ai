import React from 'react';
import {
  HowItWorksHeroSection,
  StartWithStorySection,
  UploadReportsSection,
  VerifyControlSection,
  StructuredProfileSection,
  MLAssessmentSection,
  ExplainResultSection,
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
      {/* 1. Hero: Central 3D Reproductive System + Proper Anatomical Labels */}
      <HowItWorksHeroSection />

      {/* 2. Phase 01: Start With Your Health Story */}
      <StartWithStorySection />

      {/* 3. Phase 02: Bring Your Medical Reports With You (OCR Scanning) */}
      <UploadReportsSection />

      {/* 4. Phase 03: You Stay In Control (Interactive OCR Verification) */}
      <VerifyControlSection />

      {/* 5. Phase 04: Turn Scattered Information Into Structure */}
      <StructuredProfileSection />

      {/* 6. Phase 05: Analyze The Pattern (Research ML Assessment) */}
      <MLAssessmentSection />

      {/* 7. Phase 06: Don't Just Show A Result. Explain It. (SHAP Attribution) */}
      <ExplainResultSection />

      {/* 8. Phase 07: Understand What You Can Do Next (Localized Lifestyle) */}
      <LifestyleActionSection />

      {/* 9. Phase 08: Your Health Story Changes Over Time (Longitudinal Timeline) */}
      <LongitudinalStorySection />

      {/* 10. Phase 09: New Information Changes The Picture (Reassessment) */}
      <ReassessmentSection />

      {/* 11. Final Anatomy Return: Biology + Data + Understanding */}
      <AnatomyReturnSection />

      {/* 12. Responsible AI & Non-Diagnostic Clinical Positioning */}
      <HowItWorksResponsibleAISection />

      {/* 13. Final CTA & Registration Gateway */}
      <HowItWorksCTASection />
    </div>
  );
};
