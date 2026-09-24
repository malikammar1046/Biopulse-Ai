import React, { useState, useMemo } from 'react';
import {
  BarChart01,
  LayersThree01,
  ShieldTick,
  ArrowRight,
  Lock01,
} from '@untitledui/icons';
import type { HealthPathway } from '../../types/onboarding';
import type { ExplainableInsight } from '../../types/researchIntelligence';
import { useUserHealth } from '../../context/UserHealthContext';
import { ResearchIntelligenceService } from '../../services/researchIntelligenceService';
import { ExplainableInsightCard } from './ExplainableInsightCard';
import { InsightExplanationModal } from './InsightExplanationModal';
import { DigitalTwinExplainableDrawer } from './DigitalTwinExplainableDrawer';

interface ResearchIntelligenceSectionProps {
  pathway: HealthPathway;
}

export const ResearchIntelligenceSection: React.FC<ResearchIntelligenceSectionProps> = ({
  pathway,
}) => {
  const {
    userProfile,
    symptomRecords,
    cycleRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    mlAssessment,
    adaptiveProfile,
  } = useUserHealth();

  const [selectedInsight, setSelectedInsight] = useState<ExplainableInsight | null>(null);
  const [isDtDrawerOpen, setIsDtDrawerOpen] = useState(false);

  // Generate live pathway-aware explainable insights
  const insights = useMemo(() => {
    return ResearchIntelligenceService.generateInsights({
      userProfile,
      symptomRecords,
      cycleRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      mlAssessment,
      adaptiveProfile,
      pathway,
    });
  }, [
    userProfile,
    symptomRecords,
    cycleRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    mlAssessment,
    adaptiveProfile,
    pathway,
  ]);

  // Generate explainable Digital Twin dimensions
  const dtDimensions = useMemo(() => {
    return ResearchIntelligenceService.getExplainableDimensions({
      userProfile,
      symptomRecords,
      cycleRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      mlAssessment,
      adaptiveProfile,
      pathway,
    });
  }, [
    userProfile,
    symptomRecords,
    cycleRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    mlAssessment,
    adaptiveProfile,
    pathway,
  ]);

  const pathwayConfig = {
    female: {
      accent: 'text-[#0288D1]',
      border: 'border-[#E2E8F0]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0288D1]',
      domain: 'PCOS Screening Intelligence & XAI',
      subtext:
        'Explainable clinical screening and menstrual pattern intelligence. Grounded in your actual cycle logs, symptom history, and verified laboratory reports.',
    },
    male: {
      accent: 'text-[#0288D1]',
      border: 'border-[#E2E8F0]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0288D1]',
      domain: 'Hypogonadism Screening Intelligence & XAI',
      subtext:
        'Explainable male hypogonadism screening and circadian rhythm tracking. Correlates reported daytime alertness, sleep consistency, and laboratory testosterone assays.',
    },
    general: {
      accent: 'text-[#0288D1]',
      border: 'border-[#E2E8F0]',
      badgeBg: 'bg-[#E0F2FE]',
      badgeText: 'text-[#0288D1]',
      domain: 'BioPulse AI Clinical Intelligence & XAI',
      subtext:
        'Transparent multi-factor baseline synthesis. Connects daily hydration pacing, sleep regularity, and verified medical document records.',
    },
  }[pathway];

  const hasRealShap = insights.some((i) => i.shapAttribution?.isRealShap);

  return (
    <section
      className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm text-left relative overflow-hidden text-[#0F172A]"
      id="research-intelligence-section"
      aria-label="Research Intelligence and Explainable AI"
    >
      <div className="relative z-10 space-y-6">
        {/* ── 1. Header Bar ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
              <BarChart01 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] font-bold">
                  Phase 7 Live
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${pathwayConfig.badgeBg} ${pathwayConfig.badgeText} font-bold border border-[#BAE6FD]`}>
                  {pathway.toUpperCase()} XAI
                </span>
                {hasRealShap ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    TreeSHAP Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                    Deterministic Engine Active
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F172A]">
                {pathwayConfig.domain}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
              <ShieldTick className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Full Data Provenance</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
              <Lock01 className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
              <span>Encrypted & Private</span>
            </div>
          </div>
        </div>

        {/* Informative Subtext */}
        <p className="text-xs sm:text-sm text-[#64748B] font-sans leading-relaxed max-w-3xl">
          {pathwayConfig.subtext}
        </p>

        {/* ── 2. Live Explainable Insight Cards Grid ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {insights.map((insight) => (
            <ExplainableInsightCard
              key={insight.id}
              insight={insight}
              onOpenResearchModal={(ins) => setSelectedInsight(ins)}
            />
          ))}
        </div>

        {/* ── 3. Digital Twin Explainability Teaser Bar ─────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
              <LayersThree01 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#0F172A]">
                  Digital Health Profile (Longitudinal Summary)
                </span>
                <span className="text-[10px] font-mono text-[#0288D1] bg-[#E0F2FE] px-2 py-0.5 rounded-full font-bold border border-[#BAE6FD]">
                  {dtDimensions.length} Dimensions Tracked
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-sans">
                Structured physiological baseline with real record counts and known clinical limitations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDtDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#F0F9FF] text-xs font-sans font-semibold text-[#0288D1] border border-[#BAE6FD] transition-all self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            <span>Explore Longitudinal State</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
          </button>
        </div>

        {/* ── 4. Non-Diagnostic Research Protocol Banner ───────────────────── */}
        <div className="p-3.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-between text-xs text-[#0F172A] font-sans flex-wrap gap-2">
          <span>
            🔬 BioPulse AI Research Standard: Every calculation discloses its real data sources and limitations. No fake AI predictions or unverified assumptions are made.
          </span>
          <span className="font-mono text-[11px] text-emerald-700 font-bold">
            ✓ Non-Prescriptive
          </span>
        </div>
      </div>

      {/* ── Modals & Drawers ──────────────────────────────────────────────── */}
      <InsightExplanationModal
        insight={selectedInsight}
        isOpen={selectedInsight !== null}
        onClose={() => setSelectedInsight(null)}
      />

      <DigitalTwinExplainableDrawer
        isOpen={isDtDrawerOpen}
        onClose={() => setIsDtDrawerOpen(false)}
        dimensions={dtDimensions}
        pathway={pathway}
      />
    </section>
  );
};
