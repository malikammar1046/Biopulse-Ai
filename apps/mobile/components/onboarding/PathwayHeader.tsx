import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

const HEART_EMBLEM = require('../../assets/biopulse_heart_emblem.png');

export interface PathwayHeaderProps {
  onBack: () => void;
  onHelpPress?: () => void;
  isCompact?: boolean;
  subtitle?: string;
  showHelp?: boolean;
}

/**
 * Top Navigation & Brand Header for BioPulse Pathways
 *
 * Implements:
 * - Left: Circular back button with accessible touch target
 * - Center: BioPulse AI logo heart emblem + wordmark + configurable subtitle
 * - Right: "Help (?)" action providing patient guidance (toggleable)
 */
export const PathwayHeader: React.FC<PathwayHeaderProps> = ({
  onBack,
  onHelpPress,
  isCompact = false,
  subtitle = 'REPRODUCTIVE HEALTH INTELLIGENCE',
  showHelp = true,
}) => {
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  const handleHelp = () => {
    if (onHelpPress) {
      onHelpPress();
    } else {
      setHelpModalVisible(true);
    }
  };

  const emblemSize = isCompact ? 28 : 32;
  const brandTitleSize = isCompact ? 16 : 18;
  const brandSubtitleSize = isCompact ? 7 : 7.5;

  return (
    <>
      <View style={styles.container}>
        {/* Left: Back Button */}
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={BioPulseColors.femaleAccent}
          />
        </Pressable>

        {/* Center: Brand Lockup */}
        <View
          style={styles.centerBrandLockup}
          accessible
          accessibilityRole="header"
          accessibilityLabel="BioPulse AI, Reproductive Health Intelligence"
        >
          <Image
            source={HEART_EMBLEM}
            style={{ width: emblemSize, height: emblemSize, marginRight: 7 }}
            resizeMode="contain"
            accessible={false}
          />
          <View style={styles.brandTextColumn}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleNavy, { fontSize: brandTitleSize }]}>
                BioPulse
              </Text>
              <Text style={[styles.titlePink, { fontSize: brandTitleSize }]}>
                {' '}AI
              </Text>
            </View>
            <Text style={[styles.subtitle, { fontSize: brandSubtitleSize }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Help Action or Placeholder */}
        {showHelp ? (
          <Pressable
            onPress={handleHelp}
            hitSlop={8}
            style={({ pressed }) => [
              styles.helpButton,
              pressed && styles.helpButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Help and guidance"
          >
            {!isNarrow && <Text style={styles.helpText}>Help </Text>}
            <Ionicons
              name="help-circle-outline"
              size={20}
              color="#55718F"
            />
          </Pressable>
        ) : (
          <View style={styles.helpPlaceholder} />
        )}
      </View>

      {/* Clinical Concierge Help Modal */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="help-buoy-outline" size={24} color={BioPulseColors.femaleAccent} />
              </View>
              <Text style={styles.modalTitle}>Pathway Selection Help</Text>
              <Pressable
                onPress={() => setHelpModalVisible(false)}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close help"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                BioPulse AI provides personalized health intelligence tailored to your endocrine and metabolic biology:
              </Text>

              <Text style={styles.modalSectionTitle}>• Female Health Pathway</Text>
              <Text style={styles.modalSectionDesc}>
                Focuses on PCOS screening (Rotterdam criteria), menstrual cycle rhythmicity, hyperandrogenism, and metabolic wellness.
              </Text>

              <Text style={styles.modalSectionTitle}>• Male Health Pathway</Text>
              <Text style={styles.modalSectionDesc}>
                Focuses on late-onset hypogonadism screening (ADAM questionnaire), testosterone vitality, fatigue, and endocrine balance.
              </Text>

              <Text style={styles.modalFooterNote}>
                You can change your selected pathway at any time in Profile & Settings.
              </Text>
            </ScrollView>

            <Pressable
              onPress={() => setHelpModalVisible(false)}
              style={styles.modalPrimaryBtn}
            >
              <Text style={styles.modalPrimaryBtnText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonPressed: {
    backgroundColor: '#FCE7F0',
    transform: [{ scale: 0.96 }],
  },
  centerBrandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleNavy: {
    color: BioPulseColors.navy,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  titlePink: {
    color: BioPulseColors.femaleAccent,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: BioPulseColors.secondaryText,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    height: 40,
    paddingHorizontal: 6,
  },
  helpPlaceholder: {
    width: 40,
    height: 40,
  },
  helpButtonPressed: {
    opacity: 0.7,
  },
  helpText: {
    color: '#55718F',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 59, 114, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BioPulseColors.navy,
    marginTop: 6,
  },
  modalSectionDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 8,
    paddingLeft: 8,
  },
  modalFooterNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8BA1B7',
    marginTop: 10,
  },
  modalPrimaryBtn: {
    backgroundColor: BioPulseColors.femaleAccent,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
