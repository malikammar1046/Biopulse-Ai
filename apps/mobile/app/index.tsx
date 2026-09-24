import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { Typography, Card, Button, Badge } from '../components/ui';
import { Logo } from '../components/brand/Logo';
import { Spacing } from '../constants/Layout';
import { useThemeColor } from '../hooks/useThemeColor';

export default function EntryScreen() {
  const theme = useThemeColor();
  const router = useRouter();

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Brand Badge */}
        <Badge
          label="Design System Ready"
          variant="primary"
          badgeStyle="soft"
          showDot
          style={styles.badge}
        />

        {/* Brand Logo & Title */}
        <View style={styles.logoContainer}>
          <Logo size="lg" showText={false} />
          <Typography variant="h1" color={theme.primary} align="center" style={styles.title}>
            OVASense
          </Typography>
        </View>

        <Typography variant="subtitle" color={theme.textSecondary} align="center" style={styles.subtitle}>
          AI-assisted health information & longitudinal monitoring
        </Typography>

        {/* Platform Status Card */}
        <Card variant="standard" style={styles.statusCard}>
          <Typography variant="caption" color={theme.textMuted} align="center">
            Deep Orchid • Lavender • Berry • Blush • Accessible WCAG AA
          </Typography>
        </Card>

        {/* Showcase Navigation Button */}
        <Button
          label="Explore Design System Showcase"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/design-system')}
          style={styles.actionButton}
        />
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
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
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
    marginBottom: Spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
});
