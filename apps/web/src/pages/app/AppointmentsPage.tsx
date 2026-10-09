import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  MedicalCircle,
  Clock,
  ArrowRight,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';
import type { AppointmentItem } from '../../types/appointment';
import type { Doctor } from '../../types/doctor';
import { PersonalizedAppointmentsHeader } from '../../components/appointments/PersonalizedAppointmentsHeader';
import { UpcomingAppointmentCard } from '../../components/appointments/UpcomingAppointmentCard';
import { AppointmentHistoryList } from '../../components/appointments/AppointmentHistoryList';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { AppointmentDetailModal } from '../../components/appointments/AppointmentDetailModal';
import { PreConsultationPrepModal } from '../../components/appointments/PreConsultationPrepModal';
import { SpecialistDirectory } from '../../components/doctors/SpecialistDirectory';
import { useDoctors } from '../../services/doctorService';

type TabKey = 'upcoming' | 'specialists' | 'history';

export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    userProfile,
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

  const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
  const isFemale = pathway === 'female';
  const isMale = pathway === 'male';

  // Load canonical doctors for booking-intent / deep-link resolution
  const { doctors: canonicalDoctors } = useDoctors({
    pathway: isMale ? 'male_hypogonadism' : 'female_pcos',
  });

  // URL-aware Tabs: /app/appointments?tab=upcoming | specialists | history
  const rawTab = searchParams.get('tab');
  const validTabs: TabKey[] = ['upcoming', 'specialists', 'history'];

  const activeTab: TabKey = validTabs.includes(rawTab as TabKey)
    ? (rawTab as TabKey)
    : upcomingAppointment
    ? 'upcoming'
    : 'upcoming';

  const handleTabChange = (newTab: TabKey) => {
    setSearchParams({ tab: newTab });
  };

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [prepAppointment, setPrepAppointment] = useState<AppointmentItem | null>(null);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);

  // Restore deep-link booking intent (?doctorId=...)
  useEffect(() => {
    const targetDocId = searchParams.get('doctorId');
    if (targetDocId && canonicalDoctors.length > 0) {
      const match = canonicalDoctors.find((d) => String(d.id) === targetDocId);
      if (match) {
        setBookingDoctor(match);
        setIsBookModalOpen(true);
      }
    }
  }, [searchParams, canonicalDoctors]);

  const handleOpenBookModal = (doctor?: Doctor) => {
    if (doctor) {
      setBookingDoctor(doctor);
    } else {
      setBookingDoctor(null);
    }
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

  // Theme styling tokens
  const accentColor = isFemale ? '#F43F7D' : '#0288D1';
  const softBg = isFemale ? '#FDE6EF' : '#E1F5FE';
  const badgeText = isFemale ? 'text-[#BE185D]' : 'text-[#0288D1]';

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
        onOpenBookModal={() => handleOpenBookModal()}
        onAskAi={() =>
          openAiChatWithPrompt(
            isMale
              ? 'What are the key clinical questions and hormone metrics I should discuss with my endocrinologist or urologist regarding male hormonal health?'
              : 'What are the key clinical questions and hormone metrics I should discuss with my gynecologist at my next PCOS appointment?'
          )
        }
      />

      {/* ── 2. SEGMENTED CARE TABS ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EAECF0] p-1.5 shadow-xs flex items-center justify-between sm:justify-start gap-1 overflow-x-auto">
        {/* Tab 1: Upcoming Visits */}
        <button
          type="button"
          onClick={() => handleTabChange('upcoming')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'bg-[#111318] text-white shadow-2xs'
              : 'text-[#475569] hover:text-[#111318] hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Upcoming Visits</span>
          {upcomingAppointment && (
            <span
              className={`w-2 h-2 rounded-full ${
                activeTab === 'upcoming' ? 'bg-[#22C55E]' : isFemale ? 'bg-[#F43F7D]' : 'bg-[#0288D1]'
              }`}
            />
          )}
        </button>

        {/* Tab 2: Find a Specialist */}
        <button
          type="button"
          onClick={() => handleTabChange('specialists')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'specialists'
              ? 'bg-[#111318] text-white shadow-2xs'
              : 'text-[#475569] hover:text-[#111318] hover:bg-slate-50'
          }`}
        >
          <MedicalCircle className="w-4 h-4" aria-hidden="true" />
          <span>Find a Specialist</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              activeTab === 'specialists'
                ? 'bg-slate-800 text-slate-200'
                : `${softBg} ${badgeText}`
            }`}
          >
            {isFemale ? 'PCOS' : 'Hormones'}
          </span>
        </button>

        {/* Tab 3: Past History */}
        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#111318] text-white shadow-2xs'
              : 'text-[#475569] hover:text-[#111318] hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" aria-hidden="true" />
          <span>Past History</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-[#475569]">
            {appointments.length}
          </span>
        </button>
      </div>

      {/* ── 3. TAB CONTENT VIEWS ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Featured Upcoming Appointment Card */}
            <UpcomingAppointmentCard
              appointment={upcomingAppointment}
              onPrepare={handlePrepare}
              onViewDetails={handleViewDetails}
              onBookNew={() => handleOpenBookModal()}
              onFindSpecialists={() => handleTabChange('specialists')}
            />

            {/* Quick Contextual Discovery Teaser if user has an appointment */}
            {upcomingAppointment && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAECF0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: softBg, color: accentColor }}
                  >
                    <MedicalCircle className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111318]">
                      Need a second opinion or complementary care?
                    </h4>
                    <p className="text-xs text-[#667085]">
                      {isFemale
                        ? 'Explore certified gynecologists, endocrinologists, and fertility specialists in the PCOS network.'
                        : 'Explore certified urologists, endocrinologists, and andrology specialists in the male hormone network.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('specialists')}
                  className="px-4 py-2 rounded-xl border border-[#D0D5DD] hover:bg-slate-50 text-xs font-semibold text-[#344054] transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <span>Explore Specialists</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'specialists' && (
          <motion.div
            key="specialists"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <SpecialistDirectory
              pathway={pathway}
              onBookDoctor={(doc) => handleOpenBookModal(doc)}
            />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <AppointmentHistoryList
              appointments={appointments}
              onPrepare={handlePrepare}
              onViewDetails={handleViewDetails}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. BOOK APPOINTMENT MODAL (Supports Preselected Doctor) ── */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        careCircleMembers={careCircleMembers}
        preselectedDoctor={bookingDoctor}
        sourceContext={bookingDoctor ? 'specialist_directory' : 'dashboard_appointments'}
        onClose={() => {
          setIsBookModalOpen(false);
          setBookingDoctor(null);
        }}
        onBook={async (input) => {
          const res = await bookAppointment(input);
          if (res.success) {
            setIsBookModalOpen(false);
            setBookingDoctor(null);
            // Switch to upcoming tab so patient immediately sees newly booked consultation!
            handleTabChange('upcoming');
          }
          return res;
        }}
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
