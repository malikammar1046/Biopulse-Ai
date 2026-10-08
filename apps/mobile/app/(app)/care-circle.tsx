import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { BioPulseBackground } from '../../components/common/BioPulseBackground';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store';

interface CirclePerson {
  id: string;
  name: string;
  category: 'Doctors' | 'Family' | 'Others';
  roleTag: string;
  roleTagBg: string;
  roleTagColor: string;
  subtitle: string;
  accessDesc: string;
}

/**
 * SCREEN 41: CARE CIRCLE
 */
export default function CareCircleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';

  const {
    careCircle,
    isLoadingCareCircle,
    careCircleError,
    loadCareCircle,
    removeFromCareCircle,
    addToCareCircle,
  } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'All' | 'Doctors' | 'Family' | 'Others'>('All');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');

  useEffect(() => {
    loadCareCircle?.();
  }, [loadCareCircle]);
  const [inviteRole, setInviteRole] = useState('Family');

  const members: CirclePerson[] = useMemo(() => {
    return careCircle.map((cc) => ({
      id: cc.id,
      name: cc.name,
      category: cc.role === 'Doctor' ? 'Doctors' : cc.role === 'Family Member' ? 'Family' : 'Others',
      roleTag: cc.role,
      roleTagBg: cc.role === 'Doctor' ? '#E0F2FE' : '#F1F5F9',
      roleTagColor: cc.role === 'Doctor' ? '#0284C7' : '#475569',
      subtitle: cc.relationship || (cc.role === 'Doctor' ? 'Healthcare Provider' : 'Contact'),
      accessDesc: cc.accessLevel || 'Screening summaries & reports',
    }));
  }, [careCircle]);

  const filteredMembers = useMemo(() => {
    if (activeTab === 'All') return members;
    return members.filter((m) => m.category === activeTab);
  }, [members, activeTab]);

  const handleManage = (person: CirclePerson) => {
    Alert.alert(
      `Manage ${person.name}`,
      `Current Access: ${person.accessDesc}`,
      [
        {
          text: 'Remove from Care Circle',
          style: 'destructive',
          onPress: () => {
            removeFromCareCircle(person.id);
            Alert.alert('Removed', `${person.name} has been removed from your Care Circle.`);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleInviteSubmit = () => {
    if (!inviteName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name or email address.');
      return;
    }
    const roleTyped: 'Doctor' | 'Family Member' | 'Trusted Contact' =
      inviteRole === 'Doctor' ? 'Doctor' : inviteRole === 'Family' ? 'Family Member' : 'Trusted Contact';
    
    addToCareCircle({
      name: inviteName.trim(),
      role: roleTyped,
      relationship: roleTyped,
      accessLevel: 'Full Access',
      verified: false,
    });

    setInviteName('');
    setShowInviteModal(false);
    Alert.alert('Invitation Generated', `An invitation for ${inviteName.trim()} has been added to your Care Circle.`);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <BioPulseBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>

          <View style={styles.titleWithInfo}>
            <Text style={styles.headerTitle}>Care Circle</Text>
            <Ionicons name="information-circle-outline" size={18} color="#64748B" style={{ marginLeft: 4 }} />
          </View>
        </View>

        <Pressable
          onPress={() => setShowInviteModal(true)}
          style={({ pressed }) => [styles.inviteBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="add" size={16} color="#E11D48" style={{ marginRight: 2 }} />
          <Text style={styles.inviteText}>Invite someone</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCareCircle}
            onRefresh={() => loadCareCircle?.()}
            tintColor={isFemale ? '#F43F7D' : '#0284C7'}
          />
        }
      >
        {/* Error Banner with Retry */}
        {Boolean(careCircleError) && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FCA5A5',
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            gap: 8,
          }}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={{ flex: 1, fontSize: 13, color: '#B91C1C' }}>{careCircleError}</Text>
            <Pressable
              onPress={() => loadCareCircle?.()}
              style={{ backgroundColor: '#EF4444', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Initial Loading Indicator */}
        {isLoadingCareCircle && careCircle.length === 0 && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={isFemale ? '#F43F7D' : '#0284C7'} />
            <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>Loading Care Circle...</Text>
          </View>
        )}

        {/* Subtitle */}
        <Text style={styles.subText}>
          Add trusted people to support your health journey.{'\n'}You can control what they can see.
        </Text>

        {/* Category Filter Pills */}
        <View style={styles.pillsRow}>
          {(['All', 'Doctors', 'Family', 'Others'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? members.length
                : members.filter((m) => m.category === tab).length;
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.catPill, isSelected && styles.catPillActive]}
              >
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {tab} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Members List */}
        <View style={styles.membersList}>
          {filteredMembers.length === 0 ? (
            <View style={{ padding: 28, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginVertical: 12 }}>
              <Ionicons name="people-outline" size={42} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>No Members Connected</Text>
              <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
                Invite a trusted healthcare provider or family member to securely view permitted health summaries.
              </Text>
              <Pressable
                onPress={() => setShowInviteModal(true)}
                style={({ pressed }) => [styles.inviteBtn, pressed && styles.btnPressed, { alignSelf: 'center' }]}
              >
                <Ionicons name="add" size={16} color="#E11D48" style={{ marginRight: 4 }} />
                <Text style={styles.inviteText}>Invite someone</Text>
              </Pressable>
            </View>
          ) : (
            filteredMembers.map((person) => (
            <View key={person.id} style={styles.personCard}>
              {/* Left Indicator */}
              <View style={styles.indicatorBox}>
                <Ionicons name="person-outline" size={14} color="#E11D48" />
              </View>

              {/* Avatar */}
              <View style={styles.avatarBox}>
                <Ionicons name="person" size={24} color="#073B72" />
              </View>

              {/* Details */}
              <View style={styles.personMeta}>
                <View style={styles.nameTagRow}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={[styles.roleTag, { backgroundColor: person.roleTagBg }]}>
                    <Text style={[styles.roleText, { color: person.roleTagColor }]}>
                      {person.roleTag}
                    </Text>
                  </View>
                </View>

                <Text style={styles.personSub}>{person.subtitle}</Text>
                <Text style={styles.accessText}>Access: {person.accessDesc}</Text>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleManage(person)}
                  style={({ pressed }) => [styles.manageBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.manageText}>Manage</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleManage(person)}
                  style={styles.moreBtn}
                  hitSlop={8}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
                </Pressable>
              </View>
            </View>
          )))}
        </View>

        {/* Bottom Privacy Guarantee Box */}
        <View style={styles.privacyBox}>
          <Ionicons name="shield-checkmark" size={20} color="#0284C7" style={{ marginRight: 10 }} />
          <Text style={styles.privacyText}>
            Your data stays private. You control what each person can see and can remove access at any time.
          </Text>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowInviteModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite to Care Circle</Text>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Full Name or Email</Text>
            <TextInput
              style={styles.input}
              value={inviteName}
              onChangeText={setInviteName}
              placeholder="e.g. Dr. Ahmed or Mom"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <View style={styles.modalRoleRow}>
              {(['Doctor', 'Family', 'Trusted Contact'] as const).map((r) => {
                const isSelected = inviteRole === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setInviteRole(r)}
                    style={[styles.modalRolePill, isSelected && styles.modalRolePillActive]}
                  >
                    <Text
                      style={[styles.modalRoleText, isSelected && styles.modalRoleTextActive]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleInviteSubmit}
              style={({ pressed }) => [styles.modalSendBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.modalSendText}>Send Invitation</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  titleWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  inviteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
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
  subText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  catPillActive: {
    backgroundColor: '#E11D48',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Members
  membersList: {
    gap: 12,
    marginBottom: 20,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  indicatorBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personMeta: {
    flex: 1,
  },
  nameTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  personSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  accessText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manageBtn: {
    borderWidth: 1,
    borderColor: '#E11D48',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  manageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  moreBtn: {
    padding: 2,
  },

  // Privacy Box
  privacyBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: '#0F172A',
    lineHeight: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalRoleRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  modalRolePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalRolePillActive: {
    backgroundColor: '#E11D48',
  },
  modalRoleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  modalRoleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalSendBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  modalSendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  btnPressed: {
    opacity: 0.85,
  },
});
