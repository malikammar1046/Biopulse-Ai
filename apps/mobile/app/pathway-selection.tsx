import React, { useState } from 'react';
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
import { BioPulseColors } from '../constants/Colors';
import { AuthBackgroundFoliage } from '../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../features/authentication';
import { HealthPathway } from '../features/authentication/types';

export default function PathwaySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectPathway, user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [selected, setSelected] = useState<HealthPathway>('female_pcos');

  const handleConfirm = () => {
    selectPathway(selected);
    router.replace('/(app)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <AuthBackgroundFoliage />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {/* Header */}
          <View style={styles.headerBlock}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>DUAL-PATHWAY PLATFORM</Text>
            </View>
            <Text style={styles.title}>
              Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
            </Text>
            <Text style={styles.subtitle}>
              BioPulse AI delivers specialized clinical intelligence. Select the primary health pathway you would like to focus on:
            </Text>
          </View>

          {/* Pathway Cards */}
          <View style={styles.cardsContainer}>
            {/* 1. Female Pathway Card */}
            <Pressable
              onPress={() => setSelected('female_pcos')}
              style={({ pressed }) => [
                styles.pathwayCard,
                styles.femaleCard,
                selected === 'female_pcos' && styles.selectedFemaleCard,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === 'female_pcos' }}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.femaleBadge}>
                  <Text style={styles.femaleBadgeText}>FEMALE PATHWAY</Text>
                </View>
                <View style={[styles.radioCircle, selected === 'female_pcos' && styles.radioCircleFemaleActive]}>
                  {selected === 'female_pcos' && <View style={styles.radioDotFemale} />}
                </View>
              </View>

              <Text style={styles.cardTitle}>PCOS & Hormonal Health</Text>
              <Text style={styles.cardDescription}>
                Personalized cycle tracking, Rotterdam-aligned PCOS risk assessment, ovarian ultrasound imaging intelligence, and metabolic nutrition.
              </Text>

              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>• Cycle and symptom logging</Text>
                <Text style={styles.featureItem}>• AI-assisted PCOS risk evaluation</Text>
                <Text style={styles.featureItem}>• Personalized lifestyle recommendations</Text>
              </View>
            </Pressable>

            {/* 2. Male Pathway Card */}
            <Pressable
              onPress={() => setSelected('male_hypogonadism')}
              style={({ pressed }) => [
                styles.pathwayCard,
                styles.maleCard,
                selected === 'male_hypogonadism' && styles.selectedMaleCard,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === 'male_hypogonadism' }}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.maleBadge}>
                  <Text style={styles.maleBadgeText}>MALE PATHWAY</Text>
                </View>
                <View style={[styles.radioCircle, selected === 'male_hypogonadism' && styles.radioCircleMaleActive]}>
                  {selected === 'male_hypogonadism' && <View style={styles.radioDotMale} />}
                </View>
              </View>

              <Text style={styles.cardTitle}>Hypogonadism & Testosterone Health</Text>
              <Text style={styles.cardDescription}>
                Endocrine monitoring, morning testosterone tracking, validated ADAM symptom scoring, and male vitality intelligence.
              </Text>

              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>• ADAM questionnaire & symptom trends</Text>
                <Text style={styles.featureItem}>• Hormone lab telemetry & HPT axis analysis</Text>
                <Text style={styles.featureItem}>• Male-specific metabolic and lifestyle guidance</Text>
              </View>
            </Pressable>
          </View>

          {/* Confirm Button */}
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.continueBtn,
              selected === 'female_pcos' ? styles.continueBtnFemale : styles.continueBtnMale,
              pressed && styles.continueBtnPressed,
            ]}
          >
            <Text style={styles.continueBtnText}>
              Continue with {selected === 'female_pcos' ? 'Female Pathway' : 'Male Pathway'} →
            </Text>
          </Pressable>

          <Text style={styles.footerNote}>
            You can change your selected pathway anytime in account settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  tabletScrollContent: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 580,
  },
  headerBlock: {
    marginBottom: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  badgePill: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0B1E38',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  pathwayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  femaleCard: {
    backgroundColor: '#FFFFFF',
  },
  selectedFemaleCard: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF5F8',
    shadowColor: '#E11D48',
    shadowOpacity: 0.15,
  },
  maleCard: {
    backgroundColor: '#FFFFFF',
  },
  selectedMaleCard: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    shadowColor: '#0284C7',
    shadowOpacity: 0.15,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  femaleBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  femaleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 0.5,
  },
  maleBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  maleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleFemaleActive: {
    borderColor: '#E11D48',
  },
  radioDotFemale: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E11D48',
  },
  radioCircleMaleActive: {
    borderColor: '#0284C7',
  },
  radioDotMale: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0284C7',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  featuresList: {
    gap: 3,
  },
  featureItem: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  continueBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  continueBtnFemale: {
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
  },
  continueBtnMale: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
  },
  continueBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
