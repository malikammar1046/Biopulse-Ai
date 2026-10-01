import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShapFactor, getFeatureLabel, getFeatureIconName } from '../../services/assessmentService';

export interface ContributingFactorsCardProps {
  factors?: ShapFactor[];
  isLoading?: boolean;
  onViewDetails?: () => void;
}

/**
 * BioPulse Top Contributing Factors Card
 *
 * Implements:
 * - Real TreeSHAP feature attributions
 * - Automatic conversion from raw technical keys to approved clinical labels
 * - Proportional contribution bars
 * - Bottom scientific analysis info banner
 * - Honest empty state when explainability is unavailable
 * - Built-in Explainability Details Modal for transparent clinical inspection
 */
export const ContributingFactorsCard: React.FC<ContributingFactorsCardProps> = ({
  factors = [],
  isLoading = false,
  onViewDetails,
}) => {
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Compute normalized contribution percentages across top 4 factors
  const topFactors = useMemo(() => {
    if (!factors || factors.length === 0) return [];

    // Filter to top 4 factors
    const sliced = factors.slice(0, 4);

    // Check if explanation_share_percent is already populated
    const hasCanonicalPercent = sliced.some(
      (f) => f.explanation_share_percent !== undefined && f.explanation_share_percent > 0
    );

    if (hasCanonicalPercent) {
      return sliced.map((f) => ({
        ...f,
        displayPercent: Math.round(f.explanation_share_percent ?? 0),
        displayName: getFeatureLabel(f.feature_key, f.patient_label || f.feature_name),
        iconName: getFeatureIconName(f.feature_key),
      }));
    }

    // Otherwise compute relative share from absolute impact_score
    const totalImpact = sliced.reduce((acc, f) => acc + (f.impact_score || 0), 0);

    return sliced.map((f) => {
      const share = totalImpact > 0 ? Math.round(((f.impact_score || 0) / totalImpact) * 100) : 0;
      return {
        ...f,
        displayPercent: share,
        displayName: getFeatureLabel(f.feature_key, f.patient_label || f.feature_name),
        iconName: getFeatureIconName(f.feature_key),
      };
    });
  }, [factors]);

  const handleOpenDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      setDetailsModalVisible(true);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.title}>Top Contributing Factors</Text>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" style={styles.infoIcon} />
        </View>

        <TouchableOpacity
          onPress={handleOpenDetails}
          activeOpacity={0.7}
          style={styles.viewDetailsBtn}
          accessibilityRole="button"
          accessibilityLabel="View contributing factors details"
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={13} color="#E0316A" />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Analyzing biometric and symptom contributions...</Text>
        </View>
      )}

      {/* Honest Empty State if no factors */}
      {!isLoading && topFactors.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="sparkles-outline" size={24} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Feature Explanations Not Ready</Text>
          <Text style={styles.emptyText}>
            TreeSHAP feature attributions are unavailable for this assessment. Review your inputs or check back once processing is complete.
          </Text>
        </View>
      )}

      {/* Factors List */}
      {!isLoading && topFactors.length > 0 && (
        <View style={styles.factorsList}>
          {topFactors.map((factor, idx) => (
            <View key={factor.feature_key || `factor-${idx}`} style={styles.factorRow}>
              {/* Factor Icon */}
              <View style={styles.iconBox}>
                <Ionicons name={factor.iconName} size={16} color="#E0316A" />
              </View>

              {/* Factor Label */}
              <View style={styles.labelCol}>
                <Text style={styles.factorLabel} numberOfLines={1}>
                  {factor.displayName}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressCol}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(5, factor.displayPercent))}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Percentage Text */}
              <Text style={styles.percentText}>{factor.displayPercent}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoCircle}>
          <Ionicons name="information" size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.infoBannerText}>
          These factors are the most influential in your result. They are based on scientific analysis of many similar cases.
        </Text>
      </View>

      {/* Feature Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Contributing Factors Details</Text>
                <Text style={styles.modalSubtitle}>TreeSHAP Algorithmic Explainability</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close details modal"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalExplanation}>
                Our machine learning models use TreeSHAP (SHapley Additive exPlanations) to measure how each piece of health information influenced your statistical screening probability.
              </Text>

              {topFactors.map((f, i) => (
                <View key={`modal-factor-${i}`} style={styles.modalFactorCard}>
                  <View style={styles.modalFactorRow}>
                    <View style={styles.iconBox}>
                      <Ionicons name={f.iconName} size={16} color="#E0316A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalFactorName}>{f.displayName}</Text>
                      <Text style={styles.modalFactorDirection}>
                        {f.direction === 'increases_risk' || f.direction === 'higher' || f.direction === 'positive'
                          ? 'Pushed the screening result higher ↑'
                          : 'Supported a lower screening estimate ↓'}
                      </Text>
                    </View>
                    <Text style={styles.modalFactorPercent}>{f.displayPercent}%</Text>
                  </View>
                  {f.description ? (
                    <Text style={styles.modalFactorDesc}>{f.description}</Text>
                  ) : null}
                </View>
              ))}

              <View style={styles.nonDiagnosticBox}>
                <Ionicons name="shield-outline" size={16} color="#64748B" />
                <Text style={styles.nonDiagnosticText}>
                  SHAP attributions indicate mathematical contribution to the screening score, not a clinical diagnosis or etiology.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E1E36',
    letterSpacing: -0.2,
  },
  infoIcon: {
    marginLeft: 4,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E0316A',
  },
  factorsList: {
    gap: 14,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCol: {
    width: 120,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E1E36',
  },
  progressCol: {
    flex: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#E0316A',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E1E36',
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 10,
    marginTop: 16,
    gap: 8,
  },
  infoCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 15,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 30, 54, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E1E36',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingVertical: 14,
    gap: 12,
  },
  modalExplanation: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  modalFactorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
  },
  modalFactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalFactorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E1E36',
  },
  modalFactorDirection: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalFactorPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E0316A',
  },
  modalFactorDesc: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  nonDiagnosticBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  nonDiagnosticText: {
    flex: 1,
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },
});
