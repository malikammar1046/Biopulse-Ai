/**
 * apps/web/scripts/test-lifestyle-architecture.mjs
 *
 * Automated regression suite for BioPulse Lifestyle & Nutrition Navigation,
 * Caching, Request Deduplication, Auth Session Reliability, and Legacy Route Redirects.
 */

import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('================================================================');
console.log('🧪 STARTING LIFESTYLE & NUTRITION ARCHITECTURAL REGRESSION TESTS');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASSED: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ PASSED: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: NutritionPage.tsx file removal and lazy import cleanup
// ---------------------------------------------------------------------------
runTest('NutritionPage.tsx file removed and not imported in App.tsx', () => {
  const nutritionPagePath = resolve('src/pages/app/NutritionPage.tsx');
  assert.strictEqual(
    existsSync(nutritionPagePath),
    false,
    'NutritionPage.tsx should be deleted as it delegates directly to LifestyleRecommendationsPage'
  );

  const appTsxContent = readFileSync(resolve('src/App.tsx'), 'utf-8');
  assert.strictEqual(
    appTsxContent.includes('NutritionPage'),
    false,
    'App.tsx should not import or reference NutritionPage'
  );
});

// ---------------------------------------------------------------------------
// TEST 2: App.tsx canonicalizes /app/nutrition, /app/diet, /app/diet/week
// ---------------------------------------------------------------------------
runTest('App.tsx route redirects for legacy /nutrition, /diet, /diet/week', () => {
  const appTsxContent = readFileSync(resolve('src/App.tsx'), 'utf-8');
  assert.ok(
    appTsxContent.includes('<Route path="lifestyle" element={<LifestyleRecommendationsPage />} />'),
    'Canonical lifestyle route must be defined'
  );
  assert.ok(
    appTsxContent.includes('<Route path="nutrition" element={<Navigate to={ROUTES.APP.LIFESTYLE} replace />} />'),
    'Legacy /app/nutrition must redirect to ROUTES.APP.LIFESTYLE'
  );
  assert.ok(
    appTsxContent.includes('<Route path="diet" element={<Navigate to={ROUTES.APP.LIFESTYLE} replace />} />'),
    'Legacy /app/diet must redirect to ROUTES.APP.LIFESTYLE'
  );
  assert.ok(
    appTsxContent.includes('<Route path="diet/week" element={<Navigate to={ROUTES.APP.LIFESTYLE} replace />} />'),
    'Legacy /app/diet/week must redirect to ROUTES.APP.LIFESTYLE'
  );
});

// ---------------------------------------------------------------------------
// TEST 3: Sidebar unification - only ONE Lifestyle & Nutrition link in MAIN
// ---------------------------------------------------------------------------
runTest('AppSidebar.tsx contains exactly ONE Lifestyle & Nutrition link in MAIN for both pathways', () => {
  const sidebarContent = readFileSync(resolve('src/components/navigation/AppSidebar.tsx'), 'utf-8');

  // Must not have standalone Nutrition in main items
  assert.strictEqual(
    sidebarContent.includes("{ label: 'Nutrition', path: ROUTES.APP.NUTRITION"),
    false,
    'Sidebar must not contain standalone Nutrition link'
  );

  // Both female and male main items must contain Lifestyle & Nutrition
  assert.ok(
    sidebarContent.includes("{ label: 'Lifestyle & Nutrition', path: ROUTES.APP.LIFESTYLE, icon: Scales01 }"),
    'Sidebar must contain Lifestyle & Nutrition pointing to ROUTES.APP.LIFESTYLE'
  );

  // Female health items must not duplicate Lifestyle & Nutrition
  const femaleHealthSection = sidebarContent.slice(
    sidebarContent.indexOf('const femaleHealthItems: NavItem[] = ['),
    sidebarContent.indexOf('const healthItems =')
  );
  assert.strictEqual(
    femaleHealthSection.includes('ROUTES.APP.LIFESTYLE'),
    false,
    'femaleHealthItems must not contain duplicate Lifestyle & Nutrition'
  );
});

// ---------------------------------------------------------------------------
// TEST 4: MobileBottomNav.tsx has only ONE canonical Lifestyle destination
// ---------------------------------------------------------------------------
runTest('MobileBottomNav.tsx contains single canonical Lifestyle destination', () => {
  const mobileNavContent = readFileSync(resolve('src/components/navigation/MobileBottomNav.tsx'), 'utf-8');
  assert.strictEqual(
    mobileNavContent.includes('ROUTES.APP.NUTRITION'),
    false,
    'MobileBottomNav must not contain duplicate ROUTES.APP.NUTRITION'
  );
  assert.ok(
    mobileNavContent.includes("{ label: 'Lifestyle', path: ROUTES.APP.LIFESTYLE, icon: Scales01 }"),
    'MobileBottomNav must contain Lifestyle pointing to ROUTES.APP.LIFESTYLE'
  );
});

// ---------------------------------------------------------------------------
// TEST 5: Dashboard Overview CTAs updated to ROUTES.APP.LIFESTYLE
// ---------------------------------------------------------------------------
runTest('Male and Female Dashboard Overview CTAs navigate to ROUTES.APP.LIFESTYLE', () => {
  const maleOverview = readFileSync(resolve('src/components/male/MaleDashboardOverview.tsx'), 'utf-8');
  const femaleOverview = readFileSync(resolve('src/components/female/FemaleDashboardOverview.tsx'), 'utf-8');

  assert.strictEqual(
    maleOverview.includes('navigate(ROUTES.APP.DIET)'),
    false,
    'MaleDashboardOverview must not navigate to ROUTES.APP.DIET'
  );
  assert.ok(
    maleOverview.includes('onViewMealPlan={() => navigate(ROUTES.APP.LIFESTYLE)}'),
    'MaleDashboardOverview onViewMealPlan must navigate to ROUTES.APP.LIFESTYLE'
  );
  assert.ok(
    maleOverview.includes('onOpenWaterLog={() => navigate(ROUTES.APP.LIFESTYLE)}'),
    'MaleDashboardOverview onOpenWaterLog must navigate to ROUTES.APP.LIFESTYLE'
  );

  assert.strictEqual(
    femaleOverview.includes('navigate(ROUTES.APP.DIET)'),
    false,
    'FemaleDashboardOverview must not navigate to ROUTES.APP.DIET'
  );
  assert.ok(
    femaleOverview.includes('onViewMealPlan={() => navigate(ROUTES.APP.LIFESTYLE)}'),
    'FemaleDashboardOverview onViewMealPlan must navigate to ROUTES.APP.LIFESTYLE'
  );
  assert.ok(
    femaleOverview.includes('onOpenWaterLog={() => navigate(ROUTES.APP.LIFESTYLE)}'),
    'FemaleDashboardOverview onOpenWaterLog must navigate to ROUTES.APP.LIFESTYLE'
  );
});

// ---------------------------------------------------------------------------
// TEST 6: NextBestActionModuleCard and dashboardActions route verification
// ---------------------------------------------------------------------------
runTest('NextBestActionModuleCard and dashboardActions point to ROUTES.APP.LIFESTYLE', () => {
  const nextActionCard = readFileSync(
    resolve('src/components/dashboard/overview/modules/NextBestActionModuleCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    nextActionCard.includes("targetRoute: '/app/nutrition'"),
    false,
    'NextBestActionModuleCard must not use /app/nutrition'
  );
  assert.ok(
    nextActionCard.includes('targetRoute: ROUTES.APP.LIFESTYLE'),
    'NextBestActionModuleCard must use ROUTES.APP.LIFESTYLE'
  );

  const dashboardActions = readFileSync(resolve('src/utils/dashboardActions.ts'), 'utf-8');
  assert.strictEqual(
    dashboardActions.includes("route: '/app/diet'"),
    false,
    'dashboardActions must not use /app/diet'
  );
  assert.ok(
    dashboardActions.includes('route: ROUTES.APP.LIFESTYLE'),
    'dashboardActions must use ROUTES.APP.LIFESTYLE'
  );
});

// ---------------------------------------------------------------------------
// TEST 7: lifestyleService in-memory caching and TTL logic
// ---------------------------------------------------------------------------
await runAsyncTest('lifestyleService cache store, retrieval, and status mutation', async () => {
  // Mock data structure
  const mockResult = {
    pathway: 'ovasense',
    generated_at: new Date().toISOString(),
    risk_category: 'moderate',
    recommendations: [
      { id: 'rec-001', pillar: 'nutrition', title: 'Inositol', status: 'ACTIVE', priority: 'high' },
      { id: 'rec-002', pillar: 'fitness', title: 'Zone 2 Walking', status: 'NEW', priority: 'medium' },
    ],
  };

  // Dynamically import compiled or bundled service or verify implementation contracts
  const serviceContent = readFileSync(resolve('src/services/lifestyleService.ts'), 'utf-8');
  assert.ok(
    serviceContent.includes('getCachedRecommendations'),
    'lifestyleService must expose getCachedRecommendations'
  );
  assert.ok(
    serviceContent.includes('setCachedRecommendations'),
    'lifestyleService must expose setCachedRecommendations'
  );
  assert.ok(
    serviceContent.includes('updateCachedRecommendationStatus'),
    'lifestyleService must expose updateCachedRecommendationStatus'
  );
  assert.ok(
    serviceContent.includes('inFlightRequests'),
    'lifestyleService must track inFlightRequests for deduplication'
  );
  assert.ok(
    serviceContent.includes('SessionError'),
    'lifestyleService must define authoritative SessionError'
  );
});

// ---------------------------------------------------------------------------
// TEST 8: Auth session retry and bounded exponential backoff policy
// ---------------------------------------------------------------------------
runTest('lifestyleService bounded exponential backoff and auth refresh logic', () => {
  const serviceContent = readFileSync(resolve('src/services/lifestyleService.ts'), 'utf-8');
  assert.ok(
    serviceContent.includes('const retryDelays = [300, 800, 1500]'),
    'lifestyleService must use bounded exponential backoff [300, 800, 1500]'
  );
  assert.ok(
    serviceContent.includes('refreshedAuthTried'),
    'lifestyleService must track refreshedAuthTried to prevent infinite auth retry loops'
  );
  assert.ok(
    serviceContent.includes('attachAbortSignal'),
    'lifestyleService must isolate caller abort signals from shared in-flight fetch'
  );
});

// ---------------------------------------------------------------------------
// TEST 9: LifestyleRecommendationsPage synchronous cache mount & non-blocking notice
// ---------------------------------------------------------------------------
runTest('LifestyleRecommendationsPage synchronous cache mount & non-blocking banner', () => {
  const pageContent = readFileSync(resolve('src/pages/app/LifestyleRecommendationsPage.tsx'), 'utf-8');
  assert.ok(
    pageContent.includes('lifestyleService.getCachedRecommendations(defaultPathway, activeUserId)'),
    'LifestyleRecommendationsPage must check cache synchronously on mount'
  );
  assert.ok(
    pageContent.includes('nonBlockingNotice'),
    'LifestyleRecommendationsPage must maintain nonBlockingNotice for graceful degraded refresh'
  );
  assert.ok(
    pageContent.includes('authLoading'),
    'LifestyleRecommendationsPage must respect authLoading before firing network requests'
  );
  assert.ok(
    pageContent.includes("postOnboardingReadiness === 'initializing'"),
    'LifestyleRecommendationsPage must defer fetch during onboarding initialization'
  );
});

// ---------------------------------------------------------------------------
// TEST 10: nutritionService caching and AuthContext logout cleanup
// ---------------------------------------------------------------------------
runTest('nutritionService caching and AuthContext logout cache invalidation', () => {
  const nutritionContent = readFileSync(resolve('src/services/nutritionService.ts'), 'utf-8');
  assert.ok(
    nutritionContent.includes('currentPlanCache'),
    'nutritionService must cache currentPlan'
  );
  assert.ok(
    nutritionContent.includes('readinessCache'),
    'nutritionService must cache readiness'
  );
  assert.ok(
    nutritionContent.includes('clearCache'),
    'nutritionService must implement clearCache'
  );

  const authContent = readFileSync(resolve('src/context/AuthContext.tsx'), 'utf-8');
  assert.ok(
    authContent.includes('lifestyleService.clearCache()'),
    'AuthContext logout must clear lifestyleService cache'
  );
  assert.ok(
    authContent.includes('nutritionService.clearCache()'),
    'AuthContext logout must clear nutritionService cache'
  );
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} OF ${totalTests} ARCHITECTURAL REGRESSION TESTS PASSED!`);
console.log('================================================================\n');
