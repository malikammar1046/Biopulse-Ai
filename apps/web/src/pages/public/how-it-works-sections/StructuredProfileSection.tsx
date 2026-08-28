import { Layers, Calendar, Activity, FileText, HeartPulse } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const StructuredProfileSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#241038] to-[#35144F] text-white overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Layers className="w-3.5 h-3.5" />
            <span>Phase 04 — Data Structuring</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            04 — Turn scattered information into structure
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            Once verified, disparate inputs are harmonized into a standardized multimodal health profile.
            Cycle dates, symptom severities, hormone units, and lifestyle logs are aligned for longitudinal evaluation.
          </p>
        </div>

        {/* Central Converging Core Diagram */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Input 1 */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-2">
              <Calendar className="w-6 h-6 text-[#C084FC] mx-auto" />
              <span className="text-xs font-bold font-display block">Cycle Chronology</span>
              <span className="text-[10px] text-[#B4A6C7]">Phase lengths & intervals</span>
            </div>
            {/* Input 2 */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-2">
              <Activity className="w-6 h-6 text-[#FB7185] mx-auto" />
              <span className="text-xs font-bold font-display block">Symptom Severity</span>
              <span className="text-[10px] text-[#B4A6C7]">Standardized 1–5 gradings</span>
            </div>
            {/* Input 3 */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-2">
              <FileText className="w-6 h-6 text-[#E879F9] mx-auto" />
              <span className="text-xs font-bold font-display block">Verified Lab Panels</span>
              <span className="text-[10px] text-[#B4A6C7]">Normalized hormone units</span>
            </div>
            {/* Input 4 */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-2">
              <HeartPulse className="w-6 h-6 text-[#34D399] mx-auto" />
              <span className="text-xs font-bold font-display block">Lifestyle Context</span>
              <span className="text-[10px] text-[#B4A6C7]">Sleep, activity & diet</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-brand text-center text-white space-y-2 shadow-lg">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#FDA4AF]">
              Unified Health Profile Matrix
            </span>
            <h4 className="text-lg font-bold font-display">Multimodal Feature Representation</h4>
            <p className="text-xs text-[#EDE4F7] max-w-xl mx-auto">
              Prepared for explainable machine learning assessments and long-term longitudinal monitoring.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
