/**
 * apps/web/src/utils/allergySafetyRules.ts
 *
 * Authoritative Client-Side Safety & Allergen Eligibility Engine.
 * 1:1 Parity with `backend/apps/intelligence/services/lifestyle_safety_rules.py`.
 *
 * Guarantees that the frontend does NOT use naive keyword matching or invent
 * custom eligibility rules, adhering strictly to clinical boundaries.
 */

export const AUTHORITATIVE_ALLERGEN_INGREDIENT_MAP: Record<string, string[]> = {
  dairy: [
    'milk', 'yogurt', 'cheese', 'paneer', 'butter', 'ghee', 'cream', 'whey',
    'curd', 'dahi', 'malai', 'lassi', 'casein', 'caseinate', 'milk powder',
    'milkpowder', 'condensed milk', 'khoya', 'mawa', 'rabri', 'buttermilk',
  ],
  milk: [
    'milk', 'yogurt', 'cheese', 'paneer', 'butter', 'ghee', 'cream', 'whey',
    'curd', 'dahi', 'malai', 'lassi', 'casein', 'caseinate', 'milk powder',
    'milkpowder', 'condensed milk', 'khoya', 'mawa', 'rabri', 'buttermilk',
  ],
  lactose: [
    'milk', 'yogurt', 'cheese', 'paneer', 'butter', 'cream', 'whey', 'curd',
    'dahi', 'malai', 'lassi', 'milk powder', 'milkpowder', 'condensed milk',
    'khoya', 'mawa', 'rabri', 'buttermilk',
  ],
  gluten: [
    'wheat', 'barley', 'rye', 'roti', 'paratha', 'naan', 'bread', 'semolina',
    'sooji', 'suji', 'pasta', 'couscous', 'maida', 'atta', 'spelt', 'bulgur',
    'dalia', 'seitan', 'malt', 'wheat flour', 'flour',
  ],
  wheat: [
    'wheat', 'barley', 'rye', 'roti', 'paratha', 'naan', 'bread', 'semolina',
    'sooji', 'suji', 'pasta', 'couscous', 'maida', 'atta', 'spelt', 'bulgur',
    'dalia', 'seitan', 'malt', 'wheat flour', 'flour',
  ],
  nuts: [
    'peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut', 'groundnut oil',
    'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pistachio',
    'pistachios', 'hazelnut', 'hazelnuts', 'pecan', 'pecans', 'macadamia',
    'nut butter', 'badam', 'akhrot', 'kaju', 'pista', 'nut', 'nuts',
  ],
  peanuts: [
    'peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut',
    'groundnuts', 'groundnut oil', 'mungfali', 'moongfali',
  ],
  peanut: [
    'peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut',
    'groundnuts', 'groundnut oil', 'mungfali', 'moongfali',
  ],
  tree_nuts: [
    'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pistachio',
    'pistachios', 'hazelnut', 'hazelnuts', 'pecan', 'pecans', 'badam', 'akhrot',
    'kaju', 'pista', 'nut butter', 'nuts', 'tree nut', 'tree nuts',
  ],
  tree_nut: [
    'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pistachio',
    'pistachios', 'hazelnut', 'hazelnuts', 'pecan', 'pecans', 'badam', 'akhrot',
    'kaju', 'pista', 'nut butter', 'nuts', 'tree nut', 'tree nuts',
  ],
  eggs: [
    'egg', 'eggs', 'egg white', 'egg whites', 'egg yolk', 'egg yolks',
    'omelet', 'omelette', 'mayonnaise', 'anda', 'anday',
  ],
  egg: [
    'egg', 'eggs', 'egg white', 'egg whites', 'egg yolk', 'egg yolks',
    'omelet', 'omelette', 'mayonnaise', 'anda', 'anday',
  ],
  fish: [
    'fish', 'salmon', 'tuna', 'cod', 'mackerel', 'sardine', 'sardines',
    'tilapia', 'trout', 'machli', 'machhli', 'rohu', 'fish sauce', 'anchovy', 'anchovies',
  ],
  shellfish: [
    'prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'crabs', 'lobster',
    'lobsters', 'clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters',
    'jhinga', 'shrimp paste', 'crab paste', 'oyster sauce',
  ],
  soy: [
    'soy', 'tofu', 'edamame', 'soy sauce', 'soy milk', 'tempeh', 'soya', 'tamari', 'teriyaki', 'miso',
  ],
  sesame: ['sesame', 'til', 'tahini', 'sesame oil'],
  seeds: [
    'seed', 'seeds', 'sunflower seed', 'sunflower seeds', 'pumpkin seed',
    'pumpkin seeds', 'chia seed', 'chia seeds', 'flaxseed', 'flaxseeds', 'sesame', 'tahini',
  ],
  seed: [
    'seed', 'seeds', 'sunflower seed', 'sunflower seeds', 'pumpkin seed',
    'pumpkin seeds', 'chia seed', 'chia seeds', 'flaxseed', 'flaxseeds', 'sesame', 'tahini',
  ],
  red_meat: ['beef', 'mutton', 'lamb', 'veal', 'pork', 'steak', 'keema', 'meat'],
  poultry: ['chicken', 'turkey', 'duck'],
  seafood: [
    'fish', 'prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'crabs',
    'lobster', 'lobsters', 'machli', 'jhinga', 'seafood', 'clam', 'mussel',
    'oyster', 'salmon', 'tuna', 'fish sauce', 'oyster sauce',
  ],
  pork: ['pork', 'bacon', 'ham', 'lard'],
};

export interface AllergenMatchResult {
  isForbidden: boolean;
  matchedCategory?: string;
  matchedIngredient?: string;
  reason?: string;
}

/**
 * Deterministically checks whether any term in `text` violates `excludedCategories`.
 * Matches category names, synonyms, and sub-ingredient vocabularies.
 */
export function isFoodForbidden(
  text: string,
  excludedCategories: string[]
): AllergenMatchResult {
  if (!text || !excludedCategories || excludedCategories.length === 0) {
    return { isForbidden: false };
  }

  const cleanText = text.toLowerCase();

  for (const cat of excludedCategories) {
    const catNorm = cat.trim().toLowerCase().replace(/[\s-]/g, '_');
    if (!catNorm || catNorm === 'none') continue;

    // 1. Direct category match in text
    const baseCat = catNorm.replace(/_/g, ' ');
    const directRegex = new RegExp(`\\b${baseCat}(?:s|es)?\\b`, 'i');
    if (directRegex.test(cleanText)) {
      return {
        isForbidden: true,
        matchedCategory: catNorm,
        matchedIngredient: baseCat,
        reason: `Contains confirmed allergen category: ${baseCat}`,
      };
    }

    // 2. Ingredients mapped to category
    const mappedIngredients = AUTHORITATIVE_ALLERGEN_INGREDIENT_MAP[catNorm] || [];
    for (const ing of mappedIngredients) {
      // Exemption: Recognize gluten-free rotis and breads
      if (catNorm === 'gluten' || catNorm === 'wheat') {
        if (
          (ing === 'roti' || ing === 'bread' || ing === 'flour') &&
          (/\b(besan|missi|jowar|bajra|makki|gluten[-\s]free)\b/i.test(cleanText))
        ) {
          // If the text also contains explicit wheat terms like 'atta', 'maida', 'wheat', it is still forbidden
          if (!/\b(wheat|atta|maida|suji|sooji|semolina|barley|rye)\b/i.test(cleanText)) {
            continue;
          }
        }
      }

      const ingRegex = new RegExp(`\\b${ing}(?:s|es)?\\b`, 'i');
      if (ingRegex.test(cleanText)) {
        return {
          isForbidden: true,
          matchedCategory: catNorm,
          matchedIngredient: ing,
          reason: `Contains ingredient '${ing}' associated with allergen: ${baseCat}`,
        };
      }
    }
  }

  return { isForbidden: false };
}

/**
 * Evaluates whether a food item meets vegetarian or vegan criteria.
 */
export function isMeatOrAnimalProduct(text: string, strictVegan = false): boolean {
  const meatCategories = ['red_meat', 'poultry', 'seafood', 'pork'];
  if (strictVegan) {
    meatCategories.push('dairy', 'eggs');
  }
  return isFoodForbidden(text, meatCategories).isForbidden;
}

/**
 * Evaluates clinical diagnosis vs screening assumption.
 * OvaSense pathway must NEVER assume a confirmed PCOS diagnosis without
 * explicit confirmation in userProfile.medical.conditions.
 */
export function getOvaSenseDiagnosticFraming(userConditions: string[] = []): {
  isConfirmedPcos: boolean;
  framingType: 'confirmed_clinical_pcos' | 'educational_screening_pathway';
  heroHeadline: string;
  heroExplanation: string;
} {
  const normConditions = userConditions.map((c) => c.toLowerCase().trim());
  const isConfirmed = normConditions.some(
    (c) => c === 'pcos' || c === 'polycystic ovary syndrome' || c === 'polycystic_ovary_syndrome'
  );

  if (isConfirmed) {
    return {
      isConfirmedPcos: true,
      framingType: 'confirmed_clinical_pcos',
      heroHeadline: 'Small habits. Big changes.',
      heroExplanation:
        'Your daily choices can help manage PCOS, balance hormones and improve your overall well-being. Explore personalized recommendations for diet, exercise, sleep and more.',
    };
  }

  return {
    isConfirmedPcos: false,
    framingType: 'educational_screening_pathway',
    heroHeadline: 'Small habits. Big changes.',
    heroExplanation:
      'Your daily choices can help support metabolic health, balance energy and improve your overall well-being. Explore personalized recommendations for diet, exercise, sleep and more.',
  };
}

/**
 * Checks for conflicting health conditions that necessitate clinician review.
 * Examples: CKD + high protein, heart failure + excessive hydration, active eating disorder.
 */
export function checkConflictingConditions(
  conditions: string[] = [],
  _dietaryPreference?: string
): { hasConflict: boolean; message?: string } {
  const norm = conditions.map((c) => c.toLowerCase().trim());
  
  if (norm.some((c) => c.includes('kidney') || c.includes('ckd') || c.includes('renal'))) {
    return {
      hasConflict: true,
      message: 'Renal / kidney condition detected. Protein targets must be verified with your nephrologist.',
    };
  }

  if (norm.some((c) => c.includes('eating disorder') || c.includes('anorexia') || c.includes('bulimia'))) {
    return {
      hasConflict: true,
      message: 'History of disordered eating. Caloric tracking and strict restriction are contraindicated.',
    };
  }

  if (norm.some((c) => c.includes('heart failure') || c.includes('edema'))) {
    return {
      hasConflict: true,
      message: 'Cardiac or fluid-retention condition detected. Fluid targets require physician supervision.',
    };
  }

  return { hasConflict: false };
}
