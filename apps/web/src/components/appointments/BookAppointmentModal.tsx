import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XClose, Calendar, AlertCircle, Plus } from '@untitledui/icons';
import type { CareCircleMember } from '../../types/careCircle';
import type { AppointmentInput, AppointmentType } from '../../types/appointment';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

interface BookAppointmentModalProps {
  isOpen: boolean;
  careCircleMembers: CareCircleMember[];
  onClose: () => void;
  onBook: (input: AppointmentInput) => Promise<{ success: boolean; error?: string }>;
}

const APPOINTMENT_TYPES: { type: AppointmentType; label: string }[] = [
  { type: 'consultation', label: 'Clinical Consultation' },
  { type: 'follow_up', label: 'Follow-Up Review' },
  { type: 'lab_review', label: 'Lab & Blood Biomarker Review' },
  { type: 'routine_check', label: 'Routine Health Check-Up' },
  { type: 'other', label: 'Other Healthcare Visit' },
];

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  careCircleMembers,
  onClose,
  onBook,
}) => {
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isMale = pathway === 'male';

  const doctors = careCircleMembers.filter((m) => m.role === 'doctor' && m.status === 'active');
  const defaultDoctor = doctors[0]?.name || (isMale ? 'Dr. Tariq Mahmood' : 'Dr. Sarah Malik');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [providerName, setProviderName] = useState(defaultDoctor);
  const [providerSpecialty, setProviderSpecialty] = useState(
    isMale ? 'Endocrinology & Men’s Health Specialist' : 'Specialist Gynecologist & Endocrinologist'
  );
  const [selectedCareCircleId, setSelectedCareCircleId] = useState(doctors[0]?.id || '');
  const [title, setTitle] = useState('Clinical Consultation & Review');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [scheduledDate, setScheduledDate] = useState(tomorrowStr);
  const [scheduledTime, setScheduledTime] = useState('15:30');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState('Health Clinic & Online Telehealth');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.biopulse.ai/consultation');
  const [reason, setReason] = useState(
    isMale
      ? 'Discussion of hormone screening results, vitality patterns, and lab work.'
      : 'Discussion of symptom patterns, nutritional protocol, and cycle regularity.'
  );
  const [patientNotes, setPatientNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProviderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setSelectedCareCircleId('');
      setProviderName('');
      setProviderSpecialty('Healthcare Professional');
    } else {
      const doc = doctors.find((d) => d.id === val);
      if (doc) {
        setSelectedCareCircleId(doc.id);
        setProviderName(doc.name);
        setProviderSpecialty(doc.relationship || (isMale ? 'Endocrinologist / Urologist' : 'Specialist Gynecologist'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!providerName.trim()) {
      setErrorMsg('Please enter a healthcare provider name.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a visit title.');
      return;
    }
    if (!scheduledDate) {
      setErrorMsg('Please select a scheduled date.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduledDate < todayStr) {
      setErrorMsg('Appointment date cannot be in the past.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onBook({
        providerName,
        providerSpecialty,
        careCircleMemberId: selectedCareCircleId || undefined,
        title,
        appointmentType,
        scheduledDate,
        scheduledTime,
        durationMinutes,
        location: isOnline ? 'Online Video Consultation' : location,
        meetingUrl: isOnline ? meetingUrl : undefined,
        reason,
        patientNotes,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to book appointment.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected booking error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl rounded-[32px] bg-white border border-[#BAE6FD] shadow-2xl overflow-hidden z-10 my-8 text-left select-none"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#E2E8F0] bg-[#F0F9FF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold font-display text-[#0F172A]">
                  Book an Appointment
                </h2>
                <p className="text-xs text-[#64748B]">
                  Schedule your consultation and link it with your Care Circle
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-colors cursor-pointer"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#0F172A] block">
                Healthcare Provider
              </label>
              {doctors.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedCareCircleId || (providerName === defaultDoctor ? doctors[0].id : 'custom')}
                    onChange={handleProviderSelect}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#0F172A] focus:ring-2 focus:ring-[#0288D1]/30 focus:border-[#0288D1]"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.relationship || 'Care Circle Doctor'})
                      </option>
                    ))}
                    <option value="custom">+ Other / External Provider</option>
                  </select>

                  {!selectedCareCircleId && (
                    <input
                      type="text"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="Doctor or Clinic Name"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0288D1]"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Malik"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] focus:ring-2 focus:ring-[#0288D1]/30 focus:border-[#0288D1]"
                />
              )}
            </div>

            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] block">Visit Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Comprehensive PCOS Review"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] block">Appointment Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs focus:outline-none focus:border-[#0288D1]"
                >
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] block">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] block">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0F172A] block">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs focus:outline-none focus:border-[#0288D1]"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            {/* Location / Telehealth */}
            <div className="space-y-2 pt-1 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#0F172A]">Consultation Medium</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isOnline
                        ? 'bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]'
                        : 'bg-[#F8FAFC] text-[#64748B]'
                    }`}
                  >
                    Video / Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      !isOnline
                        ? 'bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]'
                        : 'bg-[#F8FAFC] text-[#64748B]'
                    }`}
                  >
                    In-Person Clinic
                  </button>
                </div>
              </div>

              {isOnline ? (
                <div className="space-y-1">
                  <label className="text-[11px] text-[#64748B]">Telehealth Meeting Link</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.biopulse.ai/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] text-[#64748B]">Clinic Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Clinic or Hospital address"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
                  />
                </div>
              )}
            </div>

            {/* Reason for Visit */}
            <div className="space-y-1">
              <label className="font-bold text-[#0F172A] block">Reason for Visit</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What would you like to address during this visit?"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs resize-none focus:outline-none focus:border-[#0288D1]"
              />
            </div>

            {/* Patient Private Notes */}
            <div className="space-y-1">
              <label className="font-bold text-[#0F172A] block">Personal Notes (Optional)</label>
              <input
                type="text"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Reminders for yourself (e.g. bring previous lab reports)"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0288D1]"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isSubmitting ? 'Booking...' : 'Confirm Appointment'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
