import React from 'react';
import { CheckCircle2, Heart, Activity, UserCheck, GitFork, ArrowDown } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const StartWithStorySection: React.FC = () => {
  return (
    <section id="journey-start" className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#EDE4F7] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="primary" showDot size="md">
            Phase 01 — Patient-Centric Intake & Routing
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            01 — Start with what you know
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            You don't need to already know what is wrong. Begin with everyday observations—your age, measurements, current symptoms, health history, and lifestyle habits—in a safe, stigma-free environment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative: Accessible Inputs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
              Accessible Information First
            </h3>

            <p className="text-sm sm:text-base text-[#584B68] leading-relaxed font-sans">
              VITASense begins with information that is already available to you. You are never required to obtain expensive, invasive tests before getting meaningful educational feedback.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Everyday Symptoms & Energy Levels', desc: 'Grade vitality, skin shifts, fatigue, or mood variations without clinical jargon.' },
                { title: 'Physical Measurements & Vitals', desc: 'Capture baseline metrics such as age, body composition, sleep hours, and blood pressure.' },
                { title: 'Personal & Family Health History', desc: 'Log previous metabolic or hormonal context to personalize the screening lens.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E7DFEF] shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-[#1C1326]">{item.title}</h4>
                    <p className="text-xs text-[#584B68] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pathway Routing Architecture Visual */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-3">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-[#6E2D8B]" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6E2D8B]">
                    Pathway Routing Architecture
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] font-bold">
                  Shared Core
                </span>
              </div>

              {/* Core Tree Node */}
              <div className="flex flex-col items-center space-y-2">
                <div className="px-5 py-2.5 rounded-2xl bg-[#1C1326] text-white text-xs font-mono font-bold shadow-md">
                  VITASense AI Platform
                </div>
                <ArrowDown className="w-4 h-4 text-[#8D7E9E]" />
              </div>

              {/* Three Branches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Branch 1: Women's Health */}
                <div className="p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#FDA4AF]/40 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#E87084]">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[10px] font-mono font-bold uppercase">Women's</span>
                  </div>
                  <h5 className="text-xs font-bold font-display text-[#1C1326]">PCOS Pathway</h5>
                  <p className="text-[10px] text-[#584B68] leading-tight">
                    Cycle logs, androgen markers & Rotterdam criteria.
                  </p>
                </div>

                {/* Branch 2: Men's Health */}
                <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#38BDF8]/40 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#0284C7]">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold uppercase">Men's</span>
                  </div>
                  <h5 className="text-xs font-bold font-display text-[#1C1326]">Hypogonadism</h5>
                  <p className="text-[10px] text-[#584B68] leading-tight">
                    HPT axis, morning testosterone timing & vitality cues.
                  </p>
                </div>

                {/* Branch 3: Baseline Journey */}
                <div className="p-3.5 rounded-2xl bg-[#F5F3FF] border border-[#C084FC]/40 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#8E3EAF]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold uppercase">Baseline</span>
                  </div>
                  <h5 className="text-xs font-bold font-display text-[#1C1326]">General Tracking</h5>
                  <p className="text-[10px] text-[#584B68] leading-tight">
                    Longitudinal health records without disease assumption.
                  </p>
                </div>
              </div>

              {/* Shared Infrastructure Banner */}
              <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-center text-[11px] text-[#584B68] leading-relaxed">
                The platform shares the same core analytical infrastructure while adapting the screening lens to the health pathway being explored.
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
