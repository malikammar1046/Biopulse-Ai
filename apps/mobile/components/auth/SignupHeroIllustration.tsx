import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SIGNUP_HERO = require('../../assets/signup_dual_hero.png');

interface SignupHeroIllustrationProps {
  isCompact?: boolean;
}

/**
 * Dual-Pathway Hero Artwork for the BioPulse AI Create Account Screen.
 *
 * Implements:
 * - Equal representation of both female (pink) and male (blue/teal) hormonal-health pathways
 * - Positioned in the upper-right quadrant without obscuring or crowding the form
 * - Purely decorative: non-interactive and hidden from accessibility tree
 */
export const SignupHeroIllustration: React.FC<SignupHeroIllustrationProps> = ({
  isCompact = false,
}) => {
  const size = isCompact ? 115 : 138;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          top: isCompact ? 40 : 44,
          right: isCompact ? -12 : -8,
        },
      ]}
      pointerEvents="none"
      accessible={false}
    >
      {/* Soft Ambient Radial Halo */}
      <View style={[styles.haloGlow, { width: size + 20, height: size + 20 }]} />

      {/* Hero Illustration Vignette */}
      <View style={[styles.imageMask, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={SIGNUP_HERO}
          style={styles.image}
          resizeMode="cover"
          accessible={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  haloGlow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(253, 240, 244, 0.65)',
  },
  imageMask: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(248, 220, 229, 0.45)',
    shadowColor: '#F43F7D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
