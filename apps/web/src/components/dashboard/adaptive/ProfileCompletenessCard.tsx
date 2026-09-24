import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  ArrowRight,
  User01,
  ShieldTick,
  ChevronRight,
} from '@untitledui/icons';
import type { ProfileCompletionResult } from '../../../utils/profileCompletion';
import type { HealthPathway } from '../../../types/onboarding';
import { ROUTES } from '../../../constants/routes';

interface ProfileCompletenessCardProps {
  completion: ProfileCompletionResult;
  pathway: HealthPathway;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  completion,
  pathway,
}) => {
  const { percentage, isComplete, missingFields } = completion;

  // Pathway specific titles
  const pathwayTitles = {
    female: {
      title: 'PCOS Screening Readiness',
      subtitle: 'Complete your health profile to unlock comprehensive hormonal analysis.',
    },
    male: {
      title: 'Hypogonadism Screening Readiness',
      subtitle: 'Complete your health profile for deeper male hypogonadism screening & biomarker assessment.',
    },
    general: {
      title: 'Baseline Wellness Readiness',
      subtitle: 'Complete your health profile to establish your clinical longevity baseline.',
    },
  }[pathway];

  // SVG ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const topMissing = missingFields.slice(0, 2);

  return (
    <div
      className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-6 text-left"
      id="profile-completeness-card"
    >
      {/* Top Title & Pathway Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <User01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-bold block">
              Profile Completeness
            </span>
            <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A]">
              {pathwayTitles.title}
            </h3>
          </div>
        </div>

        {isComplete ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldTick className="w-3 h-3" aria-hidden="true" />
            Verified 100%
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]">
            {percentage}% Ready
          </span>
        )}
      </div>

      {/* Center: Radial Progress Ring + Stats */}
      <div className="flex items-center gap-5 sm:gap-6 bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0]">
        {/* Radial SVG Gauge */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#E0F2FE"
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#29B6F6"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold font-display text-[#0F172A]">
              {percentage}%
            </span>
            <span className="text-[9px] font-mono uppercase text-[#64748B] font-semibold">
              Complete
            </span>
          </div>
        </div>

        {/* Narrative */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-xs text-[#64748B] font-sans leading-relaxed">
            {isComplete
              ? 'Your profile contains all foundational biomarkers for accurate screening.'
              : pathwayTitles.subtitle}
          </p>
          {!isComplete && missingFields.length > 0 && (
            <p className="text-[11px] font-mono text-[#64748B]">
              <span className="font-bold text-[#0F172A]">{missingFields.length}</span> field
              {missingFields.length === 1 ? '' : 's'} remaining to complete.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: Missing Fields or Complete State */}
      {isComplete ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="text-xs font-sans text-emerald-900 font-medium">
              Profile parameters fully configured for high-confidence screening.
            </span>
          </div>
          <Link
            to={ROUTES.APP.PROFILE}
            className="text-[11px] font-bold font-sans text-emerald-700 hover:text-emerald-800 shrink-0 inline-flex items-center gap-1"
          >
            <span>Review</span>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-bold">
            Recommended Next Fields
          </div>

          <div className="space-y-2">
            {topMissing.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#BAE6FD] transition-colors gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#0F172A] font-display block truncate">
                      {field.label}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-sans">
                      Section: {field.section}
                    </span>
                  </div>
                </div>

                <Link
                  to={ROUTES.APP.PROFILE}
                  className="text-xs font-bold font-sans px-3 py-1.5 rounded-lg bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] transition-colors shrink-0 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Add</span>
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <Link
              to={ROUTES.APP.PROFILE}
              className="w-full py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-sm text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Update Health Profile</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
