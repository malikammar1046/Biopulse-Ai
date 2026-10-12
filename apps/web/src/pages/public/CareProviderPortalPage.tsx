import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileText,
  Sparkles,
  MessageSquare,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Pill,
  Clock,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { careCircleService } from '../../services/careCircleService';
import type { CareProviderViewData } from '../../types/careCircle';
import { WeeklyTimelineView } from '../../components/care-circle/WeeklyTimelineView';
import { Logo } from '../../components/brand/Logo';
import { BioPulseLoadingScreen } from '../../components/brand/BioPulseLoadingScreen';
import { LanguageSwitcher } from '../../components/i18n/LanguageSwitcher';

export const CareProviderPortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation('careCircle');
  const isRtl = i18n.language === 'ur';

  const [data, setData] = useState<CareProviderViewData | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    async function loadProviderData() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const viewData = await careCircleService.fetchCareProviderData(token);
        if (viewData && viewData.isValid && viewData.member) {
          setData(viewData);
        } else {
          const info = await careCircleService.getCareInvitationInfo(token);
          if (info && info.isValid) {
            setInviteInfo(info);
          }
          setData(viewData);
        }
      } catch (err) {
        console.warn('Error loading provider portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProviderData();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!token) return;
    setAccepting(true);
    setClaimError(null);
    const res = await careCircleService.acceptInvitation(token);
    setAccepting(false);
    if (res.success) {
      setAcceptedSuccess(true);
      // Refresh view data via authenticated RLS
      const viewData = await careCircleService.fetchCareProviderData(token);
      setData(viewData);
    } else {
      setClaimError(
        res.error ||
          (isRtl
            ? 'دعوت نامہ فعال کرنے میں ناکامی۔ براہ کرم تصدیق کریں کہ آپ اسی ای میل سے لاگ ان ہیں۔'
            : 'Failed to claim invitation. Please ensure you are logged in with the invited email address.')
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <BioPulseLoadingScreen
        message={
          isRtl
            ? 'کیئر سرکل کی توثیق کی جا رہی ہے...'
            : 'Verifying Care Provider Authorization...'
        }
      />
    );
  }

  // ── PENDING INVITATION CLAIM SCREEN (LIGHT CLINICAL THEME) ──
  if (inviteInfo && inviteInfo.isValid && (!data || !data.isValid || !data.member)) {
    return (
      <div className="min-h-screen bg-[#F8FBFC] text-[#073B72] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#D7EAF2] text-center space-y-6 shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#0891B2] block">
              {t('recipient.portalTitle', 'BioPulse AI Care Circle')}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72]">
              {t('recipient.invitationTitle', 'Care Circle Invitation')}
            </h2>
            <p className="text-xs sm:text-sm text-[#55718F] leading-relaxed">
              {t(
                'recipient.invitationMessage',
                'You have been invited as a {{role}} ({{relationship}}) for {{patientName}}.',
                {
                  role: inviteInfo.role || 'care circle member',
                  relationship: inviteInfo.relationship || 'Support',
                  patientName: inviteInfo.memberName || 'a patient',
                }
              )}
            </p>
          </div>

          {claimError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-start">
              {claimError}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full py-3 px-6 rounded-xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#0E9EAA] to-[#0891B2] hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              {accepting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>{t('recipient.claiming', 'Claiming Access...')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('recipient.claimButton', 'Accept & View Health Summary')}</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#64748B]">
              {isRtl
                ? 'نوٹ: کلینیکل ریکارڈز دیکھنے کے لیے آپ کا مدعو کردہ ای میل ایڈریس سے لاگ ان ہونا ضروری ہے۔'
                : 'Note: You must be signed in with the invited email address to view clinical records.'}
            </p>
            <div className="pt-1 flex items-center justify-center gap-4 text-xs font-semibold">
              <Link to="/login" className="text-[#0891B2] hover:underline">
                {isRtl ? 'اکاؤنٹ میں لاگ ان کریں' : 'Sign In to Your Account'}
              </Link>
              <span className="text-[#CBD5E1]">•</span>
              <Link to="/" className="text-[#64748B] hover:text-[#073B72]">
                {t('recipient.returnHome', 'Return to BioPulse AI Home')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── ACCESS NOT AVAILABLE / EXPIRED / REVOKED SCREEN (LIGHT CLINICAL THEME) ──
  if (!data || !data.isValid || !data.member) {
    return (
      <div className="min-h-screen bg-[#F8FBFC] text-[#073B72] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#D7EAF2] text-center space-y-6 shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-rose-600 block">
              {t('recipient.portalTitle', 'BioPulse AI Care Circle')}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72]">
              {t('recipient.accessDeniedTitle', 'Access Not Available')}
            </h2>
            <p className="text-xs sm:text-sm text-[#55718F] leading-relaxed">
              {t(
                'recipient.accessDeniedMessage',
                'This Care Circle link is either invalid, expired, or access has been updated or revoked by the patient.'
              )}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-start text-[11px] text-[#64748B] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <span>
              {isRtl
                ? 'کیئر سرکل سیکیورٹی پروٹوکول کے مطابق، مریض کسی بھی وقت شیئرنگ پرمیشنز کو اپ ڈیٹ یا منسوخ کر سکتا ہے۔'
                : 'In accordance with BioPulse AI privacy protocols, health information is only visible while authorized by the patient.'}
            </span>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#0E9EAA] to-[#0891B2] hover:brightness-105 transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t('recipient.returnHome', 'Return to BioPulse AI Home')}</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const { member, patient, summary, reports, cycleInfo, symptoms, reminders, upcomingAppointment, appointments } = data;
  const perms = member.permissions;

  // Active scopes for badges
  const activeScopeKeys = (Object.keys(perms) as (keyof typeof perms)[]).filter(
    (k) => perms[k]
  );

  return (
    <div className="min-h-screen bg-[#F8FBFC] text-[#0F172A] antialiased select-none pb-24">
      {/* ── TOP CLINICAL APP BAR ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center" aria-label="BioPulse AI Home">
              <Logo size="xs" showTagline={false} />
            </Link>
            <div className="hidden sm:flex items-center gap-2 ps-3.5 border-s border-[#E2E8F0]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EAFBFC] text-[#0891B2] text-[11px] font-mono font-bold tracking-wide border border-[#B2EBF2]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('recipient.confidentialBrief', 'CONFIDENTIAL HEALTH BRIEF')}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Print / Export Report for Clinicians */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBDCE6] bg-white text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              title="Print Clinical Summary"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
            </button>

            {/* Recipient Identity Pill */}
            <div className="flex items-center gap-2 ps-2 border-s sm:border-s-0 border-[#E2E8F0]">
              <div className="text-end hidden sm:block">
                <span className="text-xs font-bold text-[#073B72] block leading-tight">
                  {member.name}
                </span>
                <span className="text-[10px] text-[#55718F] font-mono block">
                  {member.clinicOrganization || member.relationship || member.role}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
                {member.name ? member.name.charAt(0).toUpperCase() : 'R'}
              </div>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher variant="pill" />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-7 text-start">
        {/* ── PENDING CONNECTION BANNER ── */}
        {member.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0E9EAA] to-[#0891B2] text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A7F3D0]" />
                <h3 className="text-sm sm:text-base font-bold font-display">
                  Welcome, {member.name}!
                </h3>
              </div>
              <p className="text-xs text-white/90 max-w-xl leading-relaxed">
                {t(
                  'recipient.invitationMessage',
                  'You have been invited as a {{role}} ({{relationship}}) for {{patientName}}.',
                  {
                    role: member.role,
                    relationship: member.relationship || 'Support',
                    patientName: patient?.name || 'a patient',
                  }
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="px-5 py-2.5 rounded-xl font-sans font-bold text-xs text-[#073B72] bg-white hover:bg-slate-50 shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
            >
              {accepting ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#073B72] border-t-transparent animate-spin" />
              ) : acceptedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                  <span>{t('recipient.connectionActive', 'Connection Activated ✓')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                  <span>{t('recipient.claimButton', 'Accept Care Connection')}</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── PATIENT & ACCESS OVERVIEW HERO CARD ── */}
        <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[11px] font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('recipient.verifiedShare', 'Securely Shared via BioPulse AI')}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-display text-[#073B72]">
                {t('recipient.patientBrief', "{{name}}'s Clinical Health Brief", {
                  name: patient?.name || 'Patient',
                })}
              </h1>

              {/* Patient Basic Demographic Badges (Rendered ONLY if perms.profile is true) */}
              {perms.profile && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#55718F] pt-1">
                  {patient?.age && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-medium">
                      {t('recipient.metrics.age', 'Age: {{age}} yrs', { age: patient.age })}
                    </span>
                  )}
                  {patient?.bloodType && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-medium">
                      {t('recipient.metrics.blood', 'Blood: {{type}}', { type: patient.bloodType })}
                    </span>
                  )}
                  {patient?.conditions && patient.conditions.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-medium">
                      {t('recipient.metrics.conditions', 'Conditions: {{conditions}}', {
                        conditions: patient.conditions.join(', '),
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Active Shared Scopes Indicators */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FBFC] border border-[#D7EAF2] space-y-1.5 shrink-0 min-w-[220px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#55718F] uppercase">
                  {t('recipient.activeScopes', 'Active Shared Scopes')}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#0891B2]">
                  {activeScopeKeys.length} Granted
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {perms.reports && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] text-[10px] font-semibold">
                    ✓ Reports
                  </span>
                )}
                {perms.symptoms && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] text-[10px] font-semibold">
                    ✓ Symptoms
                  </span>
                )}
                {perms.cycle && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] text-[10px] font-semibold">
                    ✓ Cycle
                  </span>
                )}
                {perms.weekly_summary && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] text-[10px] font-semibold">
                    ✓ Trends
                  </span>
                )}
                {perms.medications && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] text-[10px] font-semibold">
                    ✓ Meds
                  </span>
                )}
                {perms.appointments && (
                  <span className="px-2 py-0.5 rounded-md bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2] text-[10px] font-semibold">
                    ✓ Visits
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Calibrated Date & Non-Diagnostic Clinical Banner */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#55718F]">
            <AlertCircle className="w-4 h-4 text-[#0891B2] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-[#073B72] block">
                {t('recipient.lastUpdated', 'Last calibrated')}:{' '}
                {summary?.createdAt
                  ? new Date(summary.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : new Date().toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
              </span>
              <p className="text-[11.5px] leading-relaxed">
                {t(
                  'recipient.clinicalDisclaimer',
                  'Non-diagnostic health brief. Synthesized from patient-logged entries and AI screening models for medical consultation and family support only.'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 1: LONGITUDINAL HEALTH OVERVIEW (ONLY IF PERMITTED) ── */}
        {perms.weekly_summary && summary && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3.5">
              <div>
                <span className="text-[10px] font-mono text-[#0891B2] uppercase font-bold tracking-wider block">
                  Executive Clinical Brief
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-display text-[#073B72]">
                  {t('recipient.sections.overview', 'Longitudinal Health Overview')}
                </h2>
              </div>
              <span className="text-xs font-mono text-[#55718F] bg-[#F8FAFC] px-3 py-1 rounded-md border border-[#E2E8F0]">
                Week of {summary.weekStart} – {summary.weekEnd}
              </span>
            </div>

            {/* Metrics Overview Grid (Filtered by granular permissions) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Cycle Rhythm */}
              {perms.cycle && (
                <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                    {t('recipient.metrics.cycleRhythm', 'Cycle Rhythm')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#073B72] block">
                    Day {summary.cycleDay}
                  </span>
                  <span className="text-[10px] text-[#0891B2] font-semibold block truncate">
                    {summary.phaseName}
                  </span>
                </div>
              )}

              {/* Logged Symptoms */}
              {perms.symptoms && (
                <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                    {t('recipient.metrics.symptomsLogged', 'Logged Symptoms')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#F43F7D] block">
                    {summary.symptomsCount} Entries
                  </span>
                  <span className="text-[10px] text-[#55718F] block">Past 7 days</span>
                </div>
              )}

              {/* Nutrition */}
              {perms.diet && (
                <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                    {t('recipient.metrics.nutrition', 'Nutrition')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#047857] block">
                    {summary.mealsLoggedDays} / 7 Days
                  </span>
                  <span className="text-[10px] text-[#55718F] block">Meals logged</span>
                </div>
              )}

              {/* Movement */}
              {perms.fitness && (
                <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                    {t('recipient.metrics.movement', 'Movement')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0288D1] block">
                    {summary.exerciseLoggedDays} Days Active
                  </span>
                  <span className="text-[10px] text-[#55718F] block">Workouts/walking</span>
                </div>
              )}

              {/* Medications */}
              {perms.medications && (
                <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                    {t('recipient.metrics.medications', 'Medication')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#0891B2] block">
                    {summary.medicationsCompleted}/{summary.medicationsScheduled}
                  </span>
                  <span className="text-[10px] text-[#55718F] block">Adherence rate</span>
                </div>
              )}

              {/* Next Appointment */}
              {perms.appointments && (
                <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                    {t('recipient.metrics.appointment', 'Appointment')}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#073B72] block truncate">
                    {summary.nextAppointmentDate || t('recipient.metrics.notScheduled', 'None Scheduled')}
                  </span>
                  <span className="text-[10px] text-[#55718F] block truncate">
                    {summary.nextAppointmentTitle || 'Clinical review'}
                  </span>
                </div>
              )}
            </div>

            {/* Symptom Frequency Chips */}
            {perms.symptoms && summary.symptomBreakdown && summary.symptomBreakdown.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#FFF8FA] border border-[#FDE6EF] space-y-2">
                <span className="text-[10px] font-mono text-[#F43F7D] uppercase font-bold block">
                  Observed Symptom Breakdown
                </span>
                <div className="flex flex-wrap gap-2">
                  {summary.symptomBreakdown.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#FECDD3] text-xs font-sans text-[#073B72] flex items-center gap-1.5 shadow-2xs"
                    >
                      <Activity className="w-3.5 h-3.5 text-[#F43F7D]" />
                      <span>{s.name}:</span>
                      <strong className="text-[#F43F7D] font-mono">{s.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION 2: MENSTRUAL & REPRODUCTIVE RHYTHM (ONLY IF PERMITTED) ── */}
        {perms.cycle && (cycleInfo || summary?.cycleDay) && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3.5">
              <span className="p-2 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#F43F7D]">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-[#073B72]">
                  {t('recipient.sections.cycle', 'Menstrual & Reproductive Rhythm')}
                </h2>
                <p className="text-xs text-[#55718F]">
                  Cycle regularity, current phase calibration, and menstrual timing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2]">
                <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                  Current Phase
                </span>
                <span className="text-sm font-bold text-[#F43F7D] block mt-1">
                  {cycleInfo?.phaseName || summary?.phaseName || 'Follicular'}
                </span>
                <span className="text-[10px] text-[#55718F] block">
                  Cycle Day {cycleInfo?.currentCycleDay || summary?.cycleDay || 14}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2]">
                <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                  Cycle Length
                </span>
                <span className="text-sm font-bold text-[#073B72] font-mono block mt-1">
                  {cycleInfo?.cycleLength ? `${cycleInfo.cycleLength} days` : '28 - 32 days'}
                </span>
                <span className="text-[10px] text-[#55718F] block">Average duration</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2]">
                <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                  Period Duration
                </span>
                <span className="text-sm font-bold text-[#073B72] font-mono block mt-1">
                  {cycleInfo?.periodDuration ? `${cycleInfo.periodDuration} days` : '4 - 6 days'}
                </span>
                <span className="text-[10px] text-[#55718F] block">Flow duration</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2]">
                <span className="text-[10px] font-mono text-[#55718F] uppercase block font-semibold">
                  Last Period
                </span>
                <span className="text-sm font-bold text-[#073B72] block mt-1 truncate">
                  {cycleInfo?.lastPeriodDate || 'Recorded in baseline'}
                </span>
                <span className="text-[10px] text-[#55718F] block">Period start date</span>
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 3: LOGGED SYMPTOMS (ONLY IF PERMITTED & AVAILABLE) ── */}
        {perms.symptoms && symptoms && symptoms.length > 0 && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3.5">
              <span className="p-2 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#F43F7D]">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-[#073B72]">
                  {t('recipient.sections.symptoms', 'Logged Symptoms & Severity')}
                </h2>
                <p className="text-xs text-[#55718F]">
                  Self-reported daily physical and hormonal symptom entries
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {symptoms.map((sym) => {
                const isSevere = sym.severity === 'severe';
                const isModerate = sym.severity === 'moderate';

                return (
                  <div
                    key={sym.id}
                    className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#073B72] block">
                        {sym.symptomType}
                      </span>
                      <span className="text-[10px] text-[#55718F] font-mono block">
                        {sym.occurredAt}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono border ${
                        isSevere
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isModerate
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {sym.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SECTION 4: CLINICAL MEASUREMENTS & LAB REPORTS (ONLY IF PERMITTED) ── */}
        {perms.reports && reports && reports.length > 0 && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2]">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-display text-[#073B72]">
                    {t('recipient.sections.reports', 'Clinical Measurements & Lab Reports')}
                  </h2>
                  <p className="text-xs text-[#55718F]">
                    Verified laboratory biomarkers and imaging findings shared by patient
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-[#047857] px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                {reports.length} Verified
              </span>
            </div>

            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-sm font-bold text-[#073B72] block">
                        {report.title}
                      </span>
                      <span className="text-xs text-[#55718F] block mt-0.5">
                        {report.reportType} • {report.reportDate} • {report.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] w-fit">
                      {t('recipient.reports.verifiedByPatient', 'Verified by Patient')}
                    </span>
                  </div>

                  {/* Extracted Biomarkers Table */}
                  {report.results && report.results.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-[#55718F] uppercase block">
                        {t('recipient.reports.extractedBiomarkers', 'Extracted Biomarkers & Clinical Findings')}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {report.results.map((res, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-3 rounded-xl bg-white border border-[#D7EAF2] space-y-1 shadow-2xs"
                          >
                            <span className="text-xs font-medium text-[#55718F] block truncate">
                              {res.testName}
                            </span>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-bold text-[#073B72] font-mono block">
                                {res.resultValue} {res.unit !== 'count' ? res.unit : ''}
                              </span>
                              {res.status && (
                                <span className="text-[9.5px] font-mono font-semibold text-[#0891B2] bg-[#EAFBFC] px-1.5 py-0.5 rounded">
                                  {res.status}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#64748B] font-mono block">
                              Ref: {res.referenceRange}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 5: 7-DAY LONGITUDINAL HEALTH TIMELINE (ONLY IF PERMITTED) ── */}
        {perms.weekly_summary && summary && summary.timelineDays && summary.timelineDays.length > 0 && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <WeeklyTimelineView
              days={summary.timelineDays}
              showDiet={perms.diet}
              showFitness={perms.fitness}
              showSymptoms={perms.symptoms}
              showMedications={perms.medications}
              pathway="female"
            />
          </section>
        )}

        {/* ── SECTION 6: MEDICATION REGIMEN & REMINDERS (ONLY IF PERMITTED) ── */}
        {perms.medications && reminders && reminders.length > 0 && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3.5">
              <span className="p-2 rounded-xl bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2]">
                <Pill className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-[#073B72]">
                  {t('recipient.sections.medications', 'Medication Regimen & Reminders')}
                </h2>
                <p className="text-xs text-[#55718F]">
                  Prescribed medication schedule and daily adherence
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reminders.map((med) => (
                <div
                  key={med.id}
                  className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#073B72] block">
                      {med.title}
                    </span>
                    <span className="text-[10px] text-[#55718F] font-mono block">
                      Scheduled: {med.time}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono border ${
                      med.completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {med.completed ? 'Taken' : 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 7: UPCOMING CONSULTATION & LOGISTICS (ONLY IF PERMITTED) ── */}
        {perms.appointments && (upcomingAppointment || summary?.nextAppointmentDate || (appointments && appointments.length > 0)) && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3.5">
              <span className="p-2 rounded-xl bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2]">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-[#073B72]">
                  {t('recipient.sections.appointments', 'Upcoming Consultation & Logistics')}
                </h2>
                <p className="text-xs text-[#55718F]">
                  Scheduled medical visits and patient-prepared questions
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-sm font-bold text-[#073B72] block">
                    {upcomingAppointment?.title || summary?.nextAppointmentTitle || 'Clinical Consultation & Longitudinal Review'}
                  </span>
                  <span className="text-xs text-[#0891B2] font-semibold block mt-0.5">
                    {upcomingAppointment
                      ? `${upcomingAppointment.scheduledDate} at ${upcomingAppointment.scheduledTime}`
                      : summary?.nextAppointmentDate}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] w-fit">
                  {t('recipient.appointments.active', 'Active Appointment')}
                </span>
              </div>

              {upcomingAppointment?.reason && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#55718F] uppercase font-bold block">
                    {t('recipient.appointments.reason', 'Reason for Consultation')}
                  </span>
                  <p className="text-xs text-[#073B72] bg-white p-3 rounded-xl border border-[#D7EAF2]">
                    {upcomingAppointment.reason}
                  </p>
                </div>
              )}

              {upcomingAppointment?.location && (
                <div className="flex items-center justify-between gap-2 text-xs text-[#55718F]">
                  <span>Location: {upcomingAppointment.location}</span>
                  {upcomingAppointment.meetingUrl && (
                    <a
                      href={upcomingAppointment.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#0891B2] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{t('recipient.appointments.joinVideo', 'Join Video Consultation')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Patient-Prepared Questions for Doctor */}
              {upcomingAppointment?.doctorQuestions && upcomingAppointment.doctorQuestions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white border border-[#D7EAF2] space-y-2">
                  <span className="text-[10px] font-mono text-[#0891B2] uppercase font-bold block">
                    {t('recipient.appointments.patientQuestions', 'Patient-Prepared Questions ({{count}})', {
                      count: upcomingAppointment.doctorQuestions.length,
                    })}
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {upcomingAppointment.doctorQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="flex items-start gap-2 text-[#073B72]">
                        <span className="text-[#0891B2] font-bold">•</span>
                        <span className={q.isDiscussed ? 'line-through text-[#94A3B8]' : ''}>
                          {q.question}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SECTION 8: AI HEALTH TOPICS SUMMARY (ONLY IF PERMITTED) ── */}
        {perms.chat_summary && summary?.chatTopicsSummary && summary.chatTopicsSummary.length > 0 && (
          <section className="p-5 sm:p-7 rounded-3xl bg-white border border-[#D7EAF2] shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3.5">
              <span className="p-2 rounded-xl bg-[#EAFBFC] border border-[#B2EBF2] text-[#0891B2]">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-[#073B72]">
                  {t('recipient.sections.discussion', 'Synthesized Health Discussion Themes')}
                </h2>
                <p className="text-xs text-[#55718F]">
                  High-level topic themes discussed with BioPulse AI (zero private transcripts exposed)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#0891B2] uppercase block">
                {t('recipient.chat.themes', 'Discussion Themes This Week:')}
              </span>
              <ul className="space-y-1.5 text-xs text-[#073B72]">
                {summary.chatTopicsSummary.map((topic, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2">
                    <span className="text-[#0891B2] font-bold">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[10.5px] text-[#64748B] font-mono">
              {t('recipient.chat.noDiagnosis', 'No diagnostic conclusion is generated from this summary. For clinical context only.')}
            </div>
          </section>
        )}

        {/* ── CLINICAL GOVERNANCE & PRIVACY FOOTER ── */}
        <footer className="pt-6 border-t border-[#E2E8F0] text-center space-y-2 text-xs text-[#64748B]">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-[#073B72]">
            <ShieldCheck className="w-4 h-4 text-[#0891B2]" />
            <span>BioPulse AI Clinical Brief • Encrypted End-to-End • Recipient Access Logged</span>
          </div>
          <p className="max-w-2xl mx-auto text-[11px] leading-relaxed">
            This health brief reflects patient-authorized health records and AI screening models. It is designed to assist discussions between patients, clinicians, and support circles and does not constitute a standalone medical diagnosis.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CareProviderPortalPage;
