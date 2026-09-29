import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');

interface AuthHeaderProps {
  isCompact?: boolean;
}

/**
 * Top-left brand lockup for BioPulse AI authentication screens.
 *
 * Displays:
 * - BioPulse heart/pulse logo emblem
 * - BioPulse AI wordmark (Navy + Pink)
 * - "PERSONALIZED HEALTH INTELLIGENCE" subtitle
 */
export const AuthHeader: React.FC<AuthHeaderProps> = ({ isCompact = false }) => {
  const emblemSize = isCompact ? 32 : 38;
  const brandTitleSize = isCompact ? 17 : 19;
  const brandSubtitleSize = isCompact ? 8 : 8.5;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="header"
      accessibilityLabel="BioPulse AI, Personalized Health Intelligence"
    >
      <Image
        source={HEART_EMBLEM}
        style={{ width: emblemSize, height: emblemSize, marginRight: 9 }}
        resizeMode="contain"
        accessible={false}
      />
      <View style={styles.textColumn}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  textColumn: {
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
    letterSpacing: 0.8,
    marginTop: 1,
  },
});
