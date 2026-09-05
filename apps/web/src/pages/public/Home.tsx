import React from 'react';
import {
  HeroSection,
  WhoIsItForSection,
  PathwayArchitectureSection,
  ProblemSection,
  SolutionSection,
  PathwayIntelligenceSection,
  FourTierModelSection,
  InformationPrioritizationSection,
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
      {/* 1. Hero Section: Unified Platform Positioning with Vital Biological Orb */}
      <HeroSection />

      {/* 2. Target Users: One Platform. Different Health Journeys. (Women, Men, Everyone) */}
      <WhoIsItForSection />

      {/* 3. Dual-Pathway Tree Architecture & Shared Platform Infrastructure */}
      <PathwayArchitectureSection />

      {/* 4. The Problem: Fragmented Reproductive & Endocrine Data */}
      <ProblemSection />

      {/* 5. What VITASense AI Does: 6-Step Unified Journey (Understand -> Assess -> Explain -> Gaps -> Prioritize -> Monitor) */}
      <SolutionSection />

      {/* 6. Pathway-Specific Intelligence: Balanced Visualizers (Women's PCOS, Men's HPT Axis, Baseline Profile) */}
      <PathwayIntelligenceSection />

      {/* 7. Progressive Information: Four-Tier Screening Model */}
      <FourTierModelSection />

      {/* 8. Research Differentiator: Information Prioritization (Value of Information vs Estimated Cost) */}
      <InformationPrioritizationSection />

      {/* 9. Platform Capabilities: Eight Core Pillars of VITASense AI */}
      <FeaturesSection />

      {/* 10. Explainable AI: AI That Explains (SHAP Feature Influence Attribution) */}
      <ExplainableAISection />

      {/* 11. Longitudinal Health: Assess -> Understand -> Track -> Reassess Across Journeys */}
      <LongitudinalSection />

      {/* 12. Built For Real People: "You don't need to know what's wrong before you start" */}
      <RealLifeSection />

      {/* 13. Trust & Governance: Privacy, Algorithmic Transparency, Human Clinical Oversight */}
      <ResponsibleAISection />

      {/* 14. Final Platform CTA: "Start With What You Know." */}
      <FinalCTASection />
    </div>
  );
};

export default Home;
