import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');

interface OnboardingHeaderProps {
  onSkip?: () => void;
  isCompact?: boolean;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  onSkip,
  isCompact = false,
}) => {
  const emblemSize = isCompact ? 32 : 36;
  const brandTitleSize = isCompact ? 16 : 18;
  const brandSubtitleSize = isCompact ? 8 : 8.5;

  return (
    <View style={styles.headerRow}>
      {/* Left: BioPulse AI Compact Brand Lockup */}
      <View style={styles.brandLockup}>
        <Image
          source={HEART_EMBLEM}
          style={{ width: emblemSize, height: emblemSize, marginRight: 8 }}
          resizeMode="contain"
          accessible
          accessibilityLabel="BioPulse AI Logo"
        />
        <View style={styles.brandTextColumn}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleNavy, { fontSize: brandTitleSize }]}>
              BioPulse
            </Text>
            <Text style={[styles.titlePink, { fontSize: brandTitleSize }]}>
              {' '}AI
            </Text>
          </View>
          <Text style={[styles.subtitle, { fontSize: brandSubtitleSize }]}>
            PERSONALIZED HEALTH INTELLIGENCE
          </Text>
        </View>
      </View>

      {/* Right: Skip Action */}
      {onSkip ? (
        <Pressable
          onPress={onSkip}
          hitSlop={12}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && { opacity: 0.65 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding introduction"
        >
          <Text style={[styles.skipText, { fontSize: isCompact ? 13 : 14 }]}>
            Skip
          </Text>
          <Ionicons
            name="chevron-forward"
            size={isCompact ? 13 : 14}
            color={BioPulseColors.secondaryText}
            style={styles.skipIcon}
          />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleNavy: {
    color: BioPulseColors.navy,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  titlePink: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: BioPulseColors.secondaryText,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 1,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    color: BioPulseColors.secondaryText,
    fontWeight: '500',
  },
  skipIcon: {
    marginLeft: 2,
  },
});
