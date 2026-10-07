import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
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
import { SaladBowlIllustration } from '../../components/ui/StateIllustrations';

const NUTRITION_BOWL = require('../../assets/nutrition_healthy_bowl.jpg');

/**
 * SCREEN 26: NUTRITION LOG
 *
 * Strict visual match to Screenshot 26:
 * - Top Header: Back chevron (<), centered "Nutrition Log", right calendar icon
 * - Date Navigator: < Today, 14 Sep 2026 >
 * - Macro Ring Card:
 *   - Circular ring gauge with 1,320 of 1,800 kcal
 *   - Macro breakdown: Protein (62 / 90 g), Carbs (148 / 220 g), Fats (42 / 70 g)
 * - Section: "Meals Logged (2)" with [+ Add Meal] button
 * - Meal Cards:
 *   - Breakfast (8:30 AM, 320 kcal): Oats with Banana (12g protein, 48g carbs, 10g fats)
 *   - Lunch (1:15 PM, 420 kcal): Grilled Chicken Salad (35g protein, 18g carbs, 22g fats)
 * - Dual Bottom CTAs:
 *   - [ 📖 View Meal Plan ] (outline button)
 *   - [ + Add Meal ] (solid pink button)
 */
export default function NutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { nutrition, addMeal } = useHealthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFats, setMealFats] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');

  const consumedKcal = nutrition.caloriesConsumed || 1320;
  const targetKcal = nutrition.calorieTarget || 1800;

  const proteinG = nutrition.proteinConsumed || 62;
  const proteinTarget = nutrition.proteinTarget || 90;

  const carbsG = nutrition.carbsConsumed || 148;
  const carbsTarget = nutrition.carbsTarget || 220;

  const fatsG = nutrition.fatsConsumed || 42;
  const fatsTarget = nutrition.fatsTarget || 70;

  const handleAddSubmit = useCallback(() => {
    if (!mealName.trim() || !mealKcal.trim()) {
      Alert.alert('Required', 'Please enter meal title and estimated calories.');
      return;
    }

    addMeal({
      mealType: mealType.toLowerCase() as any,
      name: mealName.trim(),
      description: mealName.trim(),
      calories: parseInt(mealKcal, 10) || 350,
      proteinGrams: parseInt(mealProtein, 10) || 15,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    });

    setMealName('');
    setMealKcal('');
    setMealProtein('');
    setMealCarbs('');
    setMealFats('');
    setModalVisible(false);
  }, [mealName, mealKcal, mealProtein, mealType, addMeal]);

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

        <Text style={styles.headerTitle}>Nutrition Log</Text>

        <Pressable hitSlop={10} style={styles.headerRightBtn}>
          <Ionicons name="calendar-outline" size={22} color="#F43F7D" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* DATE NAVIGATOR */}
          <View style={styles.dateNavigatorRow}>
            <Pressable hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#64748B" />
            </Pressable>
            <Text style={styles.dateNavigatorText}>Today, 14 Sep 2026</Text>
            <Pressable hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* MACRO RING & BREAKDOWN CARD */}
          <View style={styles.macrosCard}>
            {/* Ring Gauge on Left */}
            <View style={styles.gaugeBox}>
              <View style={styles.multiArcRing}>
                <View style={styles.ringInner}>
                  <Text style={styles.kcalNumberText}>{consumedKcal.toLocaleString()}</Text>
                  <Text style={styles.kcalSubText}>of {targetKcal.toLocaleString()} kcal</Text>
                </View>
              </View>
            </View>

            {/* Macros List on Right */}
            <View style={styles.macroListCol}>
              {/* Protein */}
              <View style={styles.macroItemRow}>
                <View style={[styles.macroDot, { backgroundColor: '#0284C7' }]} />
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>
                  {proteinG} <Text style={styles.macroTarget}>/ {proteinTarget} g</Text>
                </Text>
              </View>

              {/* Carbs */}
              <View style={styles.macroItemRow}>
                <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>
                  {carbsG} <Text style={styles.macroTarget}>/ {carbsTarget} g</Text>
                </Text>
              </View>

              {/* Fats */}
              <View style={styles.macroItemRow}>
                <View style={[styles.macroDot, { backgroundColor: '#F43F7D' }]} />
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroValue}>
                  {fatsG} <Text style={styles.macroTarget}>/ {fatsTarget} g</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* MEALS LOGGED HEADER */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Meals Logged ({nutrition.meals?.length || 0})
            </Text>
            <Pressable onPress={() => setModalVisible(true)} style={styles.addMealTextBtn}>
              <Ionicons name="add" size={16} color="#F43F7D" />
              <Text style={styles.addMealText}>Add Meal</Text>
            </Pressable>
          </View>

          {/* MEALS LIST OR EMPTY STATE */}
          {(!nutrition.meals || nutrition.meals.length === 0) ? (
            <View style={styles.mealsEmptyCard}>
              <SaladBowlIllustration size={150} />
              <Text style={styles.emptyMealsTitle}>No meals logged today</Text>
              <Text style={styles.emptyMealsDesc}>
                Start logging meals to receive more relevant nutrition insights and personalized meal recommendations.
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                style={styles.emptyLogMealBtn}
                accessibilityRole="button"
              >
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyLogMealBtnText}>Log a Meal</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(app)/meal-plan')}
                style={styles.emptyViewPlanBtn}
                accessibilityRole="button"
              >
                <Ionicons name="book-outline" size={18} color="#F43F7D" style={{ marginRight: 6 }} />
                <Text style={styles.emptyViewPlanBtnText}>View Meal Plan</Text>
              </Pressable>

              {/* WHY LOG MEALS */}
              <View style={styles.whyCard}>
                <View style={styles.whyHeaderRow}>
                  <View style={styles.whyIconCircle}>
                    <Ionicons name="bulb-outline" size={18} color="#D97706" />
                  </View>
                  <Text style={styles.whyTitle}>Why log meals?</Text>
                </View>

                <View style={styles.whyBulletsCol}>
                  <View style={styles.whyBulletRow}>
                    <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                    <Text style={styles.whyBulletText}>Helps in personalized nutrition plans</Text>
                  </View>
                  <View style={styles.whyBulletRow}>
                    <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                    <Text style={styles.whyBulletText}>Supports better weight and hormonal health</Text>
                  </View>
                  <View style={styles.whyBulletRow}>
                    <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                    <Text style={styles.whyBulletText}>Provides relevant food recommendations</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {nutrition.meals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <Image source={NUTRITION_BOWL} style={styles.mealThumb} resizeMode="cover" />
                  <View style={styles.mealInfoCol}>
                    <View style={styles.mealTagRow}>
                      <View style={styles.mealTagPill}>
                        <Text style={styles.mealTagText}>{meal.mealType.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.mealTimeText}>{meal.time}</Text>
                      <Text style={styles.mealKcalText}>{meal.calories} kcal</Text>
                    </View>

                    <Text style={styles.mealTitle}>{meal.name}</Text>
                    <Text style={styles.mealDesc}>{meal.description}</Text>

                    <View style={styles.macroChipsRow}>
                      <Text style={styles.macroChipText}>🌾 {meal.proteinGrams}g protein</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* DUAL BOTTOM CTAS */}
          <View style={styles.dualCtasRow}>
            {/* View Meal Plan */}
            <Pressable
              onPress={() => router.push('/(app)/meal-plan')}
              style={styles.viewPlanBtn}
              accessibilityRole="button"
              accessibilityLabel="View Meal Plan"
            >
              <Ionicons name="book-outline" size={18} color="#F43F7D" style={{ marginRight: 6 }} />
              <Text style={styles.viewPlanBtnText}>View Meal Plan</Text>
            </Pressable>

            {/* Add Meal */}
            <Pressable
              onPress={() => setModalVisible(true)}
              style={styles.addMealBtn}
              accessibilityRole="button"
              accessibilityLabel="Add Meal"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addMealBtnText}>Add Meal</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* QUICK ADD MEAL MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Log a Meal</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Meal description (e.g. Greek yogurt with nuts)"
              placeholderTextColor="#94A3B8"
              value={mealName}
              onChangeText={setMealName}
            />

            <View style={styles.modalInputsRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Calories (kcal)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={mealKcal}
                onChangeText={setMealKcal}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Protein (g)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={mealProtein}
                onChangeText={setMealProtein}
              />
            </View>

            <Pressable onPress={handleAddSubmit} style={styles.modalSubmitBtn}>
              <Text style={styles.modalSubmitBtnText}>Save Meal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  dateNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dateNavigatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  macrosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
    gap: 16,
  },
  gaugeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiArcRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: '#14B8A6',
    borderTopColor: '#F43F7D',
    borderRightColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#073B72',
  },
  kcalSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  macroListCol: {
    flex: 1,
    gap: 8,
  },
  macroItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  macroLabel: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  macroTarget: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  addMealTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 4,
  },
  addMealText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F7D',
  },
  mealsList: {
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
  mealThumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  mealInfoCol: {
    flex: 1,
    gap: 2,
  },
  mealTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mealTagPill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mealTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F7D',
  },
  mealTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mealKcalText: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  mealDesc: {
    fontSize: 12,
    color: '#64748B',
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
  dualCtasRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  viewPlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F43F7D',
  },
  viewPlanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F43F7D',
  },
  addMealBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F43F7D',
  },
  addMealBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSubmitBtn: {
    backgroundColor: '#F43F7D',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // In-Context Meals Empty State Styles (Screen 47 Bottom Middle)
  mealsEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  emptyMealsTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMealsDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    marginBottom: 20,
  },
  emptyLogMealBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyLogMealBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyViewPlanBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyViewPlanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
  },
  whyCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  whyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  whyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  whyBulletsCol: {
    gap: 8,
  },
  whyBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whyBulletText: {
    fontSize: 12,
    color: '#475569',
  },
});
