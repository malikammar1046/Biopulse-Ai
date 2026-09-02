import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserHealth } from '../../context/UserHealthContext';
import type { AppointmentItem } from '../../types/appointment';
import { PersonalizedAppointmentsHeader } from '../../components/appointments/PersonalizedAppointmentsHeader';
import { UpcomingAppointmentCard } from '../../components/appointments/UpcomingAppointmentCard';
import { AppointmentHistoryList } from '../../components/appointments/AppointmentHistoryList';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { AppointmentDetailModal } from '../../components/appointments/AppointmentDetailModal';
import { PreConsultationPrepModal } from '../../components/appointments/PreConsultationPrepModal';

export const AppointmentsPage: React.FC = () => {
  const {
    appointments,
    upcomingAppointment,
    careCircleMembers,
    bookAppointment,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    deleteAppointment,
    addDoctorQuestion,
    toggleDoctorQuestion,
    deleteDoctorQuestion,
    getPreConsultationSnapshot,
    getConsultationBrief,
    openAiChatWithPrompt,
  } = useUserHealth();

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [prepAppointment, setPrepAppointment] = useState<AppointmentItem | null>(null);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);

  const handleOpenBookModal = () => {
    setIsBookModalOpen(true);
  };

  const handlePrepare = (appointment: AppointmentItem) => {
    setPrepAppointment(appointment);
    setIsPrepModalOpen(true);
  };

  const handleViewDetails = (appointment: AppointmentItem) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleReschedule = async (id: string, newDate: string, newTime: string) => {
    return await updateAppointment(id, {
      scheduledDate: newDate,
      scheduledTime: newTime,
      status: 'rescheduled',
    });
  };

  const snapshot = getPreConsultationSnapshot();
  const brief = prepAppointment ? getConsultationBrief(prepAppointment) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-16"
    >
      {/* ── 1. PERSONALIZED HEADER ── */}
      <PersonalizedAppointmentsHeader
        upcomingAppointment={upcomingAppointment}
        totalAppointmentsCount={appointments.length}
        onOpenBookModal={handleOpenBookModal}
        onAskAi={() =>
          openAiChatWithPrompt(
            'What are the key clinical questions and hormone metrics I should discuss with my gynecologist at my next PCOS appointment?'
          )
        }
      />

      {/* ── 2. FEATURED UPCOMING APPOINTMENT ── */}
      <UpcomingAppointmentCard
        appointment={upcomingAppointment}
        onPrepare={handlePrepare}
        onViewDetails={handleViewDetails}
        onBookNew={handleOpenBookModal}
      />

      {/* ── 3. APPOINTMENT HISTORY & LOGS ── */}
      <AppointmentHistoryList
        appointments={appointments}
        onPrepare={handlePrepare}
        onViewDetails={handleViewDetails}
      />

      {/* ── 4. BOOK APPOINTMENT MODAL ── */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        careCircleMembers={careCircleMembers}
        onClose={() => setIsBookModalOpen(false)}
        onBook={bookAppointment}
      />

      {/* ── 5. APPOINTMENT DETAIL / ACTIONS MODAL ── */}
      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        appointment={selectedAppointment}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
        onPrepare={handlePrepare}
        onCancel={cancelAppointment}
        onComplete={completeAppointment}
        onDelete={deleteAppointment}
        onReschedule={handleReschedule}
      />

      {/* ── 6. PRE-CONSULTATION PREPARATION & BRIEF MODAL ── */}
      <PreConsultationPrepModal
        isOpen={isPrepModalOpen}
        appointment={prepAppointment}
        snapshot={snapshot}
        brief={brief}
        onClose={() => {
          setIsPrepModalOpen(false);
          setPrepAppointment(null);
        }}
        onAddQuestion={addDoctorQuestion}
        onToggleQuestion={toggleDoctorQuestion}
        onDeleteQuestion={deleteDoctorQuestion}
      />
    </motion.div>
  );
};

export default AppointmentsPage;
