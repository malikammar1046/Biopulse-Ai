import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Printer,
  Copy,
  Check,
  Activity,
  Calendar,
  Pill,
  Footprints,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import type { AppointmentItem, HealthSummarySnapshot, ConsultationBrief } from '../../types/appointment';

interface PreConsultationPrepModalProps {
  isOpen: boolean;
  appointment: AppointmentItem | null;
  snapshot: HealthSummarySnapshot;
  brief: ConsultationBrief | null;
  onClose: () => void;
  onAddQuestion: (appointmentId: string, question: string) => Promise<any>;
  onToggleQuestion: (appointmentId: string, questionId: string) => Promise<any>;
  onDeleteQuestion: (appointmentId: string, questionId: string) => Promise<any>;
}

const SUGGESTED_DOCTOR_QUESTIONS = [
  'How do my recent LH/FSH and biomarker ratios compare with our baseline goals?',
  'Should I adjust my inositol or metformin dose timing around meals?',
  'My luteal phase symptoms have varied recently. Are there specific lifestyle adjustments you recommend?',
  'What repeat hormone or glucose tolerance tests should we schedule at our next visit?',
];

export const PreConsultationPrepModal: React.FC<PreConsultationPrepModalProps> = ({
  isOpen,
  appointment,
  snapshot,
  brief,
  onClose,
  onAddQuestion,
  onToggleQuestion,
  onDeleteQuestion,
}) => {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<'prep' | 'brief'>('prep');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setIsAddingQuestion(true);
    try {
      await onAddQuestion(appointment.id, newQuestionText.trim());
      setNewQuestionText('');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleAddSuggestedQuestion = async (text: string) => {
    setIsAddingQuestion(true);
    try {
      await onAddQuestion(appointment.id, text);
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleCopyBrief = () => {
    if (!brief) return;
    const text = `
OVASENSE CLINICAL CONSULTATION SUMMARY
Patient: ${brief.patientName} (${brief.patientAge || 28} yo)
Appointment: ${brief.appointmentTitle} with ${brief.providerName} on ${brief.appointmentDate}

1. CYCLE & HORMONAL PATTERN:
- Current Phase: ${snapshot.cycle.currentPhase} (Cycle Day ${snapshot.cycle.currentCycleDay})
- Cycle Regularity: ${snapshot.cycle.cycleRegularity} (Avg: ${snapshot.cycle.averageLengthDays || 32} days)

2. SYMPTOM TRACKING:
- Total Logged Entries: ${snapshot.symptoms.totalLoggedCount}
- Top Symptoms: ${snapshot.symptoms.topSymptoms.map((s) => `${s.name} (severity ${s.averageSeverity}/5)`).join(', ')}

3. LIFESTYLE & NUTRITION:
- Weekly Movement: ${snapshot.lifestyle.weeklyMovementMinutes} minutes across ${snapshot.lifestyle.activeMovementDays} active days
- Average Hydration: ${snapshot.lifestyle.averageWaterGlasses} glasses/day

4. MEDICATIONS & SUPPLEMENTS:
- Active: ${snapshot.medications.activeMedsList.join(', ')}
- Weekly Adherence: ${snapshot.medications.weeklyAdherencePercentage}%

5. MEDICAL REPORTS & LAB TESTS:
- Uploaded Reports: ${snapshot.reports.totalUploadedCount}
- Flagged Biomarkers: ${snapshot.reports.flaggedList.length > 0 ? snapshot.reports.flaggedList.join('; ') : 'All recorded biomarkers within expected reference ranges'}

6. PATIENT QUESTIONS:
${(appointment.doctorQuestions || []).map((q, i) => `${i + 1}. [${q.isDiscussed ? 'Discussed' : 'Pending'}] ${q.question}`).join('\n')}

DISCLAIMER:
${brief.disclaimer}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1C1326]/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col text-left select-none"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-[#F0EAF5] bg-gradient-to-r from-[#FAF5FF] via-white to-[#FDF2F8] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-display text-[#1C1326]">
                    Prepare for Your Visit
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-mono font-bold">
                    Live Data
                  </span>
                </div>
                <p className="text-xs text-[#584B68]">
                  {appointment.providerName} • {appointment.scheduledDate} at {appointment.scheduledTime}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-[#F5F0FA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-3 border-b border-[#F0EAF5] flex items-center gap-4 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('prep')}
              className={`pb-3 text-xs font-bold font-display tracking-tight transition-all border-b-2 cursor-pointer ${
                activeTab === 'prep'
                  ? 'border-[#6E2D8B] text-[#6E2D8B]'
                  : 'border-transparent text-[#8D7E9E] hover:text-[#1C1326]'
              }`}
            >
              1. Health Snapshot & Questions
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('brief')}
              className={`pb-3 text-xs font-bold font-display tracking-tight transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'brief'
                  ? 'border-[#6E2D8B] text-[#6E2D8B]'
                  : 'border-transparent text-[#8D7E9E] hover:text-[#1C1326]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
              <span>2. 1-Page Doctor Brief</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'prep' ? (
              <>
                {/* ── SECTION 1: REAL OVASENSE HEALTH SNAPSHOT ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold font-display text-[#1C1326] flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#6E2D8B]" />
                      <span>Your OvaSense Health Summary</span>
                    </h3>
                    <span className="text-[10px] font-mono text-[#8D7E9E]">
                      Auto-synthesized from your records
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Cycle Card */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-[#EDE4F7] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Cycle</span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C1326]">
                        {snapshot.cycle.currentPhase}
                      </p>
                      <p className="text-[11px] text-[#584B68]">
                        Day {snapshot.cycle.currentCycleDay} • {snapshot.cycle.cycleRegularity}
                      </p>
                    </div>

                    {/* Symptoms Card */}
                    <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#E11D48]">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Symptoms</span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C1326]">
                        {snapshot.symptoms.totalLoggedCount > 0
                          ? `${snapshot.symptoms.totalLoggedCount} logged entries`
                          : 'Not enough recent data'}
                      </p>
                      <p className="text-[11px] text-[#584B68] truncate">
                        {snapshot.symptoms.topSymptoms.map((s) => s.name).join(', ')}
                      </p>
                    </div>

                    {/* Lifestyle Card */}
                    <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                        <Footprints className="w-3.5 h-3.5" />
                        <span>Lifestyle</span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C1326]">
                        {snapshot.lifestyle.weeklyMovementMinutes} mins movement
                      </p>
                      <p className="text-[11px] text-[#584B68]">
                        {snapshot.lifestyle.averageWaterGlasses} glasses water / day
                      </p>
                    </div>

                    {/* Medications Card */}
                    <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#E0F2FE] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0369A1]">
                        <Pill className="w-3.5 h-3.5" />
                        <span>Medication</span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C1326]">
                        {snapshot.medications.weeklyAdherencePercentage}% adherence
                      </p>
                      <p className="text-[11px] text-[#584B68] truncate">
                        {snapshot.medications.activeMedsList.join(', ')}
                      </p>
                    </div>

                    {/* Reports Card */}
                    <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Medical Reports</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#B45309]">
                          {snapshot.reports.totalUploadedCount} Reports
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1C1326]">
                        {snapshot.reports.flaggedBiomarkersCount > 0
                          ? `${snapshot.reports.flaggedBiomarkersCount} biomarkers need a closer look`
                          : 'Biomarkers recorded in normal range'}
                      </p>
                      {snapshot.reports.flaggedList.length > 0 && (
                        <p className="text-[11px] text-[#92400E] truncate">
                          {snapshot.reports.flaggedList.join('; ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: PATIENT QUESTION BUILDER ── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold font-display text-[#1C1326] flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-[#8E3EAF]" />
                        <span>Questions for My Doctor</span>
                      </h3>
                      <p className="text-xs text-[#584B68]">
                        List specific questions or symptoms you would like to discuss during your appointment.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#6E2D8B]">
                      {appointment.doctorQuestions?.length || 0} Saved
                    </span>
                  </div>

                  {/* Add Question Input Form */}
                  <form onSubmit={handleAddQuestionSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g. My cycle has been less predictable. What should I ask about?"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7DFEF] text-xs focus:outline-none focus:ring-2 focus:ring-[#8E3EAF]/30 focus:border-[#8E3EAF]"
                    />
                    <button
                      type="submit"
                      disabled={isAddingQuestion || !newQuestionText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#6E2D8B] hover:bg-[#8E3EAF] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>

                  {/* Quick Suggested Questions */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#8D7E9E] font-bold block">
                      Suggested Questions to Consider
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_DOCTOR_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddSuggestedQuestion(q)}
                          className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-[#F8F5FA] border border-[#E7DFEF] hover:border-[#8E3EAF] text-[#584B68] hover:text-[#6E2D8B] transition-all cursor-pointer"
                        >
                          + {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Saved Questions List */}
                  <div className="space-y-2 pt-2">
                    {appointment.doctorQuestions && appointment.doctorQuestions.length > 0 ? (
                      appointment.doctorQuestions.map((q) => (
                        <div
                          key={q.id}
                          className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                            q.isDiscussed
                              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                              : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#1C1326]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleQuestion(appointment.id, q.id)}
                            className="mt-0.5 text-[#6E2D8B] hover:scale-110 transition-transform cursor-pointer shrink-0"
                          >
                            {q.isDiscussed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#8D7E9E]" />
                            )}
                          </button>

                          <span
                            className={`flex-1 ${
                              q.isDiscussed ? 'line-through opacity-75' : 'font-medium'
                            }`}
                          >
                            {q.question}
                          </span>

                          <button
                            type="button"
                            onClick={() => onDeleteQuestion(appointment.id, q.id)}
                            className="text-[#8D7E9E] hover:text-[#B91C1C] transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#8D7E9E] italic py-2">
                        No questions added yet. Add a question above to have it ready for your doctor.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* ── SECTION 3: 1-PAGE DOCTOR CONSULTATION BRIEF ── */
              <div className="space-y-6">
                {/* Action Bar */}
                <div className="flex items-center justify-between gap-3 bg-[#FAF5FF] p-3 rounded-2xl border border-[#EDE4F7]">
                  <span className="text-xs font-bold text-[#6E2D8B]">
                    1-Page Clinical Consultation Brief
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyBrief}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-bold text-[#6E2D8B] hover:bg-[#F8F5FA] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Brief' : 'Copy Text'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white text-xs font-bold shadow-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Brief</span>
                    </button>
                  </div>
                </div>

                {/* Printable Brief Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#1C1326]/15 space-y-6 text-[#1C1326] font-sans shadow-sm">
                  {/* Brief Header */}
                  <div className="border-b-2 border-[#1C1326] pb-4 flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold font-display tracking-tight text-[#1C1326]">
                        OvaSense Clinical Consultation Summary
                      </h4>
                      <p className="text-xs text-[#584B68]">
                        Longitudinal Patient Tracking Synthesis • Generated {brief?.generatedAt}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold block">{appointment.providerName}</span>
                      <span className="text-[#584B68]">{appointment.scheduledDate}</span>
                    </div>
                  </div>

                  {/* Patient Info Row */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-[#F8F5FA] rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-[#8D7E9E] uppercase font-bold block">Patient</span>
                      <span className="font-bold">{brief?.patientName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8D7E9E] uppercase font-bold block">Age</span>
                      <span className="font-bold">{brief?.patientAge} years</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8D7E9E] uppercase font-bold block">Visit Type</span>
                      <span className="font-bold capitalize">{appointment.appointmentType.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Summary Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Cycle & Symptoms */}
                    <div className="space-y-3 p-4 rounded-xl border border-[#E7DFEF]">
                      <h5 className="font-bold font-display text-[#6E2D8B] uppercase tracking-wider text-[11px]">
                        Cycle & Symptom Overview
                      </h5>
                      <div className="space-y-1 text-xs">
                        <p><strong>Current Phase:</strong> {snapshot.cycle.currentPhase} (Day {snapshot.cycle.currentCycleDay})</p>
                        <p><strong>Cycle Pattern:</strong> {snapshot.cycle.cycleRegularity}</p>
                        <p><strong>Total Symptoms Logged:</strong> {snapshot.symptoms.totalLoggedCount}</p>
                        <p><strong>Top Symptoms:</strong> {snapshot.symptoms.topSymptoms.map((s) => `${s.name} (${s.averageSeverity}/5)`).join(', ')}</p>
                      </div>
                    </div>

                    {/* Medications & Lab Reports */}
                    <div className="space-y-3 p-4 rounded-xl border border-[#E7DFEF]">
                      <h5 className="font-bold font-display text-[#6E2D8B] uppercase tracking-wider text-[11px]">
                        Medications & Biomarkers
                      </h5>
                      <div className="space-y-1 text-xs">
                        <p><strong>Active Meds:</strong> {snapshot.medications.activeMedsList.join(', ')}</p>
                        <p><strong>Adherence:</strong> {snapshot.medications.weeklyAdherencePercentage}% over past 7 days</p>
                        <p><strong>Reports on File:</strong> {snapshot.reports.totalUploadedCount}</p>
                        {snapshot.reports.flaggedList.length > 0 ? (
                          <p className="text-[#B91C1C] font-semibold">
                            <strong>Flagged Results:</strong> {snapshot.reports.flaggedList.join('; ')}
                          </p>
                        ) : (
                          <p className="text-[#15803D]">All recorded lab values within reference ranges</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Patient Questions Section */}
                  <div className="p-4 rounded-xl border border-[#E7DFEF] space-y-2">
                    <h5 className="font-bold font-display text-[#6E2D8B] uppercase tracking-wider text-[11px]">
                      Patient-Prepared Questions for Discussion ({appointment.doctorQuestions?.length || 0})
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      {appointment.doctorQuestions && appointment.doctorQuestions.length > 0 ? (
                        appointment.doctorQuestions.map((q, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded border border-[#8D7E9E] flex items-center justify-center text-[10px]">
                              {q.isDiscussed ? '✓' : ''}
                            </span>
                            <span>{q.question}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#8D7E9E] italic">No specific questions recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Clinical Disclaimer */}
                  <div className="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#EDE4F7] flex items-start gap-2.5 text-[11px] text-[#584B68] leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-[#6E2D8B] shrink-0 mt-0.5" />
                    <span>
                      {brief?.disclaimer ||
                        'This summary is generated from information recorded in OvaSense and is intended to support discussion with a healthcare professional. It does not replace clinical judgment or provide a diagnosis.'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-[#F0EAF5] bg-[#FAF5FF] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#584B68]">
              {appointment.status === 'scheduled' ? 'Scheduled Visit' : 'Completed Consultation'}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#6E2D8B] text-white font-bold text-xs hover:bg-[#8E3EAF] transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
