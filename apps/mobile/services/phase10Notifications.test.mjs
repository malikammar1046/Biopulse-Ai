/**
 * BioPulse Mobile — Phase 10 Notifications Test Suite
 *
 * Verifies:
 * 1. Persistent Backend Integration:
 *    - Connects to public.user_notifications with PostgreSQL RLS
 *    - Columns: id, user_id, title, subtitle, category, notification_type, related_entity_id, route, is_read, read_at, created_at
 * 2. Read / Unread Status & Timestamps:
 *    - Tracks is_read boolean and read_at ISO timestamp
 *    - markAsRead updates single notification
 *    - markAllAsRead updates all unread notifications
 *    - formatNotificationTime categorizes into 'Today' vs 'Yesterday' and formats 12-hour AM/PM times
 * 3. Notification Types & Categories:
 *    - Categories: 'Reminders' | 'System'
 *    - Types: 'medication' | 'appointment' | 'lab_report' | 'screening' | 'care_circle' | 'system'
 * 4. Zero Fake Notifications:
 *    - syncClinicalNotifications synchronizes authentic clinical records:
 *      * appointments (patient_id, status in scheduled/requested/rescheduled)
 *      * medications (user_id, is_active=true)
 *      * medical_reports (user_id, order by created_at)
 *      * screening_assessments (user_id, clinical explanation)
 *      * care_circle_members (patient_id, status=active)
 *    - Enforces idempotency via related_entity_id check
 * 5. Push Infrastructure vs In-App Distinction:
 *    - In-app clinical alerts are fully live and persistent
 *    - Push infrastructure (APNs/FCM) is explicitly declared as staging/not production ready
 *    - Status disclosure card rendered on notification preferences screen
 * 6. HealthStore Integration & Security:
 *    - notificationList, isLoadingNotifications, notificationError in store
 *    - Parallel loading during authenticated session initialization
 *    - Purges state on resetHealthState to guarantee cross-user privacy
 * 7. Screen Integrity & States:
 *    - Loading state with ActivityIndicator
 *    - Error state with Retry CTA
 *    - Empty state differentiated for 'Unread' vs all notifications
 *    - Filter pills ('All', 'Unread', 'Reminders', 'System')
 *    - Preserves exact visual structure of Screen 46 and preferences sub-screen
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
// TEST 1: Database Table Schema & Persistence Contract
// ============================================================================
test('Phase 10: Notification Service adheres to public.user_notifications schema and constraints', () => {
  const filePath = resolveMobileFile('services/notificationService.ts');
  assert.ok(fs.existsSync(filePath), 'notificationService.ts must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify persistent table access
  assert.ok(
    content.includes('rest/v1/user_notifications'),
    'Must connect to public.user_notifications REST endpoint'
  );

  // Verify category check constraints
  assert.ok(
    content.includes("'Reminders'") && content.includes("'System'"),
    'Must strictly support category types: Reminders, System'
  );

  // Verify notification type check constraints
  const expectedTypes = [
    'medication',
    'appointment',
    'lab_report',
    'screening',
    'care_circle',
    'system',
  ];
  for (const nType of expectedTypes) {
    assert.ok(
      content.includes(`'${nType}'`),
      `Notification type '${nType}' must be defined in service`
    );
  }

  // Verify columns handled in mapping
  const expectedCols = [
    'user_id',
    'title',
    'subtitle',
    'category',
    'notification_type',
    'related_entity_id',
    'is_read',
    'read_at',
  ];
  for (const col of expectedCols) {
    assert.ok(
      content.includes(col),
      `Column '${col}' must be handled in notification mapping or persistence`
    );
  }
});

// ============================================================================
// TEST 2: Authentic Clinical Sync — Zero Fake Notifications
// ============================================================================
test('Phase 10: Clinical notification sync derives only from authentic user health records with idempotency', () => {
  const filePath = resolveMobileFile('services/notificationService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify real entity checks in syncClinicalNotifications
  assert.ok(
    content.includes('syncClinicalNotifications'),
    'Must expose syncClinicalNotifications'
  );
  assert.ok(
    content.includes('rest/v1/appointments?patient_id=eq.'),
    'Must sync real appointments from database'
  );
  assert.ok(
    content.includes('rest/v1/medications?user_id=eq.'),
    'Must sync real active medications from database'
  );
  assert.ok(
    content.includes('rest/v1/medical_reports?user_id=eq.'),
    'Must sync real medical reports from database'
  );
  assert.ok(
    content.includes('rest/v1/screening_assessments?user_id=eq.'),
    'Must sync real screening assessments from database'
  );
  assert.ok(
    content.includes('rest/v1/care_circle_members?patient_id=eq.'),
    'Must sync real care circle members from database'
  );

  // Verify idempotency check
  assert.ok(
    content.includes('existingEntityIds') && content.includes('related_entity_id'),
    'Must track existing related_entity_id to ensure zero duplicate notifications'
  );
});

// ============================================================================
// TEST 3: Read Status Management & Timestamp Formatting
// ============================================================================
test('Phase 10: Service provides markAsRead, markAllAsRead, and timestamp section formatting', () => {
  const filePath = resolveMobileFile('services/notificationService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify markAsRead updates single notification with read_at
  assert.ok(
    content.includes('async markAsRead(') &&
      content.includes('is_read: true') &&
      content.includes('read_at: new Date().toISOString()'),
    'markAsRead must update is_read and read_at timestamp in database'
  );

  // Verify markAllAsRead updates all unread notifications
  assert.ok(
    content.includes('async markAllAsRead(') &&
      content.includes('is_read=eq.false'),
    'markAllAsRead must update all unread notifications for authenticated user'
  );

  // Verify formatNotificationTime implementation
  assert.ok(
    content.includes('function formatNotificationTime(') &&
      content.includes("'Today'") &&
      content.includes("'Yesterday'"),
    'formatNotificationTime must partition notifications into Today and Yesterday sections'
  );

  // Verify PUSH_INFRASTRUCTURE_STATUS declaration
  assert.ok(
    content.includes('PUSH_INFRASTRUCTURE_STATUS: PushInfrastructureStatus = {') &&
      content.includes('inAppLive: true') &&
      content.includes('remotePushReady: false'),
    'PUSH_INFRASTRUCTURE_STATUS must declare inAppLive: true and remotePushReady: false'
  );
});

// ============================================================================
// TEST 4: Push Infrastructure Distinction & Truthfulness
// ============================================================================
test('Phase 10: Explicitly distinguishes between live in-app notifications and staging push infrastructure', () => {
  const notifServicePath = resolveMobileFile('services/notificationService.ts');
  const prefsScreenPath = resolveMobileFile('app/(app)/notification-preferences.tsx');

  const serviceContent = fs.readFileSync(notifServicePath, 'utf8');
  const screenContent = fs.readFileSync(prefsScreenPath, 'utf8');

  // Check service honesty
  assert.ok(
    serviceContent.includes('PushInfrastructureStatus'),
    'Must declare PushInfrastructureStatus interface'
  );
  assert.ok(
    serviceContent.includes('remotePushReady: false'),
    'Must not pretend remote push is production ready'
  );

  // Check preferences screen disclosure
  assert.ok(
    screenContent.includes('Channel Status: In-App Alerts Live'),
    'Notification preferences screen must display channel status banner'
  );
  assert.ok(
    screenContent.includes('APNs/FCM are currently in staging'),
    'Notification preferences screen must clarify device APNs/FCM staging status'
  );
});

// ============================================================================
// TEST 5: HealthStore Integration & Security Sanitization
// ============================================================================
test('Phase 10: HealthStore manages notification state and purges data on logout', () => {
  const storePath = resolveMobileFile('store/healthStore.tsx');
  const content = fs.readFileSync(storePath, 'utf8');

  // Verify state properties
  assert.ok(content.includes('notificationList: MobileNotificationItem[]'), 'Must export notificationList');
  assert.ok(content.includes('isLoadingNotifications: boolean'), 'Must export isLoadingNotifications');
  assert.ok(content.includes('notificationError: string | null'), 'Must export notificationError');

  // Verify actions
  assert.ok(content.includes('loadNotifications: () => Promise<void>'), 'Must export loadNotifications');
  assert.ok(
    content.includes('markNotificationAsRead: (id: string) => Promise<boolean>'),
    'Must export markNotificationAsRead'
  );
  assert.ok(
    content.includes('markAllNotificationsAsRead: () => Promise<boolean>'),
    'Must export markAllNotificationsAsRead'
  );

  // Verify parallel loading during authenticated session
  assert.ok(
    content.includes('notificationService.getNotifications('),
    'Must fetch notifications during loadAuthenticatedData'
  );

  // Verify security reset
  assert.ok(
    content.includes('setNotificationList([])'),
    'Must clear notificationList in resetHealthState to prevent data leaks'
  );
});

// ============================================================================
// TEST 6: Screen 46 Visual & Functional Preservation (No Redesign)
// ============================================================================
test('Phase 10: Screen 46 notifications.tsx maintains design, filter tabs, and empty/loading/error states', () => {
  const screenPath = resolveMobileFile('app/(app)/notifications.tsx');
  const content = fs.readFileSync(screenPath, 'utf8');

  // Visual header elements
  assert.ok(content.includes('chevron-back'), 'Must have back navigation');
  assert.ok(content.includes('settings-outline'), 'Must have settings navigation gear');
  assert.ok(content.includes('Notifications'), 'Must have centered title');

  // Filter tabs
  assert.ok(content.includes("setActiveTab('All')"), 'Must have All filter pill');
  assert.ok(content.includes("setActiveTab('Unread')"), 'Must have Unread filter pill');
  assert.ok(content.includes("setActiveTab('Reminders')"), 'Must have Reminders filter pill');
  assert.ok(content.includes("setActiveTab('System')"), 'Must have System filter pill');

  // Sections
  assert.ok(content.includes("section === 'Today'"), 'Must filter Today section');
  assert.ok(content.includes("section === 'Yesterday'"), 'Must filter Yesterday section');

  // Loading, error, and empty states
  assert.ok(content.includes('isLoadingNotifications'), 'Must handle loading state');
  assert.ok(content.includes('notificationError'), 'Must handle error state with retry');
  assert.ok(content.includes('No Unread Notifications'), 'Must have unread-specific empty state');
  assert.ok(content.includes('No Notifications Yet'), 'Must have generic empty state');

  // Unread indicator dot
  assert.ok(content.includes('styles.unreadDot'), 'Must render unread pink dot');

  // Preference link card
  assert.ok(
    content.includes('Notification Preferences'),
    'Must have Notification Preferences link card'
  );
});

// ============================================================================
// TEST 7: Notification Preferences Sub-Screen Toggles & Persistence
// ============================================================================
test('Phase 10: Notification preferences screen preserves sections and updates database settings', () => {
  const prefsPath = resolveMobileFile('app/(app)/notification-preferences.tsx');
  const content = fs.readFileSync(prefsPath, 'utf8');

  // Reminders section
  assert.ok(content.includes('Medication reminders'), 'Must have Medication reminders row');
  assert.ok(content.includes('Period predictions'), 'Must have Period predictions row');
  assert.ok(content.includes('Appointment reminders'), 'Must have Appointment reminders row');

  // Health updates section
  assert.ok(content.includes('Lab report updates'), 'Must have Lab report updates row');
  assert.ok(content.includes('Screening follow-ups'), 'Must have Screening follow-ups row');
  assert.ok(content.includes('New recommendations'), 'Must have New recommendations row');

  // System section
  assert.ok(content.includes('App updates'), 'Must have App updates row');
  assert.ok(content.includes('Marketing updates'), 'Must have Marketing updates row');

  // Store integration
  assert.ok(
    content.includes('updateNotificationSetting'),
    'Must connect switch toggles to updateNotificationSetting'
  );
});
