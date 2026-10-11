/**
 * apps/web/src/utils/lifestyleImages.ts
 *
 * Centralized, semantic visual mapping library for BioPulse AI
 * Lifestyle, Nutrition, Movement, and Circadian Recovery.
 * Maps canonical food identifiers, Pakistani culinary items, meal types,
 * and workout/recovery concepts to high-fidelity local and CDN assets.
 */

export interface LifestyleVisual {
  url: string;
  alt: string;
  fallbackGradient: string;
}

export const LIFESTYLE_ASSETS = {
  hero: {
    meditation: {
      url: '/images/hero/ovasense-meditation.jpg',
      alt: 'Serene woman in mindful meditation posture with lush botanical greenery',
      fallbackGradient: 'from-pink-100 via-rose-50 to-pink-200',
    },
    mealBowl: {
      url: '/images/hero/meal-bowl.jpg',
      alt: 'Fresh nourishing nutrient-dense Mediterranean and Pakistani salad bowl',
      fallbackGradient: 'from-pink-100 to-emerald-100',
    },
  },
  recommendedFoods: {
    leafy_greens: {
      url: '/images/lifestyle/leafy-greens.jpg',
      alt: 'Fresh vibrant dark leafy greens (spinach, kale, palak)',
      fallbackGradient: 'from-emerald-100 to-green-200',
    },
    lean_protein: {
      url: '/images/lifestyle/lean-protein.jpg',
      alt: 'High biological value lean protein (chicken breast, pasture-raised egg)',
      fallbackGradient: 'from-amber-100 to-orange-200',
    },
    whole_grains: {
      url: '/images/lifestyle/whole-grains.jpg',
      alt: 'Fiber-rich whole grains (unrefined oats, whole wheat, brown basmati)',
      fallbackGradient: 'from-amber-100 to-yellow-200',
    },
    healthy_fats: {
      url: '/images/lifestyle/healthy-fats.jpg',
      alt: 'Monounsaturated healthy fats (avocado, raw walnuts, almonds)',
      fallbackGradient: 'from-emerald-100 to-teal-200',
    },
    berries: {
      url: '/images/lifestyle/berries.jpg',
      alt: 'Polyphenol-rich low-glycemic berries and antioxidant fruits',
      fallbackGradient: 'from-pink-100 to-purple-200',
    },
  },
  foodsToLimit: {
    sugary_foods: {
      url: '/images/lifestyle/limit-sugary.jpg',
      alt: 'High glycemic confectionery and refined sugary pastries',
      fallbackGradient: 'from-pink-100 to-rose-200',
    },
    processed_foods: {
      url: '/images/lifestyle/limit-processed.jpg',
      alt: 'Ultra-processed snacks with industrial additives and trans fats',
      fallbackGradient: 'from-amber-100 to-red-200',
    },
    refined_carbs: {
      url: '/images/lifestyle/limit-refined.jpg',
      alt: 'Refined white flour, maida bakery products, and stripped grains',
      fallbackGradient: 'from-amber-100 to-orange-100',
    },
    fried_foods: {
      url: '/images/lifestyle/limit-fried.jpg',
      alt: 'Deep-fried snacks prepared in reheated oxidized seed oils',
      fallbackGradient: 'from-orange-100 to-amber-200',
    },
    sugary_drinks: {
      url: '/images/lifestyle/limit-drinks.jpg',
      alt: 'Sugar-sweetened carbonated beverages and high-fructose syrups',
      fallbackGradient: 'from-rose-100 to-pink-200',
    },
  },
  meals: {
    oats_berries: {
      url: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80',
      alt: 'Rolled oats with chia seeds, blueberries and crushed nuts',
      fallbackGradient: 'from-amber-100 to-rose-100',
    },
    desi_omelette: {
      url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
      alt: 'Desi vegetable omelette with freshly prepared whole wheat roti',
      fallbackGradient: 'from-amber-100 to-emerald-100',
    },
    chickpea_chana: {
      url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      alt: 'Nutrient-rich cooked chickpeas and spiced channa curry',
      fallbackGradient: 'from-amber-100 to-yellow-200',
    },
    lobia_curry: {
      url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      alt: 'Traditional cooked lobia black-eyed peas in aromatic curry',
      fallbackGradient: 'from-amber-100 to-red-100',
    },
    boiled_rice: {
      url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80',
      alt: 'Steamed fluffy whole grain and basmati boiled rice',
      fallbackGradient: 'from-amber-50 to-stone-100',
    },
    fresh_fruit_bowl: {
      url: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80',
      alt: 'Fresh seasonal fruits bowl with low glycemic index',
      fallbackGradient: 'from-rose-100 to-amber-100',
    },
    yogurt_dahi: {
      url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
      alt: 'Probiotic plain Greek yogurt or traditional dahi bowl',
      fallbackGradient: 'from-blue-50 to-indigo-50',
    },
    grilled_chicken_salad: {
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      alt: 'Grilled chicken, quinoa, mixed salad and cold-pressed olive oil dressing',
      fallbackGradient: 'from-emerald-100 to-teal-100',
    },
    daal_tadka: {
      url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      alt: 'Yellow moong daal tadka with basmati rice and crisp kachumber',
      fallbackGradient: 'from-amber-100 to-yellow-200',
    },
    veggie_soup: {
      url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      alt: 'Nutrient-dense vegetable soup served with whole grain bread',
      fallbackGradient: 'from-orange-100 to-amber-100',
    },
    chicken_tikka: {
      url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
      alt: 'Grilled spiced chicken tikka boti with bhindi and chapati',
      fallbackGradient: 'from-red-100 to-amber-200',
    },
    baked_fish: {
      url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      alt: 'Baked herb-crusted wild fish fillet with roasted seasonal vegetables',
      fallbackGradient: 'from-teal-100 to-emerald-200',
    },
    roasted_chana_nuts: {
      url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80',
      alt: 'Dry-roasted chickpeas, raw walnuts, and wholesome healthy seed snack mix',
      fallbackGradient: 'from-amber-100 to-orange-100',
    },
    snack_nuts: {
      url: '/images/lifestyle/healthy-fats.jpg',
      alt: 'Raw walnuts, almonds, and wholesome nuts supporting metabolic hormone balance',
      fallbackGradient: 'from-amber-100 to-orange-100',
    },
    roti_whole_wheat: {
      url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      alt: 'Freshly puffed whole wheat tawa roti',
      fallbackGradient: 'from-amber-100 to-yellow-100',
    },
    green_smoothie: {
      url: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80',
      alt: 'Fresh green spinach, mint and electrolyte smoothie',
      fallbackGradient: 'from-teal-100 to-cyan-100',
    },
  },
  fitness: {
    walking: {
      url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
      alt: 'Brisk low-impact aerobic walking in fresh morning sunlight',
      fallbackGradient: 'from-teal-100 to-emerald-200',
    },
    strength: {
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
      alt: 'Functional resistance and strength training for glucose disposal',
      fallbackGradient: 'from-sky-100 to-blue-200',
    },
    yoga: {
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
      alt: 'Mindful restorative yoga and pelvic mobility flow',
      fallbackGradient: 'from-purple-100 to-pink-100',
    },
    stretching: {
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
      alt: 'Gentle post-movement stretching and parasympathetic breathing',
      fallbackGradient: 'from-rose-100 to-pink-100',
    },
  },
  recovery: {
    sleep: {
      url: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=600&q=80',
      alt: 'Darkened, peaceful bedroom sanctuary optimized for REM and deep sleep',
      fallbackGradient: 'from-indigo-100 to-slate-200',
    },
    stress: {
      url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
      alt: 'Tranquil parasympathetic relaxation and mindful box breathing',
      fallbackGradient: 'from-teal-100 to-emerald-100',
    },
    hydration: {
      url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
      alt: 'Pure structured hydration with electrolyte lemon slices',
      fallbackGradient: 'from-sky-100 to-cyan-100',
    },
  },
} as const;

export const LIFESTYLE_IMAGES = LIFESTYLE_ASSETS;

/**
 * Returns canonical image for recommended food categories.
 */
export function getRecommendedFoodVisual(categoryOrName: string): LifestyleVisual {
  const norm = categoryOrName.toLowerCase().trim();
  if (norm.includes('leaf') || norm.includes('green') || norm.includes('spinach') || norm.includes('palak') || norm.includes('sabzi')) {
    return LIFESTYLE_ASSETS.recommendedFoods.leafy_greens;
  }
  if (norm.includes('protein') || norm.includes('chicken') || norm.includes('egg') || norm.includes('meat') || norm.includes('fish')) {
    return LIFESTYLE_ASSETS.recommendedFoods.lean_protein;
  }
  if (norm.includes('grain') || norm.includes('oat') || norm.includes('roti') || norm.includes('rice') || norm.includes('quinoa') || norm.includes('dalia')) {
    return LIFESTYLE_ASSETS.recommendedFoods.whole_grains;
  }
  if (norm.includes('fat') || norm.includes('avocado') || norm.includes('nut') || norm.includes('oil') || norm.includes('almond') || norm.includes('seed')) {
    return LIFESTYLE_ASSETS.recommendedFoods.healthy_fats;
  }
  if (norm.includes('berr') || norm.includes('fruit') || norm.includes('guava') || norm.includes('amrood') || norm.includes('apple') || norm.includes('antioxidant')) {
    return LIFESTYLE_ASSETS.recommendedFoods.berries;
  }
  return LIFESTYLE_ASSETS.recommendedFoods.leafy_greens;
}

/**
 * Returns canonical image for food limit items.
 */
export function getLimitFoodVisual(categoryOrName: string): LifestyleVisual {
  const norm = categoryOrName.toLowerCase().trim();
  if (norm.includes('sugary food') || norm.includes('sweet') || norm.includes('sugar') || norm.includes('mithai') || norm.includes('cake') || norm.includes('dessert')) {
    return LIFESTYLE_ASSETS.foodsToLimit.sugary_foods;
  }
  if (norm.includes('processed') || norm.includes('junk') || norm.includes('packaged') || norm.includes('fries') || norm.includes('chip')) {
    return LIFESTYLE_ASSETS.foodsToLimit.processed_foods;
  }
  if (norm.includes('refined') || norm.includes('carb') || norm.includes('maida') || norm.includes('bread') || norm.includes('white flour') || norm.includes('naan')) {
    return LIFESTYLE_ASSETS.foodsToLimit.refined_carbs;
  }
  if (norm.includes('fried') || norm.includes('samosa') || norm.includes('pakora') || norm.includes('oil') || norm.includes('crispy')) {
    return LIFESTYLE_ASSETS.foodsToLimit.fried_foods;
  }
  if (norm.includes('drink') || norm.includes('soda') || norm.includes('cola') || norm.includes('syrup') || norm.includes('beverage')) {
    return LIFESTYLE_ASSETS.foodsToLimit.sugary_drinks;
  }
  return LIFESTYLE_ASSETS.foodsToLimit.sugary_foods;
}

/**
 * Helper to safely resolve a meal image based on meal role and dish name.
 * Uses verified semantic keywords to ensure photos faithfully match the actual food.
 */
export function getMealImage(
  mealType: string,
  mealName?: string,
  isVegetarian?: boolean
): LifestyleVisual {
  const normalizedType = (mealType || '').toLowerCase().trim();
  const normalizedName = (mealName || '').toLowerCase().trim();
  const combined = `${normalizedType} ${normalizedName}`;

  // 1. Dry Roasted Chana & Wholesome Nut Snacks (distinct from wet chickpea curries)
  if (
    (combined.includes('roasted') &&
      (combined.includes('chana') || combined.includes('chickpea') || combined.includes('nut'))) ||
    combined.includes('bhuna chana') ||
    (normalizedType.includes('snack') &&
      (combined.includes('chana') ||
        combined.includes('walnut') ||
        combined.includes('almond') ||
        combined.includes('nut') ||
        combined.includes('seed')))
  ) {
    return LIFESTYLE_ASSETS.meals.roasted_chana_nuts;
  }

  // 2. Cooked Chickpeas Curry (Channa / Cholay)
  if (
    combined.includes('cholay') ||
    combined.includes('chana curry') ||
    combined.includes('chickpea curry') ||
    combined.includes('chana masala') ||
    (!normalizedType.includes('snack') && (combined.includes('chickpea') || combined.includes('chana')))
  ) {
    return LIFESTYLE_ASSETS.meals.chickpea_chana;
  }

  // 3. Lobia & Black-eyed peas
  if (
    combined.includes('lobia') ||
    combined.includes('black-eyed') ||
    combined.includes('black eyed')
  ) {
    return LIFESTYLE_ASSETS.meals.lobia_curry;
  }

  // 4. Daal & Legumes
  if (
    combined.includes('daal') ||
    combined.includes('lentil') ||
    combined.includes('moong') ||
    combined.includes('masoor')
  ) {
    return LIFESTYLE_ASSETS.meals.daal_tadka;
  }

  // 5. Breads & Flatbreads
  if (
    combined.includes('roti') ||
    combined.includes('chapati') ||
    combined.includes('paratha') ||
    combined.includes('missi') ||
    combined.includes('besan roti')
  ) {
    return LIFESTYLE_ASSETS.meals.roti_whole_wheat;
  }

  // 6. Boiled Rice & Chawal
  if (
    combined.includes('boiled rice') ||
    combined.includes('plain rice') ||
    combined.includes('basmati rice') ||
    combined.includes('chawal') ||
    combined.includes('rice')
  ) {
    return LIFESTYLE_ASSETS.meals.boiled_rice;
  }

  // 7. Fresh Fruit Bowls
  if (
    combined.includes('fruit') ||
    combined.includes('apple') ||
    combined.includes('banana') ||
    combined.includes('guava') ||
    combined.includes('amrood') ||
    combined.includes('dates') ||
    combined.includes('khajoor') ||
    combined.includes('anar') ||
    combined.includes('pomegranate') ||
    combined.includes('watermelon') ||
    combined.includes('malta') ||
    combined.includes('orange')
  ) {
    return LIFESTYLE_ASSETS.meals.fresh_fruit_bowl;
  }

  // 8. Yogurt & Dahi
  if (
    combined.includes('yogurt') ||
    combined.includes('dahi') ||
    combined.includes('curd')
  ) {
    return LIFESTYLE_ASSETS.meals.yogurt_dahi;
  }

  // 9. Breakfast Oats & Porridge
  if (
    combined.includes('oat') ||
    combined.includes('chia') ||
    combined.includes('porridge') ||
    combined.includes('muesli')
  ) {
    return LIFESTYLE_ASSETS.meals.oats_berries;
  }

  // 10. Eggs & Omelettes (only if not strictly vegan/egg-free)
  if (
    combined.includes('omelet') ||
    combined.includes('omelette') ||
    combined.includes('egg') ||
    combined.includes('anda')
  ) {
    return LIFESTYLE_ASSETS.meals.desi_omelette;
  }

  // 11. Baked & Grilled Fish / Seafood (strictly excluded if vegetarian)
  if (
    !isVegetarian &&
    (combined.includes('fish') ||
      combined.includes('salmon') ||
      combined.includes('trout') ||
      combined.includes('machli') ||
      combined.includes('seafood') ||
      combined.includes('tuna') ||
      combined.includes('cod'))
  ) {
    return LIFESTYLE_ASSETS.meals.baked_fish;
  }

  // 12. Soups & Broths (only when explicit soup keywords exist)
  if (
    combined.includes('soup') ||
    combined.includes('broth') ||
    combined.includes('shorba')
  ) {
    return LIFESTYLE_ASSETS.meals.veggie_soup;
  }

  // 13. Chicken & Poultry Dishes (strictly excluded if vegetarian)
  if (
    !isVegetarian &&
    (combined.includes('tikka') ||
      combined.includes('karahi') ||
      combined.includes('kebab') ||
      combined.includes('boti') ||
      combined.includes('chicken') ||
      combined.includes('poultry'))
  ) {
    return LIFESTYLE_ASSETS.meals.chicken_tikka;
  }

  // 14. Salads (distinguish chicken salad vs neutral vegetable salad)
  if (
    combined.includes('salad') ||
    combined.includes('quinoa') ||
    combined.includes('kachumber') ||
    combined.includes('greens')
  ) {
    if (!isVegetarian && (combined.includes('chicken') || combined.includes('meat'))) {
      return LIFESTYLE_ASSETS.meals.grilled_chicken_salad;
    }
    return {
      url: LIFESTYLE_ASSETS.hero.mealBowl.url,
      alt: 'Fresh nourishing nutrient-dense vegetable and grain salad',
      fallbackGradient: 'from-emerald-100 to-teal-100',
    };
  }

  // 15. Smoothies & Drinks
  if (
    combined.includes('smoothie') ||
    combined.includes('shake') ||
    combined.includes('lassi')
  ) {
    return LIFESTYLE_ASSETS.meals.green_smoothie;
  }

  // 16. Healthy Snacks
  if (
    combined.includes('snack') ||
    combined.includes('nut') ||
    combined.includes('almond') ||
    combined.includes('walnut')
  ) {
    return LIFESTYLE_ASSETS.meals.snack_nuts;
  }

  // 17. Fallbacks by meal slot with strict culinary appropriateness
  if (normalizedType.includes('breakfast')) {
    // Safe breakfast morning dish fallback
    return LIFESTYLE_ASSETS.meals.roti_whole_wheat;
  }
  if (normalizedType.includes('dinner')) {
    if (combined.includes('soup') || combined.includes('broth') || combined.includes('shorba')) {
      return LIFESTYLE_ASSETS.meals.veggie_soup;
    }
    return {
      url: LIFESTYLE_ASSETS.hero.mealBowl.url,
      alt: 'Balanced nourishing dinner portion supporting overnight metabolic rest',
      fallbackGradient: 'from-pink-100 to-purple-100',
    };
  }

  // Neutral, non-misleading meal bowl fallback that never falsely implies absent meat or dairy
  return {
    url: LIFESTYLE_ASSETS.hero.mealBowl.url,
    alt: 'Balanced nourishing meal plan portion',
    fallbackGradient: 'from-pink-100 to-emerald-100',
  };
}

/**
 * Helper to resolve workout image based on modality/focus keywords.
 */
export function getWorkoutImage(modality: string = '', focus: string = ''): LifestyleVisual {
  const combined = `${modality} ${focus}`.toLowerCase();
  if (combined.includes('yoga') || combined.includes('mobility') || combined.includes('pelvic')) {
    return LIFESTYLE_ASSETS.fitness.yoga;
  }
  if (combined.includes('cardio') || combined.includes('walk') || combined.includes('aerobic') || combined.includes('step')) {
    return LIFESTYLE_ASSETS.fitness.walking;
  }
  if (combined.includes('stretch') || combined.includes('breath') || combined.includes('recovery')) {
    return LIFESTYLE_ASSETS.fitness.stretching;
  }
  return LIFESTYLE_ASSETS.fitness.strength;
}

