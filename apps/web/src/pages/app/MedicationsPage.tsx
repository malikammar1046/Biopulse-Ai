import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserHealth } from '../../context/UserHealthContext';
import type { MedicationItem, MedicationInput, ScheduledDoseItem } from '../../types/medication';
import { PersonalizedMedicationsHeader } from '../../components/medications/PersonalizedMedicationsHeader';
import { TodayDosesList } from '../../components/medications/TodayDosesList';
import { WeeklyAdherenceWidget } from '../../components/medications/WeeklyAdherenceWidget';
import { ActivePrescriptionsList } from '../../components/medications/ActivePrescriptionsList';
import { MedicationModal } from '../../components/medications/MedicationModal';

export const MedicationsPage: React.FC = () => {
  const {
    userProfile,
    medications,
    todayMedicationProgress,
    weeklyMedicationStats,
    addMedication,
    updateMedication,
    deleteMedication,
    logMedicationDose,
    deleteMedicationDose,
    openAiChatWithPrompt,
  } = useUserHealth();

  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationItem | null>(null);

  const handleOpenAddModal = () => {
    setEditingMedication(null);
    setIsModalOpen(true);
  };

  const handleEditMedication = (med: MedicationItem) => {
    setEditingMedication(med);
    setIsModalOpen(true);
  };

  const handleSaveMedication = async (input: MedicationInput) => {
    if (editingMedication) {
      return await updateMedication(editingMedication.id, input);
    }
    return await addMedication(input);
  };

  const handleToggleActive = async (med: MedicationItem) => {
    await updateMedication(med.id, { isActive: !med.isActive });
  };

  const handleMarkTaken = async (dose: ScheduledDoseItem) => {
    const today = new Date().toISOString().split('T')[0];
    await logMedicationDose({
      medicationId: dose.medicationId,
      scheduledFor: today,
      scheduledTime: dose.scheduledTime,
      status: 'taken',
      takenAt: new Date().toISOString(),
    });
  };

  const handleMarkSkipped = async (dose: ScheduledDoseItem) => {
    const today = new Date().toISOString().split('T')[0];
    await logMedicationDose({
      medicationId: dose.medicationId,
      scheduledFor: today,
      scheduledTime: dose.scheduledTime,
      status: 'skipped',
      notes: 'Skipped by patient',
    });
  };

  const handleResetDose = async (dose: ScheduledDoseItem) => {
    const today = new Date().toISOString().split('T')[0];
    await deleteMedicationDose(dose.medicationId, today, dose.scheduledTime);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-16"
    >
      {/* ── 1. PERSONALIZED HEADER & PROGRESS ── */}
      <PersonalizedMedicationsHeader
        todayProgress={todayMedicationProgress}
        weeklyStats={weeklyMedicationStats}
        onOpenAddModal={handleOpenAddModal}
        isMale={isMale}
        onAskAi={() =>
          openAiChatWithPrompt(
            isMale
              ? 'How do consistent daily micronutrients, zinc, and vitamin D support metabolic health and energy regulation?'
              : 'How do my daily supplements and prescribed medications support steady glucose and endocrine balance?'
          )
        }
      />

      {/* ── 2. TODAY'S SCHEDULED DOSES ── */}
      <TodayDosesList
        doses={todayMedicationProgress.doses}
        onMarkTaken={handleMarkTaken}
        onMarkSkipped={handleMarkSkipped}
        onResetDose={handleResetDose}
        onOpenAddModal={handleOpenAddModal}
        isMale={isMale}
      />

      {/* ── 3. WEEKLY ADHERENCE & ACTIVE PRESCRIPTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <WeeklyAdherenceWidget stats={weeklyMedicationStats} isMale={isMale} />
        </div>

        <div className="lg:col-span-7">
          <ActivePrescriptionsList
            medications={medications}
            onOpenAddModal={handleOpenAddModal}
            onEditMedication={handleEditMedication}
            onToggleActive={handleToggleActive}
            onDeleteMedication={deleteMedication}
            isMale={isMale}
          />
        </div>
      </div>

      {/* ── 4. ADD / EDIT MEDICATION MODAL ── */}
      <MedicationModal
        isOpen={isModalOpen}
        editingMedication={editingMedication}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMedication}
        isMale={isMale}
      />
    </motion.div>
  );
};

export default MedicationsPage;
