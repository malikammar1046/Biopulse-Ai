import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export default function NutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;

  const { nutrition, addMeal, removeMeal } = useHealthStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');

  const proteinPercent = Math.min(100, Math.round((nutrition.proteinConsumed / Math.max(1, nutrition.proteinTarget)) * 100));
  const carbsPercent = Math.min(100, Math.round((nutrition.carbsConsumed / Math.max(1, nutrition.carbsTarget)) * 100));
  const fatPercent = Math.min(100, Math.round((nutrition.fatsConsumed / Math.max(1, nutrition.fatsTarget)) * 100));

  const handleAddNewMeal = useCallback(() => {
    if (!mealName.trim() || !mealKcal.trim()) {
      Alert.alert('Required Fields', 'Please enter a meal description and calories.');
      return;
    }

    const kcalNum = parseInt(mealKcal, 10) || 250;
    const proteinNum = parseInt(mealProtein, 10) || 15;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    addMeal({
      mealType: mealType.toLowerCase() as any,
      name: mealName.trim(),
      description: mealName.trim(),
      calories: kcalNum,
      proteinGrams: proteinNum,
      time: timeStr,
    });

    setMealName('');
    setMealKcal('');
    setMealProtein('');
    setShowAddForm(false);
  }, [mealName, mealKcal, mealProtein, mealType, addMeal]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Nutrition & Macros</Text>
          <Text style={styles.headerSub}>
            {isFemale ? 'Low-GI Endocrine Meal Balance' : 'Steroidogenic Macro Fuel'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/(app)/meal-plan')} style={styles.planBtn}>
          <Ionicons name="book-outline" size={16} color={themeAccent} />
          <Text style={[styles.planBtnText, { color: themeAccent }]}>Plans</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Caloric Gauge Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieRow}>
            <View>
              <Text style={styles.calorieBigText}>{nutrition.caloriesConsumed.toLocaleString()}</Text>
              <Text style={styles.calorieSubText}>of {nutrition.calorieTarget.toLocaleString()} kcal target</Text>
            </View>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingPillText}>
                {Math.max(0, nutrition.calorieTarget - nutrition.caloriesConsumed)} kcal left
              </Text>
            </View>
          </View>

          {/* Macro Breakdown Rows */}
          <View style={styles.macrosWrap}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{nutrition.proteinConsumed} / {nutrition.proteinTarget}g</Text>
              <View style={styles.macroBarTrack}>
                <View style={[styles.macroBarFill, { width: `${proteinPercent}%`, backgroundColor: '#0E9EAA' }]} />
              </View>
            </View>

            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{nutrition.carbsConsumed} / {nutrition.carbsTarget}g</Text>
              <View style={styles.macroBarTrack}>
                <View style={[styles.macroBarFill, { width: `${carbsPercent}%`, backgroundColor: '#F59E0B' }]} />
              </View>
            </View>

            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{nutrition.fatsConsumed} / {nutrition.fatsTarget}g</Text>
              <View style={styles.macroBarTrack}>
                <View style={[styles.macroBarFill, { width: `${fatPercent}%`, backgroundColor: '#8B5CF6' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Add Meal Section */}
        {showAddForm ? (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Log a Custom Meal</Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <View style={styles.mealTypeRow}>
              {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setMealType(t)}
                  style={[styles.typePill, mealType === t && { backgroundColor: themeAccent }]}
                >
                  <Text style={[styles.typePillText, mealType === t && { color: '#FFFFFF' }]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={mealName}
              onChangeText={setMealName}
              placeholder="Meal description (e.g. Lentil daal & whole roti)"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />

            <View style={styles.inputsRow}>
              <TextInput
                value={mealKcal}
                onChangeText={setMealKcal}
                placeholder="Calories (kcal)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.textInput, { flex: 1 }]}
              />
              <TextInput
                value={mealProtein}
                onChangeText={setMealProtein}
                placeholder="Protein (g)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.textInput, { flex: 1 }]}
              />
            </View>

            <Pressable
              onPress={handleAddNewMeal}
              style={[styles.submitMealBtn, { backgroundColor: themeAccent }]}
            >
              <Text style={styles.submitMealText}>Save Meal Entry</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowAddForm(true)}
            style={styles.openAddBtn}
          >
            <Ionicons name="add-circle" size={20} color={themeAccent} />
            <Text style={[styles.openAddText, { color: themeAccent }]}>+ Log Meal or Snack</Text>
          </Pressable>
        )}

        {/* Logged Meals List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Today's Logged Meals ({nutrition.meals.length})</Text>

          <View style={styles.mealsList}>
            {nutrition.meals.map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                <View style={styles.mealLeft}>
                  <View style={styles.mealTypeTag}>
                    <Text style={styles.mealTypeTagText}>{meal.mealType.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMeta}>
                    {meal.proteinGrams}g protein • Logged {meal.time}
                  </Text>
                </View>

                <View style={styles.mealRight}>
                  <Text style={styles.mealKcal}>{meal.calories} kcal</Text>
                  <Pressable
                    onPress={() => removeMeal(meal.id)}
                    style={styles.deleteMealBtn}
                    accessibilityLabel="Delete meal"
                  >
                    <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pathway Specific Dietary Guidance Callout */}
        <View style={styles.guidanceCard}>
          <Ionicons name="bulb-outline" size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.guidanceTitle}>
              {isFemale ? 'PCOS Insulin Resistance Strategy' : 'Steroidogenesis Nutrition Note'}
            </Text>
            <Text style={styles.guidanceSub}>
              {isFemale
                ? 'Pair high-fiber complex carbohydrates with lean protein to reduce insulin spikes by up to 35%.'
                : 'Adequate zinc (shellfish, pumpkin seeds) and healthy dietary fats are essential cofactors in testosterone production.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Nav */}
      <BioPulseBottomNav activeTab="track" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  headerSub: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    marginTop: 1,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  calorieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieBigText: {
    fontSize: 32,
    fontWeight: '800',
    color: BioPulseColors.navy,
  },
  calorieSubText: {
    fontSize: 13,
    color: BioPulseColors.secondaryText,
  },
  remainingPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  remainingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  macrosWrap: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 6,
  },
  macroBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: 6,
    borderRadius: 3,
  },
  openAddBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  openAddText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: BioPulseColors.navy,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitMealBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitMealText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 12,
  },
  mealsList: {
    gap: 12,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  mealLeft: {
    flex: 1,
    paddingRight: 10,
  },
  mealTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  mealTypeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 2,
  },
  mealMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mealRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  mealKcal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  deleteMealBtn: {
    padding: 4,
  },
  guidanceCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  guidanceSub: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
});
