import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useHealthStore } from '../../store/healthStore';

const HERO_FEMALE_ART = require('../../assets/female_pathway_hero.png');

/**
 * SCREEN 19: SCREENING TIER PROGRESS
 *
 * Strict visual match to Screenshot 19:
 * - Top Header: Back chevron (<), centered "Screening Progress"
 * - Subtitle: "Complete the recommended tiers for a more accurate assessment and personalized guidance."
 * - Vertical Mobile Timeline:
 *   - Tier 1: Questionnaire & Symptoms [ Completed ] (checked pink circle, 12 Mar 2025)
 *   - Tier 2: Clinical Hormone Labs [ Recommended ] ("Add Lab Results" CTA button)
 *   - Tier 3: Ultrasound (Optional) [ Optional ]
 * - Doctor Specialist Card:
 *   - Doctor avatar, "Not sure what's next?", "Talk to a specialist for guidance...", [ Find a Specialist ]
 */
export default function TierProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { isFemale } = useHealthStore();

  const themeAccent = isFemale ? '#F43F7D' : '#0284C7';
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

        <Text style={styles.headerTitle}>Screening Progress</Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* SUBTITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.subtitleText}>
              Complete the recommended tiers for a more accurate assessment and personalized guidance.
            </Text>
          </View>

          {/* VERTICAL MOBILE TIMELINE */}
          <View style={styles.timelineContainer}>
            {/* TIER 1 NODE */}
            <View style={styles.timelineRow}>
              {/* Node Indicator Col */}
              <View style={styles.nodeColumn}>
                <View style={[styles.nodeCircle, { backgroundColor: themeAccent }]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <View style={[styles.connectingLine, { backgroundColor: themeAccent }]} />
              </View>

              {/* Node Content Card */}
              <View style={styles.nodeCard}>
                <View style={styles.nodeHeaderRow}>
                  <Text style={styles.tierTitle}>
                    Tier 1{'\n'}Questionnaire & Symptoms
                  </Text>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.tierDescription}>
                  Your responses have been analyzed using our AI model.
                </Text>
                <Text style={styles.tierDateMeta}>12 Mar 2025</Text>
              </View>
            </View>

            {/* TIER 2 NODE */}
            <View style={styles.timelineRow}>
              {/* Node Indicator Col */}
              <View style={styles.nodeColumn}>
                <View style={[styles.nodeCircle, { backgroundColor: themeAccent }]}>
                  <Text style={styles.nodeNumberText}>2</Text>
                </View>
                <View style={[styles.connectingLine, { backgroundColor: '#E2E8F0' }]} />
              </View>

              {/* Node Content Card */}
              <View style={styles.nodeCard}>
                <View style={styles.nodeHeaderRow}>
                  <Text style={styles.tierTitle}>
                    Tier 2{'\n'}Clinical Hormone Labs
                  </Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Recommended</Text>
                  </View>
                </View>
                <Text style={styles.tierDescription}>
                  Higher level results to get a more accurate risk assessment.
                </Text>

                <Pressable
                  onPress={() => router.push('/(app)/add-labs')}
                  style={({ pressed }) => [
                    styles.tierCtaBtn,
                    { backgroundColor: themeAccent },
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add Lab Results"
                >
                  <Text style={styles.tierCtaBtnText}>Add Lab Results</Text>
                </Pressable>
              </View>
            </View>

            {/* TIER 3 NODE */}
            <View style={styles.timelineRow}>
              {/* Node Indicator Col */}
              <View style={styles.nodeColumn}>
                <View style={[styles.nodeCircle, styles.nodeCirclePending]}>
                  <Text style={styles.nodeNumberTextPending}>3</Text>
                </View>
              </View>

              {/* Node Content Card */}
              <View style={styles.nodeCard}>
                <View style={styles.nodeHeaderRow}>
                  <Text style={styles.tierTitle}>
                    Tier 3{'\n'}{isFemale ? 'Ultrasound (Optional)' : 'Guidance & Protocol'}
                  </Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>Optional</Text>
                  </View>
                </View>
                <Text style={styles.tierDescription}>
                  {isFemale
                    ? 'Upload ultrasound reports for additional insights.'
                    : 'Endocrine axis restoration protocols and clinical guidelines.'}
                </Text>
              </View>
            </View>
          </View>

          {/* DOCTOR SPECIALIST CARD */}
          <View style={styles.specialistCard}>
            <View style={styles.doctorAvatarBox}>
              <Image source={HERO_FEMALE_ART} style={styles.doctorImage} resizeMode="cover" />
            </View>

            <View style={styles.specialistContentCol}>
              <Text style={styles.specialistTitle}>Not sure what's next?</Text>
              <Text style={styles.specialistSub}>
                Talk to a specialist for guidance on your results and next steps.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/specialists')}
                style={({ pressed }) => [
                  styles.specialistBtn,
                  pressed && styles.btnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Find a Specialist"
              >
                <Text style={styles.specialistBtnText}>Find a Specialist</Text>
              </Pressable>
            </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
    marginBottom: 20,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  timelineContainer: {
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 120,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: 12,
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCirclePending: {
    backgroundColor: '#E2E8F0',
  },
  nodeNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nodeNumberTextPending: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  connectingLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  nodeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
    lineHeight: 20,
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  recommendedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  optionalBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tierDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  tierDateMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  tierCtaBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tierCtaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  specialistCard: {
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
    gap: 14,
  },
  doctorAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#FCE7F3',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  specialistContentCol: {
    flex: 1,
  },
  specialistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 2,
  },
  specialistSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  specialistBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  specialistBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
