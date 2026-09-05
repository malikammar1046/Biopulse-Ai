import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface FAQItem {
  question: string;
  answer: string;
}

export const ContactFAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

  const faqs: FAQItem[] = [
    {
      question: 'What is VITASense?',
      answer:
        'VITASense is an accessibility-aware reproductive health platform dedicated to Women\'s Health (PCOS pattern screening and cycle tracking) and Men\'s Health (male fertility and sperm health intelligence). It brings together cycle logs, semen analysis parameters, lifestyle metrics, and medical lab report digitization into structured, clinician-friendly summaries.',
    },
    {
      question: 'Is VITASense a medical diagnosis tool?',
      answer:
        'No. VITASense is engineered strictly as an educational health-information and screening support platform. It does not provide medical diagnoses or replace direct consultation with licensed medical doctors. All insights are designed to facilitate structured conversations with your healthcare provider.',
    },
    {
      question: 'Can researchers collaborate with VITASense?',
      answer:
        'Yes. We actively invite academic, biomedical, and clinical researchers to collaborate with us on longitudinal reproductive patterns, semen parameter trajectories, Rotterdam criteria alignment, and explainable AI model validation.',
    },
    {
      question: 'Can I provide product feedback?',
      answer:
        'We strongly encourage feedback from individuals, patient advocates, and clinicians. Your perspective directly influences how we design intuitive, empathetic, and scientifically grounded tools.',
    },
    {
      question: 'How will my information be handled?',
      answer:
        'Privacy and security principles are being incorporated into the platform architecture, with production policies and controls to be finalized as the platform develops. Data security and user control remain central pillars of our architecture.',
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-28 bg-[#10071A] text-white relative overflow-hidden border-t border-white/10">
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#6E2D8B]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="lg">
        {/* Header */}
        <div className="text-center space-y-4 mb-14 sm:mb-18">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#E879F9]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Clear Answers
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] max-w-xl mx-auto font-sans font-normal"
          >
            Everything you need to know about reaching out, our platform principles, and collaboration options.
          </motion.p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-[#180A25] border-[#8E3EAF]/60 shadow-[0_0_30px_rgba(142,62,175,0.2)]'
                    : 'bg-[#180A25]/50 border-white/10 hover:border-white/20 hover:bg-[#180A25]/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold font-display text-white pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white'
                        : 'bg-white/10 text-[#B4A6C7]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 sm:px-8 pb-6 text-sm sm:text-base text-[#B4A6C7] leading-relaxed font-sans border-t border-white/10 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Safety Note */}
        <div className="mt-12 text-center text-xs text-[#8D7E9E] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
          <span>Non-diagnostic health-information architecture aligned with Rotterdam criteria principles.</span>
        </div>
      </Container>
    </section>
  );
};
