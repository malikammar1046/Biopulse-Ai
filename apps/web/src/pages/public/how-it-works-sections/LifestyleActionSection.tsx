import React, { useState } from 'react';
import { Utensils, Footprints, Moon, HeartHandshake, ShieldCheck, CheckCircle2, Share2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const LifestyleActionSection: React.FC = () => {
  const [shareWithPartner, setShareWithPartner] = useState(true);
  const [shareWithDoctor, setShareWithDoctor] = useState(false);

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#FFF0F2] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="accent" showDot size="md">
            Phase 06 — Health Support & Care Circle
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Support your daily habits and care circle
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Screening is only the starting point. BIOPulse AI provides evidence-informed education, nutrition routines, and activity guidance — designed to support healthier daily habits rather than promising medical cures.
          </p>
        </div>

        {/* 3 Supportive Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Nutrition */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Nutritional Foundations
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Evidence-informed macronutrient sequencing, complex carbohydrates, and lean proteins suited to local South Asian diets to help stabilize postprandial energy and glycemic swings.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E7DFEF] text-xs text-[#6E2D8B] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Metabolic support (non-prescriptive)</span>
            </div>
          </div>

          {/* Activity */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
                <Footprints className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Paced Physical Activity
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Low-stress post-meal walking, progressive bodyweight resistance training, and recovery pacing tailored to preserve muscle mass, support testosterone, and modulate insulin sensitivity.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E7DFEF] text-xs text-[#A21CAF] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sustainable movement pacing</span>
            </div>
          </div>

          {/* Wellbeing */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Sleep & Endocrine Rhythm
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Circadian alignment and sleep hygiene guidance to protect REM and deep sleep architecture — the critical window during which overnight LH pulsatility and testosterone production peak.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E7DFEF] text-xs text-[#E87084] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Circadian endocrine protection</span>
            </div>
          </div>
        </div>

        {/* Care Circle Feature Section */}
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-white border border-[#E7DFEF] shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-bold font-mono">
                <Share2 className="w-3.5 h-3.5" />
                <span>Care Circle Sharing</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-[#1C1326]">
                Share selectively with trusted partners and doctors
              </h3>
              <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
                Reproductive health can feel isolating. You can choose to securely share your trends with a trusted partner, family member, or export a consolidated summary for your physician. You retain 100% control over permissions at all times.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#6E2D8B] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>No healthcare provider or contact sees anything without explicit consent</span>
              </div>
            </div>

            {/* Interactive Permission Toggle Card */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8E3EAF] block">
                Sharing Permissions Demo
              </span>

              {/* Partner Toggle */}
              <div className="p-3 rounded-xl bg-white border border-[#E7DFEF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#E87084]" />
                  <span className="text-xs font-bold text-[#1C1326]">Partner / Spouse</span>
                </div>
                <button
                  onClick={() => setShareWithPartner(!shareWithPartner)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    shareWithPartner ? 'bg-[#6E2D8B]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      shareWithPartner ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Doctor Toggle */}
              <div className="p-3 rounded-xl bg-white border border-[#E7DFEF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#6E2D8B]" />
                  <span className="text-xs font-bold text-[#1C1326]">Clinician Summary</span>
                </div>
                <button
                  onClick={() => setShareWithDoctor(!shareWithDoctor)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    shareWithDoctor ? 'bg-[#6E2D8B]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      shareWithDoctor ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <span className="text-[10px] text-[#8D7E9E] block text-center">
                Toggle permissions on or off at any moment in your account settings.
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
