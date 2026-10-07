import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { Logo } from '../brand/Logo';

export interface FemaleOnboardingHeaderProps {
  step: number; // 1 to 5
  totalSteps?: number;
  onBack: () => void;
  accentColor?: string;
}

/**
 * Header with Back arrow, BioPulse AI brand lockup, "Step X of 5",
 * and 5 segmented progress pill bars matching Screens 7, 8, 9, 10.
 */
export const FemaleOnboardingHeader: React.FC<FemaleOnboardingHeaderProps> = ({
  step,
  totalSteps = 5,
  onBack,
  accentColor = BioPulseColors.femaleAccent,
}) => {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 12);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Top Row: Back, Logo, Step Label */}
      <View style={styles.topRow}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <View style={styles.logoCenter}>
          <Logo size="sm" layout="horizontal" showTagline={false} />
        </View>

        <Text style={styles.stepText}>
          Step {step} of {totalSteps}
        </Text>
      </View>

      {/* Segmented Progress Pills */}
      <View style={styles.segmentsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isFilled = i < step;
          return (
            <View
              key={`seg-${i}`}
              style={[
                styles.segment,
                { backgroundColor: isFilled ? accentColor : '#D6ECF2' },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: BioPulseColors.textSecondary,
    letterSpacing: -0.1,
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
