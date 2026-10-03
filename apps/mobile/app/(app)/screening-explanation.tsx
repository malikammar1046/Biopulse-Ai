import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useHealthStore } from '../../store/healthStore';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 19: SCREENING EXPLANATION SCREEN
 * Adheres strictly to visual references:
 * - Female: ChatGPT Image Oct 2, 2026, 12_24_10 AM-1.png
 * - Male: ChatGPT Image Oct 2, 2026, 12_24_14 AM-2.png
 *
 * Implements:
 * - Top Breadcrumbs: < PCOS Pathway > Screening > Explanation
 * - Header: "What influenced your result?" + subtext
 * - Top 3 Factors with icon, direction pill (↑ Increased risk), plain explanation
 * - "See all factors" expandable accordion
 * - Non-diagnostic info callout
 * - Permanent Bottom Navigation
 */
export default function ScreeningExplanationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { isFemale, screening } = useHealthStore();
  const [showAllFactors, setShowAllFactors] = useState(false);

  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const themeSoftBg = isFemale ? '#FFF2F7' : '#EAF5FD';
  const themeCardBorder = isFemale ? '#FFF0F5' : '#EEF6FD';

  const top3Factors = screening.topFactors.slice(0, 3);
  const remainingFactors = screening.allFactors.slice(3);

  return (
    <View style={[styles.root, { backgroundColor: isFemale ? '#FFF7F9' : '#F4F9FD' }]}>
      <AuthBackgroundFoliage />

      {/* Header & Breadcrumb */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#073B72" />
        </Pressable>

        <View style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbMuted}>
            {isFemale ? 'PCOS Pathway' : 'Hypogonadism'}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
          <Text style={styles.breadcrumbMuted}>Screening</Text>
          <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
          <Text style={[styles.breadcrumbActive, { color: themeAccent }]}>Explanation</Text>
        </View>

        <View style={{ width: 32 }} />
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
          {/* Headline Section */}
          <View style={styles.headlineSection}>
            <Text style={styles.titleText}>What influenced your result?</Text>
            <Text style={styles.subtitleText}>
              Your screening result is based on multiple factors from your health profile. Below are the top 3 factors that had the biggest influence on your result.
            </Text>
          </View>

          {/* Top 3 Factor Cards */}
          <View style={styles.factorsList}>
            {top3Factors.map((factor) => {
              const isIncrease = factor.direction === 'increases_risk';
              const badgeBg = isIncrease ? '#FEE2E2' : '#E6F8F0';
              const badgeText = isIncrease ? '#DC2626' : '#10B981';
              const arrow = isIncrease ? '↑' : '↓';
              const label = isIncrease ? 'Increased risk' : 'Decreased risk';

              return (
                <View
                  key={factor.id}
                  style={[styles.factorCard, { borderColor: themeCardBorder }]}
                >
                  <View style={styles.factorCardHeader}>
                    <View style={[styles.factorIconBox, { backgroundColor: themeSoftBg }]}>
                      <Ionicons
                        name={factor.iconName as any || 'pulse-outline'}
                        size={20}
                        color={themeAccent}
                      />
                    </View>

                    <View style={styles.factorTitleWrap}>
                      <Text style={styles.factorNameText}>{factor.name}</Text>
                      <View style={[styles.directionBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.directionBadgeText, { color: badgeText }]}>
                          {arrow} {label}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  </View>

                  <Text style={styles.factorExplanationText}>{factor.explanation}</Text>
                </View>
              );
            })}
          </View>

          {/* Accordion: See All Factors */}
          <Pressable
            onPress={() => setShowAllFactors(!showAllFactors)}
            style={[styles.accordionBtn, { backgroundColor: '#FFFFFF', borderColor: themeCardBorder }]}
          >
            <View style={styles.accordionLeft}>
              <Ionicons name="list-outline" size={20} color="#073B72" />
              <Text style={styles.accordionBtnText}>See all factors</Text>
            </View>
            <Ionicons
              name={showAllFactors ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#073B72"
            />
          </Pressable>

          {showAllFactors && (
            <View style={styles.remainingFactorsWrap}>
              {remainingFactors.map((factor) => (
                <View
                  key={factor.id}
                  style={[styles.factorCard, { borderColor: themeCardBorder }]}
                >
                  <View style={styles.factorCardHeader}>
                    <View style={[styles.factorIconBox, { backgroundColor: themeSoftBg }]}>
                      <Ionicons
                        name={factor.iconName as any || 'heart-outline'}
                        size={18}
                        color={themeAccent}
                      />
                    </View>
                    <View style={styles.factorTitleWrap}>
                      <Text style={styles.factorNameText}>{factor.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.factorExplanationText}>{factor.explanation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Non-Diagnostic Callout */}
          <View style={[styles.infoBanner, { backgroundColor: themeSoftBg, borderColor: themeCardBorder }]}>
            <Ionicons name="information-circle-outline" size={20} color={themeAccent} />
            <Text style={styles.infoBannerText}>
              These are the main contributors to your current screening result. Your result is based on a combination of multiple factors from your health profile, not just these three.
            </Text>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbMuted: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbActive: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: 14,
  },
  tabletContainer: {
    maxWidth: 600,
  },
  headlineSection: {
    gap: 6,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#073B72',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 13,
    color: '#55718F',
    lineHeight: 18,
  },
  factorsList: {
    gap: 12,
  },
  factorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#073B72',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
  },
  factorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  factorIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorTitleWrap: {
    flex: 1,
    gap: 4,
  },
  factorNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073B72',
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  directionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  factorExplanationText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  accordionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#073B72',
  },
  remainingFactorsWrap: {
    gap: 10,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#55718F',
    lineHeight: 17,
  },
});
