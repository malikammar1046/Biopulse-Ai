import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityHeart, Plus, RefreshCw01 } from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { TodayCheckInCard } from '../../components/symptoms/TodayCheckInCard';
import { SymptomPatternSection } from '../../components/symptoms/SymptomPatternSection';
import { SymptomCycleTimeline } from '../../components/symptoms/SymptomCycleTimeline';
import { SymptomRecentList } from '../../components/symptoms/SymptomRecentList';
import { SymptomLogModal } from '../../components/symptoms/SymptomLogModal';
import { DeleteSymptomConfirmationModal } from '../../components/symptoms/DeleteSymptomConfirmationModal';
import type {
  SymptomRecord,
  SymptomRecordInput,
  SymptomDefinition,
} from '../../types/symptom';

export const SymptomsPage: React.FC = () => {
  const {
    userProfile,
    symptomRecords,
    symptomStats,
    symptomsLoading,
    cycleRecords,
    cycleStats,
    logSymptom,
    updateSymptom,
    deleteSymptom,
    refreshSymptomRecords,
  } = useUserHealth();

  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SymptomRecord | null>(null);
  const [preselectedSymptom, setPreselectedSymptom] = useState<SymptomDefinition | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<SymptomRecord | null>(null);

  const handleOpenGeneralModal = () => {
    setEditingRecord(null);
    setPreselectedSymptom(null);
    setIsLogModalOpen(true);
  };

  const handleSelectQuickSymptom = (symptom: SymptomDefinition) => {
    setEditingRecord(null);
    setPreselectedSymptom(symptom);
    setIsLogModalOpen(true);
  };

  const handleOpenEditModal = (record: SymptomRecord) => {
    setPreselectedSymptom(null);
    setEditingRecord(record);
    setIsLogModalOpen(true);
  };

  const handleOpenDeleteModal = (record: SymptomRecord) => {
    setDeletingRecord(record);
  };

  const handleSaveSymptom = async (input: SymptomRecordInput) => {
    if (editingRecord) {
      return await updateSymptom(editingRecord.id, input);
    }
    return await logSymptom(input);
  };

  const handleConfirmDelete = async () => {
    if (deletingRecord) {
      await deleteSymptom(deletingRecord.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-6 sm:space-y-8 text-left select-none pb-16"
    >
      {/* ── 1. Page Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ActivityHeart className={`w-6 h-6 shrink-0 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
              Symptoms & Body Journal
            </h1>
          </div>
          <p className="text-xs text-[#64748B]">
            Track how your body feels, connect symptoms to your clinical rhythm, and uncover patterns over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshSymptomRecords()}
            className={`h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-[#EAECF0] text-[#64748B] transition-colors cursor-pointer ${
              isMale ? 'hover:text-[#0288D1] hover:bg-[#F8FAFC]' : 'hover:text-[#F43F7D] hover:bg-[#FDE6EF]/30'
            }`}
            title="Refresh symptom logs"
          >
            <RefreshCw01 className={`w-4 h-4 shrink-0 ${symptomsLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleOpenGeneralModal}
            className={`h-10 px-4 rounded-xl font-medium text-sm text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
              isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#DC326C]'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Log a Symptom</span>
          </button>
        </div>
      </div>

      {/* ── 2. Today's Hero Check-In Card ── */}
      <TodayCheckInCard
        onSelectSymptom={handleSelectQuickSymptom}
        onOpenGeneralModal={handleOpenGeneralModal}
        loggedTodayCount={symptomStats.loggedTodayCount}
        isMale={isMale}
      />

      {/* ── 3. Pattern Observations Section ── */}
      <SymptomPatternSection
        observations={symptomStats.patternObservations}
        totalLoggedCount={symptomStats.totalLoggedCount}
        isMale={isMale}
      />

      {/* ── 4. Cycle Day Scatter Timeline (Female Pathway Only) ── */}
      {!isMale && (
        <SymptomCycleTimeline
          records={symptomRecords}
          cycleLength={cycleStats.totalCycleDays || 28}
        />
      )}

      {/* ── 5. Chronological Recent Logs List ── */}
      <SymptomRecentList
        records={symptomRecords}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        onOpenLogModal={handleOpenGeneralModal}
        isMale={isMale}
      />

      {/* ── 6. Modals ── */}
      <SymptomLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveSymptom}
        initialData={editingRecord}
        preselectedSymptom={preselectedSymptom}
        cycleRecords={cycleRecords}
        isMale={isMale}
      />

      <DeleteSymptomConfirmationModal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        symptom={deletingRecord}
      />
    </motion.div>
  );
};

export default SymptomsPage;
