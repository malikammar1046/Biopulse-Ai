export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner';

export type DietaryPreference =
  | 'Non-Vegetarian / Halal'
  | 'Vegetarian'
  | 'Vegan'
  | 'Pescatarian'
  | 'Balanced'
  | 'Custom';

export type AllergenKey = 'dairy' | 'gluten' | 'nuts' | 'eggs' | 'soy' | 'shellfish' | 'sesame';

export interface FoodItem {
  id: string;
  name: string;
  urduName?: string;
  category: 'staple' | 'curry' | 'protein' | 'dairy' | 'vegetable' | 'fruit' | 'snack' | 'beverage';
  dietaryType: 'vegetarian' | 'non-vegetarian' | 'vegan';
  standardServing: string;
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  allergens: AllergenKey[];
  isPakistaniStaple: boolean;
  culturalNote?: string;
  portionGuidance?: string;
  whyItWorks?: string;
}

export interface FoodLogEntry {
  id: string;
  userId: string;
  mealType: MealType;
  foodName: string;
  serving: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  loggedAt: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface FoodLogInput {
  mealType: MealType;
  foodName: string;
  serving: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  loggedAt?: string;
  notes?: string;
}

export interface WaterLogEntry {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  glasses: number;
  targetGlasses: number;
  updatedAt: string;
}

export interface DailyNutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterGlasses: number;
  isCustomOrEstimated: boolean;
  calculationRationale: string;
}

export interface PlannedMeal {
  id: string;
  mealType: MealType;
  title: string;
  urduTitle?: string;
  items: string[];
  approxServing: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  whyItWorks: string;
  prepTimeMinutes: number;
  budgetCategory: 'low' | 'medium' | 'flexible';
  ingredients: string[];
  simpleSteps: string[];
  allergens: AllergenKey[];
  isAllergySafe: boolean;
  allergyWarning?: string;
}

export interface DailyMealPlan {
  date: string;
  cycleStageName?: string;
  symptomNotice?: string;
  meals: Record<MealType, PlannedMeal>;
}

export interface MealBuilderFilters {
  mealType: MealType;
  dietPreference?: string;
  mainIngredient?: string;
  budget?: 'low' | 'medium' | 'flexible';
  cookingTime?: '10' | '20' | '30+';
}

export interface BuildMealResult {
  id: string;
  title: string;
  urduTitle?: string;
  mealType: MealType;
  description: string;
  ingredients: string[];
  simpleSteps: string[];
  servingGuidance: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  whyItWasSuggested: string;
  cookingTimeMinutes: number;
  budgetCategory: 'low' | 'medium' | 'flexible';
  allergens: AllergenKey[];
}

export interface WeeklyDietDaySummary {
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday...
  dayShort: string; // Mon, Tue...
  mealsLoggedCount: number;
  caloriesLogged: number;
  proteinLogged: number;
  carbsLogged: number;
  fatLogged: number;
  waterGlasses: number;
  waterTarget: number;
  balanceScore: number; // 0 to 100
  mealTypesLogged: MealType[];
}
