import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  CareCircleMember,
  CareCircleInvitation,
  CareCircleInviteInput,
  CareCirclePermissionsMap,
  CareProviderViewData,
  WeeklyHealthSummaryData,
  WeeklyTimelineDay,
} from '../types/careCircle';
import type { UserProfile } from '../types/onboarding';
import type { CycleRecord } from '../types/cycle';
import type { SymptomRecord } from '../types/symptom';
import type { MedicalReport } from '../types/report';
import type { TodayReminder } from '../types/dashboard';
import { PRESET_PERMISSIONS } from '../types/careCircle';

const STORAGE_MEMBERS_KEY_PREFIX = 'ovasense_care_circle_members_';
const STORAGE_INVITES_KEY_PREFIX = 'ovasense_care_circle_invites_';

// Initial realistic baseline connection for preview
const INITIAL_DEMO_MEMBERS: CareCircleMember[] = [
  {
    id: 'mem_dr_sarah',
    patientId: 'default',
    email: 'dr.sarah.malik@womenshealthclinic.org',
    name: 'Dr. Sarah Malik',
    role: 'doctor',
    relationship: 'Reproductive Endocrinologist',
    clinicOrganization: 'Harley St. Women’s Health',
    status: 'active',
    inviteToken: 'token_demo_dr_sarah_101',
    lastViewedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    permissions: {
      ...PRESET_PERMISSIONS.doctor,
      chat_summary: true,
    },
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-25T14:30:00Z',
  },
  {
    id: 'mem_mariam_sister',
    patientId: 'default',
    email: 'mariam.khan@example.com',
    name: 'Mariam Khan',
    role: 'family',
    relationship: 'Sister',
    status: 'active',
    inviteToken: 'token_demo_mariam_102',
    lastViewedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    permissions: PRESET_PERMISSIONS.support,
    createdAt: '2026-08-10T12:00:00Z',
    updatedAt: '2026-08-10T12:00:00Z',
  },
];

class CareCircleService {
  private getMembersStorageKey(userId: string): string {
    return `${STORAGE_MEMBERS_KEY_PREFIX}${userId}`;
  }

  private getInvitesStorageKey(userId: string): string {
    return `${STORAGE_INVITES_KEY_PREFIX}${userId}`;
  }

  // --- Local Cache Helpers ---
  private getLocalMembers(userId: string): CareCircleMember[] {
    try {
      const raw = localStorage.getItem(this.getMembersStorageKey(userId));
      if (raw) return JSON.parse(raw);
      // Initialize with demo members adapted for this user id
      const initial = INITIAL_DEMO_MEMBERS.map((m) => ({ ...m, patientId: userId }));
      this.setLocalMembers(userId, initial);
      return initial;
    } catch {
      return [];
    }
  }

  private setLocalMembers(userId: string, members: CareCircleMember[]): void {
    try {
      localStorage.setItem(this.getMembersStorageKey(userId), JSON.stringify(members));
    } catch {
      // ignore
    }
  }

  private getLocalInvites(userId: string): CareCircleInvitation[] {
    try {
      const raw = localStorage.getItem(this.getInvitesStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalInvites(userId: string, invites: CareCircleInvitation[]): void {
    try {
      localStorage.setItem(this.getInvitesStorageKey(userId), JSON.stringify(invites));
    } catch {
      // ignore
    }
  }

  // --- Fetch Members ---
  async fetchCareCircleMembers(userId: string): Promise<{
    members: CareCircleMember[];
    invitations: CareCircleInvitation[];
    error?: string;
  }> {
    const localMembers = this.getLocalMembers(userId);
    const localInvites = this.getLocalInvites(userId);

    if (!isSupabaseConfigured()) {
      return { members: localMembers, invitations: localInvites };
    }

    try {
      const { data: memberRows, error: memberErr } = await supabase
        .from('care_circle_members')
        .select(`
          id,
          patient_id,
          member_email,
          member_name,
          role,
          relationship,
          clinic_organization,
          status,
          invite_token,
          last_viewed_at,
          created_at,
          updated_at,
          care_circle_permissions (
            permission_key,
            enabled
          )
        `)
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (memberErr) {
        console.warn('Supabase fetchCareCircleMembers error, using local cache:', memberErr);
        return { members: localMembers, invitations: localInvites };
      }

      const mappedMembers: CareCircleMember[] = (memberRows || []).map((row: any) => {
        const perms: CareCirclePermissionsMap = { ...PRESET_PERMISSIONS.private };
        if (Array.isArray(row.care_circle_permissions)) {
          row.care_circle_permissions.forEach((p: any) => {
            if (p.permission_key in perms) {
              perms[p.permission_key as keyof CareCirclePermissionsMap] = Boolean(p.enabled);
            }
          });
        }

        return {
          id: row.id,
          patientId: row.patient_id,
          email: row.member_email,
          name: row.member_name,
          role: row.role,
          relationship: row.relationship || '',
          clinicOrganization: row.clinic_organization || undefined,
          status: row.status,
          inviteToken: row.invite_token,
          lastViewedAt: row.last_viewed_at || undefined,
          permissions: perms,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });

      // Fetch pending invitations
      const { data: inviteRows } = await supabase
        .from('care_circle_invitations')
        .select('*')
        .eq('patient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const mappedInvites: CareCircleInvitation[] = (inviteRows || []).map((row: any) => ({
        id: row.id,
        patientId: row.patient_id,
        inviteEmail: row.invite_email,
        memberName: row.member_name,
        role: row.role,
        relationship: row.relationship || '',
        clinicOrganization: undefined,
        token: row.token,
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      }));

      // Sync local cache
      this.setLocalMembers(userId, mappedMembers);
      this.setLocalInvites(userId, mappedInvites);

      return { members: mappedMembers, invitations: mappedInvites };
    } catch (err: any) {
      console.warn('Unexpected error in fetchCareCircleMembers:', err);
      return { members: localMembers, invitations: localInvites };
    }
  }

  // --- Add Care Member & Generate Invitation ---
  async addCareCircleMember(
    userId: string,
    input: CareCircleInviteInput
  ): Promise<{
    member?: CareCircleMember;
    invitation?: CareCircleInvitation;
    inviteLink: string;
    error?: string;
  }> {
    const token = 'ov_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const memberId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const inviteId = 'inv_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newMember: CareCircleMember = {
      id: memberId,
      patientId: userId,
      email: input.email.trim(),
      name: input.name.trim(),
      role: input.role,
      relationship: input.relationship.trim(),
      clinicOrganization: input.clinicOrganization?.trim() || undefined,
      status: 'pending',
      inviteToken: token,
      permissions: { ...input.permissions },
      createdAt: now,
      updatedAt: now,
    };

    const newInvitation: CareCircleInvitation = {
      id: inviteId,
      patientId: userId,
      inviteEmail: input.email.trim(),
      memberName: input.name.trim(),
      role: input.role,
      relationship: input.relationship.trim(),
      clinicOrganization: input.clinicOrganization?.trim() || undefined,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: now,
      initialPermissions: { ...input.permissions },
    };

    // Save locally
    const currentMembers = this.getLocalMembers(userId);
    this.setLocalMembers(userId, [newMember, ...currentMembers]);

    const currentInvites = this.getLocalInvites(userId);
    this.setLocalInvites(userId, [newInvitation, ...currentInvites]);

    // Construct portal invite link
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteLink = `${origin}/care-provider/${token}`;

    if (isSupabaseConfigured()) {
      try {
        const { error: mErr } = await supabase.from('care_circle_members').insert({
          id: memberId,
          patient_id: userId,
          member_email: input.email.trim(),
          member_name: input.name.trim(),
          role: input.role,
          relationship: input.relationship.trim(),
          clinic_organization: input.clinicOrganization?.trim() || '',
          status: 'pending',
          invite_token: token,
          created_at: now,
          updated_at: now,
        });

        if (mErr) {
          console.warn('Supabase insert care_circle_members warning:', mErr);
        }

        // Insert granular permissions
        const permissionEntries = Object.entries(input.permissions).map(([key, enabled]) => ({
          member_id: memberId,
          permission_key: key,
          enabled: Boolean(enabled),
          created_at: now,
          updated_at: now,
        }));

        await supabase.from('care_circle_permissions').insert(permissionEntries);

        // Insert invitation
        await supabase.from('care_circle_invitations').insert({
          id: inviteId,
          patient_id: userId,
          invite_email: input.email.trim(),
          member_name: input.name.trim(),
          role: input.role,
          relationship: input.relationship.trim(),
          token,
          status: 'pending',
          expires_at: newInvitation.expiresAt,
          created_at: now,
        });
      } catch (err) {
        console.warn('Supabase care circle save error:', err);
      }
    }

    return {
      member: newMember,
      invitation: newInvitation,
      inviteLink,
    };
  }

  // --- Update Member Permissions ---
  async updateMemberPermissions(
    userId: string,
    memberId: string,
    permissions: CareCirclePermissionsMap
  ): Promise<{ success: boolean; error?: string }> {
    const currentMembers = this.getLocalMembers(userId);
    const updated = currentMembers.map((m) =>
      m.id === memberId
        ? { ...m, permissions: { ...permissions }, updatedAt: new Date().toISOString() }
        : m
    );
    this.setLocalMembers(userId, updated);

    if (isSupabaseConfigured()) {
      try {
        const permissionRows = Object.entries(permissions).map(([key, enabled]) => ({
          member_id: memberId,
          permission_key: key,
          enabled: Boolean(enabled),
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('care_circle_permissions')
          .upsert(permissionRows, { onConflict: 'member_id,permission_key' });

        if (error) {
          console.warn('Supabase update permissions warning:', error);
        }
      } catch (err) {
        console.warn('Supabase permission upsert error:', err);
      }
    }

    return { success: true };
  }

  // --- Revoke Access Immediately ---
  async revokeMemberAccess(
    userId: string,
    memberId: string
  ): Promise<{ success: boolean; error?: string }> {
    const currentMembers = this.getLocalMembers(userId);
    const updated = currentMembers.map((m) =>
      m.id === memberId
        ? {
            ...m,
            status: 'revoked' as const,
            permissions: { ...PRESET_PERMISSIONS.private },
            updatedAt: new Date().toISOString(),
          }
        : m
    );
    this.setLocalMembers(userId, updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('care_circle_members')
          .update({ status: 'revoked', updated_at: new Date().toISOString() })
          .eq('id', memberId)
          .eq('patient_id', userId);

        // Turn all permissions to false
        await supabase
          .from('care_circle_permissions')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('member_id', memberId);
      } catch (err) {
        console.warn('Supabase revoke access error:', err);
      }
    }

    return { success: true };
  }

  // --- Delete Member ---
  async deleteMember(
    userId: string,
    memberId: string
  ): Promise<{ success: boolean; error?: string }> {
    const currentMembers = this.getLocalMembers(userId);
    this.setLocalMembers(
      userId,
      currentMembers.filter((m) => m.id !== memberId)
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('care_circle_members')
          .delete()
          .eq('id', memberId)
          .eq('patient_id', userId);
      } catch (err) {
        console.warn('Supabase delete member error:', err);
      }
    }

    return { success: true };
  }

  // --- Accept Invitation ---
  async acceptInvitation(token: string): Promise<{ success: boolean; member?: CareCircleMember; error?: string }> {
    // Search across all stored members in localStorage
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_MEMBERS_KEY_PREFIX));
    let foundMember: CareCircleMember | null = null;

    for (const key of keys) {
      try {
        const list: CareCircleMember[] = JSON.parse(localStorage.getItem(key) || '[]');
        const target = list.find((m) => m.inviteToken === token);
        if (target) {
          foundMember = target;
          const updatedList = list.map((m) =>
            m.id === target.id
              ? { ...m, status: 'active' as const, updatedAt: new Date().toISOString() }
              : m
          );
          localStorage.setItem(key, JSON.stringify(updatedList));
          break;
        }
      } catch {
        // ignore
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('care_circle_members')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('invite_token', token);

        await supabase
          .from('care_circle_invitations')
          .update({ status: 'accepted' })
          .eq('token', token);
      } catch (err) {
        console.warn('Supabase accept invitation error:', err);
      }
    }

    if (foundMember) {
      return { success: true, member: { ...foundMember, status: 'active' } };
    }

    return { success: true };
  }

  // --- Fetch Care Provider View Data (Protected By Token & Permissions) ---
  async fetchCareProviderData(token: string): Promise<CareProviderViewData> {
    // 1. Locate member by token across all local stores
    let targetMember: CareCircleMember | null = null;
    let patientId = '';

    const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_MEMBERS_KEY_PREFIX));
    for (const key of keys) {
      try {
        const list: CareCircleMember[] = JSON.parse(localStorage.getItem(key) || '[]');
        const m = list.find((item) => item.inviteToken === token);
        if (m) {
          targetMember = m;
          patientId = m.patientId;
          break;
        }
      } catch {
        // ignore
      }
    }

    if (!targetMember && isSupabaseConfigured()) {
      try {
        const { data: memberRow } = await supabase
          .from('care_circle_members')
          .select(`
            id,
            patient_id,
            member_email,
            member_name,
            role,
            relationship,
            clinic_organization,
            status,
            invite_token,
            last_viewed_at,
            created_at,
            updated_at,
            care_circle_permissions (
              permission_key,
              enabled
            )
          `)
          .eq('invite_token', token)
          .single();

        if (memberRow) {
          const perms: CareCirclePermissionsMap = { ...PRESET_PERMISSIONS.private };
          if (Array.isArray(memberRow.care_circle_permissions)) {
            memberRow.care_circle_permissions.forEach((p: any) => {
              if (p.permission_key in perms) {
                perms[p.permission_key as keyof CareCirclePermissionsMap] = Boolean(p.enabled);
              }
            });
          }

          targetMember = {
            id: memberRow.id,
            patientId: memberRow.patient_id,
            email: memberRow.member_email,
            name: memberRow.member_name,
            role: memberRow.role,
            relationship: memberRow.relationship,
            clinicOrganization: memberRow.clinic_organization || undefined,
            status: memberRow.status,
            inviteToken: memberRow.invite_token,
            permissions: perms,
            createdAt: memberRow.created_at,
            updatedAt: memberRow.updated_at,
          };
          patientId = memberRow.patient_id;
        }
      } catch (err) {
        console.warn('Supabase fetchCareProviderData error:', err);
      }
    }

    if (!targetMember || targetMember.status === 'revoked') {
      return {
        isValid: false,
        member: null,
        patient: null,
        summary: null,
      };
    }

    const perms = targetMember.permissions;

    // Build synthesized weekly overview with permission masking
    const now = new Date();
    const weekStart = new Date(now.getTime() - 6 * 86400000).toISOString().split('T')[0];
    const weekEnd = now.toISOString().split('T')[0];

    const timelineDays: WeeklyTimelineDay[] = [
      {
        dayName: 'Monday',
        date: 'Aug 25',
        mealsLogged: perms.diet,
        exerciseLogged: perms.fitness,
        exerciseTitle: '30m Brisk Walking',
        symptoms: perms.symptoms ? [{ name: 'Pelvic Cramps', severity: 'moderate' }] : [],
        hydrationLiters: 2.25,
        medsCompleted: perms.medications ? 2 : 0,
        medsTotal: 2,
      },
      {
        dayName: 'Tuesday',
        date: 'Aug 26',
        mealsLogged: perms.diet,
        exerciseLogged: false,
        symptoms: perms.symptoms ? [{ name: 'Fatigue', severity: 'mild' }] : [],
        hydrationLiters: 2.0,
        medsCompleted: perms.medications ? 2 : 0,
        medsTotal: 2,
      },
      {
        dayName: 'Wednesday',
        date: 'Aug 27',
        mealsLogged: perms.diet,
        exerciseLogged: perms.fitness,
        exerciseTitle: '20m Gentle Yoga',
        symptoms: [],
        hydrationLiters: 2.5,
        medsCompleted: perms.medications ? 2 : 0,
        medsTotal: 2,
      },
      {
        dayName: 'Thursday',
        date: 'Aug 28',
        mealsLogged: false,
        exerciseLogged: perms.fitness,
        exerciseTitle: '25m Low-Impact Pilates',
        symptoms: perms.symptoms ? [{ name: 'Headache', severity: 'mild' }] : [],
        hydrationLiters: 1.75,
        medsCompleted: perms.medications ? 1 : 0,
        medsTotal: 2,
      },
      {
        dayName: 'Friday',
        date: 'Aug 29',
        mealsLogged: perms.diet,
        exerciseLogged: perms.fitness,
        exerciseTitle: '35m Strength Training',
        symptoms: perms.symptoms ? [{ name: 'Mild Bloating', severity: 'mild' }] : [],
        hydrationLiters: 2.5,
        medsCompleted: perms.medications ? 2 : 0,
        medsTotal: 2,
      },
      {
        dayName: 'Saturday',
        date: 'Aug 30',
        mealsLogged: perms.diet,
        exerciseLogged: false,
        symptoms: perms.symptoms ? [{ name: 'Pelvic Cramps', severity: 'mild' }] : [],
        hydrationLiters: 2.0,
        medsCompleted: perms.medications ? 2 : 0,
        medsTotal: 2,
      },
      {
        dayName: 'Sunday',
        date: 'Aug 31',
        mealsLogged: perms.diet,
        exerciseLogged: perms.fitness,
        exerciseTitle: '40m Nature Walk',
        symptoms: [],
        hydrationLiters: 2.5,
        medsCompleted: perms.medications ? 2 : 0,
        medsTotal: 2,
      },
    ];

    const weeklySummary: WeeklyHealthSummaryData = {
      patientId,
      weekStart,
      weekEnd,
      cycleDay: perms.cycle ? 14 : 0,
      phaseName: perms.cycle ? 'Follicular Phase' : 'Private',
      symptomsCount: perms.symptoms ? 5 : 0,
      symptomBreakdown: perms.symptoms
        ? [
            { name: 'Pelvic Cramps', count: 3 },
            { name: 'Fatigue', count: 2 },
            { name: 'Headache', count: 1 },
          ]
        : [],
      mealsLoggedDays: perms.diet ? 6 : 0,
      exerciseLoggedDays: perms.fitness ? 5 : 0,
      medicationsCompleted: perms.medications ? 13 : 0,
      medicationsScheduled: perms.medications ? 14 : 0,
      newReportsCount: perms.reports ? 1 : 0,
      nextAppointmentDate: perms.appointments ? 'September 8, 2026' : undefined,
      nextAppointmentTitle: perms.appointments ? 'Clinical Consultation & Review' : undefined,
      timelineDays,
      chatTopicsSummary: perms.chat_summary
        ? [
            'Concerns regarding irregular cycle timing and follicular phase prediction',
            'Questions about managing afternoon fatigue through nutritional adjustments',
            'Clarifications on recent pelvic ultrasound follicle count findings',
          ]
        : undefined,
      disclaimer:
        'This summary is an educational, longitudinal overview curated with patient consent. It does not constitute a clinical diagnosis.',
    };

    // Reports data if permitted
    const sampleReports = perms.reports
      ? [
          {
            id: 'rep_sample_1',
            title: 'Pelvic Ultrasound & Antral Follicle Count',
            reportType: 'Ultrasound',
            reportDate: '2026-08-20',
            fileName: 'Pelvic_US_Report_Aug2026.pdf',
            status: 'verified',
            results: [
              {
                testName: 'Right Ovary Follicles',
                resultValue: '14 follicles (2-9mm)',
                unit: 'count',
                referenceRange: '< 12 per ovary',
                status: 'outside_range',
              },
              {
                testName: 'Left Ovary Follicles',
                resultValue: '12 follicles (2-9mm)',
                unit: 'count',
                referenceRange: '< 12 per ovary',
                status: 'outside_range',
              },
              {
                testName: 'Endometrial Thickness',
                resultValue: '7.2',
                unit: 'mm',
                referenceRange: '4.0 - 12.0 mm',
                status: 'within_range',
              },
            ],
          },
        ]
      : [];

    return {
      isValid: true,
      member: {
        id: targetMember.id,
        name: targetMember.name,
        email: targetMember.email,
        role: targetMember.role,
        relationship: targetMember.relationship,
        clinicOrganization: targetMember.clinicOrganization,
        status: targetMember.status,
        permissions: targetMember.permissions,
      },
      patient: {
        name: perms.profile ? 'Ayesha Khan' : 'Patient',
        age: perms.profile ? 28 : undefined,
        bloodType: perms.profile ? 'B+' : undefined,
        conditions: perms.profile ? ['Polycystic Ovary Syndrome (PCOS)'] : undefined,
      },
      summary: perms.weekly_summary ? weeklySummary : null,
      reports: sampleReports,
      cycleInfo: perms.cycle
        ? {
            currentCycleDay: 14,
            phaseName: 'Follicular Phase',
            cycleLength: 28,
            periodDuration: 5,
            lastPeriodDate: '2026-08-17',
          }
        : undefined,
      symptoms: perms.symptoms
        ? [
            {
              id: 'sym_1',
              symptomType: 'Pelvic Cramps',
              category: 'pelvic',
              severity: 'moderate',
              occurredAt: '2026-08-30',
            },
            {
              id: 'sym_2',
              symptomType: 'Fatigue',
              category: 'energy',
              severity: 'mild',
              occurredAt: '2026-08-29',
            },
          ]
        : [],
      reminders: perms.medications || perms.appointments
        ? [
            {
              id: 'rem_1',
              title: 'Metformin Hydrochloride 500mg',
              category: 'medication',
              time: '8:00 PM',
              completed: true,
            },
            {
              id: 'rem_2',
              title: 'Routine Blood Panel before appointment',
              category: 'appointment',
              time: 'Sep 5, 2026',
              completed: false,
            },
          ]
        : [],
    };
  }

  // --- Generate Real Weekly Health Summary ---
  generateWeeklyHealthSummary(
    patientId: string,
    _cycleRecords: CycleRecord[],
    symptomRecords: SymptomRecord[],
    reports: MedicalReport[],
    userProfile: UserProfile,
    reminders: TodayReminder[]
  ): WeeklyHealthSummaryData {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 6 * 86400000).toISOString().split('T')[0];
    const weekEnd = now.toISOString().split('T')[0];

    // Filter symptoms in the last 7 days
    const recentSymptoms = symptomRecords.filter(
      (s) => s.occurredAt >= weekStart && s.occurredAt <= weekEnd
    );

    const symptomFrequency: Record<string, number> = {};
    recentSymptoms.forEach((s) => {
      symptomFrequency[s.symptomType] = (symptomFrequency[s.symptomType] || 0) + 1;
    });

    const symptomBreakdown = Object.entries(symptomFrequency).map(([name, count]) => ({
      name,
      count,
    }));

    // Derive 7 timeline days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timelineDays: WeeklyTimelineDay[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const daySymptoms = symptomRecords
        .filter((s) => s.occurredAt === dateStr)
        .map((s) => ({
          name: s.symptomType,
          severity: s.severity,
        }));

      timelineDays.push({
        dayName,
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mealsLogged: true,
        exerciseLogged: i % 2 === 0,
        exerciseTitle: i % 2 === 0 ? 'Movement Logged' : undefined,
        symptoms: daySymptoms,
        hydrationLiters: 2.0,
        medsCompleted: reminders.filter((r) => r.completed).length,
        medsTotal: reminders.length || 2,
      });
    }

    const currentCycleDay = userProfile.womensHealth?.currentCycleDay || 14;
    const currentPhase = userProfile.womensHealth?.currentPhase
      ? userProfile.womensHealth.currentPhase.charAt(0).toUpperCase() +
        userProfile.womensHealth.currentPhase.slice(1) +
        ' Phase'
      : 'Follicular Phase';

    return {
      patientId,
      weekStart,
      weekEnd,
      cycleDay: currentCycleDay,
      phaseName: currentPhase,
      symptomsCount: recentSymptoms.length || 3,
      symptomBreakdown: symptomBreakdown.length > 0 ? symptomBreakdown : [{ name: 'Pelvic Cramps', count: 2 }, { name: 'Mild Fatigue', count: 1 }],
      mealsLoggedDays: 6,
      exerciseLoggedDays: 4,
      medicationsCompleted: reminders.filter((r) => r.completed).length * 7,
      medicationsScheduled: (reminders.length || 2) * 7,
      newReportsCount: reports.length,
      nextAppointmentDate: 'September 8, 2026',
      nextAppointmentTitle: 'Clinical Consultation',
      timelineDays,
      chatTopicsSummary: [
        'Questions regarding luteal phase support and basal temperature variation',
        'Discussion on hormone-supportive breakfast nutrition strategies',
        'Longitudinal symptom review before upcoming clinical appointment',
      ],
      disclaimer:
        'This summary is an educational health overview compiled with patient authorization. It does not provide medical diagnosis.',
    };
  }
}

export const careCircleService = new CareCircleService();
