import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Microscope,
  Handshake,
  MessageSquareHeart,
  CheckCircle2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Clock,
  MapPin,
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
      title: 'Clinical & Lab Partnerships',
      icon: <Handshake className="w-5 h-5" />,
    },
    {
      num: '04',
      id: 'Feedback',
      title: 'Platform Feedback',
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
      subject: prev.subject ? prev.subject : `${reason} Inquiry - BioPulse AI`,
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
      className="py-20 sm:py-28 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-t border-slate-200"
    >
      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* LEFT COLUMN: Narrative, Topics & Real Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            {/* Header */}
            <div className="space-y-3 text-left">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#0891B2]">
                Direct Communication
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#162A45] tracking-tight font-display">
                Talk to BioPulse AI
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-sans">
                Have a question, clinical research idea, or platform feedback? Choose what you are reaching out about and we will route your message appropriately.
              </p>
            </div>

            {/* Interactive Topics List */}
            <div className="space-y-3">
              {topics.map((t) => {
                const isSelected = formData.reason === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTopicSelect(t.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#0891B2] shadow-md text-[#162A45] ring-2 ring-cyan-100'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[#0891B2]' : 'text-slate-400'}`}>
                        {t.num}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-cyan-50 text-[#0891B2]' : 'bg-slate-100 text-slate-500'}`}>
                        {t.icon}
                      </div>
                      <span className="text-sm font-semibold font-display">
                        {t.title}
                      </span>
                    </div>

                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-[#0891B2]' : 'bg-slate-200'}`} />
                  </button>
                );
              })}
            </div>

            {/* Real Project Details */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs text-slate-600">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Project Contact Channels
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#0891B2]" />
                  <span>General: <strong className="text-slate-800">support@biopulse.ai</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Microscope className="w-4 h-4 text-[#0891B2]" />
                  <span>Research: <strong className="text-slate-800">research@biopulse.ai</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#0891B2]" />
                  <span>Response Time: Typically within 24–48 business hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#0891B2]" />
                  <span>Lahore, Pakistan</span>
                </div>
              </div>
            </div>

            {/* Medical Emergency Disclaimer */}
            <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Medical Emergency Disclaimer
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed font-sans">
                  If you are experiencing a medical emergency, acute pelvic pain, severe shortness of breath, or urgent distress, please immediately contact emergency medical services (1122 in Pakistan) or visit the nearest hospital emergency department. BioPulse AI is a screening decision-support platform and does not provide emergency medical interventions.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Contact Form / Success Container */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-lg">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  /* SUBMISSION SUCCESS STATE */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-10 space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-2xl font-bold text-[#162A45] font-display">
                        Message Received
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-sans">
                        Thank you for reaching out to BioPulse AI. Our team will review your message and reply via email.
                      </p>

                      {referenceId && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono mt-3">
                          <span>Ref: {referenceId}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleReset}
                        className="rounded-full px-6 border-slate-300"
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
                    className="space-y-5 text-left"
                  >
                    {/* Reason Pills Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
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
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                active
                                  ? 'bg-[#0891B2] text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {pill}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full Name & Email Address Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                        >
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${
                            errors.name ? 'border-rose-400' : 'border-slate-300 focus:border-[#0891B2]'
                          }`}
                        />
                        {errors.name && (
                          <p className="text-xs text-rose-600">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                        >
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${
                            errors.email ? 'border-rose-400' : 'border-slate-300 focus:border-[#0891B2]'
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs text-rose-600">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Subject Field */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-subject"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        placeholder="e.g., Clinical research or screening inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${
                          errors.subject ? 'border-rose-400' : 'border-slate-300 focus:border-[#0891B2]'
                        }`}
                      />
                      {errors.subject && (
                        <p className="text-xs text-rose-600">{errors.subject}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        placeholder="Write your message or inquiry here..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none ${
                          errors.message ? 'border-rose-400' : 'border-slate-300 focus:border-[#0891B2]'
                        }`}
                      />
                      {errors.message && (
                        <p className="text-xs text-rose-600">{errors.message}</p>
                      )}
                    </div>

                    {errors.form && (
                      <p className="text-xs text-rose-600 font-medium">{errors.form}</p>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      fullWidth
                      className="bg-[#0891B2] hover:bg-[#0e7490] text-white rounded-xl py-3.5 font-bold text-sm cursor-pointer shadow-md"
                      iconRight={<Send className="w-4 h-4 ml-1" />}
                    >
                      Send Inquiry
                    </Button>

                    <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inquiries are securely handled in adherence to privacy standards</span>
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

export default ContactFormSection;
