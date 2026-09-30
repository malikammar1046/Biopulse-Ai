import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const FOLIAGE_LEFT = require('../../assets/foliage_top_left.png');
const FOLIAGE_RIGHT = require('../../assets/foliage_top_right.png');

interface SplashBackgroundFoliageProps {
  topOffset?: number;
}

export const SplashBackgroundFoliage: React.FC<SplashBackgroundFoliageProps> = ({
  topOffset = 0,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      {/* Top-Left Botanical Accent */}
      <View style={[styles.foliageLeftContainer, { top: topOffset + 10 }]}>
        <Image
          source={FOLIAGE_LEFT}
          style={styles.foliageLeftImage}
          resizeMode="contain"
          accessible={false}
        />
      </View>

      {/* Top-Right Botanical Accent */}
      <View style={[styles.foliageRightContainer, { top: topOffset + 10 }]}>
        <Image
          source={FOLIAGE_RIGHT}
          style={styles.foliageRightImage}
          resizeMode="contain"
          accessible={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  foliageLeftContainer: {
    position: 'absolute',
    left: 0,
    width: 65,
    height: 220,
    opacity: 0.85,
  },
  foliageLeftImage: {
    width: '100%',
    height: '100%',
  },
  foliageRightContainer: {
    position: 'absolute',
    right: 0,
    width: 55,
    height: 230,
    opacity: 0.85,
  },
  foliageRightImage: {
    width: '100%',
    height: '100%',
  },
});
