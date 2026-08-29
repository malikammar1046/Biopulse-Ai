import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Microscope,
  Handshake,
  MessageSquareHeart,
  CheckCircle2,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { submitContactInquiry } from '../../../services/contactService';

type TopicReason = 'General' | 'Research' | 'Partnership' | 'Feedback';

interface ContactTopic {
  num: string;
  id: TopicReason;
  title: string;
  icon: React.ReactNode;
}

export const ContactFormSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    reason: 'General' as TopicReason,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const topics: ContactTopic[] = [
    {
      num: '01',
      id: 'General',
      title: 'General Inquiry',
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      num: '02',
      id: 'Research',
      title: 'Research & Collaboration',
      icon: <Microscope className="w-5 h-5" />,
    },
    {
      num: '03',
      id: 'Partnership',
      title: 'Partnership',
      icon: <Handshake className="w-5 h-5" />,
    },
    {
      num: '04',
      id: 'Feedback',
      title: 'Product Feedback',
      icon: <MessageSquareHeart className="w-5 h-5" />,
    },
  ];

  const reasonPills: TopicReason[] = ['General', 'Research', 'Partnership', 'Feedback'];

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required.';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required.';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await submitContactInquiry(formData);
      setLoading(false);
      if (res.success) {
        setIsSubmitted(true);
        if (res.referenceId) setReferenceId(res.referenceId);
      }
    } catch {
      setLoading(false);
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    }
  };

  const handleTopicSelect = (reason: TopicReason) => {
    setFormData((prev) => ({
      ...prev,
      reason,
      subject: prev.subject ? prev.subject : `${reason} Inquiry - PMOSense`,
    }));
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setReferenceId(null);
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      reason: 'General',
    });
    setErrors({});
  };

  return (
    <section
      id="contact-form-section"
      className="py-20 sm:py-28 bg-[#10071A] text-white relative overflow-hidden"
    >
      {/* Background Subtle Biological Orbs */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-[#6E2D8B]/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-[#A21CAF]/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* LEFT COLUMN: Narrative & Topics */}
          <div className="lg:col-span-5 space-y-10">
            {/* Header */}
            <div className="space-y-4 text-left">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E879F9]">
                Direct Communication
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
                Talk to PMOSense.
              </h2>
              <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal">
                Have a question, idea, research opportunity, or partnership proposal? Choose what you're reaching out about and we'll route your message appropriately.
              </p>
            </div>

            {/* Interactive Topics List */}
            <div className="space-y-3.5">
              {topics.map((t) => {
                const isSelected = formData.reason === t.id;
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={() => handleTopicSelect(t.id)}
                    whileHover={{ x: 6 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center justify-between p-4.5 rounded-2xl border transition-all duration-300 text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#240F38] to-[#1D0A2E] border-[#8E3EAF] shadow-[0_0_20px_rgba(142,62,175,0.25)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Topic Index Number */}
                      <span
                        className={`text-xs font-mono font-bold tracking-widest ${
                          isSelected ? 'text-[#E879F9]' : 'text-[#8D7E9E] group-hover:text-white'
                        }`}
                      >
                        {t.num}
                      </span>

                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#8E3EAF] to-[#A21CAF] text-white shadow-md'
                            : 'bg-white/10 text-[#B4A6C7] group-hover:text-white group-hover:bg-white/15'
                        }`}
                      >
                        {t.icon}
                      </div>

                      {/* Title */}
                      <span
                        className={`text-sm font-semibold font-display ${
                          isSelected ? 'text-white' : 'text-[#D3C7E3] group-hover:text-white'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>

                    {/* Glowing Orchid Indicator */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#E87084] shadow-[0_0_10px_#E87084] scale-110'
                            : 'bg-white/20 group-hover:bg-white/40'
                        }`}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Subtext & Medical Disclaimer */}
            <div className="pt-6 border-t border-white/10 space-y-3 text-left">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FB7185]" />
                <span>Built with research. Designed for real people.</span>
              </h3>
              <p className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
                PMOSense is being developed as a responsible health-information and monitoring platform. It is not a replacement for professional medical care.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Contact Form / Success Container */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-[#180A25]/75 border border-white/15 p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-purple-950/50">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  /* SUBMISSION SUCCESS STATE */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center py-10 sm:py-14 space-y-6 relative overflow-hidden"
                  >
                    {/* Soft Orchid/Pink Radial Glow */}
                    <div className="absolute inset-0 bg-radial from-[#6E2D8B]/30 via-transparent to-transparent blur-2xl pointer-events-none" />

                    {/* Floating Success Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[
                        { top: '20%', left: '20%', color: 'bg-[#FB7185]' },
                        { top: '30%', right: '25%', color: 'bg-[#C084FC]' },
                        { bottom: '25%', left: '30%', color: 'bg-[#E879F9]' },
                        { bottom: '20%', right: '20%', color: 'bg-[#34D399]' },
                      ].map((p, idx) => (
                        <motion.div
                          key={idx}
                          animate={{ y: [-6, 6, -6], opacity: [0.4, 0.9, 0.4] }}
                          transition={{ duration: 4 + idx, repeat: Infinity, ease: 'easeInOut' }}
                          className={`absolute w-2 h-2 rounded-full ${p.color} shadow-lg`}
                          style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
                        />
                      ))}
                    </div>

                    {/* Animated Checkmark Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                      className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#8E3EAF] via-[#A21CAF] to-[#E87084] p-0.5 mx-auto shadow-[0_0_30px_rgba(232,112,132,0.6)]"
                    >
                      <div className="w-full h-full rounded-full bg-[#180A25] flex items-center justify-center text-[#E87084]">
                        <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                      </div>
                    </motion.div>

                    {/* Success Headlines */}
                    <div className="space-y-2 max-w-md mx-auto relative z-10">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                        Message received.
                      </h3>
                      <p className="text-sm sm:text-base text-[#B4A6C7] leading-relaxed font-sans font-normal">
                        Thank you for reaching out to PMOSense. We'll get back to you as soon as possible.
                      </p>

                      {referenceId && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-[#E879F9] font-mono mt-2">
                          <span>Ref: {referenceId}</span>
                        </div>
                      )}
                    </div>

                    {/* Reset Button */}
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleReset}
                        className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  /* FORM STATE */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 text-left"
                  >
                    {/* Reason Pills Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#B4A6C7]">
                        Reason for contacting us
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {reasonPills.map((pill) => {
                          const active = formData.reason === pill;
                          return (
                            <button
                              key={pill}
                              type="button"
                              onClick={() => setFormData({ ...formData, reason: pill })}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                active
                                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white shadow-md shadow-purple-900/40 border border-white/20'
                                  : 'bg-white/10 text-[#B4A6C7] hover:bg-white/15 hover:text-white border border-white/10'
                              }`}
                            >
                              {pill}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full Name & Email Address Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-bold uppercase tracking-wider text-[#D3C7E3]"
                        >
                          Full Name <span className="text-[#FB7185]">*</span>
                        </label>
                        <div
                          className={`relative rounded-2xl transition-all duration-300 ${
                            focusedField === 'name' ? 'ring-2 ring-[#8E3EAF]/50 shadow-lg shadow-purple-900/30' : ''
                          }`}
                        >
                          <input
                            id="contact-name"
                            type="text"
                            placeholder="Dr. Sarah Jenkins / Jane Doe"
                            value={formData.name}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-4 py-3.5 rounded-2xl bg-white/5 border text-white placeholder-[#7C6C92] text-sm focus:outline-none transition-colors ${
                              errors.name ? 'border-[#FB7185]' : 'border-white/15 focus:border-[#8E3EAF]'
                            }`}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-xs text-[#FB7185] font-medium">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-bold uppercase tracking-wider text-[#D3C7E3]"
                        >
                          Email Address <span className="text-[#FB7185]">*</span>
                        </label>
                        <div
                          className={`relative rounded-2xl transition-all duration-300 ${
                            focusedField === 'email' ? 'ring-2 ring-[#8E3EAF]/50 shadow-lg shadow-purple-900/30' : ''
                          }`}
                        >
                          <input
                            id="contact-email"
                            type="email"
                            placeholder="you@organization.com"
                            value={formData.email}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-4 py-3.5 rounded-2xl bg-white/5 border text-white placeholder-[#7C6C92] text-sm focus:outline-none transition-colors ${
                              errors.email ? 'border-[#FB7185]' : 'border-white/15 focus:border-[#8E3EAF]'
                            }`}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-xs text-[#FB7185] font-medium">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Subject Field */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-subject"
                        className="block text-xs font-bold uppercase tracking-wider text-[#D3C7E3]"
                      >
                        Subject <span className="text-[#FB7185]">*</span>
                      </label>
                      <div
                        className={`relative rounded-2xl transition-all duration-300 ${
                          focusedField === 'subject' ? 'ring-2 ring-[#8E3EAF]/50 shadow-lg shadow-purple-900/30' : ''
                        }`}
                      >
                        <input
                          id="contact-subject"
                          type="text"
                          placeholder="e.g., Clinical Research Partnership Inquiry"
                          value={formData.subject}
                          onFocus={() => setFocusedField('subject')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className={`w-full px-4 py-3.5 rounded-2xl bg-white/5 border text-white placeholder-[#7C6C92] text-sm focus:outline-none transition-colors ${
                            errors.subject ? 'border-[#FB7185]' : 'border-white/15 focus:border-[#8E3EAF]'
                          }`}
                        />
                      </div>
                      {errors.subject && (
                        <p className="text-xs text-[#FB7185] font-medium">{errors.subject}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-bold uppercase tracking-wider text-[#D3C7E3]"
                      >
                        Message <span className="text-[#FB7185]">*</span>
                      </label>
                      <div
                        className={`relative rounded-2xl transition-all duration-300 ${
                          focusedField === 'message' ? 'ring-2 ring-[#8E3EAF]/50 shadow-lg shadow-purple-900/30' : ''
                        }`}
                      >
                        <textarea
                          id="contact-message"
                          rows={5}
                          placeholder="Write your message, research interest, or feedback here..."
                          value={formData.message}
                          onFocus={() => setFocusedField('message')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className={`w-full px-4 py-3.5 rounded-2xl bg-white/5 border text-white placeholder-[#7C6C92] text-sm focus:outline-none transition-colors resize-none ${
                            errors.message ? 'border-[#FB7185]' : 'border-white/15 focus:border-[#8E3EAF]'
                          }`}
                        />
                      </div>
                      {errors.message && (
                        <p className="text-xs text-[#FB7185] font-medium">{errors.message}</p>
                      )}
                    </div>

                    {errors.form && (
                      <p className="text-xs text-[#FB7185] font-medium">{errors.form}</p>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      fullWidth
                      className="bg-gradient-to-r from-[#6E2D8B] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/40 rounded-2xl py-4 font-bold text-base cursor-pointer"
                      iconRight={<Send className="w-5 h-5 ml-1" />}
                    >
                      Send Message →
                    </Button>

                    {/* Security Footer Note */}
                    <p className="text-[11px] text-[#8D7E9E] text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                      <span>Encrypted transmission ready for backend integration</span>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
