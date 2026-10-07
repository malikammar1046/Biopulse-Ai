import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

interface ChartPoint {
  month: string;
  value: number;
}

interface MetricConfig {
  title: string;
  current: string;
  changeValue: string;
  changePct: string;
  previous: string;
  dateRange: string;
  highest: string;
  lowest: string;
  unit: string;
  yTicks: number[];
  yMin: number;
  yMax: number;
  chartPoints: ChartPoint[];
  activePointIdx: number;
  activeTooltipVal: string;
  activeTooltipDate: string;
  whatChanged: string;
  themeColor: string;
  themeBg: string;
  themeBorder: string;
}

/**
 * Metric Line Chart Component
 * Draws gridlines, dynamic line segments connecting points,
 * guideline, marker dot, and tooltip badge matching Screenshot 33.
 */
function DynamicMetricChart({
  yTicks,
  yMin,
  yMax,
  points,
  activeIdx,
  tooltipVal,
  tooltipDate,
  lineColor,
}: {
  yTicks: number[];
  yMin: number;
  yMax: number;
  points: ChartPoint[];
  activeIdx: number;
  tooltipVal: string;
  tooltipDate: string;
  lineColor: string;
}) {
  const chartHeight = 150;

  // Calculate normalized points (x% and y in px)
  const plotCoords = useMemo(() => {
    const range = yMax - yMin || 1;
    return points.map((p, idx) => {
      const xPct = (idx / (points.length - 1)) * 88 + 6; // range from 6% to 94%
      // 0 at top, chartHeight at bottom
      const normalizedY = 1 - (p.value - yMin) / range;
      const yPx = Math.max(12, Math.min(chartHeight - 14, normalizedY * (chartHeight - 24) + 12));
      return { xPct, yPx, month: p.month };
    });
  }, [points, yMin, yMax]);

  const activeCoord = plotCoords[activeIdx] || plotCoords[plotCoords.length - 1];

  return (
    <View style={styles.chartWrapper}>
      <View style={[styles.chartBody, { height: chartHeight }]}>
        {/* Left Y-axis ticks */}
        <View style={styles.yAxisCol}>
          {yTicks.map((tick, i) => (
            <Text key={i} style={styles.yTickText}>
              {tick}
            </Text>
          ))}
        </View>

        {/* Plot Area */}
        <View style={styles.plotArea}>
          {/* Horizontal Gridlines */}
          {yTicks.map((_, i) => (
            <View
              key={i}
              style={[
                styles.gridline,
                { top: `${(i / (yTicks.length - 1)) * 100}%` },
              ]}
            />
          ))}

          {/* Line Segments connecting points */}
          {plotCoords.slice(0, -1).map((curr, idx) => {
            const next = plotCoords[idx + 1];
            // We calculate line segment between curr and next
            // In percent-based layout, we approximate with overlapping segments
            return (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${curr.xPct}%`,
                  top: Math.min(curr.yPx, next.yPx),
                  width: `${next.xPct - curr.xPct}%`,
                  height: Math.max(Math.abs(next.yPx - curr.yPx), 2),
                }}
              >
                {/* Visual Line */}
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: curr.yPx <= next.yPx ? 0 : '100%',
                    width: '100%',
                    height: 2,
                    backgroundColor: lineColor,
                    borderRadius: 1,
                    transform: [
                      {
                        rotate: `${
                          Math.atan2(next.yPx - curr.yPx, 60) * (180 / Math.PI)
                        }deg`,
                      },
                    ],
                  }}
                />
              </View>
            );
          })}

          {/* Active Point Guideline */}
          <View
            style={[
              styles.guideline,
              {
                left: `${activeCoord.xPct}%`,
                top: activeCoord.yPx,
                bottom: 0,
              },
            ]}
          />

          {/* Active Point Dot */}
          <View
            style={[
              styles.plotDot,
              {
                left: `${activeCoord.xPct}%`,
                top: activeCoord.yPx - 4,
                backgroundColor: lineColor,
              },
            ]}
          />

          {/* Tooltip Badge */}
          <View
            style={[
              styles.tooltipBadge,
              {
                left: `${Math.max(10, Math.min(72, activeCoord.xPct - 14))}%`,
                top: Math.max(0, activeCoord.yPx - 42),
              },
            ]}
          >
            <Text style={styles.tooltipVal}>{tooltipVal}</Text>
            <Text style={styles.tooltipDate}>{tooltipDate}</Text>
          </View>
        </View>
      </View>

      {/* X-axis Month Labels */}
      <View style={styles.xAxisRow}>
        {points.map((p, idx) => (
          <Text key={idx} style={styles.xMonthText}>
            {p.month}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * SCREEN 33: METRIC DETAIL
 *
 * Strict visual match to Screenshot 33 (Weight, Testosterone, Symptoms):
 * - Header: Back chevron (<), centered metric title
 * - Range selector pills: [ 1M ], [ 3M ] (active solid blue pill), [ 6M ], [ 1Y ]
 * - 3 Summary stat boxes in a single container with vertical dividers:
 *   - Current (76 kg / 320 ng/dL / 2.1 / 10)
 *   - Change (↓ 3 kg (-3.8%) / ↑ 58 ng/dL (+22%) / ↓ 3.4 (-62%))
 *   - Previous (79 kg / 262 ng/dL / 5.5 / 10)
 * - Detailed Line Chart Card:
 *   - Y-axis scale benchmarks
 *   - Horizontal grid lines
 *   - Continuous curve with tooltip marker ("76 kg\n10 Mar 2026")
 *   - X-axis month ticks: Jan, Feb, Mar, Apr
 * - Details rows in a clean white card:
 *   - Date Range (Jan 2026 - Mar 2026)
 *   - Highest
 *   - Lowest
 * - Bottom "What changed?" Interpretation Box:
 *   - Lightbulb icon & clear concise clinical explanation
 */
export default function MetricDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const params = useLocalSearchParams<{ metric?: string }>();
  const metricKey = params.metric || 'weight';

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const { profile, screening } = useHealthStore();

  const [activeRange, setActiveRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');

  // Config mapping for all supported metrics
  const metricConfigs: Record<string, MetricConfig> = useMemo(() => ({
    weight: {
      title: 'Weight Progress',
      current: `${profile.weightKg || (isFemale ? 64 : 76)} kg`,
      changeValue: '↓ 3 kg',
      changePct: '(-3.8%)',
      previous: `${(profile.weightKg || (isFemale ? 64 : 76)) + 3} kg`,
      dateRange: 'Jan 2026 – Mar 2026',
      highest: '82 kg',
      lowest: '76 kg',
      unit: 'kg',
      yTicks: [85, 80, 75, 70],
      yMin: 70,
      yMax: 85,
      chartPoints: [
        { month: 'Jan', value: 80 },
        { month: 'Feb', value: 78.5 },
        { month: 'Mar', value: 76 },
        { month: 'Apr', value: 76.5 },
      ],
      activePointIdx: 2,
      activeTooltipVal: '76 kg',
      activeTooltipDate: '10 Mar 2026',
      whatChanged:
        'Your weight has decreased by 3 kg over the last 3 months. This may be related to improved activity levels and dietary changes.',
      themeColor: '#0284C7',
      themeBg: '#F0F9FF',
      themeBorder: '#BAE6FD',
    },
    testosterone: {
      title: 'Testosterone Progress',
      current: '320 ng/dL',
      changeValue: '↑ 58 ng/dL',
      changePct: '(+22%)',
      previous: '262 ng/dL',
      dateRange: 'Jan 2026 – Mar 2026',
      highest: '328 ng/dL',
      lowest: '248 ng/dL',
      unit: 'ng/dL',
      yTicks: [400, 300, 200, 100],
      yMin: 100,
      yMax: 400,
      chartPoints: [
        { month: 'Jan', value: 200 },
        { month: 'Feb', value: 230 },
        { month: 'Mar', value: 320 },
        { month: 'Apr', value: 330 },
      ],
      activePointIdx: 2,
      activeTooltipVal: '320 ng/dL',
      activeTooltipDate: '12 Mar 2026',
      whatChanged:
        'Your testosterone level has increased by 22% over the last 3 months, which may be associated with improved activity, sleep and overall lifestyle habits.',
      themeColor: '#0284C7',
      themeBg: '#F0F9FF',
      themeBorder: '#BAE6FD',
    },
    symptoms: {
      title: 'Symptom Severity',
      current: '2.1 / 10',
      changeValue: '↓ 3.4',
      changePct: '(-62%)',
      previous: '5.5 / 10',
      dateRange: 'Jan 2026 – Mar 2026',
      highest: '6.8',
      lowest: '2.1',
      unit: '/10',
      yTicks: [10, 7.5, 5, 2.5, 0],
      yMin: 0,
      yMax: 10,
      chartPoints: [
        { month: 'Jan', value: 7.5 },
        { month: 'Feb', value: 5.2 },
        { month: 'Mar', value: 2.1 },
        { month: 'Apr', value: 2.0 },
      ],
      activePointIdx: 2,
      activeTooltipVal: '2.1',
      activeTooltipDate: '10 Mar 2026',
      whatChanged:
        'Your symptom severity has decreased over the last 3 months. This may be associated with lifestyle changes and consistent tracking.',
      themeColor: '#EC4899',
      themeBg: '#FDF2F8',
      themeBorder: '#FCE7F3',
    },
    screening: {
      title: 'Screening History',
      current: `${screening.probabilityPercent || 38}%`,
      changeValue: '↓ 12%',
      changePct: '(-24%)',
      previous: '50%',
      dateRange: 'Jan 2026 – Mar 2026',
      highest: '54%',
      lowest: '38%',
      unit: '%',
      yTicks: [60, 45, 30, 15],
      yMin: 15,
      yMax: 60,
      chartPoints: [
        { month: 'Jan', value: 52 },
        { month: 'Feb', value: 48 },
        { month: 'Mar', value: 38 },
        { month: 'Apr', value: 37 },
      ],
      activePointIdx: 2,
      activeTooltipVal: `${screening.probabilityPercent || 38}%`,
      activeTooltipDate: '12 Mar 2026',
      whatChanged:
        'Your screening risk has steadily decreased following favorable changes in body composition and symptom severity.',
      themeColor: '#0284C7',
      themeBg: '#F0F9FF',
      themeBorder: '#BAE6FD',
    },
    cycle: {
      title: 'Cycle Regularity',
      current: '28 Days',
      changeValue: '↑ 2 days',
      changePct: '(Regular)',
      previous: '35 Days',
      dateRange: 'Jan 2026 – Mar 2026',
      highest: '38 Days',
      lowest: '28 Days',
      unit: 'days',
      yTicks: [40, 35, 30, 25],
      yMin: 25,
      yMax: 40,
      chartPoints: [
        { month: 'Jan', value: 36 },
        { month: 'Feb', value: 33 },
        { month: 'Mar', value: 28 },
        { month: 'Apr', value: 28 },
      ],
      activePointIdx: 2,
      activeTooltipVal: '28 Days',
      activeTooltipDate: '14 Sep 2026',
      whatChanged:
        'Your cycle rhythm has normalized closer to the 28-day benchmark, correlating with improved insulin sensitivity.',
      themeColor: '#F43F7D',
      themeBg: '#FDF2F8',
      themeBorder: '#FCE7F3',
    },
  }), [profile.weightKg, isFemale, screening.probabilityPercent]);

  const activeConfig = metricConfigs[metricKey] || metricConfigs.weight;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <Text style={styles.headerTitle}>{activeConfig.title}</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={styles.rangeRow}>
          {(['1M', '3M', '6M', '1Y'] as const).map((r) => {
            const isSelected = activeRange === r;
            return (
              <Pressable
                key={r}
                onPress={() => setActiveRange(r)}
                style={[styles.rangePill, isSelected && styles.rangePillActive]}
              >
                <Text style={[styles.rangeText, isSelected && styles.rangeTextActive]}>
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3 Summary Stat Boxes in a Single Container */}
        <View style={styles.summaryContainer}>
          {/* Current */}
          <View style={styles.summaryCol}>
            <Text style={styles.boxLabel}>Current</Text>
            <Text style={styles.boxVal}>{activeConfig.current}</Text>
          </View>

          <View style={styles.summaryDivider} />

          {/* Change */}
          <View style={styles.summaryCol}>
            <Text style={styles.boxLabel}>Change</Text>
            <Text style={styles.boxChangeVal}>
              {activeConfig.changeValue}
            </Text>
            <Text style={styles.boxChangePct}>{activeConfig.changePct}</Text>
          </View>

          <View style={styles.summaryDivider} />

          {/* Previous */}
          <View style={styles.summaryCol}>
            <Text style={styles.boxLabel}>Previous</Text>
            <Text style={styles.boxVal}>{activeConfig.previous}</Text>
          </View>
        </View>

        {/* Detailed Line Chart Card */}
        <View style={styles.chartCard}>
          <DynamicMetricChart
            yTicks={activeConfig.yTicks}
            yMin={activeConfig.yMin}
            yMax={activeConfig.yMax}
            points={activeConfig.chartPoints}
            activeIdx={activeConfig.activePointIdx}
            tooltipVal={activeConfig.activeTooltipVal}
            tooltipDate={activeConfig.activeTooltipDate}
            lineColor={activeConfig.themeColor}
          />
        </View>

        {/* Metric Details Breakdown */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Date Range</Text>
            </View>
            <Text style={styles.detailVal}>{activeConfig.dateRange}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconRow}>
              <Ionicons name="water-outline" size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Highest</Text>
            </View>
            <Text style={styles.detailVal}>{activeConfig.highest}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconRow}>
              <Ionicons name="water-outline" size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Lowest</Text>
            </View>
            <Text style={styles.detailVal}>{activeConfig.lowest}</Text>
          </View>
        </View>

        {/* "What changed?" Interpretation Card */}
        <View
          style={[
            styles.whatChangedCard,
            { backgroundColor: activeConfig.themeBg, borderColor: activeConfig.themeBorder },
          ]}
        >
          <View style={styles.whatChangedHeader}>
            <View style={[styles.bulbIconBox, { backgroundColor: '#FFFFFF' }]}>
              <Ionicons name="bulb-outline" size={18} color={activeConfig.themeColor} />
            </View>
            <Text style={styles.whatChangedTitle}>What changed?</Text>
          </View>

          <Text style={styles.whatChangedDesc}>{activeConfig.whatChanged}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabletContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Range Selector
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  rangePillActive: {
    backgroundColor: '#0284C7',
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 3 Summary Columns
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  boxVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  boxChangeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  boxChangePct: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 1,
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  chartWrapper: {
    width: '100%',
  },
  chartBody: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  yAxisCol: {
    width: 32,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  yTickText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  plotArea: {
    flex: 1,
    position: 'relative',
    marginLeft: 4,
  },
  gridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  guideline: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  plotDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  tooltipBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  tooltipVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  tooltipDate: {
    fontSize: 9,
    color: '#94A3B8',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 36,
    paddingRight: 6,
    marginTop: 10,
  },
  xMonthText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // Details List
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 4,
  },

  // What Changed Card
  whatChangedCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  whatChangedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bulbIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatChangedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  whatChangedDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
});
