import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { useAuth } from '../../features/authentication';
import { useFemaleOnboarding } from '../../features/onboarding';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 34 & 35: GUIDANCE HUB & RECOMMENDATIONS
 *
 * Implements:
 * - Next Best Action featured card at top
 * - Categories: Nutrition, Movement, Lifestyle, Follow-up
 * - Structured recommendation cards with What, Why, How, and Action
 * - Quick jump cards for Meal Plan, Movement, and AI Companion
 * - Pathway-aware evidence-based protocols (Rotterdam PCOS vs Endocrine Society Hypogonadism)
 * - Permanent BioPulse bottom navigation
 */
export default function GuidanceHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const { lifestyle } = useFemaleOnboarding();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeColor = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  const [selectedCategory, setSelectedCategory] = React.useState<
    'All' | 'Nutrition' | 'Movement' | 'Lifestyle' | 'Follow-up'
  >('All');

  const recommendations = React.useMemo(() => {
    if (isFemale) {
      return [
        {
          id: 'rec-f1',
          category: 'Nutrition',
          tag: 'METABOLIC & INSULIN',
          what: 'Switch to Low-Glycemic Complex Carbohydrates',
          why: 'Reduces postprandial insulin surges that directly stimulate ovarian theca cells to overproduce androgens.',
          how: 'Pair carbohydrates with healthy fats and protein (e.g., lentils with olive oil, brown rice with chickpeas).',
          actionLabel: 'View Meal Plan',
          actionRoute: '/(app)/meal-plan',
        },
        {
          id: 'rec-f2',
          category: 'Movement',
          tag: 'INSULIN SENSITIVITY',
          what: 'Progressive Resistance Training (3x/week)',
          why: 'Increases GLUT-4 transporter translocation in skeletal muscle, improving glucose clearance without exhaustive cardio stress.',
          how: '25-35 minutes of moderate weights or bodyweight squats, lunges, and rows with 48h rest between sessions.',
          actionLabel: 'View Movement Plan',
          actionRoute: '/(app)/movement',
        },
        {
          id: 'rec-f3',
          category: 'Lifestyle',
          tag: 'CIRCADIAN & STRESS',
          what: 'Optimize Sleep Consistency & Cortisol Management',
          why: 'Elevated nocturnal cortisol worsens insulin resistance and alters LH/FSH pulse frequency.',
          how: 'Aim for 7-8 hours sleep, avoid screens 45 minutes prior to bedtime, and practice 5-minute deep diaphragmatic breathing.',
          actionLabel: 'Log Daily Health',
          actionRoute: '/(app)/symptom-log',
        },
        {
          id: 'rec-f4',
          category: 'Follow-up',
          tag: 'CLINICAL CONTINUITY',
          what: 'Schedule Tier 2 Hormonal Lab Workup',
          why: 'Confirmatory fasting insulin, lipid profile, and free testosterone provide phenotypic precision for your care team.',
          how: 'Upload existing lab reports via OCR or schedule an appointment with a reproductive endocrinologist.',
          actionLabel: 'Find a Specialist',
          actionRoute: '/(app)/specialists',
        },
      ];
    } else {
      return [
        {
          id: 'rec-m1',
          category: 'Nutrition',
          tag: 'ENDOCRINE NUTRITION',
          what: 'Increase Dietary Zinc & Magnesium Density',
          why: 'Essential cofactors for the steroidogenic enzyme cascade responsible for Leydig cell testosterone synthesis.',
          how: 'Incorporate pumpkin seeds, lean cuts, oysters, lentils, and dark leafy greens into lunch and dinner.',
          actionLabel: 'View Meal Plan',
          actionRoute: '/(app)/meal-plan',
        },
        {
          id: 'rec-m2',
          category: 'Movement',
          tag: 'ANDROGEN STIMULUS',
          what: 'Compound Heavy Resistance Sessions (3x/week)',
          why: 'Multi-joint compound movements (deadlifts, squats, bench press) induce acute and long-term androgenic signaling.',
          how: '3 sets of 6-8 reps at 75-80% intensity, allowing 2-3 minutes of recovery between sets.',
          actionLabel: 'View Movement Plan',
          actionRoute: '/(app)/movement',
        },
        {
          id: 'rec-m3',
          category: 'Lifestyle',
          tag: 'TESTOSTERONE RESTORATION',
          what: 'Maintain Uninterrupted Stage-3 Slow-Wave Sleep',
          why: 'The majority of diurnal testosterone secretion occurs during slow-wave and REM sleep cycles.',
          how: 'Keep room cool (18-20°C), avoid alcohol within 3 hours of sleep, and maintain consistent wake times.',
          actionLabel: 'Log Symptoms',
          actionRoute: '/(app)/symptom-log',
        },
        {
          id: 'rec-m4',
          category: 'Follow-up',
          tag: 'CLINICAL CONTINUITY',
          what: 'Repeat Morning Fasting Total & Free Testosterone',
          why: 'Confirms baseline androgen levels following ADAM symptom screening before considering therapeutic options.',
          how: 'Blood draw must occur between 08:00 AM and 10:00 AM in a fasted state.',
          actionLabel: 'Find an Andrologist',
          actionRoute: '/(app)/specialists',
        },
      ];
    }
  }, [isFemale]);

  const filteredRecs = recommendations.filter((r) => {
    if (selectedCategory === 'All') return true;
    return r.category === selectedCategory;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Clinical Guidance</Text>
          <Text style={styles.headerSubtitle}>
            {isFemale ? 'PCOS Lifestyle & Metabolic Protocols' : 'Endocrine & Vitality Protocols'}
          </Text>
        </View>

        <View style={[styles.pathwayBadge, { backgroundColor: themeSoftBg }]}>
          <Text style={[styles.pathwayBadgeText, { color: themeColor }]}>
            {isFemale ? 'Rotterdam Guidelines' : 'Endocrine Society'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Highlighted Next Best Action Card */}
          <View style={[styles.nbaCard, { borderColor: themeColor + '50' }]}>
            <View style={styles.nbaTopRow}>
              <View style={[styles.nbaBadge, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="sparkles" size={14} color={themeColor} />
                <Text style={[styles.nbaBadgeText, { color: themeColor }]}>NEXT BEST ACTION</Text>
              </View>
              <Text style={styles.nbaPriority}>Priority 1</Text>
            </View>

            <Text style={styles.nbaTitle}>
              {isFemale
                ? 'Integrate Low-GI Breakfast to Balance Morning Cortisol & LH'
                : 'Prioritize Compound Strength Training & Sleep Recovery'}
            </Text>
            <Text style={styles.nbaDesc}>
              {isFemale
                ? 'Based on your reported cycle and symptom markers, stable morning glucose is the single highest leverage habit to improve ovarian insulin sensitivity.'
                : 'Targeted resistance stimulus paired with 7+ hours of uninterrupted sleep directly supports testicular testosterone synthesis and metabolic vigor.'}
            </Text>

            <View style={styles.nbaActionRow}>
              <Pressable
                onPress={() => router.push(isFemale ? '/(app)/meal-plan' : '/(app)/movement')}
                style={[styles.nbaPrimaryBtn, { backgroundColor: themeColor }]}
              >
                <Text style={styles.nbaBtnText}>
                  {isFemale ? 'Explore PCOS Meal Plan' : 'Explore Strength Protocol'}
                </Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Quick AI Companion Launcher */}
          <Pressable
            onPress={() => router.push('/(app)/ai-companion')}
            style={styles.aiBannerCard}
          >
            <View style={[styles.aiIconWrap, { backgroundColor: themeSoftBg }]}>
              <Ionicons name="chatbubbles" size={22} color={themeColor} />
            </View>
            <View style={styles.aiTextCol}>
              <Text style={styles.aiTitle}>BioPulse AI Companion</Text>
              <Text style={styles.aiSub}>Ask questions about your risk factors or meal plans</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsRow}
          >
            {(['All', 'Nutrition', 'Movement', 'Lifestyle', 'Follow-up'] as const).map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.catChip,
                    isSel && {
                      backgroundColor: themeSoftBg,
                      borderColor: themeColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      isSel && { color: themeColor, fontWeight: '700' },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Structured Recommendations Cards */}
          <View style={styles.recsSection}>
            <Text style={styles.sectionHeader}>
              Evidence-Based Recommendations ({filteredRecs.length})
            </Text>

            {filteredRecs.map((rec) => (
              <View key={rec.id} style={styles.recCard}>
                <View style={styles.recHeaderRow}>
                  <View style={[styles.recCatBadge, { backgroundColor: themeSoftBg }]}>
                    <Text style={[styles.recCatText, { color: themeColor }]}>{rec.tag}</Text>
                  </View>
                  <Text style={styles.recCategory}>{rec.category}</Text>
                </View>

                {/* What */}
                <Text style={styles.recWhatTitle}>{rec.what}</Text>

                {/* Why */}
                <View style={styles.recBlock}>
                  <Text style={styles.recBlockLabel}>WHY IT MATTERS</Text>
                  <Text style={styles.recBlockText}>{rec.why}</Text>
                </View>

                {/* How */}
                <View style={styles.recBlock}>
                  <Text style={styles.recBlockLabel}>HOW TO IMPLEMENT</Text>
                  <Text style={styles.recBlockText}>{rec.how}</Text>
                </View>

                {/* Action CTA */}
                <View style={styles.recFooter}>
                  <Pressable
                    onPress={() => router.push(rec.actionRoute as any)}
                    style={[styles.recActionBtn, { borderColor: themeColor }]}
                  >
                    <Text style={[styles.recActionText, { color: themeColor }]}>
                      {rec.actionLabel}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={themeColor} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Permanent BioPulse Bottom Navigation */}
      <BioPulseBottomNav activeTab="guidance" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFCFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1E38',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  pathwayBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pathwayBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: 14,
  },
  tabletContainer: {
    maxWidth: 580,
  },
  nbaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  nbaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nbaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nbaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nbaPriority: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  nbaTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginBottom: 6,
  },
  nbaDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  nbaActionRow: {
    flexDirection: 'row',
  },
  nbaPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  nbaBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  aiBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextCol: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  aiSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  categoryChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  recsSection: {
    gap: 12,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginLeft: 4,
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recCatText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recCategory: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  recWhatTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  recBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  recBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  recBlockText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  recActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
