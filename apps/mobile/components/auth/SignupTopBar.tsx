import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');

interface SignupTopBarProps {
  onBack: () => void;
  isCompact?: boolean;
}

/**
 * Top Navigation & Brand Header for BioPulse AI Create Account Screen.
 *
 * Implements:
 * - Circular pale-pink back button with accessible 44x44 touch target
 * - Top-center BioPulse AI brand lockup with official heart emblem
 * - Symmetrical balancing for exact horizontal centering
 */
export const SignupTopBar: React.FC<SignupTopBarProps> = ({
  onBack,
  isCompact = false,
}) => {
  const emblemSize = isCompact ? 28 : 32;
  const brandTitleSize = isCompact ? 16 : 17.5;
  const brandSubtitleSize = isCompact ? 7 : 7.5;

  return (
    <View style={styles.container}>
      {/* Back Button (Top-Left) */}
      <Pressable
        onPress={onBack}
        hitSlop={6}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back to previous screen"
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={BioPulseColors.navy}
        />
      </Pressable>

      {/* Brand Header (Top-Center) */}
      <View
        style={styles.centerBrandLockup}
        accessible
        accessibilityRole="header"
        accessibilityLabel="BioPulse AI, Personalized Health Intelligence"
      >
        <Image
          source={HEART_EMBLEM}
          style={{ width: emblemSize, height: emblemSize, marginRight: 7 }}
          resizeMode="contain"
          accessible={false}
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

      {/* Right Balance Spacer to keep center lockup perfectly aligned */}
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonPressed: {
    backgroundColor: '#FCE7F0',
    transform: [{ scale: 0.96 }],
  },
  centerBrandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: 0.7,
    marginTop: 1,
  },
  spacer: {
    width: 44,
    height: 44,
  },
});
