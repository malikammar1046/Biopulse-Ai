export type AppointmentStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'lab_review'
  | 'routine_check'
  | 'other';

export interface ConsultationQuestion {
  id: string;
  question: string;
  isDiscussed: boolean;
  notes?: string;
  createdAt: string;
}

export interface AppointmentItem {
  id: string;
  patientId: string;
  providerId?: string;
  careCircleMemberId?: string;
  providerName: string;
  providerSpecialty?: string;
  title: string;
  appointmentType: AppointmentType;
  scheduledAt: string; // ISO String (e.g. 2026-09-08T15:30:00Z)
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // "15:30" (or "3:30 PM")
  durationMinutes: number;
  status: AppointmentStatus;
  location: string; // "Clinic", "Video Call", "Hospital"
  meetingUrl?: string;
  reason?: string;
  patientNotes?: string;
  providerNotes?: string;
  doctorQuestions: ConsultationQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentInput {
  providerId?: string;
  providerName: string;
  providerSpecialty?: string;
  careCircleMemberId?: string;
  title: string;
  appointmentType: AppointmentType;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  durationMinutes: number;
  location: string;
  meetingUrl?: string;
  reason?: string;
  patientNotes?: string;
  bookingSource?: string;
  doctorQuestions?: ConsultationQuestion[];
}

export interface HealthSummarySnapshot {
  hasSufficientData: boolean;
  cycle: {
    currentPhase: string;
    currentCycleDay: number;
    cycleRegularity: string;
    averageLengthDays?: number;
  };
  symptoms: {
    totalLoggedCount: number;
    topSymptoms: Array<{ name: string; count: number; averageSeverity: number }>;
    recentPainLevel?: string;
  };
  lifestyle: {
    weeklyMovementMinutes: number;
    activeMovementDays: number;
    averageWaterGlasses: number;
    sleepHoursTarget: number;
  };
  medications: {
    activeCount: number;
    weeklyAdherencePercentage: number;
    activeMedsList: string[];
  };
  reports: {
    totalUploadedCount: number;
    flaggedBiomarkersCount: number;
    flaggedList: string[];
    latestReportTitle?: string;
    latestReportDate?: string;
  };
}

export interface ConsultationBrief {
  generatedAt: string;
  patientName: string;
  patientAge?: number;
  appointmentTitle: string;
  appointmentDate: string;
  providerName: string;
  snapshot: HealthSummarySnapshot;
  patientQuestions: ConsultationQuestion[];
  disclaimer: string;
}

/**
 * Normalized HealthEvent interface structured for future Unified Health Timeline preparation
 */
export interface HealthEvent {
  id: string;
  userId: string;
  type: 'cycle' | 'symptom' | 'report' | 'diet' | 'fitness' | 'medication' | 'appointment';
  timestamp: string;
  title: string;
  description: string;
  source: string;
  metadata?: Record<string, any>;
}
