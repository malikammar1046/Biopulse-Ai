import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Sparkles } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { timelineService } from '../../services/timelineService';
import { HealthProfileSummaryCard } from '../../components/dashboard/HealthProfileSummaryCard';
import { HealthSnapshotCard } from '../../components/dashboard/HealthSnapshotCard';
import { CycleProgressDial } from '../../components/dashboard/CycleProgressDial';
import { DigitalTwinInsightCard } from '../../components/dashboard/DigitalTwinInsightCard';
import { TodayRemindersCard } from '../../components/dashboard/TodayRemindersCard';
import { NutritionSnapshotCard } from '../../components/dashboard/NutritionSnapshotCard';
import { FitnessSnapshotCard } from '../../components/dashboard/FitnessSnapshotCard';
import { RecentReportsCard } from '../../components/dashboard/RecentReportsCard';
import { CareCircleCard } from '../../components/dashboard/CareCircleCard';
import { HealthPatternsChart } from '../../components/dashboard/HealthPatternsChart';
import { WeeklyHealthSummary } from '../../components/dashboard/WeeklyHealthSummary';
import { HealthJourneyTimelineCard } from '../../components/dashboard/HealthJourneyTimelineCard';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16 text-left select-none"
    >
      {/* ── Top Header Banner for Master Health Hub ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-[#180A26] via-[#240F38] to-[#12071F] border border-white/10 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6E2D8B]/30 border border-[#8E3EAF]/40 text-xs font-mono text-[#FDA4AF] mb-1">
            <LayoutGrid className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Master Clinical Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Comprehensive Health Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#CDBDD8] font-sans">
            Full multi-module intelligence snapshot uniting your AI Digital Twin, cycle markers, nutrition, medications, and clinical care.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('Generate a comprehensive health summary across all my logged modules.')}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] hover:brightness-110 text-white font-sans text-xs font-bold shadow-lg shadow-purple-950/40 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Ask Health Hub AI</span>
        </button>
      </div>

      {/* ── 2. Primary Showcase: OvaSense PCOS ML Screening Assessment ── */}
      <section id="hub-ml-screening-section" aria-label="OvaSense PCOS ML Screening Assessment" className="w-full">
        <DigitalTwinInsightCard
          insight={digitalTwinInsight}
          onOpenChat={openAiChatWithPrompt}
        />
      </section>

      {/* ── 3. User Health Profile Summary & Completion Center ── */}
      <HealthProfileSummaryCard />

      {/* ── 4. Top Metric Snapshot Cards (4 Columns) ── */}
      <HealthSnapshotCard
        metrics={snapshotMetrics}
        onViewSymptoms={() => navigate('/app/symptoms')}
        onViewCycle={() => navigate('/app/cycle')}
      />

      {/* ── 5. Core Health Triad (Cycle Progress & Reminders) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle Progress Segmented Ring */}
        <CycleProgressDial
          currentDay={snapshotMetrics.cycleDay}
          totalDays={snapshotMetrics.totalCycleDays}
          phaseName={snapshotMetrics.phaseName}
        />

        {/* Today's Checkable Reminders */}
        <TodayRemindersCard
          reminders={reminders}
          onToggle={toggleReminder}
          onAddReminder={() => openAiChatWithPrompt('Help me add a new reminder')}
        />
      </div>

      {/* ── 6. Lifestyle & Medical Status Triad (Nutrition, Movement, Lab Reports) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <NutritionSnapshotCard data={nutrition} />
        <FitnessSnapshotCard data={fitness} />
        <RecentReportsCard reports={reports} />
      </div>

      {/* ── 7. Longitudinal Health Journey & Patterns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HealthJourneyTimelineCard recentEvents={recentTimelineEvents} />
        </div>
        <div className="lg:col-span-2">
          <HealthPatternsChart />
        </div>
      </div>

      {/* ── 8. Care Circle Clinician Row & Executive Weekly Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CareCircleCard
            contacts={careCircle}
            onPrepareAppointment={() =>
              openAiChatWithPrompt('Prepare a 1-page health summary for Dr. Sara Malik')
            }
          />
        </div>

        <div className="lg:col-span-2 flex flex-col justify-center">
          <WeeklyHealthSummary />
        </div>
      </div>
    </motion.div>
  );
};

export default MasterHealthHub;
