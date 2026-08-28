import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your name.';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Please enter a subject.';
    if (!formData.message.trim()) newErrors.message = 'Please enter a message.';
    else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Simulate async API dispatch
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-24">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center">
        <Container size="lg">
          <Badge variant="primary" showDot size="md" className="mb-4">
            Contact & Enterprise Inquiries
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C1326] font-display tracking-tight mb-6">
            Get in Touch with PMOSense
          </h1>
          <p className="text-lg sm:text-xl text-[#584B68] max-w-2xl mx-auto leading-relaxed font-sans">
            Have questions about our multimodal AI architecture, platform capabilities, or clinical partnerships?
            Reach out through our inquiry form.
          </p>
        </Container>
      </section>

      {/* Main Form & Info Grid */}
      <section>
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Contact Form (Left) */}
            <div className="lg:col-span-7">
              <Card variant="standard" className="p-8 sm:p-10 border-[#E7DFEF]">
                {isSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1C1326] font-display">
                      Message Received
                    </h3>
                    <p className="text-sm text-[#584B68] max-w-md mx-auto leading-relaxed">
                      Thank you for contacting PMOSense. We will review your inquiry and follow up shortly.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="mt-2"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Full Name"
                        placeholder="Dr. / Jane Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        errorText={errors.name}
                      />
                      <Input
                        label="Email Address"
                        placeholder="you@company.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        errorText={errors.email}
                      />
                    </div>

                    <Input
                      label="Subject"
                      placeholder="e.g. Clinical Partnership / Enterprise Inquiry"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      errorText={errors.subject}
                    />

                    <div className="space-y-1.5 text-left">
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-bold uppercase tracking-wider text-[#1C1326]"
                      >
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        required
                        placeholder="Write your questions or feedback regarding the platform..."
                        value={formData.message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-2xl border border-[#E7DFEF] bg-white text-[#1C1326] placeholder-[#8D7E9E] focus:outline-none focus:ring-2 focus:ring-[#6E2D8B]/20 focus:border-[#8E3EAF] text-sm"
                      />
                      {errors.message && (
                        <p className="text-xs text-[#BE123C] font-medium">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      fullWidth
                      iconRight={<Send className="w-4 h-4" />}
                    >
                      Submit Inquiry
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Information Cards (Right) */}
            <div className="lg:col-span-5 space-y-6">
              <Card variant="subtle" className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1326]">Email Contact</h4>
                    <p className="text-xs text-[#584B68]">contact@pmosense.com</p>
                  </div>
                </div>
              </Card>

              <Card variant="subtle" className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1326]">Headquarters & Innovation Hub</h4>
                    <p className="text-xs text-[#584B68]">Health AI & Biomedical Systems</p>
                  </div>
                </div>
              </Card>

              <Card variant="subtle" className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1326]">Platform Status</h4>
                    <p className="text-xs text-[#584B68]">Active Production & Health Intelligence Deployment</p>
                  </div>
                </div>
              </Card>

              {/* FAQ Accordion */}
              <div className="pt-4 border-t border-[#E7DFEF] space-y-3">
                <h4 className="text-sm font-bold text-[#1C1326] font-display flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#6E2D8B]" />
                  <span>Frequently Asked Questions</span>
                </h4>

                <div className="space-y-2 text-xs text-[#584B68]">
                  <div className="p-3.5 rounded-xl bg-white border border-[#E7DFEF]">
                    <strong className="text-[#1C1326] block mb-1">Is PMOSense open for beta testing?</strong>
                    <span>
                      Yes, individuals and healthcare professionals can create accounts to test our cycle,
                      symptom, and medical report digitization capabilities.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E7DFEF]">
                    <strong className="text-[#1C1326] block mb-1">Does PMOSense diagnose medical conditions?</strong>
                    <span>
                      No. PMOSense is an AI-assisted health-information and longitudinal monitoring platform.
                      It is engineered to facilitate structured discussions with licensed medical doctors.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
