import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface FAQItem {
  question: string;
  answer: string;
}

export const ContactFAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What is BioPulse AI?',
      answer:
        'BioPulse AI is an AI-assisted reproductive and endocrine screening platform featuring two dedicated pathways: PCOS screening for women and Male Hypogonadism screening for men. It integrates self-reported symptoms, hormonal blood biomarker inputs, and medical report digitization into explainable, clinician-ready summaries.',
    },
    {
      question: 'Is BioPulse AI a medical diagnostic system or doctor replacement?',
      answer:
        'No. BioPulse AI is strictly an educational screening and clinical decision-support tool. It does not provide formal medical diagnoses, prescribe treatments, or replace direct consultations with physicians. All screening outputs are structured to prepare and empower you for meaningful conversations with your healthcare provider.',
    },
    {
      question: 'Can researchers collaborate with BioPulse AI?',
      answer:
        'Yes. We actively invite academic, clinical, and biomedical researchers to collaborate on endocrine biomarker trajectories, Rotterdam criteria alignment, ADAM questionnaire validation, and explainable AI feature attribution.',
    },
    {
      question: 'Can I provide product feedback or feature suggestions?',
      answer:
        'We strongly encourage feedback from individuals, patient advocates, and clinicians. Your input directly shapes our screening usability, Pakistani nutritional planning accuracy, and explainable health guidance.',
    },
    {
      question: 'How is my health and personal information handled?',
      answer:
        'Data privacy and confidentiality are core foundations of the platform architecture. Your health profiles, symptom records, and uploaded lab values are handled with encrypted transmission and data minimization standards.',
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 sm:py-24 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-t border-slate-200">
      <Container size="lg">
        {/* Header */}
        <div className="text-center space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-[#0891B2]">
            <HelpCircle className="w-3.5 h-3.5 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Clear Answers
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#162A45] tracking-tight font-display">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-slate-600 max-w-xl mx-auto font-sans">
            Key details about reaching out, our clinical screening principles, and research collaboration.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#0891B2]/50 shadow-md ring-1 ring-cyan-100'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-bold font-display text-[#162A45] pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-cyan-50 text-[#0891B2] rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed font-sans border-t border-slate-100 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Safety Note */}
        <div className="mt-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Non-diagnostic health screening decision support aligned with clinical guidelines.</span>
        </div>
      </Container>
    </section>
  );
};

export default ContactFAQSection;
