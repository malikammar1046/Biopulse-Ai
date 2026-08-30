import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Plus, RefreshCw } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFEF]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#FDF2F8] text-[#FB7185]">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
              Symptoms & Body Journal
            </h1>
          </div>
          <p className="text-xs text-[#584B68]">
            Track how your body feels, connect symptoms to your cycle rhythm, and uncover patterns over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshSymptomRecords()}
            className="p-2.5 rounded-2xl bg-white border border-[#E7DFEF] text-[#584B68] hover:text-[#6E2D8B] hover:bg-[#F8F5FA] transition-colors cursor-pointer"
            title="Refresh symptom logs"
          >
            <RefreshCw className={`w-4 h-4 ${symptomsLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenGeneralModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md shadow-purple-950/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log a Symptom</span>
          </button>
        </div>
      </div>

      {/* ── 2. Today's Hero Check-In Card ── */}
      <TodayCheckInCard
        onSelectSymptom={handleSelectQuickSymptom}
        onOpenGeneralModal={handleOpenGeneralModal}
        loggedTodayCount={symptomStats.loggedTodayCount}
      />

      {/* ── 3. Pattern Observations Section ── */}
      <SymptomPatternSection
        observations={symptomStats.patternObservations}
        totalLoggedCount={symptomStats.totalLoggedCount}
      />

      {/* ── 4. Cycle Day Scatter Timeline ── */}
      <SymptomCycleTimeline
        records={symptomRecords}
        cycleLength={cycleStats.totalCycleDays || 28}
      />

      {/* ── 5. Chronological Recent Logs List ── */}
      <SymptomRecentList
        records={symptomRecords}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        onOpenLogModal={handleOpenGeneralModal}
      />

      {/* ── 6. Modals ── */}
      <SymptomLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveSymptom}
        initialData={editingRecord}
        preselectedSymptom={preselectedSymptom}
        cycleRecords={cycleRecords}
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
