import React from 'react';
import { Microscope, BrainCircuit, Sparkles, Database, HeartHandshake } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const ClinicalFoundationSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white border-y border-white/10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md" className="bg-white/10 text-[#FDA4AF] border-white/15">
            Clinical & Technology Foundation
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Engineered with{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              clinical-grade precision.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            OVASense combines validated Rotterdam endocrine consensus criteria, advanced ensemble machine learning architectures,
            SHAP mathematical explainability, and human-centered design for medical-grade transparency.
          </p>
        </div>

        {/* 5 Pillars of Clinical & AI Architecture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              title: 'Clinical Alignment',
              desc: 'Rotterdam consensus diagnostic criteria alignment and multi-marker evaluation.',
              icon: Microscope,
              color: '#6E2D8B',
            },
            {
              title: 'Machine Learning',
              desc: 'Validated ensemble classifiers benchmarked on clinical endocrine datasets.',
              icon: BrainCircuit,
              color: '#8E3EAF',
            },
            {
              title: 'Explainable AI',
              desc: 'SHAP game-theoretic mathematical feature attribution for every metric.',
              icon: Sparkles,
              color: '#A21CAF',
            },
            {
              title: 'Health Informatics',
              desc: 'Structured multimodal schemas with automated unit normalization and OCR.',
              icon: Database,
              color: '#E87084',
            },
            {
              title: 'Empathetic UX',
              desc: 'Human-centered interface engineered to reduce cognitive fatigue and stigma.',
              icon: HeartHandshake,
              color: '#047857',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-xl shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-md border border-white/20"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold font-display text-white">{item.title}</h3>
                  <p className="text-xs text-[#B4A6C7] leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
