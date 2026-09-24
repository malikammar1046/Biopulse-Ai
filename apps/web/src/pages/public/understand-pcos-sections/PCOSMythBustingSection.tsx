import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle, ChevronDown, HeartHandshake } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface MythFactItem {
  id: string;
  myth: string;
  fact: string;
  explanation: string;
  supportiveNote: string;
}

const MYTH_FACTS: MythFactItem[] = [
  {
    id: 'same-for-everyone',
    myth: 'PMOS looks the same for everyone.',
    fact: 'PMOS can affect people in many different ways.',
    explanation:
      'Some individuals have noticeable skin or hair changes with regular cycles; others experience irregular periods with clear skin. Body types also vary widely—many people with PMOS have lean body types, while others navigate weight changes.',
    supportiveNote:
      'Your personal experience is completely valid, even if your symptoms look different from someone else you know.',
  },
  {
    id: 'irregular-equals-pcos',
    myth: 'Having irregular periods automatically means PMOS.',
    fact: 'Irregular periods have many possible causes and should be evaluated in clinical context.',
    explanation:
      'Cycle variations can be prompted by thyroid shifts, acute emotional stress, extreme physical exertion, significant nutritional changes, or medication side effects. While irregular cycles are a key PMOS signal, a full medical evaluation is needed to understand the true cause.',
    supportiveNote:
      'Tracking your cycle lengths over 3 to 6 months provides excellent objective data to bring to your doctor.',
  },
  {
    id: 'pregnancy-impossible',
    myth: 'PMOS means pregnancy is impossible.',
    fact: 'PMOS can affect ovulation frequency, but it does not mean someone cannot become pregnant.',
    explanation:
      'Because ovulation may happen less frequently or predictably, timing conception naturally can take longer. However, the ovarian reserve in PMOS is typically rich, and many individuals conceive spontaneously or with supportive lifestyle and clinical care.',
    supportiveNote:
      'A PMOS diagnosis is not a declaration of sterility. With proper timing support and healthcare partnerships, family planning goals are very achievable.',
  },
  {
    id: 'caused-by-bad-habits',
    myth: 'PMOS is caused by poor diet or lack of willpower.',
    fact: 'PMOS has deep genetic, epigenetic, and neuroendocrine roots.',
    explanation:
      'Research shows that family history, cellular receptor variations, and prenatal hormonal environments play major roles in developing PMOS. It is not caused by personal failure or lifestyle shortcomings.',
    supportiveNote:
      'Gentle, sustainable lifestyle adjustments help support your well-being, but remember: PMOS is not your fault.',
  },
];

export const PCOSMythBustingSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(MYTH_FACTS[0].id);

  const toggle = (id: string) => {
    setOpenId((curr) => (curr === id ? null : id));
  };

  return (
    <section
      id="pcos-myths"
      className="relative py-20 sm:py-28 bg-[#10071A] text-white overflow-hidden border-t border-white/10"
      aria-labelledby="pcos-myths-title"
    >
      {/* Background Volumetric Glows */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#E87084]/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <HelpCircle className="w-3.5 h-3.5 text-[#FB7185]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                Evidence vs Misconception
              </span>
            </div>

            <h2
              id="pcos-myths-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
            >
              Myth vs.{' '}
              <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
                Fact
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto font-sans leading-relaxed">
              Much of the anxiety surrounding PMOS comes from outdated myths and alarming internet rumors.
              Let’s replace fear with balanced, supportive evidence.
            </p>
          </div>

          {/* Myth vs Fact Accordion Cards */}
          <div className="space-y-4">
            {MYTH_FACTS.map((item) => {
              const isOpen = openId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-gradient-to-b from-[#1C0D2E]/70 to-[#12071F]/80 border border-white/10 hover:border-white/20 transition-colors overflow-hidden shadow-xl"
                >
                  <button
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-label={`Toggle myth: ${item.myth}`}
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:outline-none"
                  >
                    <div className="space-y-2 flex-1">
                      {/* Myth Line */}
                      <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#FB7185]">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span className="uppercase tracking-wider font-mono">Myth:</span>
                        <span className="text-white/80 line-through decoration-[#FB7185]/60 font-sans">
                          "{item.myth}"
                        </span>
                      </div>

                      {/* Fact Headline */}
                      <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-white">
                        <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                        <span className="uppercase tracking-wider font-mono text-xs text-[#34D399]">Fact:</span>
                        <span className="font-display">{item.fact}</span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-6 sm:px-7 pb-6 sm:pb-7 space-y-4 border-t border-white/5 pt-4"
                      >
                        <p className="text-sm text-[#EDE4F7] leading-relaxed font-sans">
                          {item.explanation}
                        </p>

                        <div className="p-4 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 flex items-start gap-3">
                          <HeartHandshake className="w-4 h-4 text-[#E879F9] shrink-0 mt-0.5" />
                          <p className="text-xs text-[#EDE4F7] leading-relaxed font-sans">
                            <strong className="text-white font-semibold block mb-0.5">Supportive Takeaway:</strong>
                            {item.supportiveNote}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};
