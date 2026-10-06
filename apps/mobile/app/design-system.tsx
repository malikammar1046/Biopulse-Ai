import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useThemeColor';
import { Spacing, BorderRadius, Shadows } from '../constants/Layout';
import {
  Typography,
  Button,
  IconButton,
  Card,
  Surface,
  Input,
  TextArea,
  Badge,
  Chip,
  Divider,
  Avatar,
  Progress,
  LoadingIndicator,
  EmptyState,
  ErrorState,
  SectionHeader,
} from '../components/ui';

export default function DesignSystemScreen() {
  const router = useRouter();
  const { theme, colorScheme } = useTheme();

  // Interactive component states for demonstration
  const [selectedChips, setSelectedChips] = useState<string[]>(['follicular', 'sleep']);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [progressVal, setProgressVal] = useState(68);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [showFullError, setShowFullError] = useState(false);

  const toggleChip = (chipId: string) => {
    setSelectedChips((prev) =>
      prev.includes(chipId)
        ? prev.filter((id) => id !== chipId)
        : [...prev, chipId]
    );
  };

  const handleSimulateLoad = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Badge
            label={`OVASense UI Engine • ${colorScheme.toUpperCase()} MODE`}
            variant="primary"
            badgeStyle="soft"
            showDot
          />
          <Typography variant="display" style={styles.title}>
            Design System
          </Typography>
          <Typography variant="body" color={theme.textSecondary}>
            Production token system, accessible components, and non-diagnostic
            health-information semantics.
          </Typography>
        </View>

        {/* BioPulse Launch Screen Showcase Card */}
        <Card variant="standard" style={styles.launchCard}>
          <View style={styles.launchCardHeader}>
            <Badge label="Active • Startup Route" variant="primary" badgeStyle="soft" />
            <Text style={styles.launchCardSubtext}>BioPulse AI</Text>
          </View>
          <Typography variant="h3" style={styles.launchCardTitle}>
            BioPulse AI Launch Experience
          </Typography>
          <Typography variant="bodySmall" color={theme.textSecondary} style={styles.launchCardBody}>
            Dual-pathway personalized healthcare launch screen for PCOS and Endocrine monitoring.
          </Typography>
          <View style={{ gap: 8, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label="Launch"
                variant="outline"
                size="sm"
                onPress={() => router.push({ pathname: '/', params: { preview: 'true' } })}
                style={{ flex: 1 }}
              />
              <Button
                label="Onboarding"
                variant="outline"
                size="sm"
                onPress={() => router.push('/onboarding')}
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label="Login (Screen 3)"
                variant="outline"
                size="sm"
                onPress={() => router.push('/(auth)/login')}
                style={{ flex: 1 }}
              />
              <Button
                label="Sign Up (Screen 4)"
                variant="primary"
                size="sm"
                onPress={() => router.push('/(auth)/register')}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Card>

        <Divider spacing="lg" />

        {/* 1. Brand Palette & Color Swatches */}
        <SectionHeader
          title="1. Brand Palette & Hierarchy"
          subtitle="Deep Orchid, Lavender, Berry, Blush, and Soft Lilac neutrals"
        />

        <View style={styles.colorGrid}>
          <ColorSwatch
            label="Primary"
            hex={theme.primary}
            subtext="Deep Orchid (Brand)"
            textColor="#FFFFFF"
          />
          <ColorSwatch
            label="Primary Soft"
            hex={theme.primarySoft}
            subtext="Misty Lavender (Surfaces)"
            textColor={theme.primary}
          />
          <ColorSwatch
            label="Secondary"
            hex={theme.secondary}
            subtext="Rich Berry (Accent)"
            textColor="#FFFFFF"
          />
          <ColorSwatch
            label="Accent"
            hex={theme.accent}
            subtext="Warm Blush (Empathy)"
            textColor="#FFFFFF"
          />
        </View>

        <View style={styles.colorGrid}>
          <ColorSwatch
            label="Success"
            hex={theme.success}
            subtext="Information Complete"
            textColor="#FFFFFF"
          />
          <ColorSwatch
            label="Warning"
            hex={theme.warning}
            subtext="Attention Required"
            textColor="#FFFFFF"
          />
          <ColorSwatch
            label="Error"
            hex={theme.error}
            subtext="Review Needed"
            textColor="#FFFFFF"
          />
          <ColorSwatch
            label="Info"
            hex={theme.info}
            subtext="Health Guideline"
            textColor="#FFFFFF"
          />
        </View>

        {/* 60-25-10-5 Visual Ratio Card */}
        <Card variant="subtle" style={styles.ratioCard}>
          <Typography variant="label" color={theme.textMuted}>
            60-25-10-5 VISUAL DISTRIBUTION
          </Typography>
          <View style={styles.ratioBar}>
            <View style={[styles.ratioSegment, { flex: 60, backgroundColor: theme.surfaceSubtle }]} />
            <View style={[styles.ratioSegment, { flex: 25, backgroundColor: theme.primary }]} />
            <View style={[styles.ratioSegment, { flex: 10, backgroundColor: theme.secondary }]} />
            <View style={[styles.ratioSegment, { flex: 5, backgroundColor: theme.accent }]} />
          </View>
          <View style={styles.ratioLabels}>
            <Typography variant="caption" color={theme.textSecondary}>60% Neutral</Typography>
            <Typography variant="caption" color={theme.primary}>25% Orchid</Typography>
            <Typography variant="caption" color={theme.secondary}>10% Berry</Typography>
            <Typography variant="caption" color={theme.accent}>5% Blush</Typography>
          </View>
        </Card>

        <Divider spacing="xl" />

        {/* 2. Typography Scale */}
        <SectionHeader
          title="2. Typography Hierarchy"
          subtitle="Accessible, clinical-grade legibility with Deep Plum contrast"
        />

        <Card variant="standard">
          <Typography variant="display">Display — 34pt</Typography>
          <Typography variant="h1" style={styles.typoItem}>Heading 1 — 28pt</Typography>
          <Typography variant="h2" style={styles.typoItem}>Heading 2 — 22pt</Typography>
          <Typography variant="h3" style={styles.typoItem}>Heading 3 — 18pt</Typography>
          <Typography variant="title" style={styles.typoItem}>Title — 17pt</Typography>
          <Typography variant="subtitle" style={styles.typoItem}>Subtitle — 15pt</Typography>
          <Typography variant="body" style={styles.typoItem}>Body — 15pt Standard reading text</Typography>
          <Typography variant="bodySmall" style={styles.typoItem}>Body Small — 13pt Supplementary copy</Typography>
          <Typography variant="label" style={styles.typoItem}>LABEL — 12pt UPPERCASE</Typography>
          <Typography variant="caption" style={styles.typoItem}>Caption — 11pt Metadata & footnotes</Typography>
          <Typography variant="button" style={styles.typoItem}>Button — 15pt Semibold</Typography>
        </Card>

        <Divider spacing="xl" />

        {/* 3. Buttons & Icon Buttons */}
        <SectionHeader
          title="3. Buttons & Actions"
          subtitle="Reanimated spring press physics, touch target ≥ 44pt"
        />

        <View style={styles.buttonStack}>
          <Button
            label={buttonLoading ? 'Updating...' : 'Primary Action'}
            variant="primary"
            loading={buttonLoading}
            onPress={handleSimulateLoad}
          />
          <Button
            label="Secondary Soft Action"
            variant="secondary"
            onPress={() => {}}
          />
          <Button
            label="Outline Button"
            variant="outline"
            onPress={() => {}}
          />
          <Button
            label="Ghost Action"
            variant="ghost"
            onPress={() => {}}
          />
          <Button
            label="Destructive / Reset"
            variant="destructive"
            onPress={() => {}}
          />
        </View>

        <Typography variant="label" color={theme.textMuted} style={styles.subhead}>
          BUTTON SIZES & DISABLED STATE
        </Typography>

        <View style={styles.rowWrap}>
          <Button label="Small (36pt)" size="sm" variant="primary" style={styles.mrSm} />
          <Button label="Medium (48pt)" size="md" variant="secondary" style={styles.mrSm} />
          <Button label="Disabled" size="md" disabled variant="primary" />
        </View>

        <Typography variant="label" color={theme.textMuted} style={styles.subhead}>
          ICON BUTTONS (44x44pt ACCESSIBLE)
        </Typography>

        <View style={styles.rowWrap}>
          <IconButton
            variant="primary"
            accessibilityLabel="Add health log"
            icon={<Text style={{ color: '#FFFFFF', fontSize: 20 }}>+</Text>}
          />
          <IconButton
            variant="secondary"
            accessibilityLabel="Filter health insights"
            icon={<Text style={{ color: theme.primary, fontSize: 18 }}>⚡</Text>}
          />
          <IconButton
            variant="outline"
            accessibilityLabel="Share report"
            icon={<Text style={{ color: theme.primary, fontSize: 18 }}>↗</Text>}
          />
          <IconButton
            variant="subtle"
            accessibilityLabel="Settings"
            icon={<Text style={{ color: theme.textPrimary, fontSize: 18 }}>⚙</Text>}
          />
          <IconButton
            variant="ghost"
            accessibilityLabel="Notifications"
            icon={<Text style={{ color: theme.textSecondary, fontSize: 18 }}>🔔</Text>}
          />
        </View>

        <Divider spacing="xl" />

        {/* 4. Cards & Surfaces */}
        <SectionHeader
          title="4. Cards & Surfaces"
          subtitle="Organic curvature, gentle elevation, non-distracting glass borders"
        />

        <View style={styles.cardStack}>
          <Card variant="standard">
            <Typography variant="title">Standard Surface Card</Typography>
            <Typography variant="body" color={theme.textSecondary} style={styles.mtXs}>
              Default card container for metrics, logs, and information summaries.
            </Typography>
          </Card>

          <Card variant="elevated">
            <Typography variant="title">Elevated Card</Typography>
            <Typography variant="body" color={theme.textSecondary} style={styles.mtXs}>
              High-priority card with soft shadow for highlighted health insights.
            </Typography>
          </Card>

          <Card
            variant="subtle"
            onPress={() => alert('Card pressed!')}
            accessibilityLabel="Interactive card demo"
          >
            <Typography variant="title">Interactive Subtle Card (Press Me)</Typography>
            <Typography variant="body" color={theme.textSecondary} style={styles.mtXs}>
              Muted background with tactile spring animation on tap.
            </Typography>
          </Card>
        </View>

        <Divider spacing="xl" />

        {/* 5. Inputs & TextAreas */}
        <SectionHeader
          title="5. Form Inputs & TextAreas"
          subtitle="Accessible labels, active focus state, error alerts, password toggles"
        />

        <Input
          label="Health Metric Note"
          placeholder="e.g. Energy level, sleep quality"
          helperText="Enter personal observations for your longitudinal record"
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            if (text.length > 0 && text.length < 3) {
              setInputError('Please enter at least 3 characters');
            } else {
              setInputError('');
            }
          }}
          errorText={inputError}
        />

        <Input
          label="Access Key (Password Toggle)"
          placeholder="Enter secure passcode"
          showPasswordToggle
          secureTextEntry
        />

        <TextArea
          label="Detailed Observation Log"
          placeholder="Record notes about your symptoms, routine, or physician advice..."
          value={textAreaValue}
          onChangeText={setTextAreaValue}
          maxLength={150}
          showCharacterCount
        />

        <Divider spacing="xl" />

        {/* 6. Badges & Status Chips */}
        <SectionHeader
          title="6. Status Badges & Chips"
          subtitle="Non-diagnostic health information terminology with follicle indicator dots"
        />

        <Typography variant="label" color={theme.textMuted} style={styles.subhead}>
          STATUS BADGES (SOFT / SOLID)
        </Typography>

        <View style={styles.badgeGrid}>
          <Badge label="Information" variant="info" showDot />
          <Badge label="Completed" variant="success" showDot />
          <Badge label="Attention" variant="warning" showDot />
          <Badge label="Needs Review" variant="error" showDot />
          <Badge label="Primary" variant="primary" showDot />
          <Badge label="Neutral" variant="neutral" />
        </View>

        <View style={[styles.badgeGrid, styles.mtSm]}>
          <Badge label="Solid Completed" variant="success" badgeStyle="solid" />
          <Badge label="Solid Attention" variant="warning" badgeStyle="solid" />
          <Badge label="Solid Review" variant="error" badgeStyle="solid" />
        </View>

        <Typography variant="label" color={theme.textMuted} style={styles.subhead}>
          INTERACTIVE FILTER CHIPS
        </Typography>

        <View style={styles.rowWrap}>
          <Chip
            label="Follicular Phase"
            selected={selectedChips.includes('follicular')}
            variant="primary"
            onPress={() => toggleChip('follicular')}
            style={styles.mrSm}
          />
          <Chip
            label="Sleep Pattern"
            selected={selectedChips.includes('sleep')}
            variant="info"
            onPress={() => toggleChip('sleep')}
            style={styles.mrSm}
          />
          <Chip
            label="Metabolic Log"
            selected={selectedChips.includes('metabolic')}
            variant="success"
            onPress={() => toggleChip('metabolic')}
            style={styles.mrSm}
          />
          <Chip
            label="Nutrition"
            selected={selectedChips.includes('nutrition')}
            variant="neutral"
            onPress={() => toggleChip('nutrition')}
          />
        </View>

        <Divider spacing="xl" />

        {/* 7. Progress & Indicators */}
        <SectionHeader
          title="7. Progress & Bilateral Metrics"
          subtitle="Animated fills, semantic status variants"
        />

        <Progress
          label="Cycle Progress (Day 19 / 28)"
          value={progressVal}
          variant="primary"
          showLabel
        />

        <Progress
          label="Lifestyle Goal"
          value={85}
          variant="success"
          showLabel
        />

        <Progress
          label="Attention Level"
          value={45}
          variant="warning"
          showLabel
        />

        <View style={styles.rowWrap}>
          <Button
            label="Decrease -10%"
            size="sm"
            variant="outline"
            onPress={() => setProgressVal((p) => Math.max(0, p - 10))}
            style={styles.mrSm}
          />
          <Button
            label="Increase +10%"
            size="sm"
            variant="secondary"
            onPress={() => setProgressVal((p) => Math.min(100, p + 10))}
          />
        </View>

        <Divider spacing="xl" />

        {/* 8. Avatars & Loading Indicators */}
        <SectionHeader
          title="8. Avatars & Loading Orbs"
          subtitle="Organic shapes, initials fallback, pulsing vitality orbs"
        />

        <View style={styles.rowWrap}>
          <Avatar name="Sarah Jenkins" size="xl" status="online" shape="organic" style={styles.mrSm} />
          <Avatar name="Maya Patel" size="lg" status="primary" shape="circle" style={styles.mrSm} />
          <Avatar name="PM" size="md" status="away" style={styles.mrSm} />
          <Avatar name="AI" size="sm" shape="organic" />
        </View>

        <Typography variant="label" color={theme.textMuted} style={styles.subhead}>
          BRANDED PULSING ORGANIC ORB
        </Typography>

        <View style={styles.centerRow}>
          <LoadingIndicator orb label="Analyzing longitudinal patterns..." />
        </View>

        <Divider spacing="xl" />

        {/* 9. Empty & Error States */}
        <SectionHeader
          title="9. State Components"
          subtitle="Empathetic, clear non-diagnostic messaging"
        />

        <Card variant="standard">
          <EmptyState
            title="No Cycle Data Logged"
            description="Start logging daily observations to build your longitudinal health trend chart."
            actionLabel="Log Today's Entry"
            onAction={() => alert('Log action triggered')}
          />
        </Card>

        <View style={styles.mtMd}>
          <ErrorState
            compact
            title="Sync Postponed"
            description="Offline mode active. Your health logs will sync once connected."
            retryLabel="Retry Sync"
            onRetry={() => alert('Retry triggered')}
          />
        </View>

        <Divider spacing="xl" />

        {/* Footer Note */}
        <View style={styles.footer}>
          <Typography variant="caption" color={theme.textMuted} align="center">
            OVASense Mobile Design System v1.0.0 • Academic FYP
          </Typography>
          <Typography variant="caption" color={theme.textMuted} align="center" style={styles.mtXs}>
            Educational Health-Information Platform • Non-Diagnostic
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ColorSwatchProps {
  label: string;
  hex: string;
  subtext: string;
  textColor: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  label,
  hex,
  subtext,
  textColor,
}) => (
  <View style={[styles.swatchContainer, { backgroundColor: hex }]}>
    <Text style={[styles.swatchLabel, { color: textColor }]}>{label}</Text>
    <Text style={[styles.swatchHex, { color: textColor }]}>{hex}</Text>
    <Text style={[styles.swatchSubtext, { color: textColor }]}>{subtext}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  swatchContainer: {
    flex: 1,
    marginHorizontal: 3,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    minHeight: 74,
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  swatchHex: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.9,
    marginVertical: 1,
  },
  swatchSubtext: {
    fontSize: 9,
    opacity: 0.8,
  },
  ratioCard: {
    marginTop: Spacing.sm,
  },
  ratioBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  ratioSegment: {
    height: '100%',
  },
  ratioLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typoItem: {
    marginTop: Spacing.xs,
  },
  buttonStack: {
    gap: Spacing.sm,
  },
  subhead: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  centerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  mrSm: {
    marginRight: Spacing.xs,
  },
  cardStack: {
    gap: Spacing.md,
  },
  mtXs: {
    marginTop: Spacing.xs,
  },
  mtSm: {
    marginTop: Spacing.sm,
  },
  mtMd: {
    marginTop: Spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  footer: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  launchCard: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D7EAF2',
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.sm,
  },
  launchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  launchCardSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#073B72',
    letterSpacing: 0.5,
  },
  launchCardTitle: {
    color: '#073B72',
    marginBottom: Spacing['2xs'],
  },
  launchCardBody: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
});
