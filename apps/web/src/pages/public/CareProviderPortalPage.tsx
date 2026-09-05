import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope,
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
} from 'lucide-react';
import { careCircleService } from '../../services/careCircleService';
import type { CareProviderViewData } from '../../types/careCircle';
import { WeeklyTimelineView } from '../../components/care-circle/WeeklyTimelineView';
import { Logo } from '../../components/brand/Logo';

export const CareProviderPortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<CareProviderViewData | null>(null);
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
        setData(viewData);
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
    const res = await careCircleService.acceptInvitation(token);
    setAccepting(false);
    if (res.success) {
      setAcceptedSuccess(true);
      // Refresh view data
      const viewData = await careCircleService.fetchCareProviderData(token);
      setData(viewData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#10071A] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] flex items-center justify-center shadow-lg shadow-purple-950/50 animate-pulse">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#B4A6C7] uppercase">
            Verifying Care Provider Authorization...
          </span>
        </div>
      </div>
    );
  }

  // If token is invalid or access revoked
  if (!data || !data.isValid || !data.member) {
    return (
      <div className="min-h-screen bg-[#10071A] text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-[36px] bg-[#180A26] border border-white/10 text-center space-y-5 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-white">
              Access Not Available
            </h2>
            <p className="text-xs text-[#CDBDD8] leading-relaxed">
              This Care Circle link is either invalid, expired, or access has been updated/revoked by the patient.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to VITASense Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const { member, patient, summary, reports } = data;
  const perms = member.permissions;

  return (
    <div className="min-h-screen bg-[#F8F5FA] text-[#1C1326] antialiased select-none pb-20">
      {/* ── TOP CLINICAL APP BAR ── */}
      <header className="h-16 bg-[#180A26] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between text-white sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <Logo size="xs" theme="dark" showTagline={false} />
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/15">
            <span className="text-xs font-mono text-[#D8B4FE] font-bold">
              CARE PROVIDER PORTAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-white block">{member.name}</span>
            <span className="text-[10px] text-[#CDBDD8] font-mono block">
              {member.clinicOrganization || member.relationship || 'Authorized Reviewer'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center font-bold font-mono text-xs">
            {member.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 text-left">
        {/* ── INVITATION ACCEPTANCE BANNER (IF PENDING) ── */}
        {member.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FDA4AF]" />
                <h3 className="text-base font-bold font-display">
                  Welcome, {member.name}!
                </h3>
              </div>
              <p className="text-xs text-[#F5EEFB] max-w-xl">
                {patient?.name || 'Your patient'} has invited you to join their VITASense Care Circle. Accept this invitation to confirm your connection.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-[#180A26] bg-white hover:bg-[#FAF5FF] shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
            >
              {accepting ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#180A26] border-t-transparent animate-spin" />
              ) : acceptedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                  <span>Connection Activated ✓</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                  <span>Accept Care Connection</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── PATIENT & ACCESS OVERVIEW CARD ── */}
        <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active Patient-Granted Access</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#1C1326]">
              {patient?.name || 'Patient'}’s Clinical Health Brief
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#584B68]">
              {perms.profile && patient?.age && <span>Age: {patient.age} yrs</span>}
              {perms.profile && patient?.bloodType && <span>• Blood: {patient.bloodType}</span>}
              {perms.profile && patient?.conditions && patient.conditions.length > 0 && (
                <span>• Conditions: {patient.conditions.join(', ')}</span>
              )}
            </div>
          </div>

          {/* Active Permissions Summary Pills */}
          <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-1.5 shrink-0">
            <span className="text-[10px] font-mono text-[#8D7E9E] uppercase block font-bold">
              Access Scopes Enabled
            </span>
            <div className="flex flex-wrap gap-1.5">
              {perms.reports && (
                <span className="px-2 py-0.5 rounded-lg bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold">
                  ✓ Reports
                </span>
              )}
              {perms.symptoms && (
                <span className="px-2 py-0.5 rounded-lg bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold">
                  ✓ Symptoms
                </span>
              )}
              {perms.cycle && (
                <span className="px-2 py-0.5 rounded-lg bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold">
                  ✓ Cycle
                </span>
              )}
              {perms.weekly_summary && (
                <span className="px-2 py-0.5 rounded-lg bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold">
                  ✓ Summary
                </span>
              )}
              {!perms.reports && (
                <span className="px-2 py-0.5 rounded-lg bg-[#F3F4F6] text-[#9CA3AF] text-[10px]">
                  ✕ Reports
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── 1. PATIENT WEEKLY OVERVIEW ── */}
        {perms.weekly_summary && summary ? (
          <div className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-r from-[#180A26] via-[#140722] to-[#200C30] text-white shadow-xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#FDA4AF] uppercase font-bold tracking-wider block">
                  Longitudinal Clinical Review
                </span>
                <h2 className="text-xl font-bold font-display text-white mt-0.5">
                  Patient Weekly Overview
                </h2>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-mono text-[#CDBDD8] block">
                  Week of {summary.weekStart} – {summary.weekEnd}
                </span>
                <span className="text-[10px] text-[#A797BD] italic block">
                  Synthesized for Clinical Consultation
                </span>
              </div>
            </div>

            {/* Metric Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Cycle Day */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <span className="text-[10px] font-mono text-[#A797BD] uppercase block">
                  Cycle Rhythm
                </span>
                {perms.cycle ? (
                  <span className="text-sm font-bold text-white font-display block mt-1">
                    Day {summary.cycleDay} • {summary.phaseName}
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic mt-1 block">Private</span>
                )}
              </div>

              {/* Symptoms */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <span className="text-[10px] font-mono text-[#A797BD] uppercase block">
                  Logged Symptoms
                </span>
                {perms.symptoms ? (
                  <span className="text-sm font-bold text-[#FB7185] font-display block mt-1">
                    {summary.symptomsCount} Entries Logged
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic mt-1 block">Private</span>
                )}
              </div>

              {/* Meals Logged */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <span className="text-[10px] font-mono text-[#A797BD] uppercase block">
                  Nutrition Tracking
                </span>
                {perms.diet ? (
                  <span className="text-sm font-bold text-[#34D399] font-display block mt-1">
                    {summary.mealsLoggedDays} of 7 Days Logged
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic mt-1 block">Private</span>
                )}
              </div>

              {/* Exercise */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <span className="text-[10px] font-mono text-[#A797BD] uppercase block">
                  Movement
                </span>
                {perms.fitness ? (
                  <span className="text-sm font-bold text-[#C084FC] font-display block mt-1">
                    {summary.exerciseLoggedDays} Exercise Days
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic mt-1 block">Private</span>
                )}
              </div>

              {/* Medications */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <span className="text-[10px] font-mono text-[#A797BD] uppercase block">
                  Medication Adherence
                </span>
                {perms.medications ? (
                  <span className="text-sm font-bold text-[#60A5FA] font-display block mt-1">
                    {summary.medicationsCompleted}/{summary.medicationsScheduled} Completed
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic mt-1 block">Private</span>
                )}
              </div>

              {/* Next Appointment */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <span className="text-[10px] font-mono text-[#A797BD] uppercase block">
                  Next Appointment
                </span>
                {perms.appointments && summary.nextAppointmentDate ? (
                  <span className="text-sm font-bold text-[#FBBF24] font-display block mt-1 truncate">
                    {summary.nextAppointmentDate}
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic mt-1 block">Private</span>
                )}
              </div>
            </div>

            {/* Symptom Frequency Chips */}
            {perms.symptoms && summary.symptomBreakdown.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-[#FDA4AF] uppercase font-bold block">
                  Weekly Symptom Frequency
                </span>
                <div className="flex flex-wrap gap-2">
                  {summary.symptomBreakdown.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-white/10 text-xs font-mono text-white flex items-center gap-1.5"
                    >
                      <Activity className="w-3 h-3 text-[#FB7185]" />
                      <span>{s.name}:</span>
                      <strong className="text-[#FDA4AF]">{s.count} {s.count === 1 ? 'entry' : 'entries'}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Disclaimer Note */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-2.5 text-xs text-[#CDBDD8]">
              <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {summary.disclaimer}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[36px] bg-white border border-[#E7DFEF] text-center space-y-2">
            <Lock className="w-6 h-6 text-[#8D7E9E] mx-auto" />
            <h3 className="text-sm font-bold font-display text-[#1C1326]">
              Weekly Health Summary Private
            </h3>
            <p className="text-xs text-[#584B68]">
              The patient has not granted access to longitudinal weekly summaries.
            </p>
          </div>
        )}

        {/* ── 2. 7-DAY TIMELINE VIEW ── */}
        {perms.weekly_summary && summary && (
          <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
            <WeeklyTimelineView
              days={summary.timelineDays}
              showDiet={perms.diet}
              showFitness={perms.fitness}
              showSymptoms={perms.symptoms}
              showMedications={perms.medications}
            />
          </div>
        )}

        {/* ── 3. LAB & ULTRASOUND REPORTS (IF PERMITTED) ── */}
        <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold font-display text-[#1C1326]">
                Medical Lab & Ultrasound Reports
              </h2>
            </div>
            {perms.reports && reports && reports.length > 0 && (
              <span className="text-xs font-mono font-bold text-[#047857] px-2.5 py-0.5 rounded-full bg-[#ECFDF5]">
                {reports.length} Verified Document
              </span>
            )}
          </div>

          {perms.reports ? (
            reports && reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DFEF] pb-3">
                      <div>
                        <span className="text-sm font-bold text-[#1C1326] block">
                          {report.title}
                        </span>
                        <span className="text-xs text-[#584B68] block mt-0.5">
                          {report.reportType} • {report.reportDate} • {report.fileName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] w-fit">
                        Verified by Patient
                      </span>
                    </div>

                    {/* Extracted Biomarkers Table */}
                    {report.results && report.results.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold text-[#8D7E9E] uppercase">
                          Extracted Biomarkers & Ultrasound Findings
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {report.results.map((res, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-3 rounded-xl bg-white border border-[#E7DFEF] space-y-1"
                            >
                              <span className="text-xs text-[#584B68] block">{res.testName}</span>
                              <span className="text-sm font-bold text-[#1C1326] font-mono block">
                                {res.resultValue} {res.unit !== 'count' ? res.unit : ''}
                              </span>
                              <span className="text-[10px] text-[#8D7E9E] font-mono block">
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
            ) : (
              <div className="p-6 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center">
                <p className="text-xs text-[#584B68]">No reports have been uploaded yet.</p>
              </div>
            )
          ) : (
            <div className="p-6 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] flex items-center gap-3 text-xs text-[#BE123C]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Private — the patient has not shared medical reports.</span>
            </div>
          )}
        </div>

        {/* ── 3.5. UPCOMING APPOINTMENT & CONSULTATION LOGISTICS ── */}
        {perms.appointments && (
          <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold font-display text-[#1C1326]">
                Upcoming Appointment & Consultation
              </h2>
            </div>

            {data.upcomingAppointment || summary?.nextAppointmentDate ? (
              <div className="p-5 rounded-2xl bg-[#FAF5FF] border border-[#D8B4FE]/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DFEF] pb-3">
                  <div>
                    <span className="text-sm font-bold text-[#1C1326] block">
                      {data.upcomingAppointment?.title || summary?.nextAppointmentTitle || 'Clinical Consultation & Longitudinal Review'}
                    </span>
                    <span className="text-xs text-[#6E2D8B] font-semibold block mt-0.5">
                      Scheduled for {data.upcomingAppointment ? `${data.upcomingAppointment.scheduledDate} at ${data.upcomingAppointment.scheduledTime}` : summary?.nextAppointmentDate}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#ECFDF5] text-[#047857] w-fit">
                    Active Appointment
                  </span>
                </div>

                {data.upcomingAppointment?.reason && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#8D7E9E] uppercase font-bold block">
                      Reason for Consultation
                    </span>
                    <p className="text-xs text-[#1C1326] bg-white p-3 rounded-xl border border-[#E7DFEF]">
                      {data.upcomingAppointment.reason}
                    </p>
                  </div>
                )}

                {data.upcomingAppointment?.location && (
                  <div className="flex items-center justify-between gap-2 text-xs text-[#584B68]">
                    <span>Location: {data.upcomingAppointment.location}</span>
                    {data.upcomingAppointment.meetingUrl && (
                      <a
                        href={data.upcomingAppointment.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#047857] hover:underline"
                      >
                        Join Video Meeting →
                      </a>
                    )}
                  </div>
                )}

                {/* Patient-Prepared Questions for Doctor */}
                {data.upcomingAppointment?.doctorQuestions && data.upcomingAppointment.doctorQuestions.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E7DFEF] space-y-2">
                    <span className="text-[10px] font-mono text-[#6E2D8B] uppercase font-bold block">
                      Patient Questions for this Visit ({data.upcomingAppointment.doctorQuestions.length})
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {data.upcomingAppointment.doctorQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="flex items-start gap-2 text-[#1C1326]">
                          <span className="text-[#6E2D8B] font-bold">•</span>
                          <span className={q.isDiscussed ? 'line-through text-[#8D7E9E]' : ''}>{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#584B68]">
                  Longitudinal patient metrics (Cycle Day {summary?.cycleDay || 14}, {summary?.symptomsCount || 0} logged symptoms, and medication adherence) are synthesized for discussion during this visit.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center">
                <p className="text-xs text-[#584B68]">No upcoming appointment scheduled with this provider.</p>
              </div>
            )}
          </div>
        )}

        {/* ── 4. HEALTH TOPICS SUMMARY (AI CHAT SYNTHESIS) ── */}
        {perms.chat_summary && summary?.chatTopicsSummary && (
          <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#FEF3C7] text-[#D97706]">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold font-display text-[#1C1326]">
                Patient Health Topics Summary
              </h2>
            </div>

            <p className="text-xs text-[#584B68] leading-relaxed">
              Topics discussed by the patient with VITASense AI this week. (Zero raw chat transcripts are ever recorded or exposed).
            </p>

            <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#D8B4FE]/50 space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#6E2D8B] uppercase block">
                Discussion Themes This Week:
              </span>
              <ul className="space-y-1.5 text-xs text-[#1C1326]">
                {summary.chatTopicsSummary.map((topic, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2">
                    <span className="text-[#6E2D8B] font-bold">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-[10px] text-[#8D7E9E] font-mono">
              No diagnostic conclusion is generated from this summary. For clinical context only.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CareProviderPortalPage;
