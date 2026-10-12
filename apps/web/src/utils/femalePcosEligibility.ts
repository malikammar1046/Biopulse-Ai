/**
 * apps/web/src/utils/femalePcosEligibility.ts
 *
 * Authoritative Clinical Age Eligibility & Life-Stage Evaluation for Female PCOS.
 * Grounded in:
 * 1. 2023 International Evidence-Based PCOS Guideline (PMC10477934)
 * 2. 2025 International Adolescent-Specific PCOS Recommendations (PMC11899933)
 * 3. Actual BioPulse AI Training Population (Kottayam Dataset, N=541, Ages 20–48)
 */

export type FemaleLifeStage =
  | 'child_under_13'
  | 'pre_menarche'
  | 'adolescent_early' // < 1 year post-menarche
  | 'adolescent_mid' // 1 to < 3 years post-menarche
  | 'adolescent_late' // >= 3 years post-menarche, age < 20
  | 'adult_young' // age 18-19, >= 3 years post-menarche
  | 'adult_reproductive' // age 20-48, validated model distribution
  | 'perimenopausal' // age >= 45 with transitional cycles
  | 'postmenopausal'; // age >= 45 with >= 12mo amenorrhea or confirmed menopause

export type FemaleEligibilityStatus =
  | 'eligible_adult_ml' // In-distribution adult (ages 20-48)
  | 'eligible_young_adult' // Young adult (18-19, >= 3y post-menarche, developmental context)
  | 'adolescent_at_risk' // Adolescent with ovulatory dysfunction and/or hyperandrogenism
  | 'adolescent_developmental' // Adolescent with normal pubertal irregularity (< 1y post-menarche or 21-45d cycles)
  | 'pre_menarche_normal' // Pre-menarche, age < 15
  | 'pre_menarche_delayed' // Pre-menarche, age >= 15 (primary amenorrhea evaluation recommended)
  | 'postmenopausal_guidance' // Postmenopausal: lifelong metabolic health, rule out androgen tumors
  | 'perimenopausal_guidance' // Perimenopausal: ovarian aging transitions, model uncalibrated for menopause
  | 'ineligible_child' // Under 13 years old (unsupported for self-directed app use)
  | 'missing_dob'
  | 'future_dob'
  | 'invalid_dob';

export interface FemalePcosEligibilityResult {
  eligible: boolean;
  unavailableReason?: string;
  errorMessage?: string;
  isValidDob: boolean;
  dobError?: string;
  age: number | null;
  lifeStage: FemaleLifeStage;
  eligibilityStatus: FemaleEligibilityStatus;
  canRunAdultMlModel: boolean;
  ultrasoundMorphologyValid: boolean;
  amhValid: boolean;
  gynecologicalAgeYears: number | null; // Years since menarche
  isPreMenarche: boolean;
  isAdolescent: boolean;
  hasOvulatoryDysfunction: boolean;
  hasHyperandrogenism: boolean;
  title: string;
  badgeLabel: string;
  summary: string;
  clinicalRecommendations: string[];
  guidelineNotice: string;
}

export interface FemaleClinicalContext {
  dateOfBirth?: string | null;
  hasHadPeriod?: boolean | null;
  ageAtMenarche?: number | null;
  cycleLength?: number | 'irregular' | null;
  periodRegularity?: string | null;
  isMenopausal?: boolean | null;
  menopausalStatus?: 'premenopausal' | 'perimenopausal' | 'postmenopausal' | 'not_sure' | null;
  priorPcosDiagnosis?: boolean | null;
  commonSymptoms?: string[] | null;
  hirsutism?: boolean | number | null;
  acne?: boolean | number | null;
  hairLoss?: boolean | number | null;
}

export const FEMALE_ONBOARDING_MIN_AGE = 13;
export const PCOS_MODEL_MIN_AGE = 20;
export const PCOS_MODEL_MAX_AGE = 48;

/**
 * Calendar-safe exact age calculation.
 * Respects complete birthdays, month boundaries, and leap-year leap-day rules.
 */
export function calculateExactAge(
  dobString: string | null | undefined,
  refDate: Date = new Date()
): { age: number | null; isValid: boolean; error?: string; reason?: 'missing_dob' | 'future_dob' | 'invalid_dob' } {
  if (!dobString || !dobString.trim()) {
    return { age: null, isValid: false, error: 'Date of birth is required.', reason: 'missing_dob' };
  }

  const trimmed = dobString.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return { age: null, isValid: false, error: 'Please enter a valid calendar date of birth (YYYY-MM-DD).', reason: 'invalid_dob' };
  }

  const birthYear = parseInt(match[1], 10);
  const birthMonth = parseInt(match[2], 10);
  const birthDay = parseInt(match[3], 10);

  // Validate calendar validity (e.g. rejects 2023-02-29 or 2024-04-31)
  const testDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
  if (
    testDate.getUTCFullYear() !== birthYear ||
    testDate.getUTCMonth() !== birthMonth - 1 ||
    testDate.getUTCDate() !== birthDay
  ) {
    return { age: null, isValid: false, error: 'Please enter a valid calendar date of birth.', reason: 'invalid_dob' };
  }

  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth() + 1;
  const refDay = refDate.getDate();

  // Reject future birthdate
  if (
    birthYear > refYear ||
    (birthYear === refYear && birthMonth > refMonth) ||
    (birthYear === refYear && birthMonth === refMonth && birthDay > refDay)
  ) {
    return { age: null, isValid: false, error: 'Date of birth cannot be in the future.', reason: 'future_dob' };
  }

  // Exact complete years lived
  let age = refYear - birthYear;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age--;
  }

  if (age > 120) {
    return { age: null, isValid: false, error: 'Please enter a realistic date of birth.', reason: 'invalid_dob' };
  }

  return { age, isValid: true };
}

/**
 * Returns an error string if DOB is invalid, otherwise null.
 */
export function validateDob(
  dobString: string | null | undefined,
  refDate: Date = new Date()
): string | null {
  const { isValid, error } = calculateExactAge(dobString, refDate);
  return isValid ? null : (error || 'Invalid date of birth');
}

/**
 * Validates Age-at-Menarche against current age.
 */
export function validateMenarcheAge(
  ageAtMenarche: number | null | undefined,
  currentAge: number | null
): { isValid: boolean; error?: string; warning?: string } {
  if (ageAtMenarche === null || ageAtMenarche === undefined || isNaN(Number(ageAtMenarche))) {
    return { isValid: true }; // Menarche age is optional / can be unknown
  }

  const menarche = Number(ageAtMenarche);

  if (currentAge !== null && menarche > currentAge) {
    return {
      isValid: false,
      error: `Age at first period (${menarche}) cannot be greater than your current age (${currentAge}).`,
    };
  }

  if (menarche < 8) {
    return {
      isValid: true,
      warning: 'Menarche before age 8 represents precocious puberty and warrants specialized pediatric evaluation.',
    };
  }

  if (menarche > 18) {
    return {
      isValid: true,
      warning: 'First period after age 18 warrants clinical evaluation for delayed menarche.',
    };
  }

  return { isValid: true };
}

/**
 * Authoritative evaluation of Female Life Stage and PCOS Screening Eligibility.
 */
export function evaluateFemalePcosEligibility(
  context: FemaleClinicalContext,
  refDate: Date = new Date()
): FemalePcosEligibilityResult {
  const { age, isValid: isValidDob, error: dobError, reason: dobReason } = calculateExactAge(context.dateOfBirth, refDate);

  if (!isValidDob || age === null) {
    const reason = dobReason || 'invalid_dob';
    return {
      eligible: false,
      unavailableReason: reason,
      errorMessage: dobError || 'Valid date of birth required.',
      isValidDob: false,
      dobError: dobError || 'Valid date of birth required.',
      age: null,
      lifeStage: 'adult_reproductive',
      eligibilityStatus: reason as FemaleEligibilityStatus,
      canRunAdultMlModel: false,
      ultrasoundMorphologyValid: false,
      amhValid: false,
      gynecologicalAgeYears: null,
      isPreMenarche: false,
      isAdolescent: false,
      hasOvulatoryDysfunction: false,
      hasHyperandrogenism: false,
      title: 'Invalid Date of Birth',
      badgeLabel: 'Date Required',
      summary: dobError || 'Please provide a valid date of birth.',
      clinicalRecommendations: ['Enter your date of birth to evaluate your life stage and appropriate screening guidance.'],
      guidelineNotice: 'Date of birth is required to apply age-appropriate clinical consensus guidelines.',
    };
  }

  // Under minimum platform age (13)
  if (age < 13) {
    return {
      eligible: false,
      unavailableReason: 'ineligible_child',
      errorMessage: 'BioPulse AI is designed for individuals aged 13 and older. Children under 13 require specialized pediatric medical care.',
      isValidDob: true,
      age,
      lifeStage: 'child_under_13',
      eligibilityStatus: 'ineligible_child',
      canRunAdultMlModel: false,
      ultrasoundMorphologyValid: false,
      amhValid: false,
      gynecologicalAgeYears: null,
      isPreMenarche: true,
      isAdolescent: true,
      hasOvulatoryDysfunction: false,
      hasHyperandrogenism: false,
      title: 'Pediatric Life Stage (Under 13)',
      badgeLabel: 'Pediatric Care',
      summary: 'BioPulse AI is designed for individuals aged 13 and older. Children under 13 require specialized pediatric medical care.',
      clinicalRecommendations: [
        'Please consult a qualified pediatrician or pediatric endocrinologist for developmental assessments.',
        'Adult and adolescent digital health screening algorithms are not validated for pediatric use.',
      ],
      guidelineNotice: 'International consensus guidelines restrict adolescent digital screening to age 13 and above.',
    };
  }

  // Pre-menarche check
  const hasHadPeriod = context.hasHadPeriod !== false;
  if (!hasHadPeriod) {
    const isDelayed = age >= 15;
    const reason = isDelayed ? 'pre_menarche_delayed' : 'pre_menarche_normal';
    return {
      eligible: true,
      unavailableReason: reason,
      isValidDob: true,
      age,
      lifeStage: 'pre_menarche',
      eligibilityStatus: isDelayed ? 'pre_menarche_delayed' : 'pre_menarche_normal',
      canRunAdultMlModel: false,
      ultrasoundMorphologyValid: false,
      amhValid: false,
      gynecologicalAgeYears: null,
      isPreMenarche: true,
      isAdolescent: age < 20,
      hasOvulatoryDysfunction: isDelayed,
      hasHyperandrogenism: false,
      title: isDelayed ? 'Primary Amenorrhea Evaluation Warranted' : 'Pre-Menarche Health Profile',
      badgeLabel: isDelayed ? 'Clinical Check' : 'Pre-Menarche',
      summary: isDelayed
        ? 'Absence of menstrual bleeding by age 15 warrants clinical evaluation by an adolescent gynecologist or endocrinologist.'
        : 'You have not yet started menstrual periods. Menstrual cycle prediction and PCOS models will activate once your cycles begin.',
      clinicalRecommendations: isDelayed
        ? [
            'Schedule a clinical consultation to evaluate pubertal development, growth velocity, and anatomical/endocrine factors.',
            'Do not use statistical PCOS models prior to menarche.',
          ]
        : [
            'Menarche typically begins between ages 9 and 15.',
            'Track other health factors such as nutrition, activity, and overall wellbeing.',
          ],
      guidelineNotice:
        '2023 International PCOS Guidelines: Primary amenorrhea by age 15 or >3 years post-thelarche warrants clinical evaluation rather than automated PCOS prediction.',
    };
  }

  // Calculate Gynecological Age (years since menarche)
  let gynecologicalAgeYears: number | null = null;
  if (context.ageAtMenarche !== undefined && context.ageAtMenarche !== null && !isNaN(Number(context.ageAtMenarche))) {
    const menarcheAge = Number(context.ageAtMenarche);
    if (menarcheAge <= age && menarcheAge >= 8) {
      gynecologicalAgeYears = Math.max(0, age - menarcheAge);
    }
  }

  // Hyperandrogenism evaluation (clinical markers)
  const symptoms = (context.commonSymptoms || []).map((s) => String(s).toLowerCase());
  const hasHirsutism = Boolean(
    context.hirsutism ||
    symptoms.some((s) => s.includes('hair') || s.includes('hirsutism'))
  );
  const hasAcne = Boolean(
    context.acne ||
    symptoms.some((s) => s.includes('acne') || s.includes('pimple'))
  );
  const hasAlopecia = Boolean(
    context.hairLoss ||
    symptoms.some((s) => s.includes('loss') || s.includes('thinning') || s.includes('alopecia'))
  );
  const hasHyperandrogenism = hasHirsutism || hasAcne || hasAlopecia;

  // Ovulatory dysfunction evaluation based on gynecological age
  const periodReg = String(context.periodRegularity || '').toLowerCase();
  const isReportedIrregular =
    periodReg.includes('irreg') ||
    periodReg.includes('often_irregular') ||
    periodReg.includes('sometimes_irregular') ||
    context.cycleLength === 'irregular';
  const numericCycleLength = typeof context.cycleLength === 'number' ? context.cycleLength : null;

  let hasOvulatoryDysfunction = false;

  // Postmenopausal evaluation
  const isPostmenopausal = Boolean(
    context.isMenopausal ||
    context.menopausalStatus === 'postmenopausal' ||
    (age >= 50 && numericCycleLength === null && periodReg === 'often_irregular' && symptoms.includes('menopause'))
  );

  if (isPostmenopausal || (age >= 52 && context.menopausalStatus === 'postmenopausal')) {
    return {
      eligible: true,
      unavailableReason: 'postmenopausal_guidance',
      isValidDob: true,
      age,
      lifeStage: 'postmenopausal',
      eligibilityStatus: 'postmenopausal_guidance',
      canRunAdultMlModel: false, // Reproductive ML model trained on cycling women 20-48
      ultrasoundMorphologyValid: false,
      amhValid: false,
      gynecologicalAgeYears,
      isPreMenarche: false,
      isAdolescent: false,
      hasOvulatoryDysfunction: false,
      hasHyperandrogenism,
      title: 'Postmenopausal Health & Metabolic Guidance',
      badgeLabel: 'Postmenopausal',
      summary:
        'You are in the postmenopausal life stage. While reproductive PCOS screening models are not calibrated for postmenopause, prior PCOS confers lifelong metabolic and cardiovascular health significance.',
      clinicalRecommendations: [
        'Prior PCOS is associated with increased lifetime risk of insulin resistance, type 2 diabetes, dyslipidemia, and cardiovascular disease.',
        'Maintain routine metabolic screenings: fasting lipid panel, HbA1c, blood pressure, and liver health.',
        hasHyperandrogenism
          ? 'New-onset or progressive hyperandrogenism after menopause warrants clinical investigation to rule out androgen-secreting ovarian or adrenal neoplasms.'
          : 'Focus on bone density (DEXA scan) and cardiovascular lifestyle optimizations.',
      ],
      guidelineNotice:
        '2023 International Guidelines: Reproductive diagnostic criteria are not applicable postmenopause. Clinical management shifts to cardiometabolic risk monitoring.',
    };
  }

  // Perimenopausal evaluation (age >= 45 with transition markers)
  if (age >= 45 && (age > 48 || context.menopausalStatus === 'perimenopausal')) {
    return {
      eligible: true,
      unavailableReason: 'perimenopausal_guidance',
      isValidDob: true,
      age,
      lifeStage: 'perimenopausal',
      eligibilityStatus: 'perimenopausal_guidance',
      canRunAdultMlModel: false, // Beyond 48, outside validated training dataset
      ultrasoundMorphologyValid: true,
      amhValid: false,
      gynecologicalAgeYears,
      isPreMenarche: false,
      isAdolescent: false,
      hasOvulatoryDysfunction: isReportedIrregular,
      hasHyperandrogenism,
      title: 'Perimenopausal Transition Guidance',
      badgeLabel: 'Perimenopausal',
      summary:
        'Menstrual irregularity during perimenopause (age 45+) commonly reflects physiological follicular depletion and hormonal fluctuations rather than reproductive-onset PCOS.',
      clinicalRecommendations: [
        'Differentiate pre-existing PCOS from natural perimenopausal ovarian changes with a gynecologist or endocrinologist.',
        'BioPulse AI statistical models were trained on reproductive-age women (20–48); risk scores are replaced with targeted cardiometabolic tracking.',
        'Monitor blood pressure, glycemic control, and bone health.',
      ],
      guidelineNotice:
        '2023 International Guidelines: In perimenopause, natural follicular depletion mimics ovulatory dysfunction. Models calibrated on younger populations must not be applied uncritically.',
    };
  }

  // Young Adults (Age 18-19, mature gynecological age >= 3y)
  if (age >= 18 && age < 20 && (gynecologicalAgeYears === null || gynecologicalAgeYears >= 3)) {
    return {
      eligible: true,
      unavailableReason: undefined,
      isValidDob: true,
      age,
      lifeStage: 'adult_young',
      eligibilityStatus: 'eligible_young_adult',
      canRunAdultMlModel: false, // Training cohort Kottayam is strictly 20-48
      ultrasoundMorphologyValid: true,
      amhValid: true,
      gynecologicalAgeYears,
      isPreMenarche: false,
      isAdolescent: false,
      hasOvulatoryDysfunction: isReportedIrregular,
      hasHyperandrogenism,
      title: 'Young Adult PCOS Screening',
      badgeLabel: 'Young Adult',
      summary:
        'As a young adult with mature gynecological age (>= 3 years post-menarche), adult ovulatory thresholds apply, with developmental context provided alongside AI models.',
      clinicalRecommendations: [
        'Adult ovulatory dysfunction threshold: cycles < 21 days or > 35 days, or < 8 cycles per year.',
        'AI model predictions represent statistical estimates calibrated for adult populations (ages 20–48).',
      ],
      guidelineNotice:
        '2023 International Guidelines: Women >= 3 years post-menarche transition to adult ovulatory criteria while respecting individual neuroendocrine maturation. Statistical ML models trained on ages 20–48 years provide informational estimates.',
    };
  }

  // Adolescent Evaluation (< 18 years old, or 18-19 with < 3 years post-menarche)
  const isAdolescent = age < 20;

  if (isAdolescent) {
    // Determine ovulatory dysfunction using gynecological age
    if (gynecologicalAgeYears !== null) {
      if (gynecologicalAgeYears < 1) {
        // First year post-menarche: irregularity is physiological
        hasOvulatoryDysfunction = false;
      } else if (gynecologicalAgeYears < 3) {
        // 1 to < 3 years post-menarche: < 21d or > 45d is abnormal
        if (numericCycleLength !== null) {
          hasOvulatoryDysfunction = numericCycleLength < 21 || numericCycleLength > 45;
        } else {
          hasOvulatoryDysfunction = isReportedIrregular;
        }
      } else {
        // >= 3 years post-menarche: adult cycle definitions (< 21d, > 35d, or irregular)
        if (numericCycleLength !== null) {
          hasOvulatoryDysfunction = numericCycleLength < 21 || numericCycleLength > 35;
        } else {
          hasOvulatoryDysfunction = isReportedIrregular;
        }
      }
    } else {
      // Gynecological age not specified: use conservative adolescent threshold
      hasOvulatoryDysfunction = isReportedIrregular;
    }

    const lifeStage: FemaleLifeStage =
      gynecologicalAgeYears !== null && gynecologicalAgeYears < 1
        ? 'adolescent_early'
        : gynecologicalAgeYears !== null && gynecologicalAgeYears < 3
        ? 'adolescent_mid'
        : 'adolescent_late';

    // 2023/2025 Consensus: Adolescent PCOS requires BOTH ovulatory dysfunction AND hyperandrogenism
    // Ultrasound morphology and AMH must NOT be used for diagnosis.
    const isAtRisk = hasOvulatoryDysfunction || hasHyperandrogenism;

    if (isAtRisk) {
      const bothCriteriaMet = hasOvulatoryDysfunction && hasHyperandrogenism;
      return {
        eligible: true,
        unavailableReason: 'adolescent_at_risk',
        isValidDob: true,
        age,
        lifeStage,
        eligibilityStatus: 'adolescent_at_risk',
        canRunAdultMlModel: false, // Adult ML model trained on 20-48
        ultrasoundMorphologyValid: false, // Contraindicated for adolescent diagnosis
        amhValid: false, // Not recommended for adolescent diagnosis
        gynecologicalAgeYears,
        isPreMenarche: false,
        isAdolescent: true,
        hasOvulatoryDysfunction,
        hasHyperandrogenism,
        title: bothCriteriaMet ? 'Adolescent PCOS Evaluation Warranted' : 'Adolescent: At Risk for PCOS',
        badgeLabel: 'Adolescent Clinical Evaluation',
        summary: bothCriteriaMet
          ? 'You exhibit signs of both ovulatory irregularity and androgen excess. According to international adolescent guidelines, comprehensive medical evaluation by an adolescent specialist is recommended.'
          : 'You show partial features (menstrual pattern or androgenic symptoms) during pubertal maturation. International guidelines classify this as "At Risk" with recommended clinical monitoring rather than an automated diagnosis.',
        clinicalRecommendations: [
          'International consensus (2023 & 2025) requires BOTH ovulatory dysfunction and hyperandrogenism for adolescent diagnosis, after excluding other conditions.',
          'Pelvic ultrasound and serum AMH should NOT be used for PCOS diagnosis in adolescents due to normal multi-follicular ovarian development.',
          'Schedule an in-person evaluation with an adolescent gynecologist or pediatric endocrinologist.',
          'Plan for reassessment at reproductive maturity (typically 3 to 8 years post-menarche or at age 20).',
        ],
        guidelineNotice:
          '2023 International PCOS Guideline & 2025 Adolescent Consensus: Adult Rotterdam criteria cannot be applied to adolescents. Ultrasound morphology and AMH must not be used as diagnostic criteria.',
      };
    } else {
      return {
        eligible: true,
        unavailableReason: 'adolescent_developmental',
        isValidDob: true,
        age,
        lifeStage,
        eligibilityStatus: 'adolescent_developmental',
        canRunAdultMlModel: false,
        ultrasoundMorphologyValid: false,
        amhValid: false,
        gynecologicalAgeYears,
        isPreMenarche: false,
        isAdolescent: true,
        hasOvulatoryDysfunction: false,
        hasHyperandrogenism: false,
        title: 'Adolescent Pubertal Transition — Normal Variation',
        badgeLabel: 'Adolescent Pathway',
        summary:
          'Your reported cycle patterns and symptoms align with normal adolescent reproductive development. Menstrual variation is common during the first few years after your first period.',
        clinicalRecommendations: [
          'Continue tracking your cycles to establish your individual rhythm.',
          'If cycles consistently exceed 45 days (after year 1 post-menarche) or exceed 90 days at any point, consult a healthcare provider.',
          'Pelvic ultrasound is not recommended for routine PCOS screening in adolescents.',
        ],
        guidelineNotice:
          '2023 International Guidelines: Menstrual irregularity is a normal physiological phenomenon during pubertal maturation and does not indicate PCOS in the absence of hyperandrogenism.',
      };
    }
  }

  // Adult Females (Age 20-48: Primary validated training cohort)
  if (age >= 20 && age <= 48) {
    return {
      eligible: true,
      unavailableReason: undefined,
      isValidDob: true,
      age,
      lifeStage: 'adult_reproductive',
      eligibilityStatus: 'eligible_adult_ml',
      canRunAdultMlModel: true,
      ultrasoundMorphologyValid: true,
      amhValid: true,
      gynecologicalAgeYears,
      isPreMenarche: false,
      isAdolescent: false,
      hasOvulatoryDysfunction: isReportedIrregular,
      hasHyperandrogenism,
      title: 'Eligible for Adult PCOS Risk Screening',
      badgeLabel: 'Model Validated',
      summary:
        'Your profile falls directly within the validated demographic and reproductive age distribution (20–48 years) of the BioPulse AI clinical screening models.',
      clinicalRecommendations: [
        'Full 3-tier progressive assessment is available: Tier 1 (lifestyle & symptoms), Tier 2 (clinical laboratory tests), and Tier 3 (transvaginal ultrasound morphology).',
        'Adult Rotterdam criteria: requires at least 2 of 3 features (ovulatory dysfunction, hyperandrogenism, polycystic ovarian morphology) with other etiologies excluded.',
      ],
      guidelineNotice:
        '2023 International Evidence-Based PCOS Guidelines: Adult Rotterdam criteria are validated for reproductive-aged women (ages 20–48).',
    };
  }

  // Young Adults (Age 18-19, >= 3y post-menarche)
  if (age >= 18 && age < 20) {
    const isMature = gynecologicalAgeYears === null || gynecologicalAgeYears >= 3;
    return {
      eligible: true,
      unavailableReason: isMature ? undefined : 'adolescent_at_risk',
      isValidDob: true,
      age,
      lifeStage: 'adult_young',
      eligibilityStatus: isMature ? 'eligible_young_adult' : 'adolescent_at_risk',
      canRunAdultMlModel: false, // Training cohort Kottayam is strictly 20-48
      ultrasoundMorphologyValid: isMature,
      amhValid: isMature,
      gynecologicalAgeYears,
      isPreMenarche: false,
      isAdolescent: false,
      hasOvulatoryDysfunction: isReportedIrregular,
      hasHyperandrogenism,
      title: isMature ? 'Young Adult PCOS Screening' : 'Young Adult: Maturation Pathway',
      badgeLabel: isMature ? 'Young Adult' : 'Adolescent Pathway',
      summary: isMature
        ? 'As a young adult with mature gynecological age (>= 3 years post-menarche), adult ovulatory thresholds apply, with developmental context provided alongside AI models.'
        : 'Your gynecological age indicates recent pubertal transition. Clinical consensus recommends adolescent evaluation standards rather than strict adult criteria.',
      clinicalRecommendations: [
        'Adult ovulatory dysfunction threshold: cycles < 21 days or > 35 days, or < 8 cycles per year.',
        'AI model predictions represent statistical estimates calibrated for adult populations (ages 20–48).',
      ],
      guidelineNotice:
        '2023 International Guidelines: Women >= 3 years post-menarche transition to adult ovulatory criteria while respecting individual neuroendocrine maturation.',
    };
  }

  // Fallback: Age > 48 but premenopausal
  return {
    eligible: true,
    isValidDob: true,
    age,
    lifeStage: 'perimenopausal',
    eligibilityStatus: 'perimenopausal_guidance',
    canRunAdultMlModel: false,
    ultrasoundMorphologyValid: true,
    amhValid: false,
    gynecologicalAgeYears,
    isPreMenarche: false,
    isAdolescent: false,
    hasOvulatoryDysfunction: isReportedIrregular,
    hasHyperandrogenism,
    title: 'Late Reproductive & Perimenopausal Guidance',
    badgeLabel: 'Perimenopausal',
    summary:
      'At age 48+, menstrual patterns frequently change due to natural perimenopausal transitions. Digital AI models trained on younger reproductive cohorts are uncalibrated for this life stage.',
    clinicalRecommendations: [
      'Consult a gynecologist or endocrinologist to differentiate pre-existing PCOS from natural perimenopause.',
      'Prioritize metabolic, cardiovascular, and bone health monitoring.',
    ],
    guidelineNotice:
      '2023 International Guidelines: Adult PCOS models trained on women under 48 should not be extrapolated to perimenopausal and postmenopausal transitions.',
  };
}

/**
 * Evaluates whether a cycle length is irregular based on gynecological age
 * under the 2023/2025 international guidelines.
 */
export function isCycleLengthIrregular(
  cycleDays: number | 'irregular',
  gynecologicalAgeYears: number | null
): boolean {
  if (cycleDays === 'irregular') return true;
  if (typeof cycleDays !== 'number' || isNaN(cycleDays)) return false;

  // In adolescents 1 to < 3 years post-menarche, normal cycle length is 21 to 45 days.
  if (gynecologicalAgeYears !== null && gynecologicalAgeYears >= 1 && gynecologicalAgeYears < 3) {
    return cycleDays < 21 || cycleDays > 45;
  }

  // In mature individuals (>= 3 years post-menarche or adult), normal is 21 to 35 days.
  return cycleDays < 21 || cycleDays > 35;
}

/**
 * Returns localized badge and title strings for a given life stage.
 */
export function formatLifeStageDisplay(
  lifeStage: FemaleLifeStage,
  _lang: 'en' | 'ur' = 'en'
): { badgeEnglish: string; badgeUrdu: string; titleEnglish: string; titleUrdu: string } {
  const displayMap: Record<
    FemaleLifeStage,
    { badgeEn: string; badgeUr: string; titleEn: string; titleUr: string }
  > = {
    child_under_13: {
      badgeEn: 'Pediatric Care',
      badgeUr: 'بچوں کی خصوصی نگہداشت',
      titleEn: 'Pediatric Stage (Under 13)',
      titleUr: 'بچپن کا مرحلہ (13 سال سے کم)',
    },
    pre_menarche: {
      badgeEn: 'Pre-Menarche',
      badgeUr: 'ماہواری سے قبل',
      titleEn: 'Pre-Menarche Profile',
      titleUr: 'حیض شروع ہونے سے پہلے کا پروفائل',
    },
    adolescent_early: {
      badgeEn: 'Pubertal Transition',
      badgeUr: 'بلوغت کی تبدیلی',
      titleEn: 'First Year Post-Menarche',
      titleUr: 'ماہواری کا پہلا سال (ترقی پذیر مرحلہ)',
    },
    adolescent_mid: {
      badgeEn: 'Adolescent Guidance',
      badgeUr: 'نوعمری کی رہنمائی',
      titleEn: 'Adolescent Gynecological Stage',
      titleUr: 'نوعمری کا نسوانی مرحلہ',
    },
    adolescent_late: {
      badgeEn: 'Adolescent Review',
      badgeUr: 'نوعمری کا معائنہ',
      titleEn: 'Late Adolescent Stage',
      titleUr: 'نوعمری کا آخری مرحلہ',
    },
    adult_young: {
      badgeEn: 'Young Adult',
      badgeUr: 'نوجوان بالغ',
      titleEn: 'Young Adult Screening',
      titleUr: 'نوجوان بالغوں کی اسکریننگ',
    },
    adult_reproductive: {
      badgeEn: 'Model Validated',
      badgeUr: 'ماڈل سے تصدیق شدہ',
      titleEn: 'Adult Reproductive Screening',
      titleUr: 'بالغ خواتین کی اسکریننگ',
    },
    perimenopausal: {
      badgeEn: 'Perimenopausal',
      badgeUr: 'سن یاس کی منتقلی',
      titleEn: 'Perimenopausal Health Guidance',
      titleUr: 'سن یاس کی منتقلی کی رہنمائی',
    },
    postmenopausal: {
      badgeEn: 'Postmenopausal Care',
      badgeUr: 'سن یاس کے بعد نگہداشت',
      titleEn: 'Postmenopausal Metabolic Health',
      titleUr: 'سن یاس کے بعد میٹابولک صحت',
    },
  };

  const item = displayMap[lifeStage] || displayMap.adult_reproductive;
  return {
    badgeEnglish: item.badgeEn,
    badgeUrdu: item.badgeUr,
    titleEnglish: item.titleEn,
    titleUrdu: item.titleUr,
  };
}
