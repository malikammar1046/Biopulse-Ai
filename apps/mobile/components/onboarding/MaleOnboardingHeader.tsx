import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface MaleOnboardingHeaderProps {
  step?: number; // 1 to 4
  totalSteps?: number;
  onBack: () => void;
  title?: string;
  accentColor?: string;
  customLabel?: string;
  isContinuousProgress?: boolean;
  progressPercent?: number; // 0 to 100
}

/**
 * Header for Male Onboarding Screens (13, 14, 15, 16):
 * - Back button on left
 * - "Step X of 4" or "Question X of 10" centered
 * - 4 horizontal segmented progress pills OR continuous progress bar in royal blue (#0284C7)
 */
export const MaleOnboardingHeader: React.FC<MaleOnboardingHeaderProps> = ({
  step = 1,
  totalSteps = 4,
  onBack,
  accentColor = '#0284C7',
  customLabel,
  isContinuousProgress = false,
  progressPercent,
}) => {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 12);

  const displayPercent =
    progressPercent !== undefined
      ? progressPercent
      : Math.min(100, Math.round((step / totalSteps) * 100));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Top Row: Back button & Step label */}
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={BioPulseColors.textPrimary} />
        </Pressable>

        <Text style={styles.stepText}>
          {customLabel || `Step ${step} of ${totalSteps}`}
        </Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Continuous Progress Bar or Segmented Pills */}
      {isContinuousProgress ? (
        <View style={styles.continuousTrack}>
          <View
            style={[
              styles.continuousFill,
              { width: `${displayPercent}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
      ) : (
        <View style={styles.segmentsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isFilled = i < step;
            return (
              <View
                key={`seg-male-${i}`}
                style={[
                  styles.segment,
                  { backgroundColor: isFilled ? accentColor : '#E2EEF2' },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: -0.1,
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  continuousTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2EEF2',
    marginTop: 6,
    overflow: 'hidden',
  },
  continuousFill: {
    height: '100%',
    borderRadius: 2,
  },
});
