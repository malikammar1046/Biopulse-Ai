import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

/**
 * SCREEN 34: GUIDANCE HOME
 *
 * Strict visual match to Screenshot 34:
 * - Top Header:
 *   - Title: "Guidance"
 *   - Subtitle: "Personalized recommendations and AI support for your health journey."
 *   - Top-right notification bell icon with pink dot
 * - Highlighted Next Best Action Card:
 *   - Amber bulb icon box
 *   - Red/coral category tag: "Next Best Action" & chevron >
 *   - Title: "Add clinical hormone labs"
 *   - Description: "Get a complete hormonal profile to refine your screening result."
 *   - CTA: Solid pink/rose "View Details" button -> /add-labs
 * - 4 Categorized Guidance Cards:
 *   1. Nutrition: Pink fork/knife icon, "Personalized meal plans and dietary guidance." -> /recommendations?category=Nutrition
 *   2. Fitness: Teal runner icon, "Recommended activities for your goals." -> /recommendations?category=Movement
 *   3. Health Education: Purple book icon, "Learn about PCOS, symptoms and lifestyle tips." -> /recommendations?category=Lifestyle
 *   4. AI Companion: Blue chat bubbles icon, "Chat with BioPulse AI for personalized guidance." -> /ai-companion
 * - Permanent Fixed Bottom Navigation with [ Guidance ] active
 */
export default function GuidanceHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const guidanceItems = [
    {
      id: 'nutrition',
      title: 'Nutrition',
      subtitle: 'Personalized meal plans and dietary guidance.',
      icon: 'restaurant' as const,
      iconColor: '#E11D48',
      iconBg: '#FFE4E6',
      route: '/(app)/recommendations?category=Nutrition',
    },
    {
      id: 'fitness',
      title: 'Fitness',
      subtitle: 'Recommended activities for your goals.',
      icon: 'walk' as const,
      iconColor: '#0D9488',
      iconBg: '#CCFBF1',
      route: '/(app)/recommendations?category=Movement',
    },
    {
      id: 'education',
      title: 'Health Education',
      subtitle: isFemale
        ? 'Learn about PCOS, symptoms and lifestyle tips.'
        : 'Learn about testosterone, symptoms and lifestyle tips.',
      icon: 'book' as const,
      iconColor: '#9333EA',
      iconBg: '#F3E8FF',
      route: '/(app)/recommendations?category=Lifestyle',
    },
    {
      id: 'ai-assistant',
      title: 'AI Companion',
      subtitle: 'Chat with BioPulse AI for personalized guidance.',
      icon: 'chatbubble-ellipses' as const,
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
      route: '/(app)/ai-companion',
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Guidance</Text>
          <Text style={styles.headerSub}>
            Personalized recommendations and AI support for your health journey.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/notifications')}
          style={styles.bellBtn}
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={22} color="#E11D48" />
          <View style={styles.bellBadge} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Best Action Card */}
        <View style={styles.nextBestCard}>
          <Pressable
            onPress={() => router.push('/(app)/add-labs')}
            style={styles.nextBestTop}
          >
            <View style={styles.bulbIconBox}>
              <Ionicons name="bulb-outline" size={22} color="#EA580C" />
            </View>

            <View style={styles.nextBestMeta}>
              <Text style={styles.nextBestTag}>Next Best Action</Text>
              <Text style={styles.nextBestTitle}>
                {isFemale ? 'Add clinical hormone labs' : 'Add morning hormone labs'}
              </Text>
              <Text style={styles.nextBestDesc}>
                {isFemale
                  ? 'Get a complete hormonal profile to refine your screening result.'
                  : 'Get a complete hormonal profile to refine your screening result.'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#E11D48" style={{ marginTop: 2 }} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/add-labs')}
            style={({ pressed }) => [styles.viewDetailsBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </Pressable>
        </View>

        {/* 4 Categorized Cards */}
        <View style={styles.guidanceList}>
          {guidanceItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.itemCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>

              <View style={styles.itemMeta}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Permanent Fixed Bottom Nav with Guidance Active */}
      <BioPulseBottomNav activeTab="guidance" />
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
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

  // Next Best Action Card
  nextBestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nextBestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bulbIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextBestMeta: {
    flex: 1,
  },
  nextBestTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  nextBestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  nextBestDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 3,
  },
  viewDetailsBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Guidance List
  guidanceList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemMeta: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },

  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  btnPressed: {
    opacity: 0.88,
  },
});
