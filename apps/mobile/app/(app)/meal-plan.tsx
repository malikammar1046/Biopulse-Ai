import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { NutritionService } from '../../services/nutritionService';

const NUTRITION_BOWL = require('../../assets/nutrition_healthy_bowl.jpg');

export type MealCategory = 'all' | 'south_asian' | 'vegetarian' | 'low_cost' | 'high_protein';

export interface MealPlanItem {
  id: string;
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  title: string;
  kcal: number;
  desc: string;
  protein: string;
  carbs: string;
  fats: string;
  category: 'south_asian' | 'vegetarian' | 'low_cost' | 'high_protein';
  pathwayFocus?: string;
}

// Pathway-aware clinical curated meal options
const CLINICAL_MEAL_CATALOG: MealPlanItem[] = [
  // South Asian
  {
    id: 'm-sa-b',
    slot: 'Breakfast',
    title: 'Besan Chilla with Mint Dahi',
    kcal: 340,
    desc: 'Savory chickpea flour pancake with spinach, cumin, and low-fat probiotic dahi',
    protein: '16g protein',
    carbs: '38g carbs',
    fats: '10g fats',
    category: 'south_asian',
    pathwayFocus: 'Low-glycemic legumes stabilize morning glucose and insulin surges.',
  },
  {
    id: 'm-sa-l',
    slot: 'Lunch',
    title: 'Daal Masoor with Brown Roti & Salad',
    kcal: 420,
    desc: 'Spiced red lentils tempered with garlic and cumin, 1 whole wheat roti, and kachumber',
    protein: '22g protein',
    carbs: '54g carbs',
    fats: '11g fats',
    category: 'south_asian',
    pathwayFocus: 'High soluble fiber clears circulating estrogen metabolites and maintains satiety.',
  },
  {
    id: 'm-sa-d',
    slot: 'Dinner',
    title: 'Grilled Fish with Steamed Vegetables',
    kcal: 380,
    desc: 'Pan-seared river fish with turmeric, lemon, and steamed green beans and carrots',
    protein: '32g protein',
    carbs: '22g carbs',
    fats: '12g fats',
    category: 'south_asian',
    pathwayFocus: 'Omega-3 fatty acids lower systemic inflammation and support hormonal synthesis.',
  },
  {
    id: 'm-sa-s',
    slot: 'Snacks',
    title: 'Roasted Bhuna Chana & Walnuts',
    kcal: 160,
    desc: 'Crisp roasted chickpeas with a handful of raw walnuts and green cardamom tea',
    protein: '8g protein',
    carbs: '16g carbs',
    fats: '7g fats',
    category: 'south_asian',
    pathwayFocus: 'Magnesium and zinc support cellular energy and ovarian/testicular enzyme function.',
  },

  // Vegetarian
  {
    id: 'm-veg-b',
    slot: 'Breakfast',
    title: 'Vegetable Oats Upma with Peanuts',
    kcal: 320,
    desc: 'Rolled oats with mustard seeds, curry leaves, diced carrots, and roasted peanuts',
    protein: '11g protein',
    carbs: '44g carbs',
    fats: '10g fats',
    category: 'vegetarian',
    pathwayFocus: 'Beta-glucan fiber smooths insulin release and prevents mid-morning fatigue.',
  },
  {
    id: 'm-veg-l',
    slot: 'Lunch',
    title: 'Palak Paneer with Whole Wheat Roti',
    kcal: 430,
    desc: 'Fresh spinach curry with low-fat paneer cubes, whole wheat roti, and sliced cucumber',
    protein: '24g protein',
    carbs: '38g carbs',
    fats: '17g fats',
    category: 'vegetarian',
    pathwayFocus: 'Bioavailable calcium and iron for red blood cell synthesis and energy.',
  },
  {
    id: 'm-veg-d',
    slot: 'Dinner',
    title: 'Spiced Chickpea (Chole) Bowl',
    kcal: 390,
    desc: 'Slow-simmered chickpeas with ginger, tomatoes, brown basmati rice, and mint raita',
    protein: '18g protein',
    carbs: '52g carbs',
    fats: '9g fats',
    category: 'vegetarian',
    pathwayFocus: 'Complex plant starches support prebiotic gut flora balance.',
  },
  {
    id: 'm-veg-s',
    slot: 'Snacks',
    title: 'Greek Yogurt with Chia & Berries',
    kcal: 150,
    desc: 'Low-fat unsweetened yogurt topped with chia seeds and seasonal pomegranate seeds',
    protein: '12g protein',
    carbs: '14g carbs',
    fats: '4g fats',
    category: 'vegetarian',
    pathwayFocus: 'Antioxidants and probiotics for microvascular endothelial health.',
  },

  // Low-cost
  {
    id: 'm-lc-b',
    slot: 'Breakfast',
    title: 'Two Boiled Eggs with Whole Wheat Toast',
    kcal: 310,
    desc: 'Farm eggs with black pepper, 1 slice whole wheat bread, and mint green tea',
    protein: '16g protein',
    carbs: '22g carbs',
    fats: '14g fats',
    category: 'low_cost',
    pathwayFocus: 'Choline from egg yolks supports hepatic lipid clearance and hormonal integrity.',
  },
  {
    id: 'm-lc-l',
    slot: 'Lunch',
    title: 'Moong Daal with Rice & Tomato Kachumber',
    kcal: 410,
    desc: 'Yellow split moong daal with steamed rice, fresh lemon juice, and red onions',
    protein: '17g protein',
    carbs: '62g carbs',
    fats: '7g fats',
    category: 'low_cost',
    pathwayFocus: 'Light on digestion while delivering steady amino acids at minimal cost.',
  },
  {
    id: 'm-lc-d',
    slot: 'Dinner',
    title: 'Aloo Gobi with Whole Wheat Roti',
    kcal: 360,
    desc: 'Spiced cauliflower and potato curry with turmeric, cumin, and fresh whole wheat roti',
    protein: '10g protein',
    carbs: '56g carbs',
    fats: '8g fats',
    category: 'low_cost',
    pathwayFocus: 'Indole-3-carbinol in cauliflower assists healthy estrogen metabolism.',
  },
  {
    id: 'm-lc-s',
    slot: 'Snacks',
    title: 'Roasted Peanuts with Sliced Apple',
    kcal: 170,
    desc: 'Handful of dry roasted peanuts paired with a crisp sliced local apple',
    protein: '7g protein',
    carbs: '18g carbs',
    fats: '9g fats',
    category: 'low_cost',
    pathwayFocus: 'Polyphenols and resveratrol support mitochondrial oxidative resistance.',
  },

  // High Protein
  {
    id: 'm-hp-b',
    slot: 'Breakfast',
    title: 'Egg White Omelet with Mushrooms & Toast',
    kcal: 360,
    desc: '3 egg whites, 1 whole egg, sliced button mushrooms, spinach, and 1 multigrain toast',
    protein: '28g protein',
    carbs: '24g carbs',
    fats: '12g fats',
    category: 'high_protein',
    pathwayFocus: 'Substantial morning protein triggers satiety hormones (GLP-1 and PYY).',
  },
  {
    id: 'm-hp-l',
    slot: 'Lunch',
    title: 'Grilled Chicken Breast with Brown Rice',
    kcal: 480,
    desc: 'Skinless chicken breast marinated in yogurt and garlic, 1 cup brown rice, and broccoli',
    protein: '42g protein',
    carbs: '46g carbs',
    fats: '11g fats',
    category: 'high_protein',
    pathwayFocus: 'Lean leucine-rich protein stimulates muscle protein synthesis and glucose disposal.',
  },
  {
    id: 'm-hp-d',
    slot: 'Dinner',
    title: 'Beef Kebab with Lentil Salad',
    kcal: 440,
    desc: 'Lean minced beef patties with cumin, coriander, tossed green lentils, and lemon dressing',
    protein: '36g protein',
    carbs: '28g carbs',
    fats: '15g fats',
    category: 'high_protein',
    pathwayFocus: 'Bioavailable heme iron and zinc essential for testosterone and reproductive wellness.',
  },
  {
    id: 'm-hp-s',
    slot: 'Snacks',
    title: 'Sattu or Whey Protein Shake',
    kcal: 180,
    desc: 'Roasted gram flour (sattu) drink with black salt, cumin, and fresh lemon',
    protein: '16g protein',
    carbs: '20g carbs',
    fats: '2g fats',
    category: 'high_protein',
    pathwayFocus: 'Rapidly absorbed metabolic fuel without spikes in refined sugars.',
  },
];

export default function MealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const accentColor = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const { addMeal } = useHealthStore();

  const [activeFilter, setActiveFilter] = useState<MealCategory>('south_asian');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSavingPref, setIsSavingPref] = useState<boolean>(false);
  const [backendPlanTitle, setBackendPlanTitle] = useState<string | null>(null);

  // Load user meal plan or preferences from backend
  const loadPlanData = useCallback(async () => {
    const token = user?.accessToken;
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check user preferences
      const prefRes = await NutritionService.getPreferences(token);
      if (prefRes.data?.preferred_cuisines && prefRes.data.preferred_cuisines.length > 0) {
        const pref = prefRes.data.preferred_cuisines[0].toLowerCase();
        if (['south_asian', 'vegetarian', 'low_cost', 'high_protein'].includes(pref)) {
          setActiveFilter(pref as MealCategory);
        }
      }

      // 2. Check current meal plan
      const planRes = await NutritionService.getCurrentMealPlan(token);
      if (planRes.data && planRes.data.title) {
        setBackendPlanTitle(planRes.data.title);
      }
    } catch (err) {
      console.warn('[BioPulse MealPlan] Plan load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.accessToken]);

  useEffect(() => {
    loadPlanData();
  }, [loadPlanData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPlanData();
  }, [loadPlanData]);

  // Working controlled filter
  const displayedMeals = useMemo(() => {
    if (activeFilter === 'all') {
      return CLINICAL_MEAL_CATALOG.slice(0, 4);
    }
    const matching = CLINICAL_MEAL_CATALOG.filter((m) => m.category === activeFilter);
    return matching.length > 0 ? matching : CLINICAL_MEAL_CATALOG.slice(0, 4);
  }, [activeFilter]);

  const handleSaveFilterPreference = async (cat: MealCategory) => {
    setActiveFilter(cat);
    if (!user?.accessToken || cat === 'all') return;

    setIsSavingPref(true);
    try {
      await NutritionService.updatePreferences(user.accessToken, {
        preferred_cuisines: [cat],
      });
    } catch (err) {
      console.warn('[BioPulse MealPlan] Preference save error:', err);
    } finally {
      setIsSavingPref(false);
    }
  };

  const handleCuisineToggle = handleSaveFilterPreference;

  const handleMealPress = (meal: MealPlanItem) => {
    Alert.alert(
      meal.title,
      `${meal.desc}\n\nCalories: ~${meal.kcal} kcal\n${meal.protein} • ${meal.carbs} • ${meal.fats}\n\nClinical Focus: ${meal.pathwayFocus || 'Balanced endocrine nutrition'}\n\nWould you like to log this meal to today's food log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log to Today',
          onPress: async () => {
            const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            await addMeal({
              mealType: meal.slot.toLowerCase() as any,
              name: meal.title,
              description: meal.desc,
              calories: meal.kcal,
              proteinGrams: parseInt(meal.protein, 10) || 15,
              time: timeStr,
            });
            Alert.alert('Meal Logged', `${meal.title} has been recorded into today's nutrition diary.`);
          },
        },
      ]
    );
  };

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

  const filterOptions: { id: MealCategory; label: string }[] = [
    { id: 'south_asian', label: 'South Asian' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'low_cost', label: 'Low-cost' },
    { id: 'high_protein', label: 'High Protein' },
  ];

  return (
    <BioPulseBackground style={styles.root}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* TOP HEADER */}
      <View style={[styles.topHeader, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle}>Today's Meal Plan</Text>

        <Pressable
          onPress={() => router.push('/(app)/nutrition')}
          hitSlop={10}
          style={styles.headerRightBtn}
          accessibilityLabel="Nutrition Diary"
        >
          <Ionicons name="restaurant-outline" size={22} color={accentColor} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={accentColor} />}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.screenHeading}>
              {backendPlanTitle || 'Personalized for your goals'}
            </Text>
            <Text style={styles.screenSub}>
              {isFemale
                ? 'Nutritious, low-glycemic meals formulated for PCOS insulin sensitivity and ovulatory regularity.'
                : 'Nutritious, high-protein meals formulated for metabolic vitality and endocrine stamina.'}
            </Text>
          </View>

          {/* FILTER CHIPS ROW */}
          <View style={styles.filterSection}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterLabel}>Cuisine & Diet Preference:</Text>
              {isSavingPref && <ActivityIndicator size="small" color={accentColor} />}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {filterOptions.map((f) => {
                const isSelected = activeFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => handleSaveFilterPreference(f.id)}
                    style={[
                      styles.filterChip,
                      isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={f.label}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* LOADING STATE */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={styles.loadingText}>Aligning personalized meals...</Text>
            </View>
          )}

          {/* MEAL CARDS LIST */}
          {!isLoading && (
            <View style={styles.mealsContainer}>
              {displayedMeals.map((meal) => (
                <Pressable
                  key={meal.id}
                  onPress={() => handleMealPress(meal)}
                  style={({ pressed }) => [styles.mealCard, pressed && styles.cardPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={meal.title}
                >
                  <Image source={NUTRITION_BOWL} style={styles.mealThumb} resizeMode="cover" />

                  <View style={styles.mealInfoCol}>
                    <View style={styles.slotRow}>
                      <View style={[styles.slotPill, { backgroundColor: isFemale ? '#FDF2F8' : '#F0F9FF' }]}>
                        <Text style={[styles.slotText, { color: accentColor }]}>{meal.slot}</Text>
                      </View>
                      <Text style={styles.kcalText}>~ {meal.kcal} kcal</Text>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>

                    <Text style={styles.mealTitle}>{meal.title}</Text>
                    <Text style={styles.mealDesc}>{meal.desc}</Text>

                    <View style={styles.macroChipsRow}>
                      <Text style={styles.macroChipText}>🌾 {meal.protein}</Text>
                      <Text style={styles.macroChipText}>🍞 {meal.carbs}</Text>
                      <Text style={styles.macroChipText}>🥑 {meal.fats}</Text>
                    </View>

                    {meal.pathwayFocus && (
                      <Text style={styles.pathwayNote}>💡 {meal.pathwayFocus}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* BOTTOM QUICK ACTIONS */}
          <View style={styles.bottomBanner}>
            <View style={styles.bannerInfo}>
              <Ionicons name="sparkles" size={20} color={accentColor} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Tap any meal to log</Text>
                <Text style={styles.bannerDesc}>
                  Selected meals will automatically record into your daily macros log.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/nutrition')}
              style={[styles.bannerBtn, { borderColor: accentColor }]}
            >
              <Text style={[styles.bannerBtnText, { color: accentColor }]}>View Daily Log</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </BioPulseBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#073B72',
  },
  headerRightBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 460,
  },
  tabletWrapper: {
    maxWidth: 580,
  },
  titleSection: {
    marginBottom: 14,
  },
  screenHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  mealsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.95,
  },
  mealThumb: {
    width: 78,
    height: 78,
    borderRadius: 14,
  },
  mealInfoCol: {
    flex: 1,
    gap: 2,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  slotPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kcalText: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: '#073B72',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  mealDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 4,
  },
  macroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  pathwayNote: {
    marginTop: 4,
    fontSize: 10.5,
    color: '#0D9488',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  bottomBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginTop: 4,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#073B72',
  },
  bannerDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
