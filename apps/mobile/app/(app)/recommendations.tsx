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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';

const NUTRITION_BOWL = require('../../assets/nutrition_healthy_bowl.jpg');

interface RecommendationItem {
  id: string;
  category: 'Nutrition' | 'Movement' | 'Lifestyle' | 'Follow-up';
  title: string;
  tagColor: string;
  tagBg: string;
  what: string;
  why: string;
  how: string;
  actionText: string;
  actionVariant: 'solid' | 'outline';
  actionRoute?: string;
  image?: any;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
}

/**
 * SCREEN 35: RECOMMENDATIONS
 *
 * Strict visual match to Screenshot 35:
 * - Header: Back chevron (<), centered "Recommendations", subtitle
 * - Category filter pills: [ Nutrition ] (active solid pink), [ Movement ], [ Lifestyle ], [ Follow-up ]
 * - 3 Structured cards:
 *   1. Eat Low-GI Breakfast (Nutrition tag, food image, What/Why/How, solid pink "View Meal Ideas")
 *   2. Walk for 30 Minutes Daily (Movement tag, walk graphic, What/Why/How, outlined pink "Set Reminder")
 *   3. Improve Sleep Quality (Lifestyle tag, sleep graphic, What/Why/How, outlined pink "See Sleep Tips")
 */
export default function RecommendationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const params = useLocalSearchParams<{ category?: string }>();
  const initialCat = (params.category as any) || 'Nutrition';

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const [activeCategory, setActiveCategory] = useState<'Nutrition' | 'Movement' | 'Lifestyle' | 'Follow-up'>(
    initialCat
  );

  const allRecommendations: RecommendationItem[] = useMemo(() => [
    // 1. NUTRITION
    {
      id: 'rec-nut-1',
      category: 'Nutrition',
      title: isFemale ? 'Eat Low-GI Breakfast' : 'Zinc & Protein-Rich Breakfast',
      tagColor: '#10B981',
      tagBg: '#ECFDF5',
      what: isFemale
        ? 'Choose complex carbohydrates like oats, eggs, berries, and chia seeds.'
        : 'Choose whole eggs, pumpkin seeds, Greek yogurt, or lean poultry.',
      why: isFemale
        ? 'Helps stabilize postprandial glucose and dampens insulin-driven ovarian androgen synthesis.'
        : 'Supplies essential zinc, magnesium, and amino acids for Leydig cell steroidogenesis.',
      how: 'Include at least 20g protein and 8g fiber in your morning meal.',
      actionText: 'View Meal Ideas',
      actionVariant: 'solid',
      actionRoute: '/(app)/meal-plan',
      image: NUTRITION_BOWL,
    },
    {
      id: 'rec-nut-2',
      category: 'Nutrition',
      title: isFemale ? 'Anti-Inflammatory Dietary Pattern' : 'Healthy Fats & Precursor Lipids',
      tagColor: '#10B981',
      tagBg: '#ECFDF5',
      what: isFemale
        ? 'Incorporate wild-caught fish, flaxseeds, leafy greens, and colorful berries.'
        : 'Include avocados, extra virgin olive oil, walnuts, and omega-3 rich fish.',
      why: isFemale
        ? 'Lowers chronic low-grade systemic inflammation linked to follicular arrest in PCOS.'
        : 'Provides cholesterol substrates and essential fatty acids for endocrine hormone synthesis.',
      how: 'Add 2 servings of anti-inflammatory whole foods to lunch and dinner.',
      actionText: 'Explore Recipes',
      actionVariant: 'outline',
      actionRoute: '/(app)/meal-plan',
      iconName: 'nutrition-outline',
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
    },

    // 2. MOVEMENT
    {
      id: 'rec-mov-1',
      category: 'Movement',
      title: 'Walk for 30 Minutes Daily',
      tagColor: '#8B5CF6',
      tagBg: '#F5F3FF',
      what: 'Brisk walking or low-impact steady-state cardiovascular movement.',
      why: 'Stimulates GLUT4 glucose transporters without elevating adrenal cortisol.',
      how: 'Aim for a 30-minute walk 5 days per week, ideally after your largest meal.',
      actionText: 'Set Reminder',
      actionVariant: 'outline',
      actionRoute: '/(app)/movement',
      iconName: 'walk',
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
    },
    {
      id: 'rec-mov-2',
      category: 'Movement',
      title: isFemale ? 'Resistance Training for Insulin Health' : 'Compound Strength Training',
      tagColor: '#8B5CF6',
      tagBg: '#F5F3FF',
      what: isFemale
        ? 'Bodyweight or dumbbell exercises targeting large muscle groups.'
        : 'Compound movements such as squats, deadlifts, and overhead presses.',
      why: isFemale
        ? 'Increases peripheral insulin sensitivity and metabolic resting rate.'
        : 'Upregulates acute and chronic androgen receptor expression in skeletal muscle.',
      how: 'Complete 2 to 3 sessions per week with progressive overload.',
      actionText: 'View Movement Plan',
      actionVariant: 'solid',
      actionRoute: '/(app)/movement',
      iconName: 'barbell-outline',
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
    },

    // 3. LIFESTYLE
    {
      id: 'rec-life-1',
      category: 'Lifestyle',
      title: 'Improve Sleep Quality & Circadian Rhythm',
      tagColor: '#3B82F6',
      tagBg: '#EFF6FF',
      what: 'Aim for 7 to 8 hours of uninterrupted nocturnal sleep in a cool, dark room.',
      why: isFemale
        ? 'Restores nocturnal melatonin production and normalizes LH/FSH pulsatile frequency.'
        : 'Peak daily testosterone synthesis occurs predominantly during deep sleep and REM cycles.',
      how: 'Keep a consistent bedtime, dim blue lights 1 hour before sleep, and wake with sunlight.',
      actionText: 'See Sleep Tips',
      actionVariant: 'outline',
      iconName: 'bed',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      id: 'rec-life-2',
      category: 'Lifestyle',
      title: 'Active Stress & Cortisol Modulation',
      tagColor: '#3B82F6',
      tagBg: '#EFF6FF',
      what: 'Mindfulness, physiological sighs, or nature walks to reduce sympathetic tone.',
      why: 'Chronically elevated cortisol competes with progesterone and suppresses testosterone production.',
      how: 'Practice 5 to 10 minutes of box breathing or slow parasympathetic respiration daily.',
      actionText: 'Save Practice',
      actionVariant: 'outline',
      iconName: 'heart-outline',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },

    // 4. FOLLOW-UP
    {
      id: 'rec-fol-1',
      category: 'Follow-up',
      title: 'Clinical Biomarker Profile',
      tagColor: '#D97706',
      tagBg: '#FEF3C7',
      what: isFemale ? 'Fasting insulin, LH/FSH ratio, total/free testosterone.' : 'Morning total testosterone, free testosterone, and SHBG.',
      why: 'Refines baseline algorithmic screening into precise clinical laboratory management.',
      how: 'Upload your lab report via OCR or enter verified numbers under Track.',
      actionText: 'Add Clinical Labs',
      actionVariant: 'solid',
      actionRoute: '/(app)/add-labs',
      iconName: 'flask',
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
    },
    {
      id: 'rec-fol-2',
      category: 'Follow-up',
      title: isFemale ? 'Gynecologist / Endocrinologist Consultation' : 'Andrologist / Urologist Consultation',
      tagColor: '#D97706',
      tagBg: '#FEF3C7',
      what: 'Formal diagnostic consultation and clinical physical examination.',
      why: 'Screening tools provide statistical probability; only licensed clinicians provide authoritative diagnosis.',
      how: 'Schedule an in-person or telemedicine evaluation through our verified directory.',
      actionText: 'Find Specialists',
      actionVariant: 'outline',
      actionRoute: '/(app)/specialists',
      iconName: 'medkit-outline',
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
    },
  ], [isFemale]);

  // Strict category filtering: each category shows only its own verified items
  const displayedRecs = useMemo(() => {
    return allRecommendations.filter((r) => r.category === activeCategory);
  }, [allRecommendations, activeCategory]);

  const handleAction = (item: RecommendationItem) => {
    if (item.actionRoute) {
      router.push(item.actionRoute as any);
    } else {
      Alert.alert(
        item.actionText,
        `Consistently applying this protocol will optimize your metabolic health. Reminder saved!`
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Recommendations</Text>
          <Text style={styles.headerSub}>
            Personalized recommendations based on your screening results and health profile.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Pills */}
        <View style={styles.categoryRow}>
          {(['Nutrition', 'Movement', 'Lifestyle', 'Follow-up'] as const).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.catPill, isActive && styles.catPillActive]}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Recommendation Cards */}
        <View style={styles.cardsList}>
          {displayedRecs.map((item) => (
            <View key={item.id} style={styles.recCard}>
              <View style={styles.recTopRow}>
                {item.image ? (
                  <Image source={item.image} style={styles.thumbImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbPlaceholder, { backgroundColor: item.iconBg || item.tagBg }]}>
                    <Ionicons
                      name={item.iconName || 'sparkles'}
                      size={24}
                      color={item.iconColor || item.tagColor}
                    />
                  </View>
                )}

                <View style={styles.titleArea}>
                  <Text style={styles.recTitle}>{item.title}</Text>
                  <View style={[styles.tagBadge, { backgroundColor: item.tagBg }]}>
                    <Text style={[styles.tagText, { color: item.tagColor }]}>{item.category}</Text>
                  </View>
                </View>
              </View>

              {/* What / Why / How breakdown */}
              <View style={styles.breakdownList}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>What</Text>
                  <Text style={styles.breakdownVal}>{item.what}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Why</Text>
                  <Text style={styles.breakdownVal}>{item.why}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>How</Text>
                  <Text style={styles.breakdownVal}>{item.how}</Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                onPress={() => handleAction(item)}
                style={({ pressed }) => [
                  item.actionVariant === 'solid' ? styles.solidBtn : styles.outlineBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text
                  style={
                    item.actionVariant === 'solid' ? styles.solidBtnText : styles.outlineBtnText
                  }
                >
                  {item.actionText}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitleWrap: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Category Pills
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Cards List
  cardsList: {
    gap: 14,
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  thumbImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 12,
  },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    paddingRight: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Breakdown List
  breakdownList: {
    gap: 6,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  breakdownLabel: {
    width: 44,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownVal: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },

  // Action Buttons
  solidBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },

  btnPressed: {
    opacity: 0.85,
  },
});
