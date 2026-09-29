import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

interface OnboardingFeatureRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  circleBg: string;
  title: string;
  description: string;
  isCompact?: boolean;
}

export const OnboardingFeatureRow: React.FC<OnboardingFeatureRowProps> = ({
  iconName,
  iconColor,
  circleBg,
  title,
  description,
  isCompact = false,
}) => {
  const circleSize = isCompact ? 34 : 38;
  const iconSize = isCompact ? 17 : 19;
  const titleSize = isCompact ? 13 : 14;
  const descSize = isCompact ? 11 : 12;

  return (
    <View style={styles.container}>
      {/* Soft Circular Icon */}
      <View
        style={[
          styles.iconCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: circleBg,
          },
        ]}
      >
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </View>

      {/* Title & Description */}
      <View style={styles.textColumn}>
        <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.description, { fontSize: descSize, lineHeight: descSize * 1.35 }]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginVertical: 4.5,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: BioPulseColors.navy,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 1,
  },
  description: {
    color: BioPulseColors.secondaryText,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
});
