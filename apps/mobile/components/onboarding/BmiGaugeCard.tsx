import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface BmiGaugeCardProps {
  heightCm: number;
  weightKg: number;
}

export interface BmiClassification {
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  label: string;
  badgeBg: string;
  badgeText: string;
}

/**
 * BioPulse Dynamic Body Mass Index (BMI) Visual Gauge Card
 *
 * Implements:
 * - Dynamic BMI computation = weight_kg / (height_m ^ 2)
 * - WHO / Rotterdam standard classification boundaries (18.5, 24.9, 30.0)
 * - Visual multi-zone color bar with dynamic pointer marker
 * - Reactive update as height and weight change
 */
export const BmiGaugeCard: React.FC<BmiGaugeCardProps> = ({ heightCm, weightKg }) => {
  const { bmi, bmiFormatted, classification, pointerPercent } = useMemo(() => {
    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return {
        bmi: 22.1,
        bmiFormatted: '22.1',
        classification: {
          category: 'Normal' as const,
          label: 'Normal',
          badgeBg: '#E0F2FE',
          badgeText: '#0284C7',
        },
        pointerPercent: 35.5,
      };
    }

    const heightM = heightCm / 100;
    const rawBmi = weightKg / (heightM * heightM);
    const roundedBmi = Math.round(rawBmi * 10) / 10;
    const formatted = roundedBmi.toFixed(1);

    let cls: BmiClassification;
    if (roundedBmi < 18.5) {
      cls = {
        category: 'Underweight',
        label: 'Underweight',
        badgeBg: '#FEF3C7',
        badgeText: '#D97706',
      };
    } else if (roundedBmi <= 24.9) {
      cls = {
        category: 'Normal',
        label: 'Normal',
        badgeBg: '#E0F2FE',
        badgeText: '#0284C7',
      };
    } else if (roundedBmi <= 29.9) {
      cls = {
        category: 'Overweight',
        label: 'Overweight',
        badgeBg: '#FEE2E2',
        badgeText: '#DC2626',
      };
    } else {
      cls = {
        category: 'Obese',
        label: 'High Risk',
        badgeBg: '#FFE4E6',
        badgeText: '#BE123C',
      };
    }

    // Clamp pointer between 15 and 35 for gauge positioning (0% to 100%)
    const minGauge = 15;
    const maxGauge = 35;
    const clamped = Math.min(Math.max(roundedBmi, minGauge), maxGauge);
    const percent = ((clamped - minGauge) / (maxGauge - minGauge)) * 100;

    return {
      bmi: roundedBmi,
      bmiFormatted: formatted,
      classification: cls,
      pointerPercent: percent,
    };
  }, [heightCm, weightKg]);

  return (
    <View style={styles.cardContainer}>
      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name="bar-chart-outline" size={17} color={BioPulseColors.femaleAccent} />
      </View>

      {/* Main Info Column */}
      <View style={styles.contentColumn}>
        <Text style={styles.cardHeaderTitle}>Body Mass Index (BMI)</Text>

        <View style={styles.bmiNumberRow}>
          <Text style={styles.bmiValue}>{bmiFormatted}</Text>
          <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
          <View style={[styles.statusBadge, { backgroundColor: classification.badgeBg }]}>
            <Text style={[styles.statusBadgeText, { color: classification.badgeText }]}>
              {classification.label}
            </Text>
          </View>
        </View>

        <Text style={styles.healthyRangeText}>Normal range (18.5 – 24.9)</Text>
      </View>

      {/* Visual Gauge on Right */}
      <View style={styles.gaugeContainer}>
        {/* Dynamic Pointer Arrow */}
        <View style={styles.pointerTrack}>
          <View
            style={[
              styles.pointerArrowWrap,
              { left: `${Math.min(Math.max(pointerPercent, 4), 96)}%` },
            ]}
          >
            <View style={styles.downTriangle} />
          </View>
        </View>

        {/* Multi-zone Color Bar */}
        <View style={styles.gaugeBar}>
          <View style={[styles.gaugeSegment, styles.segmentUnderweight]} />
          <View style={[styles.gaugeSegment, styles.segmentNormal]} />
          <View style={[styles.gaugeSegment, styles.segmentOverweight]} />
        </View>

        {/* Range Labels underneath */}
        <View style={styles.rangeLabelsRow}>
          <Text style={styles.tickText}>18.5</Text>
          <Text style={styles.tickText}>24.9</Text>
          <Text style={styles.tickText}>30</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1D5DF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 30,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contentColumn: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  bmiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bmiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: BioPulseColors.navy,
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  healthyRangeText: {
    fontSize: 11,
    color: '#8BA1B7',
    marginTop: 2,
  },
  gaugeContainer: {
    width: 120,
    alignItems: 'center',
    marginLeft: 8,
  },
  pointerTrack: {
    width: '100%',
    height: 10,
    position: 'relative',
    marginBottom: 2,
  },
  pointerArrowWrap: {
    position: 'absolute',
    marginLeft: -5,
    top: 0,
    alignItems: 'center',
  },
  downTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: BioPulseColors.navy,
  },
  gaugeBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gaugeSegment: {
    height: '100%',
  },
  segmentUnderweight: {
    flex: 17.5,
    backgroundColor: '#FCE7F0',
  },
  segmentNormal: {
    flex: 32,
    backgroundColor: '#2DD4BF',
  },
  segmentOverweight: {
    flex: 50.5,
    backgroundColor: '#FDA4AF',
  },
  rangeLabelsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  tickText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
