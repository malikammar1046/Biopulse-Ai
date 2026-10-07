import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveRiskBand, RiskCategory } from '../../services/assessmentService';

export interface PcosRiskProbabilityCardProps {
  probability: number; // 0.0 to 1.0
  riskCategory?: string;
  threshold?: number; // default 0.25
  lowCutoff?: number; // default 0.18
  onInfoPress?: () => void;
}

/**
 * BioPulse PCOS Screening Likelihood Card
 *
 * Implements:
 * - Real returned probability rendering (e.g. 72%)
 * - Canonical likelihood band resolution (Lower / Intermediate / Higher Likelihood)
 * - Semicircular SVG-free gauge with proportional angular indicator
 * - Qualitative likelihood category legend (without exposing internal decision cutoffs)
 * - Explicit non-diagnostic clinical disclaimer
 */
export const PcosRiskProbabilityCard: React.FC<PcosRiskProbabilityCardProps> = ({
  probability,
  riskCategory,
  threshold = 0.25,
  lowCutoff = 0.18,
}) => {
  const band = useMemo(
    () => resolveRiskBand(probability, riskCategory, threshold, lowCutoff),
    [probability, riskCategory, threshold, lowCutoff]
  );

  const probPercent = Math.round(probability * 100);

  // Rotation for semi-circular gauge: from -90deg (0%) to 90deg (100%)
  const clampedProb = Math.max(0, Math.min(1, probability));
  const gaugeAngle = -90 + clampedProb * 180;

  return (
    <View style={styles.card}>
      <View style={styles.rowLayout}>
        {/* Left Column: Probability & Classification */}
        <View style={styles.leftCol}>
          {/* Header with Shield Icon */}
          <View style={styles.headerRow}>
            <View style={styles.shieldIconBadge}>
              <Ionicons name="shield-checkmark-outline" size={17} color="#E0316A" />
            </View>
            <Text style={styles.cardTitle}>Estimated Screening Likelihood</Text>
            <Ionicons name="information-circle-outline" size={16} color="#64748B" style={styles.infoIcon} />
          </View>

          {/* Large Stat & Pill Badge */}
          <View style={styles.statRow}>
            <Text style={[styles.statValue, { color: band.color }]}>{probPercent}%</Text>
            <View style={[styles.riskPill, { backgroundColor: band.badgeBg, borderColor: band.badgeBorder }]}>
              <Text style={[styles.riskPillText, { color: band.badgeTextColor }]}>{band.label}</Text>
            </View>
          </View>

          {/* Subtitle / Descriptive Copy */}
          <Text style={styles.summaryText}>
            Your responses indicate a <Text style={{ fontWeight: '700', color: band.color }}>{band.category} likelihood</Text> of PCOS.
          </Text>
          <Text style={styles.disclaimerText}>
            This is a screening result, not a medical diagnosis.
          </Text>
        </View>

        {/* Right Column: Semicircular Gauge & Legend */}
        <View style={styles.rightCol}>
          <View style={styles.gaugeContainer}>
            {/* Semicircular Arch Outer Track */}
            <View style={styles.archWrapper}>
              <View style={styles.archBackground} />
              {/* Colored active fill arc */}
              <View
                style={[
                  styles.archFill,
                  {
                    borderTopColor: band.color,
                    borderRightColor: clampedProb > 0.5 ? band.color : 'transparent',
                    transform: [{ rotate: `${gaugeAngle}deg` }],
                  },
                ]}
              />
              {/* Center Readout inside arch */}
              <View style={styles.archCenterContent}>
                <Text style={styles.archPercentText}>{probPercent}%</Text>
                <Text style={[styles.archLabelText, { color: band.color }]}>{band.label}</Text>
              </View>
            </View>
          </View>

          {/* Gauge Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendLabel}>Lower</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendLabel}>Intermediate</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E0316A' }]} />
              <Text style={styles.legendLabel}>Higher</Text>
            </View>
          </View>
        </View>
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
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  leftCol: {
    flex: 1,
    minWidth: 160,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shieldIconBadge: {
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E1E36',
    letterSpacing: -0.2,
  },
  infoIcon: {
    marginLeft: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
  },
  riskPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'normal',
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  gaugeContainer: {
    width: 130,
    height: 68,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  archWrapper: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 11,
    borderColor: '#F1F5F9',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 63,
    borderWidth: 11,
    borderColor: '#EAECEF',
  },
  archFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 63,
    borderWidth: 11,
    borderColor: 'transparent',
  },
  archCenterContent: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
  },
  archPercentText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E1E36',
    letterSpacing: -0.5,
  },
  archLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: -1,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 150,
    marginTop: 8,
    paddingTop: 4,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  legendThreshold: {
    fontSize: 8.5,
    color: '#94A3B8',
    marginTop: 1,
  },
});
