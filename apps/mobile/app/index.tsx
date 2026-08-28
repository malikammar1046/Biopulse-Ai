import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Spacing } from '../constants/Layout';
import { useThemeColor } from '../hooks/useThemeColor';

export default function EntryScreen() {
  const theme = useThemeColor();

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Brand Badge */}
        <View style={[styles.badge, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <View style={[styles.badgeDot, { backgroundColor: theme.teal }]} />
          <Typography variant="caption" color={theme.textSecondary}>
            Foundation Active
          </Typography>
        </View>

        {/* Title & Core Subtitle */}
        <Typography variant="h1" color={theme.primaryLight} align="center" style={styles.title}>
          PMOSense
        </Typography>

        <Typography variant="subtitle" color={theme.textSecondary} align="center" style={styles.subtitle}>
          AI-assisted health information & monitoring
        </Typography>

        {/* Platform Status Card */}
        <Card elevated style={styles.statusCard}>
          <Typography variant="caption" color={theme.textMuted} align="center">
            Expo Router • React Native • TypeScript • Reanimated
          </Typography>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
  },
  statusCard: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
