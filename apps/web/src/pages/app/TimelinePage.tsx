import React, { useState, useMemo } from 'react';
import { useUserHealth } from '../../context/UserHealthContext';
import { timelineService } from '../../services/timelineService';
import type {
  TimelineFilterState,
  TimelineEvent,
  HealthPatternCorrelation,
} from '../../types/timeline';
import { TimelineHeader } from '../../components/timeline/TimelineHeader';
import { TimelineFilters } from '../../components/timeline/TimelineFilters';
import { TimelineEventCard } from '../../components/timeline/TimelineEventCard';
import { TimelineDetailModal } from '../../components/timeline/TimelineDetailModal';
import { HealthPatternsCard } from '../../components/timeline/HealthPatternsCard';
import { HealthTrajectoryChart } from '../../components/timeline/HealthTrajectoryChart';
import { AppointmentPreparationCard } from '../../components/timeline/AppointmentPreparationCard';
import { TimelineEmptyState } from '../../components/timeline/TimelineEmptyState';
import { PreConsultationPrepModal } from '../../components/appointments/PreConsultationPrepModal';
import { HealthJourneyExportModal } from '../../components/healthJourneyReport/HealthJourneyExportModal';

export const TimelinePage: React.FC = () => {
  const {
    userProfile,
    cycleRecords,
    cycleStats,
    symptomRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
    appointments,
    upcomingAppointment,
    careCircleMembers,
    openAiChatWithPrompt,
    getPreConsultationSnapshot,
    getConsultationBrief,
    addDoctorQuestion,
    toggleDoctorQuestion,
    deleteDoctorQuestion,
  } = useUserHealth();

  // Filter State
  const [filterState, setFilterState] = useState<TimelineFilterState>({
    dateRange: '30d',
    selectedCategories: [],
    onlyImportant: false,
    searchQuery: '',
  });

  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Bundle inputs for timelineService
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

  // 1. Synthesize all raw events
  const allEvents = useMemo(() => {
    return timelineService.synthesizeTimelineEvents(timelineInputs);
  }, [timelineInputs]);

  // 2. Filtered events
  const filteredEvents = useMemo(() => {
    return timelineService.filterTimelineEvents(allEvents, filterState);
  }, [allEvents, filterState]);

  // 3. Category event counts for filter chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEvents.length };
    allEvents.forEach((evt) => {
      counts[evt.category] = (counts[evt.category] || 0) + 1;
    });
    return counts;
  }, [allEvents]);

  // 4. Detected Patterns & Correlations
  const detectedPatterns = useMemo(() => {
    return timelineService.detectHealthPatterns(timelineInputs);
  }, [timelineInputs]);

  // 5. Health Signal Trajectory dataset
  const trajectorySummary = useMemo(() => {
    return timelineService.calculateHealthTrajectory(timelineInputs, filterState.dateRange);
  }, [timelineInputs, filterState.dateRange]);

  // Handle Event Click
  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  // Handle Pattern Click -> AI Prompt
  const handleAskAiPattern = (pattern: HealthPatternCorrelation) => {
    openAiChatWithPrompt(
      `Can you explain this pattern observed in my OvaSense timeline? "${pattern.title}": ${pattern.observation}`
    );
  };

  // Count flagged reports for prep card
  const flaggedReportsCount = useMemo(() => {
    let count = 0;
    reports.forEach((r) => {
      const flagged = (r.results || []).filter(
        (res) => res.status === 'outside_range' || res.status === 'needs_review'
      );
      if (flagged.length > 0) count += 1;
    });
    return count;
  }, [reports]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <TimelineHeader
        totalEvents={allEvents.length}
        filteredEventsCount={filteredEvents.length}
        onOpenAiInsights={() =>
          openAiChatWithPrompt(
            'Analyze my longitudinal health timeline and summarize key connections between my cycle, symptoms, and lifestyle.'
          )
        }
        onExportPdf={() => setIsExportModalOpen(true)}
      />

      {/* 2. Before Your Next Appointment Integration */}
      <AppointmentPreparationCard
        upcomingAppointment={upcomingAppointment}
        currentPhase={cycleStats?.estimatedPhase?.displayName || cycleStats?.estimatedPhase?.name}
        symptomsCount={symptomRecords.length}
        flaggedReportsCount={flaggedReportsCount}
        onPrepareAppointment={() => setIsPrepModalOpen(true)}
      />

      {/* 3. Deterministic Correlations: "Patterns OvaSense Found" */}
      <HealthPatternsCard
        patterns={detectedPatterns}
        onAskAiPattern={handleAskAiPattern}
      />

      {/* 4. Multi-Signal Trajectory Visualization */}
      <HealthTrajectoryChart trajectory={trajectorySummary} />

      {/* 5. Filters Bar */}
      <TimelineFilters
        filterState={filterState}
        onFilterChange={(newFilters) => setFilterState((prev) => ({ ...prev, ...newFilters }))}
        categoryCounts={categoryCounts}
      />

      {/* 6. Chronological Timeline Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 pb-2">
          <h2 className="text-base sm:text-lg font-bold font-display text-[#1C1326]">
            Chronological Events Feed
          </h2>
          <span className="text-xs font-mono text-[#8D7E9E]">
            {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''} Listed
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <TimelineEmptyState
            isFiltered={allEvents.length > 0}
            onResetFilters={() =>
              setFilterState({
                dateRange: 'all',
                selectedCategories: [],
                onlyImportant: false,
                searchQuery: '',
              })
            }
          />
        ) : (
          <div className="pt-2">
            {filteredEvents.map((evt, idx) => (
              <TimelineEventCard
                key={evt.id}
                event={evt}
                isFirst={idx === 0}
                isLast={idx === filteredEvents.length - 1}
                onClick={() => handleEventClick(evt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <TimelineDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* Pre-Consultation Preparation Modal */}
      {upcomingAppointment && (
        <PreConsultationPrepModal
          appointment={upcomingAppointment}
          isOpen={isPrepModalOpen}
          onClose={() => setIsPrepModalOpen(false)}
          snapshot={getPreConsultationSnapshot()}
          brief={getConsultationBrief(upcomingAppointment)}
          onAddQuestion={addDoctorQuestion}
          onToggleQuestion={toggleDoctorQuestion}
          onDeleteQuestion={deleteDoctorQuestion}
        />
      )}

      {/* Clinical Health Journey PDF Export Modal */}
      <HealthJourneyExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        inputs={timelineInputs}
        defaultDateRange={filterState.dateRange}
      />
    </div>
  );
};
export default TimelinePage;
