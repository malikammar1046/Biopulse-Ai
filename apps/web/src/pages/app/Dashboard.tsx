import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserHealth } from '../../context/UserHealthContext';
import { timelineService } from '../../services/timelineService';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
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

export const Dashboard: React.FC = () => {
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
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12"
    >
      {/* ── 1. Top Header Bar ── */}
      <DashboardHeader />

      {/* ── 2. Primary Showcase: OvaSense PCOS ML Screening Assessment ── */}
      <section id="ovasense-ml-screening-section" aria-label="OvaSense PCOS ML Screening Assessment" className="w-full">
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

      {/* ── 4. Lifestyle & Medical Status Triad (Nutrition, Movement, Lab Reports) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <NutritionSnapshotCard data={nutrition} />
        <FitnessSnapshotCard data={fitness} />
        <RecentReportsCard reports={reports} />
      </div>

      {/* ── 5. Longitudinal Health Journey & Patterns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HealthJourneyTimelineCard recentEvents={recentTimelineEvents} />
        </div>
        <div className="lg:col-span-2">
          <HealthPatternsChart />
        </div>
      </div>

      {/* ── 6. Care Circle Clinician Row & Executive Weekly Summary ── */}
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

export default Dashboard;
