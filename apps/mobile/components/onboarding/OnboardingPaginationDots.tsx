import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';

interface OnboardingPaginationDotsProps {
  totalDots?: number;
  activeIndex?: number;
}

export const OnboardingPaginationDots: React.FC<OnboardingPaginationDotsProps> = ({
  totalDots = 4,
  activeIndex = 0,
}) => {
  return (
    <View
      style={styles.dotsRow}
      accessible
      accessibilityRole="none"
      accessibilityLabel={`Step ${activeIndex + 1} of ${totalDots}`}
    >
      {Array.from({ length: totalDots }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: BioPulseColors.femaleAccent,
  },
  inactiveDot: {
    backgroundColor: '#EAD5DE',
  },
});
