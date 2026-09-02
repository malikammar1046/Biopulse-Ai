/**
 * OvaSense — Digital Twin Aggregation & Synthesis Service
 *
 * Synthesizes the live client-side patient health state from Supabase records
 * into the 10-node Digital Twin conceptual representation:
 *   Patient
 *   ├── Profile
 *   ├── Symptoms
 *   ├── Cycle Data
 *   ├── Lifestyle
 *   ├── Diet
 *   ├── Fitness
 *   ├── Medications
 *   ├── Reports
 *   ├── Assessments
 *   └── Health History
 *
 * This layer is non-diagnostic and strictly read-only. It provides the structured
 * patient state to OvaSense AI without hard-coding any specific LLM provider.
 */

import type {
  DigitalTwinState,
  DigitalTwinProfileNode,
  DigitalTwinSymptomsNode,
  DigitalTwinCycleNode,
  DigitalTwinLifestyleNode,
  DigitalTwinDietNode,
  DigitalTwinFitnessNode,
  DigitalTwinMedicationsNode,
  DigitalTwinReportsNode,
  DigitalTwinAssessmentsNode,
  DigitalTwinHistoryNode,
} from '../types/digitalTwin';
import type { UserProfile } from '../types/onboarding';
import type { SymptomRecord } from '../types/symptom';
import type { CycleRecord } from '../types/cycle';
import type { MedicalReport } from '../types/report';
import type { MedicationItem, MedicationLogEntry } from '../types/medication';
import type { FoodLogEntry, WaterLogEntry } from '../types/diet';
import type { FitnessLogEntry } from '../types/fitness';
import type { IntelligenceAssessment } from '../types/intelligence';

export interface DigitalTwinInputData {
  userProfile: Partial<UserProfile>;
  cycleRecords: CycleRecord[];
  symptomRecords: SymptomRecord[];
  reports: MedicalReport[];
  foodLogs: FoodLogEntry[];
  waterLog: WaterLogEntry | null;
  fitnessLogs: FitnessLogEntry[];
  medications: MedicationItem[];
  medicationLogs: MedicationLogEntry[];
  mlAssessment: IntelligenceAssessment | null;
  currentCycleDay?: number;
  currentPhaseName?: string;
}

export class DigitalTwinService {
  /**
   * Synthesizes the structured Digital Twin state from application health context.
   */
  public static synthesizeState(data: DigitalTwinInputData): DigitalTwinState {
    const profile = this.buildProfileNode(data.userProfile);
    const symptoms = this.buildSymptomsNode(data.symptomRecords);
    const cycle = this.buildCycleNode(
      data.cycleRecords,
      data.userProfile,
      data.currentCycleDay,
      data.currentPhaseName
    );
    const lifestyle = this.buildLifestyleNode(data.userProfile, data.waterLog);
    const diet = this.buildDietNode(data.userProfile, data.foodLogs);
    const fitness = this.buildFitnessNode(data.userProfile, data.fitnessLogs);
    const medications = this.buildMedicationsNode(data.medications, data.medicationLogs);
    const reports = this.buildReportsNode(data.reports);
    const assessments = this.buildAssessmentsNode(data.mlAssessment, data.userProfile);
    const history = this.buildHistoryNode(data);

    return {
      patientId: data.userProfile.id || 'anonymous_patient',
      generatedAt: new Date().toISOString(),
      profile,
      symptoms,
      cycle,
      lifestyle,
      diet,
      fitness,
      medications,
      reports,
      assessments,
      history,
    };
  }

  private static buildProfileNode(p: Partial<UserProfile>): DigitalTwinProfileNode {
    let calculatedBmi: number | undefined;
    if (p.heightCm && p.weightKg && p.heightCm > 0) {
      const hM = p.heightCm / 100;
      calculatedBmi = Math.round((p.weightKg / (hM * hM)) * 10) / 10;
    }

    let ageYears: number | undefined;
    if (p.dateOfBirth) {
      const birth = new Date(p.dateOfBirth);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      if (age >= 10 && age <= 120) {
        ageYears = age;
      }
    }

    return {
      fullName: p.fullName || 'Patient',
      ageYears,
      heightCm: p.heightCm ?? undefined,
      weightKg: p.weightKg ?? undefined,
      calculatedBmi,
      bloodType: p.medical?.bloodType,
      isPregnant: p.womensHealth?.isPregnant,
    };
  }

  private static buildSymptomsNode(symptoms: SymptomRecord[]): DigitalTwinSymptomsNode {
    const recent = symptoms.slice(0, 30);
    const frequencyMap = new Map<string, { count: number; severities: string[] }>();
    const severeSymptomsRecent: string[] = [];

    recent.forEach((s) => {
      const type = s.symptomType || 'General';
      const existing = frequencyMap.get(type) || { count: 0, severities: [] };
      existing.count += 1;
      if (s.severity) existing.severities.push(s.severity);
      frequencyMap.set(type, existing);

      if (s.severity === 'severe' && !severeSymptomsRecent.includes(type)) {
        severeSymptomsRecent.push(type);
      }
    });

    const frequentSymptoms = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        typicalSeverity: stat.severities[0] || 'moderate',
      }));

    return {
      totalLogged30Days: recent.length,
      frequentSymptoms,
      severeSymptomsRecent,
      lastLoggedDate: symptoms[0]?.occurredAt ? symptoms[0].occurredAt.slice(0, 10) : undefined,
    };
  }

  private static buildCycleNode(
    cycles: CycleRecord[],
    profile: Partial<UserProfile>,
    dayOverride?: number,
    phaseOverride?: string
  ): DigitalTwinCycleNode {
    let currentCycleDay = dayOverride || 0;
    let currentPhase = phaseOverride || 'Not Logged';

    if (currentCycleDay === 0 && cycles.length > 0 && cycles[0].periodStartDate) {
      try {
        const start = new Date(cycles[0].periodStartDate.slice(0, 10));
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 60) {
          currentCycleDay = diffDays + 1;
        }
      } catch {
        // pass
      }
    }

    let estrogenProgesteroneState = 'Hormonal levels at baseline';
    if (currentCycleDay > 0) {
      if (currentCycleDay <= 5) {
        currentPhase = 'Menstrual Phase';
        estrogenProgesteroneState = 'Estrogen and progesterone at early follicular baseline';
      } else if (currentCycleDay <= 13) {
        currentPhase = 'Follicular Phase';
        estrogenProgesteroneState = 'Estrogen progressively rising toward pre-ovulatory surge';
      } else if (currentCycleDay <= 16) {
        currentPhase = 'Ovulatory Phase';
        estrogenProgesteroneState = 'LH surge peak with maximal estrogen transition';
      } else if (currentCycleDay <= 28) {
        currentPhase = 'Luteal Phase';
        estrogenProgesteroneState = 'Progesterone dominance supported by secondary estrogen elevation';
      } else {
        currentPhase = 'Extended Luteal / Delayed Phase';
        estrogenProgesteroneState = 'Extended cycle duration; hormonal transition delayed';
      }
    }

    let avgLength = 28;
    if (profile.womensHealth?.cycleLength) {
      const parsed = parseInt(String(profile.womensHealth.cycleLength), 10);
      if (!isNaN(parsed)) avgLength = parsed;
    }

    return {
      currentCycleDay,
      currentPhase,
      estrogenProgesteroneState,
      regularityStatus: profile.womensHealth?.periodRegularity || 'regular',
      averageCycleLengthDays: avgLength,
      lastPeriodStartDate: cycles[0]?.periodStartDate ? cycles[0].periodStartDate.slice(0, 10) : undefined,
      historicalCycleCount: cycles.length,
    };
  }

  private static buildLifestyleNode(p: Partial<UserProfile>, water: WaterLogEntry | null): DigitalTwinLifestyleNode {
    const sleep = p.lifestyle?.sleepHours ? Number(p.lifestyle.sleepHours) : 7.5;
    let sleepAdherence: DigitalTwinLifestyleNode['sleepAdherence'] = 'optimal';
    if (sleep < 7.0) sleepAdherence = 'below_target';
    else if (sleep > 9.0) sleepAdherence = 'above_target';

    let dailyWaterAdherencePercent = 80;
    if (water) {
      dailyWaterAdherencePercent = Math.min(100, Math.round((water.glasses / 8) * 100));
    }

    return {
      averageSleepHours: sleep,
      sleepAdherence,
      dailyWaterAdherencePercent,
      stressLevelReported: 'Moderate',
      activityLevel: p.lifestyle?.activityLevel || 'Moderate',
    };
  }

  private static buildDietNode(p: Partial<UserProfile>, food: FoodLogEntry[]): DigitalTwinDietNode {
    return {
      dietaryPreference: p.lifestyle?.dietaryPreference || 'Balanced',
      totalLoggedMeals30Days: food.length,
      fastFoodFrequency: p.lifestyle?.fastFoodIntake || 'occasional',
    };
  }

  private static buildFitnessNode(_p: Partial<UserProfile>, fitnessLogs: FitnessLogEntry[]): DigitalTwinFitnessNode {
    const recentMinutes = fitnessLogs
      .slice(0, 7)
      .reduce((sum, item) => sum + (item.durationMinutes || 0), 0);

    return {
      workoutsThisWeek: fitnessLogs.length,
      weeklyTargetMinutes: 150,
      activeMinutesLogged7Days: recentMinutes,
      preferredActivities: ['Walking', 'Yoga'],
    };
  }

  private static buildMedicationsNode(meds: MedicationItem[], logs: MedicationLogEntry[]): DigitalTwinMedicationsNode {
    const active = meds.filter((m) => m.isActive);
    const takenLogs = logs.filter((l) => l.status === 'taken');
    const adherence = logs.length > 0 ? Math.round((takenLogs.length / logs.length) * 100) : 95;

    return {
      activeCount: active.length,
      activeMedications: active.map((m) => ({
        name: m.name,
        dosage: m.dose || 'Standard',
        frequency: m.frequency || 'Daily',
      })),
      adherenceRate30DaysPercent: adherence,
    };
  }

  private static buildReportsNode(reports: MedicalReport[]): DigitalTwinReportsNode {
    let verifiedCount = 0;
    let pendingCount = 0;
    const keyBiomarkersSummary: DigitalTwinReportsNode['keyBiomarkersSummary'] = [];

    reports.forEach((rep) => {
      (rep.results || []).forEach((r) => {
        if (r.userVerified) {
          verifiedCount += 1;
        } else {
          pendingCount += 1;
        }
        if (keyBiomarkersSummary.length < 8) {
          keyBiomarkersSummary.push({
            testName: r.testName,
            resultValue: r.resultValue,
            unit: r.unit,
            referenceRange: r.referenceRange,
            status: r.status,
            userVerified: Boolean(r.userVerified),
          });
        }
      });
    });

    return {
      totalReportsCount: reports.length,
      verifiedBiomarkersCount: verifiedCount,
      pendingVerificationCount: pendingCount,
      latestReportDate: reports[0]?.reportDate,
      keyBiomarkersSummary,
    };
  }

  private static buildAssessmentsNode(
    ml: IntelligenceAssessment | null,
    p: Partial<UserProfile>
  ): DigitalTwinAssessmentsNode {
    const hasAnswers = Boolean(
      p.womensHealth?.periodRegularity ||
      p.womensHealth?.commonSymptoms?.length ||
      p.lifestyle?.fastFoodIntake
    );

    return {
      latestCategory: ml?.risk_category || 'lower_risk',
      statisticalScreeningProbability: ml?.pcos_probability ?? undefined,
      topInfluencingFactors: ml?.explanations?.slice(0, 3).map((e) => e.human_label || e.feature),
      lastAssessmentTimestamp: ml ? new Date().toISOString() : undefined,
      questionnaireCompleted: hasAnswers,
    };
  }

  private static buildHistoryNode(data: DigitalTwinInputData): DigitalTwinHistoryNode {
    const totalEvents =
      data.cycleRecords.length +
      data.symptomRecords.length +
      data.reports.length +
      data.foodLogs.length +
      data.fitnessLogs.length +
      data.medications.length;

    return {
      trackingSpanDays: Math.max(1, data.cycleRecords.length * 28),
      totalEventsLogged: totalEvents,
      lastActiveDate: new Date().toISOString().slice(0, 10),
    };
  }
}
