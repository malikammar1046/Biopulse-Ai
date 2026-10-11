import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';

interface EducationTopic {
  id: string;
  badge: string;
  title: string;
  summary: string;
  details: string[];
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

export default function HealthEducationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? '#F43F7D' : '#0284C7';

  const [expandedId, setExpandedId] = useState<string | null>('topic-1');

  const femaleTopics: EducationTopic[] = [
    {
      id: 'topic-1',
      badge: 'Pathophysiology',
      title: 'What is PCOS / PMOS?',
      summary:
        'Polycystic Ovary Syndrome (also known as Polyendocrine Metabolic Ovarian Syndrome, PMOS) is a complex neuro-endocrine and metabolic condition, not solely an ovarian disorder.',
      details: [
        'Rotterdam Consensus Criteria require at least two of the following: 1) Oligo- or anovulation (irregular or absent periods), 2) Hyperandrogenism (clinical signs like hirsutism/acne or elevated biochemical testosterone/DHEA-S), and 3) Polycystic ovarian morphology on ultrasound.',
        'The name "PMOS" highlights that metabolic dysfunction and endocrine signaling imbalances are central drivers, rather than cysts being the primary cause.',
        'BioPulse AI screens statistical risk patterns from your symptom reports and validated clinical biomarkers.',
      ],
      icon: 'sparkles',
      iconColor: '#E11D48',
      iconBg: '#FFE4E6',
    },
    {
      id: 'topic-2',
      badge: 'Metabolic Synergy',
      title: 'The Insulin & Androgen Connection',
      summary:
        'Up to 70–80% of individuals with PCOS have peripheral insulin resistance, which directly exacerbates hormonal dysregulation.',
      details: [
        'Hyperinsulinemia acts directly on the theca cells of the ovaries, stimulating excess androgen (testosterone) synthesis.',
        'Insulin also downregulates liver production of Sex Hormone-Binding Globulin (SHBG), leaving more free, bioactive testosterone circulating in the bloodstream.',
        'Stabilizing postprandial glucose via low-glycemic nutrition and regular movement directly supports hormonal balance.',
      ],
      icon: 'pulse',
      iconColor: '#0D9488',
      iconBg: '#CCFBF1',
    },
    {
      id: 'topic-3',
      badge: 'Key Biomarkers',
      title: 'Hormonal Lab Markers to Understand',
      summary:
        'Key laboratory markers provide objective evidence when evaluating cycle irregularity or androgenic symptoms.',
      details: [
        'FSH & LH: An inverted LH:FSH ratio (e.g., 2:1 or 3:1) often reflects altered hypothalamic GnRH pulsatility.',
        'Total & Free Testosterone / DHEA-S: Quantifies circulating ovarian and adrenal androgen levels.',
        'Fasting Insulin & HOMA-IR: Evaluates metabolic insulin sensitivity before HbA1c abnormalities appear.',
        'Anti-Müllerian Hormone (AMH): Reflects the active follicular pool and is typically elevated in polycystic morphology.',
      ],
      icon: 'flask',
      iconColor: '#7C3AED',
      iconBg: '#F3E8FF',
    },
    {
      id: 'topic-4',
      badge: 'Clinical Care',
      title: 'When to Seek Professional Evaluation',
      summary:
        'BioPulse AI is a screening and educational tool. A medical diagnosis requires a comprehensive physical and clinical laboratory evaluation.',
      details: [
        'Consult a gynecologist or reproductive endocrinologist if you experience prolonged absence of menses (amenorrhea > 3 months) or sudden severe pelvic pain.',
        'Seek medical evaluation for rapidly worsening hirsutism, unexplained rapid weight changes, or difficulty conceiving.',
        'Our Specialists directory connects you to verified practitioners who specialize in metabolic and reproductive health.',
      ],
      icon: 'medkit',
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
    },
  ];

  const maleTopics: EducationTopic[] = [
    {
      id: 'topic-1',
      badge: 'Pathophysiology',
      title: 'What is Male Hypogonadism?',
      summary:
        'Male hypogonadism is an endocrine disorder where the testes fail to produce physiological levels of testosterone, normal sperm concentrations, or both.',
      details: [
        'The condition involves disruption anywhere along the Hypothalamic-Pituitary-Testicular (HPT) axis.',
        'Primary hypogonadism originates from testicular impairment (Leydig cell deficiency), characterized by low testosterone with elevated LH/FSH.',
        'Secondary (central) hypogonadism results from hypothalamic or pituitary signaling dysfunction, characterized by low testosterone with inappropriately normal or low LH/FSH.',
        'Late-Onset Hypogonadism (LOH) is frequently associated with metabolic syndrome, systemic inflammation, and visceral adiposity.',
      ],
      icon: 'fitness',
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
    },
    {
      id: 'topic-2',
      badge: 'Circadian Biology',
      title: 'The Morning Diurnal Rhythm',
      summary:
        'Testosterone secretion follows a strict circadian rhythm, peaking in the early morning hours and declining across the afternoon and evening.',
      details: [
        'Peak physiological synthesis occurs during deep slow-wave sleep and REM cycles between 3:00 AM and 7:00 AM.',
        'Authoritative clinical guidelines mandate that diagnostic serum testosterone blood draws must be performed between 7:00 AM and 10:00 AM in a fasting state.',
        'Chronically disrupted sleep, sleep apnea, or shift work significantly blunts diurnal testosterone pulsatility.',
      ],
      icon: 'sunny',
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
    },
    {
      id: 'topic-3',
      badge: 'Metabolic Synergy',
      title: 'Visceral Fat, Aromatase & Leydig Cells',
      summary:
        'Metabolic health and androgen levels share a bidirectional relationship.',
      details: [
        'Visceral adiposity expresses high concentrations of the aromatase enzyme, which converts bioavailable testosterone into estradiol.',
        'Elevated estradiol provides negative feedback to the hypothalamus and pituitary, further suppressing LH and testosterone output.',
        'Optimizing resistance training, reducing visceral waist circumference, and stabilizing sleep support endogenous Leydig cell steroidogenesis.',
      ],
      icon: 'body',
      iconColor: '#0D9488',
      iconBg: '#CCFBF1',
    },
    {
      id: 'topic-4',
      badge: 'Clinical Care',
      title: 'When to Seek Specialist Evaluation',
      summary:
        'Screening risk scores provide structured clinical context for productive medical appointments.',
      details: [
        'Schedule a clinical consult with an endocrinologist or urologist/andrologist if you experience persistent profound fatigue, loss of morning vitality, unexplained muscle loss, or low libido.',
        'Formal clinical diagnosis requires at least two separate early-morning fasting total testosterone lab tests combined with clinical symptoms.',
        'Do not initiate unsupervised hormonal supplementation without comprehensive endocrine blood work and specialist guidance.',
      ],
      icon: 'medkit',
      iconColor: '#E11D48',
      iconBg: '#FFE4E6',
    },
  ];

  const topics = isFemale ? femaleTopics : maleTopics;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Health Education</Text>
          <Text style={styles.headerSub}>
            {isFemale
              ? "Clinical understanding of PCOS / PMOS, hormonal health, and care guidance."
              : "Clinical understanding of testosterone, the HPT axis, and care guidance."}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pathway Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.pathwayBadge, { backgroundColor: isFemale ? '#FFE4E6' : '#E0F2FE' }]}>
            <Ionicons
              name={isFemale ? 'female' : 'male'}
              size={13}
              color={themeAccent}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.pathwayBadgeText, { color: themeAccent }]}>
              {isFemale ? 'PCOS / PMOS Education Pathway' : 'Male Hypogonadism Education Pathway'}
            </Text>
          </View>
        </View>

        {/* Education Topic Cards Accordion */}
        <View style={styles.topicsList}>
          {topics.map((topic) => {
            const isExpanded = expandedId === topic.id;
            return (
              <View key={topic.id} style={styles.cardContainer}>
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : topic.id)}
                  style={styles.cardHeader}
                  accessibilityRole="button"
                >
                  <View style={[styles.iconBox, { backgroundColor: topic.iconBg }]}>
                    <Ionicons name={topic.icon} size={22} color={topic.iconColor} />
                  </View>

                  <View style={styles.headerTextCol}>
                    <Text style={styles.topicBadge}>{topic.badge}</Text>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748B"
                  />
                </Pressable>

                <Text style={styles.summaryText}>{topic.summary}</Text>

                {isExpanded && (
                  <View style={styles.detailsContainer}>
                    {topic.details.map((point, pIdx) => (
                      <View key={pIdx} style={styles.pointRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={themeAccent}
                          style={{ marginTop: 2, marginRight: 8 }}
                        />
                        <Text style={styles.pointText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Clinical Disclaimer Callout */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={20} color="#0284C7" style={{ marginTop: 2 }} />
          <View style={styles.disclaimerTextWrap}>
            <Text style={styles.disclaimerTitle}>Educational & Guidance Information Only</Text>
            <Text style={styles.disclaimerBody}>
              BioPulse AI educational guides are intended for health literacy and medical consultation preparation. This content does not constitute medical diagnosis, clinical treatment, or prescription therapy. Always discuss your screening observations with a qualified physician.
            </Text>
          </View>
        </View>

        {/* Action CTAs */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push('/(app)/specialists')}
            style={[styles.specialistBtn, { backgroundColor: themeAccent }]}
          >
            <Ionicons name="people-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.specialistBtnText}>Find Specialists</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/screening')}
            style={[styles.screeningBtn, { borderColor: themeAccent }]}
          >
            <Ionicons name="clipboard-outline" size={16} color={themeAccent} style={{ marginRight: 6 }} />
            <Text style={[styles.screeningBtnText, { color: themeAccent }]}>View Screening</Text>
          </Pressable>
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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  badgeRow: {
    marginBottom: 16,
  },
  pathwayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pathwayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topicsList: {
    gap: 14,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  topicBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  summaryText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 10,
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    gap: 10,
  },
  disclaimerTextWrap: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: 11.5,
    color: '#0C4A6E',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  specialistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  specialistBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  screeningBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
  },
  screeningBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
