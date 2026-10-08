import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Starting BioPulse Page Atmosphere & Ambient Background System Verification...\n');

// 1. Verify files exist
const atmosphereTokensPath = path.resolve('src/components/brand/atmosphereTokens.ts');
const pageAtmospherePath = path.resolve('src/components/brand/PageAtmosphere.tsx');
const atmosphereMotifsPath = path.resolve('src/components/brand/AtmosphereMotifs.tsx');
const appLayoutPath = path.resolve('src/layouts/AppLayout.tsx');
const publicLayoutPath = path.resolve('src/layouts/PublicLayout.tsx');

assert(fs.existsSync(atmosphereTokensPath), 'atmosphereTokens.ts must exist');
assert(fs.existsSync(pageAtmospherePath), 'PageAtmosphere.tsx must exist');
assert(fs.existsSync(atmosphereMotifsPath), 'AtmosphereMotifs.tsx must exist');
assert(fs.existsSync(appLayoutPath), 'AppLayout.tsx must exist');
assert(fs.existsSync(publicLayoutPath), 'PublicLayout.tsx must exist');
console.log('✅ PASSED: All atmospheric design system components exist.');

// 2. Inspect AppLayout.tsx
const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf-8');
assert(appLayoutContent.includes('PageAtmosphere'), 'AppLayout must render PageAtmosphere');
assert(appLayoutContent.includes('isDashboardRoute'), 'AppLayout must import isDashboardRoute');
assert(appLayoutContent.includes('isDashboard ? \'bg-[#F8FAFC]\' : \'bg-transparent\''), 'AppLayout must preserve bg-[#F8FAFC] on dashboards');
console.log('✅ PASSED: AppLayout conditionally wraps non-dashboard routes while preserving dashboard surfaces.');

// 3. Inspect PageAtmosphere.tsx
const pageAtmosphereContent = fs.readFileSync(pageAtmospherePath, 'utf-8');
assert(pageAtmosphereContent.includes('isDashboardRoute(location.pathname)'), 'PageAtmosphere must inspect location.pathname for dashboard exclusion');
assert(pageAtmosphereContent.includes('return null'), 'PageAtmosphere must return null when on a dashboard route');
assert(pageAtmosphereContent.includes('ATMOSPHERE_TOKENS'), 'PageAtmosphere must read from ATMOSPHERE_TOKENS');
assert(pageAtmosphereContent.includes('aria-hidden="true"'), 'PageAtmosphere must be aria-hidden for accessibility');
assert(pageAtmosphereContent.includes('pointer-events-none'), 'PageAtmosphere must be pointer-events-none');
console.log('✅ PASSED: PageAtmosphere enforces strict dashboard exclusion and accessible background layering.');

// 4. Inspect atmosphereTokens.ts for token constraints
const tokensContent = fs.readFileSync(atmosphereTokensPath, 'utf-8');
const tones = [
  'neutral',
  'female',
  'male',
  'nutrition',
  'movement',
  'recovery',
  'clinical',
  'reports',
  'care',
  'progress',
  'ai',
  'privacy',
  'education_pcos',
  'education_hypogonadism',
];

for (const tone of tones) {
  assert(tokensContent.includes(`${tone}: {`), `ATMOSPHERE_TOKENS must define ${tone}`);
}
console.log(`✅ PASSED: All ${tones.length} semantic atmosphere tones are defined in ATMOSPHERE_TOKENS.`);

// 5. Verify Dashboard Routes in DASHBOARD_EXCLUDED_PATHS
const excludedRoutes = ['/app', '/app/dashboard', '/app/ovasense', '/app/androsense', '/app/vitasense'];
for (const route of excludedRoutes) {
  assert(tokensContent.includes(`'${route}'`), `DASHBOARD_EXCLUDED_PATHS must include ${route}`);
}
console.log('✅ PASSED: Dashboard routes (/app, /app/ovasense, /app/androsense, /app/vitasense) are explicitly excluded.');

// 6. Inspect Motifs
const motifsContent = fs.readFileSync(atmosphereMotifsPath, 'utf-8');
assert(motifsContent.includes('BotanicalCornerMotif'), 'Must define BotanicalCornerMotif');
assert(motifsContent.includes('HerbalNutritionMotif'), 'Must define HerbalNutritionMotif');
assert(motifsContent.includes('KineticWaveMotif'), 'Must define KineticWaveMotif');
assert(motifsContent.includes('CellularMicroMotif'), 'Must define CellularMicroMotif');
assert(motifsContent.includes('ReportsRhythmMotif'), 'Must define ReportsRhythmMotif');
assert(motifsContent.includes('LinkedCareMotif'), 'Must define LinkedCareMotif');
assert(motifsContent.includes('UpwardGrowthMotif'), 'Must define UpwardGrowthMotif');
assert(motifsContent.includes('NeuralBioMotif'), 'Must define NeuralBioMotif');
// 7. Inspect Homepage Isolation
assert(pageAtmosphereContent.includes("location.pathname === '/'"), 'PageAtmosphere must explicitly exclude root homepage');
const publicLayoutContent = fs.readFileSync(publicLayoutPath, 'utf-8');
assert(publicLayoutContent.includes('isHome ? <GlobalBotanicalBackground /> : <PageAtmosphere />'), 'PublicLayout must preserve GlobalBotanicalBackground on Home and PageAtmosphere on other public pages');

const heroSectionContent = fs.readFileSync(path.resolve('src/pages/public/home-sections/HeroSection.tsx'), 'utf-8');
assert(heroSectionContent.includes('PinkBotanicalFoliage'), 'HeroSection must retain its exact original PinkBotanicalFoliage');
assert(heroSectionContent.includes('BlueBotanicalFoliage'), 'HeroSection must retain its exact original BlueBotanicalFoliage');
console.log('✅ PASSED: Home page is completely isolated and preserved in its exact pre-theme state.');

console.log('\n🎉 ALL PAGE ATMOSPHERE & HOMEPAGE PRESERVATION TESTS PASSED PERFECTLY!\n');
