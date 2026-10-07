import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useHealthStore } from '../../store';

const NUTRITION_BOWL = require('../../assets/nutrition_healthy_bowl.jpg');

interface MealPlanItem {
  id: string;
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  title: string;
  kcal: number;
  desc: string;
  protein: string;
  carbs: string;
  fats: string;
  category: 'south_asian' | 'vegetarian' | 'low_cost' | 'high_protein';
}

/**
 * SCREEN 27: MEAL PLAN
 *
 * Strict visual match to Screenshot 27:
 * - Top Header: Back chevron (<), centered "Today's Meal Plan", right calendar icon
 * - Subtitle: "Personalized for your goals\nNutritious, balanced and PCOS-friendly meals."
 * - Category Filter Chips:
 *   - [ South Asian ] (selected by default)
 *   - [ Vegetarian ]
 *   - [ Low-cost ]
 *   - [ High Protein ]
 * - 4 Meal Cards:
 *   1. Breakfast (~ 350 kcal): Vegetable Paratha with Yogurt
 *   2. Lunch (~ 450 kcal): Grilled Chicken with Brown Rice
 *   3. Dinner (~ 400 kcal): Lentil Soup with Salad
 *   4. Snacks (~ 150 kcal): Greek Yogurt with Nuts
 * - Each card displays slot tag, calories, description, and protein/carbs/fats breakdown
 */
export default function MealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { addMeal } = useHealthStore();

  const [activeFilter, setActiveFilter] = useState<'south_asian' | 'vegetarian' | 'low_cost' | 'high_protein'>(
    'south_asian'
  );

  const MEALS: MealPlanItem[] = [
    {
      id: 'm-breakfast',
      slot: 'Breakfast',
      title: 'Vegetable Paratha with Yogurt',
      kcal: 350,
      desc: 'Whole wheat paratha with mixed vegetables and low-fat yogurt',
      protein: '12g protein',
      carbs: '45g carbs',
      fats: '12g fats',
      category: 'south_asian',
    },
    {
      id: 'm-lunch',
      slot: 'Lunch',
      title: 'Grilled Chicken with Brown Rice',
      kcal: 450,
      desc: 'Grilled chicken, brown rice, and salad',
      protein: '35g protein',
      carbs: '50g carbs',
      fats: '14g fats',
      category: 'high_protein',
    },
    {
      id: 'm-dinner',
      slot: 'Dinner',
      title: 'Lentil Soup with Salad',
      kcal: 400,
      desc: 'Masoor dal soup with fresh salad and roti',
      protein: '18g protein',
      carbs: '48g carbs',
      fats: '10g fats',
      category: 'vegetarian',
    },
    {
      id: 'm-snacks',
      slot: 'Snacks',
      title: 'Greek Yogurt with Nuts',
      kcal: 150,
      desc: 'Low-fat yogurt with almonds and chia seeds',
      protein: '8g protein',
      carbs: '12g carbs',
      fats: '8g fats',
      category: 'low_cost',
    },
  ];

  const filteredMeals = useMemo(() => {
    // Show all 4 primary meals with highlighted category tag or specific filter
    return MEALS;
  }, []);

  const handleMealPress = (meal: MealPlanItem) => {
    Alert.alert(
      meal.title,
      `${meal.desc}\n\nCalories: ~${meal.kcal} kcal\n${meal.protein} • ${meal.carbs} • ${meal.fats}\n\nWould you like to log this meal to today's nutrition?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log to Today',
          onPress: () => {
            addMeal({
              mealType: meal.slot.toLowerCase() as any,
              name: meal.title,
              description: meal.desc,
              calories: meal.kcal,
              proteinGrams: parseInt(meal.protein, 10) || 15,
              time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            });
            Alert.alert('Logged', `${meal.title} added to your daily meals.`);
          },
        },
      ]
    );
  };

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 20);

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

        <Pressable hitSlop={10} style={styles.headerRightBtn}>
          <Ionicons name="calendar-outline" size={22} color="#F43F7D" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* TITLE & SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.screenHeading}>Personalized for your goals</Text>
            <Text style={styles.screenSub}>
              Nutritious, balanced and PCOS-friendly meals.
            </Text>
          </View>

          {/* FILTER CHIPS ROW */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {[
              { id: 'south_asian', label: 'South Asian' },
              { id: 'vegetarian', label: 'Vegetarian' },
              { id: 'low_cost', label: 'Low-cost' },
              { id: 'high_protein', label: 'High Protein' },
            ].map((f) => {
              const isSelected = activeFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setActiveFilter(f.id as any)}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected,
                  ]}
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

          {/* MEAL CARDS LIST */}
          <View style={styles.mealsContainer}>
            {filteredMeals.map((meal) => (
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
                    <View style={styles.slotPill}>
                      <Text style={styles.slotText}>{meal.slot}</Text>
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
                </View>
              </Pressable>
            ))}
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
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipSelected: {
    backgroundColor: '#F43F7D',
    borderColor: '#F43F7D',
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
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F7D',
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
});
