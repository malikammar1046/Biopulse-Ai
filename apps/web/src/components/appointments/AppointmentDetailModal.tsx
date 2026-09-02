import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Video,
  Stethoscope,
  FileText,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { AppointmentItem } from '../../types/appointment';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  appointment: AppointmentItem | null;
  onClose: () => void;
  onPrepare: (appointment: AppointmentItem) => void;
  onCancel: (id: string, reason?: string) => Promise<any>;
  onComplete: (id: string, notes?: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onReschedule: (id: string, newDate: string, newTime: string) => Promise<any>;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onPrepare,
  onCancel,
  onComplete,
  onDelete,
  onReschedule,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('15:30');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setIsSubmitting(true);
    try {
      await onReschedule(appointment.id, rescheduleDate, rescheduleTime);
      setIsRescheduling(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCancel(appointment.id, cancelReason);
      setIsCancelling(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteClick = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(appointment.id, 'Completed clinical consultation.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Are you sure you want to delete this appointment record?')) {
      setIsSubmitting(true);
      try {
        await onDelete(appointment.id);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
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
          className="relative w-full max-w-lg rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl overflow-hidden z-10 my-8 text-left select-none"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#F0EAF5] bg-gradient-to-r from-[#FAF5FF] via-white to-[#FDF2F8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#8E3EAF]">
                  {appointment.appointmentType.replace('_', ' ')}
                </span>
                <h2 className="text-lg font-bold font-display text-[#1C1326]">
                  {appointment.title}
                </h2>
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

          {/* Body */}
          <div className="p-6 space-y-4 text-xs">
            {/* Status & Provider Banner */}
            <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#8D7E9E] uppercase font-bold block">
                  Healthcare Professional
                </span>
                <span className="text-sm font-bold text-[#1C1326] block">{appointment.providerName}</span>
                <span className="text-[11px] text-[#584B68] block">{appointment.providerSpecialty}</span>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold capitalize ${
                  appointment.status === 'scheduled'
                    ? 'bg-[#ECFDF5] text-[#047857]'
                    : appointment.status === 'completed'
                    ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'bg-[#FEF2F2] text-[#B91C1C]'
                }`}
              >
                {appointment.status}
              </span>
            </div>

            {/* Time & Medium */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-[#E7DFEF] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date & Time</span>
                </div>
                <p className="font-bold text-[#1C1326]">{appointment.scheduledDate}</p>
                <p className="text-[11px] text-[#584B68]">{appointment.scheduledTime} ({appointment.durationMinutes} mins)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E7DFEF] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E3EAF]">
                  {appointment.meetingUrl ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  <span>Location</span>
                </div>
                <p className="font-bold text-[#1C1326] truncate">{appointment.location}</p>
                {appointment.meetingUrl && (
                  <a
                    href={appointment.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#047857] hover:underline font-bold block truncate"
                  >
                    Open Telehealth Link →
                  </a>
                )}
              </div>
            </div>

            {/* Reason & Notes */}
            {appointment.reason && (
              <div className="space-y-1">
                <span className="font-bold text-[#1C1326] block">Reason for Visit</span>
                <p className="p-3 rounded-xl bg-[#FAF5FF] border border-[#EDE4F7] text-[#584B68]">
                  {appointment.reason}
                </p>
              </div>
            )}

            {appointment.patientNotes && (
              <div className="space-y-1">
                <span className="font-bold text-[#1C1326] block">Patient Notes</span>
                <p className="p-3 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68]">
                  {appointment.patientNotes}
                </p>
              </div>
            )}

            {/* Reschedule View */}
            {isRescheduling && (
              <form onSubmit={handleRescheduleSubmit} className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] space-y-3">
                <span className="font-bold text-[#B45309] block">Reschedule Appointment</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="px-3 py-1.5 rounded-lg border border-[#FDE68A] bg-white text-xs"
                  />
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                    className="px-3 py-1.5 rounded-lg border border-[#FDE68A] bg-white text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-[#78350F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rescheduleDate}
                    className="px-4 py-1 rounded-lg bg-[#B45309] text-white text-xs font-bold"
                  >
                    Save New Date
                  </button>
                </div>
              </form>
            )}

            {/* Cancel Form View */}
            {isCancelling && (
              <form onSubmit={handleCancelSubmit} className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-3">
                <span className="font-bold text-[#B91C1C] block">Cancel Appointment</span>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (optional)"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#FCA5A5] bg-white text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelling(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-[#7F1D1D]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1 rounded-lg bg-[#B91C1C] text-white text-xs font-bold"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#F0EAF5] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {appointment.status === 'scheduled' && !isRescheduling && !isCancelling && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleDate(appointment.scheduledDate);
                        setRescheduleTime(appointment.scheduledTime);
                        setIsRescheduling(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#E7DFEF] text-[#6E2D8B] font-bold hover:bg-[#F8F5FA] transition-colors cursor-pointer"
                    >
                      Reschedule
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCancelling(true)}
                      className="px-3 py-1.5 rounded-xl border border-[#FECACA] text-[#B91C1C] font-bold hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      Cancel Visit
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {appointment.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={handleCompleteClick}
                    disabled={isSubmitting}
                    className="px-3 py-2 rounded-xl border border-[#DCFCE7] text-[#15803D] font-bold hover:bg-[#F0FDF4] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrepare(appointment);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white font-bold shadow-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Prepare Brief</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
