import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}) => {
  const theme = useThemeColor();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.primarySoft,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        {icon ? (
          icon
        ) : (
          <View
            style={[styles.defaultOrb, { backgroundColor: theme.primaryLight }]}
          />
        )}
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

      {actionLabel && onAction ? (
        <View style={styles.actionContainer}>
          <Button
            label={actionLabel}
            variant="primary"
            size="md"
            onPress={onAction}
          />
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              label={secondaryActionLabel}
              variant="ghost"
              size="md"
              onPress={onSecondaryAction}
              style={styles.secondaryButton}
            />
          ) : null}
        </View>
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  defaultOrb: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    opacity: 0.8,
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
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'stretch',
  },
  secondaryButton: {
    marginTop: Spacing.xs,
  },
});
