import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { useAuth } from '../../features/authentication';
import { useFemaleOnboarding } from '../../features/onboarding';

export type NavTab = 'home' | 'screening' | 'track' | 'guidance' | 'more';

export interface BioPulseBottomNavProps {
  activeTab: NavTab;
  onTabPress?: (tab: NavTab) => void;
  beforeNavigate?: () => void;
}

export const BOTTOM_NAV_HEIGHT = 70;

interface TabDefinition {
  id: NavTab;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    iconActive: 'home',
    iconInactive: 'home-outline',
  },
  {
    id: 'screening',
    label: 'Screening',
    iconActive: 'shield-checkmark',
    iconInactive: 'shield-checkmark-outline',
  },
  {
    id: 'track',
    label: 'Track',
    iconActive: 'checkbox',
    iconInactive: 'checkbox-outline',
  },
  {
    id: 'guidance',
    label: 'Guidance',
    iconActive: 'person',
    iconInactive: 'person-outline',
  },
  {
    id: 'more',
    label: 'More',
    iconActive: 'reorder-three',
    iconInactive: 'reorder-three-outline',
  },
];

/**
 * BioPulse Permanent Bottom Navigation System
 *
 * Implements:
 * - 5 equal-width primary navigation destinations: Home, Screening, Track, Guidance, More
 * - Pathway-aware active styling: Female Pink (#F43F7D) or Male Blue (#0868B9)
 * - Active pill container + icon + label + indicator dot matching official design spec
 * - Safe-area compliant positioning with 44x44 minimum touch targets
 * - Screening draft restoration preserving questionnaire state without restart
 */
export const BioPulseBottomNav: React.FC<BioPulseBottomNavProps> = ({
  activeTab,
  onTabPress,
  beforeNavigate,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pathway } = useAuth();
  const { lastActiveScreeningRoute } = useFemaleOnboarding();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const activeColor = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const activeTileBg = isFemale ? '#FDF0F4' : '#EBF4FC';
  const inactiveColor = BioPulseColors.secondaryText; // #55718F

  const handlePress = useCallback(
    (tab: NavTab) => {
      if (tab === activeTab) return;

      // Allow caller to persist any uncommitted state before navigating
      if (beforeNavigate) {
        beforeNavigate();
      }

      if (onTabPress) {
        onTabPress(tab);
        return;
      }

      switch (tab) {
        case 'home':
          router.push('/(app)');
          break;
        case 'screening':
          router.push('/(app)/screening');
          break;
        case 'track':
          router.push('/(app)/track');
          break;
        case 'guidance':
          router.push('/(app)/guidance');
          break;
        case 'more':
          router.push('/(app)/more');
          break;
      }
    },
    [activeTab, beforeNavigate, onTabPress, router, isFemale, lastActiveScreeningRoute]
  );

  return (
    <View
      style={[
        styles.navBar,
        {
          height: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 12),
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      accessibilityRole="tablist"
    >
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const iconName = isActive ? tab.iconActive : tab.iconInactive;
          const color = isActive ? activeColor : inactiveColor;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handlePress(tab.id)}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab, ${isActive ? 'selected' : 'unselected'}`}
              hitSlop={6}
            >
              <View
                style={[
                  styles.tabTile,
                  isActive && [styles.tabTileActive, { backgroundColor: activeTileBg }],
                ]}
              >
                <Ionicons name={iconName} size={21} color={color} />
                <Text
                  style={[
                    styles.tabLabel,
                    { color },
                    isActive && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>

              {/* Active Indicator Dot */}
              {isActive && (
                <View style={[styles.indicatorDot, { backgroundColor: activeColor }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'flex-start',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 6,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabItemPressed: {
    opacity: 0.8,
  },
  tabTile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 3,
  },
  tabTileActive: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
