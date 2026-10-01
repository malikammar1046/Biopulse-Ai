import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressiveAssessment, resolveNextAction } from '../../services/assessmentService';

export interface NextBestActionCardProps {
  assessment?: ProgressiveAssessment | null;
  onActionPress?: () => void;
}

/**
 * BioPulse Adaptive Next Best Action Card
 *
 * Implements:
 * - Real tier-based progression logic
 * - Adapts recommendation text and button dynamically
 * - Preserves Tier 1 -> Tier 2 clinical lab testing flow
 */
export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  assessment,
  onActionPress,
}) => {
  const actionInfo = resolveNextAction(assessment);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="bulb-outline" size={16} color="#E0316A" />
        </View>
        <Text style={styles.title}>{actionInfo.title}</Text>
      </View>

      {/* Body & Button */}
      <View style={styles.contentRow}>
        <Text style={styles.description}>
          {actionInfo.description}
        </Text>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionInfo.buttonLabel}
        >
          <Text style={styles.actionBtnText}>{actionInfo.buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    padding: 18,
    marginTop: 14,
    shadowColor: '#0E1E36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E1E36',
    letterSpacing: -0.2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  description: {
    flex: 1,
    minWidth: 160,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: '#E0316A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E0316A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
