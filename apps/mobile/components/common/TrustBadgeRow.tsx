import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface TrustBadgeItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

export interface TrustBadgeRowProps {
  items?: TrustBadgeItem[];
  variant?: 'welcome' | 'security';
}

const DEFAULT_WELCOME_ITEMS: TrustBadgeItem[] = [
  { icon: 'school-outline', label: 'Evidence-based' },
  { icon: 'shield-checkmark-outline', label: 'Private' },
  { icon: 'document-text-outline', label: 'Non-diagnostic' },
];

const DEFAULT_SECURITY_ITEMS: TrustBadgeItem[] = [
  { icon: 'shield-checkmark-outline', label: 'Secure' },
  { icon: 'lock-closed-outline', label: 'Private' },
  { icon: 'school-outline', label: 'Evidence-based' },
];

export const TrustBadgeRow: React.FC<TrustBadgeRowProps> = ({
  items,
  variant = 'welcome',
}) => {
  const badgeItems =
    items || (variant === 'security' ? DEFAULT_SECURITY_ITEMS : DEFAULT_WELCOME_ITEMS);

  return (
    <View style={styles.container}>
      {badgeItems.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.badge}>
          <Ionicons
            name={item.icon}
            size={13}
            color={BioPulseColors.teal}
            style={styles.icon}
          />
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: BioPulseColors.border,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#16B8C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: {
    marginTop: 0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: BioPulseColors.textSecondary,
    letterSpacing: -0.1,
  },
});
