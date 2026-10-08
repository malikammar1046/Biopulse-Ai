import assert from 'node:assert/strict';

/**
 * Strong male-specific signal tokens and phrases.
 * Excludes male specialists from female care pathway.
 */
export const STRONG_MALE_SIGNALS = [
  'urologist',
  'urology',
  'andrologist',
  'andrology',
  'male sexual health',
  'male infertility',
  'male subfertility',
  'male fertility',
  'male reproductive',
  'male health',
  'hypogonadism',
  'testosterone replacement',
  'testosterone deficit',
  'testosterone replenishment',
  'testosterone optimization',
  'testosterone',
  'trt',
  'erectile dysfunction',
  'andropause',
  "men's health",
];

/**
 * Strong female-specific signal tokens and phrases.
 * Excludes female specialists from male care pathway.
 */
export const STRONG_FEMALE_SIGNALS = [
  'gynecologist',
  'gynecology',
  'gynaecologist',
  'gynaecology',
  'obstetrician',
  'obstetrics',
  'pcos',
  'polycystic ovary',
  'polycystic ovarian',
  'female infertility',
  'female subfertility',
  'female fertility',
  'female reproductive',
  "women's health",
  "women's reproductive",
  'maternal',
  'antenatal',
  'ovulation induction',
  'ovarian health',
];

export function containsClinicalSignal(text, signals) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return signals.some((signal) => {
    if (signal.length <= 4 && !signal.includes(' ')) {
      const regex = new RegExp(`\\b${signal}\\b`, 'i');
      return regex.test(lower);
    }
    return lower.includes(signal);
  });
}

export function getDoctorPathway(doctor) {
  // STEP 1 — EXPLICIT DATABASE PATHWAY
  if (doctor.pathway === 'female_pcos' || doctor.pathway === 'female') {
    return 'female';
  }
  if (doctor.pathway === 'male_hypogonadism' || doctor.pathway === 'male') {
    return 'male';
  }
  if (doctor.pathway === 'both') {
    return 'both';
  }

  // STEP 2 — STRONG EXCLUSIVE SPECIALTY SIGNALS
  const structuredText = `${doctor.specialty || ''} ${doctor.services_offered || ''}`;
  const maleInStructured = containsClinicalSignal(structuredText, STRONG_MALE_SIGNALS);
  const femaleInStructured = containsClinicalSignal(structuredText, STRONG_FEMALE_SIGNALS);

  if (maleInStructured && !femaleInStructured) {
    return 'male';
  }
  if (femaleInStructured && !maleInStructured) {
    return 'female';
  }
  if (maleInStructured && femaleInStructured) {
    return 'both';
  }

  // Fallback check on short_bio and qualifications
  const fallbackText = `${doctor.short_bio || ''} ${doctor.qualifications || ''}`;
  const maleInFallback = containsClinicalSignal(fallbackText, STRONG_MALE_SIGNALS);
  const femaleInFallback = containsClinicalSignal(fallbackText, STRONG_FEMALE_SIGNALS);

  if (maleInFallback && !femaleInFallback) {
    return 'male';
  }
  if (femaleInFallback && !maleInFallback) {
    return 'female';
  }
  if (maleInFallback && femaleInFallback) {
    return 'both';
  }

  // STEP 3 — CONSERVATIVE FALLBACK
  return 'unassigned';
}

export function isDoctorRelevantToPathway(doctor, pathway) {
  const norm = pathway.toLowerCase().trim();
  const isFemale = norm === 'female' || norm === 'female_pcos' || norm === 'pcos';
  const isMale = norm === 'male' || norm === 'male_hypogonadism' || norm === 'hypogonadism';

  const allClinicalText = `${doctor.specialty || ''} ${doctor.services_offered || ''} ${doctor.short_bio || ''} ${doctor.qualifications || ''}`;
  const hasStrongMale = containsClinicalSignal(allClinicalText, STRONG_MALE_SIGNALS);
  const hasStrongFemale = containsClinicalSignal(allClinicalText, STRONG_FEMALE_SIGNALS);

  // STEP 5 — EXCLUSION OVERRIDES
  if (isFemale) {
    if (hasStrongMale && doctor.pathway !== 'both' && !hasStrongFemale) {
      return false;
    }
  }

  if (isMale) {
    if (hasStrongFemale && doctor.pathway !== 'both' && !hasStrongMale) {
      return false;
    }
  }

  // STEP 6 — SEPARATE CLASSIFICATION FROM FILTERING
  const classification = getDoctorPathway(doctor);

  if (isFemale) {
    return classification === 'female' || classification === 'both';
  }

  if (isMale) {
    return classification === 'male' || classification === 'both';
  }

  if (norm === 'both' || norm === 'all') {
    return classification === 'female' || classification === 'male' || classification === 'both';
  }

  return false;
}

export function getRelevantDoctorsForPathway(doctors, pathway, options = {}) {
  const normalizedPathway = pathway.toLowerCase().trim() === 'male' ? 'male' : 'female';
  const strict = options.strict ?? true;

  let filtered = [...doctors];
  if (strict) {
    filtered = filtered.filter((doc) => isDoctorRelevantToPathway(doc, normalizedPathway));
  }
  return filtered;
}

/**
 * Calculates condition-specific relevance score for Dashboard previews.
 */
export function getDoctorConditionScore(doctor, pathway) {
  const norm = pathway.toLowerCase().trim() === 'male' ? 'male' : 'female';

  if (!isDoctorRelevantToPathway(doctor, norm)) {
    return -1;
  }

  const clinicalText = `${doctor.specialty || ''} ${doctor.services_offered || ''} ${doctor.relevance_reason || ''} ${doctor.short_bio || ''}`.toLowerCase();

  if (norm === 'female') {
    const isFemalePathway = doctor.pathway === 'female_pcos' || doctor.pathway === 'female';
    const isSharedPathway = doctor.pathway === 'both';

    const hasPCOS = clinicalText.includes('pcos') || clinicalText.includes('polycystic ovary') || clinicalText.includes('polycystic ovarian');
    const hasGynecology = clinicalText.includes('gynecolog') || clinicalText.includes('gynaecolog');
    const hasReproductiveEndo = clinicalText.includes('reproductive endocrin') || clinicalText.includes('reproductive medicine');
    const hasFemaleFertilityOrHormone = (clinicalText.includes('fertility') || clinicalText.includes('infertility') || clinicalText.includes('ovulation') || clinicalText.includes('antenatal') || clinicalText.includes('hormon')) &&
      (hasGynecology || hasPCOS || clinicalText.includes('female') || clinicalText.includes('women'));

    // Priority 1: pathway === female_pcos AND PCOS explicitly mentioned
    if (isFemalePathway && hasPCOS) {
      return 400;
    }
    // Priority 2: gynecologist / reproductive endocrinology
    if (isFemalePathway && (hasGynecology || hasReproductiveEndo)) {
      return 300;
    }
    // Priority 3: female fertility with PCOS/hormonal relevance
    if (isFemalePathway && hasFemaleFertilityOrHormone) {
      return 200;
    }
    // Priority 4: genuinely shared specialist with explicit PCOS relevance
    if (isSharedPathway && hasPCOS) {
      return 100;
    }
    // Disqualified from dashboard preview
    return 0;
  }

  if (norm === 'male') {
    const isMalePathway = doctor.pathway === 'male_hypogonadism' || doctor.pathway === 'male';
    const isSharedPathway = doctor.pathway === 'both';

    const hasHypogonadismOrTestosterone = clinicalText.includes('hypogonadism') ||
      clinicalText.includes('testosterone') ||
      clinicalText.includes('androgen') ||
      clinicalText.includes('andropause') ||
      clinicalText.includes('trt');
    const hasAndrology = clinicalText.includes('androlog') || clinicalText.includes('andrology');
    const hasUrology = clinicalText.includes('urolog') || clinicalText.includes('urology');
    const hasMaleHormoneRelevance = clinicalText.includes('male sexual health') ||
      clinicalText.includes('male fertility') ||
      clinicalText.includes('male subfertility') ||
      clinicalText.includes('male infertility') ||
      clinicalText.includes('erectile dysfunction') ||
      clinicalText.includes("men's health") ||
      clinicalText.includes('male health');
    const hasEndocrinology = clinicalText.includes('endocrin');

    // Priority 1: pathway === male_hypogonadism AND hypogonadism/testosterone explicitly mentioned
    if (isMalePathway && hasHypogonadismOrTestosterone) {
      return 400;
    }
    // Priority 2: andrologist / urologist with male hormone relevance
    if (isMalePathway && (hasAndrology || (hasUrology && hasMaleHormoneRelevance))) {
      return 300;
    }
    // Priority 3: endocrinologist assigned to male_hypogonadism
    if (isMalePathway && (hasEndocrinology || hasUrology)) {
      return 200;
    }
    // Priority 4: shared clinician with explicit male hormonal relevance
    if (isSharedPathway && (hasHypogonadismOrTestosterone || (hasAndrology && hasMaleHormoneRelevance))) {
      return 100;
    }
    // Disqualified from dashboard preview
    return 0;
  }

  return 0;
}

export function getDashboardRelevantDoctors(doctors, pathway, limit = 3) {
  const norm = pathway.toLowerCase().trim() === 'male' ? 'male' : 'female';

  const qualified = doctors
    .map((doc) => ({
      doc,
      score: getDoctorConditionScore(doc, norm),
    }))
    .filter((item) => item.score > 0);

  qualified.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const orderA = a.doc.display_order ?? 999;
    const orderB = b.doc.display_order ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const ratingA = typeof a.doc.rating === 'string' ? parseFloat(a.doc.rating) : (a.doc.rating ?? 0);
    const ratingB = typeof b.doc.rating === 'string' ? parseFloat(b.doc.rating) : (b.doc.rating ?? 0);
    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }
    return (a.doc.id ?? 0) - (b.doc.id ?? 0);
  });

  const result = qualified.map((item) => item.doc);
  return limit > 0 ? result.slice(0, limit) : result;
}

console.log('🧪 Starting Doctor Pathway Architecture Regression Tests...\n');

// ============================================================================
// CASE 1: Exact Offending Doctor Specialty
// "Consultant Urologist, Andrologist & Male Sexual Health Specialist"
// ============================================================================
console.log('CASE 1: Male specialist with no explicit pathway');
const case1Doctor = {
  id: 101,
  name: 'Dr. Hafiz Abdul Momin',
  specialty: 'Consultant Urologist, Andrologist & Male Sexual Health Specialist',
  services_offered: 'Male Hypogonadism Assessment, Testosterone Replacement Protocols, Andrology & Sexology',
  qualifications: 'MBBS, FCPS (Urology)',
  short_bio: 'Accomplished Urologist and Andrologist specializing in male hypogonadism and testosterone replenishment.',
  pathway: undefined, // Missing pathway metadata
};
assert.equal(getDoctorPathway(case1Doctor), 'male', 'Case 1 must classify as male');
assert.equal(isDoctorRelevantToPathway(case1Doctor, 'female'), false, 'Case 1 must NOT be relevant to female pathway');
assert.equal(isDoctorRelevantToPathway(case1Doctor, 'male'), true, 'Case 1 must be relevant to male pathway');
console.log('  ✅ PASSED: Male specialist classified as male, female relevance = false, male relevance = true\n');

// ============================================================================
// CASE 2: Female Specialist
// "Consultant Gynecologist & PCOS Specialist"
// ============================================================================
console.log('CASE 2: Female gynecologist & PCOS specialist');
const case2Doctor = {
  id: 102,
  name: 'Dr. Saddiqa Akhtar',
  specialty: 'Consultant Gynecologist & PCOS Specialist',
  services_offered: 'PCOS Management, Hormonal Cycle Assessment, Antenatal Care',
  qualifications: 'MBBS, FCPS',
  short_bio: 'Consultant Gynecologist specialized in polycystic ovarian syndrome and reproductive care.',
  pathway: undefined,
};
assert.equal(getDoctorPathway(case2Doctor), 'female', 'Case 2 must classify as female');
assert.equal(isDoctorRelevantToPathway(case2Doctor, 'female'), true, 'Case 2 must be relevant to female pathway');
assert.equal(isDoctorRelevantToPathway(case2Doctor, 'male'), false, 'Case 2 must NOT be relevant to male pathway');
console.log('  ✅ PASSED: Female specialist classified as female, female relevance = true, male relevance = false\n');

// ============================================================================
// CASE 3: Explicit Pathway = 'both'
// Genuinely dual-practice clinician
// ============================================================================
console.log('CASE 3: Explicit pathway = both');
const case3Doctor = {
  id: 103,
  name: 'Dr. Mohsin Asif',
  specialty: 'Andrologist, Diabetologist, Endocrinologist & Sexologist',
  services_offered: 'PCOS Metabolic Care, Diabetes Mellitus, Andropause & Male Hypogonadism',
  pathway: 'both',
};
assert.equal(getDoctorPathway(case3Doctor), 'both', 'Case 3 must classify as both');
assert.equal(isDoctorRelevantToPathway(case3Doctor, 'female'), true, 'Case 3 must be relevant to female pathway');
assert.equal(isDoctorRelevantToPathway(case3Doctor, 'male'), true, 'Case 3 must be relevant to male pathway');
console.log('  ✅ PASSED: Explicit pathway = both relevant to both female and male pathways\n');

// ============================================================================
// CASE 4: Generic Endocrinologist with No Sex-Specific Specialty
// Must NOT automatically guess 'both'
// ============================================================================
console.log('CASE 4: Generic endocrinologist with no sex-specific specialty');
const case4Doctor = {
  id: 104,
  name: 'Dr. General Endo',
  specialty: 'Consultant Endocrinologist',
  services_offered: 'Thyroid, Diabetes, General Hormonal Evaluation',
  short_bio: 'Specialist in clinical endocrinology and metabolic disorders.',
  pathway: undefined,
};
assert.equal(getDoctorPathway(case4Doctor), 'unassigned', 'Case 4 must be unassigned, NOT guessed as both');
assert.equal(isDoctorRelevantToPathway(case4Doctor, 'female'), false, 'Unassigned generic doctor must NOT leak into female');
assert.equal(isDoctorRelevantToPathway(case4Doctor, 'male'), false, 'Unassigned generic doctor must NOT leak into male');
console.log('  ✅ PASSED: Generic endocrinologist not guessed as both; isolated from authenticated pathways\n');

// ============================================================================
// CASE 5: Male Specialist with Generic Fertility/Reproductive Words in Bio
// Must remain MALE
// ============================================================================
console.log('CASE 5: Male specialist whose bio contains generic fertility/reproductive words');
const case5Doctor = {
  id: 105,
  name: 'Dr. Fawad Nasrullah',
  specialty: 'Senior Professor of Urology, Andrologist & Male Sexual Health Specialist',
  services_offered: 'Male Hypogonadism Treatment, Testosterone Monitoring, Andrology Evaluation',
  short_bio: 'Extensive background in couple reproductive medicine, family fertility evaluation, and endocrine optimization.',
  pathway: undefined,
};
assert.equal(getDoctorPathway(case5Doctor), 'male', 'Case 5 must remain male');
assert.equal(isDoctorRelevantToPathway(case5Doctor, 'female'), false, 'Case 5 must NOT leak to female');
assert.equal(isDoctorRelevantToPathway(case5Doctor, 'male'), true, 'Case 5 must be relevant to male');
console.log('  ✅ PASSED: Male specialist with reproductive/fertility bio words remains strictly MALE\n');

// ============================================================================
// CASE 6: Female Specialist with General Hormone/Endocrine Terminology
// Must remain FEMALE
// ============================================================================
console.log('CASE 6: Female specialist whose bio contains general hormone/endocrine terminology');
const case6Doctor = {
  id: 106,
  name: 'Prof. Dr. Sara Ejaz',
  specialty: 'Senior Professor of Gynecology & Obstetrics',
  services_offered: 'PCOS Evaluation & Management, Ovarian Health Monitoring',
  short_bio: 'Leading clinician in complex hormonal disorders, endocrine therapy, and metabolic lifestyle intervention.',
  pathway: undefined,
};
assert.equal(getDoctorPathway(case6Doctor), 'female', 'Case 6 must remain female');
assert.equal(isDoctorRelevantToPathway(case6Doctor, 'female'), true, 'Case 6 must be relevant to female');
assert.equal(isDoctorRelevantToPathway(case6Doctor, 'male'), false, 'Case 6 must NOT leak to male');
console.log('  ✅ PASSED: Female specialist with hormone/endocrine bio words remains strictly FEMALE\n');

// ============================================================================
// CASE 7: Strict Slicing Order in Dashboard Preview
// ============================================================================
console.log('CASE 7: Dashboard preview order test');
const mixedPool = [
  case1Doctor, // Male
  case2Doctor, // Female
  case5Doctor, // Male
  case6Doctor, // Female
  case3Doctor, // Both
];
const femalePreview = getRelevantDoctorsForPathway(mixedPool, 'female', { strict: true }).slice(0, 3);
assert.equal(femalePreview.every((d) => isDoctorRelevantToPathway(d, 'female')), true);
assert.equal(femalePreview.some((d) => d.id === 101 || d.id === 105), false, 'Zero male doctors in female preview');
console.log('  ✅ PASSED: Dashboard preview strictly filters out opposite-sex specialists\n');

// ============================================================================
// CASE 8: Generic Family Medicine does NOT take a female PCOS dashboard slot
// ============================================================================
console.log('CASE 8: Generic family medicine does not take a female PCOS dashboard slot');
const genericFamilyDoctor = {
  id: 201,
  name: 'Dr. Hamza Farooq',
  specialty: 'Family Medicine Specialist',
  services_offered: 'Primary Care, Health Screenings, General Consultations',
  short_bio: 'Comprehensive family physician providing preventive and acute illness care.',
  pathway: 'both',
  display_order: 1, // Lower display_order than specialists to test strict filtering!
};
const pcosSpecialist = {
  id: 202,
  name: 'Dr. Saddiqa Akhtar',
  specialty: 'Gynecologist & Obstetrician (PCOS & Hormonal Specialist)',
  services_offered: 'PCOS Management, Hormonal Cycle Assessment',
  short_bio: 'Specialist in PCOS metabolic protocols and ovulation health.',
  pathway: 'female_pcos',
  display_order: 5,
};
assert.equal(getDoctorConditionScore(genericFamilyDoctor, 'female'), 0, 'Generic family doctor must score 0 for female PCOS preview');
const femaleDashboardSelection = getDashboardRelevantDoctors([genericFamilyDoctor, pcosSpecialist], 'female', 3);
assert.equal(femaleDashboardSelection.some((d) => d.id === 201), false, 'Generic family medicine must NOT be included in PCOS preview');
assert.equal(femaleDashboardSelection[0].id, 202, 'PCOS specialist must be selected');
console.log('  ✅ PASSED: Generic family medicine excluded from PCOS Care dashboard preview\n');

// ============================================================================
// CASE 9: Generic Internal Medicine does NOT take a male hypogonadism slot
// ============================================================================
console.log('CASE 9: Generic internal medicine does not take a male hypogonadism dashboard slot');
const genericInternalDoctor = {
  id: 203,
  name: 'Dr. Ayesha Malik',
  specialty: 'Internal Medicine Specialist',
  services_offered: 'Hypertension, Gastrointestinal, Routine Health Checks',
  short_bio: 'Senior internist focused on chronic disease management and diagnostic consultations.',
  pathway: 'both',
  display_order: 1,
};
const maleSpecialist = {
  id: 204,
  name: 'Prof. Dr. Fawad Nasrullah',
  specialty: 'Senior Professor of Urology, Andrologist & Male Sexual Health Specialist',
  services_offered: 'Male Hypogonadism Treatment, Testosterone Monitoring, Andrology Evaluation',
  short_bio: 'Leading authority in male hypogonadism, low testosterone deficiency, and andrological therapy.',
  pathway: 'male_hypogonadism',
  display_order: 12,
};
assert.equal(getDoctorConditionScore(genericInternalDoctor, 'male'), 0, 'Generic internal doctor must score 0 for male hypogonadism preview');
const maleDashboardSelection = getDashboardRelevantDoctors([genericInternalDoctor, maleSpecialist], 'male', 3);
assert.equal(maleDashboardSelection.some((d) => d.id === 203), false, 'Generic internal medicine must NOT be included in Male Hormone preview');
assert.equal(maleDashboardSelection[0].id, 204, 'Male hypogonadism specialist must be selected');
console.log('  ✅ PASSED: Generic internal medicine excluded from Male Hormone Care dashboard preview\n');

// ============================================================================
// CASE 10: PCOS Gynecologist ranks above generic shared doctor on female dashboard
// ============================================================================
console.log('CASE 10: PCOS Gynecologist ranks above generic shared doctor on female dashboard');
const sharedDoctorWithPcos = {
  id: 205,
  name: 'Dr. Mohsin Asif',
  specialty: 'Andrologist, Diabetologist, Endocrinologist & Sexologist',
  services_offered: 'PCOS Metabolic Care, Diabetes Mellitus, Andropause & Male Hypogonadism',
  pathway: 'both',
  display_order: 2,
};
const femaleDashboardRanked = getDashboardRelevantDoctors([sharedDoctorWithPcos, pcosSpecialist], 'female', 3);
assert.equal(femaleDashboardRanked[0].id, 202, 'PCOS Gynecologist (Priority 1, score 400) must rank ABOVE shared doctor (score 100)');
assert.equal(femaleDashboardRanked[1].id, 205, 'Shared doctor with explicit PCOS care ranks in slot 2');
console.log('  ✅ PASSED: Direct PCOS gynecologist strictly outranks shared doctor\n');

// ============================================================================
// CASE 11: Hypogonadism/Andrology specialist ranks above shared doctor on male dashboard
// ============================================================================
console.log('CASE 11: Hypogonadism/andrology specialist ranks above shared doctor on male dashboard');
const sharedDoctorWithHypogonadism = {
  id: 206,
  name: 'Dr. Muhammad Haris Burki',
  specialty: 'Consultant Sexologist, Sexual Health Specialist & Psychiatrist',
  services_offered: 'Female & Male Sexual Medicine, Male Hypogonadism Support, Psychosexual Therapy',
  pathway: 'both',
  display_order: 5,
};
const maleDashboardRanked = getDashboardRelevantDoctors([sharedDoctorWithHypogonadism, maleSpecialist], 'male', 3);
assert.equal(maleDashboardRanked[0].id, 204, 'Direct hypogonadism/andrology specialist (Priority 1, score 400) must rank ABOVE shared doctor (score 100)');
assert.equal(maleDashboardRanked[1].id, 206, 'Shared clinician with hypogonadism support ranks in slot 2');
console.log('  ✅ PASSED: Direct male hypogonadism specialist strictly outranks shared doctor\n');

console.log('🎉 ALL 11 REGRESSION SUITE CASES PASSED PERFECTLY!\n');
