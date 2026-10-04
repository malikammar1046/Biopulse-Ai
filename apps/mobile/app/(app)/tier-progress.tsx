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
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useHealthStore } from '../../store/healthStore';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');
const HERO_FEMALE_ART = require('../../assets/female_pathway_hero.png');
const HERO_MALE_ART = require('../../assets/male_pathway_hero.png');

/**
 * SCREEN 20: SCREENING TIER PROGRESS SCREEN
 * Adheres strictly to visual references:
 * - Female: ChatGPT Image Oct 2, 2026, 12_24_26 AM-3.png
 * - Male: ChatGPT Image Oct 2, 2026, 12_24_45 AM-4.png
 *
 * Implements:
 * - Brand Header with Notification bell and Avatar
 * - "Screening Tier Progress" headline & subtitle
 * - Vertical Timeline:
 *     - Tier 1: Questionnaire & Symptoms (Complete ✓)
 *     - Tier 2: Clinical Labs (Available Optional) with "Continue to Labs ->" CTA
 *     - Tier 3: Final Guidance (Locked until labs/profile confirmed)
 * - "Why add next-tier input?" informational benefit card
 * - Permanent Bottom Navigation
 */
export default function TierProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { isFemale } = useHealthStore();

  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';
  const themeCardBorder = isFemale ? '#FFF0F5' : '#EEF6FD';

  return (
    <View style={[styles.root, { backgroundColor: isFemale ? '#FFF7F9' : '#F4F9FD' }]}>
      <AuthBackgroundFoliage />

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#073B72" />
          </Pressable>
          <Image source={HEART_EMBLEM} style={styles.emblem} resizeMode="contain" />
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleNavy}>BioPulse</Text>
              <Text style={[styles.brandTitleAccent, { color: themeAccent }]}> AI</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              {isFemale ? "HORMONES HEALTHIER YOU" : "PERSONALIZED CARE. BRIGHTER TOMORROWS."}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={21} color="#073B72" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/profile')}
            style={[styles.avatarBtn, { borderColor: themeAccent }]}
          >
            <Image
              source={isFemale ? HERO_FEMALE_ART : HERO_MALE_ART}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </Pressable>
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
          {/* Banner */}
          <View style={[styles.heroBanner, { backgroundColor: themeSoftBg, borderColor: themeCardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerPathwayText, { color: themeAccent }]}>
                {isFemale ? 'PCOS PATHWAY' : 'HYPOGONADISM PATHWAY'}
              </Text>
              <Text style={styles.bannerTitle}>Screening Tier Progress</Text>
              <Text style={styles.bannerSubtitle}>
                {isFemale
                  ? 'Your step-by-step journey to deeper insights and more personalised guidance.'
                  : 'Your journey to clarity in the male hypogonadism pathway.'}
              </Text>
            </View>
            <Image
              source={isFemale ? HERO_FEMALE_ART : HERO_MALE_ART}
              style={styles.bannerIllustration}
              resizeMode="contain"
            />
          </View>

          {/* Vertical Timeline */}
          <View style={styles.timelineWrapper}>
            {/* Timeline Line */}
            <View style={[styles.timelineVerticalLine, { backgroundColor: themeAccent }]} />

            {/* TIER 1 ITEM */}
            <View style={styles.timelineRow}>
              <View style={[styles.timelineNode, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>

              <View style={[styles.tierCard, { borderColor: themeCardBorder }]}>
                <View style={styles.tierCardTop}>
                  <View style={styles.tierBadgeRow}>
                    <Text style={styles.tierName}>TIER 1</Text>
                    <View style={styles.completeBadge}>
                      <Ionicons name="checkmark" size={11} color="#10B981" />
                      <Text style={styles.completeBadgeText}>Complete</Text>
                    </View>
                  </View>

                  <View style={[styles.tierCardIcon, { backgroundColor: '#E6F8F0' }]}>
                    <Ionicons name="document-text" size={18} color="#10B981" />
                  </View>
                </View>

                <Text style={styles.tierTitle}>
                  {isFemale ? 'Questionnaire & Symptoms' : 'Symptoms & Health Profile'}
                </Text>
                <Text style={styles.tierDesc}>
                  {isFemale
                    ? "You've completed your health questionnaire and symptom assessment."
                    : "You've completed your symptom assessment and health profile."}
                </Text>
              </View>
            </View>

            {/* TIER 2 ITEM */}
            <View style={styles.timelineRow}>
              <View style={[styles.timelineNode, { backgroundColor: themeAccent, borderWidth: 3, borderColor: '#FFFFFF' }]}>
                <View style={styles.innerDot} />
              </View>

              <View style={[styles.tierCard, styles.tierCardActive, { borderColor: themeAccent }]}>
                <View style={styles.tierCardTop}>
                  <View style={styles.tierBadgeRow}>
                    <Text style={styles.tierName}>TIER 2</Text>
                    <View style={[styles.availableBadge, { backgroundColor: themeSoftBg }]}>
                      <Ionicons name="bar-chart-outline" size={11} color={themeAccent} />
                      <Text style={[styles.availableBadgeText, { color: themeAccent }]}>
                        Available (Optional)
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.tierCardIcon, { backgroundColor: themeSoftBg }]}>
                    <Ionicons
                      name={isFemale ? 'water' : 'flask'}
                      size={18}
                      color={themeAccent}
                    />
                  </View>
                </View>

                <Text style={styles.tierTitle}>
                  {isFemale ? 'Clinical Labs (Optional)' : 'Hormonal Labs'}
                </Text>
                <Text style={styles.tierDesc}>
                  {isFemale
                    ? 'Add relevant blood test results to get a clearer picture of your hormonal and metabolic health.'
                    : 'Add your lab results (e.g., total testosterone, free testosterone, LH, FSH) to improve accuracy.'}
                </Text>

                <Pressable
                  onPress={() => router.push('/(app)/add-labs')}
                  style={[styles.tierCTA, { backgroundColor: themeAccent }]}
                >
                  <Text style={styles.tierCTAText}>Continue to Labs</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* TIER 3 ITEM */}
            <View style={styles.timelineRow}>
              <View style={[styles.timelineNode, { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="lock-closed" size={12} color="#94A3B8" />
              </View>

              <View style={[styles.tierCard, { borderColor: themeCardBorder, opacity: 0.85 }]}>
                <View style={styles.tierCardTop}>
                  <View style={styles.tierBadgeRow}>
                    <Text style={styles.tierName}>TIER 3</Text>
                    <View style={[styles.lockedBadge, { backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="lock-closed" size={11} color="#64748B" />
                      <Text style={styles.lockedBadgeText}>Guidance</Text>
                    </View>
                  </View>

                  <View style={[styles.tierCardIcon, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="bulb-outline" size={18} color="#94A3B8" />
                  </View>
                </View>

                <Text style={styles.tierTitle}>
                  {isFemale ? 'Final Guidance' : 'Personalized Guidance'}
                </Text>
                <Text style={styles.tierDesc}>
                  After we have more laboratory information, we'll generate your personalised insights, risk assessment, and clinical next steps.
                </Text>
              </View>
            </View>
          </View>

          {/* Why Add Next Tier Input Card */}
          <View style={[styles.whyCard, { backgroundColor: '#FFFFFF', borderColor: themeCardBorder }]}>
            <View style={[styles.whyIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="disc-outline" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whyTitle}>Why add next-tier input?</Text>
              <Text style={styles.whyText}>
                {isFemale
                  ? 'Clinical lab results can confirm hormonal imbalances, reveal underlying causes, and help us provide more accurate, personalised guidance for your PCOS journey.'
                  : 'Lab results can confirm low testosterone, help identify the underlying cause, and improve the accuracy of your personalized guidance.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Navigation */}
      <BioPulseBottomNav activeTab="screening" />
    </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblem: {
    width: 32,
    height: 32,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleNavy: {
    fontSize: 17,
    fontWeight: '800',
    color: '#073B72',
  },
  brandTitleAccent: {
    fontSize: 17,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#55718F',
    letterSpacing: 0.7,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: 16,
  },
  tabletContainer: {
    maxWidth: 600,
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  bannerPathwayText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#073B72',
    marginTop: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#55718F',
    marginTop: 4,
    lineHeight: 16,
  },
  bannerIllustration: {
    width: 68,
    height: 68,
    marginLeft: 10,
  },
  timelineWrapper: {
    position: 'relative',
    gap: 16,
    paddingLeft: 6,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 17,
    top: 20,
    bottom: 40,
    width: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    zIndex: 2,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#073B72',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tierCardActive: {
    borderWidth: 1.5,
  },
  tierCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#073B72',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6F8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tierCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 12,
    color: '#55718F',
    lineHeight: 16,
  },
  tierCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  tierCTAText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  whyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 6,
  },
  whyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
    marginBottom: 3,
  },
  whyText: {
    fontSize: 12,
    color: '#55718F',
    lineHeight: 17,
  },
});
