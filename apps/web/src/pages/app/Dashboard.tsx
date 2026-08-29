import React from 'react';
import { motion } from 'framer-motion';
import { useUserHealth } from '../../context/UserHealthContext';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
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

export const Dashboard: React.FC = () => {
  const {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12"
    >
      {/* ── 1. Top Header Bar ── */}
      <DashboardHeader />

      {/* ── 2. Top Metric Snapshot Cards (4 Columns) ── */}
      <HealthSnapshotCard
        metrics={snapshotMetrics}
        onViewSymptoms={() => openAiChatWithPrompt('Show me symptom frequency trends')}
        onViewCycle={() => openAiChatWithPrompt('Explain my current cycle day and window')}
      />

      {/* ── 3. Central Core Health Triad (Cycle, AI Twin, Reminders) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cycle Progress Segmented Ring */}
        <CycleProgressDial
          currentDay={snapshotMetrics.cycleDay}
          totalDays={snapshotMetrics.totalCycleDays}
          phaseName={snapshotMetrics.phaseName}
        />

        {/* Digital Twin AI Insights Card */}
        <DigitalTwinInsightCard
          insight={digitalTwinInsight}
          onOpenChat={openAiChatWithPrompt}
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

      {/* ── 5. Multi-Track Longitudinal Health Correlation Chart ── */}
      <HealthPatternsChart />

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
