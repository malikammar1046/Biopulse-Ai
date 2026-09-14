import React from 'react';
import { Lock, Eye, Stethoscope } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ResponsibleAISection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#FAFCFF] text-[#162A45] border-t border-slate-200/80 overflow-hidden select-none">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <span>Ethical Governance</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            Technology can assist.{' '}
            <span className="text-[#0891B2]">
              People still matter.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Our strict principles ensure your health data remains protected, your AI insights stay explainable,
            and your clinical team stays central to your healthcare decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Principle 1: Privacy */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-[#0891B2] flex items-center justify-center shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#162A45]">
              Privacy &amp; Data Sovereignty
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sensitive reproductive health records deserve the highest ethical standard. Zero data monetization,
              zero advertising tracking, and encrypted localized storage.
            </p>
          </div>

          {/* Principle 2: Transparency */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shadow-2xs">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#162A45]">
              Algorithmic Transparency
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Users and healthcare professionals should understand why an AI pattern was flagged. SHAP explainability
              explicitly attributes every contributing biomarker.
            </p>
          </div>

          {/* Principle 3: Human Oversight */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#E11D48] flex items-center justify-center shadow-2xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#162A45]">
              Human Clinical Oversight
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              BioPulse AI is an informative screening and risk-assessment platform, not a doctor replacement. It organizes data to empower
              better, more informed conversations with qualified physicians.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
