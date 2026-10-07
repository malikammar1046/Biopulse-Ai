import React from 'react';
import { View, StyleSheet, Text, Image, ImageSourcePropType } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';

const EMBLEM_ASSET = require('../../assets/biopulse_ai_emblem.jpg');

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  tagline?: string;
  layout?: 'horizontal' | 'vertical';
  customEmblem?: ImageSourcePropType;
}

/**
 * BioPulse AI Brand Logo
 * 
 * Recreates the exact brand lockup from the new visual design system:
 * - 3D organic heart & vitality emblem (cyan leaf + translucent pink petal + ECG pulse)
 * - "BioPulse" in deep navy (#0A3445)
 * - "AI" in vibrant teal (#16B8C4)
 * - Optional tagline ("Understand Today. A Healthier Tomorrow.")
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  tagline = 'Understand Today. A Healthier Tomorrow.',
  layout = 'horizontal',
  customEmblem,
}) => {
  const emblemSize =
    size === 'sm' ? 36 : size === 'md' ? 52 : size === 'lg' ? 76 : 100;
  const titleFontSize =
    size === 'sm' ? 18 : size === 'md' ? 24 : size === 'lg' ? 32 : 38;
  const taglineFontSize =
    size === 'sm' ? 10 : size === 'md' ? 12 : size === 'lg' ? 14 : 15;

  const isVertical = layout === 'vertical';

  return (
    <View
      style={[
        styles.container,
        isVertical ? styles.containerVertical : styles.containerHorizontal,
      ]}
      accessibilityRole="header"
      accessibilityLabel="BioPulse AI Logo"
    >
      {/* Emblem Artwork with soft rounded container */}
      <View
        style={[
          styles.emblemWrapper,
          {
            width: emblemSize,
            height: emblemSize,
            borderRadius: emblemSize * 0.28,
          },
        ]}
      >
        <Image
          source={customEmblem || EMBLEM_ASSET}
          style={styles.emblemImage}
          resizeMode="contain"
        />
      </View>

      {/* Typography Lockup */}
      {showText && (
        <View
          style={[
            styles.textContainer,
            isVertical ? styles.textContainerVertical : styles.textContainerHorizontal,
          ]}
        >
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.titleBioPulse,
                { fontSize: titleFontSize, color: BioPulseColors.textPrimary },
              ]}
            >
              BioPulse
            </Text>
            <Text
              style={[
                styles.titleAI,
                { fontSize: titleFontSize, color: BioPulseColors.teal },
              ]}
            >
              {' '}AI
            </Text>
          </View>

          {showTagline && (
            <Text
              style={[
                styles.tagline,
                {
                  fontSize: taglineFontSize,
                  color: BioPulseColors.textSecondary,
                  textAlign: isVertical ? 'center' : 'left',
                },
              ]}
            >
              {tagline}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerHorizontal: {
    flexDirection: 'row',
    gap: 12,
  },
  containerVertical: {
    flexDirection: 'column',
    gap: 12,
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    justifyContent: 'center',
  },
  textContainerHorizontal: {
    alignItems: 'flex-start',
  },
  textContainerVertical: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleBioPulse: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleAI: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tagline: {
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.1,
  },
});
