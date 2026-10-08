import React, { useState, useCallback, useMemo } from 'react';
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
 *   - Circular ring gauge with kcal consumed of target kcal
 *   - Macro breakdown: Protein, Carbs, Fats
 * - Section: "Meals Logged (N)" with [+ Add Meal] button
 * - Meal Cards:
 *   - Meal type tag, Time, Kcal
 *   - Title & Portion description
 *   - Protein macro chip & Delete action
 * - Dual Bottom CTAs:
 *   - [ 📖 View Meal Plan ] (outline button)
 *   - [ + Add Meal ] (solid pink button)
 * - Persistent Backend Integration:
 *   - Connects to public.nutrition_food_logs via useHealthStore
 *   - Date navigation loads true stored logs
 *   - Loading, Empty, Error, Retry, and Save Success handling
 */
export default function NutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    nutrition,
    addMeal,
    deleteMeal,
    isLoadingNutrition,
    nutritionError,
    loadNutritionData,
  } = useHealthStore();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealPortion, setMealPortion] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFats, setMealFats] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  const dateDisplayStr = useMemo(() => {
    const formatted = currentDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return isToday ? `Today, ${formatted}` : formatted;
  }, [currentDate, isToday]);

  const changeDate = useCallback((offsetDays: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    setCurrentDate(nextDate);
    const dateIso = nextDate.toISOString().split('T')[0];
    loadNutritionData(dateIso);
  }, [currentDate, loadNutritionData]);

  const consumedKcal = nutrition.caloriesConsumed ?? 0;
  const targetKcal = nutrition.calorieTarget || 1800;

  const proteinG = nutrition.proteinConsumed ?? 0;
  const proteinTarget = nutrition.proteinTarget || 90;

  const carbsG = nutrition.carbsConsumed ?? 0;
  const carbsTarget = nutrition.carbsTarget || 220;

  const fatsG = nutrition.fatsConsumed ?? 0;
  const fatsTarget = nutrition.fatsTarget || 70;

  const handleAddSubmit = useCallback(async () => {
    if (!mealName.trim() || !mealKcal.trim()) {
      Alert.alert('Required', 'Please enter meal title and estimated calories.');
      return;
    }

    const kcalNum = parseInt(mealKcal, 10) || 350;
    const proteinNum = parseInt(mealProtein, 10) || Math.round((kcalNum * 0.2) / 4);

    setIsSaving(true);
    setSuccessMsg(null);

    const success = await addMeal({
      mealType: mealType.toLowerCase() as any,
      name: mealName.trim(),
      description: mealPortion.trim() || mealName.trim(),
      calories: kcalNum,
      proteinGrams: proteinNum,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    });

    setIsSaving(false);

    if (success) {
      setSuccessMsg(`Logged "${mealName.trim()}" (${kcalNum} kcal).`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setMealName('');
      setMealPortion('');
      setMealKcal('');
      setMealProtein('');
      setMealCarbs('');
      setMealFats('');
      setModalVisible(false);
    } else {
      Alert.alert('Save Failed', 'Could not save meal log. Please try again.');
    }
  }, [mealName, mealPortion, mealKcal, mealProtein, mealType, addMeal]);

  const handleDeleteMeal = useCallback((mealId: string, mealTitle: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteMeal(mealId);
            if (!ok) {
              Alert.alert('Error', 'Failed to delete meal from server.');
            }
          },
        },
      ]
    );
  }, [deleteMeal]);

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

        <Pressable
          onPress={() => changeDate(0)}
          hitSlop={10}
          style={styles.headerRightBtn}
          accessibilityLabel="Reset to today"
        >
          <Ionicons name="calendar-outline" size={22} color="#F43F7D" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingNutrition}
            onRefresh={() => loadNutritionData(currentDate.toISOString().split('T')[0])}
            tintColor="#F43F7D"
            colors={['#F43F7D']}
          />
        }
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* DATE NAVIGATOR */}
          <View style={styles.dateNavigatorRow}>
            <Pressable onPress={() => changeDate(-1)} hitSlop={12} accessibilityLabel="Previous day">
              <Ionicons name="chevron-back" size={18} color="#64748B" />
            </Pressable>
            <Text style={styles.dateNavigatorText}>{dateDisplayStr}</Text>
            <Pressable
              onPress={() => changeDate(1)}
              hitSlop={12}
              accessibilityLabel="Next day"
              disabled={isToday}
              style={{ opacity: isToday ? 0.35 : 1 }}
            >
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* SUCCESS BANNER */}
          {successMsg && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          )}

          {/* ERROR BANNER */}
          {nutritionError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.errorBannerText}>{nutritionError}</Text>
              <Pressable
                onPress={() => loadNutritionData(currentDate.toISOString().split('T')[0])}
                style={styles.retryBtn}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* LOADING INDICATOR */}
          {isLoadingNutrition && (!nutrition.meals || nutrition.meals.length === 0) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#F43F7D" />
              <Text style={styles.loadingText}>Syncing nutrition log...</Text>
            </View>
          )}

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionTitle}>
                Meals Logged ({nutrition.meals?.length || 0})
              </Text>
              {isLoadingNutrition && <ActivityIndicator size="small" color="#F43F7D" />}
            </View>
            <Pressable onPress={() => setModalVisible(true)} style={styles.addMealTextBtn}>
              <Ionicons name="add" size={16} color="#F43F7D" />
              <Text style={styles.addMealText}>Add Meal</Text>
            </Pressable>
          </View>

          {/* MEALS LIST OR EMPTY STATE */}
          {(!nutrition.meals || nutrition.meals.length === 0) ? (
            <View style={styles.mealsEmptyCard}>
              <SaladBowlIllustration size={150} />
              <Text style={styles.emptyMealsTitle}>No meals logged {isToday ? 'today' : 'for this day'}</Text>
              <Text style={styles.emptyMealsDesc}>
                Start logging meals to receive more relevant nutrition insights and personalized meal recommendations.
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                style={styles.emptyLogMealBtn}
                accessibilityRole="button"
              >
                <Ionicons name="add-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
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

                  <Pressable
                    onPress={() => handleDeleteMeal(meal.id, meal.name)}
                    style={styles.deleteMealBtn}
                    hitSlop={8}
                    accessibilityLabel="Delete meal"
                  >
                    <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                  </Pressable>
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

            {/* Meal Type Pill Selector */}
            <View style={styles.mealTypePillsRow}>
              {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((t) => {
                const isSelected = mealType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setMealType(t)}
                    style={[styles.mealTypePill, isSelected && styles.mealTypePillActive]}
                  >
                    <Text style={[styles.mealTypePillText, isSelected && styles.mealTypePillTextActive]}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Food name (e.g. Oatmeal with fruits, Lentil soup)"
              placeholderTextColor="#94A3B8"
              value={mealName}
              onChangeText={setMealName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Portion / Quantity (e.g. 1 bowl, 2 roti, 1 cup)"
              placeholderTextColor="#94A3B8"
              value={mealPortion}
              onChangeText={setMealPortion}
            />

            <View style={styles.modalInputsRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Calories (kcal)*"
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

            <Pressable
              onPress={handleAddSubmit}
              disabled={isSaving}
              style={[styles.modalSubmitBtn, isSaving && { opacity: 0.7 }]}
            >
              <Text style={styles.modalSubmitBtnText}>
                {isSaving ? 'Saving to Cloud...' : 'Save Meal'}
              </Text>
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
    marginBottom: 12,
  },
  dateNavigatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  successBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  macrosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugeBox: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiArcRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#F43F7D',
    borderLeftColor: '#0284C7',
    borderBottomColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
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
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  macroListCol: {
    flex: 1,
    paddingLeft: 16,
    gap: 10,
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
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B72',
  },
  macroTarget: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  },
  addMealText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F43F7D',
  },
  mealsEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  emptyMealsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#073B72',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyMealsDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyLogMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F7D',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    marginBottom: 10,
  },
  emptyLogMealBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyViewPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: 16,
  },
  emptyViewPlanBtnText: {
    color: '#F43F7D',
    fontSize: 14,
    fontWeight: '700',
  },
  whyCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  whyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  whyIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  whyBulletsCol: {
    gap: 6,
  },
  whyBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whyBulletText: {
    fontSize: 12,
    color: '#78350F',
    flex: 1,
  },
  mealsList: {
    gap: 10,
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  mealThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  mealInfoCol: {
    flex: 1,
  },
  mealTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  mealTagPill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F43F7D',
  },
  mealTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mealKcalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#073B72',
    marginLeft: 'auto',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 2,
  },
  mealDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  macroChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  macroChipText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteMealBtn: {
    padding: 8,
    marginLeft: 4,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
    borderRadius: 14,
    height: 50,
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
    backgroundColor: '#F43F7D',
    borderRadius: 14,
    height: 50,
  },
  addMealBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#073B72',
  },
  mealTypePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mealTypePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
  },
  mealTypePillActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
  },
  mealTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  mealTypePillTextActive: {
    color: '#F43F7D',
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  modalSubmitBtn: {
    backgroundColor: '#F43F7D',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#F43F7D',
    fontWeight: '500',
  },
});
