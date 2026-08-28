import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your name';
    if (!formData.email.trim() || !formData.email.includes('@'))
      newErrors.email = 'Please enter a valid email address';
    if (!formData.subject.trim()) newErrors.subject = 'Please provide a subject';
    if (!formData.message.trim() || formData.message.length < 10)
      newErrors.message = 'Please enter a message of at least 10 characters';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    // Simulate client-side submission
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="space-y-20 sm:space-y-28 pb-24">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center">
        <Container size="lg">
          <Badge variant="primary" showDot size="md" className="mb-4">
            Contact & Academic Inquiries
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C1326] font-display tracking-tight mb-6">
            Get in Touch with the PMOSense Team
          </h1>
          <p className="text-lg sm:text-xl text-[#584B68] max-w-2xl mx-auto leading-relaxed font-sans">
            Have questions about our research methodology, multimodal AI architecture, or academic collaborations?
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
                      Thank you for contacting the PMOSense research team. We will review your inquiry and follow up shortly.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
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
                        placeholder="you@institution.edu"
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
                      placeholder="e.g. Research Collaboration / Technical Inquiry"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      errorText={errors.subject}
                    />

                    <TextArea
                      label="Message"
                      placeholder="Write your questions or feedback regarding the platform..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      maxLength={500}
                      showCharacterCount
                      errorText={errors.message}
                    />

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
                    <p className="text-xs text-[#584B68]">contact@pmosense.edu.pk</p>
                  </div>
                </div>
              </Card>

              <Card variant="subtle" className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1326]">Research Location</h4>
                    <p className="text-xs text-[#584B68]">Department of Computer Science & AI</p>
                  </div>
                </div>
              </Card>

              <Card variant="subtle" className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1326]">Project Status</h4>
                    <p className="text-xs text-[#584B68]">Final Year Project (FYP) Active Development</p>
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
                    The platform is currently in academic development with supervised user evaluation scheduled for later phases.
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#E7DFEF]">
                    <strong className="text-[#1C1326] block mb-1">Does PMOSense issue medical prescriptions?</strong>
                    No. PMOSense is strictly an educational health-information and longitudinal monitoring system.
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
