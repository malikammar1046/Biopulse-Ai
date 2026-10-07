/**
 * BioPulse Mobile — Care Circle Service
 *
 * Dedicated typed service connecting:
 * - public.care_circle_members
 * - public.care_circle_permissions
 * - public.care_circle_invitations
 * Respects clinical permissions architecture (Full Access, View Only, Clinical Summary Only).
 */

import { SUPABASE_URL, getSupabaseHeaders, safeRequest, ApiResponse } from './api';
import { CareCircleMember } from '../store/healthStore';

// ============================================================================
// TYPES
// ============================================================================

export type CareCircleRole = 'Doctor' | 'Family Member' | 'Trusted Contact';
export type CareCircleAccessLevel = 'Full Access' | 'View Only' | 'Clinical Summary Only';

export interface InviteCareCircleMemberInput {
  name: string;
  email: string;
  role: CareCircleRole;
  relationship?: string;
  accessLevel: CareCircleAccessLevel;
}

export interface CareCircleInvitation {
  id: string;
  patientId: string;
  inviteeEmail: string;
  role: string;
  accessLevel: string;
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: string;
  createdAt: string;
}

// ============================================================================
// CARE CIRCLE SERVICE CLASS
// ============================================================================

export class CareCircleService {
  /**
   * Fetch patient's Care Circle members
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
      let roleVal: CareCircleRole = 'Trusted Contact';
      if (row.role === 'doctor') roleVal = 'Doctor';
      else if (row.role === 'family') roleVal = 'Family Member';

      const perm = Array.isArray(row.care_circle_permissions) && row.care_circle_permissions[0]
        ? row.care_circle_permissions[0]
        : {};

      return {
        id: String(row.id),
        name: row.member_name,
        role: roleVal,
        relationship: row.relationship || '',
        accessLevel: perm.access_level || 'Full Access',
        email: row.member_email,
        verified: row.status === 'active',
      };
    });

    return { data: members, error: null, status: 200 };
  }

  /**
   * Send an invitation to a doctor, family member, or trusted contact
   */
  static async inviteMember(
    userId: string,
    token: string,
    input: InviteCareCircleMemberInput
  ): Promise<ApiResponse<CareCircleInvitation>> {
    if (!userId || !token) {
      return { data: null, error: 'User is not authenticated.', status: 401 };
    }

    const roleDb = input.role === 'Doctor' ? 'doctor' : input.role === 'Family Member' ? 'family' : 'trusted_contact';

    // 1. Create invitation record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invPayload = {
      patient_id: userId,
      invitee_email: input.email.toLowerCase().trim(),
      role: roleDb,
      relationship: input.relationship || null,
      access_level: input.accessLevel,
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

    if (invRes.error) return { data: null, error: invRes.error, status: invRes.status };

    // 2. Also create active member placeholder
    const memPayload = {
      patient_id: userId,
      member_name: input.name,
      member_email: input.email.toLowerCase().trim(),
      role: roleDb,
      relationship: input.relationship || null,
      status: 'active',
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
      // 3. Attach permissions record
      const memberId = memRes.data[0].id;
      const permPayload = {
        member_id: memberId,
        patient_id: userId,
        access_level: input.accessLevel,
        can_view_labs: input.accessLevel !== 'Clinical Summary Only',
        can_view_screenings: true,
      };
      await safeRequest(`${SUPABASE_URL}/rest/v1/care_circle_permissions`, {
        method: 'POST',
        headers: getSupabaseHeaders(token),
        body: JSON.stringify(permPayload),
      });
    }

    const row = Array.isArray(invRes.data) && invRes.data[0] ? invRes.data[0] : invPayload;
    return {
      data: {
        id: String(row.id || 'inv_new'),
        patientId: userId,
        inviteeEmail: row.invitee_email,
        role: row.role,
        accessLevel: row.access_level,
        status: 'pending',
        expiresAt: row.expires_at,
        createdAt: row.created_at || new Date().toISOString(),
      },
      error: null,
      status: 201,
    };
  }

  /**
   * Update permissions / access level for a Care Circle member
   */
  static async updatePermissions(
    memberId: string,
    token: string,
    accessLevel: CareCircleAccessLevel
  ): Promise<ApiResponse<boolean>> {
    if (!memberId || !token) {
      return { data: false, error: 'Member ID and token required.', status: 400 };
    }

    const payload = {
      access_level: accessLevel,
      can_view_labs: accessLevel !== 'Clinical Summary Only',
      can_view_screenings: true,
    };

    const url = `${SUPABASE_URL}/rest/v1/care_circle_permissions?member_id=eq.${memberId}`;
    const res = await safeRequest(url, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify(payload),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }

  /**
   * Revoke member access
   */
  static async revokeMember(
    memberId: string,
    token: string
  ): Promise<ApiResponse<boolean>> {
    if (!memberId || !token) {
      return { data: false, error: 'Member ID and token required.', status: 400 };
    }

    const url = `${SUPABASE_URL}/rest/v1/care_circle_members?id=eq.${memberId}`;
    const res = await safeRequest(url, {
      method: 'PATCH',
      headers: getSupabaseHeaders(token),
      body: JSON.stringify({ status: 'revoked' }),
    });

    return { data: !res.error, error: res.error, status: res.status };
  }
}
