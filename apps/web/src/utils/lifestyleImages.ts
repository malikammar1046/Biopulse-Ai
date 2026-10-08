/**
 * Curated high-resolution photography and vector visual library for BioPulse AI
 * Lifestyle, Nutrition, Movement, and Circadian Recovery.
 * Uses high-performance CDN URLs with crop parameters and fallback gradients.
 */

export interface LifestyleVisual {
  url: string;
  alt: string;
  fallbackGradient: string;
}

export const LIFESTYLE_IMAGES = {
  meals: {
    breakfast: {
      url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      alt: 'Nutrient-rich poached eggs and avocado on seeded toast',
      fallbackGradient: 'from-amber-100 to-emerald-100',
    },
    morning_snack: {
      url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
      alt: 'Antioxidant berries and chia seed parfait',
      fallbackGradient: 'from-pink-100 to-rose-100',
    },
    lunch: {
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      alt: 'Mediterranean quinoa, fresh greens, and wild protein bowl',
      fallbackGradient: 'from-emerald-100 to-teal-100',
    },
    afternoon_snack: {
      url: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80',
      alt: 'Clean green smoothie with plant proteins and seeds',
      fallbackGradient: 'from-teal-100 to-cyan-100',
    },
    dinner: {
      url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      alt: 'Wild herb-crusted salmon with roasted asparagus and sweet potato',
      fallbackGradient: 'from-sky-100 to-indigo-100',
    },
    snack: {
      url: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80',
      alt: 'Raw walnuts, almonds, and dried berries blend',
      fallbackGradient: 'from-amber-100 to-orange-100',
    },
  },
  fitness: {
    resistance: {
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      alt: 'Strength training weights for metabolic insulin sensitivity',
      fallbackGradient: 'from-sky-100 to-blue-200',
    },
    cardio: {
      url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
      alt: 'Low-impact brisk aerobic conditioning outdoors',
      fallbackGradient: 'from-teal-100 to-emerald-200',
    },
    mobility: {
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      alt: 'Restorative yoga flow, pelvic opening and gentle mobility',
      fallbackGradient: 'from-purple-100 to-pink-100',
    },
    hiit: {
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      alt: 'Targeted interval conditioning for mitochondrial health',
      fallbackGradient: 'from-rose-100 to-orange-100',
    },
  },
  recovery: {
    sleep: {
      url: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=800&q=80',
      alt: 'Peaceful bedroom sanctuary with morning natural sunlight',
      fallbackGradient: 'from-indigo-100 to-slate-200',
    },
    stress: {
      url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      alt: 'Mindful breathing, parasympathetic reset in tranquil nature',
      fallbackGradient: 'from-teal-100 to-emerald-100',
    },
    hydration: {
      url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
      alt: 'Pure structured hydration with electrolyte citrus slices',
      fallbackGradient: 'from-sky-100 to-cyan-100',
    },
  },
} as const;

/**
 * Helper to safely resolve a meal image based on meal type or meal name keywords.
 */
export function getMealImage(mealType: string, mealName?: string): LifestyleVisual {
  const normalizedType = mealType.toLowerCase().trim();
  const normalizedName = (mealName || '').toLowerCase();

  if (normalizedName.includes('smoothie') || normalizedName.includes('shake')) {
    return LIFESTYLE_IMAGES.meals.afternoon_snack;
  }
  if (normalizedName.includes('salmon') || normalizedName.includes('fish') || normalizedName.includes('dinner')) {
    return LIFESTYLE_IMAGES.meals.dinner;
  }
  if (normalizedName.includes('egg') || normalizedName.includes('oat') || normalizedName.includes('toast') || normalizedType === 'breakfast') {
    return LIFESTYLE_IMAGES.meals.breakfast;
  }
  if (normalizedType.includes('lunch') || normalizedName.includes('salad') || normalizedName.includes('bowl')) {
    return LIFESTYLE_IMAGES.meals.lunch;
  }
  if (normalizedType.includes('snack')) {
    return LIFESTYLE_IMAGES.meals.snack;
  }
  return LIFESTYLE_IMAGES.meals.dinner;
}

/**
 * Helper to resolve workout image based on modality/focus keywords.
 */
export function getWorkoutImage(modality: string = '', focus: string = ''): LifestyleVisual {
  const combined = `${modality} ${focus}`.toLowerCase();
  if (combined.includes('yoga') || combined.includes('stretch') || combined.includes('mobility') || combined.includes('pelvic')) {
    return LIFESTYLE_IMAGES.fitness.mobility;
  }
  if (combined.includes('cardio') || combined.includes('walk') || combined.includes('aerobic') || combined.includes('run')) {
    return LIFESTYLE_IMAGES.fitness.cardio;
  }
  if (combined.includes('hiit') || combined.includes('interval')) {
    return LIFESTYLE_IMAGES.fitness.hiit;
  }
  return LIFESTYLE_IMAGES.fitness.resistance;
}
