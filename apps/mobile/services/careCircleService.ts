/**
 * BioPulse Mobile — Care Circle Service
 *
 * Dedicated typed service connecting:
 * - public.care_circle_members
 * - public.care_circle_permissions
 * - public.care_circle_invitations
 *
 * Strictly adheres to database check constraints:
 * - role = 'doctor' | 'family' | 'trusted_person'
 * - status = 'pending' | 'active' | 'revoked'
 * - granular permission rows: (member_id, permission_key, enabled)
 * - patient privacy enforcement: members only see permitted categories
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';
import { CareCircleMember } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export type CareCircleRole = 'Doctor' | 'Family Member' | 'Trusted Contact';
export type DbCareCircleRole = 'doctor' | 'family' | 'trusted_person';

export type CareCircleAccessLevel = 'Full Access' | 'View Only' | 'Clinical Summary Only';

export type CareCirclePermissionKey =
  | 'profile'
  | 'cycle'
  | 'symptoms'
  | 'reports'
  | 'diet'
  | 'fitness'
  | 'medications'
  | 'appointments'
  | 'wellness'
  | 'weekly_summary'
  | 'chat_summary';

export type CareCirclePermissionsMap = Record<CareCirclePermissionKey, boolean>;

export interface InviteCareCircleMemberInput {
  name: string;
  email: string;
  role: CareCircleRole;
  relationship?: string;
  accessLevel?: CareCircleAccessLevel;
  customPermissions?: Partial<CareCirclePermissionsMap>;
}

export interface CareCircleInvitation {
  id: string;
  patientId: string;
  inviteToken: string;
  inviteeName: string;
  inviteeEmail: string;
  role: DbCareCircleRole;
  relationship: string;
  permissions: CareCirclePermissionsMap;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

// ============================================================================
// PERMISSION PRESETS & NORMALIZATION HELPERS
// ============================================================================

export const DEFAULT_PERMISSION_KEYS: CareCirclePermissionKey[] = [
  'profile',
  'cycle',
  'symptoms',
  'reports',
  'diet',
  'fitness',
  'medications',
  'appointments',
  'wellness',
  'weekly_summary',
  'chat_summary',
];

export function normalizeRoleToDb(role: CareCircleRole | string): DbCareCircleRole {
  const lower = (role || '').toLowerCase().trim();
  if (lower === 'doctor' || lower === 'dr' || lower === 'physician') {
    return 'doctor';
  }
  if (lower === 'family member' || lower === 'family') {
    return 'family';
  }
  return 'trusted_person';
}

export function normalizeRoleFromDb(dbRole: string): CareCircleRole {
  if (dbRole === 'doctor') return 'Doctor';
  if (dbRole === 'family') return 'Family Member';
  return 'Trusted Contact';
}

/**
 * Build default granular permissions based on role and access level
 */
export function getDefaultPermissionsForRole(
  role: DbCareCircleRole,
  accessLevel: CareCircleAccessLevel = 'Full Access'
): CareCirclePermissionsMap {
  if (role === 'doctor') {
    // Doctors: authorized for medical reports, appointments, cycle, symptoms, medications
    return {
      profile: true,
      cycle: true,
      symptoms: true,
      reports: true,
      diet: true,
      fitness: true,
      medications: true,
      appointments: true,
      wellness: true,
      weekly_summary: true,
      chat_summary: false,
    };
  }

  if (role === 'family') {
    // Family members: basic health tracking and reminders; sensitive raw medical/lab reports excluded by default
    const allowReports = accessLevel === 'Full Access';
    return {
      profile: true,
      cycle: true,
      symptoms: true,
      reports: allowReports,
      diet: true,
      fitness: true,
      medications: true,
      appointments: true,
      wellness: true,
      weekly_summary: true,
      chat_summary: false,
    };
  }

  // Trusted Person / Contact: emergency contact & appointment accompany only
  return {
    profile: true,
    cycle: false,
    symptoms: false,
    reports: false,
    diet: false,
    fitness: false,
    medications: false,
    appointments: true,
    wellness: false,
    weekly_summary: true,
    chat_summary: false,
  };
}

/**
 * Format human-readable access description for UI
 */
export function formatAccessDescription(
  role: DbCareCircleRole,
  permissions?: Partial<CareCirclePermissionsMap>
): string {
  if (role === 'doctor') {
    return 'Medical reports, screening results & clinical logs';
  }
  if (role === 'family') {
    if (permissions?.reports) {
      return 'Full access including diagnostic reports & tracking';
    }
    return 'Basic health summary, symptoms & reminders';
  }
  return 'Emergency contact & scheduled appointments only';
}

// ============================================================================
// CARE CIRCLE SERVICE CLASS
// ============================================================================

export class CareCircleService {
  /**
   * Fetch patient's Care Circle members with their granular permissions
   */
  static async getMembers(
    userId: string,
    token: string
  ): Promise<ApiResponse<CareCircleMember[]>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const url = `${SUPABASE_URL}/rest/v1/care_circle_members?patient_id=eq.${userId}&status=neq.revoked&select=*,care_circle_permissions(*)`;
    const res = await safeRequest<any[]>(url, {
      method: 'GET',
      headers: getSupabaseHeaders(token),
    });

    if (res.error) return { data: null, error: res.error, status: res.status };

    const members: CareCircleMember[] = (res.data || []).map((row: any) => {
      const dbRole: DbCareCircleRole = normalizeRoleToDb(row.role);
      const roleVal: CareCircleRole = normalizeRoleFromDb(dbRole);

      // Extract granular permissions from joined table rows
      const permMap: CareCirclePermissionsMap = { ...getDefaultPermissionsForRole(dbRole) };
      if (Array.isArray(row.care_circle_permissions)) {
        for (const p of row.care_circle_permissions) {
          if (p.permission_key && typeof p.enabled === 'boolean') {
            (permMap as any)[p.permission_key] = p.enabled;
          }
        }
      }

      const accessDesc = formatAccessDescription(dbRole, permMap);

      return {
        id: String(row.id),
        name: row.member_name,
        role: roleVal,
        relationship: row.relationship || (roleVal === 'Doctor' ? 'Specialist Clinician' : 'Care Partner'),
        accessLevel: accessDesc,
        email: row.member_email,
        verified: row.status === 'active',
        permissions: permMap,
        status: row.status as 'pending' | 'active' | 'revoked',
      };
    });

    return { data: members, error: null, status: 200 };
  }

  /**
   * Send an invitation and register member with granular permissions
   */
  static async inviteMember(
    userId: string,
    token: string,
    input: InviteCareCircleMemberInput
  ): Promise<ApiResponse<CareCircleInvitation>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Member name is required.', status: 400 };
    }

    const email = (input.email || `${input.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@care.biopulse.health`).toLowerCase().trim();
    const dbRole = normalizeRoleToDb(input.role);
    const accessLevel = input.accessLevel || 'Full Access';

    // Build permissions map
    const permissions: CareCirclePermissionsMap = {
      ...getDefaultPermissionsForRole(dbRole, accessLevel),
      ...(input.customPermissions || {}),
    };

    const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 1. Insert into care_circle_invitations
    const invPayload = {
      patient_id: userId,
      invite_token: inviteToken,
      invitee_name: input.name.trim(),
      invitee_email: email,
      role: dbRole,
      relationship: input.relationship || '',
      permissions,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    };

    const invUrl = `${SUPABASE_URL}/rest/v1/care_circle_invitations`;
    const invRes = await safeRequest<any[]>(invUrl, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(invPayload),
    });

    if (invRes.error) {
      return { data: null, error: invRes.error, status: invRes.status };
    }

    // 2. Also create corresponding care_circle_members record
    const memPayload = {
      patient_id: userId,
      member_name: input.name.trim(),
      member_email: email,
      role: dbRole,
      relationship: input.relationship || '',
      clinic_organization: dbRole === 'doctor' ? (input.relationship || 'BioPulse Health Network') : '',
      status: 'active',
      invite_token: inviteToken,
    };

    const memUrl = `${SUPABASE_URL}/rest/v1/care_circle_members`;
    const memRes = await safeRequest<any[]>(memUrl, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(memPayload),
    });

    if (memRes.data && Array.isArray(memRes.data) && memRes.data[0]) {
      const memberId = memRes.data[0].id;

      // 3. Insert individual granular rows into care_circle_permissions
      const permRows = Object.entries(permissions).map(([key, enabled]) => ({
        member_id: memberId,
        permission_key: key,
        enabled: Boolean(enabled),
      }));

      await safeRequest(`${SUPABASE_URL}/rest/v1/care_circle_permissions`, {
        method: 'POST',
        headers: {
          ...getSupabaseHeaders(token),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(permRows),
      });
    }

    const row = Array.isArray(invRes.data) && invRes.data[0] ? invRes.data[0] : invPayload;
    return {
      data: {
        id: String(row.id || 'inv_new'),
        patientId: userId,
        inviteToken,
        inviteeName: row.invitee_name,
        inviteeEmail: row.invitee_email,
        role: row.role as DbCareCircleRole,
        relationship: row.relationship || '',
        permissions: row.permissions || permissions,
        status: 'pending',
        expiresAt: row.expires_at,
        createdAt: row.created_at || new Date().toISOString(),
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Update granular permissions for a Care Circle member
   */
  static async updatePermissions(
    memberId: string,
    token: string,
    permissionsUpdate: Partial<CareCirclePermissionsMap> | CareCircleAccessLevel,
    role?: DbCareCircleRole
  ): Promise<ApiResponse<boolean>> {
    if (!memberId || !token) {
      return { data: false, error: 'Member ID and token required.', status: 400 };
    }

    let finalPerms: Partial<CareCirclePermissionsMap> = {};
    if (typeof permissionsUpdate === 'string') {
      finalPerms = getDefaultPermissionsForRole(role || 'family', permissionsUpdate);
    } else {
      finalPerms = permissionsUpdate;
    }

    // Upsert each permission key
    const permRows = Object.entries(finalPerms).map(([key, enabled]) => ({
      member_id: memberId,
      permission_key: key,
      enabled: Boolean(enabled),
    }));

    const url = `${SUPABASE_URL}/rest/v1/care_circle_permissions`;
    const res = await safeRequest(url, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(token),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(permRows),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  /**
   * Revoke member access immediately.
   * Updates status to 'revoked' so has_care_circle_permission() shuts off immediately.
   */
  static async revokeMember(
    memberId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!memberId || !token) {
      return { data: false, error: 'Member ID and token required.', status: 400 };
    }

    // 1. Mark member status as revoked
    const memUrl = `${SUPABASE_URL}/rest/v1/care_circle_members?id=eq.${memberId}`;
    const memRes = await safeRequest(memUrl, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify({ status: 'revoked' }),
    });

    // 2. Mark any related invitations as revoked
    await safeRequest(`${SUPABASE_URL}/rest/v1/care_circle_invitations?member_id=eq.${memberId}`, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify({ status: 'revoked' }),
    });

    return { data: !memRes.error, error: memRes.error, status: memRes.status };
  }

  /**
   * Check whether a specific permission is granted for a member
   */
  static hasPermission(
    member: CareCircleMember,
    permissionKey: CareCirclePermissionKey
  ): boolean {
    if (!member.verified || member.status === 'revoked') {
      return false;
    }
    if (!member.permissions) {
      const dbRole = normalizeRoleToDb(member.role);
      const defaults = getDefaultPermissionsForRole(dbRole);
      return Boolean(defaults[permissionKey]);
    }
    return Boolean((member.permissions as any)[permissionKey]);
  }
}

export const careCircleService = CareCircleService;
