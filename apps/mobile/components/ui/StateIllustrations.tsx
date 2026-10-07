import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Salad Bowl illustration for Meals Empty State (Screen 47)
 */
export function SaladBowlIllustration({ size = 140 }: { size?: number }) {
  const scale = size / 140;

  return (
    <View style={[styles.illustrationContainer, { width: size, height: size * 0.85 }]}>
      {/* Sparkles / Floating accents */}
      <View style={[styles.sparkleStar, { top: 6 * scale, left: 16 * scale }]}>
        <Ionicons name="sparkles" size={16 * scale} color="#F43F5E" />
      </View>
      <View style={[styles.sparkleStar, { top: 12 * scale, right: 18 * scale }]}>
        <Ionicons name="sparkles" size={14 * scale} color="#F59E0B" />
      </View>
      <View style={[styles.sparkleDot, { top: 38 * scale, left: 8 * scale, backgroundColor: '#38BDF8', width: 6 * scale, height: 6 * scale }]} />
      <View style={[styles.sparkleDot, { top: 44 * scale, right: 10 * scale, backgroundColor: '#EC4899', width: 8 * scale, height: 8 * scale }]} />

      {/* Salad Greens & Toppings cluster */}
      <View style={[styles.saladCluster, { top: 18 * scale, width: 100 * scale, height: 48 * scale }]}>
        {/* Lettuce Leaves */}
        <View style={[styles.lettuceLeaf, { left: 4 * scale, top: 8 * scale, width: 36 * scale, height: 36 * scale, backgroundColor: '#22C55E' }]} />
        <View style={[styles.lettuceLeaf, { left: 32 * scale, top: 0, width: 38 * scale, height: 38 * scale, backgroundColor: '#16A34A' }]} />
        <View style={[styles.lettuceLeaf, { right: 6 * scale, top: 10 * scale, width: 34 * scale, height: 34 * scale, backgroundColor: '#4ADE80' }]} />

        {/* Tomatoes */}
        <View style={[styles.tomatoSlice, { left: 18 * scale, top: 12 * scale, width: 18 * scale, height: 18 * scale }]}>
          <View style={[styles.tomatoSeed, { width: 3 * scale, height: 3 * scale }]} />
        </View>
        <View style={[styles.tomatoSlice, { right: 24 * scale, top: 18 * scale, width: 16 * scale, height: 16 * scale }]} />

        {/* Egg slice */}
        <View style={[styles.eggWhite, { left: 42 * scale, top: 14 * scale, width: 22 * scale, height: 26 * scale }]}>
          <View style={[styles.eggYolk, { width: 12 * scale, height: 12 * scale }]} />
        </View>

        {/* Carrot / Bell pepper strip */}
        <View style={[styles.carrotStrip, { left: 26 * scale, top: 6 * scale, width: 20 * scale, height: 6 * scale }]} />
        <View style={[styles.carrotStrip, { right: 16 * scale, top: 8 * scale, width: 16 * scale, height: 6 * scale, transform: [{ rotate: '25deg' }] }]} />
      </View>

      {/* Bowl Container */}
      <View style={[styles.bowlBase, { bottom: 0, width: 110 * scale, height: 50 * scale }]}>
        {/* Bowl Rim */}
        <View style={[styles.bowlRim, { height: 10 * scale, borderRadius: 5 * scale }]} />
        {/* Bowl Body reflection */}
        <View style={[styles.bowlGleam, { width: 60 * scale, height: 4 * scale, top: 16 * scale, borderRadius: 2 * scale }]} />
      </View>
    </View>
  );
}

/**
 * Sad Cloud illustration for Loading & Error States (Screen 48)
 */
export function SadCloudIllustration({ size = 140 }: { size?: number }) {
  const scale = size / 140;

  return (
    <View style={[styles.illustrationContainer, { width: size, height: size * 0.85 }]}>
      {/* Cloud Base Shapes */}
      <View style={[styles.cloudBody, { width: 100 * scale, height: 64 * scale, top: 12 * scale }]}>
        {/* Back Puff */}
        <View style={[styles.cloudPuff, { width: 50 * scale, height: 50 * scale, left: 12 * scale, top: -14 * scale }]} />
        {/* Top Puff */}
        <View style={[styles.cloudPuff, { width: 60 * scale, height: 60 * scale, left: 32 * scale, top: -24 * scale }]} />
        {/* Right Puff */}
        <View style={[styles.cloudPuff, { width: 44 * scale, height: 44 * scale, right: 6 * scale, top: -8 * scale }]} />

        {/* Sad Face */}
        <View style={[styles.sadFaceRow, { top: 14 * scale }]}>
          {/* Left Eye */}
          <View style={[styles.sadEye, { width: 5 * scale, height: 5 * scale, borderRadius: 2.5 * scale }]} />
          {/* Right Eye */}
          <View style={[styles.sadEye, { width: 5 * scale, height: 5 * scale, borderRadius: 2.5 * scale }]} />
        </View>
        {/* Sad Downward Mouth */}
        <View style={[styles.sadMouth, { top: 25 * scale, width: 14 * scale, height: 7 * scale }]} />
      </View>

      {/* Warning Triangle Badge */}
      <View style={[styles.warningBadge, { bottom: 4 * scale, right: 10 * scale, width: 34 * scale, height: 34 * scale, borderRadius: 17 * scale }]}>
        <Ionicons name="warning" size={20 * scale} color="#EF4444" />
      </View>

      {/* Floating droplets */}
      <View style={[styles.sparkleDot, { top: 10 * scale, left: 8 * scale, backgroundColor: '#BAE6FD', width: 6 * scale, height: 6 * scale }]} />
      <View style={[styles.sparkleDot, { top: 22 * scale, right: 12 * scale, backgroundColor: '#FECDD3', width: 6 * scale, height: 6 * scale }]} />
    </View>
  );
}

/**
 * Animated Dual-arc Syncing Spinner Ring
 */
export function SyncingRingSpinner({ size = 46 }: { size?: number }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.spinnerContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size * 0.1,
          borderColor: '#E2E8F0',
          borderTopColor: '#0284C7',
          borderRightColor: '#0D9488',
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
}

/**
 * Offline State Icon in Pink circle
 */
export function OfflineStateIcon({ size = 46 }: { size?: number }) {
  return (
    <View
      style={[
        styles.offlineIconBg,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={size * 0.52} color="#E11D48" />
    </View>
  );
}

/**
 * Mini Sad Cloud Icon for card rows
 */
export function MiniSadCloudIcon({ size = 46 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.cloudBody, { width: size * 0.82, height: size * 0.55, borderRadius: size * 0.28 }]}>
        <View style={[styles.sadFaceRow, { top: size * 0.12 }]}>
          <View style={[styles.sadEye, { width: 3, height: 3, borderRadius: 1.5 }]} />
          <View style={[styles.sadEye, { width: 3, height: 3, borderRadius: 1.5 }]} />
        </View>
        <View style={[styles.sadMouth, { top: size * 0.24, width: 8, height: 4 }]} />
      </View>
      <View style={[styles.warningBadgeMini, { bottom: 0, right: 0 }]}>
        <Ionicons name="warning" size={14} color="#EF4444" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleStar: {
    position: 'absolute',
    zIndex: 10,
  },
  sparkleDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  saladCluster: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  lettuceLeaf: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.95,
  },
  tomatoSlice: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  tomatoSeed: {
    backgroundColor: '#FEF08A',
    borderRadius: 999,
  },
  eggWhite: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  eggYolk: {
    backgroundColor: '#FACC15',
    borderRadius: 999,
  },
  carrotStrip: {
    position: 'absolute',
    backgroundColor: '#F97316',
    borderRadius: 3,
    transform: [{ rotate: '-18deg' }],
    zIndex: 6,
  },
  bowlBase: {
    position: 'absolute',
    backgroundColor: '#38BDF8',
    borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0284C7',
    zIndex: 8,
  },
  bowlRim: {
    width: '100%',
    backgroundColor: '#0284C7',
  },
  bowlGleam: {
    position: 'absolute',
    backgroundColor: '#BAE6FD',
    opacity: 0.5,
  },
  cloudBody: {
    backgroundColor: '#BAE6FD',
    borderRadius: 32,
    position: 'relative',
    alignItems: 'center',
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: '#BAE6FD',
    borderRadius: 999,
  },
  sadFaceRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  sadEye: {
    backgroundColor: '#1E3A8A',
  },
  sadMouth: {
    position: 'absolute',
    borderTopWidth: 2,
    borderColor: '#1E3A8A',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    zIndex: 10,
  },
  warningBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 15,
  },
  warningBadgeMini: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineIconBg: {
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
