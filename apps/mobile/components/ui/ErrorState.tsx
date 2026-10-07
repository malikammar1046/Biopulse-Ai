import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Button } from './Button';
import { SadCloudIllustration } from './StateIllustrations';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Information Unavailable',
  description = 'We could not retrieve this health record right now. Please check your connection and try again.',
  retryLabel = 'Try Again',
  onRetry,
  compact = false,
  style,
}) => {
  const theme = useThemeColor();

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: theme.errorSoft,
            borderColor: theme.errorBorder,
          },
          style,
        ]}
      >
        <Text style={[styles.compactTitle, { color: theme.error }]}>
          {title}
        </Text>
        <Text style={[styles.compactDesc, { color: theme.textSecondary }]}>
          {description}
        </Text>
        {onRetry ? (
          <Button
            label={retryLabel}
            variant="outline"
            size="sm"
            onPress={onRetry}
            style={styles.compactButton}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.illustrationWrapper}>
        <SadCloudIllustration size={120} />
      </View>

      <Text
        accessibilityRole="header"
        style={[styles.title, { color: theme.textPrimary }]}
      >
        {title}
      </Text>

      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>

      {onRetry ? (
        <Button
          label={retryLabel}
          variant="secondary"
          size="md"
          onPress={onRetry}
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  illustrationWrapper: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TypoTokens.fontSize.h3,
    lineHeight: TypoTokens.lineHeight.h3,
    fontWeight: TypoTokens.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: TypoTokens.fontSize.body,
    lineHeight: TypoTokens.lineHeight.body,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    minWidth: 160,
  },
  compactContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  compactTitle: {
    fontSize: TypoTokens.fontSize.bodySmall,
    fontWeight: TypoTokens.fontWeight.semibold,
    marginBottom: Spacing['2xs'],
  },
  compactDesc: {
    fontSize: TypoTokens.fontSize.caption,
    lineHeight: TypoTokens.lineHeight.caption,
    marginBottom: Spacing.sm,
  },
  compactButton: {
    alignSelf: 'flex-start',
  },
});
