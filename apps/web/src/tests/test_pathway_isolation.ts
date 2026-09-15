import { calculateProfileCompletion } from '../utils/profileCompletion';
import { getSymptomCatalog } from '../types/symptom';
import { DEFAULT_MALE_HEALTH_GOAL_OPTIONS, DEFAULT_MALE_CONDITION_OPTIONS } from '../data/mockOnboardingData';
import type { UserProfile } from '../types/onboarding';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('--- Testing Male Pathway Isolation ---');

// 1. Test Profile Completion for Male
const maleProfile: UserProfile = {
  id: 'test_male',
  fullName: 'Ahmed Khan',
  email: 'ahmed@test.com',
  phone: '03001234567',
  dateOfBirth: '1990-01-01',
  heightCm: 178,
  weightKg: 78,
  waistCm: 88,
  gender: 'male',
  pathway: 'male',
  mensHealth: {
    energyLevel: 'moderate',
    sexDrive: 'normal',
    sleepQuality: 'good',
  },
  emergencyContacts: [
    { name: 'Fatima Khan', phone: '03009876543', relation: 'Spouse' },
    { name: 'Ali Khan', phone: '03001112223', relation: 'Brother' },
  ],
  medical: { bloodType: 'O+', allergies: ['None'], medications: ['Vitamin D'], conditions: ['None'] },
  lifestyle: { dietaryPreference: 'halal_omnivore', dailyWaterGlasses: 8, activityLevel: 'moderately_active', sleepHours: 8 },
  goals: { selectedGoals: ['Improve Daily Energy & Stamina'], supportPreference: 'gentle_nudges' },
};

const maleCompletion = calculateProfileCompletion(maleProfile, true);
assert(maleCompletion.percentage >= 80, `Male completion is high: ${maleCompletion.percentage}%`);
assert(!maleCompletion.missingFields.some(f => f.section === "Women's Health"), 'No Women\'s Health missing fields for male profile');
assert(!maleCompletion.missingFields.some(f => f.actionText.toLowerCase().includes('cycle')), 'No cycle action text for male');
assert(!maleCompletion.missingFields.some(f => f.actionText.toLowerCase().includes('period')), 'No period action text for male');

// 2. Test Symptom Catalog for Male
const maleCatalog = getSymptomCatalog(true);
const maleCatalogIds = maleCatalog.map(s => s.id);
assert(!maleCatalogIds.includes('cramps'), 'Male catalog does NOT contain cramps');
assert(!maleCatalogIds.includes('pelvic_discomfort'), 'Male catalog does NOT contain pelvic_discomfort');
assert(maleCatalogIds.includes('fatigue'), 'Male catalog contains fatigue');
assert(maleCatalogIds.includes('reduced_libido'), 'Male catalog contains reduced_libido');
assert(maleCatalogIds.includes('reduced_strength'), 'Male catalog contains reduced_strength');

// Check category labels
const maleCategories = maleCatalog.map(s => s.categoryLabel);
assert(!maleCategories.includes('Cycle & Body'), 'Male catalog does NOT contain "Cycle & Body" category label');

// 3. Test Male Goal Options
const goalDescriptions = DEFAULT_MALE_HEALTH_GOAL_OPTIONS.map(g => `${g.title} ${g.desc}`.toLowerCase());
for (const desc of goalDescriptions) {
  assert(!desc.includes('cramp'), `Goal does not contain cramp: "${desc.slice(0, 40)}..."`);
  assert(!desc.includes('period'), `Goal does not contain period: "${desc.slice(0, 40)}..."`);
  assert(!desc.includes('gynecolog'), `Goal does not mention gynecologist: "${desc.slice(0, 40)}..."`);
}

// 4. Test Male Condition Options
const maleConditions = DEFAULT_MALE_CONDITION_OPTIONS.map(c => c.toLowerCase());
assert(!maleConditions.some(c => c.includes('pcos')), 'Male conditions do not contain PCOS');
assert(!maleConditions.some(c => c.includes('ovary')), 'Male conditions do not contain ovary');
assert(!maleConditions.some(c => c.includes('endometriosis')), 'Male conditions do not contain Endometriosis');

console.log('--- All Pathway Isolation Unit Tests Passed Successfully! ---');
