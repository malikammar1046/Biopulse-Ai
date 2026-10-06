import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const medsFile = path.resolve('app/(app)/medications.tsx');
const trackFile = path.resolve('app/(app)/track.tsx');
const progressFile = path.resolve('app/(app)/progress.tsx');
const metricDetailFile = path.resolve('app/(app)/metric-detail.tsx');

test('Screen 30: Medication Screen validates active dose, actions, and scheduled list', () => {
  const content = fs.readFileSync(medsFile, 'utf8');

  // Verify Header and Tabs
  assert.ok(content.includes('Medications'), 'Must have Medications title');
  assert.ok(content.includes('Today'), 'Must have Today tab');
  assert.ok(content.includes('Schedule'), 'Must have Schedule tab');
  assert.ok(content.includes('History'), 'Must have History tab');

  // Verify Active Due Dose Card
  assert.ok(content.includes('Due now'), 'Must show Due now badge');
  assert.ok(content.includes('Metformin 500 mg'), 'Must include Metformin 500 mg');
  assert.ok(content.includes('8:00 PM'), 'Must show scheduled time');
  assert.ok(content.includes('Taken'), 'Must have Taken button');
  assert.ok(content.includes('Skip'), 'Must have Skip button');
  assert.ok(content.includes('Snooze'), 'Must have Snooze button');

  // Verify Scheduled List
  assert.ok(content.includes('Vitamin D3 1000 IU'), 'Must list Vitamin D3');
  assert.ok(content.includes('Omega-3 500 mg'), 'Must list Omega-3');
  assert.ok(content.includes('Iron Supplement'), 'Must list Iron Supplement');

  // Verify Add Medication CTA
  assert.ok(content.includes('Add Medication'), 'Must have Add Medication CTA');
});

test('Screen 31: Male Track Overview validates 6 modules and zero cycle UI for male pathway', () => {
  const content = fs.readFileSync(trackFile, 'utf8');

  // Verify male-specific modules in grid
  assert.ok(content.includes('Symptoms'), 'Must include Symptoms card');
  assert.ok(content.includes('Activity'), 'Must include Activity card');
  assert.ok(content.includes('Nutrition'), 'Must include Nutrition card');
  assert.ok(content.includes('Water'), 'Must include Water card');
  assert.ok(content.includes('Medications'), 'Must include Medications card');
  assert.ok(content.includes('Hormone Progress'), 'Must include Hormone Progress card');

  // Verify male grid structure
  assert.ok(content.includes('maleGrid'), 'Must contain 2-column maleGrid layout');
  assert.ok(content.includes('encouragementCard'), 'Must contain encouragement card');
  assert.ok(content.includes('Keep tracking consistently for better insights.'),
    'Must display tracking encouragement text');
});

test('Screen 32: Progress Overview validates 4 uncluttered metrics and pathway awareness', () => {
  const content = fs.readFileSync(progressFile, 'utf8');

  assert.ok(content.includes('Your Progress'), 'Must have Your Progress header');
  assert.ok(content.includes('Last 3 Months'), 'Must have range filter dropdown pill');
  assert.ok(content.includes('Overview'), 'Must have Overview tab');
  assert.ok(content.includes('Records'), 'Must have Records tab');

  // Male 4 metrics
  assert.ok(content.includes('Testosterone (Total T)'), 'Must include Testosterone metric');
  assert.ok(content.includes('Weight / BMI'), 'Must include Weight / BMI metric');
  assert.ok(content.includes('Energy & Symptoms'), 'Must include Energy & Symptoms metric');
  assert.ok(content.includes('Screening History'), 'Must include Screening History metric');

  // Sparklines and navigation
  assert.ok(content.includes('sparklineArea'), 'Must render sparkline graphic area');
  assert.ok(content.includes('metric-detail'), 'Must navigate to metric detail');
});

test('Screen 33: Metric Detail validates stats summary, line chart, benchmarks, and interpretation', () => {
  const content = fs.readFileSync(metricDetailFile, 'utf8');

  // Range pills
  assert.ok(content.includes('1M') && content.includes('3M') && content.includes('6M') && content.includes('1Y'),
    'Must have 1M, 3M, 6M, 1Y time range selector');

  // 3 Stat Boxes
  assert.ok(content.includes('Current'), 'Must show Current stat box');
  assert.ok(content.includes('Change'), 'Must show Change stat box');
  assert.ok(content.includes('Previous'), 'Must show Previous stat box');

  // Chart and benchmarks
  assert.ok(content.includes('chartCard'), 'Must render detailed chart card');
  assert.ok(content.includes('Date Range'), 'Must display Date Range row');
  assert.ok(content.includes('Highest'), 'Must display Highest benchmark');
  assert.ok(content.includes('Lowest'), 'Must display Lowest benchmark');

  // Clinical interpretation
  assert.ok(content.includes('What changed?'), 'Must have What changed? section');
});
