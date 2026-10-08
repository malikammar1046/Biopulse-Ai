/**
 * BioPulse Mobile — Notification Service
 *
 * Manages user notification preferences, notification feeds,
 * and synthesized clinical reminders based on authenticated user data.
 *
 * Scoped strictly to the authenticated user via Supabase session token.
 */

import {
  SUPABASE_URL,
  getSupabaseHeaders,
  safeRequest,
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from './api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NotificationPreferences {
  medicationDue: boolean;
  periodPredicted: boolean;
  appointmentTomorrow: boolean;
  labUploadProcessed: boolean;
  screeningFollowUp: boolean;
  newRecommendation: boolean;
  appUpdates: boolean;
  marketingUpdates: boolean;
}

export interface MobileNotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  section: 'Today' | 'Yesterday';
  category: 'Reminders' | 'System';
  isRead: boolean;
  iconName: string;
  iconColor: string;
  iconBg: string;
  route?: string;
  createdAt: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  medicationDue: true,
  periodPredicted: true,
  appointmentTomorrow: true,
  labUploadProcessed: true,
  screeningFollowUp: true,
  newRecommendation: true,
  appUpdates: false,
  marketingUpdates: false,
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const notificationService = {
  /**
   * Get user notification preferences
   * Fetches preferences from public.profiles or returns authenticated defaults
   */
  async getPreferences(
    token: string,
    userId: string
  ): Promise<ApiResponse<NotificationPreferences>> {
    if (!token || !userId) {
      return createErrorResponse<NotificationPreferences>(
        'Authentication required to fetch notification preferences',
        401
      );
    }

    try {
      const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=support_preference`;
      const res = await safeRequest<Array<{ support_preference: string | null }>>(url, {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      });

      if (res.error) {
        return createErrorResponse<NotificationPreferences>(res.error, res.status);
      }

      const row = res.data && res.data.length > 0 ? res.data[0] : null;

      if (row?.support_preference && row.support_preference.startsWith('{')) {
        try {
          const parsed = JSON.parse(row.support_preference);
          return createSuccessResponse<NotificationPreferences>({
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...parsed,
          });
        } catch {
          // Fall through to defaults
        }
      }

      return createSuccessResponse<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
    } catch (err: any) {
      return createErrorResponse<NotificationPreferences>(
        err?.message || 'Failed to fetch notification preferences',
        500
      );
    }
  },

  /**
   * Update user notification preferences
   * Persists to public.profiles scoped to authenticated user
   */
  async updatePreferences(
    token: string,
    userId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    if (!token || !userId) {
      return createErrorResponse<NotificationPreferences>(
        'Authentication required to update notification preferences',
        401
      );
    }

    try {
      const currentRes = await this.getPreferences(token, userId);
      const current = currentRes.data || DEFAULT_NOTIFICATION_PREFERENCES;
      const merged: NotificationPreferences = { ...current, ...prefs };
      const serialized = JSON.stringify(merged);

      const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
      const res = await safeRequest<any>(url, {
        method: 'PATCH',
        headers: {
          ...getSupabaseHeaders(token),
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ support_preference: serialized }),
      });

      if (res.error) {
        return createErrorResponse<NotificationPreferences>(res.error, res.status);
      }

      return createSuccessResponse<NotificationPreferences>(merged);
    } catch (err: any) {
      return createErrorResponse<NotificationPreferences>(
        err?.message || 'Failed to update preferences',
        500
      );
    }
  },

  /**
   * Build real authenticated notification items from active health alerts
   * Synthesizes from actual user appointments, medications, lab reports, and assessments.
   */
  async getNotifications(
    token: string,
    userId: string,
    pathway: 'female' | 'male' | 'male_hypogonadism' = 'female'
  ): Promise<ApiResponse<MobileNotificationItem[]>> {
    if (!token || !userId) {
      return createErrorResponse<MobileNotificationItem[]>(
        'Authentication required to fetch notifications',
        401
      );
    }

    try {
      const notifs: MobileNotificationItem[] = [];
      const now = new Date();
      const isFemale = pathway !== 'male' && pathway !== 'male_hypogonadism';

      // 1. Check pending/upcoming appointments
      const aptUrl = `${SUPABASE_URL}/rest/v1/appointments?user_id=eq.${userId}&status=eq.scheduled&order=appointment_date.asc&limit=1`;
      const aptRes = await safeRequest<any[]>(aptUrl, {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      });

      if (aptRes.data && aptRes.data.length > 0) {
        const apt = aptRes.data[0];
        notifs.push({
          id: `notif-apt-${apt.id}`,
          title: 'Upcoming appointment',
          subtitle: `${apt.doctor_name || 'Specialist'}\n${apt.appointment_date} at ${apt.appointment_time || 'Scheduled time'}`,
          time: apt.appointment_time || 'Upcoming',
          section: 'Today',
          category: 'Reminders',
          isRead: false,
          iconName: 'calendar',
          iconColor: '#0284C7',
          iconBg: '#E0F2FE',
          route: '/(app)/appointments',
          createdAt: now.toISOString(),
        });
      }

      // 2. Check active medications due
      const medUrl = `${SUPABASE_URL}/rest/v1/medications?user_id=eq.${userId}&is_active=eq.true&limit=2`;
      const medRes = await safeRequest<any[]>(medUrl, {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      });

      if (medRes.data && medRes.data.length > 0) {
        for (const med of medRes.data) {
          notifs.push({
            id: `notif-med-${med.id}`,
            title: 'Medication due',
            subtitle: `${med.name} ${med.dosage || ''}\n${med.frequency || 'Take scheduled dose'}`,
            time: Array.isArray(med.times_of_day) && med.times_of_day[0] ? med.times_of_day[0] : '8:00 PM',
            section: 'Today',
            category: 'Reminders',
            isRead: false,
            iconName: 'medkit',
            iconColor: '#E11D48',
            iconBg: '#FCE7F3',
            route: '/(app)/medications',
            createdAt: now.toISOString(),
          });
        }
      }

      // 3. Check recently processed medical reports
      const repUrl = `${SUPABASE_URL}/rest/v1/medical_reports?user_id=eq.${userId}&order=created_at.desc&limit=1`;
      const repRes = await safeRequest<any[]>(repUrl, {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      });

      if (repRes.data && repRes.data.length > 0) {
        const rep = repRes.data[0];
        notifs.push({
          id: `notif-rep-${rep.id}`,
          title: rep.status === 'completed' ? 'Lab upload processed' : 'Lab report processing',
          subtitle: `${rep.file_name || 'Hormone report'}\nhas been successfully analyzed.`,
          time: '09:15 AM',
          section: 'Today',
          category: 'System',
          isRead: true,
          iconName: 'document-text',
          iconColor: '#0284C7',
          iconBg: '#E0F2FE',
          route: '/(app)/add-labs',
          createdAt: rep.created_at || now.toISOString(),
        });
      }

      // 4. Check screening follow-up
      const assmUrl = `${SUPABASE_URL}/rest/v1/screening_assessments?user_id=eq.${userId}&order=created_at.desc&limit=1`;
      const assmRes = await safeRequest<any[]>(assmUrl, {
        method: 'GET',
        headers: getSupabaseHeaders(token),
      });

      if (assmRes.data && assmRes.data.length > 0) {
        const assm = assmRes.data[0];
        notifs.push({
          id: `notif-scr-${assm.id}`,
          title: 'Screening follow-up',
          subtitle: `Your ${assm.risk_level || 'health'} screening has recommendations. Consider clinical review.`,
          time: '5:20 PM',
          section: 'Yesterday',
          category: 'Reminders',
          isRead: false,
          iconName: 'analytics-outline',
          iconColor: '#E11D48',
          iconBg: '#FCE7F3',
          route: '/(app)/screening',
          createdAt: assm.created_at || now.toISOString(),
        });
      } else {
        notifs.push({
          id: 'notif-scr-prompt',
          title: isFemale ? 'PCOS Screening Ready' : 'Hormonal Vitality Screening Ready',
          subtitle: 'Complete your baseline screening assessment for personalized insights.',
          time: 'Today',
          section: 'Today',
          category: 'System',
          isRead: false,
          iconName: 'clipboard-outline',
          iconColor: '#0284C7',
          iconBg: '#E0F2FE',
          route: '/(app)/screening',
          createdAt: now.toISOString(),
        });
      }

      return createSuccessResponse<MobileNotificationItem[]>(notifs);
    } catch (err: any) {
      return createErrorResponse<MobileNotificationItem[]>(
        err?.message || 'Failed to fetch notifications',
        500
      );
    }
  },
};
