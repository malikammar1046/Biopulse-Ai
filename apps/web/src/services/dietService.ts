import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/onboarding';
import type {
  MealType,
  FoodLogEntry,
  FoodLogInput,
  WaterLogEntry,
  DailyNutritionTargets,
  PlannedMeal,
  DailyMealPlan,
  MealBuilderFilters,
  BuildMealResult,
  WeeklyDietDaySummary,
} from '../types/diet';
import { DEFAULT_PLANNED_MEALS } from '../data/pakistaniFoodDatabase';

const STORAGE_FOOD_LOGS_PREFIX = 'ovasense_food_logs_';
const STORAGE_WATER_LOGS_PREFIX = 'ovasense_water_logs_';

// Initial realistic food logs for baseline demonstration
const INITIAL_DEMO_FOOD_LOGS: Omit<FoodLogEntry, 'id' | 'userId'>[] = [
  {
    mealType: 'breakfast',
    foodName: 'Desi Vegetable Omelette with Whole Wheat Roti',
    serving: '2 eggs + 1 roti',
    calories: 365,
    proteinG: 17,
    carbsG: 26,
    fatG: 14,
    fiberG: 4.5,
    loggedAt: new Date().toISOString().split('T')[0],
    notes: 'Breakfast with cardamom green tea',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    mealType: 'morning_snack',
    foodName: 'Soaked Almonds & Crisp Guava',
    serving: '6 almonds + 1 guava',
    calories: 195,
    proteinG: 6,
    carbsG: 19,
    fatG: 12,
    fiberG: 8.5,
    loggedAt: new Date().toISOString().split('T')[0],
    notes: 'Mid-morning snack',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    mealType: 'lunch',
    foodName: 'Yellow Moong Daal with Basmati Rice & Kachumber Salad',
    serving: '1 bowl daal + 1 cup rice + salad',
    calories: 420,
    proteinG: 16,
    carbsG: 68,
    fatG: 7,
    fiberG: 10,
    loggedAt: new Date().toISOString().split('T')[0],
    notes: 'Traditional lunch',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

class DietService {
  private getFoodStorageKey(userId: string): string {
    return `${STORAGE_FOOD_LOGS_PREFIX}${userId}`;
  }

  private getWaterStorageKey(userId: string): string {
    return `${STORAGE_WATER_LOGS_PREFIX}${userId}`;
  }

  // --- Local Cache Helpers ---
  private getLocalFoodLogs(userId: string): FoodLogEntry[] {
    try {
      const raw = localStorage.getItem(this.getFoodStorageKey(userId));
      if (raw) return JSON.parse(raw);
      // Initialize with demo entries adapted for this user id
      const initial: FoodLogEntry[] = INITIAL_DEMO_FOOD_LOGS.map((f, idx) => ({
        ...f,
        id: `flog_demo_${idx}_${Date.now().toString(36)}`,
        userId,
      }));
      this.setLocalFoodLogs(userId, initial);
      return initial;
    } catch {
      return [];
    }
  }

  private setLocalFoodLogs(userId: string, logs: FoodLogEntry[]): void {
    try {
      localStorage.setItem(this.getFoodStorageKey(userId), JSON.stringify(logs));
    } catch {
      // ignore
    }
  }

  private getLocalWaterLog(userId: string, date: string): WaterLogEntry {
    try {
      const raw = localStorage.getItem(`${this.getWaterStorageKey(userId)}_${date}`);
      if (raw) return JSON.parse(raw);
      const initial: WaterLogEntry = {
        userId,
        date,
        glasses: 5,
        targetGlasses: 8,
        updatedAt: new Date().toISOString(),
      };
      this.setLocalWaterLog(userId, initial);
      return initial;
    } catch {
      return { userId, date, glasses: 5, targetGlasses: 8, updatedAt: new Date().toISOString() };
    }
  }

  private setLocalWaterLog(userId: string, entry: WaterLogEntry): void {
    try {
      localStorage.setItem(`${this.getWaterStorageKey(userId)}_${entry.date}`, JSON.stringify(entry));
    } catch {
      // ignore
    }
  }

  // --- Food Logs CRUD ---
  async fetchFoodLogs(
    userId: string,
    dateIso?: string
  ): Promise<{ logs: FoodLogEntry[]; error?: string }> {
    const today = dateIso || new Date().toISOString().split('T')[0];
    const allLocal = this.getLocalFoodLogs(userId);
    const localFiltered = allLocal.filter((l) => l.loggedAt === today);

    if (!isSupabaseConfigured()) {
      return { logs: localFiltered };
    }

    try {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('logged_at', today)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetchFoodLogs warning:', error);
        return { logs: localFiltered };
      }

      if (data && data.length > 0) {
        const mapped: FoodLogEntry[] = data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          mealType: row.meal_type as MealType,
          foodName: row.food_name,
          serving: row.serving,
          calories: Number(row.calories) || 0,
          proteinG: Number(row.protein_g) || 0,
          carbsG: Number(row.carbs_g) || 0,
          fatG: Number(row.fat_g) || 0,
          fiberG: Number(row.fiber_g) || 0,
          loggedAt: row.logged_at,
          notes: row.notes || '',
          createdAt: row.created_at,
        }));
        return { logs: mapped };
      }

      return { logs: localFiltered };
    } catch (err: any) {
      console.warn('Unexpected error in fetchFoodLogs:', err);
      return { logs: localFiltered };
    }
  }

  async logFood(
    userId: string,
    input: FoodLogInput
  ): Promise<{ success: boolean; entry?: FoodLogEntry; error?: string }> {
    const today = input.loggedAt || new Date().toISOString().split('T')[0];
    const newEntry: FoodLogEntry = {
      id: `flog_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      mealType: input.mealType,
      foodName: input.foodName.trim(),
      serving: input.serving.trim() || '1 serving',
      calories: Math.round(input.calories) || 0,
      proteinG: Math.round(input.proteinG * 10) / 10 || 0,
      carbsG: Math.round(input.carbsG * 10) / 10 || 0,
      fatG: Math.round(input.fatG * 10) / 10 || 0,
      fiberG: Math.round(input.fiberG * 10) / 10 || 0,
      loggedAt: today,
      notes: input.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const current = this.getLocalFoodLogs(userId);
    this.setLocalFoodLogs(userId, [...current, newEntry]);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('food_logs').insert({
          id: newEntry.id,
          user_id: userId,
          meal_type: newEntry.mealType,
          food_name: newEntry.foodName,
          serving: newEntry.serving,
          calories: newEntry.calories,
          protein_g: newEntry.proteinG,
          carbs_g: newEntry.carbsG,
          fat_g: newEntry.fatG,
          fiber_g: newEntry.fiberG,
          logged_at: newEntry.loggedAt,
          notes: newEntry.notes,
          created_at: newEntry.createdAt,
        });

        if (error) {
          console.warn('Supabase insert food_logs error:', error);
        }
      } catch (err) {
        console.warn('Supabase logFood error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_diet_updated'));
    }

    return { success: true, entry: newEntry };
  }

  async deleteFoodLog(
    userId: string,
    logId: string
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getLocalFoodLogs(userId);
    this.setLocalFoodLogs(
      userId,
      current.filter((l) => l.id !== logId)
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('food_logs').delete().eq('id', logId).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase delete food log error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_diet_updated'));
    }

    return { success: true };
  }

  // --- Water Logs CRUD ---
  async fetchWaterLog(
    userId: string,
    dateIso?: string
  ): Promise<{ entry: WaterLogEntry; error?: string }> {
    const today = dateIso || new Date().toISOString().split('T')[0];
    const local = this.getLocalWaterLog(userId, today);

    if (!isSupabaseConfigured()) {
      return { entry: local };
    }

    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error || !data) {
        return { entry: local };
      }

      const mapped: WaterLogEntry = {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        glasses: Number(data.glasses) || 0,
        targetGlasses: Number(data.target_glasses) || 8,
        updatedAt: data.updated_at || new Date().toISOString(),
      };

      this.setLocalWaterLog(userId, mapped);
      return { entry: mapped };
    } catch {
      return { entry: local };
    }
  }

  async updateWaterGlasses(
    userId: string,
    glasses: number,
    targetGlasses = 8,
    dateIso?: string
  ): Promise<{ success: boolean; entry: WaterLogEntry; error?: string }> {
    const today = dateIso || new Date().toISOString().split('T')[0];
    const updatedGlasses = Math.max(0, Math.min(glasses, 24));

    const updatedEntry: WaterLogEntry = {
      userId,
      date: today,
      glasses: updatedGlasses,
      targetGlasses,
      updatedAt: new Date().toISOString(),
    };

    this.setLocalWaterLog(userId, updatedEntry);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('water_logs').upsert(
          {
            user_id: userId,
            date: today,
            glasses: updatedGlasses,
            target_glasses: targetGlasses,
            updated_at: updatedEntry.updatedAt,
          },
          { onConflict: 'user_id,date' }
        );
      } catch (err) {
        console.warn('Supabase update water error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ovasense_diet_updated'));
    }

    return { success: true, entry: updatedEntry };
  }

  // --- Dynamic Estimated Targets Calculator ---
  calculateNutritionTargets(profile: UserProfile): DailyNutritionTargets {
    const weight = profile.weightKg || 60;
    const height = profile.heightCm || 162;
    let age = 26;

    if (profile.dateOfBirth) {
      const birthYear = new Date(profile.dateOfBirth).getFullYear();
      if (!isNaN(birthYear)) {
        age = Math.max(16, new Date().getFullYear() - birthYear);
      }
    }

    // Basal Metabolic Rate (Mifflin-St Jeor equation for women)
    // BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) - 161
    const bmr = 10 * weight + 6.25 * height - 5 * age - 161;

    // Activity multiplier
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };

    const multiplier = activityMultipliers[profile.lifestyle?.activityLevel || 'moderate'] || 1.35;
    const tdee = Math.round(bmr * multiplier);

    // Protein target: approx 1.3g - 1.6g per kg weight for metabolic satiety
    const proteinG = Math.round(weight * 1.35);

    // Fat target: approx 28% of total calories (9 kcal/g)
    const fatG = Math.round((tdee * 0.28) / 9);

    // Fiber target: approx 28g - 35g for prebiotic hormone clearance
    const fiberG = 30;

    // Remaining calories allocated to complex carbohydrates (4 kcal/g)
    const carbCalories = Math.max(tdee - (proteinG * 4 + fatG * 9), 500);
    const carbsG = Math.round(carbCalories / 4);

    const waterGlasses = profile.lifestyle?.dailyWaterGlasses || 8;

    return {
      calories: tdee,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      waterGlasses,
      isCustomOrEstimated: true,
      calculationRationale: `Estimated for ${profile.fullName || 'Patient'} (${age} yrs, ${weight}kg, ${profile.lifestyle?.activityLevel || 'moderate'} movement).`,
    };
  }

  // --- Dynamic Daily Meal Plan Generator with Cultural & Allergy Alignment ---
  generateDailyMealPlan(
    profile: UserProfile,
    currentPhaseName?: string,
    recentSymptoms: string[] = []
  ): DailyMealPlan {
    const today = new Date().toISOString().split('T')[0];
    const userAllergies = (profile.medical?.allergies || []).map((a) => a.toLowerCase());

    const isVegetarian =
      profile.lifestyle?.dietaryPreference?.toLowerCase().includes('vegetarian') &&
      !profile.lifestyle?.dietaryPreference?.toLowerCase().includes('non');

    const hasBloating = recentSymptoms.some((s) => s.toLowerCase().includes('bloat'));
    const hasFatigue = recentSymptoms.some((s) => s.toLowerCase().includes('fatigue'));

    // Clone baseline planned meals
    const planned: Record<MealType, PlannedMeal> = {
      breakfast: { ...DEFAULT_PLANNED_MEALS.breakfast },
      morning_snack: { ...DEFAULT_PLANNED_MEALS.morning_snack },
      lunch: { ...DEFAULT_PLANNED_MEALS.lunch },
      afternoon_snack: { ...DEFAULT_PLANNED_MEALS.afternoon_snack },
      dinner: { ...DEFAULT_PLANNED_MEALS.dinner },
    };

    // Adapt for Vegetarian if needed
    if (isVegetarian) {
      planned.breakfast = {
        id: 'plan_veg_besan_chilla',
        mealType: 'breakfast',
        title: 'Besan & Saunf Chilla with Mint Dahi Raita',
        urduTitle: 'بیسن کا چیلا اور پودینہ رائتہ',
        items: ['2 Savory Chickpea Pancakes with onions and spinach', '1 Bowl Mint Dahi', '1 Cup Cardamom Green Tea'],
        approxServing: '1 plate (approx 320g)',
        calories: 340,
        proteinG: 15,
        carbsG: 38,
        fatG: 10,
        fiberG: 6.5,
        whyItWorks: 'Plant-powered chickpea protein with gut-nourishing probiotic yogurt.',
        prepTimeMinutes: 15,
        budgetCategory: 'low',
        ingredients: ['1 cup besan (gram flour)', '1/2 cup chopped spinach', '1/4 cup dahi', 'Cumin & mint'],
        simpleSteps: ['Mix besan with water and spices to a pancake batter.', 'Pour onto hot tawa and cook 3 mins each side.', 'Serve warm with fresh dahi raita.'],
        allergens: ['dairy'],
        isAllergySafe: true,
      };

      planned.dinner = {
        id: 'plan_veg_palak_paneer',
        mealType: 'dinner',
        title: 'Palak Paneer with Whole Wheat Roti & Kachumber',
        urduTitle: 'پالک پنیر اور گندم کی روٹی',
        items: ['1 Bowl Palak Paneer (Light Oil)', '1 Whole Wheat Roti', 'Fresh Cucumber Slices'],
        approxServing: '1 dinner plate (approx 400g)',
        calories: 395,
        proteinG: 18,
        carbsG: 34,
        fatG: 16,
        fiberG: 7.5,
        whyItWorks: 'Iron-rich spinach combined with cottage cheese calcium for steady overnight digestion.',
        prepTimeMinutes: 20,
        budgetCategory: 'medium',
        ingredients: ['1 cup pureed spinach', '100g paneer cubes', '1 chapati', 'Garlic, ginger & cumin'],
        simpleSteps: ['Sauté garlic and ginger in 1 tsp olive oil.', 'Add pureed spinach and simmer for 5 mins.', 'Gently fold in paneer cubes and enjoy with 1 chapati.'],
        allergens: ['dairy', 'gluten'],
        isAllergySafe: true,
      };
    }

    // Check allergy safety for each meal
    (Object.keys(planned) as MealType[]).forEach((mType) => {
      const meal = planned[mType];
      const conflicts = meal.allergens.filter((alg) =>
        userAllergies.some((userAlg) => userAlg.includes(alg))
      );

      if (conflicts.length > 0) {
        meal.isAllergySafe = false;
        meal.allergyWarning = `Contains ${conflicts.join(', ')} (conflicts with your saved allergy profile). Consider alternatives below.`;
      }
    });

    let symptomNotice: string | undefined;
    if (hasBloating) {
      symptomNotice = 'You logged bloating recently. Meal suggestions feature cooked greens, cumin, and warm digestive teas to help keep digestion comfortable.';
    } else if (hasFatigue) {
      symptomNotice = 'You logged fatigue recently. Today’s suggestions emphasize iron-rich daal, roasted chana, and unrefined grains for steady afternoon energy.';
    }

    return {
      date: today,
      cycleStageName: currentPhaseName || 'Balanced Cycle Rhythm',
      symptomNotice,
      meals: planned,
    };
  }

  // --- "Build My Meal" Recipe Engine ---
  buildCustomMeal(
    filters: MealBuilderFilters,
    userAllergies: string[] = []
  ): BuildMealResult[] {
    const results: BuildMealResult[] = [];
    const normalizedAllergies = userAllergies.map((a) => a.toLowerCase());

    // Curated matched results
    if (filters.mealType === 'breakfast') {
      results.push({
        id: 'custom_b_1',
        title: 'Desi Vegetable Omelette & Roti with Saunf Chai',
        urduTitle: 'دیسی آملیٹ اور سونف والی چائے',
        mealType: 'breakfast',
        description: '2 farm eggs cooked with onions, tomatoes, and cilantro in light olive oil, served with 1 chapati.',
        ingredients: ['2 eggs', '1/4 diced onion', '1/2 diced tomato', '1 tbsp coriander', '1 whole wheat roti', 'Saunf green tea'],
        simpleSteps: [
          'Whisk eggs with vegetables, black pepper, and pink salt.',
          'Pan-sear for 3 mins on medium heat.',
          'Serve with warm roti and freshly steeped saunf tea.',
        ],
        servingGuidance: 'Eat hot; enjoy the tea 15 mins after breakfast.',
        calories: 365,
        proteinG: 17,
        carbsG: 26,
        fatG: 14,
        fiberG: 4.5,
        whyItWasSuggested: 'High bioavailable protein and choline to jumpstart morning metabolic calm.',
        cookingTimeMinutes: 10,
        budgetCategory: 'low',
        allergens: ['eggs', 'gluten'],
      });

      results.push({
        id: 'custom_b_2',
        title: 'Besan Chilla with Fresh Mint Dahi',
        urduTitle: 'بیسن چیلا اور پودینہ دہی',
        mealType: 'breakfast',
        description: 'Chickpea flour savory crepe packed with spinach, ajwain seeds, and cooling mint curd.',
        ingredients: ['1 cup gram flour (besan)', '1/2 cup chopped greens', '1/4 cup dahi', 'Ajwain & cumin'],
        simpleSteps: [
          'Whisk besan with water, greens, and ajwain into a smooth batter.',
          'Cook on a non-stick tawa for 2 mins each side.',
          'Pair with fresh dahi raita.',
        ],
        servingGuidance: 'Light and completely wheat-free.',
        calories: 320,
        proteinG: 15,
        carbsG: 34,
        fatG: 8,
        fiberG: 6,
        whyItWasSuggested: 'Gluten-friendly plant protein that prevents mid-morning energy crashes.',
        cookingTimeMinutes: 12,
        budgetCategory: 'low',
        allergens: ['dairy'],
      });
    } else if (filters.mealType === 'lunch') {
      results.push({
        id: 'custom_l_1',
        title: 'Yellow Moong Daal with Steamed Rice & Kachumber',
        urduTitle: 'مونگ دال، ابلے چاول اور تازہ سلاد',
        mealType: 'lunch',
        description: 'Golden split moong lentils tempered with cumin, served over 1 cup basmati rice and lemon salad.',
        ingredients: ['1 cup moong daal', '1 cup cooked rice', 'Cucumber, tomato, red onion salad', 'Lemon & zeera'],
        simpleSteps: [
          'Warm the cooked moong daal.',
          'Plate alongside 1 cup fluffy basmati rice.',
          'Generously dress cucumber and onions with fresh lemon.',
        ],
        servingGuidance: 'Enjoy the kachumber salad first to stabilize post-meal glucose response.',
        calories: 420,
        proteinG: 16,
        carbsG: 68,
        fatG: 7,
        fiberG: 10,
        whyItWasSuggested: 'Prebiotic soluble fiber pairs with easily digestible plant protein.',
        cookingTimeMinutes: 20,
        budgetCategory: 'low',
        allergens: [],
      });

      results.push({
        id: 'custom_l_2',
        title: 'Pan-Grilled Chicken Boti with Roti & Kachumber',
        urduTitle: 'گرلڈ چکن بوٹی اور روٹی',
        mealType: 'lunch',
        description: 'Boneless tender chicken breast cubes marinated in garlic and lemon, served with 1 chapati.',
        ingredients: ['130g chicken breast', '1 tbsp yogurt', '1 chapati', 'Fresh salad', 'Green mint chutney'],
        simpleSteps: [
          'Marinate chicken cubes with spices and yogurt.',
          'Pan-sear for 8 minutes until cooked through.',
          'Serve with warm whole wheat chapati and crisp salad.',
        ],
        servingGuidance: 'Squeeze fresh lemon over the chicken for enhanced iron absorption.',
        calories: 390,
        proteinG: 31,
        carbsG: 28,
        fatG: 9,
        fiberG: 5.5,
        whyItWasSuggested: 'Lean high-density poultry protein that keeps cravings away until dinner.',
        cookingTimeMinutes: 20,
        budgetCategory: 'medium',
        allergens: ['gluten', 'dairy'],
      });
    } else {
      results.push({
        id: 'custom_d_1',
        title: 'Bhindi Masala with Whole Wheat Chapati & Daal',
        urduTitle: 'بھنڈی مصالحہ اور گندم کی چپاتی',
        mealType: 'dinner',
        description: 'Sautéed okra cooked with onions and dry spices, paired with a small cup of lentil soup and 1 roti.',
        ingredients: ['150g fresh okra (bhindi)', '1/2 cup cooked daal', '1 whole wheat chapati', 'Tomato & onion base'],
        simpleSteps: [
          'Sauté sliced bhindi with onions and spices for 8 mins.',
          'Warm the daal and plate with 1 hot chapati.',
        ],
        servingGuidance: 'A light dinner ideal before restful sleep.',
        calories: 380,
        proteinG: 14,
        carbsG: 48,
        fatG: 9,
        fiberG: 9.5,
        whyItWasSuggested: 'Okra mucilage soothes digestive lining and aids smooth digestion.',
        cookingTimeMinutes: 15,
        budgetCategory: 'low',
        allergens: ['gluten'],
      });

      results.push({
        id: 'custom_d_2',
        title: 'Pan-Seared Rohu Fish with Roasted Subzi',
        urduTitle: 'روہو مچھلی اور بھنی ہوئی سبزی',
        mealType: 'dinner',
        description: 'Fresh local fish fillet spiced with ajwain and lemon, paired with roasted cauliflower and zucchini.',
        ingredients: ['140g fish fillet', '1 cup mixed cauliflower & zucchini', 'Ajwain, turmeric & pink salt'],
        simpleSteps: [
          'Rub fish with ajwain and lemon.',
          'Sear on medium heat for 4 mins each side.',
          'Sauté vegetables in the same pan with black pepper.',
        ],
        servingGuidance: 'High omega-3 dinner supporting nighttime inflammatory recovery.',
        calories: 310,
        proteinG: 29,
        carbsG: 14,
        fatG: 11,
        fiberG: 5.0,
        whyItWasSuggested: 'Marine omega-3 fatty acids and zinc promote restorative nighttime calm.',
        cookingTimeMinutes: 18,
        budgetCategory: 'medium',
        allergens: ['shellfish'],
      });
    }

    return results.filter((res) => {
      if (normalizedAllergies.length === 0) return true;
      return !res.allergens.some((alg) =>
        normalizedAllergies.some((userAlg) => userAlg.includes(alg))
      );
    });
  }

  // --- 7-Day Weekly Summary Synthesizer ---
  async fetchWeeklyDietSummary(userId: string): Promise<WeeklyDietDaySummary[]> {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekSummaries: WeeklyDietDaySummary[] = [];

    const allLocalLogs = this.getLocalFoodLogs(userId);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateIso = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayShort = dayShorts[d.getDay()];

      const dayLogs = allLocalLogs.filter((l) => l.loggedAt === dateIso);
      const waterLog = this.getLocalWaterLog(userId, dateIso);

      const caloriesLogged = dayLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
      const proteinLogged = dayLogs.reduce((sum, l) => sum + (l.proteinG || 0), 0);
      const carbsLogged = dayLogs.reduce((sum, l) => sum + (l.carbsG || 0), 0);
      const fatLogged = dayLogs.reduce((sum, l) => sum + (l.fatG || 0), 0);

      const mealTypesLogged = Array.from(new Set(dayLogs.map((l) => l.mealType)));

      // Calculate simple non-judgmental balance score
      let balanceScore = 60;
      if (dayLogs.length >= 3) balanceScore += 20;
      else if (dayLogs.length >= 1) balanceScore += 10;

      if (waterLog.glasses >= 6) balanceScore += 20;
      else if (waterLog.glasses >= 4) balanceScore += 10;

      weekSummaries.push({
        date: dateIso,
        dayName,
        dayShort,
        mealsLoggedCount: dayLogs.length,
        caloriesLogged,
        proteinLogged: Math.round(proteinLogged),
        carbsLogged: Math.round(carbsLogged),
        fatLogged: Math.round(fatLogged),
        waterGlasses: waterLog.glasses,
        waterTarget: waterLog.targetGlasses || 8,
        balanceScore: Math.min(balanceScore, 98),
        mealTypesLogged,
      });
    }

    return weekSummaries;
  }
}

export const dietService = new DietService();
