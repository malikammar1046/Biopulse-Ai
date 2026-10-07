import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const guidanceFile = path.resolve('app/(app)/guidance.tsx');
const recommendationsFile = path.resolve('app/(app)/recommendations.tsx');
const aiFile = path.resolve('app/(app)/ai-companion.tsx');
const appointmentsFile = path.resolve('app/(app)/appointments.tsx');
const specialistsFile = path.resolve('app/(app)/specialists.tsx');

test('Screen 34: Guidance Home validates Next Best Action, categorized sections, and bottom nav', () => {
  const content = fs.readFileSync(guidanceFile, 'utf8');

  assert.ok(content.includes('Guidance'), 'Header must have Guidance title');
  assert.ok(content.includes('Next Best Action'), 'Must have Next Best Action card');
  assert.ok(content.includes('Nutrition'), 'Must have Nutrition section');
  assert.ok(content.includes('Fitness'), 'Must have Fitness section');
  assert.ok(content.includes('Health Education'), 'Must have Health Education section');
  assert.ok(content.includes('AI Companion'), 'Must have AI Companion section');
  assert.ok(content.includes('BioPulseBottomNav'), 'Must have fixed bottom navigation');
});

test('Screen 35: Recommendations validates categories and What, Why, How structure', () => {
  const content = fs.readFileSync(recommendationsFile, 'utf8');

  // Categories
  assert.ok(content.includes('Nutrition'), 'Must have Nutrition category');
  assert.ok(content.includes('Movement'), 'Must have Movement category');
  assert.ok(content.includes('Lifestyle'), 'Must have Lifestyle category');
  assert.ok(content.includes('Follow-up'), 'Must have Follow-up category');

  // What, Why, How breakdown
  assert.ok(content.includes('What') && content.includes('Why') && content.includes('How'),
    'Must break down recommendations into What, Why, and How');
  assert.ok(content.includes('Eat Low-GI Breakfast'), 'Must include breakfast recommendation');
  assert.ok(content.includes('Walk for 30 Minutes Daily'), 'Must include walking recommendation');
  assert.ok(content.includes('Improve Sleep Quality'), 'Must include sleep recommendation');
});

test('Screen 36: AI Companion validates disclaimer, header, quick prompts, and chat layout', () => {
  const content = fs.readFileSync(aiFile, 'utf8');

  assert.ok(content.includes('BioPulse AI Companion'), 'Must display BioPulse AI Companion header');
  assert.ok(content.includes('Health information only') && content.includes('Not a replacement for medical care'),
    'Must display required clinical disclaimer');

  // 4 quick prompts
  assert.ok(content.includes('Explain my screening result'), 'Must have Explain my screening result prompt');
  assert.ok(content.includes('What should I do next?'), 'Must have What should I do next? prompt');
  assert.ok(content.includes('Why is this factor important?'), 'Must have Why is this factor important? prompt');
  assert.ok(content.includes('Explain my lab result'), 'Must have Explain my lab result prompt');

  assert.ok(content.includes('attach-outline'), 'Must have attachment icon');
  assert.ok(content.includes('Type your message...'), 'Must have text input with placeholder');
});

test('Screen 37: Appointments validates Upcoming, Find Specialist, History tabs and card details', () => {
  const content = fs.readFileSync(appointmentsFile, 'utf8');

  assert.ok(content.includes('Appointments'), 'Must have Appointments title');
  assert.ok(content.includes('Upcoming'), 'Must have Upcoming tab');
  assert.ok(content.includes('Find Specialist'), 'Must have Find Specialist tab');
  assert.ok(content.includes('History'), 'Must have History tab');

  // Upcoming appointment fields
  assert.ok(content.includes('Dr. Sara Khan'), 'Must display doctor name');
  assert.ok(content.includes('Endocrinologist'), 'Must display specialty');
  assert.ok(content.includes('15 Mar 2026'), 'Must display date');
  assert.ok(content.includes('10:00 AM'), 'Must display time');
  assert.ok(content.includes('HealthCare Hospital, Lahore'), 'Must display hospital location');
  assert.ok(content.includes('Reschedule'), 'Must have Reschedule action');
});

test('Screen 38 & 39: Find Specialist validates pathway separation and required specialties', () => {
  const content = fs.readFileSync(specialistsFile, 'utf8');

  assert.ok(content.includes('Find a Specialist'), 'Header must be Find a Specialist');

  // Screen 38: Female specialties
  const femaleSpecialties = [
    'Endocrinologists',
    'Gynecologists',
    'Reproductive Endocrinologists',
    'Nutritionists',
    'Dermatologists',
  ];
  for (const spec of femaleSpecialties) {
    assert.ok(content.includes(spec), `Female list must include: ${spec}`);
  }

  // Screen 39: Male specialties
  const maleSpecialties = [
    'Endocrinologists',
    'Urologists',
    'Andrologists',
    'Internal Medicine',
    'Nutrition Specialists',
  ];
  for (const spec of maleSpecialties) {
    assert.ok(content.includes(spec), `Male list must include: ${spec}`);
  }

  // Pathway banners
  assert.ok(content.includes("Specialists for Women's Health"), 'Must have Female banner');
  assert.ok(content.includes("Specialists for Men's Health"), 'Must have Male banner');
  assert.ok(content.includes('Book Appointment'), 'Must have Book Appointment CTA');
});
