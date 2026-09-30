import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

interface AuthTrustPanelProps {
  isCompact?: boolean;
}

/**
 * Trust and Clinical Boundaries Panel for BioPulse AI Authentication.
 *
 * Implements:
 * - 3 balanced columns: Secure & Private, Evidence-Based, Non-Diagnostic
 * - Dual-pathway balanced accents (soft pink, subtle teal/blue)
 * - Clear screening and non-diagnostic disclaimer
 */
export const AuthTrustPanel: React.FC<AuthTrustPanelProps> = ({
  isCompact = false,
}) => {
  const iconSize = isCompact ? 18 : 20;
  const titleSize = isCompact ? 11 : 12;
  const subSize = isCompact ? 9 : 10;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel="BioPulse Trust Panel: Secure and Private, Evidence-Based, Non-Diagnostic for screening support only"
    >
      {/* 1. Secure & Private */}
      <View style={styles.column}>
        <View style={[styles.iconBadge, styles.badgePink]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={iconSize}
            color={BioPulseColors.femaleAccent}
            accessible={false}
          />
        </View>
        <Text style={[styles.title, { fontSize: titleSize }]}>
          Secure & Private
        </Text>
        <Text style={[styles.subtitle, { fontSize: subSize }]}>
          Your data is protected
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.verticalDivider} />

      {/* 2. Evidence-Based */}
      <View style={styles.column}>
        <View style={[styles.iconBadge, styles.badgeTeal]}>
          <Ionicons
            name="document-text-outline"
            size={iconSize}
            color={BioPulseColors.femaleAccent}
            accessible={false}
          />
        </View>
        <Text style={[styles.title, { fontSize: titleSize }]}>
          Evidence-Based
        </Text>
        <Text style={[styles.subtitle, { fontSize: subSize }]}>
          Backed by research
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.verticalDivider} />

      {/* 3. Non-Diagnostic */}
      <View style={styles.column}>
        <View style={[styles.iconBadge, styles.badgeNavy]}>
          <Ionicons
            name="people-outline"
            size={iconSize}
            color={BioPulseColors.femaleAccent}
            accessible={false}
          />
        </View>
        <Text style={[styles.title, { fontSize: titleSize }]}>
          Non-Diagnostic
        </Text>
        <Text style={[styles.subtitle, { fontSize: subSize }]}>
          For screening support only
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgePink: {
    backgroundColor: '#FDF0F4',
  },
  badgeTeal: {
    backgroundColor: '#FDF0F4',
  },
  badgeNavy: {
    backgroundColor: '#FDF0F4',
  },
  title: {
    color: BioPulseColors.navy,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  subtitle: {
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 13,
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#F1E4EC',
    alignSelf: 'center',
  },
});
