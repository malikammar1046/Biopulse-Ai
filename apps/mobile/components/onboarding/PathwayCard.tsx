import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';

export interface PathwayFeatureItem {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export interface PathwayCardProps {
  type: 'female' | 'male';
  title: string;
  subtitle: string;
  illustrationSource: ImageSourcePropType;
  features: PathwayFeatureItem[];
  footerText: string;
  isSelected: boolean;
  onSelect: () => void;
  isTwoColumn?: boolean;
}

/**
 * BioPulse Health Pathway Selection Card
 *
 * Implements:
 * - Female (Pink / PCOS) vs Male (Blue / Hypogonadism) visual identity
 * - Pristine character illustration header with selection status indicator
 * - 3 structured clinical feature bullet rows with custom badges
 * - Protective guidance footer banner
 * - Fully accessible radio selection with tap-anywhere activation
 */
export const PathwayCard: React.FC<PathwayCardProps> = ({
  type,
  title,
  subtitle,
  illustrationSource,
  features,
  footerText,
  isSelected,
  onSelect,
  isTwoColumn = true,
}) => {
  const isFemale = type === 'female';
  const primaryColor = isFemale ? BioPulseColors.femaleAccent : '#0284C7';
  const iconBg = isFemale ? '#FFF1F2' : '#E0F2FE';
  const footerBg = isFemale ? '#FFF0F5' : '#E0F2FE';
  const footerBorder = isFemale ? '#FBCFE8' : '#BAE6FD';
  const footerTextColor = isFemale ? '#BE123C' : '#0369A1';
  const checkCircleBorder = isFemale ? '#FBCFE8' : '#BAE6FD';

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.cardContainer,
        isTwoColumn ? styles.twoColumnCard : styles.singleColumnCard,
        isSelected
          ? isFemale
            ? styles.selectedFemaleCard
            : styles.selectedMaleCard
          : styles.unselectedCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${title}, ${subtitle}. ${isSelected ? 'Selected' : 'Not selected'}`}
    >
      {/* Illustration Header with Badge */}
      <View style={styles.imageWrapper}>
        <Image
          source={illustrationSource}
          style={styles.illustration}
          resizeMode="cover"
        />

        {/* Top-Right Selection Indicator */}
        <View
          style={[
            styles.checkIndicator,
            isSelected
              ? { backgroundColor: primaryColor, borderColor: primaryColor }
              : { borderColor: checkCircleBorder, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Card Content Body */}
      <View style={styles.cardBody}>
        {/* Title & Subtitle */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: primaryColor }]} numberOfLines={1}>
          {subtitle}
        </Text>

        {/* Feature Bullets */}
        <View style={styles.featuresList}>
          {features.map((feature, idx) => (
            <View key={`feat-${idx}`} style={styles.featureRow}>
              <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={feature.icon} size={13} color={primaryColor} />
              </View>
              <Text style={styles.featureText} numberOfLines={2}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer Pill */}
        <View
          style={[
            styles.footerPill,
            { backgroundColor: footerBg, borderColor: footerBorder },
          ]}
        >
          <Text style={[styles.footerText, { color: footerTextColor }]}>
            {footerText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  twoColumnCard: {
    flex: 1,
    minWidth: 155,
  },
  singleColumnCard: {
    width: '100%',
    marginBottom: 14,
  },
  unselectedCard: {
    borderColor: '#E2E8F0',
  },
  selectedFemaleCard: {
    borderColor: BioPulseColors.femaleAccent,
    borderWidth: 2,
    shadowColor: BioPulseColors.femaleAccent,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedMaleCard: {
    borderColor: '#0284C7',
    borderWidth: 2,
    shadowColor: '#0284C7',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  imageWrapper: {
    width: '100%',
    height: 138,
    position: 'relative',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  checkIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  cardBody: {
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: BioPulseColors.navy,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  featuresList: {
    gap: 7,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: '#334155',
  },
  footerPill: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
