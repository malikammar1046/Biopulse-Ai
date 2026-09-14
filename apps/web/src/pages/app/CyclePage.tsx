import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { CycleOverviewCard } from '../../components/cycle/CycleOverviewCard';
import { CycleTimelineVisualizer } from '../../components/cycle/CycleTimelineVisualizer';
import { CycleHistorySection } from '../../components/cycle/CycleHistorySection';
import { CycleEmptyState } from '../../components/cycle/CycleEmptyState';
import { PeriodLogModal } from '../../components/cycle/PeriodLogModal';
import { DeleteCycleConfirmationModal } from '../../components/cycle/DeleteCycleConfirmationModal';
import type { CycleRecord, CycleRecordInput, CycleHistoryItem } from '../../types/cycle';

export const CyclePage: React.FC = () => {
  const {
    cycleRecords,
    cycleStats,
    cycleLoading,
    logPeriod,
    updatePeriod,
    deletePeriod,
    refreshCycleRecords,
  } = useUserHealth();

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CycleRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<CycleHistoryItem | null>(null);

  const handleOpenLogModal = () => {
    setEditingRecord(null);
    setIsLogModalOpen(true);
  };

  const handleOpenEditModal = (historyItem: CycleHistoryItem) => {
    const originalRecord = cycleRecords.find((r) => r.id === historyItem.id) || {
      id: historyItem.id,
      userId: '',
      periodStartDate: historyItem.rawStartDate,
      periodEndDate: historyItem.rawEndDate,
      flow: historyItem.flow,
      symptoms: historyItem.symptoms,
      notes: historyItem.notes,
    };
    setEditingRecord(originalRecord);
    setIsLogModalOpen(true);
  };

  const handleOpenDeleteModal = (historyItem: CycleHistoryItem) => {
    setDeletingItem(historyItem);
  };

  const handleSavePeriod = async (input: CycleRecordInput) => {
    if (editingRecord) {
      return await updatePeriod(editingRecord.id, input);
    }
    return await logPeriod(input);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deletePeriod(deletingItem.id);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BAE6FD]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
              Your Cycle & Period Tracker
            </h1>
          </div>
          <p className="text-xs text-[#64748B]">
            Track your period dates, see your estimated cycle phases, and understand your natural rhythm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshCycleRecords()}
            className="p-2.5 rounded-xl bg-white border border-[#BAE6FD] text-[#475569] hover:text-[#0288D1] hover:bg-[#F0F9FF] transition-colors cursor-pointer"
            title="Refresh cycle records"
          >
            <RefreshCw className={`w-4 h-4 ${cycleLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenLogModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans font-semibold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Period</span>
          </button>
        </div>
      </div>

      {/* ── 2. Loading State ── */}
      {cycleLoading && cycleRecords.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#BAE6FD] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#0288D1] animate-spin" />
          <span className="text-xs font-mono text-[#64748B]">Loading your cycle records...</span>
        </div>
      ) : !cycleStats.hasData ? (
        /* ── 3. Empty State for Brand New Users ── */
        <div className="space-y-6">
          <CycleEmptyState onLogPeriod={handleOpenLogModal} />
        </div>
      ) : (
        /* ── 4. Comprehensive Active Cycle Dashboard ── */
        <div className="space-y-6 sm:space-y-8">
          {/* Top 4 Summary Cards */}
          <CycleOverviewCard stats={cycleStats} />

          {/* Interactive Visual Timeline & Phase Legend */}
          <CycleTimelineVisualizer stats={cycleStats} />

          {/* Chronological Cycle History Log */}
          <CycleHistorySection
            stats={cycleStats}
            onLogPeriod={handleOpenLogModal}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
        </div>
      )}

      {/* ── 5. Responsible Clinical Boundary Notice ── */}
      <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-center max-w-3xl mx-auto text-xs text-[#0369A1] space-y-1">
        <p className="font-semibold text-[#01579B]">
          Responsible Health & Non-Diagnostic Framing
        </p>
        <p>
          BioPulse AI cycle projections, estimated phases, and fertile windows are calculated from your self-reported dates and historical rhythm. They are informational estimations and do not constitute diagnostic ovulation detection or medical birth control.
        </p>
      </div>

      {/* ── 6. Modals ── */}
      <PeriodLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSavePeriod}
        initialData={editingRecord}
        existingRecords={cycleRecords}
      />

      <DeleteCycleConfirmationModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        item={deletingItem}
      />
    </motion.div>
  );
};

export default CyclePage;
