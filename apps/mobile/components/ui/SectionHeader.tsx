import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Spacing, TouchTarget } from '../../constants/Layout';
import { Typography as TypoTokens } from '../../constants/Typography';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionLabel,
  onAction,
  showDivider = false,
  style,
}) => {
  const theme = useThemeColor();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.textPrimary }]}
          >
            {title}
          </Text>
          {badge ? <View style={styles.badgeWrapper}>{badge}</View> : null}
        </View>

        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}

      {showDivider ? (
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.borderSubtle },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: TypoTokens.fontSize.title,
    lineHeight: TypoTokens.lineHeight.title,
    fontWeight: TypoTokens.fontWeight.bold,
  },
  badgeWrapper: {
    marginLeft: Spacing.sm,
  },
  actionButton: {
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  actionText: {
    fontSize: TypoTokens.fontSize.bodySmall,
    fontWeight: TypoTokens.fontWeight.semibold,
  },
  subtitle: {
    fontSize: TypoTokens.fontSize.caption,
    lineHeight: TypoTokens.lineHeight.caption,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginTop: Spacing.sm,
  },
});
