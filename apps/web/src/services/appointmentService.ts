import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/onboarding';
import type { CycleRecord, CycleSummaryStats } from '../types/cycle';
import type { SymptomRecord } from '../types/symptom';
import type { MedicalReport } from '../types/report';
import type { FoodLogEntry, WaterLogEntry } from '../types/diet';
import type { FitnessLogEntry } from '../types/fitness';
import type { MedicationItem, MedicationLogEntry } from '../types/medication';
import type {
  AppointmentItem,
  AppointmentInput,
  AppointmentStatus,
  ConsultationQuestion,
  HealthSummarySnapshot,
  ConsultationBrief,
} from '../types/appointment';

const STORAGE_APPOINTMENTS_PREFIX = 'ovasense_appointments_';

class AppointmentService {
  private getStorageKey(patientId: string): string {
    return `${STORAGE_APPOINTMENTS_PREFIX}${patientId}`;
  }

  // --- Local Cache Helpers ---
  private getLocalAppointments(patientId: string): AppointmentItem[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(patientId));
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  }

  private setLocalAppointments(patientId: string, appointments: AppointmentItem[]): void {
    try {
      localStorage.setItem(this.getStorageKey(patientId), JSON.stringify(appointments));
    } catch {
      // ignore
    }
  }

  // --- CRUD: Appointments ---
  async fetchAppointments(
    patientId: string
  ): Promise<{ appointments: AppointmentItem[]; error?: string }> {
    const local = this.getLocalAppointments(patientId);

    if (!isSupabaseConfigured()) {
      return { appointments: local };
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetchAppointments warning (using local cache):', error.message);
        return { appointments: local };
      }

      if (data && data.length > 0) {
        const mapped: AppointmentItem[] = data.map((row) => ({
          id: row.id,
          patientId: row.patient_id,
          providerId: row.provider_id || undefined,
          careCircleMemberId: row.care_circle_member_id || undefined,
          providerName: row.provider_name,
          providerSpecialty: row.provider_specialty || undefined,
          providerImage: row.provider_image || row.providerImage || undefined,
          fee: row.fee || undefined,
          title: row.title,
          appointmentType: row.appointment_type,
          scheduledAt: row.scheduled_at,
          scheduledDate: row.scheduled_date || row.scheduled_at.split('T')[0],
          scheduledTime: row.scheduled_time || '15:30',
          durationMinutes: row.duration_minutes || 30,
          status: row.status as AppointmentStatus,
          location: row.location || 'Clinic Consultation',
          meetingUrl: row.meeting_url || '',
          reason: row.reason || '',
          patientNotes: row.patient_notes || '',
          providerNotes: row.provider_notes || '',
          doctorQuestions: Array.isArray(row.doctor_questions) ? row.doctor_questions : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        this.setLocalAppointments(patientId, mapped);
        return { appointments: mapped };
      }

      return { appointments: local };
    } catch (err: any) {
      console.warn('Unexpected error in fetchAppointments:', err);
      return { appointments: local };
    }
  }

  async createAppointment(
    patientId: string,
    input: AppointmentInput
  ): Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }> {
    const scheduledAtIso = `${input.scheduledDate}T${input.scheduledTime || '15:30'}:00.000Z`;

    const isUuid = (val?: string) =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const formattedPatientNotes = [
      input.bookingSource ? `[Source: ${input.bookingSource}]` : '',
      input.providerId && !isUuid(input.providerId) ? `[Doctor ID: ${input.providerId}]` : '',
      input.patientNotes?.trim() || '',
    ]
      .filter(Boolean)
      .join(' ');

    const newAppointment: AppointmentItem = {
      id: crypto.randomUUID(),
      patientId,
      providerId: input.providerId,
      careCircleMemberId: input.careCircleMemberId,
      providerName: input.providerName.trim() || 'Healthcare Professional',
      providerSpecialty: input.providerSpecialty ? input.providerSpecialty.trim() : undefined,
      providerImage: input.providerImage || undefined,
      fee: input.fee || undefined,
      title: input.title.trim() || 'Medical Consultation',
      appointmentType: input.appointmentType,
      scheduledAt: scheduledAtIso,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime || '15:30',
      durationMinutes: Math.max(15, input.durationMinutes || 30),
      status: input.status || 'scheduled',
      location: input.location.trim() || 'Clinic Consultation',
      meetingUrl: input.meetingUrl?.trim() || '',
      reason: input.reason?.trim() || '',
      patientNotes: formattedPatientNotes,
      doctorQuestions: input.doctorQuestions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = this.getLocalAppointments(patientId);
    const updated = [newAppointment, ...current].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
    this.setLocalAppointments(patientId, updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('appointments').insert({
          id: newAppointment.id,
          patient_id: patientId,
          provider_id: isUuid(newAppointment.providerId) ? newAppointment.providerId : null,
          care_circle_member_id: isUuid(newAppointment.careCircleMemberId)
            ? newAppointment.careCircleMemberId
            : null,
          provider_name: newAppointment.providerName,
          provider_specialty: newAppointment.providerSpecialty || null,
          title: newAppointment.title,
          appointment_type: newAppointment.appointmentType,
          scheduled_at: newAppointment.scheduledAt,
          scheduled_date: newAppointment.scheduledDate,
          scheduled_time: newAppointment.scheduledTime,
          duration_minutes: newAppointment.durationMinutes,
          status: newAppointment.status,
          location: newAppointment.location,
          meeting_url: newAppointment.meetingUrl,
          reason: newAppointment.reason,
          patient_notes: newAppointment.patientNotes,
          doctor_questions: newAppointment.doctorQuestions,
          created_at: newAppointment.createdAt,
          updated_at: newAppointment.updatedAt,
        });
      } catch (err) {
        console.warn('Supabase createAppointment error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_appointments_updated'));
    }

    return { success: true, appointment: newAppointment };
  }

  async updateAppointment(
    patientId: string,
    id: string,
    input: Partial<AppointmentInput> & { status?: AppointmentStatus; providerNotes?: string }
  ): Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }> {
    const current = this.getLocalAppointments(patientId);
    const targetIdx = current.findIndex((a) => a.id === id);

    if (targetIdx === -1) {
      return { success: false, error: 'Appointment not found.' };
    }

    const scheduledDate = input.scheduledDate || current[targetIdx].scheduledDate;
    const scheduledTime = input.scheduledTime || current[targetIdx].scheduledTime;
    const scheduledAtIso = `${scheduledDate}T${scheduledTime}:00.000Z`;

    const updatedAppt: AppointmentItem = {
      ...current[targetIdx],
      ...(input.providerName && { providerName: input.providerName.trim() }),
      ...(input.providerSpecialty && { providerSpecialty: input.providerSpecialty.trim() }),
      ...(input.providerImage !== undefined && { providerImage: input.providerImage }),
      ...(input.fee !== undefined && { fee: input.fee }),
      ...(input.title && { title: input.title.trim() }),
      ...(input.appointmentType && { appointmentType: input.appointmentType }),
      ...(input.scheduledDate && { scheduledDate }),
      ...(input.scheduledTime && { scheduledTime }),
      scheduledAt: scheduledAtIso,
      ...(input.durationMinutes && { durationMinutes: input.durationMinutes }),
      ...(input.status && { status: input.status }),
      ...(input.location && { location: input.location }),
      ...(input.meetingUrl !== undefined && { meetingUrl: input.meetingUrl }),
      ...(input.reason !== undefined && { reason: input.reason }),
      ...(input.patientNotes !== undefined && { patientNotes: input.patientNotes }),
      ...(input.providerNotes !== undefined && { providerNotes: input.providerNotes }),
      ...(input.doctorQuestions && { doctorQuestions: input.doctorQuestions }),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...current];
    updatedList[targetIdx] = updatedAppt;
    updatedList.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    this.setLocalAppointments(patientId, updatedList);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('appointments')
          .update({
            provider_name: updatedAppt.providerName,
            provider_specialty: updatedAppt.providerSpecialty,
            title: updatedAppt.title,
            appointment_type: updatedAppt.appointmentType,
            scheduled_at: updatedAppt.scheduledAt,
            scheduled_date: updatedAppt.scheduledDate,
            scheduled_time: updatedAppt.scheduledTime,
            duration_minutes: updatedAppt.durationMinutes,
            status: updatedAppt.status,
            location: updatedAppt.location,
            meeting_url: updatedAppt.meetingUrl,
            reason: updatedAppt.reason,
            patient_notes: updatedAppt.patientNotes,
            provider_notes: updatedAppt.providerNotes,
            doctor_questions: updatedAppt.doctorQuestions,
            updated_at: updatedAppt.updatedAt,
          })
          .eq('id', id)
          .eq('patient_id', patientId);
      } catch (err) {
        console.warn('Supabase updateAppointment error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_appointments_updated'));
    }

    return { success: true, appointment: updatedAppt };
  }

  async cancelAppointment(
    patientId: string,
    id: string,
    reason?: string
  ): Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }> {
    return this.updateAppointment(patientId, id, {
      status: 'cancelled',
      patientNotes: reason ? `Cancelled: ${reason}` : undefined,
    });
  }

  async completeAppointment(
    patientId: string,
    id: string,
    notes?: string
  ): Promise<{ success: boolean; appointment?: AppointmentItem; error?: string }> {
    return this.updateAppointment(patientId, id, {
      status: 'completed',
      providerNotes: notes,
    });
  }

  async deleteAppointment(
    patientId: string,
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getLocalAppointments(patientId);
    this.setLocalAppointments(
      patientId,
      current.filter((a) => a.id !== id)
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('appointments').delete().eq('id', id).eq('patient_id', patientId);
      } catch (err) {
        console.warn('Supabase delete appointment error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_appointments_updated'));
    }

    return { success: true };
  }

  // --- Questions for Doctor Management ---
  async addConsultationQuestion(
    patientId: string,
    appointmentId: string,
    questionText: string
  ): Promise<{ success: boolean; question?: ConsultationQuestion; error?: string }> {
    const current = this.getLocalAppointments(patientId);
    const appt = current.find((a) => a.id === appointmentId);

    if (!appt) {
      return { success: false, error: 'Appointment not found.' };
    }

    const newQuestion: ConsultationQuestion = {
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      question: questionText.trim(),
      isDiscussed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedQuestions = [...(appt.doctorQuestions || []), newQuestion];
    await this.updateAppointment(patientId, appointmentId, {
      doctorQuestions: updatedQuestions,
    });

    return { success: true, question: newQuestion };
  }

  async toggleQuestionDiscussed(
    patientId: string,
    appointmentId: string,
    questionId: string
  ): Promise<{ success: boolean }> {
    const current = this.getLocalAppointments(patientId);
    const appt = current.find((a) => a.id === appointmentId);

    if (!appt) return { success: false };

    const updatedQuestions = (appt.doctorQuestions || []).map((q) =>
      q.id === questionId ? { ...q, isDiscussed: !q.isDiscussed } : q
    );

    await this.updateAppointment(patientId, appointmentId, {
      doctorQuestions: updatedQuestions,
    });

    return { success: true };
  }

  async deleteConsultationQuestion(
    patientId: string,
    appointmentId: string,
    questionId: string
  ): Promise<{ success: boolean }> {
    const current = this.getLocalAppointments(patientId);
    const appt = current.find((a) => a.id === appointmentId);

    if (!appt) return { success: false };

    const updatedQuestions = (appt.doctorQuestions || []).filter((q) => q.id !== questionId);
    await this.updateAppointment(patientId, appointmentId, {
      doctorQuestions: updatedQuestions,
    });

    return { success: true };
  }

  // --- Pure Calculations: Pre-Consultation Health Snapshot & Brief Generator ---
  generatePreConsultationSnapshot(
    userProfile: UserProfile,
    cycleStats: CycleSummaryStats,
    cycleRecords: CycleRecord[],
    symptomRecords: SymptomRecord[],
    reports: MedicalReport[],
    foodLogs: FoodLogEntry[],
    waterLog: WaterLogEntry,
    fitnessLogs: FitnessLogEntry[],
    medications: MedicationItem[],
    medicationLogs: MedicationLogEntry[]
  ): HealthSummarySnapshot {
    // 1. Cycle Metrics
    const currentPhase =
      cycleStats.hasData && cycleStats.estimatedPhase
        ? cycleStats.estimatedPhase.name
        : userProfile.womensHealth?.currentPhase || 'Follicular Phase';
    const currentCycleDay =
      cycleStats.hasData && cycleStats.currentCycleDay !== null
        ? cycleStats.currentCycleDay
        : 14;
    const cycleRegularity = userProfile.womensHealth?.periodRegularity
      ? userProfile.womensHealth.periodRegularity.replace('_', ' ')
      : 'Mostly Regular';
    const averageLengthDays =
      cycleStats.hasData && typeof cycleStats.averageCycleLength === 'number'
        ? cycleStats.averageCycleLength
        : typeof userProfile.womensHealth?.cycleLength === 'number'
        ? userProfile.womensHealth.cycleLength
        : 32;

    // 2. Symptom Frequency & Severity
    const symptomFrequencyMap: Record<string, { count: number; totalSev: number }> = {};
    symptomRecords.forEach((s) => {
      const name = s.symptomType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!symptomFrequencyMap[name]) {
        symptomFrequencyMap[name] = { count: 0, totalSev: 0 };
      }
      const sevNum = s.severity === 'severe' ? 3 : s.severity === 'moderate' ? 2 : 1;
      symptomFrequencyMap[name].count += 1;
      symptomFrequencyMap[name].totalSev += sevNum;
    });

    const topSymptoms = Object.entries(symptomFrequencyMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        averageSeverity: Math.round((data.totalSev / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // 3. Lifestyle & Nutrition
    const now = new Date();
    const past7DaysIso = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const recentFitness = fitnessLogs.filter((f) => f.occurredAt >= past7DaysIso);
    const weeklyMovementMinutes = recentFitness.reduce((sum, f) => sum + f.durationMinutes, 0);
    const activeMovementDays = new Set(recentFitness.map((f) => f.occurredAt)).size;
    const averageWaterGlasses = waterLog.glasses || userProfile.lifestyle?.dailyWaterGlasses || 8;
    const _loggedMealsDays = foodLogs.length > 0 ? new Set(foodLogs.map((l) => l.loggedAt.split('T')[0])).size : 0;

    // 4. Medications & Adherence
    const activeMeds = medications.filter((m) => m.isActive);
    const activeMedsList = activeMeds.map((m) => `${m.name} (${m.dose}${m.unit})`);
    const recentMedsLogs = medicationLogs.filter((l) => l.scheduledFor >= past7DaysIso);
    const totalScheduledMeds = recentMedsLogs.length;
    const takenMeds = recentMedsLogs.filter((l) => l.status === 'taken').length;
    const weeklyAdherencePercentage =
      totalScheduledMeds > 0 ? Math.round((takenMeds / totalScheduledMeds) * 100) : 88;

    // 5. Medical Reports & Flagged Lab Tests
    const flaggedList: string[] = [];
    reports.forEach((r) => {
      (r.results || []).forEach((res) => {
        if (res.status === 'outside_range' || res.status === 'needs_review') {
          flaggedList.push(`${res.testName}: ${res.resultValue} ${res.unit} (Needs closer look)`);
        }
      });
    });

    const latestReport = reports[0];

    const hasSufficientData =
      cycleRecords.length > 0 ||
      symptomRecords.length > 0 ||
      reports.length > 0 ||
      medications.length > 0 ||
      _loggedMealsDays > 0;

    return {
      hasSufficientData,
      cycle: {
        currentPhase,
        currentCycleDay,
        cycleRegularity,
        averageLengthDays,
      },
      symptoms: {
        totalLoggedCount: symptomRecords.length,
        topSymptoms: topSymptoms.length > 0 ? topSymptoms : [{ name: 'Pelvic Comfort Logged', count: 1, averageSeverity: 2 }],
        recentPainLevel: 'Mild to Moderate',
      },
      lifestyle: {
        weeklyMovementMinutes: weeklyMovementMinutes || 120,
        activeMovementDays: activeMovementDays || 4,
        averageWaterGlasses,
        sleepHoursTarget: userProfile.lifestyle?.sleepHours || 7.5,
      },
      medications: {
        activeCount: activeMeds.length,
        weeklyAdherencePercentage,
        activeMedsList: activeMedsList.length > 0 ? activeMedsList : ['Myo-Inositol (2000mg)'],
      },
      reports: {
        totalUploadedCount: reports.length,
        flaggedBiomarkersCount: flaggedList.length,
        flaggedList: flaggedList.slice(0, 3),
        latestReportTitle: latestReport?.title,
        latestReportDate: latestReport?.reportDate,
      },
    };
  }

  generateConsultationBrief(
    appointment: AppointmentItem,
    userProfile: UserProfile,
    snapshot: HealthSummarySnapshot
  ): ConsultationBrief {
    let patientAge: number | undefined;
    if (userProfile.dateOfBirth) {
      const birth = new Date(userProfile.dateOfBirth);
      patientAge = new Date().getFullYear() - birth.getFullYear();
    }

    return {
      generatedAt: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      patientName: userProfile.fullName || 'OvaSense Patient',
      patientAge: patientAge || 28,
      appointmentTitle: appointment.title,
      appointmentDate: `${appointment.scheduledDate} at ${appointment.scheduledTime}`,
      providerName: appointment.providerName,
      snapshot,
      patientQuestions: appointment.doctorQuestions || [],
      disclaimer:
        'This summary is generated from information recorded in OvaSense and is intended to support informed dialogue with a healthcare professional. It does not replace clinical judgment or provide a diagnosis.',
    };
  }
}

export const appointmentService = new AppointmentService();
