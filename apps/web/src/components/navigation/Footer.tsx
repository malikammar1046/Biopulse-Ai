import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Heart } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Container } from '../ui/Container';
import { Logo } from '../brand/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1C1326] text-white pt-16 pb-12 border-t border-[#2E2445]">
      <Container size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={ROUTES.HOME} className="flex items-center">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-[#B4A6C7] max-w-sm leading-relaxed font-sans">
              OVASense Ai Health Monitor is an AI-assisted health-information and longitudinal monitoring platform dedicated
              to PCOS and ovarian health. Integrating multimodal data, explainable AI, and clinician-ready summaries.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#E87084]">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Advanced Health AI & Clinical Intelligence</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#F6F2FA]">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-[#B4A6C7]">
              <li>
                <Link to={ROUTES.HOME} className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to={ROUTES.UNDERSTAND_PCOS} className="hover:text-white transition-colors">
                  Understand PCOS
                </Link>
              </li>
              <li>
                <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to={ROUTES.FEATURES} className="hover:text-white transition-colors">
                  Key Features
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CARE_CIRCLE} className="hover:text-white transition-colors">
                  Care Circle
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUT} className="hover:text-white transition-colors">
                  About OVASense
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#F6F2FA]">
              Support & Access
            </h4>
            <ul className="space-y-2 text-sm text-[#B4A6C7]">
              <li>
                <Link to={ROUTES.CONTACT} className="hover:text-white transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to={ROUTES.LOGIN} className="hover:text-white transition-colors">
                  App Portal
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#F6F2FA]">
              Trust & Ethics
            </h4>
            <ul className="space-y-2 text-sm text-[#B4A6C7]">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Data Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Responsible AI Standards
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Security Architecture
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-[#FB7185] shrink-0 mt-0.5" />
          <div className="text-xs text-[#B4A6C7] leading-relaxed">
            <strong className="text-white block mb-0.5">Clinical & Regulatory Notice:</strong>
            OVASense is strictly an educational health-information and longitudinal monitoring platform.
            It is <strong>NOT</strong> a diagnostic tool and does <strong>NOT</strong> provide medical diagnosis,
            clinical treatment prescriptions, or direct doctor replacements. Always consult qualified healthcare
            professionals for formal medical advice.
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7E6F94]">
          <p>© {new Date().getFullYear()} OVASense. Academic FYP Project. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
