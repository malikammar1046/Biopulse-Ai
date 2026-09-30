import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

interface OnboardingTrustStripProps {
  isCompact?: boolean;
}

export const OnboardingTrustStrip: React.FC<OnboardingTrustStripProps> = ({
  isCompact = false,
}) => {
  const textSize = isCompact ? 10.5 : 11.5;
  const iconSize = isCompact ? 13 : 15;

  return (
    <View
      style={styles.pillContainer}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Evidence-based, non-diagnostic, designed for you"
    >
      <Ionicons
        name="heart-outline"
        size={iconSize}
        color={BioPulseColors.femaleAccent}
        style={styles.icon}
      />
      <View style={styles.textRow}>
        <Text style={[styles.itemText, { fontSize: textSize }]}>
          Evidence-based
        </Text>
        <Text style={[styles.separator, { fontSize: textSize }]}> • </Text>
        <Text style={[styles.itemText, { fontSize: textSize }]}>
          Non-diagnostic
        </Text>
        <Text style={[styles.separator, { fontSize: textSize }]}> • </Text>
        <Text style={[styles.itemText, { fontSize: textSize }]}>
          Designed for you
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F4',
    borderWidth: 1,
    borderColor: '#F9DEE6',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignSelf: 'center',
  },
  icon: {
    marginRight: 6,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  itemText: {
    color: BioPulseColors.secondaryText,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  separator: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '700',
  },
});
