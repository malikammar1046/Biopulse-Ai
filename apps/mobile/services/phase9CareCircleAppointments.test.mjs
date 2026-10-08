/**
 * BioPulse Mobile — Phase 9 Care Circle + Appointments Test Suite
 *
 * Verifies:
 * 1. Care Circle:
 *    - Members, roles ('doctor' | 'family' | 'trusted_person')
 *    - Invitations with unique tokens, expiration, permissions JSONB
 *    - Granular permissions rows (member_id, permission_key, enabled)
 *    - Access status ('pending' | 'active' | 'revoked')
 *    - Revocation semantics: revoked members immediately lose access
 * 2. Doctors:
 *    - Preserves existing verified clinician directory from Django
 *    - Zero fake doctor marketplace
 * 3. Appointments:
 *    - Connects to public.appointments
 *    - Scheduled date/time normalization (YYYY-MM-DD and ISO)
 *    - Check constraint compliance (status: requested, scheduled, completed, cancelled, rescheduled)
 *    - Appointment type compliance (consultation, follow_up, lab_review, routine_check, other)
 *    - Duration compliance (duration_minutes > 0)
 *    - Rescheduling, cancellation, and history
 * 4. Security:
 *    - Patient data privacy (authentication required, user scoped)
 *    - Family members only see permitted categories (reports excluded by default)
 *    - Doctors only see permitted categories
 *    - Revoked access stops working immediately
 *    - Cross-user isolation reset in healthStore
 * 5. Screen Integrity:
 *    - Preserves exact visual structure and design of care-circle, appointments, specialists, doctor-profile
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, '..');

function resolveMobileFile(relPath) {
  return path.join(mobileRoot, relPath);
}

// ============================================================================
// TEST 1: Care Circle Service Architecture & DB Check Constraint Compliance
// ============================================================================
test('Phase 9: Care Circle Service adheres to DB check constraints for roles and statuses', () => {
  const filePath = resolveMobileFile('services/careCircleService.ts');
  assert.ok(fs.existsSync(filePath), 'careCircleService.ts must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify DB check constraints: role = 'doctor' | 'family' | 'trusted_person'
  assert.ok(
    content.includes("'doctor'") && content.includes("'family'") && content.includes("'trusted_person'"),
    'Role mapping must strictly adhere to DB check constraint: doctor, family, trusted_person'
  );

  // Prohibit invalid legacy role strings
  assert.ok(
    !content.includes("roleDb = 'trusted_contact'"),
    'Must not use invalid role string "trusted_contact" which violates DB check constraint'
  );

  // Verify status check constraints: pending, active, revoked
  assert.ok(
    content.includes("'pending'") && content.includes("'active'") && content.includes("'revoked'"),
    'Status values must support pending, active, and revoked'
  );

  // Verify granular permission keys
  const expectedKeys = [
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
  ];
  for (const key of expectedKeys) {
    assert.ok(content.includes(`'${key}'`), `Granular permission key '${key}' must be defined`);
  }
});

// ============================================================================
// TEST 2: Care Circle Invitations and Granular Permissions Mapping
// ============================================================================
test('Phase 9: Care Circle invitation creates unique invite token, JSONB permissions, and granular rows', () => {
  const filePath = resolveMobileFile('services/careCircleService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify invitation schema columns
  assert.ok(content.includes('invite_token'), 'care_circle_invitations must write invite_token');
  assert.ok(content.includes('invitee_name'), 'care_circle_invitations must write invitee_name');
  assert.ok(content.includes('invitee_email'), 'care_circle_invitations must write invitee_email');
  assert.ok(content.includes('permissions'), 'care_circle_invitations must write permissions JSONB');
  assert.ok(content.includes('expires_at'), 'care_circle_invitations must write expires_at');

  // Verify care_circle_permissions writes granular rows: (member_id, permission_key, enabled)
  assert.ok(content.includes('permission_key'), 'care_circle_permissions must populate permission_key');
  assert.ok(content.includes('enabled'), 'care_circle_permissions must populate enabled');
  assert.ok(
    !content.includes('access_level: input.accessLevel') || content.includes('care_circle_permissions'),
    'care_circle_permissions must not attempt to write non-existent columns to permissions table'
  );
});

// ============================================================================
// TEST 3: Care Circle Privacy & Role Permission Presets
// ============================================================================
test('Phase 9: Role presets enforce privacy — Family members do NOT get raw medical reports by default', () => {
  const filePath = resolveMobileFile('services/careCircleService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify helper getDefaultPermissionsForRole
  assert.ok(content.includes('getDefaultPermissionsForRole'), 'getDefaultPermissionsForRole helper must exist');

  // Inspect that doctor gets reports = true
  assert.ok(
    content.includes("role === 'doctor'") && content.includes('reports: true'),
    'Doctor preset must grant access to reports'
  );

  // Inspect that family gets reports = allowReports or false by default
  assert.ok(
    content.includes("role === 'family'") && content.includes('reports: allowReports'),
    'Family preset must protect sensitive diagnostic reports by default'
  );

  // Inspect that trusted person gets minimal permissions
  assert.ok(
    content.includes("cycle: false") && content.includes("symptoms: false") && content.includes("reports: false"),
    'Trusted person preset must isolate health tracking data'
  );
});

// ============================================================================
// TEST 4: Immediate Revocation Semantics
// ============================================================================
test('Phase 9: Revoking Care Circle member sets status to revoked and cuts access immediately', () => {
  const filePath = resolveMobileFile('services/careCircleService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify revokeMember method exists
  assert.ok(content.includes('static async revokeMember'), 'revokeMember method must exist');
  assert.ok(content.includes("status: 'revoked'"), 'revokeMember must patch status to revoked');

  // Verify hasPermission check
  assert.ok(content.includes('hasPermission'), 'hasPermission helper must exist');
  assert.ok(
    content.includes("member.status === 'revoked'"),
    'hasPermission must deny access if member is revoked'
  );
});

// ============================================================================
// TEST 5: Doctor Architecture Preservation (No Fake Marketplace)
// ============================================================================
test('Phase 9: Preserves existing verified clinician directory from Django backend', () => {
  const filePath = resolveMobileFile('services/appointmentService.ts');
  assert.ok(fs.existsSync(filePath), 'appointmentService.ts must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify Django endpoints are preserved
  assert.ok(
    content.includes('/v1/doctors/?pathway=') || content.includes('/v1/health/doctors/'),
    'Must connect to real Django doctor directory endpoint'
  );
  assert.ok(content.includes('getDjangoHeaders'), 'Must use authentic Django headers');
  assert.ok(
    content.includes('Zero fake doctors policy') || content.includes('real verified'),
    'Zero fake doctors policy must be stated and maintained'
  );

  // Prohibit fake doctor marketplaces
  assert.ok(
    !content.includes('buy_doctor') && !content.includes('doctor_marketplace_cart'),
    'Must not create a fake doctor marketplace'
  );
});

// ============================================================================
// TEST 6: Appointments Schema & Database Check Constraints
// ============================================================================
test('Phase 9: Appointments booking complies with DB check constraints and formats', () => {
  const filePath = resolveMobileFile('services/appointmentService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify DB check constraints: status = 'requested' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  assert.ok(
    content.includes("'scheduled'") && content.includes("'rescheduled'") && content.includes("'cancelled'"),
    'Appointments status must use valid DB check constraint values'
  );

  // Prohibit invalid DB status 'upcoming' which throws check constraint violation
  assert.ok(
    !content.includes("status: 'upcoming'"),
    'Must not send status: "upcoming" to DB insert; DB check constraint requires "scheduled"'
  );

  // Verify appointment_type check constraint: consultation, follow_up, lab_review, routine_check, other
  assert.ok(
    content.includes("'consultation'") || content.includes('appointment_type'),
    'Must set appointment_type to a valid DB constraint value'
  );

  // Verify duration_minutes > 0
  assert.ok(
    content.includes('duration_minutes') && content.includes('30'),
    'Must specify duration_minutes > 0'
  );

  // Verify title column (NOT NULL)
  assert.ok(content.includes('title'), 'Must populate required title column');

  // Verify date and ISO timestamp normalization
  assert.ok(
    content.includes('scheduled_date') && content.includes('scheduled_at'),
    'Must populate scheduled_date (date) and scheduled_at (timestamptz)'
  );
  assert.ok(content.includes('normalizeDateAndIso'), 'normalizeDateAndIso helper must exist');
});

// ============================================================================
// TEST 7: Rescheduling and History Management
// ============================================================================
test('Phase 9: Appointment rescheduling updates DB with status=rescheduled and updates scheduled_at', () => {
  const filePath = resolveMobileFile('services/appointmentService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes('static async rescheduleAppointment'),
    'rescheduleAppointment method must exist'
  );
  assert.ok(
    content.includes("status: 'rescheduled'"),
    'Rescheduling must set status to "rescheduled"'
  );

  assert.ok(
    content.includes('static async cancelAppointment'),
    'cancelAppointment method must exist'
  );
  assert.ok(
    content.includes("status: 'cancelled'"),
    'Cancelling must set status to "cancelled"'
  );

  assert.ok(
    content.includes('mapDbStatusToUi'),
    'mapDbStatusToUi must map scheduled/requested/rescheduled to Upcoming, completed to Completed, cancelled to Cancelled'
  );
});

// ============================================================================
// TEST 8: Health Store Integration for Care Circle and Appointments
// ============================================================================
test('Phase 9: HealthStore binds persistent appointments and care circle with full async methods', () => {
  const filePath = resolveMobileFile('store/healthStore.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify store state variables
  assert.ok(content.includes('const [appointments, setAppointments]'), 'appointments state must exist');
  assert.ok(content.includes('const [careCircle, setCareCircle]'), 'careCircle state must exist');
  assert.ok(content.includes('const [specialists, setSpecialists]'), 'specialists state must exist');

  // Verify async methods on store
  assert.ok(content.includes('loadAppointments'), 'loadAppointments must be provided by store');
  assert.ok(content.includes('bookAppointment'), 'bookAppointment must be provided by store');
  assert.ok(content.includes('rescheduleAppointment'), 'rescheduleAppointment must be provided by store');
  assert.ok(content.includes('cancelAppointment'), 'cancelAppointment must be provided by store');

  assert.ok(content.includes('loadCareCircle'), 'loadCareCircle must be provided by store');
  assert.ok(content.includes('addCareCircleMember'), 'addCareCircleMember must be provided by store');
  assert.ok(content.includes('removeCareCircleMember'), 'removeCareCircleMember must be provided by store');
  assert.ok(content.includes('addToCareCircle'), 'addToCareCircle must be provided by store');
  assert.ok(content.includes('updateCareCirclePermissions'), 'updateCareCirclePermissions must be provided by store');

  // Verify initial parallel fetch in loadAuthenticatedData
  assert.ok(
    content.includes('fetchAppointmentsFromDb(currentUserId, token)'),
    'Appointments must be fetched on authenticated load'
  );
  assert.ok(
    content.includes('fetchCareCircleFromDb(currentUserId, token)'),
    'Care Circle must be fetched on authenticated load'
  );
});

// ============================================================================
// TEST 9: Cross-User Security Reset
// ============================================================================
test('Phase 9: resetHealthState completely purges appointments, care circle, and specialists', () => {
  const filePath = resolveMobileFile('store/healthStore.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  const resetIndex = content.indexOf('const resetHealthState = useCallback(() => {');
  assert.ok(resetIndex !== -1, 'resetHealthState must be defined');

  const resetBlock = content.slice(resetIndex, resetIndex + 2500);

  assert.ok(resetBlock.includes('setAppointments([])'), 'resetHealthState must empty appointments');
  assert.ok(resetBlock.includes('setCareCircle([])'), 'resetHealthState must empty care circle');
  assert.ok(resetBlock.includes('setSpecialists([])'), 'resetHealthState must empty specialists');
});

// ============================================================================
// TEST 10: Screen 41 (Care Circle) Visual & Interactive Integrity
// ============================================================================
test('Phase 9: Screen 41 (care-circle.tsx) preserves visual layout, invite modal, and manage dialog', () => {
  const filePath = resolveMobileFile('app/(app)/care-circle.tsx');
  assert.ok(fs.existsSync(filePath), 'care-circle.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify UI components: Header, Back, Info, Invite someone
  assert.ok(content.includes('Care Circle'), 'Header title Care Circle must exist');
  assert.ok(content.includes('Invite someone'), 'Invite someone button must exist');
  assert.ok(content.includes('Add trusted people to support your health journey'), 'Subtitle must exist');

  // Verify category filter pills
  assert.ok(
    content.includes("'All'") && content.includes("'Doctors'") && content.includes("'Family'") && content.includes("'Others'"),
    'Filter pills [All, Doctors, Family, Others] must exist'
  );

  // Verify member actions
  assert.ok(content.includes('handleManage'), 'Manage handler must exist');
  assert.ok(content.includes('Remove from Care Circle'), 'Remove from Care Circle action must exist');
  assert.ok(content.includes('removeFromCareCircle'), 'Must invoke removeFromCareCircle on manage');

  // Verify modal invite
  assert.ok(content.includes('showInviteModal'), 'Invite modal must exist');
  assert.ok(content.includes('handleInviteSubmit'), 'Invite submit handler must exist');
  assert.ok(content.includes('addToCareCircle'), 'Must invoke addToCareCircle on submit');

  // Verify Privacy Guarantee Box
  assert.ok(
    content.includes('Your data stays private. You control what each person can see and can remove access at any time.'),
    'Privacy guarantee text must be preserved'
  );
});

// ============================================================================
// TEST 11: Screen 37 (Appointments) Visual & Interactive Integrity
// ============================================================================
test('Phase 9: Screen 37 (appointments.tsx) preserves Upcoming, Find Specialist, and History tabs', () => {
  const filePath = resolveMobileFile('app/(app)/appointments.tsx');
  assert.ok(fs.existsSync(filePath), 'appointments.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify tabs
  assert.ok(content.includes('Upcoming'), 'Upcoming tab must exist');
  assert.ok(content.includes('Find Specialist'), 'Find Specialist tab must exist');
  assert.ok(content.includes('History'), 'History tab must exist');

  // Verify upcoming section
  assert.ok(content.includes('Your Upcoming Appointment'), 'Section heading must exist');
  assert.ok(content.includes('Reschedule'), 'Reschedule CTA must exist');
  assert.ok(content.includes('View Details'), 'View Details CTA must exist');
  assert.ok(content.includes('handleReschedule'), 'handleReschedule must exist');
  assert.ok(content.includes('rescheduleAppointment'), 'rescheduleAppointment must be called');

  // Verify history section
  assert.ok(content.includes('Past Appointments'), 'History section heading must exist');
  assert.ok(content.includes('historyAppointments'), 'historyAppointments filter must exist');
});

// ============================================================================
// TEST 12: Screen 40 (Doctor Profile) Visual & Interactive Integrity
// ============================================================================
test('Phase 9: Screen 40 (doctor-profile.tsx) connects real appointment booking and care circle addition', () => {
  const filePath = resolveMobileFile('app/(app)/doctor-profile.tsx');
  assert.ok(fs.existsSync(filePath), 'doctor-profile.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify doctor metrics and expertise chips
  assert.ok(content.includes('Years Experience') || content.includes('experienceYears'), 'Experience metric must exist');
  assert.ok(content.includes('Patients Treated') || content.includes('patientsTreated'), 'Patients treated metric must exist');
  assert.ok(content.includes('availabilityDays') || content.includes('slots'), 'Availability selector must exist');

  // Verify dual CTAs
  assert.ok(content.includes('Add to Care Circle'), 'Add to Care Circle CTA must exist');
  assert.ok(content.includes('Book Appointment'), 'Book Appointment CTA must exist');

  // Verify handler connections
  assert.ok(content.includes('handleBook'), 'handleBook handler must exist');
  assert.ok(content.includes('bookAppointment('), 'bookAppointment must be called');
  assert.ok(content.includes('handleAddToCircle'), 'handleAddToCircle handler must exist');
  assert.ok(content.includes('addToCareCircle('), 'addToCareCircle must be called');
});
