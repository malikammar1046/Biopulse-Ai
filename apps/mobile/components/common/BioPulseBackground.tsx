import React from 'react';
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';

export interface BioPulseBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hideOrbs?: boolean;
}

/**
 * BioPulseBackground
 * 
 * Provides the soft luminous pathway-neutral background seen in all reference screenshots:
 * - Base soft mint-cyan tint (#F0F9FB)
 * - Subtle ambient blush-pink and medical-cyan luminous orbs in background periphery
 * - Clean, non-distracting, high readability medical-grade surface
 */
export const BioPulseBackground: React.FC<BioPulseBackgroundProps> = ({
  children,
  style,
  hideOrbs = false,
}) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, style]}>
      {!hideOrbs && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Top-Right Soft Pink Ambient Glow */}
          <View
            style={[
              styles.ambientOrb,
              styles.orbPink,
              {
                width: width * 0.7,
                height: width * 0.7,
                top: -width * 0.15,
                right: -width * 0.2,
              },
            ]}
          />

          {/* Top-Left Soft Cyan Glow */}
          <View
            style={[
              styles.ambientOrb,
              styles.orbCyan,
              {
                width: width * 0.65,
                height: width * 0.65,
                top: height * 0.1,
                left: -width * 0.3,
              },
            ]}
          />

          {/* Bottom-Right Soft Cyan/Teal Glow */}
          <View
            style={[
              styles.ambientOrb,
              styles.orbCyanLight,
              {
                width: width * 0.8,
                height: width * 0.8,
                bottom: -width * 0.2,
                right: -width * 0.25,
              },
            ]}
          />

          {/* Bottom-Left Soft Pink Accent Glow */}
          <View
            style={[
              styles.ambientOrb,
              styles.orbPinkSoft,
              {
                width: width * 0.55,
                height: width * 0.55,
                bottom: height * 0.1,
                left: -width * 0.2,
              },
            ]}
          />
        </View>
      )}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BioPulseColors.background,
    position: 'relative',
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbPink: {
    backgroundColor: 'rgba(244, 63, 125, 0.045)',
  },
  orbPinkSoft: {
    backgroundColor: 'rgba(244, 63, 125, 0.035)',
  },
  orbCyan: {
    backgroundColor: 'rgba(22, 184, 196, 0.07)',
  },
  orbCyanLight: {
    backgroundColor: 'rgba(14, 158, 170, 0.06)',
  },
});
