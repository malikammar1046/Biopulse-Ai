import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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

export default function MealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';

  const { addMeal } = useHealthStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'south_asian' | 'vegetarian' | 'low_cost'>('south_asian');

  const femalePlans = [
    {
      id: 'fp-1',
      slot: 'Breakfast',
      title: 'Besan Chilla with Mint Coriander Chutney',
      kcal: 340,
      protein: '18g',
      tags: ['south_asian', 'vegetarian', 'low_cost'],
      desc: 'Chickpea flour flatbread rich in soluble fiber and resistant starch. Does not trigger steep morning insulin release.',
    },
    {
      id: 'fp-2',
      slot: 'Lunch',
      title: 'Methi Chicken with Daal Mash & Salad',
      kcal: 520,
      protein: '44g',
      tags: ['south_asian', 'low_cost'],
      desc: 'Fenugreek leaves improve peripheral insulin receptor sensitivity. Paired with slow-digesting white urad lentils.',
    },
    {
      id: 'fp-3',
      slot: 'Snack',
      title: 'Roasted Chana & Spearmint Green Tea',
      kcal: 180,
      protein: '9g',
      tags: ['south_asian', 'vegetarian', 'low_cost'],
      desc: 'Spearmint has clinically demonstrated anti-androgenic properties reducing hirsutism and serum free testosterone.',
    },
    {
      id: 'fp-4',
      slot: 'Dinner',
      title: 'Grilled Fish / Paneer Tikka with Spinach',
      kcal: 480,
      protein: '36g',
      tags: ['south_asian', 'vegetarian'],
      desc: 'High in Omega-3 fatty acids to reduce inflammatory cytokines associated with ovarian theca cell hyperplasia.',
    },
  ];

  const malePlans = [
    {
      id: 'mp-1',
      slot: 'Breakfast',
      title: 'Desi Omelet with Whole Wheat Toast & Spinach',
      kcal: 450,
      protein: '28g',
      tags: ['south_asian', 'low_cost'],
      desc: 'Whole eggs provide dietary cholesterol necessary for testicular Leydig cell steroidogenesis and testosterone production.',
    },
    {
      id: 'mp-2',
      slot: 'Lunch',
      title: 'Grilled Beef / Mutton Seekh Kebab with Brown Rice',
      kcal: 640,
      protein: '52g',
      tags: ['south_asian'],
      desc: 'High concentration of bioavailable zinc and iron, essential cofactors in endogenous androgen synthesis.',
    },
    {
      id: 'mp-3',
      slot: 'Snack',
      title: 'Pumpkin Seeds & Walnut Trail Mix with Green Tea',
      kcal: 240,
      protein: '11g',
      tags: ['south_asian', 'vegetarian', 'low_cost'],
      desc: 'Rich in magnesium and zinc to modulate sex hormone-binding globulin and support free testosterone availability.',
    },
    {
      id: 'mp-4',
      slot: 'Dinner',
      title: 'Palak Gosht / Lentil Mash with Fresh Kachumber',
      kcal: 580,
      protein: '46g',
      tags: ['south_asian', 'low_cost'],
      desc: 'Magnesium-dense spinach and lean meat support nocturnal growth hormone and testosterone release during deep sleep.',
    },
  ];

  const allPlans = isFemale ? femalePlans : malePlans;

  const filteredPlans = useMemo(() => {
    if (activeFilter === 'all') return allPlans;
    return allPlans.filter((p) => p.tags.includes(activeFilter));
  }, [allPlans, activeFilter]);

  const handleLogPlanMeal = useCallback((plan: typeof allPlans[0]) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    addMeal({
      mealType: plan.slot.toLowerCase() as any,
      name: plan.title,
      description: plan.desc,
      calories: plan.kcal,
      proteinGrams: parseInt(plan.protein, 10) || 20,
      time: timeStr,
    });

    Alert.alert(
      'Added to Today’s Meals',
      `"${plan.title}" (${plan.kcal} kcal) was added to your daily nutrition log and macro counters.`,
      [
        {
          text: 'View Log',
          onPress: () => router.push('/(app)/nutrition'),
        },
        { text: 'OK' },
      ]
    );
  }, [addMeal, router]);

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Curated Meal Plans</Text>
          <Text style={styles.headerSub}>
            {isFemale ? 'Low-GI & Anti-Androgenic Recipes' : 'Androgen Synthesis & Zinc Rich'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveFilter('south_asian')}
          style={[styles.filterChip, activeFilter === 'south_asian' && { backgroundColor: themeAccent, borderColor: themeAccent }]}
        >
          <Text style={[styles.filterChipText, activeFilter === 'south_asian' && styles.filterChipTextActive]}>
            South Asian
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('vegetarian')}
          style={[styles.filterChip, activeFilter === 'vegetarian' && { backgroundColor: themeAccent, borderColor: themeAccent }]}
        >
          <Text style={[styles.filterChipText, activeFilter === 'vegetarian' && styles.filterChipTextActive]}>
            Vegetarian
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('low_cost')}
          style={[styles.filterChip, activeFilter === 'low_cost' && { backgroundColor: themeAccent, borderColor: themeAccent }]}
        >
          <Text style={[styles.filterChipText, activeFilter === 'low_cost' && styles.filterChipTextActive]}>
            Affordable
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('all')}
          style={[styles.filterChip, activeFilter === 'all' && { backgroundColor: themeAccent, borderColor: themeAccent }]}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
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
        <View style={styles.plansList}>
          {filteredPlans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={[styles.slotBadge, { backgroundColor: themeSoftBg }]}>
                  <Text style={[styles.slotBadgeText, { color: themeAccent }]}>
                    {plan.slot.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.planKcal}>{plan.kcal} kcal • {plan.protein}</Text>
              </View>

              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleLogPlanMeal(plan)}
                  style={[styles.addBtn, { backgroundColor: themeAccent }]}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Add to Today's Meals</Text>
                </Pressable>
              </View>
            </View>
          ))}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  plansList: {
    gap: 14,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  planKcal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 6,
  },
  planDesc: {
    fontSize: 12,
    color: BioPulseColors.secondaryText,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
