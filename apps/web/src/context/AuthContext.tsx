import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types/onboarding';
import { DEFAULT_USER_PROFILE, createEmptyUserProfile } from '../data/mockDashboardData';
import { clearAllLocalAssessments } from '../services/intelligenceService';

interface AuthContextType {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  userProfile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (payload: LoginPayload) => Promise<{ success: boolean; profile?: UserProfile; error?: string }>;
  loginWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; emailConfirmationRequired?: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveOnboardingProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  resetToDefaultProfile: () => void;
  deleteAccountAndData: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_PROFILE_KEY = 'ovasense_user_profile_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state with local storage fallback
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return createEmptyUserProfile();
  });

  const loadProfile = useCallback(async (activeUser: SupabaseUser): Promise<UserProfile> => {
    const userMeta = activeUser.user_metadata || {};
    const metaFullName =
      userMeta.full_name ||
      userMeta.name ||
      userMeta.user_name ||
      (activeUser.email ? activeUser.email.split('@')[0] : '');
    const metaAvatarUrl = userMeta.avatar_url || userMeta.picture || '';
    const metaGender = (userMeta.gender as any) || undefined;
    const metaPathway = (userMeta.pathway as any) || undefined;

    const { profile } = await profileService.fetchUserProfile(activeUser.id, {
      id: activeUser.id,
      email: activeUser.email || '',
      fullName: metaFullName,
      dateOfBirth: userMeta.date_of_birth,
      gender: metaGender,
      pathway: metaPathway,
    });

    if (profile) {
      // Prioritize explicit metadata and profile pathway, fallback to female
      const resolvedPathway =
        metaPathway ||
        profile.pathway ||
        (metaGender === 'female' ? 'female' : metaGender === 'male' ? 'male' : undefined) ||
        (profile.gender === 'female' ? 'female' : profile.gender === 'male' ? 'male' : undefined) ||
        'female';

      const resolvedGender =
        metaGender ||
        profile.gender ||
        (resolvedPathway === 'female' ? 'female' : resolvedPathway === 'male' ? 'male' : 'female');

      const updatedProfile: UserProfile = {
        ...profile,
        pathway: resolvedPathway,
        gender: resolvedGender,
        waistCm: profile.waistCm ?? (userMeta.waist_cm !== undefined ? userMeta.waist_cm : undefined),
        mensHealth: profile.mensHealth || userMeta.mens_health || undefined,
        generalHealth: profile.generalHealth || userMeta.general_health || undefined,
        avatarUrl: profile.avatarUrl || (metaAvatarUrl ? metaAvatarUrl : undefined),
        fullName: profile.fullName || metaFullName,
      };
      setUserProfile(updatedProfile);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
      } catch {
        // ignore
      }
      return updatedProfile;
    } else {
      // Create empty initial profile for new user
      const initialPathway =
        metaPathway ||
        (metaGender === 'female' ? 'female' : metaGender === 'male' ? 'male' : undefined) ||
        'female';
      const initialGender =
        metaGender ||
        (initialPathway === 'female' ? 'female' : initialPathway === 'male' ? 'male' : 'female');

      const initial = createEmptyUserProfile({
        id: activeUser.id,
        email: activeUser.email || '',
        fullName: metaFullName,
        avatarUrl: metaAvatarUrl || undefined,
        dateOfBirth: userMeta.date_of_birth || '',
        gender: initialGender,
        pathway: initialPathway,
        isOnboarded: false,
      });
      setUserProfile(initial);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(initial));
      } catch {
        // ignore
      }

      if (isSupabaseConfigured()) {
        await profileService.upsertUserProfile(initial, activeUser.id);
      }
      return initial;
    }
  }, []);

  // Initialize and listen to Supabase Auth State
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      // Local demo mode: check localStorage
      setLoading(false);
      return;
    }

    // 1. Initial Session Check
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await loadProfile(initialSession.user);
        }
      })
      .catch((err) => {
        console.error('Error fetching initial session:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Auth State Subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        // Logged out
        setUserProfile(createEmptyUserProfile());
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (
    payload: LoginPayload
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    const res = await authService.login(payload);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    if (res.session?.user) {
      setUser(res.session.user);
      setSession(res.session);
      const loaded = await loadProfile(res.session.user);
      return { success: true, profile: loaded };
    } else if (res.user && !isSupabaseConfigured()) {
      // Mock login handling
      const demoProfile: UserProfile = {
        ...userProfile,
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName || userProfile.fullName,
      };
      setUserProfile(demoProfile);
      return { success: true, profile: demoProfile };
    }

    return { success: true, profile: userProfile };
  };

  const loginWithGoogle = async (
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.loginWithGoogle(redirectTo);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    if (!isSupabaseConfigured()) {
      // Mock login handling for demo mode
      const demoProfile: UserProfile = {
        ...userProfile,
        id: 'demo-google-user-001',
        email: 'google.user@example.com',
        fullName: 'Google User',
        isOnboarded: true,
      };
      setUserProfile(demoProfile);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(demoProfile));
      } catch {
        // ignore
      }
    }

    return { success: true };
  };

  const register = async (
    payload: RegisterPayload
  ): Promise<{ success: boolean; emailConfirmationRequired?: boolean; error?: string }> => {
    const res = await authService.register(payload);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    if (res.session?.user) {
      setUser(res.session.user);
      setSession(res.session);
      const newProfile = createEmptyUserProfile({
        id: res.session.user.id,
        email: payload.email,
        fullName: payload.fullName,
        dateOfBirth: '',
        gender: payload.gender,
        pathway: payload.pathway,
        isOnboarded: false,
      });
      setUserProfile(newProfile);
      await profileService.upsertUserProfile(newProfile, res.session.user.id);
      return { success: true, emailConfirmationRequired: false };
    } else if (res.user) {
      if (!isSupabaseConfigured()) {
        const newProfile = createEmptyUserProfile({
          id: res.user.id,
          email: payload.email,
          fullName: payload.fullName,
          dateOfBirth: '',
          gender: payload.gender,
          pathway: payload.pathway,
          isOnboarded: false,
        });
        setUserProfile(newProfile);
        return { success: true, emailConfirmationRequired: false };
      }
      return { success: true, emailConfirmationRequired: true };
    }

    return { success: true };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
    setUserProfile(createEmptyUserProfile());
    clearAllLocalAssessments();
    try {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem('ovasense_user_reminders_v1');
    } catch {}
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const saveOnboardingProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    const updated: UserProfile = {
      ...userProfile,
      ...data,
      medical: { ...userProfile.medical, ...(data.medical || {}) },
      womensHealth: { ...userProfile.womensHealth, ...(data.womensHealth || {}) },
      lifestyle: { ...userProfile.lifestyle, ...(data.lifestyle || {}) },
      goals: { ...userProfile.goals, ...(data.goals || {}) },
      emergencyContacts: data.emergencyContacts || userProfile.emergencyContacts,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    const targetUserId = user?.id || userProfile.id;
    if (!targetUserId) {
      return { success: false, error: 'User ID is required to save profile.' };
    }
    const res = await profileService.upsertUserProfile(updated, targetUserId);

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to save profile to database.' };
    }

    setUserProfile(updated);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return { success: true };
  };

  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Optimistically update local state immediately so UI and route guards react instantly
    const optimistic: UserProfile = {
      ...userProfile,
      ...data,
      avatarUrl: 'avatarUrl' in data ? (data.avatarUrl || undefined) : userProfile.avatarUrl,
      gender: data.gender || userProfile.gender || 'female',
      pathway: data.pathway || userProfile.pathway || 'female',
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(optimistic);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(optimistic));
    } catch {
      // ignore
    }

    const targetUserId = user?.id || userProfile.id;
    if (!targetUserId) {
      return { success: false, error: 'User ID is required to update profile.' };
    }
    const res = await profileService.updateProfileFields(targetUserId, optimistic, data);

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to update profile.' };
    }

    if (res.profile) {
      const confirmed: UserProfile = {
        ...res.profile,
        avatarUrl: 'avatarUrl' in data ? (data.avatarUrl || undefined) : res.profile.avatarUrl,
        gender: data.gender || res.profile.gender || optimistic.gender,
        pathway: data.pathway || res.profile.pathway || optimistic.pathway,
      };
      setUserProfile(confirmed);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(confirmed));
      } catch {
        // ignore
      }
    }

    return { success: true };
  };

  const resetToDefaultProfile = () => {
    setUserProfile(DEFAULT_USER_PROFILE);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_USER_PROFILE));
    } catch {
      // ignore
    }
  };

  const deleteAccountAndData = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const activeUserId = user?.id || userProfile.id;

      if (isSupabaseConfigured() && activeUserId) {
        try {
          await profileService.deleteUserProfile(activeUserId);
        } catch (e) {
          console.warn('Could not delete remote Supabase profile:', e);
        }
      }

      try {
        const allKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) allKeys.push(key);
        }
        allKeys.forEach((key) => {
          if (
            key.startsWith('symptoms_') ||
            key.startsWith('reports_') ||
            key.startsWith('meds_') ||
            key.startsWith('med_logs_') ||
            key.startsWith('fitness_') ||
            key.startsWith('cycles_') ||
            key.startsWith('diet_') ||
            key.startsWith('care_circle_') ||
            key.startsWith('appointments_') ||
            key.startsWith('ovasense_') ||
            key.startsWith('vitasense_') ||
            key.startsWith('androsense_') ||
            key.startsWith('adaptive_') ||
            key.startsWith('sb-') ||
            key.includes('profile') ||
            key.includes('reminders')
          ) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Could not clean localStorage:', e);
      }

      try {
        sessionStorage.clear();
      } catch {}

      try {
        await authService.logout();
      } catch {}

      setUser(null);
      setSession(null);
      setUserProfile(DEFAULT_USER_PROFILE);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete account and data.' };
    }
  };

  const isAuthenticated = isSupabaseConfigured() ? Boolean(user) : Boolean(userProfile.id);
  const isOnboarded = userProfile.isOnboarded;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        isAuthenticated,
        isOnboarded,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
        saveOnboardingProfile,
        updateUserProfile,
        resetToDefaultProfile,
        deleteAccountAndData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
