import type { Doctor } from '../types/doctor';

export type PathwayClinicalBranch = 'female' | 'male' | 'both' | 'unassigned';

/**
 * Strong, exclusive male health signals.
 * Designates urology, andrology, male sexual health, male infertility, hypogonadism,
 * testosterone deficiency / replacement therapy, and erectile dysfunction.
 * Excludes doctors with these signals from the female care pathway.
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
] as const;

/**
 * Strong, exclusive female health signals.
 * Designates gynecology, obstetrics, PCOS, polycystic ovary, female infertility,
 * and women's reproductive health.
 * Excludes doctors with these signals from the male care pathway.
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
] as const;

/**
 * Checks if target text contains any of the signal phrases or stems.
 * Word-boundary matching is used for short tokens (<= 4 chars like "trt"),
 * and case-insensitive substring matching for medical stems/phrases.
 */
export function containsClinicalSignal(text: string | null | undefined, signals: readonly string[]): boolean {
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

/**
 * Extracts a clinical pathway classification for a doctor.
 * 
 * PRECEDENCE:
 * STEP 1 — EXPLICIT DATABASE PATHWAY
 *   female_pcos | female => 'female'
 *   male_hypogonadism | male => 'male'
 *   both => 'both'
 * 
 * STEP 2 — STRONG EXCLUSIVE SPECIALTY SIGNALS (If pathway is missing)
 *   Strong MALE signals without female signals => 'male'
 *   Strong FEMALE signals without male signals => 'female'
 *   Structured presence of BOTH female and male markers => 'both'
 * 
 * STEP 3 — CONSERVATIVE FALLBACK
 *   Generic endocrinologists or unclassified clinicians do NOT guess 'both'.
 *   Returns 'unassigned'.
 */
export function getDoctorPathway(doctor: Doctor): PathwayClinicalBranch {
  // STEP 1 — EXPLICIT DATABASE PATHWAY
  if (doctor.pathway === 'female_pcos' || (doctor.pathway as string) === 'female') {
    return 'female';
  }
  if (doctor.pathway === 'male_hypogonadism' || (doctor.pathway as string) === 'male') {
    return 'male';
  }
  if (doctor.pathway === 'both') {
    return 'both';
  }

  // STEP 2 — STRONG EXCLUSIVE SPECIALTY SIGNALS
  // Inspect structured specialty and services_offered
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
  // Do NOT automatically guess 'both' for generic endocrinologists or unknown doctors.
  return 'unassigned';
}

/**
 * Checks whether a doctor is clinically relevant to a patient's health pathway.
 * Strict exclusion overrides are applied:
 * - Female users: EXCLUDE doctors with strong male-only signals (unless explicitly pathway === 'both').
 * - Male users: EXCLUDE doctors with strong female-only signals (unless explicitly pathway === 'both').
 * 
 * Relevancy rule:
 * Female: classification === 'female' || classification === 'both'
 * Male: classification === 'male' || classification === 'both'
 */
export function isDoctorRelevantToPathway(
  doctor: Doctor,
  pathway: 'female' | 'male' | 'both' | string
): boolean {
  const norm = pathway.toLowerCase().trim();
  const isFemale = norm === 'female' || norm === 'female_pcos' || norm === 'pcos';
  const isMale = norm === 'male' || norm === 'male_hypogonadism' || norm === 'hypogonadism';

  const allClinicalText = `${doctor.specialty || ''} ${doctor.services_offered || ''} ${doctor.short_bio || ''} ${doctor.qualifications || ''}`;
  const hasStrongMale = containsClinicalSignal(allClinicalText, STRONG_MALE_SIGNALS);
  const hasStrongFemale = containsClinicalSignal(allClinicalText, STRONG_FEMALE_SIGNALS);

  // STEP 5 — EXCLUSION OVERRIDES
  if (isFemale) {
    // If doctor has strong male-only signal and is not explicitly pathway === 'both' -> EXCLUDE
    if (hasStrongMale && doctor.pathway !== 'both' && !hasStrongFemale) {
      return false;
    }
  }

  if (isMale) {
    // If doctor has strong female-only signal and is not explicitly pathway === 'both' -> EXCLUDE
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

export interface GetRelevantDoctorsOptions {
  strict?: boolean;
  searchQuery?: string;
  specialtyFilter?: string;
  sortBy?: 'recommended' | 'experience' | 'fee-asc' | 'fee-desc' | 'rating' | 'name';
}

/**
 * Filters and prioritizes doctors for a patient's care pathway.
 * Pathway filtering is applied strictly first before slicing or pagination.
 * No fallbacks to showing all doctors or defaulting unknown doctors to female.
 */
export function getRelevantDoctorsForPathway(
  doctors: Doctor[],
  pathway: 'female' | 'male' | string,
  options?: GetRelevantDoctorsOptions
): Doctor[] {
  const normalizedPathway = pathway.toLowerCase().trim() === 'male' ? 'male' : 'female';
  const strict = options?.strict ?? true;

  let filtered = [...doctors];

  // 1. Strict Pathway filtering
  if (strict) {
    filtered = filtered.filter((doc) => isDoctorRelevantToPathway(doc, normalizedPathway));
  }

  // 2. Search query filter
  if (options?.searchQuery?.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    filtered = filtered.filter((doc) => {
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpecialty = doc.specialty?.toLowerCase().includes(q) ?? false;
      const matchLocation = doc.location?.toLowerCase().includes(q) ?? false;
      const matchServices = doc.services_offered?.toLowerCase().includes(q) ?? false;
      const matchBio = doc.short_bio?.toLowerCase().includes(q) ?? false;
      const matchQualifications = doc.qualifications?.toLowerCase().includes(q) ?? false;
      return (
        matchName ||
        matchSpecialty ||
        matchLocation ||
        matchServices ||
        matchBio ||
        matchQualifications
      );
    });
  }

  // 3. Specialty filter
  if (options?.specialtyFilter && options.specialtyFilter !== 'all') {
    const filterTerm = options.specialtyFilter.toLowerCase();
    filtered = filtered.filter((doc) => {
      const specialty = (doc.specialty || '').toLowerCase();
      const services = (doc.services_offered || '').toLowerCase();
      return specialty.includes(filterTerm) || services.includes(filterTerm);
    });
  }

  // 4. Sorting
  const sortBy = options?.sortBy || 'recommended';
  filtered.sort((a, b) => {
    // If not strict, prioritize pathway-relevant doctors first
    if (!strict) {
      const isARelevant = isDoctorRelevantToPathway(a, normalizedPathway);
      const isBRelevant = isDoctorRelevantToPathway(b, normalizedPathway);
      if (isARelevant && !isBRelevant) return -1;
      if (!isARelevant && isBRelevant) return 1;
    }

    if (sortBy === 'experience') {
      const expA = a.experience_years ?? 0;
      const expB = b.experience_years ?? 0;
      return expB - expA;
    }

    if (sortBy === 'fee-asc') {
      return extractMinFee(a.fee) - extractMinFee(b.fee);
    }

    if (sortBy === 'fee-desc') {
      return extractMinFee(b.fee) - extractMinFee(a.fee);
    }

    if (sortBy === 'rating') {
      const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating ?? 0);
      const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating ?? 0);
      return ratingB - ratingA;
    }

    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }

    // Default 'recommended': order by display_order, then id
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  return filtered;
}

/**
 * Calculates a condition-specific relevance score for the Dashboard preview.
 * 
 * Female Dashboard ("PCOS Care"):
 * 1. (400) pathway === female_pcos AND PCOS explicitly mentioned
 * 2. (300) gynecologist / reproductive endocrinology
 * 3. (200) female fertility with PCOS/hormonal relevance
 * 4. (100) genuinely shared specialist with explicit PCOS relevance
 * 0: Generic family medicine, internal medicine, general physician, or sexologist
 *    without explicit PCOS/female reproductive endocrine relevance -> 0 (disqualified)
 * 
 * Male Dashboard ("Male Hormone Care"):
 * 1. (400) pathway === male_hypogonadism AND hypogonadism/testosterone explicitly mentioned
 * 2. (300) andrologist / urologist with male hormone relevance
 * 3. (200) endocrinologist assigned to male_hypogonadism
 * 4. (100) shared clinician with explicit male hormonal relevance
 * 0: Generic shared doctors without male hormonal care relevance -> 0 (disqualified)
 */
export function getDoctorConditionScore(
  doctor: Doctor,
  pathway: 'female' | 'male' | string
): number {
  const norm = pathway.toLowerCase().trim() === 'male' ? 'male' : 'female';

  // Strict pathway isolation: Opposing pathway doctors get -1
  if (!isDoctorRelevantToPathway(doctor, norm)) {
    return -1;
  }

  const clinicalText = `${doctor.specialty || ''} ${doctor.services_offered || ''} ${doctor.relevance_reason || ''} ${doctor.short_bio || ''}`.toLowerCase();

  if (norm === 'female') {
    const isFemalePathway = doctor.pathway === 'female_pcos' || (doctor.pathway as string) === 'female';
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

    // Disqualified from dashboard preview (generic family medicine, internal medicine, etc.)
    return 0;
  }

  if (norm === 'male') {
    const isMalePathway = doctor.pathway === 'male_hypogonadism' || (doctor.pathway as string) === 'male';
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

/**
 * Condition-specific preview selector for authenticated Dashboard widgets
 * ("PCOS Care" and "Male Hormone Care").
 * 
 * Order of operations:
 * 1. Filter: strict pathway isolation + condition relevance score > 0 (excludes generic generalists)
 * 2. Rank: primary sort by condition relevance tier score (descending)
 * 3. Secondary sort: display_order (ascending), rating (descending), id
 * 4. Slice to requested limit (default 3)
 */
export function getDashboardRelevantDoctors(
  doctors: Doctor[],
  pathway: 'female' | 'male' | string,
  limit: number = 3
): Doctor[] {
  const norm = pathway.toLowerCase().trim() === 'male' ? 'male' : 'female';

  const qualified = doctors
    .map((doc) => ({
      doc,
      score: getDoctorConditionScore(doc, norm),
    }))
    .filter((item) => item.score > 0);

  qualified.sort((a, b) => {
    // 1. Primary: condition relevance tier score descending
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // 2. Secondary: display_order ascending
    const orderA = a.doc.display_order ?? 999;
    const orderB = b.doc.display_order ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // 3. Tertiary: rating descending
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

/**
 * Extracts 2-4 clean "Best for" clinical focus tags from real doctor metadata.
 * Uses services_offered, relevance_reason, or specialty without fabricating data.
 */
export function getDoctorClinicalInterests(doctor: Doctor): string[] {
  const interests: string[] = [];

  if (doctor.services_offered) {
    const rawServices = doctor.services_offered
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 35);
    for (const service of rawServices) {
      if (!interests.includes(service) && interests.length < 3) {
        interests.push(service);
      }
    }
  }

  if (doctor.relevance_reason && interests.length < 3) {
    const reasonClean = doctor.relevance_reason.trim();
    if (!interests.includes(reasonClean)) {
      interests.push(reasonClean);
    }
  }

  // Fallback to specialty keywords if still empty
  if (interests.length === 0 && doctor.specialty) {
    const parts = doctor.specialty
      .split(/[,&•/]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    interests.push(...parts.slice(0, 3));
  }

  return interests;
}

/**
 * Generates clean 2-letter uppercase initials from doctor name,
 * skipping honorary prefixes like Dr., Prof., etc.
 */
export function getDoctorInitials(name: string): string {
  const clean = name.replace(/^(Dr\.|Prof\.|Assoc\.\s*Prof\.|Assist\s*Prof\.)\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'DR';
}

/**
 * Helper to parse the minimum numeric PKR fee value from a string like "Rs. 2,500" or "Rs. 2,000 - 3,500"
 */
export function extractMinFee(feeStr: string | null | undefined): number {
  if (!feeStr) return 999999;
  const clean = feeStr.replace(/,/g, '');
  const match = clean.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999999;
}
