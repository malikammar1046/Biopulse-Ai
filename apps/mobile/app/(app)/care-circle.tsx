import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BioPulseColors } from '../../constants/Colors';
import { AuthBackgroundFoliage } from '../../components/auth/AuthBackgroundFoliage';
import { useAuth } from '../../features/authentication';
import { BioPulseBottomNav, BOTTOM_NAV_HEIGHT } from '../../components/navigation';

export interface CareCircleMember {
  id: string;
  name: string;
  role: 'Physician / Specialist' | 'Family Member' | 'Trusted Contact';
  accessLevel: 'Clinical Summary Only' | 'Full Health Records' | 'Emergency Only';
  email: string;
  addedDate: string;
  verified: boolean;
}

import { useHealthStore } from '../../store';

/**
 * SCREEN 41: Care Circle
 * 
 * Provides:
 * - Controlled sharing of clinical summaries and screening progress
 * - Member cards (Doctor, Family, Trusted Contact) with access permissions
 * - Privacy-first invite flow with explicit consent boundaries
 * - Does NOT resemble social media or chat; strictly clinical delegation
 */
export default function CareCircleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { pathway } = useAuth();
  const { careCircle, addToCareCircle, removeFromCareCircle } = useHealthStore();

  const isFemale = pathway !== 'male_hypogonadism' && pathway !== 'male';
  const themeAccent = isFemale ? BioPulseColors.femaleAccent : BioPulseColors.malePrimary;
  const badgeBg = isFemale ? '#FDF0F4' : '#EBF4FC';

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Doctor' | 'Family Member' | 'Trusted Contact'>('Family Member');
  const [inviteAccess, setInviteAccess] = useState<'Full Access' | 'View Only' | 'Clinical Summary Only'>('Clinical Summary Only');

  const handleRemove = (member: { id: string; name: string }) => {
    Alert.alert(
      'Revoke Access',
      `Revoke health data access for ${member.name}? They will immediately lose access to your records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: () => {
            removeFromCareCircle(member.id);
          },
        },
      ]
    );
  };

  const handleSendInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert('Missing Details', 'Please provide a name and email address.');
      return;
    }
    addToCareCircle({
      name: inviteName.trim(),
      role: inviteRole,
      accessLevel: inviteAccess,
      email: inviteEmail.trim(),
    });
    setInviteModalVisible(false);
    setInviteName('');
    setInviteEmail('');
    Alert.alert(
      'Invitation Dispatched',
      `A secure verification link has been sent to ${inviteEmail.trim()}. They will have ${inviteAccess} permissions once verified.`
    );
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundFoliage />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BioPulseColors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Care Circle</Text>
        <Pressable
          onPress={() => setInviteModalVisible(true)}
          style={[styles.addIconBtn, { backgroundColor: badgeBg }]}
        >
          <Ionicons name="person-add" size={18} color={themeAccent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy & Governance Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="shield-checkmark" size={22} color="#10B981" />
          <View style={styles.noticeTextCol}>
            <Text style={styles.noticeTitle}>Clinical Privacy Guard</Text>
            <Text style={styles.noticeBody}>
              Members only view data granted by your specified access level. You can revoke or change permissions at any time.
            </Text>
          </View>
        </View>

        {/* Member Count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>{careCircle.length} Active Care Members</Text>
          <Pressable onPress={() => setInviteModalVisible(true)}>
            <Text style={[styles.inviteLink, { color: themeAccent }]}>+ Invite Member</Text>
          </Pressable>
        </View>

        {/* Members List */}
        <View style={styles.membersList}>
          {careCircle.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberCardTop}>
                <View
                  style={[
                    styles.roleAvatar,
                    {
                      backgroundColor:
                        member.role === 'Doctor'
                          ? badgeBg
                          : '#F1F5F9',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      member.role === 'Doctor'
                        ? 'medical'
                        : member.role === 'Family Member'
                        ? 'heart'
                        : 'shield'
                    }
                    size={22}
                    color={
                      member.role === 'Doctor'
                        ? themeAccent
                        : '#64748B'
                    }
                  />
                </View>

                <View style={styles.memberInfoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.verified !== false ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.verifiedText}>Active</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Ionicons name="time-outline" size={12} color="#F59E0B" />
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  <Text style={styles.memberEmail}>{member.email || 'Direct Health Link'}</Text>
                </View>
              </View>

              <View style={styles.memberCardDivider} />

              <View style={styles.memberCardBottom}>
                <View style={styles.accessBadgeRow}>
                  <Ionicons name="key-outline" size={14} color="#64748B" />
                  <Text style={styles.accessLabel}>Access: </Text>
                  <Text style={[styles.accessValue, { color: themeAccent }]}>
                    {member.accessLevel}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleRemove(member)}
                  style={styles.revokeBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  <Text style={styles.revokeText}>Manage</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Invite CTA Banner */}
        <Pressable
          onPress={() => setInviteModalVisible(true)}
          style={[styles.bigInviteCard, { borderColor: themeAccent + '40' }]}
        >
          <View style={[styles.bigInviteIcon, { backgroundColor: badgeBg }]}>
            <Ionicons name="person-add-outline" size={24} color={themeAccent} />
          </View>
          <View style={styles.bigInviteTextCol}>
            <Text style={styles.bigInviteTitle}>Invite Healthcare Provider or Contact</Text>
            <Text style={styles.bigInviteSub}>
              Share structured screening assessments directly with your doctor.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Care Circle Member</Text>
              <Pressable
                onPress={() => setInviteModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={inviteName}
                onChangeText={setInviteName}
                placeholder="e.g. Dr. Sarah Jenkins or Ahmed Khan"
                placeholderTextColor="#94A3B8"
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="doctor@hospital.org"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Relationship</Text>
              <View style={styles.pillRow}>
                {(['Doctor', 'Family Member', 'Trusted Contact'] as const).map(
                  (r) => {
                    const isSel = inviteRole === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setInviteRole(r)}
                        style={[
                          styles.pill,
                          isSel && {
                            backgroundColor: badgeBg,
                            borderColor: themeAccent,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            isSel && { color: themeAccent, fontWeight: '700' },
                          ]}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              <Text style={styles.inputLabel}>Permitted Health Access</Text>
              <View style={styles.accessOptionsCol}>
                {[
                  {
                    level: 'Clinical Summary Only' as const,
                    desc: 'Latest screening risk tier, primary factors, and lab summary.',
                  },
                  {
                    level: 'Full Access' as const,
                    desc: 'Screening history, daily logs, medications, and labs.',
                  },
                  {
                    level: 'View Only' as const,
                    desc: 'Read-only access to vital summaries and daily adherence.',
                  },
                ].map((item) => {
                  const isSel = inviteAccess === item.level;
                  return (
                    <Pressable
                      key={item.level}
                      onPress={() => setInviteAccess(item.level)}
                      style={[
                        styles.accessOptionCard,
                        isSel && {
                          borderColor: themeAccent,
                          backgroundColor: badgeBg + '40',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isSel ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSel ? themeAccent : '#94A3B8'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.accessOptionTitle,
                            isSel && { color: themeAccent, fontWeight: '700' },
                          ]}
                        >
                          {item.level}
                        </Text>
                        <Text style={styles.accessOptionDesc}>{item.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={handleSendInvite}
                style={[styles.modalSendBtn, { backgroundColor: themeAccent }]}
              >
                <Ionicons name="mail" size={18} color="#FFFFFF" />
                <Text style={styles.modalSendText}>Send Secure Invite</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <BioPulseBottomNav activeTab="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 17,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  inviteLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  memberCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  roleAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  memberCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  memberCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  accessValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  revokeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EF4444',
  },
  bigInviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
  },
  bigInviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigInviteTextCol: {
    flex: 1,
  },
  bigInviteTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  bigInviteSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BioPulseColors.navy,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: '#1E293B',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  accessOptionsCol: {
    gap: 8,
  },
  accessOptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  accessOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  accessOptionDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  modalSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 10,
  },
  modalSendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
