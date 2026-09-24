import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Spacing } from '../../constants/Layout';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  tagline?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  tagline = 'AI Health Monitor',
}) => {
  const theme = useThemeColor();

  const boxSize = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;
  const borderRadius = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  const titleSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const taglineSize = size === 'sm' ? 9 : size === 'lg' ? 11 : 10;

  return (
    <View style={styles.container}>
      {/* Emblem Container */}
      <View
        style={[
          styles.emblemBox,
          {
            width: boxSize,
            height: boxSize,
            borderRadius,
            backgroundColor: '#2D0C4E',
            borderColor: 'rgba(216, 180, 254, 0.25)',
          },
        ]}
      >
        {/* Outer Organic Ring */}
        <View
          style={[
            styles.outerRing,
            {
              width: boxSize * 0.72,
              height: boxSize * 0.72,
              borderRadius: (boxSize * 0.72) / 2,
              borderColor: '#A21CAF',
            },
          ]}
        >
          {/* Inner Intersecting Loop */}
          <View
            style={[
              styles.innerRing,
              {
                width: boxSize * 0.44,
                height: boxSize * 0.44,
                borderRadius: (boxSize * 0.44) / 2,
                borderColor: '#FB7185',
              },
            ]}
          >
            {/* Luminous Nucleus Spark */}
            <View
              style={[
                styles.nucleus,
                {
                  width: boxSize * 0.18,
                  height: boxSize * 0.18,
                  borderRadius: (boxSize * 0.18) / 2,
                },
              ]}
            />
          </View>
        </View>

        {/* Vitality Dot Accent */}
        <View style={styles.vitalityDot} />
      </View>

      {/* Typography */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontSize: titleSize, color: theme.textPrimary }]}>
            OVASense
          </Text>
          {showTagline && (
            <Text style={[styles.tagline, { fontSize: taglineSize, color: theme.textSecondary }]}>
              {tagline.toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emblemBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: '#6E2D8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  outerRing: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nucleus: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FB7185',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  vitalityDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FB7185',
    borderWidth: 1.5,
    borderColor: '#10071A',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -2,
  },
});
