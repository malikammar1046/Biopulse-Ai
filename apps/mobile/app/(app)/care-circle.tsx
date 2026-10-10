import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Share,
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
import { CareCircleService, CareCircleRole, CareCircleAccessLevel } from '../../services/careCircleService';

interface CirclePerson {
  id: string;
  name: string;
  email?: string;
  category: 'Doctors' | 'Family' | 'Others';
  roleTag: string;
  roleTagBg: string;
  roleTagColor: string;
  subtitle: string;
  accessDesc: string;
  status: 'pending' | 'active' | 'revoked';
  verified?: boolean;
}

/**
 * SCREEN 41: CARE CIRCLE
 *
 * Fully integrated with Supabase care_circle_members, care_circle_invitations,
 * and care_circle_permissions.
 * Real invitation token/link generation, access control, and revocation.
 */
export default function CareCircleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, pathway } = useAuth();
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CareCircleRole>('Family Member');
  const [inviteAccessLevel, setInviteAccessLevel] = useState<CareCircleAccessLevel>('Full Access');
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Success link modal
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [generatedInviteeName, setGeneratedInviteeName] = useState<string>('');

  useEffect(() => {
    loadCareCircle?.();
  }, [loadCareCircle]);

  const members: CirclePerson[] = useMemo(() => {
    return careCircle.map((cc) => {
      const isDoc = cc.role === 'Doctor';
      const isFam = cc.role === 'Family Member';
      return {
        id: cc.id,
        name: cc.name,
        email: cc.email,
        category: isDoc ? 'Doctors' : isFam ? 'Family' : 'Others',
        roleTag: cc.role,
        roleTagBg: isDoc ? '#E0F2FE' : '#F1F5F9',
        roleTagColor: isDoc ? '#0284C7' : '#475569',
        subtitle: cc.relationship || (isDoc ? 'Healthcare Provider' : 'Care Partner'),
        accessDesc: cc.accessLevel || 'Screening summaries & reports',
        status: cc.status || (cc.verified ? 'active' : 'pending'),
        verified: cc.verified,
      };
    });
  }, [careCircle]);

  const filteredMembers = useMemo(() => {
    if (activeTab === 'All') return members;
    return members.filter((m) => m.category === activeTab);
  }, [members, activeTab]);

  const handleManage = (person: CirclePerson) => {
    Alert.alert(
      `Manage ${person.name}`,
      `Role: ${person.roleTag}\nStatus: ${person.status === 'active' ? 'Active Member' : 'Pending Invitation'}\nAccess: ${person.accessDesc}`,
      [
        {
          text: 'Remove from Care Circle',
          style: 'destructive',
          onPress: async () => {
            await removeFromCareCircle(person.id);
            Alert.alert('Access Revoked', `${person.name} has been removed from your Care Circle.`);
            loadCareCircle?.();
          },
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleInviteSubmit = async () => {
    if (!inviteName.trim()) {
      Alert.alert('Missing Name', 'Please enter the recipient’s full name.');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!hasConsented) {
      Alert.alert('Consent Required', 'Please confirm that you authorize sharing access to your health data.');
      return;
    }

    if (!user?.id || !user?.accessToken) {
      Alert.alert('Authentication Required', 'Please sign in to invite members to your Care Circle.');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const res = await CareCircleService.inviteMember(user.id, user.accessToken, {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        relationship: inviteRole,
        accessLevel: inviteAccessLevel,
      });

      setIsSubmittingInvite(false);

      if (res.error || !res.data) {
        Alert.alert('Invitation Failed', res.error || 'Could not generate invitation.');
        return;
      }

      const inviteToken = res.data.inviteToken;
      const secureUrl = `https://biopulse.ai/care-provider/${inviteToken}`;

      await addToCareCircle({
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        relationship: inviteRole,
        accessLevel: inviteAccessLevel,
        verified: false,
      });

      setGeneratedInviteLink(secureUrl);
      setGeneratedInviteeName(inviteName.trim());
      setShowInviteModal(false);

      // Reset form
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Family Member');
      setInviteAccessLevel('Full Access');

      // Reload list
      loadCareCircle?.();
    } catch (err: any) {
      setIsSubmittingInvite(false);
      Alert.alert('Error', err?.message || 'Failed to send invitation.');
    }
  };

  const handleShareLink = async () => {
    if (!generatedInviteLink) return;
    try {
      await Share.share({
        title: 'BioPulse AI Care Circle Invitation',
        message: `You've been invited by ${user?.fullName || 'a patient'} to join their BioPulse Care Circle. Accept access here: ${generatedInviteLink}`,
      });
    } catch {
      // ignore
    }
  };

  const themeColor = isFemale ? '#E11D48' : '#0284C7';

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
            <Ionicons name="shield-checkmark" size={18} color="#10B981" style={{ marginLeft: 6 }} />
          </View>
        </View>

        <Pressable
          onPress={() => setShowInviteModal(true)}
          style={({ pressed }) => [
            styles.inviteBtn,
            { borderColor: themeColor },
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons name="person-add" size={15} color={themeColor} style={{ marginRight: 4 }} />
          <Text style={[styles.inviteText, { color: themeColor }]}>Invite someone</Text>
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
            tintColor={themeColor}
          />
        }
      >
        <Text style={styles.subText}>
          Add trusted people to support your health journey. Securely share authorized health metrics, screening summaries, and logs with your trusted doctors and family. You retain full ownership and can revoke access anytime.
        </Text>

        {/* Error Banner with Retry */}
        {Boolean(careCircleError) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{careCircleError}</Text>
            <Pressable onPress={() => loadCareCircle?.()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Category Filter Pills */}
        <View style={styles.pillsRow}>
          {(['All', 'Doctors', 'Family', 'Others'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.catPill,
                  isSelected && { backgroundColor: themeColor },
                ]}
              >
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Loading Indicator */}
        {isLoadingCareCircle && careCircle.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={themeColor} />
            <Text style={styles.loadingText}>Loading Care Circle members...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoadingCareCircle && filteredMembers.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>
              {careCircle.length === 0 ? 'No Members Connected' : 'No Members in this Category'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Invite your doctor or a family member to securely share medical summaries and track your health together.
            </Text>
            <Pressable
              onPress={() => setShowInviteModal(true)}
              style={[styles.emptyInviteBtn, { backgroundColor: themeColor }]}
            >
              <Text style={styles.emptyInviteBtnText}>Invite someone</Text>
            </Pressable>
          </View>
        )}

        {/* Members List */}
        {!isLoadingCareCircle && filteredMembers.length > 0 && (
          <View style={styles.membersList}>
            {filteredMembers.map((person) => {
              const isPending = person.status === 'pending';
              return (
                <View key={person.id} style={styles.personCard}>
                  <View style={styles.avatarBox}>
                    <Ionicons
                      name={person.category === 'Doctors' ? 'medkit' : 'person'}
                      size={20}
                      color={person.category === 'Doctors' ? '#0284C7' : '#64748B'}
                    />
                  </View>

                  <View style={styles.personMeta}>
                    <View style={styles.nameTagRow}>
                      <Text style={styles.personName}>{person.name}</Text>
                      <View style={[styles.roleTag, { backgroundColor: person.roleTagBg }]}>
                        <Text style={[styles.roleTagText, { color: person.roleTagColor }]}>
                          {person.roleTag}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.personSubtitle}>{person.subtitle}</Text>
                    <Text style={styles.personAccess}>{person.accessDesc}</Text>

                    {/* Status Badge */}
                    <View style={styles.statusBadgeRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isPending ? '#F59E0B' : '#10B981' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isPending ? '#B45309' : '#047857' },
                        ]}
                      >
                        {isPending ? 'Pending Invitation' : 'Active Member'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleManage(person)}
                    style={styles.manageBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.manageBtnText}>Manage</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Privacy Guarantee Box */}
        <View style={styles.privacyBox}>
          <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
          <Text style={styles.privacyText}>
            Your data stays private. You control what each person can see and can remove access at any time.
          </Text>
        </View>
      </ScrollView>

      {/* Invite Member Modal */}
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

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={inviteName}
              onChangeText={setInviteName}
              placeholder="e.g. Dr. Sara Khan or Mom"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="e.g. doctor@clinic.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Relationship / Role</Text>
            <View style={styles.modalRoleRow}>
              {(['Doctor', 'Family Member', 'Trusted Contact'] as const).map((r) => {
                const isSelected = inviteRole === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setInviteRole(r)}
                    style={[
                      styles.modalRolePill,
                      isSelected && { backgroundColor: themeColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalRoleText,
                        isSelected && styles.modalRoleTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Access Permission Level</Text>
            <View style={styles.modalRoleRow}>
              {(['Full Access', 'View Only', 'Clinical Summary Only'] as const).map((lvl) => {
                const isSelected = inviteAccessLevel === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => setInviteAccessLevel(lvl)}
                    style={[
                      styles.modalRolePill,
                      isSelected && { backgroundColor: themeColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalRoleText,
                        isSelected && styles.modalRoleTextActive,
                      ]}
                    >
                      {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Explicit Patient Consent */}
            <Pressable
              onPress={() => setHasConsented(!hasConsented)}
              style={styles.consentRow}
            >
              <Ionicons
                name={hasConsented ? 'checkbox' : 'square-outline'}
                size={20}
                color={hasConsented ? themeColor : '#94A3B8'}
              />
              <Text style={styles.consentText}>
                I explicitly authorize this individual to view my health data within the chosen access level. I can revoke access at any time.
              </Text>
            </Pressable>

            <Pressable
              onPress={handleInviteSubmit}
              disabled={isSubmittingInvite}
              style={({ pressed }) => [
                styles.modalSendBtn,
                { backgroundColor: themeColor },
                pressed && styles.btnPressed,
                isSubmittingInvite && { opacity: 0.7 },
              ]}
            >
              {isSubmittingInvite ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSendText}>Generate Secure Invitation</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Generated Invitation Link Modal */}
      <Modal
        visible={Boolean(generatedInviteLink)}
        transparent
        animationType="fade"
        onRequestClose={() => setGeneratedInviteLink(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setGeneratedInviteLink(null)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitation Created</Text>
              <Pressable onPress={() => setGeneratedInviteLink(null)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.inviteSuccessHeader}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              <Text style={styles.inviteSuccessTitle}>
                Invitation for {generatedInviteeName}
              </Text>
              <Text style={styles.inviteSuccessSub}>
                Share this secure invitation link. The link expires in 7 days and can be accepted after authenticating.
              </Text>
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={2}>
                {generatedInviteLink}
              </Text>
            </View>

            <Pressable
              onPress={handleShareLink}
              style={[styles.modalSendBtn, { backgroundColor: themeColor }]}
            >
              <Ionicons name="share-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.modalSendText}>Share Invitation Link</Text>
            </Pressable>

            <Pressable
              onPress={() => setGeneratedInviteLink(null)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Done</Text>
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  inviteText: {
    fontSize: 12,
    fontWeight: '700',
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

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

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
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 13,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyInviteBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyInviteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  personSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  personAccess: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  manageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },

  btnPressed: {
    opacity: 0.85,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalRoleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalRolePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalRoleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  modalSendBtn: {
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Link success modal
  inviteSuccessHeader: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  inviteSuccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  inviteSuccessSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  linkContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    textAlign: 'center',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  closeBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
});
