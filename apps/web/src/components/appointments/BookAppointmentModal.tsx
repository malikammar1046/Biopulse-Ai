import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, Plus } from 'lucide-react';
import type { CareCircleMember } from '../../types/careCircle';
import type { AppointmentInput, AppointmentType } from '../../types/appointment';

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
  { type: 'routine_check', label: 'Routine PCOS Check-Up' },
  { type: 'other', label: 'Other Healthcare Visit' },
];

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  careCircleMembers,
  onClose,
  onBook,
}) => {
  const doctors = careCircleMembers.filter((m) => m.role === 'doctor' && m.status === 'active');
  const defaultDoctor = doctors[0]?.name || 'Dr. Sarah Malik';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [providerName, setProviderName] = useState(defaultDoctor);
  const [providerSpecialty, setProviderSpecialty] = useState('Specialist Gynecologist & PCOS Consultant');
  const [selectedCareCircleId, setSelectedCareCircleId] = useState(doctors[0]?.id || '');
  const [title, setTitle] = useState('Clinical Consultation & Review');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [scheduledDate, setScheduledDate] = useState(tomorrowStr);
  const [scheduledTime, setScheduledTime] = useState('15:30');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState('Lahore Women’s Health Clinic & Online Telehealth');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.ovasense.health/consultation');
  const [reason, setReason] = useState('Discussion of symptom pattern, inositol protocol, and cycle regularity.');
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
        setProviderSpecialty(doc.relationship || 'Specialist Gynecologist');
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
          className="fixed inset-0 bg-[#1C1326]/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl overflow-hidden z-10 my-8 text-left select-none"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#F0EAF5] bg-gradient-to-r from-[#FAF5FF] via-white to-[#FDF2F8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-[#1C1326]">
                  Book an Appointment
                </h2>
                <p className="text-xs text-[#584B68]">
                  Schedule your consultation and link it with your Care Circle
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#1C1326] block">
                Healthcare Provider
              </label>
              {doctors.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedCareCircleId || (providerName === defaultDoctor ? doctors[0].id : 'custom')}
                    onChange={handleProviderSelect}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFEF] bg-white text-xs text-[#1C1326] focus:ring-2 focus:ring-[#8E3EAF]/30 focus:border-[#8E3EAF]"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] text-xs text-[#1C1326]"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Malik"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFEF] text-xs text-[#1C1326] focus:ring-2 focus:ring-[#8E3EAF]/30 focus:border-[#8E3EAF]"
                />
              )}
            </div>

            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#1C1326] block">Visit Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Comprehensive PCOS Review"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1C1326] block">Appointment Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] bg-white text-xs"
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
                <label className="font-bold text-[#1C1326] block">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DFEF] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1C1326] block">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DFEF] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1C1326] block">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7DFEF] bg-white text-xs"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            {/* Location / Telehealth */}
            <div className="space-y-2 pt-1 border-t border-[#F0EAF5]">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1C1326]">Consultation Medium</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isOnline
                        ? 'bg-[#EDE4F7] text-[#6E2D8B]'
                        : 'bg-[#F8F5FA] text-[#8D7E9E]'
                    }`}
                  >
                    Video / Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      !isOnline
                        ? 'bg-[#EDE4F7] text-[#6E2D8B]'
                        : 'bg-[#F8F5FA] text-[#8D7E9E]'
                    }`}
                  >
                    In-Person Clinic
                  </button>
                </div>
              </div>

              {isOnline ? (
                <div className="space-y-1">
                  <label className="text-[11px] text-[#584B68]">Telehealth Meeting Link</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.ovasense.health/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] text-[#584B68]">Clinic Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Clinic or Hospital address"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] text-xs"
                  />
                </div>
              )}
            </div>

            {/* Reason for Visit */}
            <div className="space-y-1">
              <label className="font-bold text-[#1C1326] block">Reason for Visit</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What would you like to address during this visit?"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] text-xs resize-none"
              />
            </div>

            {/* Patient Private Notes */}
            <div className="space-y-1">
              <label className="font-bold text-[#1C1326] block">Personal Notes (Optional)</label>
              <input
                type="text"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Reminders for yourself (e.g. bring previous lab reports)"
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DFEF] text-xs"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#F0EAF5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E7DFEF] text-[#584B68] font-bold hover:bg-[#F8F5FA] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white font-bold shadow-xs hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Booking...' : 'Confirm Appointment'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
