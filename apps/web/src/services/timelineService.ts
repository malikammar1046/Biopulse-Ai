import type {
  TimelineEvent,
  TimelineDateRange,
  HealthPatternCorrelation,
  HealthTrajectoryDataPoint,
  HealthTrajectorySummary,
  TimelineFilterState,
} from '../types/timeline';
import type { CycleRecord } from '../types/cycle';
import type { SymptomRecord } from '../types/symptom';
import type { MedicalReport } from '../types/report';
import type { FoodLogEntry, WaterLogEntry } from '../types/diet';
import type { FitnessLogEntry } from '../types/fitness';
import type { MedicationItem, MedicationLogEntry } from '../types/medication';
import type { AppointmentItem } from '../types/appointment';
import type { CareCircleMember } from '../types/careCircle';
import type { UserProfile } from '../types/onboarding';

export interface TimelineDataInputs {
  userProfile: UserProfile;
  cycleRecords: CycleRecord[];
  symptomRecords: SymptomRecord[];
  reports: MedicalReport[];
  foodLogs: FoodLogEntry[];
  waterLog?: WaterLogEntry;
  fitnessLogs: FitnessLogEntry[];
  medications: MedicationItem[];
  medicationLogs: MedicationLogEntry[];
  appointments: AppointmentItem[];
  careCircleMembers: CareCircleMember[];
}

class TimelineService {
  // --- 1. Synthesize All Longitudinal Events ---
  synthesizeTimelineEvents(inputs: TimelineDataInputs): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const {
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
    } = inputs;

    const cycleLength =
      typeof userProfile.womensHealth?.cycleLength === 'number'
        ? userProfile.womensHealth.cycleLength
        : 28;
    const periodDuration = userProfile.womensHealth?.periodDuration || 5;

    // Helper: calculate cycle day & phase for a given date
    const getCycleContext = (targetDateStr: string) => {
      const lastPeriod =
        userProfile.womensHealth?.lastPeriodDate ||
        (cycleRecords.length > 0 ? cycleRecords[0].periodStartDate : undefined);

      if (!lastPeriod) return { cycleDay: undefined, cyclePhase: undefined };

      const target = new Date(targetDateStr);
      const start = new Date(lastPeriod);
      const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { cycleDay: undefined, cyclePhase: undefined };

      const day = (diffDays % cycleLength) + 1;
      const phase =
        day <= periodDuration
          ? 'Menstrual Phase'
          : day <= Math.floor(cycleLength / 2) - 2
          ? 'Follicular Phase'
          : day <= Math.floor(cycleLength / 2) + 2
          ? 'Ovulatory Window'
          : 'Luteal Phase';

      return { cycleDay: day, cyclePhase: phase };
    };

    // A. CYCLE EVENTS
    cycleRecords.forEach((c) => {
      if (c.periodStartDate) {
        events.push({
          id: `evt_cycle_start_${c.id || c.periodStartDate}`,
          date: c.periodStartDate,
          time: '08:00',
          timestamp: `${c.periodStartDate}T08:00:00Z`,
          category: 'cycle',
          title: 'Period Started',
          description: `Menstrual flow logged (${c.flow || 'medium'} flow). New cycle started.`,
          importance: 'high',
          metric: {
            label: 'Flow',
            value: (c.flow || 'Normal').toUpperCase(),
            status: 'normal',
          },
          sourceId: c.id,
          sourceModule: 'Cycle Tracker',
          cycleDay: 1,
          cyclePhase: 'Menstrual Phase',
          metadata: { flow: c.flow, symptoms: c.symptoms },
        });
      }

      if (c.periodEndDate) {
        events.push({
          id: `evt_cycle_end_${c.id || c.periodEndDate}`,
          date: c.periodEndDate,
          time: '20:00',
          timestamp: `${c.periodEndDate}T20:00:00Z`,
          category: 'cycle',
          title: 'Period Ended',
          description: `End of menstrual bleeding window. Transitioning to follicular phase.`,
          importance: 'medium',
          metric: {
            label: 'Phase',
            value: 'Follicular',
            status: 'positive',
          },
          sourceId: c.id,
          sourceModule: 'Cycle Tracker',
          cycleDay: periodDuration,
          cyclePhase: 'Follicular Phase',
        });
      }
    });

    // B. SYMPTOM EVENTS
    symptomRecords.forEach((s) => {
      const { cycleDay, cyclePhase } = getCycleContext(s.occurredAt);
      const isSevere = s.severity === 'severe';

      events.push({
        id: `evt_symp_${s.id}`,
        date: s.occurredAt,
        time: '12:00',
        timestamp: `${s.occurredAt}T12:00:00Z`,
        category: 'symptom',
        title: `${s.symptomType} Logged`,
        description: s.notes || `Reported with ${s.severity} intensity during ${s.category || 'daily'} tracking.`,
        importance: isSevere ? 'high' : 'medium',
        metric: {
          label: 'Severity',
          value: s.severity.toUpperCase(),
          status: isSevere ? 'warning' : 'normal',
        },
        sourceId: s.id,
        sourceModule: 'Symptom Tracker',
        cycleDay,
        cyclePhase,
        metadata: { category: s.category, severity: s.severity, notes: s.notes },
      });
    });

    // C. MEDICAL REPORT EVENTS
    reports.forEach((r) => {
      const { cycleDay, cyclePhase } = getCycleContext(r.reportDate);
      const attentionResults = (r.results || []).filter(
        (res) => res.status === 'outside_range' || res.status === 'needs_review'
      );
      const hasAttention = attentionResults.length > 0;

      events.push({
        id: `evt_rep_${r.id}`,
        date: r.reportDate,
        time: '10:00',
        timestamp: `${r.reportDate}T10:00:00Z`,
        category: 'report',
        title: `${r.title} Uploaded`,
        description: hasAttention
          ? `${r.results?.length || 0} biomarkers analyzed. ${attentionResults.length} result(s) need a closer look.`
          : `${r.results?.length || 0} biomarkers analyzed and verified within reference ranges.`,
        importance: hasAttention ? 'high' : 'medium',
        metric: hasAttention
          ? {
              label: 'Attention',
              value: `${attentionResults.length} Flagged`,
              status: 'attention',
            }
          : {
              label: 'Status',
              value: 'Verified',
              status: 'positive',
            },
        sourceId: r.id,
        sourceModule: 'Lab Reports',
        cycleDay,
        cyclePhase,
        metadata: {
          reportType: r.reportType,
          flaggedBiomarkers: attentionResults.map((ar) => ar.testName),
          totalTests: r.results?.length,
        },
      });
    });

    // D. NUTRITION & HYDRATION EVENTS
    // Group food logs by date
    const foodLogsByDate: Record<string, FoodLogEntry[]> = {};
    foodLogs.forEach((f) => {
      const d = f.loggedAt.split('T')[0];
      if (!foodLogsByDate[d]) foodLogsByDate[d] = [];
      foodLogsByDate[d].push(f);
    });

    Object.entries(foodLogsByDate).forEach(([dateStr, items]) => {
      const { cycleDay, cyclePhase } = getCycleContext(dateStr);
      const totalProtein = items.reduce((acc, curr) => acc + (curr.proteinG || 0), 0);
      const totalFiber = items.reduce((acc, curr) => acc + (curr.fiberG || 0), 0);
      const isMilestone = totalProtein >= 50 && totalFiber >= 25;

      events.push({
        id: `evt_diet_${dateStr}`,
        date: dateStr,
        time: '19:30',
        timestamp: `${dateStr}T19:30:00Z`,
        category: 'nutrition',
        title: isMilestone ? 'Hormone-Friendly Nutrition Goal Met' : `Nutrition Logged (${items.length} meals)`,
        description: `Logged meals: ${items.map((i) => i.foodName).slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}.`,
        importance: isMilestone ? 'medium' : 'low',
        metric: {
          label: 'Protein / Fiber',
          value: `${Math.round(totalProtein)}g / ${Math.round(totalFiber)}g`,
          status: isMilestone ? 'positive' : 'normal',
        },
        sourceModule: 'Diet & Meals',
        cycleDay,
        cyclePhase,
        metadata: { mealsCount: items.length, totalProtein, totalFiber },
      });
    });

    // Water intake milestone
    if (waterLog && waterLog.glasses > 0) {
      const { cycleDay, cyclePhase } = getCycleContext(waterLog.date);
      const isTargetMet = waterLog.glasses >= waterLog.targetGlasses;

      events.push({
        id: `evt_water_${waterLog.date}`,
        date: waterLog.date,
        time: '18:00',
        timestamp: `${waterLog.date}T18:00:00Z`,
        category: 'nutrition',
        title: isTargetMet ? 'Hydration Target Achieved' : 'Daily Hydration Logged',
        description: `${waterLog.glasses} of ${waterLog.targetGlasses} glasses (${(waterLog.glasses * 0.25).toFixed(1)} L) tracked today.`,
        importance: isTargetMet ? 'medium' : 'low',
        metric: {
          label: 'Water',
          value: `${(waterLog.glasses * 0.25).toFixed(1)} L`,
          status: isTargetMet ? 'positive' : 'normal',
        },
        sourceModule: 'Diet & Meals',
        cycleDay,
        cyclePhase,
      });
    }

    // E. FITNESS & MOVEMENT EVENTS
    fitnessLogs.forEach((f) => {
      const { cycleDay, cyclePhase } = getCycleContext(f.occurredAt);
      const isSignificant = f.durationMinutes >= 30;

      events.push({
        id: `evt_fit_${f.id}`,
        date: f.occurredAt,
        time: '17:00',
        timestamp: `${f.occurredAt}T17:00:00Z`,
        category: 'fitness',
        title: `${f.activityName || f.activityType} Completed`,
        description: `${f.durationMinutes} mins of movement logged. Energy level: ${f.energyLevel || 'Moderate'}.`,
        importance: isSignificant ? 'medium' : 'low',
        metric: {
          label: 'Movement',
          value: `${f.durationMinutes} min`,
          status: 'positive',
        },
        sourceId: f.id,
        sourceModule: 'Movement Tracker',
        cycleDay,
        cyclePhase,
        metadata: { activityType: f.activityType, duration: f.durationMinutes },
      });
    });

    // F. MEDICATION & ADHERENCE EVENTS
    medications.forEach((m) => {
      if (m.startDate) {
        const { cycleDay, cyclePhase } = getCycleContext(m.startDate);
        events.push({
          id: `evt_med_start_${m.id}`,
          date: m.startDate,
          time: '09:00',
          timestamp: `${m.startDate}T09:00:00Z`,
          category: 'medication',
          title: `Started ${m.name}`,
          description: `Prescribed ${m.dose} ${m.unit} (${m.frequency}) for metabolic and hormone balance.`,
          importance: 'high',
          metric: {
            label: 'Dose',
            value: `${m.dose} ${m.unit}`,
            status: 'normal',
          },
          sourceId: m.id,
          sourceModule: 'Medications',
          cycleDay,
          cyclePhase,
        });
      }
    });

    // Group medication logs by date
    const medLogsByDate: Record<string, MedicationLogEntry[]> = {};
    medicationLogs.forEach((l) => {
      if (!medLogsByDate[l.scheduledFor]) medLogsByDate[l.scheduledFor] = [];
      medLogsByDate[l.scheduledFor].push(l);
    });

    Object.entries(medLogsByDate).forEach(([dateStr, logs]) => {
      const { cycleDay, cyclePhase } = getCycleContext(dateStr);
      const takenCount = logs.filter((l) => l.status === 'taken').length;
      const totalCount = logs.length;
      const isPerfect = takenCount === totalCount && totalCount > 0;

      events.push({
        id: `evt_med_log_${dateStr}`,
        date: dateStr,
        time: '21:00',
        timestamp: `${dateStr}T21:00:00Z`,
        category: 'medication',
        title: isPerfect ? '100% Daily Medication Adherence' : `Medication Doses Tracked (${takenCount}/${totalCount})`,
        description: `${takenCount} of ${totalCount} scheduled doses confirmed for the day.`,
        importance: isPerfect ? 'medium' : 'low',
        metric: {
          label: 'Adherence',
          value: `${Math.round((takenCount / (totalCount || 1)) * 100)}%`,
          status: isPerfect ? 'positive' : 'warning',
        },
        sourceModule: 'Medications',
        cycleDay,
        cyclePhase,
        metadata: { takenCount, totalCount },
      });
    });

    // G. APPOINTMENT EVENTS
    appointments.forEach((a) => {
      const { cycleDay, cyclePhase } = getCycleContext(a.scheduledDate);
      const isScheduled = a.status === 'scheduled';
      const isCompleted = a.status === 'completed';

      events.push({
        id: `evt_appt_${a.id}`,
        date: a.scheduledDate,
        time: a.scheduledTime || '11:00',
        timestamp: `${a.scheduledDate}T${a.scheduledTime || '11:00'}:00Z`,
        category: 'appointment',
        title: `${a.appointmentType === 'consultation' ? 'Clinical Consultation' : 'Doctor Follow-up'}: ${a.providerName}`,
        description: isCompleted
          ? `Completed ${a.durationMinutes} min consultation with ${a.providerName} (${a.providerSpecialty || 'Specialist'}).`
          : `Scheduled visit with ${a.providerName}. Reason: ${a.reason || 'General health review'}.`,
        importance: 'high',
        metric: {
          label: 'Status',
          value: a.status.toUpperCase(),
          status: isScheduled ? 'positive' : isCompleted ? 'normal' : 'warning',
        },
        sourceId: a.id,
        sourceModule: 'Appointments',
        cycleDay,
        cyclePhase,
        metadata: {
          providerName: a.providerName,
          meetingUrl: a.meetingUrl,
          location: a.location,
          questionsCount: a.doctorQuestions?.length || 0,
        },
      });
    });

    // H. CARE CIRCLE EVENTS
    careCircleMembers.forEach((m) => {
      const createdDate = m.createdAt ? m.createdAt.split('T')[0] : '2026-08-20';
      const { cycleDay, cyclePhase } = getCycleContext(createdDate);

      events.push({
        id: `evt_circle_${m.id}`,
        date: createdDate,
        time: '14:00',
        timestamp: `${createdDate}T14:00:00Z`,
        category: 'care_circle',
        title: `Connected with ${m.name}`,
        description: `${m.relationship || m.clinicOrganization || 'Healthcare Professional'} connected to Care Circle with authorized longitudinal access.`,
        importance: 'medium',
        metric: {
          label: 'Role',
          value: m.role.toUpperCase(),
          status: 'positive',
        },
        sourceId: m.id,
        sourceModule: 'Care Circle',
        cycleDay,
        cyclePhase,
      });
    });

    // Chronological Sort: Newest First
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events;
  }

  // --- 2. Filter Timeline Events ---
  filterTimelineEvents(
    events: TimelineEvent[],
    filterState: TimelineFilterState
  ): TimelineEvent[] {
    const { dateRange, selectedCategories, onlyImportant, searchQuery } = filterState;
    const now = new Date();

    return events.filter((evt) => {
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(evt.category)) {
        return false;
      }

      // Importance filter
      if (onlyImportant && evt.importance !== 'high') {
        return false;
      }

      // Date Range filter
      if (dateRange !== 'all') {
        const evtDate = new Date(evt.date);
        let maxDays = 30;
        if (dateRange === '7d') maxDays = 7;
        else if (dateRange === '30d') maxDays = 30;
        else if (dateRange === '90d') maxDays = 90;
        else if (dateRange === '6m') maxDays = 180;
        else if (dateRange === '1y') maxDays = 365;

        const diffDays = (now.getTime() - evtDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > maxDays || diffDays < -30) {
          // Allow up to 30 days into future for upcoming appointments
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(query);
        const matchesDesc = evt.description.toLowerCase().includes(query);
        const matchesCat = evt.category.toLowerCase().includes(query);
        const matchesModule = evt.sourceModule.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesModule) {
          return false;
        }
      }

      return true;
    });
  }

  // --- 3. Detect Deterministic Health Patterns & Correlations ---
  detectHealthPatterns(inputs: TimelineDataInputs): HealthPatternCorrelation[] {
    const patterns: HealthPatternCorrelation[] = [];
    const {
      userProfile,
      cycleRecords,
      symptomRecords,
      fitnessLogs,
      waterLog,
      reports,
      medicationLogs,
    } = inputs;

    const cycleLength =
      typeof userProfile.womensHealth?.cycleLength === 'number'
        ? userProfile.womensHealth.cycleLength
        : 28;
    const periodDuration = userProfile.womensHealth?.periodDuration || 5;

    // Helper to determine phase
    const getPhaseForDate = (dateStr: string) => {
      const lastPeriod =
        userProfile.womensHealth?.lastPeriodDate ||
        (cycleRecords.length > 0 ? cycleRecords[0].periodStartDate : undefined);
      if (!lastPeriod) return 'Unknown';

      const diff = Math.floor(
        (new Date(dateStr).getTime() - new Date(lastPeriod).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff < 0) return 'Unknown';

      const day = (diff % cycleLength) + 1;
      return day <= periodDuration
        ? 'Menstrual Phase'
        : day <= Math.floor(cycleLength / 2) - 2
        ? 'Follicular Phase'
        : day <= Math.floor(cycleLength / 2) + 2
        ? 'Ovulatory Window'
        : 'Luteal Phase';
    };

    const isMale = userProfile.gender === 'male' || userProfile.pathway === 'male';

    // Correlation 1: Symptom Clustering
    if (symptomRecords.length >= 2) {
      if (!isMale) {
        // Female: Cycle Phase vs Symptom Clustering
        const symptomsByPhase: Record<string, { total: number; types: Record<string, number> }> = {
          'Menstrual Phase': { total: 0, types: {} },
          'Follicular Phase': { total: 0, types: {} },
          'Ovulatory Window': { total: 0, types: {} },
          'Luteal Phase': { total: 0, types: {} },
        };

        symptomRecords.forEach((s) => {
          const phase = getPhaseForDate(s.occurredAt);
          if (symptomsByPhase[phase]) {
            symptomsByPhase[phase].total += 1;
            symptomsByPhase[phase].types[s.symptomType] =
              (symptomsByPhase[phase].types[s.symptomType] || 0) + 1;
          }
        });

        // Find predominant phase
        const sortedPhases = Object.entries(symptomsByPhase).sort(
          (a, b) => b[1].total - a[1].total
        );
        const topPhase = sortedPhases[0];

        if (topPhase && topPhase[1].total >= 2) {
          const topSymptom = Object.entries(topPhase[1].types).sort((a, b) => b[1] - a[1])[0];
          const symptomName = topSymptom ? topSymptom[0] : 'symptoms';
          const symptomCount = topSymptom ? topSymptom[1] : topPhase[1].total;

          patterns.push({
            id: 'pat_cycle_symptom_clustering',
            category: 'cycle_symptom',
            title: `Symptom Rhythm: ${topPhase[0]} Clustering`,
            observation: `Observed: ${symptomCount} out of ${symptomRecords.length} recorded entries (${symptomName}) occurred during your ${topPhase[0]}.`,
            interpretation: `BioPulse AI Interpretation: Hormonal shifts in estrogen and progesterone during this phase are known to influence pelvic comfort, energy, and neurotransmitter balance. Logging across consecutive cycles helps distinguish natural phase patterns from persistent concerns.`,
            confidence: 'high',
            signals: ['Cycle Rhythm', 'Symptom Log'],
            actionTip: `Prepare this observation for your next specialist visit to discuss targeted phase-based lifestyle adjustments.`,
          });
        }
      } else {
        // Male: Symptom Frequency Distribution
        const symptomCounts: Record<string, number> = {};
        symptomRecords.forEach((s) => {
          symptomCounts[s.symptomType] = (symptomCounts[s.symptomType] || 0) + 1;
        });
        const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
        const topSymptom = sortedSymptoms[0];

        if (topSymptom && topSymptom[1] >= 2) {
          patterns.push({
            id: 'pat_male_symptom_clustering',
            category: 'lifestyle_symptom',
            title: `Symptom Rhythm: ${topSymptom[0]} Frequency`,
            observation: `Observed: ${topSymptom[1]} out of ${symptomRecords.length} recorded entries relate to ${topSymptom[0]}.`,
            interpretation: `Clinical Interpretation: Tracking symptom frequency and diurnal patterns provides valuable longitudinal baseline data for your clinical consultations.`,
            confidence: 'high',
            signals: ['Symptom Rhythm', 'Vitality Tracker'],
            actionTip: `Prepare this observation for your next specialist consultation to discuss hormone and recovery balance.`,
          });
        }
      }
    }

    // Correlation 2: Movement & Energy Correlation
    if (fitnessLogs.length >= 2) {
      const totalMins = fitnessLogs.reduce((sum, f) => sum + f.durationMinutes, 0);
      const avgMins = Math.round(totalMins / fitnessLogs.length);

      patterns.push({
        id: 'pat_movement_consistency',
        category: 'lifestyle_movement',
        title: 'Movement & Metabolic Rhythm',
        observation: `Observed: You completed ${fitnessLogs.length} activity sessions averaging ${avgMins} minutes over your logged history.`,
        interpretation: isMale
          ? `Clinical Interpretation: Regular progressive movement (including resistance training and aerobic activity) supports androgen balance, metabolic recovery, and insulin sensitivity.`
          : `BioPulse AI Interpretation: Regular gentle movement (such as walking, yoga, and resistance training) supports peripheral insulin sensitivity and metabolic recovery in PCOS without spiking cortisol levels.`,
        confidence: 'high',
        signals: ['Movement', 'Metabolic Health'],
        actionTip: `Aim to maintain 150 minutes of moderate or gentle movement per week to support hormone homeostasis.`,
      });
    }

    // Correlation 3: Hydration & Daily Wellness
    if (waterLog && waterLog.glasses > 0) {
      const target = waterLog.targetGlasses || 8;
      const isTargetMet = waterLog.glasses >= target;

      patterns.push({
        id: 'pat_hydration_baseline',
        category: 'lifestyle_symptom',
        title: 'Hydration & Metabolic Balance',
        observation: `Observed: Today's water intake reached ${waterLog.glasses} / ${target} glasses (${(waterLog.glasses * 0.25).toFixed(1)} L).`,
        interpretation: isMale
          ? `Clinical Interpretation: Adequate daily hydration assists renal clearance, supports cellular energy and vascular volume, and mitigates fatigue.`
          : `BioPulse AI Interpretation: Adequate daily hydration assists renal clearance of estrogen metabolites, supports vascular volume during the luteal phase, and mitigates dehydration-induced fatigue.`,
        confidence: 'moderate',
        signals: ['Hydration', 'Daily Logs'],
        actionTip: isTargetMet
          ? `Great job meeting your daily hydration baseline!`
          : `Keep a water bottle nearby to reach the recommended ${target} glasses daily.`,
      });
    }

    // Correlation 4: Medication Adherence Trend
    if (medicationLogs.length >= 3) {
      const taken = medicationLogs.filter((l) => l.status === 'taken').length;
      const adherenceRate = Math.round((taken / medicationLogs.length) * 100);

      patterns.push({
        id: 'pat_med_adherence_trend',
        category: 'medication_adherence',
        title: 'Medication Adherence Consistency',
        observation: `Observed: Overall medication adherence across logged doses is currently at ${adherenceRate}% (${taken}/${medicationLogs.length} doses confirmed).`,
        interpretation: isMale
          ? `Clinical Interpretation: Consistent adherence to prescribed medications and supplements is key for steady-state hormonal and metabolic balance.`
          : `BioPulse AI Interpretation: Consistent adherence to prescribed insulin sensitizers, cyclic support, or supplements is key for steady-state hormonal modulation.`,
        confidence: 'high',
        signals: ['Medications', 'Adherence'],
        actionTip:
          adherenceRate >= 85
            ? 'Excellent consistency! Sustained adherence creates clearer longitudinal trends.'
            : 'Setting timely daily reminders can help keep your routine steady.',
      });
    }

    // Correlation 5: Lab Reports Biomarker Summary
    if (reports.length > 0) {
      let flaggedTotal = 0;
      reports.forEach((r) => {
        const flagged = (r.results || []).filter(
          (res) => res.status === 'outside_range' || res.status === 'needs_review'
        );
        flaggedTotal += flagged.length;
      });

      if (flaggedTotal > 0) {
        patterns.push({
          id: 'pat_report_biomarkers',
          category: 'report_comparison',
          title: 'Lab Report Longitudinal Review',
          observation: `Observed: Across ${reports.length} uploaded diagnostic report(s), ${flaggedTotal} biomarker finding(s) have been flagged for clinical review.`,
          interpretation: `Clinical Interpretation: Periodic comparison of metabolic, lipid, and androgen markers provides objective evidence of physiological progress under your care plan.`,
          confidence: 'high',
          signals: ['Lab Reports', 'Biomarkers'],
          actionTip: `Review these flagged markers in your consultation brief prior to your next appointment.`,
        });
      }
    }

    // Baseline Guidance when data is still emerging
    if (patterns.length === 0) {
      patterns.push({
        id: 'pat_initial_journey',
        category: isMale ? 'lifestyle_symptom' : 'cycle_regularity',
        title: 'Your Health Story Is Emerging',
        observation: `Observed: Analyzing your initial health entries across symptoms, nutrition, activity, and lifestyle logs.`,
        interpretation: isMale
          ? `Clinical Interpretation: Longitudinal pattern recognition strengthens significantly as you log across consecutive weeks. Each daily log adds clarity to your personal health trajectory.`
          : `BioPulse AI Interpretation: Longitudinal pattern recognition strengthens significantly as you log across 2–3 menstrual cycles. Each daily log adds clarity to your personal health trajectory.`,
        confidence: 'moderate',
        signals: ['Longitudinal Engine'],
        actionTip: `Continue logging daily symptoms, meals, and lifestyle changes to reveal deeper correlations.`,
      });
    }

    return patterns;
  }

  // --- 4. Calculate Health Trajectory Dataset ---
  calculateHealthTrajectory(
    inputs: TimelineDataInputs,
    dateRange: TimelineDateRange = '30d'
  ): HealthTrajectorySummary {
    const {
      userProfile,
      cycleRecords,
      symptomRecords,
      fitnessLogs,
      waterLog,
      medicationLogs,
      reports,
      appointments,
    } = inputs;

    const cycleLength =
      typeof userProfile.womensHealth?.cycleLength === 'number'
        ? userProfile.womensHealth.cycleLength
        : 28;
    const periodDuration = userProfile.womensHealth?.periodDuration || 5;
    const lastPeriod =
      userProfile.womensHealth?.lastPeriodDate ||
      (cycleRecords.length > 0 ? cycleRecords[0].periodStartDate : undefined);

    let daysCount = 30;
    if (dateRange === '7d') daysCount = 7;
    else if (dateRange === '30d') daysCount = 30;
    else if (dateRange === '90d') daysCount = 90;
    else if (dateRange === '6m') daysCount = 180;
    else if (dateRange === '1y') daysCount = 365;
    else if (dateRange === 'all') daysCount = 60; // default for visual fidelity

    const now = new Date();
    const dataPoints: HealthTrajectoryDataPoint[] = [];
    let loggedDaysCount = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Cycle context
      let dayNumber: number | undefined;
      let phaseName: string | undefined;

      if (lastPeriod) {
        const diff = Math.floor(
          (d.getTime() - new Date(lastPeriod).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff >= 0) {
          dayNumber = (diff % cycleLength) + 1;
          phaseName =
            dayNumber <= periodDuration
              ? 'Menstrual Phase'
              : dayNumber <= Math.floor(cycleLength / 2) - 2
              ? 'Follicular Phase'
              : dayNumber <= Math.floor(cycleLength / 2) + 2
              ? 'Ovulatory Window'
              : 'Luteal Phase';
        }
      }

      // Symptoms on this day
      const daySymptoms = symptomRecords.filter((s) => s.occurredAt === dateStr);
      let severityScore = 0;
      daySymptoms.forEach((s) => {
        if (s.severity === 'severe') severityScore += 4;
        else if (s.severity === 'moderate') severityScore += 2;
        else severityScore += 1;
      });
      severityScore = Math.min(10, severityScore);

      // Fitness on this day
      const dayFitness = fitnessLogs.filter((f) => f.occurredAt === dateStr);
      const movementMinutes = dayFitness.reduce((sum, f) => sum + f.durationMinutes, 0);

      // Hydration
      const waterGlasses =
        waterLog && waterLog.date === dateStr
          ? waterLog.glasses
          : userProfile.lifestyle?.dailyWaterGlasses || 8;

      // Medication adherence
      const dayMeds = medicationLogs.filter((m) => m.scheduledFor === dateStr);
      const medsAdherence =
        dayMeds.length > 0
          ? Math.round(
              (dayMeds.filter((m) => m.status === 'taken').length / dayMeds.length) * 100
            )
          : 100;

      // Reports & Appointments on this day
      const hasReport = reports.some((r) => r.reportDate === dateStr);
      const hasAppointment = appointments.some((a) => a.scheduledDate === dateStr);

      const totalEvents =
        daySymptoms.length +
        dayFitness.length +
        (hasReport ? 1 : 0) +
        (hasAppointment ? 1 : 0) +
        (dayMeds.length > 0 ? 1 : 0);

      if (totalEvents > 0) {
        loggedDaysCount += 1;
      }

      dataPoints.push({
        date: dateStr,
        displayDate,
        cycleDay: dayNumber,
        phaseName,
        symptomsCount: daySymptoms.length,
        symptomSeverityScore: severityScore,
        movementMinutes,
        waterGlasses,
        medsAdherencePercent: medsAdherence,
        hasReport,
        hasAppointment,
        eventsCount: totalEvents,
      });
    }

    const coveragePercentage = Math.round((loggedDaysCount / (daysCount || 1)) * 100);

    return {
      dataPoints,
      totalLoggedDays: loggedDaysCount,
      coveragePercentage,
      activeSignals: {
        cycle: true,
        symptoms: true,
        movement: true,
        adherence: true,
        hydration: true,
      },
    };
  }
}

export const timelineService = new TimelineService();
