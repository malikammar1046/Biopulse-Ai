import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Grid01, MessageChatCircle } from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { timelineService } from '../../services/timelineService';
import { HealthProfileSummaryCard } from '../../components/dashboard/HealthProfileSummaryCard';
import { HealthSnapshotCard } from '../../components/dashboard/HealthSnapshotCard';
import { CycleProgressDial } from '../../components/dashboard/CycleProgressDial';
import { MaleHormoneRhythmCard } from '../../components/dashboard/overview/MaleHormoneRhythmCard';
import { DigitalTwinInsightCard } from '../../components/dashboard/DigitalTwinInsightCard';
import { TodayRemindersCard } from '../../components/dashboard/TodayRemindersCard';
import { NutritionSnapshotCard } from '../../components/dashboard/NutritionSnapshotCard';
import { FitnessSnapshotCard } from '../../components/dashboard/FitnessSnapshotCard';
import { RecentReportsCard } from '../../components/dashboard/RecentReportsCard';
import { CareCircleCard } from '../../components/dashboard/CareCircleCard';
import { HealthPatternsChart } from '../../components/dashboard/HealthPatternsChart';
import { WeeklyHealthSummary } from '../../components/dashboard/WeeklyHealthSummary';
import { HealthJourneyTimelineCard } from '../../components/dashboard/HealthJourneyTimelineCard';
import { resolvePathway } from '../../types/onboarding';

export const MasterHealthHub: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    cycleRecords,
    symptomRecords,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
    appointments,
    careCircleMembers,
    snapshotMetrics,
    reminders,
    toggleReminder,
    nutrition,
    fitness,
    reports,
    careCircle,
    digitalTwinInsight,
    openAiChatWithPrompt,
  } = useUserHealth();

  const timelineInputs = useMemo(
    () => ({
      userProfile,
      cycleRecords,
      symptomRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs,
      appointments,
      careCircleMembers,
    }),
    [
      userProfile,
      cycleRecords,
      symptomRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs,
      appointments,
      careCircleMembers,
    ]
  );

  const recentTimelineEvents = useMemo(() => {
    return timelineService.synthesizeTimelineEvents(timelineInputs).slice(0, 4);
  }, [timelineInputs]);

  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isMale = pathway === 'male';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16 text-left select-none"
    >
      {/* ── Actions Toolbar ── */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#EAECF0] shadow-xs">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isMale ? 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0288D1]' : 'bg-[#FDE6EF] border-[#F43F7D]/20 text-[#E11D48]'} border text-xs font-mono font-semibold`}>
            <Grid01 className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-[#E11D48]'} shrink-0`} aria-hidden="true" />
            <span>Master Clinical Hub</span>
          </div>
          <span className="text-xs text-[#64748B] hidden sm:inline">
            Multi-module intelligence snapshot uniting your longitudinal data
          </span>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('Generate a comprehensive health summary across all my logged modules.')}
          className={`px-4 py-2.5 rounded-xl ${isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#E11D48]'} text-white font-sans text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0`}
        >
          <MessageChatCircle className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
          <span>Ask Health Hub AI</span>
        </button>
      </div>

      {/* ── 2. Primary Showcase: BIOPulse AI Screening Assessment ── */}
      <section id="hub-ml-screening-section" aria-label="BIOPulse AI Screening Assessment" className="w-full">
        <DigitalTwinInsightCard
          insight={digitalTwinInsight}
          onOpenChat={openAiChatWithPrompt}
        />
      </section>

      {/* ── 3. User Health Profile Summary & Completion Center ── */}
      <HealthProfileSummaryCard isMale={isMale} />

      {/* ── 4. Top Metric Snapshot Cards (4 Columns) ── */}
      <HealthSnapshotCard
        metrics={snapshotMetrics}
        isMale={isMale}
        onViewSymptoms={() => navigate('/app/symptoms')}
        onViewCycle={isMale ? undefined : () => navigate('/app/cycle')}
      />

      {/* ── 5. Core Health Triad (Cycle Progress or Male Rhythm & Reminders) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle Progress Segmented Ring for Female, Male Hormone Rhythm for Male */}
        {isMale ? (
          <MaleHormoneRhythmCard
            energyLevel={userProfile.mensHealth?.energyLevel || 'moderate'}
            sleepHours={userProfile.lifestyle?.sleepHours || 7.5}
          />
        ) : (
          <CycleProgressDial
            currentDay={snapshotMetrics.cycleDay}
            totalDays={snapshotMetrics.totalCycleDays}
            phaseName={snapshotMetrics.phaseName}
          />
        )}

        {/* Today's Checkable Reminders */}
        <TodayRemindersCard
          reminders={reminders}
          isMale={isMale}
          onToggle={toggleReminder}
          onAddReminder={() => openAiChatWithPrompt('Help me add a new reminder')}
        />
      </div>

      {/* ── 6. Lifestyle & Medical Status Triad (Nutrition, Movement, Lab Reports) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <NutritionSnapshotCard data={nutrition} isMale={isMale} />
        <FitnessSnapshotCard data={fitness} />
        <RecentReportsCard reports={reports} isMale={isMale} />
      </div>

      {/* ── 7. Longitudinal Health Journey & Patterns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HealthJourneyTimelineCard recentEvents={recentTimelineEvents} isMale={isMale} />
        </div>
        <div className="lg:col-span-2">
          <HealthPatternsChart isMale={isMale} />
        </div>
      </div>

      {/* ── 8. Care Circle Clinician Row & Executive Weekly Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CareCircleCard
            contacts={careCircle}
            pathway={pathway}
            onPrepareAppointment={() =>
              openAiChatWithPrompt('Prepare a 1-page health summary for Dr. Sara Malik')
            }
          />
        </div>

        <div className="lg:col-span-2 flex flex-col justify-center">
          <WeeklyHealthSummary pathway={pathway} />
        </div>
      </div>
    </motion.div>
  );
};

export default MasterHealthHub;
