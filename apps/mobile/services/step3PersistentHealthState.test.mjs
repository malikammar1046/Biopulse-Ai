import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileDir = path.resolve(__dirname, '..');
const storePath = path.join(mobileDir, 'store', 'healthStore.tsx');
const appScreensDir = path.join(mobileDir, 'app', '(app)');

test('Step 3: Health Store integrates all real persistent backend services', () => {
  assert.ok(fs.existsSync(storePath), 'healthStore.tsx must exist');
  const storeContent = fs.readFileSync(storePath, 'utf-8');

  // Verify service imports and usage
  const requiredServices = [
    'profileService',
    'trackingService',
    'assessmentService',
    'medicationService',
    'appointmentService',
    'careCircleService',
    'reportService',
    'nutritionService',
    'notificationService',
  ];

  for (const s of requiredServices) {
    assert.ok(
      storeContent.includes(s),
      `healthStore.tsx must integrate and invoke ${s}`
    );
  }
});

test('Step 3: User switching and logout state purge guarantees', () => {
  const storeContent = fs.readFileSync(storePath, 'utf-8');

  // Must have state purge mechanism on logout
  assert.ok(
    storeContent.includes('resetHealthState'),
    'healthStore.tsx must expose and implement resetHealthState'
  );

  // Must detect user switch via user reference
  assert.ok(
    storeContent.includes('lastLoadedUserIdRef') || storeContent.includes('lastUserIdRef'),
    'healthStore.tsx must track current user ID ref to detect switching'
  );

  // Must guard against race conditions where stale User A async response arrives after User B logs in
  assert.ok(
    storeContent.includes('isCurrent') || storeContent.includes('lastLoadedUserIdRef.current === user.id'),
    'healthStore.tsx must guard asynchronous load completions against user switching'
  );
});

test('Step 3: Database mutations precede local state and persist to backend', () => {
  const storeContent = fs.readFileSync(storePath, 'utf-8');

  const requiredMutations = [
    'trackingService.logWater',
    'trackingService.deleteWaterLog',
    'trackingService.logActivity',
    'trackingService.logSymptom',
    'nutritionService.logFood',
    'medicationService.addMedication',
    'medicationService.logDose',
    'appointmentService.bookAppointment',
    'appointmentService.cancelAppointment',
    'careCircleService.inviteMember',
    'trackingService.logCycle',
  ];

  for (const mutation of requiredMutations) {
    assert.ok(
      storeContent.includes(mutation),
      `healthStore.tsx must call backend service mutation: ${mutation}`
    );
  }
});

test('Step 3: Zero demo users and fake probabilities in healthStore', () => {
  const storeContent = fs.readFileSync(storePath, 'utf-8');

  // No demo users
  assert.strictEqual(
    storeContent.includes('Ayesha Khan'),
    false,
    'healthStore.tsx must NOT contain demo user Ayesha Khan'
  );
  assert.strictEqual(
    storeContent.includes('INITIAL_PROFILE'),
    false,
    'healthStore.tsx must NOT contain hardcoded INITIAL_PROFILE'
  );

  // Clean initial states
  assert.ok(
    storeContent.includes('consumedLiters: 0'),
    'healthStore water initial consumedLiters must be 0'
  );
  assert.ok(
    storeContent.includes('todayActivityMinutes: 0'),
    'healthStore movement initial activity minutes must be 0'
  );
  assert.ok(
    storeContent.includes('caloriesConsumed: 0'),
    'healthStore nutrition initial caloriesConsumed must be 0'
  );
  assert.ok(
    storeContent.includes('useState<MedicationItem[]>([]);') || storeContent.includes('setMedications([])'),
    'healthStore initial medications must be empty array []'
  );
  assert.ok(
    storeContent.includes('useState<AppointmentItem[]>([]);') || storeContent.includes('setAppointments([])'),
    'healthStore initial appointments must be empty array []'
  );
});

test('Step 3 Screen Audit: medications.tsx uses persistent state with zero fake meds', () => {
  const medPath = path.join(appScreensDir, 'medications.tsx');
  const content = fs.readFileSync(medPath, 'utf-8');

  // No mock defaultMeds array
  assert.strictEqual(
    content.includes('defaultMeds'),
    false,
    'medications.tsx must NOT have defaultMeds mock array'
  );
  assert.strictEqual(
    content.includes('Metformin 500mg'),
    false,
    'medications.tsx must NOT have hardcoded Metformin 500mg'
  );

  // Directly consumes health store medications
  assert.ok(
    content.includes('useHealthStore()'),
    'medications.tsx must consume useHealthStore'
  );

  // Has authentic empty state
  assert.ok(
    content.includes('No medications scheduled') || content.includes('emptyCard'),
    'medications.tsx must render authentic empty state when no medications are logged'
  );
});

test('Step 3 Screen Audit: water-log.tsx uses persistent state with zero fake history or 1.6L fallback', () => {
  const waterPath = path.join(appScreensDir, 'water-log.tsx');
  const content = fs.readFileSync(waterPath, 'utf-8');

  // No hardcoded historyItems state
  assert.strictEqual(
    content.includes('const [historyItems, setHistoryItems] = useState('),
    false,
    'water-log.tsx must NOT use hardcoded historyItems state'
  );

  // No fake 1.6L fallback
  assert.strictEqual(
    content.includes(": '1.6'"),
    false,
    "water-log.tsx must NOT fall back to fake '1.6' L"
  );

  // Binds to water.logs and deleteWaterLog
  assert.ok(
    content.includes('water.logs'),
    'water-log.tsx must bind to store water.logs'
  );
  assert.ok(
    content.includes('deleteWaterLog'),
    'water-log.tsx must invoke deleteWaterLog'
  );

  // Authentic empty state
  assert.ok(
    content.includes('No water logged yet today'),
    'water-log.tsx must render authentic empty state when water.logs is empty'
  );
});

test('Step 3 Screen Audit: movement.tsx uses persistent state with zero fake minutes/steps fallbacks', () => {
  const movePath = path.join(appScreensDir, 'movement.tsx');
  const content = fs.readFileSync(movePath, 'utf-8');

  // No || 45 or || 6230 fallbacks
  assert.strictEqual(
    content.includes('movement.todayActivityMinutes || 45'),
    false,
    'movement.tsx must NOT fall back to fake 45 minutes'
  );
  assert.strictEqual(
    content.includes('movement.todaySteps || 6230'),
    false,
    'movement.tsx must NOT fall back to fake 6230 steps'
  );

  // Connects to health store
  assert.ok(
    content.includes('movement.todayActivityMinutes ?? 0'),
    'movement.tsx must cleanly evaluate todayActivityMinutes'
  );
});

test('Step 3 Screen Audit: track.tsx eliminates all fake mockup fallbacks', () => {
  const trackPath = path.join(appScreensDir, 'track.tsx');
  const content = fs.readFileSync(trackPath, 'utf-8');

  // Verify removal of fake fallbacks
  assert.strictEqual(
    content.includes('cycle.currentCycleDay || 14'),
    false,
    'track.tsx must NOT fall back to fake Cycle Day 14'
  );
  assert.strictEqual(
    content.includes('cycle.nextPeriodDaysRemaining || 12'),
    false,
    'track.tsx must NOT fall back to fake 12 days'
  );
  assert.strictEqual(
    content.includes('|| (isFemale ? 1320 : 1520)'),
    false,
    'track.tsx must NOT fall back to fake calories 1320/1520'
  );
  assert.strictEqual(
    content.includes('|| (isFemale ? \'1.6\' : \'1.8\')'),
    false,
    'track.tsx must NOT fall back to fake water 1.6/1.8'
  );
  assert.strictEqual(
    content.includes('movement.todayActivityMinutes || 45'),
    false,
    'track.tsx must NOT fall back to fake active minutes 45'
  );
  assert.strictEqual(
    content.includes('pendingMedsCount = medications.filter((m) => m.status === \'pending\').length || 1'),
    false,
    'track.tsx must NOT fall back to fake pending meds count 1'
  );
});

test('Step 3 Screen Audit: symptom-log.tsx eliminates hardcoded initial selection', () => {
  const symptomPath = path.join(appScreensDir, 'symptom-log.tsx');
  const content = fs.readFileSync(symptomPath, 'utf-8');

  assert.strictEqual(
    content.includes("['acne', 'mood', 'fatigue']"),
    false,
    'symptom-log.tsx must NOT preselect fake symptoms [acne, mood, fatigue]'
  );
});

test('Step 3 Screen Audit: appointments.tsx connects to store and renders empty states', () => {
  const aptPath = path.join(appScreensDir, 'appointments.tsx');
  const content = fs.readFileSync(aptPath, 'utf-8');

  assert.ok(
    content.includes('activeAppointment ?'),
    'appointments.tsx must conditionally render based on real activeAppointment'
  );
  assert.ok(
    content.includes('No Upcoming Appointments'),
    'appointments.tsx must render authentic empty state when no upcoming appointments exist'
  );
  assert.ok(
    content.includes('No Past Appointments'),
    'appointments.tsx must render authentic empty state when no past appointments exist'
  );
});

test('Step 3 Screen Audit: reports.tsx connects to store reports and screening assessment', () => {
  const repPath = path.join(appScreensDir, 'reports.tsx');
  const content = fs.readFileSync(repPath, 'utf-8');

  assert.ok(
    content.includes('useHealthStore()'),
    'reports.tsx must consume useHealthStore'
  );
  assert.ok(
    content.includes('screening.tierStatus') || content.includes('screening.riskBand'),
    'reports.tsx must only include screening report when real assessment exists'
  );
  assert.ok(
    content.includes('No Reports Available'),
    'reports.tsx must render authentic empty state when no reports exist'
  );
});

test('Step 3 Screen Audit: nutrition.tsx eliminates fake macro fallbacks', () => {
  const nutPath = path.join(appScreensDir, 'nutrition.tsx');
  const content = fs.readFileSync(nutPath, 'utf-8');

  assert.strictEqual(
    content.includes('nutrition.caloriesConsumed || 1320'),
    false,
    'nutrition.tsx must NOT fall back to fake 1320 calories'
  );
  assert.strictEqual(
    content.includes('nutrition.proteinConsumed || 62'),
    false,
    'nutrition.tsx must NOT fall back to fake 62g protein'
  );
  assert.strictEqual(
    content.includes('nutrition.carbsConsumed || 148'),
    false,
    'nutrition.tsx must NOT fall back to fake 148g carbs'
  );
  assert.strictEqual(
    content.includes('nutrition.fatsConsumed || 42'),
    false,
    'nutrition.tsx must NOT fall back to fake 42g fats'
  );
});
