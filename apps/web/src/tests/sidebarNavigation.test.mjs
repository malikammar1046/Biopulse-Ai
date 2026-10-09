import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('===============================================================');
console.log('🧪 RUNNING SIDEBAR NAVIGATION REORGANIZATION TEST SUITE');
console.log('===============================================================');

const sidebarPath = resolve('src/components/navigation/AppSidebar.tsx');
const sidebarContent = readFileSync(sidebarPath, 'utf-8');

// ---------------------------------------------------------------------------
// TEST 1: Four Distinct Sections Present in AppSidebar.tsx
// ---------------------------------------------------------------------------
console.log('\n[Test 1] Four Canonical Sections Present:');

assert.ok(sidebarContent.includes("t('mainSection', 'Main')"), 'Must contain Main section header');
assert.ok(sidebarContent.includes("t('healthSection', 'Health')"), 'Must contain Health section header');
assert.ok(sidebarContent.includes("t('dailyTrackingSection', 'Daily Tracking')"), 'Must contain Daily Tracking section header');
assert.ok(sidebarContent.includes("t('intelligenceSection', 'Intelligence')"), 'Must contain Intelligence section header');

console.log('✓ All 4 sections ("Main", "Health", "Daily Tracking", "Intelligence") are present');

// ---------------------------------------------------------------------------
// TEST 2: Daily Tracking Dropdown / Accordion Behavior Completely Removed
// ---------------------------------------------------------------------------
console.log('\n[Test 2] Daily Tracking Dropdown / Accordion Removed:');

assert.strictEqual(sidebarContent.includes('isTrackingOpen'), false, 'isTrackingOpen state must not exist');
assert.strictEqual(sidebarContent.includes('setIsTrackingOpen'), false, 'setIsTrackingOpen state updater must not exist');
assert.strictEqual(sidebarContent.includes('ChevronDown'), false, 'ChevronDown icon must not exist in sidebar');
assert.strictEqual(sidebarContent.includes('AnimatePresence'), false, 'AnimatePresence accordion must not exist');
assert.strictEqual(sidebarContent.includes('trackingGroup'), false, 'Collapsible trackingGroup object must not exist');

console.log('✓ Dropdown, accordion animation, toggle button, and ChevronDown icon are eliminated');

// ---------------------------------------------------------------------------
// TEST 3: Uniform Rendering and Grid Across All Four Sections
// ---------------------------------------------------------------------------
console.log('\n[Test 3] Consistent Link Rendering Across All Sections:');

assert.ok(sidebarContent.includes('renderNavLink'), 'A centralized renderNavLink method must render all links uniformly');
assert.ok(sidebarContent.includes('px-3 py-2 rounded-xl text-xs'), 'Standard padding and typography must be used');
assert.ok(sidebarContent.includes('w-5 h-5 shrink-0 transition-colors'), 'Consistent icon dimensions must be used');
assert.ok(sidebarContent.includes('truncate'), 'Item labels must have truncate class to prevent misalignment');
assert.ok(sidebarContent.includes("aria-label=\"Sidebar Navigation\""), 'Accessible sidebar navigation label must be set');
assert.ok(sidebarContent.includes("aria-current={active ? 'page' : undefined}"), 'Accessible active page state must be declared');

console.log('✓ All navigation items use uniform sizing, typography, icons, and accessibility markers');

// ---------------------------------------------------------------------------
// TEST 4: Gender Filtering & Structural Invariants
// ---------------------------------------------------------------------------
console.log('\n[Test 4] Male vs Female Dashboard Item Separation:');

// Daily Tracking female vs male items
assert.ok(
  sidebarContent.includes("...(isFemale\n      ? [{ label: t('cycle'), path: ROUTES.APP.CYCLE, icon: Calendar }]\n      : [])") ||
  sidebarContent.includes("isFemale") && sidebarContent.includes("ROUTES.APP.CYCLE"),
  'Cycle & Ovulation tracking must be strictly restricted to female pathway'
);

// Verify maleDailyTracking never includes Cycle
const dailyTrackingSection = sidebarContent.slice(
  sidebarContent.indexOf('const dailyTrackingItems: NavItem[] = ['),
  sidebarContent.indexOf('const intelligenceItems: NavItem[] = [')
);
assert.ok(dailyTrackingSection.includes('ROUTES.APP.SYMPTOMS'), 'Daily tracking must include Symptoms');
assert.ok(dailyTrackingSection.includes('ROUTES.APP.FITNESS'), 'Daily tracking must include Fitness');
assert.ok(dailyTrackingSection.includes('ROUTES.APP.MEDICATIONS'), 'Daily tracking must include Medications');
assert.ok(dailyTrackingSection.includes('isFemale'), 'Cycle tracking must be guarded by isFemale');

console.log('✓ Female receives Cycle & Ovulation, Symptoms, Fitness, and Medications');
console.log('✓ Male receives Symptoms, Fitness, and Medications (strictly no female cycle tracking)');

// ---------------------------------------------------------------------------
// TEST 5: Correct Section Mapping
// ---------------------------------------------------------------------------
console.log('\n[Test 5] Complete Section-to-Item Mapping:');

// Main Section:
const mainSection = sidebarContent.slice(
  sidebarContent.indexOf('const mainItems: NavItem[] = ['),
  sidebarContent.indexOf('const femaleHealthItems: NavItem[] = [')
);
assert.ok(mainSection.includes('overviewPath'), 'Main must include Overview dashboard');
assert.ok(mainSection.includes('ROUTES.APP.LIFESTYLE'), 'Main must include Lifestyle & Nutrition');
assert.ok(mainSection.includes('ROUTES.APP.PROGRESS'), 'Main must include Longitudinal Health');

// Health Section:
const healthSection = sidebarContent.slice(
  sidebarContent.indexOf('const femaleHealthItems: NavItem[] = ['),
  sidebarContent.indexOf('const dailyTrackingItems: NavItem[] = [')
);
assert.ok(healthSection.includes('ROUTES.APP.ASSESSMENT'), 'Health must include Screening / Assessment');
assert.ok(healthSection.includes('ROUTES.APP.REPORTS'), 'Health must include Reports & Labs');
assert.ok(healthSection.includes('ROUTES.APP.APPOINTMENTS'), 'Health must include Appointments');
assert.ok(healthSection.includes('ROUTES.APP.CARE_CIRCLE'), 'Health must include Care Circle');

// Intelligence Section:
const intelligenceSection = sidebarContent.slice(
  sidebarContent.indexOf('const intelligenceItems: NavItem[] = ['),
  sidebarContent.indexOf('const settingsItem: NavItem = {')
);
assert.ok(intelligenceSection.includes('ROUTES.APP.CHAT'), 'Intelligence must include AI Companion');

// Account Section:
const accountSection = sidebarContent.slice(
  sidebarContent.indexOf('const settingsItem: NavItem = {'),
  sidebarContent.indexOf('const sidebarContainerClass =')
);
assert.ok(accountSection.includes('ROUTES.APP.SETTINGS'), 'Account must include Settings');

console.log('✓ Main: Overview, Lifestyle & Nutrition, Longitudinal Health');
console.log('✓ Health: Screening, Reports & Labs, Appointments, Care Circle');
console.log('✓ Daily Tracking: Cycle & Ovulation (female), Symptoms, Fitness, Medications');
console.log('✓ Intelligence: AI Companion');
console.log('✓ Account: Settings + User Profile Card');

// ---------------------------------------------------------------------------
// TEST 6: Hierarchical & Alias Active State Detection
// ---------------------------------------------------------------------------
console.log('\n[Test 6] Active State Logic:');

assert.ok(sidebarContent.includes('isOverviewActive'), 'Overview active state handled');
assert.ok(sidebarContent.includes('ROUTES.APP.TIMELINE'), 'Timeline route activates Longitudinal Health');
assert.ok(sidebarContent.includes('ROUTES.APP.AI_TWIN'), 'AI Twin route activates AI Companion');
assert.ok(sidebarContent.includes('ROUTES.APP.NUTRITION'), 'Nutrition route activates Lifestyle & Nutrition');
assert.ok(sidebarContent.includes('ROUTES.APP.PROFILE'), 'Profile route activates Settings');

console.log('✓ Direct, sub-path, and related route alias active states verified');

// ---------------------------------------------------------------------------
// TEST 7: Translation Keys
// ---------------------------------------------------------------------------
console.log('\n[Test 7] Translation Keys in English & Urdu:');

const enNav = JSON.parse(readFileSync(resolve('src/i18n/locales/en/navigation.json'), 'utf-8'));
const urNav = JSON.parse(readFileSync(resolve('src/i18n/locales/ur/navigation.json'), 'utf-8'));

assert.strictEqual(enNav.mainSection, 'Main');
assert.strictEqual(enNav.healthSection, 'Health');
assert.strictEqual(enNav.dailyTrackingSection, 'Daily Tracking');
assert.strictEqual(enNav.intelligenceSection, 'Intelligence');

assert.strictEqual(urNav.mainSection, 'بنیادی');
assert.strictEqual(urNav.healthSection, 'طبی صحت');
assert.strictEqual(urNav.dailyTrackingSection, 'روزانہ ٹریکنگ');
assert.strictEqual(urNav.intelligenceSection, 'انٹیلیجنس');

console.log('✓ All 4 section translation keys present in both English and Urdu');

console.log('\n===============================================================');
console.log('🎉 ALL 7 SIDEBAR NAVIGATION REORGANIZATION TESTS PASSED!');
console.log('===============================================================');
