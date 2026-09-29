import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';

const FOLIAGE_RIGHT = require('../../assets/foliage_top_right.png');
const FOLIAGE_LEFT = require('../../assets/foliage_top_left.png');

interface AuthBackgroundFoliageProps {
  topOffset?: number;
}

/**
 * Botanical & Dual-Pathway Ambient Decorative Background for BioPulse AI Auth Screens.
 *
 * Visual Features:
 * - Soft blush/pink botanical foliage at top-right and bottom-left
 * - Subtle dual-pathway ambient glow (BioPulse pink & subtle teal accents)
 * - Purely decorative: fully excluded from accessibility and touch responders
 */
export const AuthBackgroundFoliage: React.FC<AuthBackgroundFoliageProps> = ({
  topOffset = 0,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      {/* Top-Right Soft Pink Botanical Foliage */}
      <View style={[styles.foliageTopRight, { top: topOffset }]}>
        <Image
          source={FOLIAGE_RIGHT}
          style={styles.imageFill}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      {/* Bottom-Left Soft Botanical Foliage */}
      <View style={styles.foliageBottomLeft}>
        <Image
          source={FOLIAGE_LEFT}
          style={[styles.imageFill, styles.flippedBottom]}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      {/* Very Subtle Dual-Pathway Ambient Glows */}
      <View style={[styles.ambientGlow, styles.glowTeal]} />
      <View style={[styles.ambientGlow, styles.glowPink]} />
    </View>
  );
};

const styles = StyleSheet.create({
  foliageTopRight: {
    position: 'absolute',
    right: 0,
    width: 130,
    height: 300,
    opacity: 0.9,
  },
  foliageBottomLeft: {
    position: 'absolute',
    left: -15,
    bottom: -20,
    width: 140,
    height: 320,
    opacity: 0.85,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  flippedBottom: {
    transform: [{ scaleY: -1 }, { rotate: '15deg' }],
  },
  ambientGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTeal: {
    width: 220,
    height: 220,
    bottom: 60,
    left: -40,
    backgroundColor: 'rgba(22, 184, 196, 0.05)',
  },
  glowPink: {
    width: 200,
    height: 200,
    top: 20,
    right: -30,
    backgroundColor: 'rgba(244, 63, 125, 0.04)',
  },
});
