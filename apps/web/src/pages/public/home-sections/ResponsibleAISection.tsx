import React from 'react';
import { Lock, Eye, Stethoscope } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const ResponsibleAISection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-white text-[#1C1326] border-y border-[#E7DFEF]">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Ethical Governance
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Technology can assist.{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              People still matter.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Our strict principles ensure your health data remains protected, your AI insights stay explainable,
            and your clinical team stays central to your healthcare decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Principle 1: Privacy */}
          <div className="p-8 rounded-3xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Privacy & Data Sovereignty
            </h3>
            <p className="text-sm text-[#584B68] leading-relaxed">
              Sensitive reproductive health records deserve the highest ethical standard. Zero data monetization,
              zero advertising tracking, and encrypted localized storage.
            </p>
          </div>

          {/* Principle 2: Transparency */}
          <div className="p-8 rounded-3xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Algorithmic Transparency
            </h3>
            <p className="text-sm text-[#584B68] leading-relaxed">
              Users and healthcare professionals should understand why an AI pattern was flagged. SHAP explainability
              explicitly attributes every contributing biomarker.
            </p>
          </div>

          {/* Principle 3: Human Oversight */}
          <div className="p-8 rounded-3xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Human Clinical Oversight
            </h3>
            <p className="text-sm text-[#584B68] leading-relaxed">
              OVASense is an informative monitoring assistant, not a doctor replacement. It organizes data to empower
              better, more informed conversations with qualified physicians.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
