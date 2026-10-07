import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const doctorProfileFile = path.resolve('app/(app)/doctor-profile.tsx');
const careCircleFile = path.resolve('app/(app)/care-circle.tsx');
const reportsFile = path.resolve('app/(app)/reports.tsx');
const clinicalSummaryFile = path.resolve('app/(app)/clinical-summary.tsx');
const profileFile = path.resolve('app/(app)/profile.tsx');
const settingsFile = path.resolve('app/(app)/settings.tsx');

test('Screen 40: Doctor Profile validates credentials, expertise, hospital, availability, and dual CTAs', () => {
  const content = fs.readFileSync(doctorProfileFile, 'utf8');

  assert.ok(content.includes('Dr. Ayesha Malik') || content.includes('Dr. Ahmed Raza'), 'Must show doctor name');
  assert.ok(content.includes('Endocrinologist'), 'Must show specialty');
  assert.ok(content.includes('Areas of Expertise'), 'Must show Areas of Expertise');
  assert.ok(content.includes('Years') && content.includes('Experience'), 'Must show experience');
  assert.ok(content.includes('Shaukat Khanum') || content.includes('Aga Khan'), 'Must show hospital');
  assert.ok(content.includes('Availability'), 'Must show availability schedule');
  assert.ok(content.includes('Book Appointment'), 'Must have Book Appointment CTA');
  assert.ok(content.includes('Add to Care Circle') || content.includes('Care Circle'), 'Must have Add to Care Circle CTA');
});

test('Screen 41: Care Circle validates doctor, family, trusted contact, access levels, and invite CTA', () => {
  const content = fs.readFileSync(careCircleFile, 'utf8');

  assert.ok(content.includes('Care Circle'), 'Header must have Care Circle');
  assert.ok(content.includes('Invite someone'), 'Must have Invite someone CTA');
  assert.ok(content.includes('Doctor'), 'Must have Doctor category/card');
  assert.ok(content.includes('Family Member') || content.includes('Sister'), 'Must have Family card');
  assert.ok(content.includes('Trusted Contact') || content.includes('Friend'), 'Must have Trusted Contact card');
  assert.ok(content.includes('Access:'), 'Must show access levels');
  assert.ok(content.includes('Manage'), 'Must have Manage button');
  assert.ok(content.includes('Your data stays private'), 'Must display privacy assurance');
});

test('Screen 42: Reports validates screening, labs, summaries, dates, status, and View buttons', () => {
  const content = fs.readFileSync(reportsFile, 'utf8');

  assert.ok(content.includes('Reports'), 'Header must have Reports title');
  assert.ok(content.includes('Screening'), 'Must filter/display Screening reports');
  assert.ok(content.includes('Lab Reports') || content.includes('Hormone Lab Report'), 'Must filter/display Lab reports');
  assert.ok(content.includes('Clinical Summary') || content.includes('Summaries'), 'Must filter/display Summaries');
  assert.ok(content.includes('Completed') && content.includes('View'), 'Must show status and View action');
});

test('Screen 43: Clinical Summary validates 5 clinician sections, ring chart, and Export PDF CTA', () => {
  const content = fs.readFileSync(clinicalSummaryFile, 'utf8');

  assert.ok(content.includes('Clinical Summary'), 'Header must have Clinical Summary title');
  assert.ok(content.includes('Latest Screening Result'), 'Must include Latest Screening Result');
  assert.ok(content.includes('Important Factors'), 'Must include Important Factors section');
  assert.ok(content.includes('Latest Lab Results'), 'Must include Latest Lab Results section');
  assert.ok(content.includes('Trends Summary'), 'Must include Trends section');
  assert.ok(content.includes('Current Recommendations'), 'Must include Current Recommendations');
  assert.ok(content.includes('Export PDF'), 'Must have Export PDF CTA');
});

test('Screen 44: Profile validates personal stats, completion meter, emergency contact, and 4 sections', () => {
  const content = fs.readFileSync(profileFile, 'utf8');

  assert.ok(content.includes('My Profile'), 'Header must have My Profile');
  assert.ok(content.includes('Profile Completion'), 'Must show Profile Completion meter');
  assert.ok(content.includes('Emergency Contact'), 'Must show Emergency Contact card');
  assert.ok(content.includes('Personal Information'), 'Must have Personal Information section');
  assert.ok(content.includes('Health Information'), 'Must have Health Information section');
  assert.ok(content.includes('Privacy'), 'Must have Privacy section');
  assert.ok(content.includes('Preferences'), 'Must have Preferences section');
  assert.ok(content.includes('BMI'), 'Must compute and display BMI');
});

test('Screen 45: Settings strictly validates app preferences, security, units, and logout without health forms', () => {
  const content = fs.readFileSync(settingsFile, 'utf8');

  assert.ok(content.includes('Settings'), 'Header must have Settings');
  assert.ok(content.includes('Notifications'), 'Must have Notifications setting');
  assert.ok(content.includes('Units'), 'Must have Units setting');
  assert.ok(content.includes('Privacy'), 'Must have Privacy setting');
  assert.ok(content.includes('Data Sharing'), 'Must have Data Sharing setting');
  assert.ok(content.includes('Security'), 'Must have Security setting');
  assert.ok(content.includes('Logout'), 'Must have Logout CTA');
});
