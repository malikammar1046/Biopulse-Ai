import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { useAuth } from '../../features/authentication';
import { useFemaleOnboarding } from '../../features/onboarding';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN: GUIDANCE HUB (Primary Navigation Destination 4)
 *
 * Implements:
 * - Evidence-based clinical lifestyle recommendations
 * - Pathway-aware nutrition, fitness, and endocrine guidance
 * - Connected directly to recorded lifestyle profile
 * - Permanent BioPulse bottom navigation
 */
export default function GuidanceHubScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const { lifestyle } = useFemaleOnboarding();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeColor = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FDF0F4' : '#EBF4FC';

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
          {/* Active Lifestyle Status Banner */}
          <View style={[styles.statusCard, { borderLeftColor: themeColor }]}>
            <View style={styles.statusTop}>
              <Text style={styles.statusLabel}>YOUR RECORDED LIFESTYLE METRICS</Text>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            </View>
            <Text style={styles.statusMain}>
              Exercise: {lifestyle.exerciseFrequency === 'none' ? 'Sedentary' : lifestyle.exerciseFrequency} • Sleep: {lifestyle.sleepHours} hrs • Fast Food: {lifestyle.fastFoodIntake}
            </Text>
            <Text style={styles.statusSub}>
              Recommendations adapt dynamically to your reported metabolic habits.
            </Text>
          </View>

          {/* Section 1: Nutrition & Meals */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="restaurant" size={20} color={themeColor} />
              </View>
              <Text style={styles.cardTag}>Nutrition Protocol</Text>
            </View>

            <Text style={styles.cardTitle}>
              {isFemale ? 'Low-Glycemic & Anti-Inflammatory Plan' : 'Hormone Optimization & Zinc Intake'}
            </Text>
            <Text style={styles.cardDesc}>
              {isFemale
                ? 'Emphasize slow-digesting complex carbs, omega-3 fatty acids, and high dietary fiber to smooth insulin spikes that stimulate androgen overproduction.'
                : 'Prioritize lean animal proteins, zinc-rich seeds, adequate healthy fats (avocado, olive oil), and cruciferous vegetables for estrogen clearance.'}
            </Text>
          </View>

          {/* Section 2: Fitness & Movement */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: themeSoftBg }]}>
                <Ionicons name="barbell" size={20} color={themeColor} />
              </View>
              <Text style={styles.cardTag}>Movement Protocol</Text>
            </View>

            <Text style={styles.cardTitle}>
              {isFemale ? 'Progressive Resistance & Moderate Aerobic' : 'Resistance Training & High-Intensity Intervals'}
            </Text>
            <Text style={styles.cardDesc}>
              {isFemale
                ? 'Aim for 3 days of progressive strength training plus daily 20-minute brisk walks. Avoid excessive prolonged exhaustion which elevates cortisol.'
                : 'Compound lifts (squats, deadlifts, presses) 3–4 times weekly stimulate endogenous testosterone production and improve peripheral androgen receptor density.'}
            </Text>
          </View>

          {/* Section 3: AI Clinical Companion */}
          <View style={styles.guideCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="sparkles" size={20} color={themeColor} />
              </View>
              <Text style={styles.cardTag}>BioPulse AI Assistant</Text>
            </View>

            <Text style={styles.cardTitle}>Personalized Consultation Brief</Text>
            <Text style={styles.cardDesc}>
              Synthesize your questions before visiting an endocrinologist or gynecologist. Your screening summary includes fold-aware SHAP explainability insights.
            </Text>
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  statusMain: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0B1E38',
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 12,
    color: '#64748B',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0B1E38',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
  },
});
