import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserHealth } from '../../context/UserHealthContext';
import type { SuggestedMovementRoutine, FitnessLogEntry, FitnessLogInput, ActivityType } from '../../types/fitness';
import { PersonalizedFitnessHeader } from '../../components/fitness/PersonalizedFitnessHeader';
import { SuggestedRoutinesSection } from '../../components/fitness/SuggestedRoutinesSection';
import { WeeklyMovementWidget } from '../../components/fitness/WeeklyMovementWidget';
import { RecentActivitiesList } from '../../components/fitness/RecentActivitiesList';
import { ActivityLogModal } from '../../components/fitness/ActivityLogModal';

export const FitnessPage: React.FC = () => {
  const {
    userProfile,
    snapshotMetrics,
    fitnessLogs,
    todayFitnessMinutes,
    weeklyFitnessStats,
    suggestedFitnessRoutines,
    logFitnessActivity,
    updateFitnessActivity,
    deleteFitnessActivity,
    openAiChatWithPrompt,
  } = useUserHealth();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FitnessLogEntry | null>(null);
  const [initialActivityName, setInitialActivityName] = useState<string>('');
  const [initialActivityType, setInitialActivityType] = useState<ActivityType>('walking');
  const [initialDuration, setInitialDuration] = useState<number>(20);

  const handleOpenNewLog = () => {
    setEditingEntry(null);
    setInitialActivityName('');
    setInitialActivityType('walking');
    setInitialDuration(20);
    setIsLogModalOpen(true);
  };

  const handleQuickCompleteRoutine = (routine: SuggestedMovementRoutine) => {
    setEditingEntry(null);
    setInitialActivityName(routine.title);
    setInitialActivityType(routine.category);
    setInitialDuration(routine.durationMinutes);
    setIsLogModalOpen(true);
  };

  const handleEditActivity = (entry: FitnessLogEntry) => {
    setEditingEntry(entry);
    setIsLogModalOpen(true);
  };

  const handleSaveActivity = async (input: FitnessLogInput) => {
    if (editingEntry) {
      return await updateFitnessActivity(editingEntry.id, input);
    }
    return await logFitnessActivity(input);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-16"
    >
      {/* ── 1. PERSONALIZED HEADER ── */}
      <PersonalizedFitnessHeader
        userProfile={userProfile}
        cycleDay={snapshotMetrics.cycleDay}
        cyclePhaseName={snapshotMetrics.phaseName}
        todayMinutes={todayFitnessMinutes}
        weeklyTotalMinutes={weeklyFitnessStats.totalMinutesThisWeek}
        onOpenLogModal={handleOpenNewLog}
        onAskAi={() =>
          openAiChatWithPrompt(
            `What gentle movement routines are best for my ${snapshotMetrics.phaseName} and daily energy level today?`
          )
        }
      />

      {/* ── 2. SUGGESTED PHASE ROUTINES ── */}
      <SuggestedRoutinesSection
        phaseName={snapshotMetrics.phaseName}
        routines={suggestedFitnessRoutines}
        onQuickComplete={handleQuickCompleteRoutine}
      />

      {/* ── 3. WEEKLY MOVEMENT SUMMARY & RECENT LOGS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <WeeklyMovementWidget
            stats={weeklyFitnessStats}
            todayMinutes={todayFitnessMinutes}
          />
        </div>

        <div className="lg:col-span-7">
          <RecentActivitiesList
            logs={fitnessLogs}
            onOpenLogModal={handleOpenNewLog}
            onEditActivity={handleEditActivity}
            onDeleteActivity={deleteFitnessActivity}
          />
        </div>
      </div>

      {/* ── 4. ACTIVITY LOG & EDIT MODAL ── */}
      <ActivityLogModal
        isOpen={isLogModalOpen}
        editingEntry={editingEntry}
        initialActivityName={initialActivityName}
        initialActivityType={initialActivityType}
        initialDurationMinutes={initialDuration}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveActivity}
      />
    </motion.div>
  );
};

export default FitnessPage;
