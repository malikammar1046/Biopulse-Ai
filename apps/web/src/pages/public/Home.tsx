import React from 'react';
import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  HowItWorksSection,
  FeaturesSection,
  ExplainableAISection,
  LongitudinalSection,
  RealLifeSection,
  ResponsibleAISection,
  FinalCTASection,
} from './home-sections';

export const Home: React.FC = () => {
  return (
    <div className="w-full overflow-hidden bg-[#10071A]">
      {/* 1. Hero Section: Atmospheric Dark with 3D Vital Orb & Editorial Typography */}
      <HeroSection />

      {/* 2. The Problem: Fragmented Health Data */}
      <ProblemSection />

      {/* 3. PMOSense Solution: Connecting The Pieces */}
      <SolutionSection />

      {/* 4. How It Works: Interactive Step-by-Step Workflow & OCR Verification */}
      <HowItWorksSection />

      {/* 5. Core Features: 6 Pillars of PMOSense Ecosystem */}
      <FeaturesSection />

      {/* 6. Explainable AI: SHAP Feature Attribution Transparency */}
      <ExplainableAISection />

      {/* 7. Longitudinal Monitoring: Multi-Month Journey Timeline */}
      <LongitudinalSection />

      {/* 8. Built For Real Life: Localized Context & Everyday Movement */}
      <RealLifeSection />

      {/* 9. Trust & Responsible AI: Privacy, Transparency & Clinical Oversight */}
      <ResponsibleAISection />

      {/* 10. Final CTA: Biological Orb Finale */}
      <FinalCTASection />
    </div>
  );
};

export default Home;
