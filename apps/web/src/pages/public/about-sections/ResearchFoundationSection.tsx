import React from 'react';
import { Microscope, BrainCircuit, Sparkles, Database, HeartHandshake } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const ResearchFoundationSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-white text-[#1C1326] border-y border-[#E7DFEF]">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Academic Research
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Built as a research project.{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              Designed as a real product.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            PMOSense is developed as a University Final Year Project integrating validated biomedical criteria,
            machine learning benchmarks, explainable AI, and human-centered design.
          </p>
        </div>

        {/* 5 Pillars of Academic Rigor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Clinical Research', desc: 'Rotterdam consensus diagnostic criteria alignment', icon: Microscope, color: '#6E2D8B' },
            { title: 'Machine Learning', desc: 'Ensemble classifiers evaluated on benchmark clinical datasets', icon: BrainCircuit, color: '#8E3EAF' },
            { title: 'Explainable AI', desc: 'SHAP game-theoretic mathematical feature attribution', icon: Sparkles, color: '#A21CAF' },
            { title: 'Health Informatics', desc: 'Structured multimodal data schemas and unit normalization', icon: Database, color: '#E87084' },
            { title: 'Human Design', desc: 'Empathetic UX reducing cognitive fatigue and stigma', icon: HeartHandshake, color: '#047857' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold font-display text-[#1C1326]">{item.title}</h3>
                  <p className="text-xs text-[#584B68] leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
